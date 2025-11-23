# 上门取件时间选择组件
## 微信小程序上门时间选择弹出框
```vue
<!-- 上门时间弹出框 -->
<template>
  <uni-popup class="visit-time-popup" ref="popupRef" :background-color="'rgb(255, 255, 255, 0)'" type="bottom" :safe-area="false">
    <view class="visit-time-popup-box">
      <view class="popup-header">
        <view class="confirm-bt"></view>
        <view class="popup-title">选择上门时间</view>
        <image class="popup-close" src="@/static/common/close.png" @click="close" mode="scaleToFill" />
      </view>
      <view class="visit-time-box">
        <view class="left-day-box">
          <view
            class="day-item"
            :class="{ 'day-select': visitData.day === item.value }"
            v-for="item in dayList"
            :key="item.value"
            @click="changeDay(item.value, item.label)"
            >{{ item.label }}</view
          >
        </view>
        <view class="right-time-box">
          <view
            class="time-row"
            v-for="time in dayList[visitData.day].timeList"
            :key="time.value"
            @click="changeTime(time)"
            :class="{ 'time-select': visitData.time === time.value }"
          >
            <view class="time-text">{{ time.label }}</view>
            <image class="selected-icon" v-if="time.value === visitData.time" src="@/static/common/selected.png" mode="scaleToFill" />
          </view>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import dayjs from 'dayjs';

  const emits = defineEmits(['selectTime']);

  const popupRef = ref();

  const dayList = ref([
    { label: '今天', value: 0, timeList: [] },
    { label: '明天', value: 1, timeList: [] },
    { label: '后天', value: 2, timeList: [] },
  ]);

  const visitData = ref({
    day: 0, // 默认选择今天
    dayLabel: '今天',
    time: 0, // 默认选择立即取件
    timeLabel: '立即取件',
    pickupStartTime: '',
    pickupEndTime: '',
  });

  const close = () => {
    popupRef.value?.close();
  };

  const open = (initData) => {
    popupRef.value?.open();
    visitData.value = initData || { day: 0, time: 0 }; // 重置选择天的第一个时间段
  };

  const initTimes = () => {
    dayList.value.forEach((day) => {
      day.timeList = [];
      let start = 9;
      if (day.value === 0) {
        day.timeList.push({
          label: '立即取件',
          value: 0,
          pickupStartTime: dayjs().format('HH:mm'),
          pickupEndTime: dayjs().add(1, 'hour').format('HH:mm'),
        });
        visitData.value.pickupStartTime = dayjs().format('HH:mm');
        visitData.value.pickupEndTime = dayjs().add(1, 'hour').format('HH:mm');
        setTimeout(() => {
          emits('selectTime', visitData.value);
        }, 500);
        start = new Date().getHours() + 1; // 今天从当前小时开始
      }
      for (let i = start; i < 19; i++) {
        day.timeList.push({ label: `${i}:00-${i + 1}:00`, value: i, pickupStartTime: `${i}:00`, pickupEndTime: `${i + 1}:00` });
      }
    });
  };

  initTimes();

  const changeTime = (timeObj) => {
    visitData.value.time = timeObj.value;
    visitData.value.timeLabel = timeObj.label;
    visitData.value.pickupStartTime = timeObj.pickupStartTime;
    visitData.value.pickupEndTime = timeObj.pickupEndTime;
    emits('selectTime', visitData.value);
    close();
  };

  const changeDay = (value, label) => {
    visitData.value.day = value;
    visitData.value.dayLabel = label;
    const timeList = dayList.value[value].timeList;
    if (timeList.length > 0) {
      visitData.value.time = timeList[0].value; // 重置时间为当天的第一个时间段
      visitData.value.timeLabel = timeList[0].label;
      visitData.value.pickupStartTime = timeList[0].pickupStartTime;
      visitData.value.pickupEndTime = timeList[0].pickupEndTime;
    }
    emits('selectTime', visitData.value);
  };

  defineExpose({
    open,
    close,
  });
</script>

<style scoped lang="scss">
  .visit-time-popup {
    :deep(.uni-popup__wrapper) {
      border-top-left-radius: 30rpx;
      border-top-right-radius: 30rpx;
    }
  }
  .visit-time-popup-box {
    position: relative;
    background-color: #fff;
    height: 50vh;
    border-top-left-radius: 30rpx;
    border-top-right-radius: 30rpx;
    // padding: 32rpx;
    padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  }
  .popup-header {
    display: flex;
    align-items: center;
    padding: 32rpx;
    justify-content: space-between;
  }
  .confirm-bt {
    color: #fff;
    font-size: 28rpx;
    margin-top: 20rpx;
  }
  .popup-title {
    display: flex;
    justify-content: center;
    font-weight: bold;
    font-size: 34rpx;
    color: #282828;
    line-height: 1.5;
    margin-left: 20rpx;
  }
  .popup-close {
    width: 48rpx;
    height: 48rpx;
  }
  .time-select {
    color: #277bff;
  }
  .visit-time-box {
    display: flex;
    gap: 40rpx;
    margin-top: 32rpx;
    height: calc(100% - 180rpx);
    .left-day-box {
      width: 316rpx;
      .day-item {
        background: #f6f6f6;
        height: 124rpx;
        font-weight: 500;
        font-size: 30rpx;
        color: #282828;
        line-height: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        // border-radius: 0rpx 16rpx 16rpx 0rpx;
      }
      .day-select {
        background: #fff;
        border-radius: 0;
      }
    }
    .right-time-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 40rpx;
      padding-right: 32rpx;
      overflow-y: auto;
      .time-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .time-text {
        font-weight: 500;
        font-size: 30rpx;
        line-height: 44rpx;
      }
      .selected-icon {
        width: 40rpx;
        height: 40rpx;
        flex-shrink: 0;
      }
    }
  }
</style>

```

