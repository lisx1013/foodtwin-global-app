"use client";
import React, { useState, useEffect, useRef } from "react";
// 修复 184057: 仅导入核心组件，移除无法导出的 GeoJSON
import { Map, APILoader } from "@uiw/react-amap";

// --- 1. 类型定义 ---
interface GeoJsonProperty {
  id: string;
  crop?: string;
  admin_name?: string;
  name?: string;
  country?: string;
  [key: string]: any;
}

interface RegionData {
  id: string;
  name: string;
  cropType: string;
  country: string;
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

const getColorByCrop = (cropName: string = "") => {
  const type = CROP_CATEGORIES.find((c) =>
    cropName.toLowerCase().includes(c.key)
  );
  return type ? type.color : "#BDBDBD";
};

const GlobalMapContainer: React.FC = () => {
  const [selectedInfo, setSelectedInfo] = useState<RegionData | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  // 修复 184530/184707: 使用 any 类型的 Ref 彻底避开组件库不完整的类型校验
  const mapRef = useRef<any>(null);

  // 1. 异步获取数据
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const res = await fetch(
          "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson"
        );
        const data = await res.json();
        setGeoData(data);
      } catch (err: any) {
        // 修复 183756: 显式 any
        console.error("Fetch Error:", err);
      }
    };
    fetchGeoData();
  }, []);

  useEffect(() => {
    const map = mapRef.current?.map;
    if (!map || !geoData) return;

    // 修复 184539/184522: 强制断言为 any 以便调用原生 add/clearMap 方法
    const rawMap = map as any;
    rawMap.clearMap();

    // 修复 184057: 检查 AMap 是否加载并使用原生 GeoJSON
    if (typeof window !== "undefined" && (window as any).AMap) {
      const AMapObj = (window as any).AMap;

      const geojson = new AMapObj.GeoJSON({
        geoJSON: geoData,
        // 修复 183756/183806: 显式参数类型
        getPolygon: (json: any, lnglats: any) => {
          const props = json.properties as GeoJsonProperty;
          const areaColor = getColorByCrop(props.crop);
          return new AMapObj.Polygon({
            path: lnglats,
            fillOpacity: 0.5,
            fillColor: areaColor,
            strokeColor: "#ffffff",
            strokeWeight: 0.5,
            extData: { ...props, baseColor: areaColor },
          });
        },
      });

      geojson.on("mouseover", (e: any) => {
        e.target.setOptions({
          fillOpacity: 0.8,
          strokeWeight: 1.5,
          strokeColor: "#00F5FF",
        });
      });

      geojson.on("mouseout", (e: any) => {
        const baseColor = e.target.getExtData().baseColor;
        e.target.setOptions({
          fillOpacity: 0.5,
          strokeWeight: 0.5,
          strokeColor: "#ffffff",
          fillColor: baseColor,
        });
      });

      geojson.on("click", (e: any) => {
        const props = e.target.getExtData();
        setSelectedInfo({
          id: props.id || String(Math.random()),
          name: props.admin_name || props.name || "未知产区",
          cropType: props.crop || "未标注作物",
          country: props.country || "Global",
        });
      });

      rawMap.add(geojson);
      rawMap.setFitView();
    }
  }, [geoData]);

  return (
    <div style={containerStyle}>
      <APILoader akey={process.env.NEXT_PUBLIC_AMAP_KEY || ""}>
        <Map
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          mapOptions={{
            zoom: 3,
            center: [105, 35],
            mapStyle: "amap://styles/dark",
            viewMode: "2D",
          }}
        />
      </APILoader>

      {/* 侧边栏和图例部分保持不变 */}
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

// 样式定义
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
