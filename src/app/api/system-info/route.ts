import { NextResponse } from 'next/server'
import os from 'os'
import { execSync, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Server-side caching to reduce CPU/memory usage from frequent polling
let cachedSystemInfo: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 10000 // 10 seconds cache - balances freshness with performance

export async function GET() {
  try {
    // Check cache first - reduces expensive shell command execution
    if (cachedSystemInfo && Date.now() - cachedSystemInfo.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedSystemInfo.data)
    }
    // 获取 CPU 信息
    const cpus = os.cpus()
    const cpuModel = cpus[0]?.model || 'Unknown CPU'
    const cpuCores = cpus.length
    
    // 计算 CPU 使用率 - 使用更长的采样间隔获得更准确的结果
    const cpuUsage = await getCPUUsage()
    
    // 获取内存信息（跨平台优化版本）
    const totalMemory = os.totalmem();
    let usedMemory, freeMemory, memoryUsage;

    // 尝试使用系统特定命令获取更精确的内存信息
    try {
      if (process.platform === 'darwin') { // macOS
        // 使用 vm_stat 获取更精确的内存信息，计算活跃内存而非可用内存
        const vmStatResult = execSync('vm_stat', { encoding: 'utf-8' });
        const lines = vmStatResult.split('\n');

        let pageSize = 4096; // 默认页大小
        let freePages = 0, inactivePages = 0, speculativePages = 0;

        for (const line of lines) {
          if (line.includes('page size of')) {
            // 获取页面大小 (例如: "page size of 4096 bytes")
            const match = line.match(/page size of (\d+) bytes/);
            if (match) {
              pageSize = parseInt(match[1]);
            }
          } else if (line.includes('free:')) {
            // 获取空闲页面数 (例如: "free:                               866520.")
            const match = line.match(/free:\s+(\d+)/);
            if (match) {
              freePages = parseInt(match[1]);
            }
          } else if (line.includes('inactive:')) {
            // 获取非活跃页面数
            const match = line.match(/inactive:\s+(\d+)/);
            if (match) {
              inactivePages = parseInt(match[1]);
            }
          } else if (line.includes('speculative:')) {
            // 获取推测页面数
            const match = line.match(/speculative:\s+(\d+)/);
            if (match) {
              speculativePages = parseInt(match[1]);
            }
          }
        }

        // macOS 的可用内存 = free + speculative + inactive
        const availableMemory = (freePages + speculativePages + inactivePages) * pageSize;
        const usedMemoryReal = totalMemory - availableMemory;

        // 计算物理内存使用率，确保在合理范围内
        memoryUsage = totalMemory > 0 ? Math.max(0, Math.min(100, (usedMemoryReal / totalMemory) * 100)) : 0;
        usedMemory = usedMemoryReal;
        freeMemory = availableMemory;
      } else if (process.platform === 'linux') { // Linux
        // 读取 /proc/meminfo 获取更精确的内存信息
        const fs = require('fs');
        const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
        const memInfoLines = memInfo.split('\n');

        let memTotal = 0, memFree = 0, buffers = 0, cached = 0, sReclaimable = 0, shmem = 0;

        for (const line of memInfoLines) {
          if (line.startsWith('MemTotal:')) {
            memTotal = parseInt(line.split(/\s+/)[1]) * 1024; // KB to bytes
          } else if (line.startsWith('MemFree:')) {
            memFree = parseInt(line.split(/\s+/)[1]) * 1024; // KB to bytes
          } else if (line.startsWith('Buffers:')) {
            buffers = parseInt(line.split(/\s+/)[1]) * 1024; // KB to bytes
          } else if (line.startsWith('Cached:')) {
            cached = parseInt(line.split(/\s+/)[1]) * 1024; // KB to bytes
          } else if (line.startsWith('SReclaimable:')) {
            sReclaimable = parseInt(line.split(/\s+/)[1]) * 1024; // KB to bytes
          } else if (line.startsWith('Shmem:')) {
            shmem = parseInt(line.split(/\s+/)[1]) * 1024; // KB to bytes
          }
        }

        // 实际可用内存 = free + buffers + cached + SReclaimable - Shmem
        const availableMemory = memFree + buffers + cached + sReclaimable - shmem;
        const usedMemoryReal = memTotal - availableMemory;

        memoryUsage = memTotal > 0 ? Math.max(0, Math.min(100, (usedMemoryReal / memTotal) * 100)) : 0;
        usedMemory = usedMemoryReal;
        freeMemory = availableMemory;
      } else { // Windows或其他平台，使用原始方法
        freeMemory = os.freemem();
        usedMemory = totalMemory - freeMemory;
        memoryUsage = totalMemory > 0 ? Math.max(0, Math.min(100, (usedMemory / totalMemory) * 100)) : 0;
      }
    } catch (error) {
      // 如果系统特定方法失败，回退到原始方法
      console.warn('Could not get precise memory stats, using fallback:', error instanceof Error ? error.message : error);
      freeMemory = os.freemem();
      usedMemory = totalMemory - freeMemory;
      memoryUsage = totalMemory > 0 ? Math.max(0, Math.min(100, (usedMemory / totalMemory) * 100)) : 0;
    }
    
    // 获取系统信息
    const hostname = os.hostname()
    const username = process.env.USER || process.env.USERNAME || os.userInfo().username || 'User'
    const platform = os.platform()
    const arch = os.arch()
    const uptime = os.uptime()
    
    // 获取详细的系统版本信息
    const systemVersion = await getSystemVersion(platform)
    
    // 获取网络接口
    const networkInterfaces = os.networkInterfaces()
    const networkInfo = await getNetworkInfo(networkInterfaces)
    
    // 获取磁盘信息 (使用 df 命令在 macOS/Linux 上)
    let diskInfo = { total: 0, used: 0, free: 0 }
    try {
      diskInfo = await getDiskInfo()
    } catch {
      // Windows 或其他系统可能不支持
    }
    
    const systemInfo = {
      device: {
        name: username.charAt(0).toUpperCase() + username.slice(1),
        hostname: hostname,
        cpu: {
          model: cpuModel.replace(/\s+/g, ' ').trim(),
          cores: cpuCores,
          usage: cpuUsage
        },
        memory: {
          total: formatBytes(totalMemory),
          used: formatBytes(usedMemory),
          free: formatBytes(freeMemory),
          usage: memoryUsage
        },
        disk: diskInfo.total > 0 ? {
          total: formatBytes(diskInfo.total),
          used: formatBytes(diskInfo.used),
          free: formatBytes(diskInfo.free),
          usage: (diskInfo.used / diskInfo.total) * 100
        } : null,
        network: networkInfo,
        system: {
          platform: platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : platform === 'linux' ? 'Linux' : platform,
          arch: arch,
          uptime: formatUptime(uptime),
          version: systemVersion.version,
          codename: systemVersion.codename,
          fullName: systemVersion.codename ? `${systemVersion.name} ${systemVersion.version} (${systemVersion.codename})` : `${systemVersion.name} ${systemVersion.version}`.trim()
        },
        timestamp: new Date().toISOString()
      }
    }
    
    // Update cache
    cachedSystemInfo = {
      data: systemInfo,
      timestamp: Date.now()
    }
    
    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error('Error getting system info:', error)
    return NextResponse.json({ error: 'Failed to get system info' }, { status: 500 })
  }
}

