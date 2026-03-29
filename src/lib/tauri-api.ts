// src/lib/tauri-api.ts

import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@tauri-apps/api/core';

interface CommandResponse {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * 检查是否在 Tauri 环境中运行
 */
export async function isTauriEnvironment(): Promise<boolean> {
  try {
    // @ts-ignore - tauri API may not be available during SSR
    return typeof window !== 'undefined' && !!window.__TAURI__;
  } catch {
    return false;
  }
}

/**
 * 执行 OpenClaw CLI 命令（仅在 Tauri 环境中）
 */
export async function executeOpenClawCommand(command: string): Promise<CommandResponse> {
  if (!(await isTauriEnvironment())) {
    throw new Error('Not running in Tauri environment');
  }

  try {
    // @ts-ignore - tauri invoke may not be typed during SSR
    return await invoke('execute_openclaw_command', { command });
  } catch (error) {
    console.error('Tauri command failed:', error);
    throw error;
  }
}

/**
 * 检查 OpenClaw 是否已安装（仅在 Tauri 环境中）
 */
export async function checkOpenClawInstalled(): Promise<boolean> {
  if (!(await isTauriEnvironment())) {
    return false;
  }

  try {
    // @ts-ignore - tauri invoke may not be typed during SSR
    return await invoke('check_openclaw_installed');
  } catch (error) {
    console.error('Failed to check OpenClaw installation:', error);
    return false;
  }
}

/**
 * 通用命令执行器：优先使用 Tauri，回退到 WebSocket
 */
export async function executeCommand(command: string): Promise<CommandResponse> {
  // 首先尝试 Tauri（如果可用）
  if (await isTauriEnvironment()) {
    try {
      const result = await executeOpenClawCommand(command);
      return result;
    } catch (tauriError) {
      console.log('Tauri command failed, falling back to WebSocket:', tauriError);
    }
  }

  // 回退到 WebSocket 实现
  // 这里可以调用现有的 WebSocket 逻辑
  throw new Error('WebSocket implementation needed as fallback');
}