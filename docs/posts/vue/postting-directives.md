## 复制文本指令
```ts
import { DirectiveBinding, nextTick, h, render } from 'vue';
import type { App } from 'vue';
import { CopyTwoTone } from '@ant-design/icons-vue';
import { copyEvent } from '/@/utils/util';

export function copyText(app: App) {
  app.directive('copy-text', {
    mounted(el: HTMLElement, binding: DirectiveBinding<any>) {
      // 确保元素有文本内容
      const text = el.textContent?.trim();
      if (!text) {
        console.warn('v-copy-text: 元素没有文本内容');
        return;
      }

      // 添加指定的类名
      if (binding.value?.class) {
        el.classList.add(binding.value?.class);
      }

      // 创建图标容器
      const iconContainer = document.createElement('span');
      iconContainer.classList.add('data-copy-icon');
      iconContainer.style.marginLeft = '8px';
      iconContainer.style.cursor = 'pointer';
      Object.assign(iconContainer.style, binding.value?.iconStyle || {});

      // 使用 Vue 的渲染函数创建 CopyTwoTone 图标
      const vnode = h(CopyTwoTone, {
        onClick: async (e: MouseEvent) => {
          e.stopPropagation();
          copyEvent(text);
        },
      });

      // 渲染图标到容器
      render(vnode, iconContainer);

      // 添加图标到元素
      el.appendChild(iconContainer);
    },

    beforeUnmount(el: HTMLElement) {
    },
  });
}

// <template>
//   <div>
//     <!-- 基本用法 -->
//     <p v-copy-text>这是要复制的文本</p>

//     <!-- 带自定义类名 -->
//     <p v-copy-text="{ class: 'copyable-text' }">带样式的可复制文本</p>

//     <!-- 带所有配置 -->
//     <p v-copy-text="{
//       class: 'custom-copy',
//       iconStyle: {
//         fontSize: '18px',
//         color: '#1890ff'
//       }
//     }">完全配置的可复制文本</p>
//   </div>
// </template>

```