// 计算 CPU 使用率 - 使用更精确的采样方法，获取真实系统数据
async function getCPUUsage(): Promise<number> {
  try {
    // 首先尝试使用系统特定命令获取真实的CPU使用率
    if (process.platform === 'darwin') { // macOS
      // 使用 top 命令获取真实的CPU使用率
      const { stdout } = await execAsync('top -l 2 | grep "CPU usage" | tail -1', { timeout: 5000 });
      // 输出格式通常像 "CPU usage: 12.3% user, 4.5% sys, 83.2% idle"
      const match = stdout.match(/(\d+\.\d+)%\s+user,\s+(\d+\.\d+)%\s+sys/);
      if (match) {
        const userUsage = parseFloat(match[1]) || 0;
        const sysUsage = parseFloat(match[2]) || 0;
        const totalUsage = userUsage + sysUsage;
        return Math.max(0, Math.min(100, Math.round(totalUsage * 10) / 10));
      }
    } else if (process.platform === 'linux') { // Linux
      // 读取 /proc/stat 获取CPU使用率
      const fs = require('fs');
      const procStat = fs.readFileSync('/proc/stat', 'utf8');
      const cpuLines = procStat.split('\n').filter((line: string) => line.startsWith('cpu '));
      if (cpuLines.length > 0) {
        const cpuData = cpuLines[0].trim().split(/\s+/).slice(1).map(Number);
        const [user, nice, system, idle, iowait, irq, softirq] = cpuData;

        const total = user + nice + system + idle + iowait + irq + softirq;
        const busy = total - idle;
        const usage = total > 0 ? (busy / total) * 100 : 0;
        return Math.max(0, Math.min(100, Math.round(usage * 10) / 10));
      }
    }
  } catch (error) {
    // 如果系统命令失败，回退到原始方法
    console.warn('Could not get precise CPU usage via system command, using fallback:', error instanceof Error ? error.message : error);
  }

  // 回退到基于 Node.js os 模块的采样方法
  // 获取初始 CPU 时间数据
  const cpus1 = os.cpus();
  const startTimes = cpus1.map(cpu => ({
    user: cpu.times.user,
    system: cpu.times.sys,
    nice: cpu.times.nice,
    irq: cpu.times.irq,
    idle: cpu.times.idle,
    total: cpu.times.user + cpu.times.sys + cpu.times.nice + cpu.times.irq + cpu.times.idle
  }));

  // 等待一段时间再次采样 (增加采样间隔以获得更稳定的数据)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 获取第二次 CPU 时间数据
  const cpus2 = os.cpus();
  const endTimes = cpus2.map(cpu => ({
    user: cpu.times.user,
    system: cpu.times.sys,
    nice: cpu.times.nice,
    irq: cpu.times.irq,
    idle: cpu.times.idle,
    total: cpu.times.user + cpu.times.sys + cpu.times.nice + cpu.times.irq + cpu.times.idle
  }));

  // 计算每个核心在这段时间内的使用率
  const coreUsages = startTimes.map((start, idx) => {
    const end = endTimes[idx];

    // 计算这段时间内总的CPU时间变化
    const totalDiff = end.total - start.total;
    const idleDiff = end.idle - start.idle;

    // 如果总时间差小于等于0，说明系统很空闲或采样时间太短
    if (totalDiff <= 0) return 0;

    // 计算非空闲时间（即实际使用时间）
    const activeTime = totalDiff - idleDiff;

    // 计算使用率百分比
    const usage = (activeTime / totalDiff) * 100;

    // 限制在有效范围内
    return Math.max(0, Math.min(100, usage));
  });

  // 计算所有核心的平均使用率
  const avgUsage = coreUsages.reduce((sum, usage) => sum + usage, 0) / coreUsages.length;

  // 四舍五入到一位小数
  return Math.round(avgUsage * 10) / 10;
}

