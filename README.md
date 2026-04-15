# MeetClaw - OpenClaw Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**English** | [中文](#中文文档)

---

## 🚀 Quick Start

### Manual Install

```bash
# Clone the repository
git clone https://github.com/leonardozhe/openclaw-dashboard.git
cd openclaw-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📋 Requirements

- Node.js 20+
- npm

## 🌐 Features

- **Device Monitoring**: Real-time GPU, CPU, memory usage
- **Agent Management**: View and manage all AI agents
- **System Status**: OpenClaw gateway service monitoring
- **Terminal Access**: WebSocket terminal (requires OpenClaw Gateway)
- **Log Viewer**: System runtime logs
- **Cron Jobs**: Manage scheduled tasks

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   └── lib/              # Utilities
├── public/               # Static assets
├── next.config.ts        # Next.js config
└── package.json          # Dependencies
```

## 📄 License

MIT

---

## 中文文档

## 🚀 快速开始

### 手动安装

```bash
# 克隆仓库
git clone https://github.com/leonardozhe/openclaw-dashboard.git
cd openclaw-dashboard

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:4000](http://localhost:4000)。

### 生产构建

```bash
npm run build
npm start
```

---

## 📋 环境要求

- Node.js 20+
- npm

## 🌐 功能特性

- **设备监控**: 实时查看 GPU、CPU、内存使用情况
- **Agent 管理**: 查看和管理所有 AI Agent 状态
- **系统状态**: OpenClaw 网关服务状态监控
- **终端访问**: WebSocket 终端（需要 OpenClaw Gateway）
- **日志查看**: 查看系统运行日志
- **定时任务**: 管理 Cron 定时任务

## 📁 项目结构

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

## 📄 许可证

MIT
