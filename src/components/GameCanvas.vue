<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import Phaser from 'phaser'
import { createGameConfig } from '../game/config'

type InputMode = 'keyboard' | 'gyro'

const props = defineProps<{
  inputMode: InputMode
  sensitivity: number
}>()

const containerRef = ref<HTMLElement | null>(null)
let game: Phaser.Game | null = null

// 將輸入設定傳給 Phaser 遊戲
const inputModeRef: Ref<InputMode> = ref(props.inputMode)
const sensitivityRef: Ref<number> = ref(props.sensitivity)

watch(
  () => props.inputMode,
  (mode) => {
    inputModeRef.value = mode
    if (game) {
      game.registry.set('inputMode', mode)
    }
  },
)

watch(
  () => props.sensitivity,
  (value) => {
    sensitivityRef.value = value
    if (game) {
      game.registry.set('sensitivity', value)
    }
  },
)

onMounted(() => {
  if (!containerRef.value) return

  const config = createGameConfig(containerRef.value, {
    inputMode: inputModeRef,
    sensitivity: sensitivityRef,
  })

  game = new Phaser.Game(config)

  game.registry.set('inputMode', inputModeRef.value)
  game.registry.set('sensitivity', sensitivityRef.value)
})

onBeforeUnmount(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<template>
  <div class="game-wrapper">
    <div ref="containerRef" class="game-container" />
  </div>
</template>

<style scoped>
.game-wrapper {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.game-container {
  width: 100%;
  aspect-ratio: 3 / 5;
}
</style>

