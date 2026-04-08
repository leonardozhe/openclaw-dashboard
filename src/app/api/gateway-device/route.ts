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

    // 获取 gateway 认证配置
    const gatewayAuthMode = config?.gateway?.auth?.mode || 'token'; // none, token, password, trusted-proxy
    const gatewayToken = config?.gateway?.auth?.token || null;
    const gatewayPort = config?.gateway?.port || 18789;
    const gatewayTlsEnabled = config?.gateway?.tls?.enabled || false;

    // 尝试读取已配对的设备信息（用于获取设备 token 作为备用）
    let pairedDevice = null;
    const devicesPath = join(homedir(), '.openclaw', 'devices', 'paired.json');

    if (existsSync(devicesPath)) {
      try {
        const devicesContent = readFileSync(devicesPath, 'utf-8');
        const devices = JSON.parse(devicesContent);

        // paired.json 是一个对象，key 是 deviceId
        // 获取最新的已配对设备
        if (typeof devices === 'object' && devices !== null) {
          const deviceIds = Object.keys(devices);
          if (deviceIds.length > 0) {
            // 🔑 优先选择 clientMode 为 "webchat" 的设备（与前端连接模式匹配）
            // 其次选择有 operator.write 权限的设备
            let selectedDeviceId: string | null = null;
            let selectedDevice = null;
            
            // 1. 首先查找 webchat 模式的设备
            for (const id of deviceIds) {
              const device = devices[id];
              if (device?.clientMode === 'webchat') {
                selectedDeviceId = id;
                selectedDevice = device;
                console.log('🔑 选择 webchat 模式的设备:', id.substring(0, 16) + '...');
                break;
              }
            }
            
            // 2. 如果没有 webchat 设备，查找有 operator.write 权限的设备
            if (!selectedDevice) {
              for (const id of deviceIds) {
                const device = devices[id];
                const hasWriteScope = device?.tokens?.operator?.scopes?.includes('operator.write') ||
                                      device?.scopes?.includes('operator.write');
                if (hasWriteScope) {
                  selectedDeviceId = id;
                  selectedDevice = device;
                  console.log('🔑 选择有 operator.write 权限的设备:', id.substring(0, 16) + '...');
                  break;
                }
              }
            }
            
            // 3. 如果还是没有找到，使用第一个设备
            if (!selectedDevice) {
              selectedDeviceId = deviceIds[0];
              selectedDevice = devices[selectedDeviceId];
              console.log('🔑 使用第一个设备:', selectedDeviceId.substring(0, 16) + '...');
            }

            if (selectedDevice && selectedDeviceId) {
              // Token 认证模式：只需要设备 token，不需要私钥/公钥
              pairedDevice = {
                deviceId: selectedDevice.deviceId || selectedDeviceId,
                instanceId: selectedDevice.deviceId || selectedDeviceId,
                clientId: selectedDevice.clientId || 'gateway-client',
                clientMode: selectedDevice.clientMode || 'backend',
                platform: selectedDevice.platform || 'darwin',
                token: selectedDevice.tokens?.operator?.token || null,
                scopes: selectedDevice.tokens?.operator?.scopes || selectedDevice.scopes || ['operator.read']
              };
            }
          }
        }
      } catch (e) {
        console.warn('Could not read paired devices:', e);
      }
    }

    return NextResponse.json({
      success: true,
      gatewayAuthMode, // 返回认证模式
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
