/**
 * 背景／關卡視覺設計用常數
 * 與程式邏輯用常數分開，方便設計調整。
 */

/** 單一背景高度（px），用於切分關卡與換景 */
export const BACKGROUND_HEIGHT_PX = 788 * 2

/** 關卡內背景數量（幾段景就結束） */
export const NUM_BACKGROUNDS = 3

/**
 * 三個章節的背景色（Phaser 十六進位 0xRRGGBB）
 * [0] 第一章（關卡底部）、[1] 第二章、[2] 第三章（關卡頂部）
 */
export const BACKGROUND_SECTION_COLORS: readonly [number, number, number] = [
  0x0b1020, // 第一章：深藍
  0x1e1b4b, // 第二章：靛紫
  0x134e4a, // 第三章：深青綠
]
