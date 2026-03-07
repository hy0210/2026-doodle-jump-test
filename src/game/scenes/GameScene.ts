/**
 * GameScene.ts — 主遊戲場景
 *
 * 用途：Phaser 的單一場景，實作跳躍遊戲核心邏輯。
 * 負責：標題與分數 UI、平台與玩家、鍵盤/陀螺儀輸入、碰撞加分、掉出畫面重啟。
 */

import Phaser from 'phaser'
import type { GameConfigOptions, InputMode } from '../config'
import { BACKGROUND_HEIGHT_PX, BACKGROUND_SECTION_COLORS } from '../constants/BACKGROUND'
import { LEVEL_HEIGHT } from '../constants/LEVEL'
import { generatePlatformPositions } from '../utils/generatePlatformPositions'

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

    const { width } = this.scale

    // 世界與鏡頭：關卡高度由常數決定，鏡頭跟隨玩家
    this.physics.world.setBounds(0, 0, width, LEVEL_HEIGHT)
    this.cameras.main.setBounds(0, 0, width, LEVEL_HEIGHT)

    // 三章節背景色（先畫的在最底層，由上到下：第三章→第二章→第一章）
    this.createSectionBackgrounds(width)

    // 標題（固定於鏡頭，不隨捲動）
    this.add
      .text(width / 2, 40, 'Jump Demo', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)

    // 分數文字（固定於鏡頭）
    this.scoreText = this.add
      .text(width / 2, 70, 'Score: 0', {
        fontSize: '16px',
        color: '#cbd5f5',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)

    this.platforms = this.physics.add.staticGroup()
    this.createPlatforms()

    // 玩家：綠色圓形，從關卡底部起跳
    this.player = this.physics.add.sprite(width / 2, LEVEL_HEIGHT - 80, '')
    this.player.setBounce(0)

    const graphics = this.add.graphics()
    graphics.fillStyle(0x4ade80, 1)
    graphics.fillCircle(16, 16, 16)
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

    // 鏡頭初始位置對齊玩家，之後改為手動單向跟隨（只往上）
    this.cameras.main.scrollY = LEVEL_HEIGHT - this.scale.height
    this.initGyroInput()
  }

  /** 依章節高度畫三塊背景色，讓轉換時一眼可見 */
  private createSectionBackgrounds(width: number) {
    const h = BACKGROUND_HEIGHT_PX
    const colors = BACKGROUND_SECTION_COLORS
    // 第一章（底部）y 最大；第三章（頂部）y 最小
    const sectionCenters = [
      LEVEL_HEIGHT - h / 2, // 第一章
      LEVEL_HEIGHT - h - h / 2, // 第二章
      LEVEL_HEIGHT - h * 2 - h / 2, // 第三章
    ]
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(width / 2, sectionCenters[i], width, h, colors[i]).setOrigin(0.5, 0.5)
    }
  }

  /** 建立地面 + 程序生成的浮空平台（藍色圓角矩形） */
  private createPlatforms() {
    const { width } = this.scale

    // 地面：關卡最底部
    this.platforms
      .create(width / 2, LEVEL_HEIGHT - 20, '')
      .setScale(1.5, 0.5)
      .refreshBody()

    const platformTextureKey = this.createPlatformTexture()

    const positions = generatePlatformPositions({
      width,
      randomBetween: (min, max) => Phaser.Math.Between(min, max),
    })

    positions.forEach((pos) => {
      const platform = this.platforms.create(pos.x, pos.y, platformTextureKey)
      platform.setScale(1, 1).refreshBody()
      // 只允許從上方落地，從下方可穿越
      ;(platform.body as Phaser.Physics.Arcade.StaticBody).checkCollision.down = false
    })
  }

  /** 產生平台用 texture（80×16 圓角矩形） */
  private createPlatformTexture(): string {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x38bdf8, 1)
    graphics.fillRoundedRect(0, 0, 80, 16, 6)
    const key = 'platform-rect'
    graphics.generateTexture(key, 80, 16)
    graphics.destroy()
    return key
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

    const cam = this.cameras.main

    // 鏡頭只往上跟隨：玩家在畫面上半時才上移，往下掉時鏡頭不動
    const targetScrollY = this.player.y - cam.height / 2
    if (targetScrollY < cam.scrollY) {
      cam.scrollY = Phaser.Math.Linear(cam.scrollY, targetScrollY, 0.1)
    }

    if (this.player.y > cam.scrollY + cam.height) {
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
