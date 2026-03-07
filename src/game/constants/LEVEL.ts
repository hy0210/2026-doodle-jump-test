/**
 * 關卡程式用常數
 * 由背景設計常數推導，供世界邊界、鏡頭、生成範圍等使用。
 */

import { BACKGROUND_HEIGHT_PX, NUM_BACKGROUNDS } from './BACKGROUND'

/** 關卡總高度（世界座標），用於 physics world、camera bounds、平台生成範圍 */
export const LEVEL_HEIGHT = BACKGROUND_HEIGHT_PX * NUM_BACKGROUNDS

/** 平台生成上邊界：不再往上生成平台的 y 值（留一點頂部空間） */
export const PLATFORM_TOP_MARGIN = 100
