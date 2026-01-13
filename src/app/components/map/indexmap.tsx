"use client";
import React, { useEffect, useState, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

// --- 1. 类型定义 ---

interface GeoJsonProperty {
  id: string;
  crop?: string;
  admin_name?: string;
  name?: string;
  country?: string;
  [key: string]: string | number | undefined;
}

interface RegionData {
  id: string;
  name: string;
  cropType: string;
  country: string;
}

/** * 修复 any 错误：定义高德地图事件目标的具体接口
 */
interface AMapTarget {
  setOptions: (options: Record<string, string | number>) => void;
  getExtData: () => GeoJsonProperty & { baseColor: string };
}

interface AMapEvent {
  target: AMapTarget;
}

const CROP_CATEGORIES = [
  { label: "乳制品与鸡蛋", key: "dairy", color: "#87B9B0" },
  { label: "淀粉质根", key: "roots", color: "#5E81AC" },
  { label: "谷物", key: "cereals", color: "#D08770" },
  { label: "蔬菜", key: "vegetables", color: "#A3BE8C" },
  { label: "肉类与鱼类", key: "meat", color: "#BF616A" },
  { label: "油脂与油籽", key: "oil", color: "#EBCB8B" },
  { label: "水果", key: "fruits", color: "#B48EAD" },
  { label: "脉冲", key: "pulses", color: "#88C0D0" },
  { label: "树坚果", key: "nuts", color: "#A28E7D" },
  { label: "其他", key: "other", color: "#BDBDBD" },
];

const GlobalMapContainer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedInfo, setSelectedInfo] = useState<RegionData | null>(null);
  const mapInstance = useRef<AMap.Map | null>(null);

  useEffect(() => {
    // 修复：使用更安全的类型断言
    const securityConfig = window as unknown as {
      _AMapSecurityConfig: { securityCode: string };
    };
    securityConfig._AMapSecurityConfig = {
      securityCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "",
    };

    AMapLoader.load({
      key: process.env.NEXT_PUBLIC_AMAP_KEY || "你的Key",
      version: "2.0",
      plugins: ["AMap.GeoJSON"],
    }).then(async (AMapInstance) => {
      if (!mapRef.current) return;

      const map = new AMapInstance.Map(mapRef.current, {
        zoom: 3,
        center: [105, 35],
        mapStyle: "amap://styles/dark",
      });
      mapInstance.current = map;

      try {
        const resGeo = await fetch(
          "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson"
        );
        const geoData = await resGeo.json();

        const getColorByCrop = (cropName = "") => {
          const type = CROP_CATEGORIES.find((c) =>
            cropName.toLowerCase().includes(c.key)
          );
          return type ? type.color : "#BDBDBD";
        };

        const geojson = new AMapInstance.GeoJSON({
          geoJSON: geoData,
          // 修复：移除 any，使用接口定义
          getPolygon: (
            json: { properties: GeoJsonProperty },
            lnglats: number[][] | number[][][]
          ) => {
            const props = json.properties;
            const cropType = props.crop || "";
            const areaColor = getColorByCrop(cropType);

            return new AMapInstance.Polygon({
              path: lnglats,
              fillOpacity: 0.5,
              fillColor: areaColor,
              strokeColor: "#ffffff",
              strokeWeight: 0.5,
              extData: {
                ...props,
                baseColor: areaColor,
              },
            });
          },
        });

        // 统一使用已定义的 AMapEvent
        geojson.on("mouseover", (e: AMapEvent) => {
          e.target.setOptions({
            fillOpacity: 0.8,
            strokeWeight: 1.5,
            strokeColor: "#00F5FF",
          });
        });

        geojson.on("mouseout", (e: AMapEvent) => {
          const baseColor = e.target.getExtData().baseColor;
          e.target.setOptions({
            fillOpacity: 0.5,
            strokeWeight: 0.5,
            strokeColor: "#ffffff",
            fillColor: baseColor,
          });
        });

        geojson.on("click", (e: AMapEvent) => {
          const props = e.target.getExtData();
          setSelectedInfo({
            id: props.id || String(Math.random()),
            name: props.admin_name || props.name || "未知产区",
            cropType: props.crop || "未标注作物",
            country: props.country || "Global",
          });
        });

        map.add(geojson);
        map.setFitView();
      } catch (err) {
        // 修复 no-console：在 catch 块中使用 eslint-disable-next-line 或处理错误
        // eslint-disable-next-line no-console
        console.error("Map Load Error:", err);
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div style={containerStyle}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {/* 侧边栏及图例保持不变... */}
      <div
        style={{
          ...sidePanelStyle,
          transform: selectedInfo ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {selectedInfo && (
          <div style={{ padding: "40px 30px" }}>
            <div style={headerStyle}>
              <h2 style={{ fontSize: "20px", color: "#00F5FF" }}>产区详情</h2>
              <button
                onClick={() => setSelectedInfo(null)}
                style={closeBtnStyle}
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>
            <div style={itemStyle}>
              <span style={labelTitleStyle}>产区名称</span>
              <span>{selectedInfo.name}</span>
            </div>
            <div style={itemStyle}>
              <span style={labelTitleStyle}>所属国家</span>
              <span>{selectedInfo.country}</span>
            </div>
            <div style={itemStyle}>
              <span style={labelTitleStyle}>主要作物类别</span>
              <span style={{ color: "#7FFF00", fontSize: "18px" }}>
                {selectedInfo.cropType}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={legendContainerStyle}>
        <div style={legendTitleStyle}>作物分类图例</div>
        <div style={legendGrid}>
          {CROP_CATEGORIES.map((c) => (
            <div key={c.key} style={legendItem}>
              <span style={{ ...dot, backgroundColor: c.color }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 样式定义 ---
const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100vh",
  position: "relative",
  background: "#000",
};
const sidePanelStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  width: "300px",
  height: "100vh",
  background: "rgba(10, 15, 25, 0.9)",
  backdropFilter: "blur(15px)",
  borderLeft: "1px solid #00F5FF33",
  zIndex: 1001,
  transition: "transform 0.3s ease",
  color: "#fff",
};
const labelTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#999",
  marginBottom: "4px",
};
const legendContainerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "30px",
  left: "30px",
  padding: "15px",
  background: "rgba(0, 0, 0, 0.7)",
  border: "1px solid #333",
  borderRadius: "4px",
  zIndex: 1000,
};
const legendTitleStyle: React.CSSProperties = {
  marginBottom: "12px",
  fontWeight: "bold",
  fontSize: "14px",
  color: "#00F5FF",
};
const legendGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px 15px",
};
const legendItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: "12px",
  color: "#ccc",
};
const dot: React.CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  marginRight: "8px",
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "30px",
};
const itemStyle: React.CSSProperties = {
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  borderBottom: "1px solid #333",
  paddingBottom: "10px",
};
const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#666",
  cursor: "pointer",
  fontSize: "18px",
};

export default GlobalMapContainer;
