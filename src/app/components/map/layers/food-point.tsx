"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "@uiw/react-amap";

// 粮食种类颜色配置
const FOOD_TYPE_COLORS: Record<string, string> = {
  小麦: "#FF0000", // 红色
  玉米: "#00FF00", // 绿色
  水稻: "#0000FF", // 蓝色
  大豆: "#FFFF00", // 黄色
  其他: "#800080", // 紫色
};

// 默认颜色
const DEFAULT_COLOR = "#808080";

export default function MassFoodPointsLayer() {
  const { map } = useMap();
  const massMarksRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    const loadMassPoints = async () => {
      try {
        // 获取粮食点数据
        const foodPoints = await fetchFoodPoints();

        // 转换为海量点数据格式
        const massMarksData = foodPoints.map((point: any) => ({
          lnglat: [point.longitude, point.latitude],
          style: getStyleIndex(point.type),
          info: {
            id: point.id,
            name: point.name,
            type: point.type,
            quantity: point.quantity,
            // 其他需要在信息窗口显示的字段
          },
        }));

        renderMassPoints(massMarksData);
      } catch (error) {
        console.error("加载粮食点数据失败:", error);
      }
    };

    const fetchFoodPoints = async (): Promise<any[]> => {
      // 替换为您的实际API端点
      const response = await fetch("/api/food-points"); // 或者您的实际API地址
      const data = await response.json();
      return data;
    };

    const getStyleIndex = (type: string): number => {
      const types = Object.keys(FOOD_TYPE_COLORS);
      const index = types.indexOf(type);
      return index >= 0 ? index : types.length; // 默认样式索引
    };

    const renderMassPoints = (data: any[]) => {
      if (!map || typeof window === "undefined" || !window.AMap) return;

      // 清除已有的海量点
      if (massMarksRef.current) {
        massMarksRef.current.setMap(null);
      }

      // 定义样式
      const styles = [...Object.values(FOOD_TYPE_COLORS), DEFAULT_COLOR].map(
        (color) => ({
          anchor: new window.AMap.Pixel(4, 4),
          size: new window.AMap.Size(8, 8),
          fillColor: color,
          strokeColor: "#FFFFFF",
          strokeWidth: 1,
          fillOpacity: 0.8,
        })
      );

      // 创建海量点实例
      massMarksRef.current = new window.AMap.MassMarks(data, {
        zIndex: 100,
        opacity: 0.8,
        cursor: "pointer",
        styles: styles,
      });

      // 创建信息窗口
      infoWindowRef.current = new window.AMap.InfoWindow({
        offset: new window.AMap.Pixel(0, -20),
        closeWhenClickMap: true,
      });

      // 绑定点击事件
      massMarksRef.current.on("click", (e: any) => {
        const { lnglat, data } = e.data;
        const content = `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0;">${data.info.name}</h3>
            <p style="margin: 5px 0;"><strong>类型:</strong> ${data.info.type}</p>
            ${data.info.quantity ? `<p style="margin: 5px 0;"><strong>产量:</strong> ${data.info.quantity} 吨</p>` : ""}
            <p style="margin: 5px 0;"><strong>坐标:</strong> ${lnglat[0].toFixed(6)}, ${lnglat[1].toFixed(6)}</p>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, lnglat);
      });

      // 添加到地图
      massMarksRef.current.setMap(map);
    };

    loadMassPoints();

    return () => {
      // 清理资源
      if (massMarksRef.current) {
        massMarksRef.current.setMap(null);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [map]);

  return null;
}
