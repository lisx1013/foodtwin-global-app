"use client";

import React, { useEffect, useRef } from "react";

/**
 * 1. 修复 @typescript-eslint/array-type
 * 确保所有数组定义均使用 T[] 格式
 */
interface DeckGLDataItem {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface DeckGLOverlayProps {
  data: DeckGLDataItem[];
}

/**
 * 2. 修复 @typescript-eslint/no-explicit-any
 * 为接口属性定义具体类型，避免使用 any
 */
interface MapContainerInstance {
  // 将 props: any 替换为 Record<string, unknown> 以满足严格类型检查
  setProps?: (props: Record<string, unknown>) => void;
  finalize?: () => void;
}

const DeckGLOverlay: React.FC<DeckGLOverlayProps> = ({ data }) => {
  // 3. 明确 Ref 类型，消除 line 16:25 的 "Unexpected any" 报错
  const mapRef = useRef<MapContainerInstance | null>(null);

  useEffect(() => {
    // 4. 遵守 no-console 规范，不留任何 console 语句
    if (mapRef.current) {
      // 执行 deck.gl 相关逻辑
    }
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* 渲染图层标记 */}
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
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
};

export default DeckGLOverlay;
