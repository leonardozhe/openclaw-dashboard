# MeetClaw 分发指南

## 📦 安装包位置

构建完成后，安装包位于：

```
src-tauri/target/release/bundle/
├── dmg/MeetClaw_1.0.0_aarch64.dmg    # macOS (Apple Silicon)
├── macos/MeetClaw.app                 # macOS 应用
└── ...
```

---

## 🍎 macOS 分发

### 当前已构建
- **文件**: `MeetClaw_1.0.0_aarch64.dmg` (3.7MB)
- **架构**: Apple Silicon (M1/M2/M3/M4)

### 安装方法（学员）
1. 双击 `.dmg` 文件
2. 将 MeetClaw 拖拽到 Applications 文件夹
3. 从 Launchpad 或 Applications 文件夹启动

### 首次运行提示
macOS 可能会提示"无法验证开发者"，解决方法：
- 系统设置 > 隐私与安全性 > 仍要打开
- 或在终端运行：`xattr -d com.apple.quarantine /Applications/MeetClaw.app`

### 构建 Intel 版本（给 Intel Mac 学员）
```bash
# 在 Intel Mac 上运行，或使用交叉编译
npm run tauri build
```

---

## 🪟 Windows 分发

### 构建方法
在 Windows 机器上执行：
```bash
npm install
npm run tauri build
```

### 输出文件
```
src-tauri/target/release/bundle/
├── msi/MeetClaw_1.0.0_x64_en-US.msi    # Windows 安装包
└── nsis/MeetClaw_1.0.0_x64-setup.exe   # NSIS 安装程序
```

### 安装方法（学员）
1. 双击 `.msi` 或 `.exe` 文件
2. 按照安装向导完成安装

---

## 🐧 Linux 分发

### 构建方法
在 Linux 机器上执行：
```bash
# 安装系统依赖（Ubuntu/Debian）
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget \
    file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

npm install
npm run tauri build
```

### 输出文件
```
src-tauri/target/release/bundle/
├── deb/MeetClaw_1.0.0_amd64.deb        # Debian/Ubuntu
├── rpm/MeetClaw-1.0.0-1.x86_64.rpm     # Fedora/RHEL
└── appimage/MeetClaw_1.0.0_amd64.AppImage  # 通用 Linux
```

### 安装方法（学员）

**Debian/Ubuntu:**
```bash
sudo dpkg -i MeetClaw_1.0.0_amd64.deb
sudo apt install -f  # 修复依赖
```

**Fedora/RHEL:**
```bash
sudo rpm -i MeetClaw-1.0.0-1.x86_64.rpm
```

**通用 Linux (AppImage):**
```bash
chmod +x MeetClaw_1.0.0_amd64.AppImage
./MeetClaw_1.0.0_amd64.AppImage
```

---

## 📋 学员快速安装脚本

### macOS
```bash
# 下载安装包
curl -L -o MeetClaw.dmg "https://your-server.com/MeetClaw_1.0.0_aarch64.dmg"

# 挂载并安装
hdiutil attach MeetClaw.dmg
cp -R /Volumes/MeetClaw/MeetClaw.app /Applications/
hdiutil detach /Volumes/MeetClaw

echo "✅ 安装完成！请从 Applications 文件夹启动 MeetClaw"
```

### Windows (PowerShell)
```powershell
# 下载安装包
Invoke-WebRequest -Uri "https://your-server.com/MeetClaw_1.0.0_x64_en-US.msi" -OutFile "MeetClaw.msi"

# 静默安装
msiexec /i MeetClaw.msi /qn

Write-Host "✅ 安装完成！"
```

### Linux (Ubuntu/Debian)
```bash
# 下载安装包
curl -L -o MeetClaw.deb "https://your-server.com/MeetClaw_1.0.0_amd64.deb"

# 安装
sudo dpkg -i MeetClaw.deb
sudo apt install -f

echo "✅ 安装完成！"
```

---

## 🚀 自动化分发（可选）

### 使用 GitHub Actions 自动构建

创建 `.github/workflows/build.yml`：

```yaml
name: Build MeetClaw

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu

    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install Linux Dependencies
        if: matrix.os == 'ubuntu-22.04'
        run: |
          sudo apt update
          sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget \
            file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
      
      - name: Install Dependencies
        run: npm install
      
      - name: Build App
        run: npm run tauri build
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: MeetClaw-${{ matrix.target }}
          path: |
            src-tauri/target/release/bundle/dmg/*.dmg
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/bundle/deb/*.deb
            src-tauri/target/release/bundle/appimage/*.AppImage
```

---

## 📊 版本信息

| 版本 | 日期 | 平台 | 架构 | 文件大小 |
|------|------|------|------|----------|
| 1.0.0 | 2026-04-15 | macOS | aarch64 | 3.7MB |
| 1.0.0 | - | Windows | x64 | - |
| 1.0.0 | - | Linux | amd64 | - |

---

## ❓ 常见问题

### Q: macOS 提示"无法验证开发者"
A: 系统设置 > 隐私与安全性 > 仍要打开

### Q: Windows SmartScreen 阻止安装
A: 点击"更多信息" > "仍要运行"

### Q: Linux 缺少依赖
A: 运行 `sudo apt install -f` 修复依赖问题

### Q: 应用启动后白屏
A: 确保系统已安装最新版本的 WebKit2（macOS 自带，Windows 需要 WebView2）
