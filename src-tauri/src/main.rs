#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use std::thread;

use anyhow::Result;
use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

// 全局 PTY 会话存储
lazy_static::lazy_static! {
    static ref PTY_SESSIONS: Mutex<HashMap<String, PtySession>> = Mutex::new(HashMap::new());
}

struct PtySession {
    #[allow(dead_code)]
    pair: PtyPair,
    writer: Box<dyn Write + Send>,
}

#[derive(Clone, Serialize, Deserialize)]
struct TerminalOutput {
    session_id: String,
    data: String,
}

#[derive(Clone, Serialize, Deserialize)]
struct TerminalError {
    session_id: String,
    error: String,
}

#[tauri::command]
async fn create_pty_session(
    app_handle: AppHandle,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to create PTY: {}", e))?;

    // 获取 shell
    let shell: String = if cfg!(target_os = "windows") {
        "cmd.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    };

    let mut cmd = CommandBuilder::new(&shell);
    
    // 设置环境变量
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    
    // 设置工作目录
    if let Ok(home) = std::env::var("HOME") {
        cmd.cwd(home);
    }

    let mut child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    // 获取 reader 和 writer
    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to clone reader: {}", e))?;
    
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to take writer: {}", e))?;

    // 存储会话
    let session = PtySession {
        pair,
        writer,
    };
    
    {
        let mut sessions = PTY_SESSIONS.lock().unwrap();
        sessions.insert(session_id.clone(), session);
    }

    // 启动读取线程
    let session_id_clone = session_id.clone();
    let app_handle_clone = app_handle.clone();
    
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF - 进程已退出
                    let _ = app_handle_clone.emit("terminal-exit", &session_id_clone);
                    break;
                }
                Ok(n) => {
                    let output = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_handle_clone.emit("terminal-output", TerminalOutput {
                        session_id: session_id_clone.clone(),
                        data: output,
                    });
                }
                Err(e) => {
                    let _ = app_handle_clone.emit("terminal-error", TerminalError {
                        session_id: session_id_clone.clone(),
                        error: e.to_string(),
                    });
                    break;
                }
            }
        }
    });

    // 等待子进程
    thread::spawn(move || {
        let _ = child.wait();
    });

    Ok(())
}

#[tauri::command]
async fn write_to_pty(session_id: String, data: String) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| format!("Failed to write to PTY: {}", e))?;
        session.writer.flush().ok();
    } else {
        return Err(format!("Session {} not found", session_id));
    }
    
    Ok(())
}

#[tauri::command]
async fn resize_pty(session_id: String, cols: u16, rows: u16) -> Result<(), String> {
    let sessions = PTY_SESSIONS.lock().unwrap();
    
    if let Some(session) = sessions.get(&session_id) {
        session
            .pair
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize PTY: {}", e))?;
    } else {
        return Err(format!("Session {} not found", session_id));
    }
    
    Ok(())
}

#[tauri::command]
async fn close_pty_session(session_id: String) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    
    if sessions.remove(&session_id).is_some() {
        Ok(())
    } else {
        Err(format!("Session {} not found", session_id))
    }
}

#[tauri::command]
async fn execute_openclaw_command(command: String) -> Result<CommandResponse, String> {
    // 分割命令和参数
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Ok(CommandResponse {
            success: false,
            output: "".to_string(),
            error: Some("No command provided".to_string()),
        });
    }

    let mut cmd = std::process::Command::new("openclaw");
    cmd.arg(parts[0]);

    // 添加剩余参数
    for part in parts.iter().skip(1) {
        cmd.arg(part);
    }

    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);

            if output.status.success() {
                Ok(CommandResponse {
                    success: true,
                    output: stdout.to_string(),
                    error: None,
                })
            } else {
                Ok(CommandResponse {
                    success: false,
                    output: stdout.to_string(),
                    error: Some(stderr.to_string()),
                })
            }
        }
        Err(e) => Ok(CommandResponse {
            success: false,
            output: "".to_string(),
            error: Some(format!("Failed to execute command: {}", e)),
        }),
    }
}

#[tauri::command]
async fn check_openclaw_installed() -> bool {
    match std::process::Command::new("openclaw").arg("--version").output() {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[derive(Serialize, Deserialize)]
struct CommandResponse {
    success: bool,
    output: String,
    error: Option<String>,
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_pty_session,
            write_to_pty,
            resize_pty,
            close_pty_session,
            execute_openclaw_command,
            check_openclaw_installed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}