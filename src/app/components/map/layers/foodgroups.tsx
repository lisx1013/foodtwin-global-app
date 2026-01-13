"use client";

import React, { useEffect, useRef } from "react";

/**
 * 1. 定义具体的食物组项接口
 */
interface FoodGroupItem {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface FoodGroupsProps {
  foodGroups?: FoodGroupItem[];
}

/**
 * 2. 补全高德地图相关类型定义
 * 解决 "Unexpected any" 报错：将 any 替换为 unknown 或具体的插件类型
 */
interface AMapInstance {
  // AMap 的 setFitView 通常接收覆盖物数组，使用 unknown[] 比 any 更安全
  setFitView: (overlay?: unknown[]) => void;
  destroy: () => void;
  // plugin 回调通常不带参数
  plugin: (name: string | string[], callback: () => void) => void;
}

const FoodGroups: React.FC<FoodGroupsProps> = ({ foodGroups }) => {
  // 3. 明确 Ref 类型
  const mapRef = useRef<AMapInstance | null>(null);

  useEffect(() => {
    // 逻辑处理
    if (mapRef.current) {
      // 如果需要调用 AMap 插件示例：
      // mapRef.current.plugin(['AMap.ToolBar'], () => { ... });
    }
  }, []);

  return (
    <>
      {/* 渲染食物组图例或标记 */}
      {foodGroups &&
        foodGroups.map((group) => (
          <div
            key={group.id}
            title={group.name}
            style={{
              position: "absolute",
              backgroundColor: group.color,
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        ))}
    </>
  );
};

export default FoodGroups;
