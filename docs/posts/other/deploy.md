# 基于 `node-ssh` 实现项目工程的自动编译并更新测试环境

## deploy代码
```javascript
import { NodeSSH } from 'node-ssh'
import path from 'path'
import dayjs from 'dayjs'
import { fileURLToPath } from 'url'

const ssh = new NodeSSH()

// 获取当前文件的目录名，ESM 中没有 __dirname，需要通过 `import.meta.url` 来实现
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 本地打包文件目录
const now = dayjs()
const distDir = path.resolve(__dirname, 'dist-test')
const serverDir = '/apps/nginx/www/agency' // 远程服务器部署目录

// 服务器配置
const config = {
  host: '192.168.25.57', // 服务器 IP
  username: 'root', // 服务器用户名
  password: '123456', // 服务器密码 (可以改成私钥路径以使用 SSH Key)
}

// 连接服务器并执行部署
ssh
  .connect(config)
  .then(async () => {
    try {
      // Step 1: 删除远程服务器的目录
      console.log(`Deleting ${serverDir}`)
      await ssh.execCommand(`rm -rf ${serverDir}`)
      console.log('Deletion completed.')

      // Step 2: 上传本地打包文件到远程服务器
      const startTime = dayjs() // 记录上传开始的时间
      console.log('Uploading files...')
      await ssh.putDirectory(distDir, serverDir)
      console.log('Files uploaded successfully.')
      const endTime = dayjs() // 记录上传完成的时间
      // 计算总耗时
      const duration = endTime.diff(startTime, 'second') // 以秒为单位计算时间差
      console.log(`Total upload time: ${duration} seconds`)

      // Step 3: 断开连接
      ssh.dispose()
    } catch (error) {
      console.error('Error during deployment:', error)
    }
  })
  .catch((err) => {
    console.error('SSH connection error:', err)
  })
```

## package.json
```json
{
    "scripts": {
         "build:test-deploy": "rimraf dist-test && vite build --mode test && node deploy.js"
    }
}
```