import React, { useEffect, useRef } from "react";

interface DestinationAreasProps {
  // 添加类型注解
  areas: Array<{
    id: string;
    name: string;
    coordinates: [number, number];
  }>;
}

// 添加 MapLayer 组件定义
const MapLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div style={{ position: "relative" }}>{children}</div>;
};

const DestinationAreas: React.FC<DestinationAreasProps> = ({ areas }) => {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // 移除 console.log
    // console.log("DestinationAreas mounted");

    if (mapRef.current) {
      // 处理地图逻辑
    }
  }, []);

  return (
    <MapLayer>
      {/* 渲染目的地区域 */}
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
          }}
        />
      ))}
    </MapLayer>
  );
};

export default DestinationAreas;
