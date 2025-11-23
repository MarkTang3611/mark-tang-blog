# 微信小程序功能的封装
## 查看预览图片
```js
export const previewImage = (arr, urlKey, index = 0) => {
  if (Array.isArray(arr)) {
    const imgsList = arr.map((item) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item[urlKey]) {
        return item[urlKey];
      }
      return '';
    });
    if (imgsList.length === 0) {
      return;
    }
    uni.previewImage({
      current: index, // 当前显示图片的http链接
      urls: imgsList, // 需要预览的图片http链接列表
      fail: (err) => {
        console.error('预览图片失败:', err);
      },
    });
  }
};
```

## 预览文件，支持分享下载
```js
export const previewFileInWechatMiniProgram = (fileUrl, fileName) => {
  console.log('预览文件:', fileUrl, fileName);
  if (!fileUrl) {
    SmartToast.toast('文件链接不能为空');
    return;
  }
  if (isImageFile(fileUrl)) {
    // 预览图片
    uni.previewImage({
      urls: [fileUrl],
      current: fileUrl,
      success: function () {
        uni.$emit('previewSuccess');
      },
    });
  } else {
    const fileExt = getWechatFileType(fileUrl);
    if (!fileExt) {
      SmartToast.toast('不支持预览此文件类型');
      return;
    }
    // 预览其他文件（需要先下载）
    SmartLoading.show('正在下载文件...');
    uni.downloadFile({
      url: fileUrl,
      success: function (res) {
        const filePath = res.tempFilePath;
        SmartLoading.hide();
        if (res.statusCode !== 200) {
          SmartToast.toast('文件下载失败');
          return;
        }
        wx.openDocument({
          filePath: filePath,
          fileType: fileExt,
          showMenu: true, // 显示右上角菜单
          success: function (res) {
            uni.$emit('previewSuccess');
          },
          fail: function (err) {
            console.error('打开文档失败', err);
            SmartToast.toast('不支持预览此文件类型');
          },
        });
      },
    });
  }
};

export const getWechatFileType = (fileUrl) => {
  const ext = fileUrl.split('.').pop().toLowerCase();
  const typeMap = {
    pdf: 'pdf',
    doc: 'doc',
    docx: 'docx',
    xls: 'xls',
    xlsx: 'xlsx',
    ppt: 'ppt',
    pptx: 'pptx',
    txt: 'txt',
  };
  return typeMap[ext] || '';
};
```

## px转rpx
```js
export const pxToRpx = (px) => {
  const screenWidth = uni.getSystemInfoSync().windowWidth; // 单位：px
  return (px * 750) / screenWidth;
};
```

## 计算可滚动视图区域组件（scroll-view）的高度
```js
import { ref, nextTick, watch } from 'vue';
import { pxToRpx } from '@/utils/util';

export function useScrollViewHieght(num = 0) {
  const scrollViewHeight = ref(0);
  const minus = ref(num);

  const computedHeight = () => {
    const systemInfo = uni.getSystemInfoSync();

    scrollViewHeight.value = pxToRpx(systemInfo.windowHeight) - minus.value - pxToRpx(12);
  };

  watch(
    minus,
    () => {
      nextTick(() => {
        computedHeight();
      });
    },
    {
      immediate: true,
    }
  );

  return {
    scrollViewHeight,
    minus,
  };
}

# 使用
 <scroll-view
    :scroll-y="true"
    :style="{ height: scrollViewHeight + 'rpx', background: '#f6f6f6' }"
    :scroll-x="false"
    @scrolltolower="refreshData"
    :lower-threshold="10"
  >
 </scroll-view>
 
const { scrollViewHeight, minus } = useScrollViewHieght(180);

```