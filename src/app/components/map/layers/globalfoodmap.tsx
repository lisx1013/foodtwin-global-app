"use client";
import React, { useEffect, useState, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

// --- 类型定义 ---
interface CropPoint {
  lnglat: [number, number];
  name: string;
  country: string;
  adminName: string;
  style: number;
}

const GlobalMapContainer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // 使用 Ref 存储地图实例，确保 cleanup 函数能访问
  const [selectedInfo, setSelectedInfo] = useState<any>(null);

  // --- 1. 数据预处理函数 ---
  const transformApiResponse = (data: any): CropPoint[] => {
    if (!data || !data.features) return [];

    return data.features
      .filter((f: any) => f.geometry && f.geometry.type === "Point") // 过滤掉非点要素
      .map((feature: any) => {
        const { properties, geometry } = feature;
        return {
          lnglat: geometry.coordinates as [number, number],
          name: properties.admin_name || "未知地区",
          country: properties.country || "Unknown",
          adminName: properties.admin_name || "Unknown",
          // 样式逻辑：可以根据 iso3 或 cropType 切换样式索引
          style: properties.iso3 === "GBR" ? 0 : 1,
        };
      });
  };

  // --- 2. 地图初始化与渲染 ---
  useEffect(() => {
    let currentMap: any = null;

    AMapLoader.load({
      key: "c2cb44bdf8a014380a909e6445befd39",
      version: "2.0",
      plugins: ["AMap.GeoJSON", "AMap.MassMarks", "AMap.InfoWindow"],
    })
      .then(async (AMap) => {
        if (!mapRef.current) return;

        const map = new AMap.Map(mapRef.current, {
          zoom: 4,
          center: [-1.5, 52.5],
          mapStyle: "amap://styles/grey",
        });

        currentMap = map;
        mapInstance.current = map;

        try {
          const apiUrl =
            "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson&limit=500";
          const response = await fetch(apiUrl);
          const rawData = await response.json();

          // --- 绘制海量点 (MassMarks) ---
          const points = transformApiResponse(rawData);

          const styles = [
            {
              url: "https://a.amap.com/jsapi_demos/static/images/mass0.png",
              anchor: new AMap.Pixel(4, 4),
              size: new AMap.Size(8, 8),
            },
            {
              url: "https://a.amap.com/jsapi_demos/static/images/mass1.png",
              anchor: new AMap.Pixel(4, 4),
              size: new AMap.Size(8, 8),
            },
          ];

          const massMarks = new AMap.MassMarks(points, {
            zIndex: 100,
            style: styles,
            alwaysRender: true, // 确保点在缩放时稳定显示
          });

          // 信息窗体
          const infoWindow = new AMap.InfoWindow({
            isCustom: true,
            offset: new AMap.Pixel(0, -10),
          });

          massMarks.on("mouseover", (e: any) => {
            const content = `
            <div style="padding:10px; background:white; border:1px solid #ccc; border-radius:4px; font-size:12px; color:#333;">
              <strong>${e.data.adminName}</strong><br/>
              国家: ${e.data.country}
            </div>`;
            infoWindow.setContent(content);
            infoWindow.open(map, e.data.lnglat);
          });

          massMarks.on("mouseout", () => infoWindow.close());
          massMarks.on("click", (e: any) => setSelectedInfo(e.data));

          massMarks.setMap(map);

          // --- 绘制边界 (GeoJSON) ---
          if (
            rawData.features.some((f: any) =>
              f.geometry.type.includes("Polygon")
            )
          ) {
            const geojson = new AMap.GeoJSON({
              geoJSON: rawData,
              getPolygon: (json: any, lnglats: any) => {
                return new AMap.Polygon({
                  path: lnglats,
                  fillOpacity: 0.1,
                  fillColor: "#3498db",
                  strokeColor: "#fff",
                  strokeWeight: 1,
                });
              },
            });
            map.add(geojson);
          }
        } catch (err) {
          console.error("数据加载或解析失败:", err);
        }
      })
      .catch((e) => {
        console.error("地图加载失败", e);
      });

    // 销毁地图实例，防止内存泄漏
    return () => {
      if (currentMap) {
        currentMap.destroy();
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {selectedInfo && (
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>地区详情</h3>
            <button onClick={() => setSelectedInfo(null)} style={closeBtnStyle}>
              ✕
            </button>
          </div>
          <div style={{ marginTop: "15px" }}>
            <p>
              <strong>行政区:</strong> {selectedInfo.adminName}
            </p>
            <p>
              <strong>所属国家:</strong> {selectedInfo.country}
            </p>
            <p>
              <strong>经纬度:</strong> {selectedInfo.lnglat[0].toFixed(2)},{" "}
              {selectedInfo.lnglat[1].toFixed(2)}
            </p>
          </div>
          <hr style={{ border: "0.5px solid #eee", margin: "15px 0" }} />
          <p style={{ color: "#666", fontSize: "12px" }}>
            数据来源: FoodTwin Global Database
          </p>
        </div>
      )}
    </div>
  );
};

// --- 样式定义 ---
const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: "20px",
  right: "20px",
  width: "300px",
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  zIndex: 1000,
  border: "1px solid rgba(0,0,0,0.05)",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
  color: "#999",
};

export default GlobalMapContainer;
