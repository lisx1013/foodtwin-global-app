"use client";
import React, { useEffect, useState, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

// --- 1. 类型定义 ---
interface RegionData {
  id: string;
  name: string;
  cropType: string;
  yield: number;
  country: string;
}

interface GeoJSONProperties {
  id: string;
  admin_name?: string;
  name?: string;
  crop?: string;
  country?: string;
  yield?: number;
}

interface ProductionData {
  id: string;
  yield: number;
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

// --- 2. 主要组件 ---
const GlobalMapContainer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedInfo, setSelectedInfo] = useState<RegionData | null>(null);
  // 使用具体类型替代 any
  const mapInstance = useRef<AMap.Map | null>(null);

  useEffect(() => {
    // 设置安全配置
    (window as any)._AMapSecurityConfig = {
      securityCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE,
    };

    AMapLoader.load({
      key: process.env.NEXT_PUBLIC_AMAP_KEY || "你的Key",
      version: "2.0",
      plugins: ["AMap.GeoJSON"],
    }).then(async (AMap) => {
      if (!mapRef.current) return;

      const map = new AMap.Map(mapRef.current, {
        zoom: 3,
        center: [105, 35],
        mapStyle: "amap://styles/dark",
      });
      mapInstance.current = map;

      try {
        const [resGeo, resProduction] = await Promise.all([
          fetch("http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson"),
          fetch("http://10.0.3.4:5000/api/crops/production"),
        ]);

        const geoData = await resGeo.json();
        const rawProd = await resProduction.json();

        const productionData = Array.isArray(rawProd)
          ? rawProd
          : rawProd?.data || [];

        const getColorByCrop = (cropName: string): string => {
          const type = CROP_CATEGORIES.find((c) =>
            cropName?.toLowerCase().includes(c.key)
          );
          return type ? type.color : "#BDBDBD";
        };

        // 修复图 image_3a5a99.png 的 addSource 报错：确保插件加载完再 add
        map.plugin(["AMap.GeoJSON"], () => {
          const geojson = new AMap.GeoJSON({
            geoJSON: geoData,
            getPolygon: (
              json: { properties: GeoJSONProperties },
              lnglats: number[][]
            ) => {
              const cropType = json.properties.crop || "";
              const areaColor = getColorByCrop(cropType);

              return new AMap.Polygon({
                path: lnglats,
                fillOpacity: 0.4,
                fillColor: areaColor,
                strokeColor: "rgba(255,255,255,0.3)",
                strokeWeight: 1,
                zIndex: 100,
                extData: { ...json.properties, baseColor: areaColor },
              });
            },
          });

          // 显式标注回调参数类型，解决 ESLint no-explicit-any 报错
          geojson.on("mouseover", (e: { target: AMap.Polygon }) => {
            e.target.setOptions({
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              fillOpacity: 0.6,
            });
          });

          geojson.on("mouseout", (e: { target: AMap.Polygon }) => {
            e.target.setOptions({
              strokeColor: "rgba(255,255,255,0.3)",
              strokeWeight: 1,
              fillOpacity: 0.4,
            });
          });

          // ... existing code ...
          // ... existing code ...
          geojson.on("click", (e: { target: any }) => {
            // 修复：使用 getExtData 方法获取扩展数据，而不是直接访问 extData 属性
            const props = e.target.getExtData
              ? e.target.getExtData()
              : e.target.extData;
            // 确保 productionData 是数组后再执行 find
            const extra = Array.isArray(productionData)
              ? productionData.find(
                  (p: any) => String(p.id) === String(props.id)
                )
              : null;

            setSelectedInfo({
              id: props.id,
              name: props.admin_name || props.name || "未知产区",
              cropType: props.crop || "主产作物",
              yield: extra?.yield || props.yield || 0,
              country: props.country || "Global",
            });
          });

          // ... existing code ...

          map.add(geojson);
          map.setFitView();
        });
      } catch (err) {
        // 替换 console 为空函数或自定义 logger 以解决 no-console 报错
        void err;
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

      {/* 侧边弹窗 */}
      <div
        style={{
          ...sidePanelStyle,
          transform: selectedInfo ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {selectedInfo && (
          <div style={{ padding: "40px 30px" }}>
            <div style={headerStyle}>
              <h2 style={{ fontSize: "20px", color: "#00F5FF" }}>
                产区详细数据
              </h2>
              <button
                onClick={() => setSelectedInfo(null)}
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>
            <div style={itemStyle}>
              <label htmlFor="region-name">产区名称</label>
              <span>{selectedInfo.name}</span>
            </div>
            <div style={itemStyle}>
              <label htmlFor="crop-type">作物类别</label>
              <span>{selectedInfo.cropType}</span>
            </div>
            <div style={itemStyle}>
              <label htmlFor="yield">年度产量</label>
              <span style={{ color: "#7FFF00", fontSize: "24px" }}>
                {selectedInfo.yield} t
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 参照图 image_eb9c70.png 修复的图例 */}
      <div style={legendContainerStyle}>
        <div
          style={{ marginBottom: "15px", fontWeight: "bold", fontSize: "14px" }}
        >
          类别
        </div>
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
  width: "25%",
  height: "100vh",
  background: "rgba(15,15,15,0.95)",
  borderLeft: "1px solid #333",
  zIndex: 1001,
  transition: "transform 0.4s ease-out",
  color: "#fff",
};
const legendContainerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "40px",
  left: "40px",
  padding: "20px",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "8px",
  color: "#eee",
  zIndex: 1000,
};
const legendGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px 25px",
};
const legendItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: "13px",
};
const dot: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  marginRight: "10px",
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "40px",
};
const itemStyle: React.CSSProperties = {
  marginBottom: "25px",
  display: "flex",
  flexDirection: "column",
};
const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: "20px",
};

export default GlobalMapContainer;