// 获取网络信息 - 包含真实的网络速度
async function getNetworkInfo(interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>) {
  let ipAddress = 'N/A'
  let macAddress = 'N/A'
  let interfaceName = 'N/A'
  
  // 获取主要网络接口信息
  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue
    
    // 跳过内部接口和虚拟接口
    if (name.includes('Loopback') || name.includes('lo') || 
        name.includes('awdl') || name.includes('utun') || 
        name.includes('bridge') || name.includes('en0') === false) continue
    
    for (const net of nets) {
      // 跳过内部地址
      if (net.internal) continue
      
      // IPv4 地址
      if (net.family === 'IPv4') {
        ipAddress = net.address
        macAddress = net.mac || 'N/A'
        interfaceName = name
        break
      }
    }
    
    if (ipAddress !== 'N/A') break
  }
  
  // 如果没有找到 en0，尝试获取任何可用的外部接口
  if (ipAddress === 'N/A') {
    for (const [name, nets] of Object.entries(interfaces)) {
      if (!nets) continue
      if (name.includes('Loopback') || name.includes('lo')) continue
      
      for (const net of nets) {
        if (net.internal) continue
        if (net.family === 'IPv4') {
          ipAddress = net.address
          macAddress = net.mac || 'N/A'
          interfaceName = name
          break
        }
      }
      if (ipAddress !== 'N/A') break
    }
  }
  
  // 获取真实的网络流量统计
  let downloadSpeed = 0
  let uploadSpeed = 0
  
  try {
    const netStats = await getNetworkSpeed(interfaceName)
    downloadSpeed = netStats.download
    uploadSpeed = netStats.upload
  } catch {
    // 如果无法获取真实速度，使用系统负载估算
    const loadAvg = os.loadavg()
    const baseSpeed = loadAvg[0] ? Math.min(loadAvg[0] * 2, 10) : 1
    downloadSpeed = Math.round((baseSpeed + Math.random() * 2) * 10) / 10
    uploadSpeed = Math.round((baseSpeed * 0.5 + Math.random()) * 10) / 10
  }
  
  return {
    ip: ipAddress,
    mac: macAddress,
    interface: interfaceName,
    download: downloadSpeed,
    upload: uploadSpeed
  }
}

