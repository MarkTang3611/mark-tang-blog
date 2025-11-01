> 实现electron应用往windows注册表写注册项，支持在web系统中使用`window.location.href='openApp://'`打开应用。

# 版本

+ electron：31.0.2
+ vite：5.3.1
+ vue：3.4.30
+ regedit：5.1.3
+ sudo-prompt: 9.2.1

# 1、采用regedit方式添加注册项

## 添加注册项代码

```typescript
import { app } from 'electron'
import regedit from 'regedit'

export const addToRegistry = () => {
  console.log('注册自定义注册表openApp')
  // 获取应用程序路径
  const applicationPath = app.getPath('exe') // 或者通过其他方式获取路径

  console.log(applicationPath)

  const protocolKey = 'HKCR\\openApp'

  // 检查是否已经存在注册表条目，如果不存在则创建
  regedit.list([protocolKey], (err, result) => {
    if (err) {
      console.error('Error reading registry:', err)
      return
    }
    if (result && result[protocolKey] && result[protocolKey]['exists']) {
      console.log('Registry key exists:', result[protocolKey])
      return
    } else {
      console.log('Registry key does not exist.')
    }
    regedit.createKey([protocolKey, `${protocolKey}\\Shell\\Open\\Command`], (err) => {
      if (err) {
        console.error('Error creating key:', err)
        return
      }
      console.log('写入注册值')
      regedit.putValue(
        {
          [protocolKey]: {
            'URL Protocol': { value: '', type: 'REG_SZ' }
          },
          [`${protocolKey}\\Shell\\Open\\Command`]: {
              default: { value: `"${applicationPath}"`, type: 'REG_DEFAULT' }
          }
        },
        (err) => {
          if (err) {
            console.error('Error writing to registry:', err)
          } else {
            console.log('Registry entry created successfully!')
          }
        }
      )
    })
  })
}
```

## 主线程使用

```typescript
app.whenReady().then(() => {
    addToRegistry()
})
```

## 测试代码

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <button onclick="window.location.href='openApp://'">打开 openApp</button>
</body>
</html>

```

## 遇到的问题

### 编译的安装包无法写注册项

提示错误：`Error: Command failed: cscript.exe //Nologo D:\CodeLathe\Workspace\cl-fc-client\clouddrive2service\ui\dist_electron\win-unpacked\resources\app.asar\vbs\regList.wsf A HKCU\SOFTWARE`

解决方案：

```json
// package.json文件中
"build": {
    "extraResources": [
      {
        "from": "node_modules/regedit/vbs",
        "to": "vbs",
        "filter": [
          "**/*"
        ]
      }
    ]
}

// 使用regedit的文件中
import regedit from 'regedit'

regedit.setExternalVBSLocation('./resources/vbs')
```

### 注册项无法被使用

控制台提示错误：`Failed to launch 'openApp://' because the scheme does not have a registered handler.`

刚开始本人使用的是`HKCU\\openApp`，这样注册项是写在`HKEY_CURRENT_USER`：

![](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/110eac80834045b5b3f27ef0e54b43fa~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6auY57qn5pCs56CW5bel56iL5biIMjc1:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiNDIxMjk4NDI4OTQyNzkwMiJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1741762458&x-orig-sign=XRc%2BKNeb8yAHLizb1lhA9%2B8UNgg%3D)

web系统使用`window.location.href='openApp://'`无法打开我们的electron应用，只有在`HKEY_CLASSES_ROOT`的注册项，才可以被调用，从而打开electron应用。

将`HKCU改为HKCR`，注册项就会写在`HKEY_CLASSES_ROOT`中，但是需要管理员权限才可以，否则会写入失败。

```json
// package.json文件中
"build": {
   "win": {
      "requestedExecutionLevel": "requireAdministrator",
   }
}
```

# 2、采用批处理方式添加注册项
> 在第一种方式中，采用`regedit`添加注册项，如果要写在`HKEY_CLASSES_ROOT`中，需要应用获取管理员权限，如果用户没有管理员权限，会出现应用闪退的情况，为了解决闪退的情形，采用批处理方式来添加注册项。

## 添加注册项代码
```typescript
import { app, shell } from 'electron'
import sudo from 'sudo-prompt'
import path from 'path'
import { exec } from 'child_process'

/**
 * 检查注册项是否存在
 * @param {string} key - 注册表路径（例如：HKEY_CLASSES_ROOT\your_app_protocol）
 * @returns {Promise<boolean>} - 返回 true 表示存在，false 表示不存在
 */
 const checkRegistryKeyExists = (key) => {
  console.log(key)
  return new Promise((resolve, reject) => {
    exec(`reg query "${key}"`, (error, stdout, stderr) => {
      if (error) {
        // 如果注册项不存在，reg query 会返回错误
        resolve(false)
      } else {
        // 如果注册项存在，stdout 会包含注册表信息
        resolve(true)
      }
    })
  })
}

// 往注册表添加注册项openApp
const registerApp = async () => {
  const has = await checkRegistryKeyExists(`HKEY_CLASSES_ROOT\\openApp\\shell\\open\\command`)
  if (has) {
    logger.log('注册项openApp已存在')
    return
  }
  await sleep(3000)
  // 获取应用路径
  const appPath = app.getPath('exe')
  // 批处理文件路径
  let batFilePath
  if (app.isPackaged) {
    // 打包后使用 process.resourcesPath
    batFilePath = path.join(process.resourcesPath, 'register_app.bat')
  } else {
    // 开发时使用相对路径
    batFilePath = path.join(__dirname, '../../resources/register_app.bat')
  }
  const options = { name: 'InvisibleApp' }

  logger.log('添加注册项openApp')
  logger.log('batFilePath：', batFilePath)
  logger.log('appPath', appPath)

  const command = `"${batFilePath}" "${appPath}"`

  sudo.exec(command, options, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      logger.error(`Stderr: ${stderr}`)
      return
    }
    logger.log(`Stdout: ${stdout}`)
  })
}
```

## 执行脚本register_app.bat
```bat
@echo off
setlocal enabledelayedexpansion

:: 获取应用路径
set APP_PATH=%~1

echo add HKEY_CLASSES_ROOT.

:: 添加注册表项
reg add "HKEY_CLASSES_ROOT\openApp" /v "URL Protocol" /t REG_SZ /d "" /f

echo Registration openApp.

reg add "HKEY_CLASSES_ROOT\openApp\shell\open\command" /v "" /t REG_SZ /d "\"!APP_PATH!\" \"%%1\"" /f

echo Registration shell\open\command.

echo Successfully added openApp registry entry.
```

> 采用批处理添加注册项的好处就是，批处理就算执行出错，也不影响应用的启动，从而避免应用闪退的问题。

