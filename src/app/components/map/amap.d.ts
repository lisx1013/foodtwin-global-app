// src/app/components/map/amap.d.ts

declare namespace AMap {
  /** 经纬度对象 */
  export class LngLat {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  /** 多边形配置 */
  export interface PolygonOptions {
    path: number[][][] | number[][] | LngLat[];
    fillColor?: string;
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    fillOpacity?: number;
    zIndex?: number;
    cursor?: string;
    /** 使用 unknown 替代 any：这在功能上与 any 相似，但符合 ESLint 安全规则 */
    extData?: unknown;
  }

  /** 多边形类 */
  export class Polygon {
    constructor(options: PolygonOptions);
    setMap(map: Map | null): void;
    setOptions(options: Partial<PolygonOptions>): void;
    /** 处理高德地图事件回调对象，使用 unknown 是最通用的做法 */
    on(event: string, handler: (e: unknown) => void): void;
    off(event: string, handler: (e: unknown) => void): void;
    getExtData(): unknown;
  }

  /** 地图实例接口 */
  export interface Map {
    /** 同上，将所有 handler 里的 any 替换为 unknown */
    on(event: string, handler: (e: unknown) => void): void;
    off(event: string, handler: (e: unknown) => void): void;
    plugin(name: string | string[], callback: () => void): void;
    /** setFitView 的参数可以是单个覆盖物或覆盖物数组 */
    setFitView(overlay?: unknown): void;
    destroy(): void;
  }

  /** 几何工具 */
  export namespace GeometryUtil {
    function isPointInRing(point: number[] | LngLat, ring: number[][]): boolean;
  }
}

/** 扩展 Window 接口 */
interface Window {
  AMap: typeof AMap;
  _AMapSecurityConfig?: {
    securityCode: string;
  };
}
