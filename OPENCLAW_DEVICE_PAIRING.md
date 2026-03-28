## OpenClaw 设备配对和权限说明

### 设备配对步骤

1. **确认 OpenClaw 服务正在运行**：
   ```bash
   openclaw status
   ```

2. **获取设备配对码**：
   ```bash
   openclaw devices pair
   ```
   这将生成一个设备配对码。

3. **在 Web 界面中配对设备**：
   - 访问 `http://localhost:18789`
   - 在设备管理页面中查找待配对的设备
   - 点击 "Approve" 批准设备

### 权限说明

- `operator.read`: 读取权限 - 可以查看状态和信息
- `operator.write`: 写入权限 - 可以发送消息和修改数据
- `operator.admin`: 管理权限 - 可以管理通道、代理等高级功能

### 常见问题解决

1. **缺少 operator.admin 权限**：
   - 检查 `~/.openclaw/openclaw.json` 中的配置
   - 确保设备已被管理员权限批准

2. **连接成功但无法执行命令**：
   - 确认在 OpenClaw 界面中该设备拥有相应权限
   - 重启 OpenClaw 服务并重新连接

3. **设备身份验证失败**：
   - 删除 `~/.openclaw/devices/paired.json` 文件
   - 重新执行配对过程