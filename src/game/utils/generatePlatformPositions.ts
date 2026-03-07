/**
 * 依「上一個平台」鏈狀生成平台座標，保證可跳性。
 * 純函數、無 Phaser 依賴，方便測試與複用。
 */

import { LEVEL_HEIGHT, PLATFORM_TOP_MARGIN } from '../constants/LEVEL'
import {
  PLATFORM_PADDING_X,
  PLATFORM_WIDTH,
  PLATFORM_MIN_Y_STEP,
  PLATFORM_MAX_Y_STEP,
  PLATFORMS_PER_ROW_MIN,
  PLATFORMS_PER_ROW_MAX,
  PLATFORM_ROW_Y_JITTER,
  PLATFORM_MIN_X_GAP,
  PLATFORM_MAX_JUMP_X,
  PLATFORM_MIN_ROW_X_SHIFT,
} from '../constants/PLATFORM_GENERATION'

export interface GeneratePlatformPositionsOptions {
  /** 世界寬度（px） */
  width: number
  /** 關卡總高度（px），預設為 LEVEL_HEIGHT */
  levelHeight?: number
  /** 隨機數：給定 [min, max] 回傳整數，用於可替換的 RNG */
  randomBetween?: (min: number, max: number) => number
}

/** 單一平台座標 */
export interface PlatformPosition {
  x: number
  y: number
}

const defaultRandomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

/**
 * 從關卡底部往上，依鏈狀規則生成浮空平台座標（不含地面）。
 */
export function generatePlatformPositions(
  options: GeneratePlatformPositionsOptions,
): PlatformPosition[] {
  const { width, levelHeight = LEVEL_HEIGHT, randomBetween = defaultRandomBetween } = options

  const positions: PlatformPosition[] = []
  const topMargin = PLATFORM_TOP_MARGIN
  const minX = PLATFORM_PADDING_X
  const maxX = width - PLATFORM_PADDING_X - PLATFORM_WIDTH

  let lastY = levelHeight - 120
  // 記錄上一 row 的 X 中心，用於跨 row 可跳性檢查（初始為畫面中央）
  let prevRowCenters: number[] = [width / 2]

  while (lastY > topMargin) {
    const nextY = lastY - randomBetween(PLATFORM_MIN_Y_STEP, PLATFORM_MAX_Y_STEP)
    const count = randomBetween(PLATFORMS_PER_ROW_MIN, PLATFORMS_PER_ROW_MAX)
    const sectionWidth = (maxX - minX) / count

    // 先暫存同 row 的平台，再統一做間距修正
    const rowPlatforms: PlatformPosition[] = []
    for (let i = 0; i < count; i++) {
      const sectionMin = Math.floor(minX + i * sectionWidth)
      const sectionMax = Math.floor(minX + (i + 1) * sectionWidth)
      const x = randomBetween(sectionMin, sectionMax)
      const yJitter = randomBetween(-PLATFORM_ROW_Y_JITTER, PLATFORM_ROW_Y_JITTER)
      rowPlatforms.push({ x, y: nextY + yJitter })
    }

    // Step 1：垂直多樣性（zigzag）
    // 每個平台必須與上一 row 最近平台有最小水平位移，避免垂直堆疊卡關
    for (const curr of rowPlatforms) {
      const currCx = curr.x + PLATFORM_WIDTH / 2
      let nearestPrevCx = prevRowCenters[0]!
      let nearestDist = Math.abs(currCx - nearestPrevCx)
      for (const prevCx of prevRowCenters) {
        const d = Math.abs(currCx - prevCx)
        if (d < nearestDist) {
          nearestDist = d
          nearestPrevCx = prevCx
        }
      }
      if (nearestDist < PLATFORM_MIN_ROW_X_SHIFT) {
        // 往已有偏移方向繼續推；若幾乎正上方則隨機選一邊
        const diff = currCx - nearestPrevCx
        const dir = diff > 0 ? 1 : diff < 0 ? -1 : randomBetween(0, 1) === 0 ? 1 : -1
        const newCx = Math.max(
          minX + PLATFORM_WIDTH / 2,
          Math.min(maxX + PLATFORM_WIDTH / 2, nearestPrevCx + dir * PLATFORM_MIN_ROW_X_SHIFT),
        )
        // 只有在仍在跳躍範圍內才套用（MIN_ROW_X_SHIFT < MAX_JUMP_X，通常一定成立）
        if (Math.abs(newCx - nearestPrevCx) <= PLATFORM_MAX_JUMP_X) {
          curr.x = newCx - PLATFORM_WIDTH / 2
        }
      }
    }

    // Step 2：同 row 相鄰平台最小淨距，避免擋死通道
    rowPlatforms.sort((a, b) => a.x - b.x)
    const minStep = PLATFORM_WIDTH + PLATFORM_MIN_X_GAP
    for (let i = 1; i < rowPlatforms.length; i++) {
      const prev = rowPlatforms[i - 1]!
      const curr = rowPlatforms[i]!
      if (curr.x - prev.x < minStep) {
        curr.x = Math.min(prev.x + minStep, maxX)
        if (curr.x === maxX) {
          prev.x = Math.max(maxX - minStep, minX)
        }
      }
    }

    // Step 3：跨 row 可跳性保底
    // zigzag 後理論上仍在跳躍範圍內，但若邊界夾擠造成超出則修正
    const isReachable = rowPlatforms.some((curr) =>
      prevRowCenters.some(
        (prevCx) => Math.abs(curr.x + PLATFORM_WIDTH / 2 - prevCx) <= PLATFORM_MAX_JUMP_X,
      ),
    )
    if (!isReachable) {
      let closestIdx = 0
      let closestDist = Infinity
      let bestPrevCx = prevRowCenters[0]!
      for (let i = 0; i < rowPlatforms.length; i++) {
        const currCx = rowPlatforms[i]!.x + PLATFORM_WIDTH / 2
        for (const prevCx of prevRowCenters) {
          const dist = Math.abs(currCx - prevCx)
          if (dist < closestDist) {
            closestDist = dist
            closestIdx = i
            bestPrevCx = prevCx
          }
        }
      }
      const target = rowPlatforms[closestIdx]!
      const currCx = target.x + PLATFORM_WIDTH / 2
      const offset = currCx > bestPrevCx ? -PLATFORM_MAX_JUMP_X : PLATFORM_MAX_JUMP_X
      target.x = Math.max(minX, Math.min(maxX, bestPrevCx + offset - PLATFORM_WIDTH / 2))
    }

    prevRowCenters = rowPlatforms.map((p) => p.x + PLATFORM_WIDTH / 2)

    for (const p of rowPlatforms) {
      positions.push(p)
    }

    lastY = nextY
  }

  return positions
}
