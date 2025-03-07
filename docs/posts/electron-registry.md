实现electron应用往windows注册表写注册项，支持在web系统中使用`window.location.href='openApp://'`打开应用。

# 版本

+ electron：31.0.2
+ vite：5.3.1
+ vue：3.4.30
+ regedit：5.1.3

# 代码

## 添加注册项代码

```typescript
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

# 遇到的问题

## 编译的安装包无法写注册项

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

## 注册项无法被使用

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

