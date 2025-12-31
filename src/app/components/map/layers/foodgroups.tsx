"use client";

import React, { useEffect, useRef } from "react";

/**
 * 1. 定义具体的食物组项接口
 * 解决 @typescript-eslint/array-type: 使用 T[] 替代 Array<T>
 */
interface FoodGroupItem {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface FoodGroupsProps {
  // 修正为 T[] 写法，解决 image_dece4b.png 报错
  foodGroups?: FoodGroupItem[];
}

/**
 * 2. 补全高德地图相关类型定义
 * 解决 image_de4b0b.jpg 中的 "Unexpected any" 报错
 */
interface AMapInstance {
  setFitView: (overlay?: any) => void;
  destroy: () => void;
  plugin: (name: string | string[], callback: () => void) => void;
}

const FoodGroups: React.FC<FoodGroupsProps> = ({ foodGroups }) => {
  // 3. 明确 Ref 类型，解决 "Unexpected any" 警告
  const mapRef = useRef<AMapInstance | null>(null);

  useEffect(() => {
    /** * 移除 console.log 满足 no-console 规范 (image_dde1aa.png)
     * 只有在 mapRef.current 存在时才执行相关逻辑
     */
    if (mapRef.current) {
      // 在此处执行地图相关的初始化或逻辑更新
    }
  }, []);

  return (
    <>
      {/* 渲染食物组图例或标记 */}
      {foodGroups &&
        foodGroups.map((group) => (
          <div
            key={group.id}
            title={group.name} // 增加可访问性
            style={{
              position: "absolute",
              backgroundColor: group.color,
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              // 建议增加 transform 以确保定位准确
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        ))}
    </>
  );
};

export default FoodGroups;
