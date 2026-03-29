# MeetClaw 桌面应用安装指南

## 系统要求

### Windows
- Windows 10 或更高版本
- PowerShell 5.1 或更高版本
- Visual Studio Build Tools 或 Visual Studio 2022

### macOS
- macOS 10.15 或更高版本 (Catalina+)
- Xcode Command Line Tools

### Linux
- Ubuntu 18.04+, Fedora 34+, 或其他现代发行版
- GTK3 开发库
- C 编译器 (gcc)

## 安装步骤

### 1. 安装必要的工具链

#### 安装 Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

或者使用 Homebrew (macOS):
```bash
brew install rust
```

#### 安装 Tauri CLI
```bash
cargo install tauri-cli
```

### 2. 安装 Node.js 和依赖

确保已安装 Node.js (建议 v18 或更高版本):

```bash
# 检查 Node.js 版本
node --version

# 安装项目依赖
npm install
```

### 3. 构建桌面应用

#### 开发模式
```bash
# 终端 1: 启动前端开发服务器
npm run dev

# 终端 2: 启动 Tauri 应用 (自动连接到开发服务器)
cargo tauri dev
```

#### 生产构建
```bash
# 构建完整的桌面应用安装包
cargo tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录：
- Windows: `.msi` 或 `.exe` 文件
- macOS: `.app` 或 `.dmg` 文件
- Linux: `.deb` 或 `.AppImage` 文件

## 配置 OpenClaw CLI

为了使桌面应用能够直接执行 OpenClaw CLI 命令，您需要：

### 1. 安装 OpenClaw CLI
确保 OpenClaw CLI 已安装并在系统 PATH 中可用：

```bash
# 验证安装
openclaw --version
```

### 2. 初始化 OpenClaw 配置
首次运行应用前，需要初始化 OpenClaw 配置：

```bash
# 初始化配置
openclaw init

# 启动 OpenClaw 服务
openclaw daemon start
```

## 使用说明

### 桌面应用功能
1. **原生 CLI 集成**: 桌面应用可直接执行 OpenClaw CLI 命令，无需通过网络接口
2. **WebSocket 回退**: 如果 CLI 不可用，自动回退到 WebSocket 连接
3. **跨平台支持**: 在 Windows、macOS 和 Linux 上提供一致的用户体验
4. **系统集成**: 原生文件系统访问、系统托盘等

### 运行时行为
- 应用启动时首先检查是否在 Tauri 环境中
- 如果是 Tauri 环境，优先使用 Tauri 执行 CLI 命令
- 如果不是 Tauri 环境（浏览器），使用 WebSocket 连接
- 命令执行结果实时显示在终端中

## 故障排除

### Tauri 构建问题
1. 如果遇到构建错误，尝试：
   ```bash
   cargo clean
   cargo tauri build
   ```

2. Windows 用户可能需要安装 Visual Studio Build Tools:
   ```bash
   # 从 Microsoft 下载并安装 Build Tools
   # 确保勾选 "C++ build tools" 和 "Windows 10/11 SDK"
   ```

### OpenClaw CLI 未找到
1. 确保 OpenClaw CLI 已正确安装
2. 检查 `openclaw` 命令是否在 PATH 中：
   ```bash
   which openclaw  # Linux/macOS
   where.exe openclaw  # Windows
   ```
3. 如未找到，请手动添加 OpenClaw 到系统 PATH

### 权限问题
1. macOS 可能需要额外的安全许可
2. Windows 可能需要以管理员权限运行安装程序
3. Linux 需要适当的文件权限

## 更新应用

### 更新桌面应用
1. 从官网下载新版本安装包
2. 运行安装程序覆盖安装
3. 应用数据将保留

### 更新 OpenClaw CLI
```bash
# 使用包管理器更新
openclaw update

# 或重新安装最新版本
```