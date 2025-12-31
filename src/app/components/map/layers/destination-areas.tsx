"use client";

import React, { useEffect, useRef } from "react";

/**
 * 1. 定义具体的区域接口
 * 解决 @typescript-eslint/array-type: 使用 T[] 替代 Array<T>
 */
interface AreaItem {
  id: string;
  name: string;
  // 确保坐标类型为固定长度的元组，解决 ts(2352) 报错
  coordinates: [number, number];
}

interface DestinationAreasProps {
  areas: AreaItem[];
}

// 全局 AMap 类型定义，解决 AMap.Bounds 等类型缺失的问题
declare global {
  namespace AMap {
    interface Bounds {
      getSouthWest(): LngLat;
      getNorthEast(): LngLat;
      contains(point: LngLat): boolean;
    }
    interface LngLat {
      lng: number;
      lat: number;
    }
  }
}

/**
 * 2. 补全高德地图 Map 类型定义
 * 解决 ts(2339) "Map 上不存在属性" 的一系列报错
 */
interface AMapInstance {
  setFitView: (overlay?: any) => void;
  destroy: () => void;
  plugin: (name: string | string[], callback: () => void) => void;
  on: (event: string, handler: (e: any) => void) => void;
  off: (event: string, handler: (e: any) => void) => void;
}

// MapLayer 组件定义
const MapLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {children}
    </div>
  );
};

const DestinationAreas: React.FC<DestinationAreasProps> = ({ areas }) => {
  // 3. 明确 Ref 类型，解决 "Unexpected any" 报错
  const mapRef = useRef<AMapInstance | null>(null);

  useEffect(() => {
    // 移除 console.log 满足 no-console 规范
    if (mapRef.current) {
      // 在此处安全地调用地图方法，如 mapRef.current.setFitView();
    }
  }, [areas]); // 建议添加 areas 作为依赖以响应数据变化

  return (
    <MapLayer>
      {/* 渲染目的地区域 */}
      {areas.map((area) => (
        <div
          key={area.id}
          style={{
            position: "absolute",
            // 使用数组索引访问，确保类型安全
            left: `${area.coordinates[0]}px`,
            top: `${area.coordinates[1]}px`,
            width: "20px",
            height: "20px",
            backgroundColor: "red",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)", // 居中修正
            pointerEvents: "none",
          }}
          title={area.name}
        />
      ))}
    </MapLayer>
  );
};

export default DestinationAreas;
