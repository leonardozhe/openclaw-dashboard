# OpenClaw TLS 和 WebSocket 连接指南

## 问题描述

当启用 OpenClaw 的 TLS (`gateway.tls.enabled: true`) 时，Web 界面的 WebSocket 连接可能出现问题，表现为：
- WebSocket 连接错误 (code: 1006)
- 无法建立连接

## 原因分析

1. **浏览器安全策略**：
   - 当网页通过 HTTP 访问时，浏览器可能不允许与自签名 SSL 证书的 WSS 连接
   - 混合内容政策禁止不安全页面与安全 WebSocket 连接

2. **自签名证书问题**：
   - 浏览器对自签名证书的安全策略更严格
   - 用户需要手动接受证书警告才能建立连接

## 解决方案

### 方案 1：HTTPS 访问（推荐）

1. 确保通过 HTTPS 访问控制台
2. 首次访问时接受自签名证书
3. URL 格式：`https://[your-ip]:18789`

### 方案 2：配置局域网信任

```bash
openclaw config set gateway.trustedProxies '["192.168.1.0/24"]'
openclaw gateway restart
```

### 方案 3：SSH 隧道（最简单）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@your-server-ip
```

然后访问 `http://127.0.0.1:18789`

### 方案 4：禁用 TLS（开发环境）

```bash
openclaw config set gateway.tls.enabled false
openclaw gateway restart
```

## 前端连接策略

当前的前端实现采用以下策略：
1. 如果页面协议是 HTTPS 且服务器启用 TLS → 使用 WSS
2. 如果页面协议是 HTTP → 使用 WS（避免混合内容错误）
3. 提供清晰的日志信息以便调试

## 最佳实践

对于局域网环境：
1. 启用 TLS: `openclaw config set gateway.tls.enabled true`
2. 设置受信任代理: `openclaw config set gateway.trustedProxies '["192.168.1.0/24"]'`
3. 通过 HTTPS 访问并在首次连接时接受证书
4. 如果仍有问题，使用 SSH 隧道方案

## 调试提示

- 查看浏览器控制台日志
- 检查 OpenClaw 网关日志
- 确认端口连通性
- 验证配置是否正确应用