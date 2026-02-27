<script setup lang="ts">
import { ref } from 'vue'
import GameCanvas from './components/GameCanvas.vue'

type InputMode = 'keyboard' | 'gyro'

const inputMode = ref<InputMode>('keyboard')
const gyroSupported = ref<boolean>(false)
const sensitivity = ref<number>(1.0)
const isMobileDevice = ref<boolean>(false)

function checkGyroSupport() {
  if (typeof window === 'undefined') return

  const hasOrientation = 'DeviceOrientationEvent' in window
  const hasMotion = 'DeviceMotionEvent' in window

  gyroSupported.value = hasOrientation || hasMotion
}

function detectDeviceType() {
  if (typeof navigator === 'undefined') return

  const ua = navigator.userAgent || ''
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i
  isMobileDevice.value = mobileRegex.test(ua)
}

function autoSelectInputMode() {
  detectDeviceType()
  checkGyroSupport()

  if (isMobileDevice.value && gyroSupported.value) {
    inputMode.value = 'gyro'
  } else {
    // 其他情況預設使用鍵盤
    inputMode.value = 'keyboard'
  }
}

autoSelectInputMode()
</script>

<template>
  <div class="app-root">
    <GameCanvas :input-mode="inputMode" :sensitivity="sensitivity" />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top, #222 0, #05070a 55%, #000 100%);
}

.app-root :deep(canvas) {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
