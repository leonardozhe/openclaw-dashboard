import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { baseUrl, hasApiKey } = await request.json();

    if (!baseUrl) {
      return NextResponse.json({ latency: null, error: 'No baseUrl provided' });
    }

    // 验证 URL 格式
    let testUrl;
    try {
      testUrl = new URL(baseUrl);
    } catch (error) {
      return NextResponse.json({ latency: null, error: 'Invalid URL format' });
    }

    // 防止 SSRF 攻击，检查 URL
    if (!isValidUrl(testUrl)) {
      return NextResponse.json({ latency: null, error: 'Invalid URL' });
    }

    // 对于需要 API 密钥的提供商，我们不能简单地测试公共端点
    // 对于公开可用的端点，我们使用 curl 进行测试
    const urlToTest = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const fullUrl = `${urlToTest}/models`;

    const startTime = Date.now();
    try {
      // 使用 curl 命令测试延迟（更可靠地处理各种 API）
      // 使用较短的超时时间，并添加更多错误处理选项
      const { stdout, stderr } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" --max-time 3 --connect-timeout 2 "${fullUrl}"`, { timeout: 6000 }); // 略高于 curl 的超时时间

      const statusCode = parseInt(stdout.trim());
      const endTime = Date.now();
      const latency = endTime - startTime;

      // 检查状态码是否表示成功
      if (statusCode >= 200 && statusCode < 400) {
        return NextResponse.json({ latency });
      } else {
        // 对于某些 API，401 或 403 是正常响应（需要 API 密钥），这也表示端点可达
        if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
          return NextResponse.json({ latency }); // 返回延迟，因为端点是可达的
        }
        return NextResponse.json({ latency: null, error: `HTTP ${statusCode}` });
      }
    } catch (error: unknown) {
      // curl 命令失败，可能的原因：超时、连接失败等
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? (error as Record<string, unknown>).code : null;
      const errorKilled = error instanceof Error && 'killed' in error ? (error as Record<string, unknown>).killed : false;
      
      if (errorMessage.includes('timed out') || errorCode === 'ETIMEDOUT' || errorKilled) {
        return NextResponse.json({ latency: null, error: 'Timeout' });
      }
      return NextResponse.json({ latency: null, error: errorMessage || 'Request failed' });
    }
  } catch (error) {
    console.error('Error testing provider latency:', error);
    return NextResponse.json({ latency: null, error: 'Internal server error' });
  }
}

// 验证 URL 是否安全，防止 SSRF 攻击
function isValidUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();

  // 禁止本地地址
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.internal') ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname)
  ) {
    return false;
  }

  // 只允许 HTTPS 或 HTTP 协议
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }

  return true;
}