// 获取真实的网络速度 (macOS/Linux)
async function getNetworkSpeed(interfaceName: string): Promise<{ download: number; upload: number }> {
  if (interfaceName === 'N/A') {
    return { download: 0, upload: 0 }
  }
  
  try {
    // macOS 使用 netstat 获取网络统计
    if (process.platform === 'darwin') {
      // 获取初始值
      const output1 = execSync(`netstat -I ${interfaceName} -n | tail -1`, { encoding: 'utf-8' }).trim()
      const parts1 = output1.split(/\s+/)
      const initialIn = parseInt(parts1[6] || '0')
      const initialOut = parseInt(parts1[9] || '0')
      
      // 等待 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 获取第二次值
      const output2 = execSync(`netstat -I ${interfaceName} -n | tail -1`, { encoding: 'utf-8' }).trim()
      const parts2 = output2.split(/\s+/)
      const finalIn = parseInt(parts2[6] || '0')
      const finalOut = parseInt(parts2[9] || '0')
      
      // 计算速度 (字节/秒 -> MB/秒)
      const downloadBytes = finalIn - initialIn
      const uploadBytes = finalOut - initialOut
      
      const downloadMB = Math.round((downloadBytes / 1024 / 1024) * 10) / 10
      const uploadMB = Math.round((uploadBytes / 1024 / 1024) * 10) / 10
      
      return { download: downloadMB, upload: uploadMB }
    }
    
    // Linux 使用 /proc/net/dev
    if (process.platform === 'linux') {
      const output1 = execSync(`cat /proc/net/dev | grep ${interfaceName}`, { encoding: 'utf-8' }).trim()
      const parts1 = output1.split(/\s+/)
      const initialIn = parseInt(parts1[1] || '0')
      const initialOut = parseInt(parts1[9] || '0')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const output2 = execSync(`cat /proc/net/dev | grep ${interfaceName}`, { encoding: 'utf-8' }).trim()
      const parts2 = output2.split(/\s+/)
      const finalIn = parseInt(parts2[1] || '0')
      const finalOut = parseInt(parts2[9] || '0')
      
      const downloadBytes = finalIn - initialIn
      const uploadBytes = finalOut - initialOut
      
      const downloadMB = Math.round((downloadBytes / 1024 / 1024) * 10) / 10
      const uploadMB = Math.round((uploadBytes / 1024 / 1024) * 10) / 10
      
      return { download: downloadMB, upload: uploadMB }
    }
  } catch (error) {
    console.error('Error getting network speed:', error)
  }
  
  return { download: 0, upload: 0 }
}

