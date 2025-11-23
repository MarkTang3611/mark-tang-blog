## 通过ID滚动到对应的区域
```ts
// 通过Id滚动界面
export const scrollIntoViewById = (id: string) => {
  if (typeof id !== 'string') {
    return;
  }
  setTimeout(() => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth', // 平滑滚动
        block: 'start', // 垂直对齐方式 (start, center, end, nearest)
      });
    }
  }, 100);
};
```