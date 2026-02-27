<script setup lang="ts">
import { ref, computed } from 'vue'
import GameCanvas from './components/GameCanvas.vue'

type InputMode = 'keyboard' | 'gyro'

const inputMode = ref<InputMode>('keyboard')
const gyroSupported = ref<boolean>(false)
const gyroEnabled = ref<boolean>(false)
const permissionError = ref<string | null>(null)
const sensitivity = ref<number>(1.0)

const inputStatusText = computed(() => {
  if (inputMode.value === 'keyboard') {
    return '目前使用鍵盤控制（← →），手機上可改用陀螺儀。'
  }
  if (!gyroSupported.value) {
    return '此裝置似乎不支援陀螺儀，已自動改用鍵盤／虛擬按鍵控制。'
  }
  if (!gyroEnabled.value) {
    return '裝置支援陀螺儀，請點擊「啟用陀螺儀」按鈕以開始使用。'
  }
  return '使用陀螺儀控制：左右傾斜手機即可移動角色。'
})

function checkGyroSupport() {
  if (typeof window === 'undefined') return

  const hasOrientation = 'DeviceOrientationEvent' in window
  const hasMotion = 'DeviceMotionEvent' in window

  gyroSupported.value = hasOrientation || hasMotion
}

async function enableGyro() {
  permissionError.value = null

  try {
    // iOS 13+ 需要使用者手勢觸發後請求權限
    const anyDeviceOrientation = DeviceOrientationEvent as any
    if (anyDeviceOrientation?.requestPermission) {
      const result = await anyDeviceOrientation.requestPermission()
      if (result !== 'granted') {
        permissionError.value = '使用者未授權使用陀螺儀，已維持鍵盤控制。'
        inputMode.value = 'keyboard'
        gyroEnabled.value = false
        return
      }
    }

    checkGyroSupport()

    if (!gyroSupported.value) {
      permissionError.value = '此裝置不支援陀螺儀。'
      inputMode.value = 'keyboard'
      gyroEnabled.value = false
      return
    }

    inputMode.value = 'gyro'
    gyroEnabled.value = true
  } catch (err) {
    console.error(err)
    permissionError.value = '啟用陀螺儀時發生錯誤，請改用鍵盤控制。'
    inputMode.value = 'keyboard'
    gyroEnabled.value = false
  }
}

checkGyroSupport()
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <h1 class="title">Jump Demo</h1>
      <p class="subtitle">Phaser 3 + Vue 3 + TypeScript</p>
    </header>

    <main class="layout">
      <section class="left-panel">
        <h2 class="panel-title">控制方式</h2>

        <div class="control-group">
          <label class="label">目前模式：</label>
          <p class="status-text">
            {{ inputStatusText }}
          </p>
        </div>

        <div class="control-group">
          <label class="label">選擇模式：</label>
          <div class="button-row">
            <button
              type="button"
              class="btn"
              :class="{ active: inputMode === 'keyboard' }"
              @click="inputMode = 'keyboard'"
            >
              鍵盤 / 虛擬按鍵
            </button>
            <button
              type="button"
              class="btn"
              :disabled="!gyroSupported"
              :class="{ active: inputMode === 'gyro' }"
              @click="enableGyro"
            >
              啟用陀螺儀
            </button>
          </div>
          <p v-if="!gyroSupported" class="hint">
            此裝置似乎不支援陀螺儀，或瀏覽器不允許使用。
          </p>
          <p v-if="permissionError" class="error">{{ permissionError }}</p>
        </div>

        <div class="control-group">
          <label class="label" for="sensitivity">陀螺儀靈敏度</label>
          <input
            id="sensitivity"
            v-model.number="sensitivity"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
          />
          <span class="hint">目前：{{ sensitivity.toFixed(1) }}</span>
        </div>

        <section class="instructions">
          <h2 class="panel-title">操作說明</h2>
          <ul>
            <li>桌機：使用鍵盤 ← → 移動角色。</li>
            <li>手機：點擊「啟用陀螺儀」，左右傾斜手機控制角色。</li>
            <li>碰到平台會自動彈跳，試著待在畫面中間！</li>
          </ul>
        </section>
      </section>

      <section class="right-panel">
        <GameCanvas :input-mode="inputMode" :sensitivity="sensitivity" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  padding: 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: radial-gradient(circle at top, #222 0, #05070a 55%, #000 100%);
  color: #f5f5f5;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-header {
  text-align: center;
}

.title {
  margin: 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.layout {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
}

.left-panel {
  flex: 1;
  max-width: 360px;
  background: rgba(10, 14, 25, 0.85);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 18px 35px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-panel {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.panel-title {
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.status-text {
  font-size: 0.85rem;
  line-height: 1.4;
}

.button-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 120px;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease, border-color 0.15s ease;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.active {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  border-color: rgba(34, 197, 94, 0.9);
  color: #041106;
}

.hint {
  font-size: 0.8rem;
  opacity: 0.7;
}

.error {
  font-size: 0.8rem;
  color: #f97373;
}

.instructions ul {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  line-height: 1.4;
}

.right-panel :deep(canvas) {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }

  .left-panel {
    max-width: none;
  }
}
</style>
