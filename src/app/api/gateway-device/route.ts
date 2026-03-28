import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export async function GET() {
  try {
    // 读取 OpenClaw 配置文件
    const configPath = join(homedir(), '.openclaw', 'openclaw.json');

    if (!existsSync(configPath)) {
      return NextResponse.json({
        success: false,
        error: 'OpenClaw configuration not found',
        gatewayToken: null,
        gatewayPort: 18789,
        gatewayTlsEnabled: false,
        device: null
      });
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // 获取 gateway 认证 token
    const gatewayToken = config?.gateway?.auth?.token || null;
    const gatewayPort = config?.gateway?.port || 18789;
    const gatewayTlsEnabled = config?.gateway?.tls?.enabled || false;

    // 尝试读取已配对的设备信息
    let pairedDevice = null;
    const devicesPath = join(homedir(), '.openclaw', 'devices', 'paired.json');

    if (existsSync(devicesPath)) {
      try {
        const devicesContent = readFileSync(devicesPath, 'utf-8');
        const devices = JSON.parse(devicesContent);

        // 获取最新的已配对设备
        if (Array.isArray(devices) && devices.length > 0) {
          // 取第一个设备作为当前设备（或者可以使用特定逻辑选择）
          const device = devices[0];
          pairedDevice = {
            deviceId: device.id,
            clientId: device.client?.id || 'gateway-client',
            clientMode: device.client?.mode || 'cli',
            platform: device.client?.platform || 'darwin',
            token: device.token || null,
            scopes: device.scopes || ['operator.read', 'operator.admin', 'operator.write']
          };
        }
      } catch (e) {
        console.warn('Could not read paired devices:', e);
      }
    }

    return NextResponse.json({
      success: true,
      gatewayToken,
      gatewayPort,
      gatewayTlsEnabled,
      device: pairedDevice
    });
  } catch (error) {
    console.error('Error getting gateway device info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get gateway device info',
      gatewayToken: null,
      gatewayPort: 18789,
      gatewayTlsEnabled: false,
      device: null
    });
  }
}
