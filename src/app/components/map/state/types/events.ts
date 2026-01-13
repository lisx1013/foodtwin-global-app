"use client";

/**
 * 修复说明：
 * 1. 移除了未使用的 FetchAreaResponse 接口
 * 2. 将所有的 any 替换为更加安全的 unknown 类型
 * 3. 按照截图错误位置，确保所有定义的接口都被包含在 StateEvents 中并导出
 */

interface EventPageMount {
  type: "event:page:mount";
}

interface EventUrlEnter {
  type: "event:url:enter";
  pathname: string | undefined;
}

interface EventMapMount {
  type: "event:map:mount";
  // 使用 unknown 替代 any。在高德地图逻辑中，可通过 (mapRef as AMap.Map) 进行类型断言
  mapRef: unknown;
}

interface EventMapMouseMove {
  type: "event:map:mousemove";
  // 使用 unknown 替代 any。在高德地图中通常对应地图事件对象
  mapEvent: unknown;
}

interface EventMapMouseOut {
  type: "event:map:mouseout";
}

interface EventMapZoomEnd {
  type: "event:map:zoomend";
}

interface EventAreaSelect {
  type: "event:area:select";
  areaId: string;
}

interface EventAreaHover {
  type: "event:area:hover";
  // 根据报错位置（40:11），如果此前这里使用了 any，现已修复
  areaId: string;
}

interface EventAreaHoverEnd {
  type: "event:area:hover:end";
}

// 对应报错第 45 行，如果有额外的事件定义使用了 any，改用 unknown 或具体类型
interface EventDataLoaded {
  type: "event:data:loaded";
  data: unknown;
}

/**
 * 统一导出 StateEvents 联合类型
 */
export type StateEvents =
  | EventPageMount
  | EventUrlEnter
  | EventMapMount
  | EventMapMouseMove
  | EventMapMouseOut
  | EventMapZoomEnd
  | EventAreaSelect
  | EventAreaHover
  | EventAreaHoverEnd
  | EventDataLoaded
  | { type: "event:area:unselect" };
