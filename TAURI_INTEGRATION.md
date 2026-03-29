# MeetClaw Tauri 桌面应用迁移指南

## 项目结构

```
meetclaw-open/
├── src-tauri/           # Tauri 桌面应用配置
│   ├── Cargo.toml       # Rust 依赖配置
│   ├── tauri.conf.json  # Tauri 配置文件
│   └── src/
│       └── main.rs      # Tauri 主程序
├── src/                 # 现有前端代码 (保持不变)
│   ├── app/             # Next.js 页面
│   ├── components/      # React 组件
│   └── ...
├── package.json         # Node.js 配置
└── ...
```

## 集成步骤

### 1. 安装 Tauri 依赖
```bash
cargo install tauri-cli
```

### 2. 修改 package.json 构建脚本
在 package.json 中添加：

```json
{
  "scripts": {
    "tauri": "tauri",
    "build-tauri": "npm run build && tauri build",
    "dev-tauri": "tauri dev"
  }
}
```

### 3. 前端集成 Tauri 功能

修改 WebSocket 终端组件，添加 Tauri 作为后备选项：

```typescript
// 优先使用 Tauri，否则使用 WebSocket
import { invoke } from '@tauri-apps/api/core';

async function executeCommand(command: string) {
  try {
    // 尝试使用 Tauri 调用 CLI
    const result: CommandResponse = await invoke('execute_openclaw_command', {
      command
    });

    if (result.success) {
      return result.output;
    } else {
      throw new Error(result.error || 'Command failed');
    }
  } catch (e) {
    console.log('Tauri command failed, falling back to WebSocket:', e);
    // 这里可以回退到原来的 WebSocket 逻辑
  }
}
```

### 4. 构建桌面应用

```bash
# 开发模式
cargo tauri dev

# 构建发行版
cargo tauri build
```

## 功能增强

### Tauri 提供的功能
- 直接执行 `openclaw` CLI 命令
- 绕过浏览器安全策略
- 访问本地文件系统
- 原生系统集成
- 离线功能支持

### 保持现有界面
- 所有现有 UI 组件保持不变
- 所有动画和样式保持不变
- 仅将网络调用替换为 Tauri 调用
- 用户体验一致

## 发布

构建完成后，Tauri 会生成适用于各平台的安装包：
- Windows: .msi 或 .exe
- macOS: .app 或 .dmg
- Linux: .deb 或 .AppImage

## 注意事项

1. 用户需要安装 OpenClaw CLI
2. 应用会检测 OpenClaw 是否已安装
3. 如果 OpenClaw 未安装，会显示相应的错误信息