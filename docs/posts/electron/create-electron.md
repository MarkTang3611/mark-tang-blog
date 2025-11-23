# 版本
1. vue：3.4.30
2. electron-vite：2.3.0
3. electron：31.0.2
4. vite：5.3.1
5. typescript：5.4.5

# 使用electron-vite脚手架搭建
```shell
pnpm create @quick-start/electron

✔ Project name: … <electron-app>
✔ Select a framework: › vue
✔ Add TypeScript? … No / Yes
✔ Add Electron updater plugin? … No / Yes
✔ Enable Electron download mirror proxy? … No / Yes

Scaffolding project in ./<electron-app>...
Done.
```

使用这个命令搭建的electron项目，在运行的时候，是没问题的，但是在使用 `pnpm build:win` 构建项目的时候，就会报错：

```bash
PS E:\learn\xy-print> pnpm build:win

> xy-print@1.0.0 build:win E:\learn\xy-print  
> npm run build && electron-builder --win

> xy-print@1.0.0 build  
> npm run typecheck && electron-vite build

> xy-print@1.0.0 typecheck  
> npm run typecheck:node && npm run typecheck:web

> xy-print@1.0.0 typecheck:node  
> tsc --noEmit -p tsconfig.node.json --composite false

> xy-print@1.0.0 typecheck:web  
> vue-tsc --noEmit -p tsconfig.web.json --composite false

E:\learn\xy-print\node_modules.pnpm\vue-tsc@2.1.10_typescript@5.7.2\node_modules\vue-tsc\index.js:34  
throw err;  
^  
Search string not found: "/supportedTSExtensions = .*(?=;)/"  
(Use `node --trace-uncaught ...` to show where the exception was thrown)

Node.js v22.11.0
```

在查阅资料后发现是因为`vue-tsc与typescrip`版本不兼容导致的，将`typescrip`版本改为`5.4.5`就可以正常运行构建。

github讨论的链接：[https://github.com/alex8088/electron-vite/issues/672](https://github.com/alex8088/electron-vite/issues/672)

# 支持用户自定义安装路径
```json
  "build": {
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico",
      "installerHeaderIcon": "build/icon.ico",
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico",
      "requestedExecutionLevel": "highestAvailable"
    }
  },
```

默认用户双击打包后的安装包，是直接安装的，使用以上在`package.json`配置就可以实现让用户自定义安装的路径。

# 配置日志
```shell
pnpm add electron-log
```

日志可采用electron-log插件，当然了，也可以用其他插件。

本人在`src/utils/log.ts`文件中配置日志，配置数据如下：

```typescript
import log from 'electron-log/main'
import { app } from 'electron'
import path from 'path'

log.initialize()

// 获取应用的安装目录路径
const installPath = path.dirname(app.getPath('exe'))

// 设置日志文件路径到安装路径
log.transports.file.resolvePath = () => path.join(installPath + '/logs', 'app.log')

log.transports.console.level = 'debug' // 控制台输出的日志等级
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] {level}: {text}' // 自定义控制台输出的日志格式
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}]: {text}' // 自定义文件日志格式
log.transports.file.level = process.env.NODE_ENV === 'development' ? false : 'info' // 设置日志写入文件的级别

// 设置日志文件最大大小为 5MB，超过该大小会自动滚动
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB

export default log
```

以上配置支持指定日志文件路径、文件在控制台和日志文件的输出格式、设置日志级别和日志文件的大小等，更多配置信息，可看：[https://www.npmjs.com/package/electron-log](https://www.npmjs.com/package/electron-log)

同样，日志也支持在渲染进程使用：

```vue
import log from 'electron-log/renderer'

log.info('测试日志输出')
```

但是呢，需要在`src/preload/index.ts`文件中增加配置：`import 'electron-log/preload'`,否则渲染进程（浏览器的console）会报错：`electron-log: logger isn't initialized in the main process`

# 滚动日志
使用 `electron-log` 无法实现滚动日志和自动清除等功能；  
经查询采用插件 `winston 和 winston-daily-rotate-file` 来实现以上功能；

```typescript
import winston from 'winston'
import 'winston-daily-rotate-file'
import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'

// 定义日志格式，包含时间戳
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // 时间戳格式
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}]: ${message}`
  })
)

const logTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '5m', // 每个日志文件最大5MB
  maxFiles: '7d', // 最多保留7天的日志文件
  format: logFormat // 使用自定义的日志格式
})

// 创建日志记录器
const logger = winston.createLogger({
  level: 'info', // 默认日志级别为 'info'
  transports: [
    logTransport,
    new winston.transports.Console({ format: logFormat }) // 控制台输出
  ]
})

// 监听渲染进程发送的日志信息
ipcMain.handle('log-info', (event, message) => {
  if (!is.dev) {
    logger.info(message) // 记录日志
  }
})

ipcMain.handle('log-error', (event, message) => {
  if (!is.dev) {
    logger.error(message) // 记录错误日志
  }
})

export default logger

```

以上配置，包含日志文件的大小、保存时间和渲染进程怎么将日志输出到日志文件中；  
在渲染进程可以使用 `window.electron.ipcRenderer.invoke('log-info', msg)`触发。

代码存放位置：`src/utils/log.ts`

当然了，如果项目不需要滚动日志和自动清除的话，其实使用 `electron-log` 也是足够了。

# 自动更新
使用`electron-updater`插件实现`electron`应用的自动更新，使用`anywhere`插件实现本地的调试；

## 配置
在`package.json`文件增加配置：

```json
  "build": {
    "publish": {
      "provider": "generic",
      "url": "http://192.168.25.194:8000/updates/"
    },
  },
```

以上配置编译后会生成`latest.yml`文件

## 启动anywhere
```bash
npm install -g anywhere

// 系统的任意一个文件夹中使用anywhere命令启动一个服务
anywhere

// 启动完成之后，新建一个updates文件夹，之后将编译好的文件复制到updates下
```

## 完整更新代码
```typescript
import { autoUpdater } from 'electron-updater'
import { ipcMain, BrowserWindow } from 'electron'
import logger from './log'

let mainWindow: BrowserWindow | null = null

export const initUpdater = (win) => {
  mainWindow = win

  logger.info('初始化更新。。。')

  // 自定义服务器地址
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'http://192.168.25.194:8000/updates/'
  })

  autoUpdater.logger = logger

  autoUpdater.autoDownload = true

  // 开启本地dev调试
  autoUpdater.forceDevUpdateConfig = true

  // 检查更新
  autoUpdater.checkForUpdates()

  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('update-not-available', () => {
    logger.info('无新版本')
  })

  autoUpdater.on('update-available', () => {
    logger.info('检测到新版本')
    mainWindow?.webContents.send('update-available')
  })

  autoUpdater.on('error', (error) => {
    logger.error('更新错误：', JSON.stringify(error))
  })

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    logger.info(`下载安装包进度: ${progress.percent}%`)
  })

  autoUpdater.on('update-downloaded', () => {
    logger.info('下载完成，是否立即安装更新？')
    mainWindow?.webContents.send('update-downloaded')
  })
}

export const install = () => {
  autoUpdater.quitAndInstall()
}

ipcMain.on('install-update', () => {
  install()
})

```

在主线程引入：

```typescript
import { initUpdater } from '../utils/updater'

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    setTimeout(() => {
      initUpdater(mainWindow)
    }, 5000)
  })
```

我是窗口显示5秒之后去检查更新的

## 渲染进程使用
`App.vue`文件

```vue
<template>
  <router-view />
</template>
<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'

window.electron.ipcRenderer.once('update-available', () => {
  ElMessage.warning('发现新版本，正在下载...')
})
window.electron.ipcRenderer.on('update-downloaded', () => {
  ElMessageBox.confirm('下载完成，是否立即安装更新？', '更新提醒', {
    confirmButtonText: '更新',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    window.electron.ipcRenderer.send('install-update')
  })
})
</script>

