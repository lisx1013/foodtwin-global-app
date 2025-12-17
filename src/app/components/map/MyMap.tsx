"use client";
import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

export default function MyMap() {
  const mapContainer = useRef(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // 这里替换成你的「高德Web端Key」！！！
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

        // 调用你的内网API拿数据
        const res = await fetch(
          "http://10.0.3.4:5000/api/gpkg/query?file=file1&column=country&value=中国"
        );
        const data = await res.json();

        // 画省份多边形
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
        console.log("地图加载失败：", err);
      }
    };

    initMap();
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}
