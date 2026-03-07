/**
 * 程序生成平台用常數
 * 控制平台間距、可跳距離、邊距等，與「背景高度」無關。
 */

/** 相鄰平台最小垂直間距（px） */
export const PLATFORM_MIN_Y_STEP = 80

/** 相鄰平台最大垂直間距（px） */
export const PLATFORM_MAX_Y_STEP = 160

/** 相鄰平台水平最大偏移（px），影響難度 */
export const PLATFORM_MAX_JUMP_X = 160

/** 平台離畫面左右邊緣的最小距離（px） */
export const PLATFORM_PADDING_X = 40

/** 平台寬度（px），與 texture 一致 */
export const PLATFORM_WIDTH = 80

/** 每層最少平台數 */
export const PLATFORMS_PER_ROW_MIN = 1

/** 每層最多平台數 */
export const PLATFORMS_PER_ROW_MAX = 2

/** 同層平台的 Y 軸隨機偏移範圍（px） */
export const PLATFORM_ROW_Y_JITTER = 15

/** 同層相鄰平台之間的最小水平淨距（px），避免擋死通道 */
export const PLATFORM_MIN_X_GAP = 100

/** 相鄰 row 之間的平台最小水平位移（px），避免形成垂直堆疊通道 */
export const PLATFORM_MIN_ROW_X_SHIFT = 80
