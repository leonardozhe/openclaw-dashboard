import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { hostname } = await request.json();

    if (!hostname) {
      return NextResponse.json({ latency: null, error: 'No hostname provided' });
    }

    // 验证主机名格式，防止命令注入
    if (!/^[a-zA-Z0-9.-]+$/.test(hostname)) {
      return NextResponse.json({ latency: null, error: 'Invalid hostname format' });
    }

    const startTime = Date.now();
    try {
      let stdout;
      // 根据操作系统使用适当的ping命令
      if (process.platform === 'win32') {
        // Windows使用 -n (次数) 和 -w (超时毫秒)
        ({ stdout } = await execAsync(`ping -n 3 -w 3000 "${hostname}"`, { timeout: 8000 }));
      } else {
        // macOS/Linux使用 -c (次数) 和 -W (超时秒)
        ({ stdout } = await execAsync(`ping -c 3 -W 3 "${hostname}"`, { timeout: 8000 }));
      }

      const endTime = Date.now();

      // 尝试解析ping结果获取平均延迟
      let latency = null;

      // 尝试多种格式的ping输出解析
      // macOS格式: "rtt avg = 15.234"
      const macAvgMatch = stdout.match(/rtt avg = (\d+\.?\d*)/);
      // 通用格式: "avg = 数值" 或 "平均 = 数值"
      const avgMatch = stdout.match(/avg[= ]+(\d+\.?\d*)/);
      // Linux格式: "min/avg/max/stddev = 数值/数值/数值/数值"
      const linuxAvgMatch = stdout.match(/[0-9.]+\/([0-9.]+)\/[0-9.]+\/[0-9.]+\s+ms/);
      // 另一种Linux格式: "min/avg/max = 数值/数值/数值 ms"
      const linuxAvgMatch2 = stdout.match(/[0-9.]+\/([0-9.]+)\/[0-9.]+\s+ms/);

      if (macAvgMatch) {
        latency = Math.round(parseFloat(macAvgMatch[1]));
      } else if (avgMatch) {
        latency = Math.round(parseFloat(avgMatch[1]));
      } else if (linuxAvgMatch) {
        latency = Math.round(parseFloat(linuxAvgMatch[1]));
      } else if (linuxAvgMatch2) {
        latency = Math.round(parseFloat(linuxAvgMatch2[1]));
      } else {
        // 如果无法解析延迟，则使用整个请求的时间作为近似值
        latency = endTime - startTime;
      }

      return NextResponse.json({ latency });
    } catch (error: any) {
      // ping命令失败，可能的原因：网络不通、主机不存在、超时等
      return NextResponse.json({ latency: null, error: 'Unreachable' });
    }
  } catch (error) {
    console.error('Error testing ping latency:', error);
    return NextResponse.json({ latency: null, error: 'Internal server error' });
  }
}