/**
 * config.ts — Phaser 遊戲設定
 *
 * 用途：建立 Phaser 的 GameConfig，供 GameCanvas.vue 初始化遊戲用。
 * 負責：畫布尺寸、物理（重力）、縮放模式、以及將 Vue 的輸入選項傳入主場景。
 */

import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import type { Ref } from 'vue'
import { GRAVITY_Y } from './constants/GRAVITY'

/** 輸入模式：鍵盤左右鍵 或 陀螺儀傾斜 */
export type InputMode = 'keyboard' | 'gyro'

/** 從 Vue 傳入的選項（Ref 讓 Phaser 可即時讀到 App 的 inputMode / sensitivity） */
export interface GameConfigOptions {
  inputMode: Ref<InputMode>
  sensitivity: Ref<number>
}

/**
 * 建立 Phaser 遊戲設定
 * @param parent 掛載的 DOM 元素（GameCanvas 的 container）
 * @param options Vue 的 inputMode、sensitivity Ref
 */
export function createGameConfig(
  parent: HTMLElement,
  options: GameConfigOptions,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 670,
    height: 1200,
    backgroundColor: '#0b1020',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: GRAVITY_Y },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new GameScene(options)],
  }
}
