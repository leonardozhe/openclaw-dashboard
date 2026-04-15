# MeetClaw - OpenClaw Dashboard

OpenClaw 网关管理面板，提供设备监控、Agent 管理、终端访问和系统状态查看等功能。

## 🚀 快速部署

### 方式一：Vercel 一键部署（推荐）

1. Fork 本仓库到你的 GitHub 账号
2. 访问 [Vercel](https://vercel.com/new)
3. 导入你的 Fork 仓库
4. 点击 Deploy

### 方式二：Docker 部署

```bash
# 克隆仓库
git clone https://github.com/leonardozhe/openclaw-dashboard.git
cd openclaw-dashboard

# 构建并运行
docker build -t meetclaw .
docker run -p 4000:4000 meetclaw
```

### 方式三：手动部署（Node.js）

#### 前置要求
- Node.js 20+ 
- npm / yarn / pnpm
- OpenClaw CLI（用于 API 功能）

#### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/leonardozhe/openclaw-dashboard.git
cd openclaw-dashboard

# 2. 安装依赖
npm install
# 或
yarn install
# 或
pnpm install

# 3. 配置环境变量（可选）
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 4. 构建生产版本
npm run build

# 5. 启动服务
npm start
```

访问 `http://localhost:4000` 即可使用。

### 方式四：PM2 后台运行（生产环境推荐）

```bash
# 安装 PM2
npm install -g pm2

# 安装依赖并构建
npm install
npm run build

# 启动服务
pm2 start npm --name "meetclaw" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 方式五：systemd 服务（Linux 生产环境）

创建 `/etc/systemd/system/meetclaw.service`：

```ini
[Unit]
Description=MeetClaw OpenClaw Dashboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/meetclaw
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000

[Install]
WantedBy=multi-user.target
```

```bash
# 部署代码
sudo mkdir -p /opt/meetclaw
sudo chown $USER:$USER /opt/meetclaw
cd /opt/meetclaw
git clone https://github.com/leonardozhe/openclaw-dashboard.git .
npm install
npm run build

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable meetclaw
sudo systemctl start meetclaw

# 查看状态
sudo systemctl status meetclaw
```

## 📋 环境变量配置

创建 `.env.local` 文件配置以下变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `4000` |
| `OPENCLAW_CONFIG_PATH` | OpenClaw 配置文件路径 | `~/.openclaw/openclaw.json` |
| `OPENCLAW_BIN` | OpenClaw CLI 路径 | `/usr/local/bin/openclaw` |

## 🔧 开发模式

```bash
npm run dev
```

访问 `http://localhost:4000`

## 📦 项目结构

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── layout.tsx    # 根布局
│   │   └── page.tsx      # 主页
│   ├── components/       # React 组件
│   └── lib/              # 工具库
├── public/               # 静态资源
├── next.config.ts        # Next.js 配置
└── package.json          # 依赖配置
```

## 🌐 功能特性

- **设备监控**: 实时查看 GPU、CPU、内存使用情况
- **Agent 管理**: 查看和管理所有 AI Agent 状态
- **系统状态**: OpenClaw 网关服务状态监控
- **终端访问**: WebSocket 终端（需要 OpenClaw Gateway）
- **日志查看**: 查看系统运行日志
- **定时任务**: 管理 Cron 定时任务

## ⚠️ 注意事项

1. 部分 API 功能需要安装并运行 OpenClaw Gateway
2. 生产环境建议使用 HTTPS
3. 建议配置反向代理（Nginx/Caddy）

## 📄 License

MIT
