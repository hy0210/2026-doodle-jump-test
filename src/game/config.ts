import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import type { Ref } from 'vue'

export type InputMode = 'keyboard' | 'gyro'

export interface GameConfigOptions {
  inputMode: Ref<InputMode>
  sensitivity: Ref<number>
}

export function createGameConfig(
  parent: HTMLElement,
  options: GameConfigOptions,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 360,
    height: 600,
    backgroundColor: '#0b1020',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 900 },
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