## web 端上门时间选择组件
```vue
<template>
  <a-cascader :allowClear="allowClear" :class="className" v-model:value="value" :options="options" :placeholder="placeholder" @change="onChange" />
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import dayjs from 'dayjs';

  const emits = defineEmits(['selectTime']);

  const props = defineProps({
    initVal: {
      type: String,
      default: '',
    },
    className: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '请选择上门时间',
    },
    allowClear: {
      type: Boolean,
      default: false,
    },
  });

  const options = ref<any[]>([
    { label: '今天', value: 0, children: [] },
    { label: '明天', value: 1, children: [] },
    { label: '后天', value: 2, children: [] },
  ]);

  const visitData = ref({
    day: 0, // 默认选择今天
    dayLabel: '今天',
    time: 0, // 默认选择立即取件
    timeLabel: '立即取件',
    pickupStartTime: '',
    pickupEndTime: '',
  });

  const value = ref<number[]>([0, 0]);

  const initTimes = () => {
    options.value.forEach((day) => {
      day.children = [];
      let start = 9;
      if (day.value === 0) {
        day.children.push({
          label: '立即取件',
          value: 0,
          pickupStartTime: dayjs().format('HH:mm'),
          pickupEndTime: dayjs().add(1, 'hour').format('HH:mm'),
        });
        visitData.value.pickupStartTime = dayjs().format('HH:mm');
        visitData.value.pickupEndTime = dayjs().add(1, 'hour').format('HH:mm');
        setTimeout(() => {
          emits('selectTime', visitData.value);
        }, 500);
        start = new Date().getHours() + 1; // 今天从当前小时开始
      }
      for (let i = start; i < 19; i++) {
        day.children.push({ label: `${i}:00-${i + 1}:00`, value: i, pickupStartTime: `${i}:00`, pickupEndTime: `${i + 1}:00` });
      }
    });
  };

  initTimes();

  const onChange = (value, selectedOptions) => {
    console.log(selectedOptions);
    if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
      for (let i = 0; i < selectedOptions.length; i++) {
        const options = selectedOptions[i];
        if (i === 0) {
          visitData.value.day = options.value;
          visitData.value.dayLabel = options.label;
        }
        if (i === 1) {
          visitData.value.time = options.value;
          visitData.value.timeLabel = options.label;
          visitData.value.pickupStartTime = options.pickupStartTime;
          visitData.value.pickupEndTime = options.pickupEndTime;
        }
      }
      emits('selectTime', visitData.value);
    }
  };
</script>

<style scoped lang="less"></style>
```