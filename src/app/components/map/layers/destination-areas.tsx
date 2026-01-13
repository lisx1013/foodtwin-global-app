"use client";

import React, { useEffect, useRef } from "react";

/**
 * 1. 定义具体的区域接口
 */
interface AreaItem {
  id: string;
  name: string;
  coordinates: [number, number];
}

interface DestinationAreasProps {
  areas: AreaItem[];
}

/**
 * 2. 修复 "A record is preferred over an index signature"
 * 修复 "Unexpected any"
 * 使用 Record<string, unknown> 代替 {[key: string]: any}
 */
type AMapEvent = Record<string, unknown>;

/**
 * 3. 修复 "AMapInstance is defined but never used"
 * 直接合并并使用 AMapInstanceFixed，并移除未使用的接口定义
 */
interface AMapInstanceFixed {
  setFitView: (overlay?: unknown) => void;
  destroy: () => void;
  plugin: (name: string | string[], callback: () => void) => void;
  on: (event: string, handler: (e: AMapEvent) => void) => void;
  off: (event: string, handler: (e: AMapEvent) => void) => void;
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
  // 使用修复后的接口类型
  const mapRef = useRef<AMapInstanceFixed | null>(null);

  useEffect(() => {
    // 保持逻辑不变，如果需要使用 mapRef，可以在此处编写
    if (mapRef.current) {
      // example: mapRef.current.setFitView();
    }
  }, [areas]);

  return (
    <MapLayer>
      {areas.map((area) => (
        <div
          key={area.id}
          style={{
            position: "absolute",
            left: `${area.coordinates[0]}px`,
            top: `${area.coordinates[1]}px`,
            width: "20px",
            height: "20px",
            backgroundColor: "red",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
          title={area.name}
        />
      ))}
    </MapLayer>
  );
};

export default DestinationAreas;
