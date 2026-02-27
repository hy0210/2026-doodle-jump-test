<script setup lang="ts">
import { ref } from 'vue'
import GameCanvas from './components/GameCanvas.vue'

type InputMode = 'keyboard' | 'gyro'

const inputMode = ref<InputMode>('keyboard')
const gyroSupported = ref<boolean>(false)
const sensitivity = ref<number>(1.0)
const isMobileDevice = ref<boolean>(false)
const showOverlay = ref<boolean>(true)

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

async function handlePlayClick() {
  detectDeviceType()
  checkGyroSupport()

  if (isMobileDevice.value && gyroSupported.value) {
    try {
      const anyDeviceOrientation = DeviceOrientationEvent as any
      if (anyDeviceOrientation?.requestPermission) {
        const result = await anyDeviceOrientation.requestPermission()
        if (result === 'granted') {
          inputMode.value = 'gyro'
        } else {
          inputMode.value = 'keyboard'
        }
      } else {
        // 非 iOS，但裝置支援陀螺儀，直接使用
        inputMode.value = 'gyro'
      }
    } catch (e) {
      console.error(e)
      inputMode.value = 'keyboard'
    }
  } else {
    inputMode.value = 'keyboard'
  }

  showOverlay.value = false
}
</script>

<template>
  <div class="app-root">
    <GameCanvas :input-mode="inputMode" :sensitivity="sensitivity" />

    <div v-if="showOverlay" class="overlay">
      <button class="play-button" type="button" @click="handlePlayClick">
        Play
      </button>
    </div>
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

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.play-button {
  padding: 0.8rem 2rem;
  font-size: 1.2rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #041106;
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.6);
}
</style>
