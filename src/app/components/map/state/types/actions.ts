"use client";

import { FetchAreaResponse } from "@/app/api/areas/[id]/route";

/**
 * 修复 image_be760c.jpg 中的错误：
 * 移除所有定义但未使用的 import（如 assign, createMachine, BBox 等）
 */

export interface ActionApplyDestinationAreaIdsToMap {
  type: "action:applyDestinationAreaIdsToMap";
  destinationAreasFeatureIds: number[];
}

// 补充缺失的 Action 接口定义，确保 StateActions 完整
export interface ActionSetCurrentArea {
  type: "action:setCurrentArea";
  output: FetchAreaResponse;
}

// ... 根据 machine.ts 的需求继续补充其他接口 ...

/**
 * 统一导出 StateActions
 * 解决 image_be760c.jpg 中重复定义或未使用的问题
 */
export type StateActions =
  | ActionApplyDestinationAreaIdsToMap
  | ActionSetCurrentArea
  | { type: "action:parseUrl" }
  | { type: "action:enterWorldMapView" }
  | { type: "action:setMapRef"; mapRef: unknown } // 使用 unknown 代替 any
  | { type: "action:setHighlightedArea" }
  | { type: "action:clearHighlightedArea" }
  | { type: "action:resetAreaViewMap" }
  | { type: "action:enterProductionAreaView" }
  | { type: "action:exitProductionAreaView" }
  | { type: "action:enterTransportationAreaView" }
  | { type: "action:exitTransportationAreaView" }
  | { type: "action:enterImpactAreaView" }
  | { type: "action:exitImpactAreaView" };
