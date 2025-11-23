import { defineConfig } from 'vitepress';

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
  title: 'MarkTang的博客',
  description: '一个基于 VitePress 的个人博客',
  base: '/mark-tang-blog/',
  themeConfig: {
    outline: {
      level: [1, 2], // 默认值：显示 <h2> 和 <h3> 标题
      label: '页面导航' // 标题名称，默认是 'On this page'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '关于', link: '/about' },
      { text: '简历', link: '/resume' }
    ],
    sidebar: [
      {
        text: 'Vue',
        items: [
          { text: '封装指令', link: '/posts/vue/postting-directives' },
        ]
      },
      {
        text: '功能封装',
        items: [
          { text: '微信小程序Api', link: '/posts/postting/wx-api' },
          { text: 'web端Api', link: '/posts/postting/web-api' }
        ]
      },
      {
        text: '组件封装',
        items: [{ text: '上门取件时间选择组件', link: '/posts/components/visit-time' }]
      },
      {
        text: 'electron',
        items: [
          {
            text: '使用electron+vue3+ts+vite搭建桌面端项目',
            link: '/posts/electron/create-electron'
          },
          {
            text: '实现electron应用往windows注册表写注册项',
            link: '/posts/electron/electron-registry'
          },
          { text: '基于electron应用实现截图', link: '/posts/electron/print-screen' }
        ]
      },
      {
        text: '其他',
        items: [{ text: 'vite工程的自动编译并上传测试环境', link: '/posts/other/deploy' }]
      }
    ]
  }
});
