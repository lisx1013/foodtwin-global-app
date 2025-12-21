// 修改后
import React, { useEffect, useRef } from "react";

interface FoodGroupsProps {
  // 添加类型注解
  foodGroups?: Array<{
    id: string;
    name: string;
    color: string;
    count: number;
  }>;
}

const FoodGroups: React.FC<FoodGroupsProps> = ({ foodGroups }) => {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // 移除 console.log
    // console.log("FoodGroups mounted");

    if (mapRef.current) {
      // 处理食物组逻辑
    }
  }, []);

  return (
    <>
      {/* 渲染食物组 */}
      {foodGroups &&
        foodGroups.map((group) => (
          <div
            key={group.id}
            style={{
              position: "absolute",
              backgroundColor: group.color,
              width: "10px",
              height: "10px",
              borderRadius: "50%",
            }}
          />
        ))}
    </>
  );
};

export default FoodGroups;
