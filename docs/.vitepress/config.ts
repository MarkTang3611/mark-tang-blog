import { defineConfig } from 'vitepress'

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig(
  {
    title: "MarkTang的博客",
    description: "一个基于 VitePress 的个人博客",
    themeConfig: {
      nav: [
        { text: "首页", link: "/" },
        { text: "关于", link: "/about" }
      ],
      sidebar: [
        {
          text: "博客文章",
          items: [
            { text: "第一篇文章", link: "/posts/first-post" },
            { text: "第二篇文章", link: "/posts/second-post" }
          ]
        }
      ]
    }
  }
)