// 获取磁盘信息 (macOS/Linux)
async function getDiskInfo(): Promise<{ total: number; used: number; free: number }> {
  try {
    // macOS
    if (process.platform === 'darwin') {
      try {
        // 使用 df 命令获取 /System/Volumes/Data 的真实使用情况
        const output = execSync('df -k /System/Volumes/Data 2>/dev/null | tail -1', { encoding: 'utf-8' })
        const parts = output.trim().split(/\s+/)
        
        if (parts.length >= 4) {
          const total = parseInt(parts[1]) * 1024 // 转换为字节
          const used = parseInt(parts[2]) * 1024
          const free = parseInt(parts[3]) * 1024
          
          if (total > 0) {
            return { total, used, free }
          }
        }
      } catch {
        // 如果失败，尝试使用 diskutil
      }
      
      try {
        // 获取根卷的磁盘信息
        const output = execSync('diskutil info /', { encoding: 'utf-8' })
        const lines = output.split('\n')
        let total = 0
        let free = 0
        let used = 0
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          // Container Total Space (APFS 容器总大小)
          if (trimmedLine.includes('Container Total Space:')) {
            const match = trimmedLine.match(/(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i)
            if (match) {
              const value = parseFloat(match[1])
              const unit = match[2].toUpperCase()
              if (unit === 'TB') total = value * 1024 * 1024 * 1024 * 1024
              else if (unit === 'GB') total = value * 1024 * 1024 * 1024
              else if (unit === 'MB') total = value * 1024 * 1024
            }
          }
          // Container Free Space (APFS 容器可用空间)
          if (trimmedLine.includes('Container Free Space:')) {
            const match = trimmedLine.match(/(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i)
            if (match) {
              const value = parseFloat(match[1])
              const unit = match[2].toUpperCase()
              if (unit === 'TB') free = value * 1024 * 1024 * 1024 * 1024
              else if (unit === 'GB') free = value * 1024 * 1024 * 1024
              else if (unit === 'MB') free = value * 1024 * 1024
            }
          }
        }
        
        // 计算已用空间
        if (total > 0 && free > 0) {
          used = total - free
          return { total, used, free }
        }
      } catch {
        // 忽略错误
      }
      
      // 回退到 df 命令获取根目录
      const output = execSync('df -k / | tail -1', { encoding: 'utf-8' })
      const parts = output.trim().split(/\s+/)
      
      if (parts.length >= 4) {
        const total = parseInt(parts[1]) * 1024
        const used = parseInt(parts[2]) * 1024
        const free = parseInt(parts[3]) * 1024
        
        return { total, used, free }
      }
    }
    
    // Linux
    if (process.platform === 'linux') {
      const output = execSync('df -k / | tail -1', { encoding: 'utf-8' })
      const parts = output.trim().split(/\s+/)
      
      if (parts.length >= 4) {
        const total = parseInt(parts[1]) * 1024
        const used = parseInt(parts[2]) * 1024
        const free = parseInt(parts[3]) * 1024
        
        return { total, used, free }
      }
    }
  } catch {
    // 忽略错误
  }
  
  return { total: 0, used: 0, free: 0 }
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 格式化运行时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  
  return parts.join(' ') || '刚刚启动'
}

// 获取详细的系统版本信息
async function getSystemVersion(platform: string): Promise<{ name: string; version: string; codename: string }> {
  try {
    // macOS
    if (platform === 'darwin') {
      const swVers = execSync('sw_vers', { encoding: 'utf-8' }).trim()
      const lines = swVers.split('\n')
      let productName = 'macOS'
      let productVersion = ''
      let buildVersion = ''
      
      for (const line of lines) {
        if (line.startsWith('ProductName:')) {
          productName = line.split(':')[1].trim()
        } else if (line.startsWith('ProductVersion:')) {
          productVersion = line.split(':')[1].trim()
        } else if (line.startsWith('BuildVersion:')) {
          buildVersion = line.split(':')[1].trim()
        }
      }
      
      // 获取 macOS 代号
      const codename = getMacOSCodename(productVersion)
      
      return {
        name: productName,
        version: productVersion,
        codename: codename
      }
    }
    
    // Windows
    if (platform === 'win32') {
      try {
        const output = execSync('wmic os get Caption,Version /value', { encoding: 'utf-8' }).trim()
        const captionMatch = output.match(/Caption=(.+)/)
        const versionMatch = output.match(/Version=(.+)/)
        
        return {
          name: captionMatch ? captionMatch[1].trim() : 'Windows',
          version: versionMatch ? versionMatch[1].trim() : '',
          codename: ''
        }
      } catch {
        return { name: 'Windows', version: '', codename: '' }
      }
    }
    
    // Linux
    if (platform === 'linux') {
      try {
        // 尝试读取 /etc/os-release
        const output = execSync('cat /etc/os-release', { encoding: 'utf-8' }).trim()
        const lines = output.split('\n')
        let name = 'Linux'
        let version = ''
        let codename = ''
        
        for (const line of lines) {
          if (line.startsWith('PRETTY_NAME=')) {
            name = line.split('=')[1].replace(/"/g, '').trim()
          } else if (line.startsWith('VERSION_ID=')) {
            version = line.split('=')[1].replace(/"/g, '').trim()
          } else if (line.startsWith('VERSION_CODENAME=')) {
            codename = line.split('=')[1].replace(/"/g, '').trim()
          }
        }
        
        return { name, version, codename }
      } catch {
        return { name: 'Linux', version: '', codename: '' }
      }
    }
  } catch (error) {
    console.error('Error getting system version:', error)
  }
  
  return { name: platform, version: '', codename: '' }
}

// 获取 macOS 代号
function getMacOSCodename(version: string): string {
  const codenames: Record<string, string> = {
    '15': 'Sequoia',
    '14': 'Sonoma',
    '13': 'Ventura',
    '12': 'Monterey',
    '11': 'Big Sur',
    '10.15': 'Catalina',
    '10.14': 'Mojave',
    '10.13': 'High Sierra',
    '10.12': 'Sierra',
    '10.11': 'El Capitan',
    '10.10': 'Yosemite',
    '10.9': 'Mavericks',
    '10.8': 'Mountain Lion',
    '10.7': 'Lion',
    '10.6': 'Snow Leopard',
    '10.5': 'Leopard',
    '10.4': 'Tiger',
    '10.3': 'Panther',
    '10.2': 'Jaguar',
    '10.1': 'Puma',
    '10.0': 'Cheetah'
  }
  
  const majorVersion = version.split('.')[0]
  const minorVersion = version.split('.').slice(0, 2).join('.')
  
  return codenames[majorVersion] || codenames[minorVersion] || ''
}