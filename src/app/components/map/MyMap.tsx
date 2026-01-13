"use client";

import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

export default function MyMap() {
  // 1. 明确声明 ref 类型为 HTMLDivElement，初始化为 null
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 2. 检查 mapContainer.current 是否存在，避免初始化错误
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        const AMap = await AMapLoader.load({
          key: "c2cb44bdf8a014380a909e6445befd39",
          version: "2.0",
          plugins: ["AMap.Polygon"],
        });

        // 初始化地图
        const map = new AMap.Map(mapContainer.current, {
          center: [116.39748, 39.90882],
          zoom: 5,
        });

        const res = await fetch(
          "http://10.0.3.4:5000/api/gpkg/query?file=file1&column=country&value=中国"
        );
        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((province: { polygon: string }) => {
            if (!province.polygon) return;
            const path = province.polygon.split(";").map((coord) => {
              const [lng, lat] = coord.split(",").map(Number);
              return [lng, lat];
            });
            const polygon = new AMap.Polygon({
              path,
              strokeColor: "#ff0000",
              strokeWeight: 2,
              fillColor: "#ff000020",
            });
            map.add(polygon);
          });
        }
      } catch (err) {
        // 3. 解决 image_be67dd.png 中的 no-console 错误
        // 在生产打包环境中通常不允许 console.log。可以使用注释禁用该行检查，或改为其他错误处理
        // eslint-disable-next-line no-console
        console.error("地图加载失败：", err);
      }
    };

    initMap();

    // 4. 可选：组件卸载时建议销毁地图实例，防止内存泄漏
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}
