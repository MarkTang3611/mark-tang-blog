> 抖音的昵称组件，在用户点击显示后，是基于 `iframe` 加载昵称，由于浏览器的跨域限制，我们无法直接读取 `iframe` 的文字，故，使用 `electron` 的截图功能，来实现对抖音昵称的提取。

# 版本
+ electron：31.0.2
+ vite：5.3.1
+ vue：3.4.30
+ puppeteer: 24.3.0
+ puppeteer-core：24.3.0
+ puppeteer-in-electron：3.0.5
+ potrace：2.1.8

# 1、使用puppeteer截图

> 截图效果很好，但需要用户电脑拥有谷歌内核并配置。

## 截图代码

```typescript
import puppeteer from 'puppeteer'

// 截图功能
const captureElementScreenshot = async (url: string) => {
  // 启动 Puppeteer 浏览器实例
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  // 打开页面并等待加载完成
  await page.goto(url, { waitUntil: 'networkidle0' })

  await page.evaluate(async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('')
      }, 2000) // 模拟 3 秒后内容加载完成
    })
  })

  // 截取特定 DOM 元素
  const element = await page.$('#nick-name') // 通过选择器找到目标元素
  if (element) {
    const screenshotBase64 = await element.screenshot({
      encoding: 'base64',
      type: 'jpeg',
      quality: 100
    }) // 仅截图该元素
    await browser.close()
    logger.info('screenshotBase64', screenshotBase64)
    return screenshotBase64
  }

  await browser.close()
  throw new Error('Element not found')
}

// 使用
const screenshot = await captureElementScreenshot(url)
return screenshot
```

> 其中，`url` 是页面加载的路径

# 2、使用 puppeteer-core + electron 窗口

> 此方法不依赖于谷歌内核，但是需要依赖于 `potrace` 将图片的 `png` 转化为 `svg` 格式，这是我们自己的业务需要，此步骤如果不需要可以省略。

## 截图代码

```typescript

// 主线程代码
import puppeteer from 'puppeteer-core'
import potrace from 'potrace'
import pie from 'puppeteer-in-electron'

const main = async () => {
  await pie.initialize(app)
}

main()

// 监听截图请求
ipcMain.handle('capture-element-screenshot', async (event, url: string) => {
      const window = new BrowserWindow({
        width: 1920,
        height: 1080,
        show: false, // 不显示窗口
        webPreferences: {
          offscreen: true // 启用离屏渲染
        }
      })
      const pngPath = 'nick-name.png'
      // 最小化窗口或执行其他操作
      try {
        const browser = await pie.connect(app, puppeteer as any)
        const page = await pie.getPage(browser, window)
        await page.goto(url, { waitUntil: 'networkidle0' })
        // 等待页面加载完成
        logger.info('加载页面！')

        await sleep(5000)

        const element = await page.$('#nick-name')
        if (!element) {
          return ''
        }
        logger.info('开始截图')

        await element.screenshot({ path: pngPath }) // 仅截图该元素
      } catch (error) {
        logger.error('截图失败')
        return ''
      }
      logger.info('截图成功')
      return new Promise<string>((resolve, reject) => {
        potrace.trace(
          pngPath,
          {
            turdsize: 0, // 增加细节的捕捉，减少噪点
            opttolerance: 0.2,
            alphamax: 0.0, // 控制平滑度，适度调整
            threshold: 192,
            optcurve: true // 优化曲线，可能帮助保留更多细节
          },
          (err, svg) => {
            if (err) {
              logger.error('png转换svg失败:', err)
              reject('')
            } else {
              // 删除临时 PNG 文件
              fs.unlinkSync(pngPath)
              window.destroy()
              resolve(svg)
            }
          }
        )
      })
    })
  })
```