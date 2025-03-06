import { defineConfig } from 'vitepress';

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
  title: 'MarkTang的博客',
  description: '一个基于 VitePress 的个人博客',
  base: '/mark-tang-blog/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '关于', link: '/about' }
    ],
    sidebar: [
      {
        text: 'electron',
        items: [{ text: '使用electron+vue3+ts+vite搭建桌面端项目', link: '/posts/create-electron' }]
      }
    ]
  }
});
