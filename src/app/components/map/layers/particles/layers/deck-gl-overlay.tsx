// 修改后
import React, { useEffect, useRef } from "react";
import { MapLayer } from "@react-leaflet/core";

interface DeckGLOverlayProps {
  // 添加类型注解
  data: Array<{
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
  }>;
}

const DeckGLOverlay: React.FC<DeckGLOverlayProps> = ({ data }) => {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // 移除 console.log
    // console.log("DeckGL Overlay mounted");

    if (mapRef.current) {
      // 处理 deck.gl 逻辑
    }
  }, [data]);

  return (
    <MapLayer>
      {/* 渲染 deck.gl 图层 */}
      {data.map((item) => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            backgroundColor: item.color,
            borderRadius: "50%",
          }}
        />
      ))}
    </MapLayer>
  );
};

export default DeckGLOverlay;
