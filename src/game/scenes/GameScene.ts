/**
 * GameScene.ts — 主遊戲場景
 *
 * 用途：Phaser 的單一場景，實作跳躍遊戲核心邏輯。
 * 負責：標題與分數 UI、平台與玩家、鍵盤/陀螺儀輸入、碰撞加分、掉出畫面重啟。
 */

import Phaser from 'phaser'
import type { GameConfigOptions, InputMode } from '../config'

/** 陀螺儀產生的水平方向輸入值 (-1 ~ 1) */
interface HorizontalInput {
  value: number
}

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private scoreText!: Phaser.GameObjects.Text
  private score = 0

  private inputOptions: GameConfigOptions
  private horizontalInput: HorizontalInput = { value: 0 }

  private gyroHandler: ((event: DeviceOrientationEvent) => void) | null = null

  constructor(options: GameConfigOptions) {
    super('GameScene')
    this.inputOptions = options
  }

  /** 場景建立：UI、平台、玩家、碰撞、陀螺儀監聽 */
  create() {
    this.cursors = this.input.keyboard!.createCursorKeys()

    const { width, height } = this.scale

    // 標題
    this.add
      .text(width / 2, 40, 'Jump Demo', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    // 分數文字
    this.scoreText = this.add
      .text(width / 2, 70, 'Score: 0', {
        fontSize: '16px',
        color: '#cbd5f5',
      })
      .setOrigin(0.5)

    this.platforms = this.physics.add.staticGroup()
    this.createPlatforms()

    // 玩家：綠色圓形，初始向上彈跳
    this.player = this.physics.add.sprite(width / 2, height - 80, '')
    this.player.setBounce(0)

    const graphics = this.add.graphics()
    graphics.fillStyle(0x4ade80, 1)
    graphics.fillCircle(0, 0, 16)
    const textureKey = 'player-circle'
    graphics.generateTexture(textureKey, 32, 32)
    graphics.destroy()

    this.player.setTexture(textureKey)

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-650)

    // 玩家與平台碰撞：落地時向上彈跳，每平台只計分一次
    this.physics.add.collider(this.player, this.platforms, (_player, platform) => {
      const body = this.player.body as Phaser.Physics.Arcade.Body

      if (body.touching.down || body.blocked.down) {
        body.setVelocityY(-650)

        const platformObj = platform as Phaser.GameObjects.GameObject & {
          alreadyScored?: boolean
        }
        if (!platformObj.alreadyScored) {
          this.score += 10
          platformObj.alreadyScored = true
          this.scoreText.setText(`Score: ${this.score}`)
        }
      }
    })

    this.initGyroInput()
  }

  /** 建立地面 + 數個浮空平台（藍色圓角矩形） */
  private createPlatforms() {
    const { width, height } = this.scale

    this.platforms
      .create(width / 2, height - 20, '')
      .setScale(1.5, 0.5)
      .refreshBody()

    const graphics = this.add.graphics()
    graphics.fillStyle(0x38bdf8, 1)
    graphics.fillRoundedRect(0, 0, 80, 16, 6)
    const platformTextureKey = 'platform-rect'
    graphics.generateTexture(platformTextureKey, 80, 16)
    graphics.destroy()

    const positions = [
      { x: 60, y: 460 },
      { x: 270, y: 380 },
      { x: 180, y: 310 },
      { x: 80, y: 230 },
      { x: 260, y: 160 },
    ]

    positions.forEach((pos) => {
      const platform = this.platforms.create(pos.x, pos.y, platformTextureKey)
      platform.setScale(1, 1).refreshBody()
    })
  }

  /** 監聽 deviceorientation，把傾斜 (gamma) 轉成 horizontalInput.value，供 update 使用 */
  private initGyroInput() {
    if (typeof window === 'undefined') return

    this.gyroHandler = (event: DeviceOrientationEvent) => {
      const mode = this.getInputMode()
      if (mode !== 'gyro') return

      const gamma = event.gamma ?? 0
      const normalized = Phaser.Math.Clamp(gamma / 30, -1, 1)
      const sensitivity = this.getSensitivity()
      this.horizontalInput.value = normalized * sensitivity
    }

    window.addEventListener('deviceorientation', this.gyroHandler)
  }

  /** 從 Phaser registry 或 inputOptions 取得目前輸入模式（GameCanvas 會寫入 registry） */
  private getInputMode(): InputMode {
    const mode = this.game.registry.get('inputMode') as InputMode | undefined
    return mode ?? this.inputOptions.inputMode.value
  }

  /** 從 Phaser registry 或 inputOptions 取得陀螺儀靈敏度 */
  private getSensitivity(): number {
    const fromRegistry = this.game.registry.get('sensitivity') as number | undefined
    return fromRegistry ?? this.inputOptions.sensitivity.value
  }

  /** 每幀：依 inputMode 設定水平速度、左右穿牆、掉出畫面則重啟場景 */
  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const speed = 260

    const mode = this.getInputMode()

    if (mode === 'keyboard') {
      const left = this.cursors.left?.isDown
      const right = this.cursors.right?.isDown

      if (left && !right) {
        body.setVelocityX(-speed)
      } else if (right && !left) {
        body.setVelocityX(speed)
      } else {
        body.setVelocityX(0)
      }
    } else {
      const value = this.horizontalInput.value
      body.setVelocityX(value * speed)
    }

    const { width } = this.scale
    if (this.player.x < 0) {
      this.player.x = width
    } else if (this.player.x > width) {
      this.player.x = 0
    }

    const { height } = this.scale
    if (this.player.y > height + 40) {
      this.scene.restart()
    }
  }

  /** 場景銷毀時移除陀螺儀監聽，避免記憶體洩漏 */
  destroy(fromScene?: boolean): void {
    if (typeof window !== 'undefined' && this.gyroHandler) {
      window.removeEventListener('deviceorientation', this.gyroHandler)
      this.gyroHandler = null
    }
    // @ts-expect-error Phaser typings may not include this overload
    super.destroy(fromScene)
  }
}

