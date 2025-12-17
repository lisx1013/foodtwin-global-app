interface EventPageMount {
  type: "event:page:mount";
}

interface EventUrlEnter {
  type: "event:url:enter";
  pathname: string | undefined;
}

// ... 其他事件接口保持不变，只是移除了Mapbox相关类型
// 对于需要MapRef的地方，暂时使用any类型

interface EventMapMount {
  type: "event:map:mount";
  mapRef: any; // 暂时使用any替代MapRef
}

interface EventMapMouseMove {
  type: "event:map:mousemove";
  mapEvent: any; // 暂时使用any替代MapMouseEvent
}

// 临时修改以避免Mapbox类型错误
import { FetchAreaResponse } from "@/app/api/areas/[id]/route";

interface EventPageMount {
  type: "event:page:mount";
}

interface EventUrlEnter {
  type: "event:url:enter";
  pathname: string | undefined;
}

// ... 其他事件接口保持不变，只是移除了Mapbox相关类型
// 对于需要MapRef的地方，暂时使用any类型

interface EventMapMount {
  type: "event:map:mount";
  mapRef: any; // 暂时使用any替代MapRef
}

interface EventMapMouseMove {
  type: "event:map:mousemove";
  mapEvent: any; // 暂时使用any替代MapMouseEvent
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
  areaId: string;
}

interface EventAreaHoverEnd {
  type: "event:area:hover:end";
}

type StateEvents =
  | EventPageMount
  | EventUrlEnter
  | EventMapMount
  | EventMapMouseMove
  | EventMapMouseOut
  | EventMapZoomEnd
  | EventAreaSelect
  | EventAreaHover
  | EventAreaHoverEnd
  | { type: "event:area:unselect" };

export type { StateEvents };
