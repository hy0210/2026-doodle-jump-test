<template>
  <div class="game-wrapper">
    <div ref="containerRef" class="game-container" />
  </div>
</template>

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

<style scoped>
  .game-wrapper {
    min-height: 100vh;
    min-width: 100%;
    width: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* 遊戲容器：最大 440×788，小視窗時等比例縮小 */
  .game-container {
    width: min(440px, 100%, calc(100vh * 440 / 788));
    height: min(788px, 100vh, calc(100vw * 788 / 440));
    flex-shrink: 0;
  }
</style>
