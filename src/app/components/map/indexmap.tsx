"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import React, { useState, useEffect, useRef } from "react";
// 1. 解决 ts(2314): 重命名 Map 避免与原生 Map 冲突
import { Map as AMapContainer, APILoader } from "@uiw/react-amap";

// --- 1. 业务接口定义 ---
interface GeoJsonProperty {
  id: string;
  crop?: string;
  admin_name?: string;
  name?: string;
  country?: string;
  baseColor?: string; // 存储原始颜色
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

// 修复错误 52:25: 去掉冗余类型标注 (no-inferrable-types)
const getColorByCrop = (cropName = "") => {
  const type = CROP_CATEGORIES.find((c) =>
    cropName.toLowerCase().includes(c.key)
  );
  return type ? type.color : "#BDBDBD";
};

const GlobalMapContainer: React.FC = () => {
  const [selectedInfo, setSelectedInfo] = useState<RegionData | null>(null);
  const [geoData, setGeoData] = useState<unknown | null>(null);

  // 3. 解决 ts(2749): 使用 ElementRef 获取组件实例类型
  const mapRef = useRef<React.ElementRef<typeof AMapContainer>>(null);
  const textMarkerRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const res = await fetch(
          "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson"
        );
        const data = await res.json();
        setGeoData(data);
      } catch (err) {
        // 修复错误 77:9: 允许 console 报错 (no-console)
        // eslint-disable-next-line no-console
        console.error("Fetch Error:", err);
      }
    };
    fetchGeoData();
  }, []);

  useEffect(() => {
    // 使用 any 中转 window.AMap
    const AMapInstance = (window as any).AMap;
    const map = mapRef.current?.map;

    if (!map || !geoData || !AMapInstance) return;

    if (geojsonLayerRef.current) {
      map.remove(geojsonLayerRef.current);
    }

    // 初始化悬浮文本标记
    if (!textMarkerRef.current) {
      const text = new AMapInstance.Text({
        text: "",
        anchor: "bottom-center",
        offset: new AMapInstance.Pixel(0, -10),
      });
      text.setStyle({
        padding: "6px 10px",
        "background-color": "rgba(10, 20, 30, 0.9)",
        border: "1px solid #00F5FF",
        color: "#fff",
        "border-radius": "4px",
        "font-size": "13px",
      });
      textMarkerRef.current = text;
    }

    // 配置 GeoJSON 图层
    const geojson = new AMapInstance.GeoJSON({
      geoJSON: geoData,
      getPolygon: (json: any, lnglats: any) => {
        const props = json.properties as GeoJsonProperty;
        const areaColor = getColorByCrop(props.crop);

        const polygon = new AMapInstance.Polygon({
          path: lnglats,
          fillOpacity: 0.5,
          fillColor: areaColor,
          strokeColor: "#ffffff",
          strokeWeight: 0.5,
          extData: { ...props, baseColor: areaColor },
        });

        // 鼠标移入：变色 + 显示文本
        polygon.on("mouseover", (e: any) => {
          const target = e.target;
          const data = target.getExtData() as GeoJsonProperty;

          target.setOptions({
            fillOpacity: 0.8,
            strokeWeight: 1.5,
            strokeColor: "#00F5FF",
          });

          if (textMarkerRef.current) {
            textMarkerRef.current.setText(
              data.admin_name || data.name || "未知产区"
            );
            textMarkerRef.current.setPosition(e.lnglat);
            map.add(textMarkerRef.current);
          }
        });

        // 鼠标移出：还原
        polygon.on("mouseout", (e: any) => {
          const target = e.target;
          const data = target.getExtData() as GeoJsonProperty;

          target.setOptions({
            fillOpacity: 0.5,
            strokeWeight: 0.5,
            strokeColor: "#ffffff",
            fillColor: data.baseColor,
          });

          if (textMarkerRef.current) {
            map.remove(textMarkerRef.current);
          }
        });

        // 点击：展示详情
        polygon.on("click", (e: any) => {
          const data = e.target.getExtData() as GeoJsonProperty;
          setSelectedInfo({
            id: data.id || "0",
            name: data.admin_name || data.name || "未知产区",
            cropType: data.crop || "未标注",
            country: data.country || "Global",
          });
        });

        return polygon;
      },
    });

    geojson.setMap(map);
    geojsonLayerRef.current = geojson;
    map.setFitView();

    return () => {
      if (geojsonLayerRef.current) map.remove(geojsonLayerRef.current);
      if (textMarkerRef.current) map.remove(textMarkerRef.current);
    };
  }, [geoData]);

  return (
    <div style={containerStyle}>
      <APILoader akey={process.env.NEXT_PUBLIC_AMAP_KEY || ""}>
        <AMapContainer
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          zoom={3}
          center={[105, 35]}
          mapStyle="amap://styles/dark"
          viewMode="2D"
        />
      </APILoader>

      {/* 侧边栏 */}
      <div
        style={{
          ...sidePanelStyle,
          transform: selectedInfo ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {selectedInfo && (
          <div style={{ padding: "40px 30px" }}>
            <h2
              style={{
                fontSize: "20px",
                color: "#00F5FF",
                marginBottom: "20px",
              }}
            >
              产区详情
            </h2>
            <div style={itemStyle}>
              <span style={labelStyle}>产区名称</span>
              <span>{selectedInfo.name}</span>
            </div>
            <div style={itemStyle}>
              <span style={labelStyle}>所属国家</span>
              <span>{selectedInfo.country}</span>
            </div>
            <div style={itemStyle}>
              <span style={labelStyle}>主要作物</span>
              <span style={{ color: "#7FFF00" }}>{selectedInfo.cropType}</span>
            </div>
            <button onClick={() => setSelectedInfo(null)} style={closeBtnStyle}>
              ✕ 关闭
            </button>
          </div>
        )}
      </div>

      {/* 图例 */}
      <div style={legendContainerStyle}>
        <div
          style={{ color: "#00F5FF", marginBottom: "10px", fontWeight: "bold" }}
        >
          作物分类图例
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {CROP_CATEGORIES.map((c) => (
            <div
              key={c.key}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "12px",
                color: "#ccc",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: c.color,
                  marginRight: "8px",
                }}
              />
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
  width: "320px",
  height: "100vh",
  background: "rgba(10, 15, 25, 0.95)",
  borderLeft: "1px solid #00F5FF44",
  zIndex: 1001,
  transition: "transform 0.3s ease",
  color: "#fff",
};

const itemStyle: React.CSSProperties = {
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  borderBottom: "1px solid #333",
  paddingBottom: "10px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
  marginBottom: "5px",
};

const closeBtnStyle: React.CSSProperties = {
  marginTop: "20px",
  background: "#333",
  border: "none",
  color: "#fff",
  padding: "8px 16px",
  cursor: "pointer",
  borderRadius: "4px",
};

const legendContainerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "30px",
  left: "30px",
  padding: "15px",
  background: "rgba(0, 0, 0, 0.8)",
  border: "1px solid #333",
  borderRadius: "4px",
  zIndex: 1000,
};

export default GlobalMapContainer;