```

## 调试
1. 目前版本是1.0.0，在`package.json`文件修改版本为1.0.1；
2. 编译生成安装包，将生成的`app-name-1.0.1.exe、app-name-1.0.1.exe.blockmap和latest.yml`三个文件拷贝到`updates`文件夹下；
3. 将版本号改为1.0.0，使用命令`pnpm dev`启动服务，就可以开始调试了；

# 最小化托盘
主线程代码：

```typescript
  import { join } from 'path'
  import { Tray, Menu } from 'electron'

  let tray: any = null

  // 监听关闭事件，阻止默认的退出行为，改为最小化窗口
  mainWindow.on('close', (event) => {
    event.preventDefault() // 阻止窗口关闭
    mainWindow?.minimize() // 最小化窗口
    mainWindow?.setSkipTaskbar(true)
  })
  
  tray = new Tray(join(__dirname, '../../resources/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => mainWindow?.show() }, // 恢复窗口
    {
      label: '重启',
      click: () => {
        restartApp()
      }
    },
    {
      label: '退出',
      click: () => {
        mainWindow?.destroy()
      }
    }
  ])
  tray.setToolTip('我的app')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    // 我们这里模拟桌面程序点击通知区图标实现打开关闭应用的功能
    mainWindow?.isVisible() ? mainWindow?.hide() : mainWindow?.show()
    mainWindow?.isVisible() ? mainWindow?.setSkipTaskbar(false) : mainWindow?.setSkipTaskbar(true)
  })
```

# 渲染进程和主进程使用别名
![](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/c78b9d4786d74f6383a40173042e38bc~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6auY57qn5pCs56CW5bel56iL5biIMjc1:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiNDIxMjk4NDI4OTQyNzkwMiJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1741762297&x-orig-sign=7XdIAED%2F8nz8ZQFk5TaWs57vvmI%3D)

首先配置`vite`的配置文件`electron.vite.config.ts`，便于`vite`运行编译解析

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 主进程的vite配置
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src') // 将 @ 映射到 src 目录
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  // 渲染进程的vite配置
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src')
      }
    },
    plugins: [vue()],
    css: {
      preprocessorOptions: {}
    }
  }
})

```

之后配置`tsconfig.node.json和tsconfig.web.json`文件：

```json
tsconfig.node.json文件
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "include": [
    "electron.vite.config.*",
    "src/main/**/*",
    "src/preload/**/*",
    "src/utils/**/*",
    "src/**/*"
  ],
  "compilerOptions": {
    "composite": true,
    "types": [
      "electron-vite/node"
    ],
    "noUnusedLocals": false, // 允许未使用的局部变量
    "noUnusedParameters": false, // 允许未使用的函数参数
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ], // 映射 @ 到 src 目录
    },
  }
}

tsconfig.web.json文件
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "include": [
    "src/renderer/src/env.d.ts",
    "src/renderer/src/**/*",
    "src/renderer/src/**/*.vue",
    "src/preload/*.d.ts",
    "src/types/*.d.ts"
  ],
  "compilerOptions": {
    "composite": true,
    "noUnusedLocals": false, // 允许未使用的局部变量
    "noUnusedParameters": false, // 允许未使用的函数参数
    "baseUrl": ".",
    "paths": {
      "@renderer/*": [
        "src/renderer/src/*"
      ]
    },
  }
}
```

解决`ts`警告报错等；

最后，配置`tsconfig.json`文件，解决vscode警告:

```json
{
  "compilerOptions": {
    "baseUrl": ".", // 项目根目录
    "paths": {
      "@/*": [
        "src/*"
      ],
      "@renderer/*": [
        "src/renderer/src/*"
      ]
    }, // 解决vscode警告提示问题
  },
  "exclude": [
    "node_modules", // 排除第三方库
    "dist" // 排除打包后的文件夹
  ],
  "references": [
    {
      "path": "./tsconfig.node.json"
    },
    {
      "path": "./tsconfig.web.json"
    }
  ],
}
```

# 开机启动
```typescript
app.whenReady().then(() => {
  // 开机启动
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
      enabled: true,
      name: 'MyAppName'
    })
  }
})
```

使用以上代码就可以实现开机启动，但是如果win设置了需要管理员才能打开应用的话，开机启动这个功能就会失效，需要设置`"requestedExecutionLevel": "asInvoker"`，开机自启才可以成功！

