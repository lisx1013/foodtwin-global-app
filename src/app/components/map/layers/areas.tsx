"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useMap } from "@uiw/react-amap";
import { MachineContext } from "../state";

// 完善AMap类型声明
declare global {
  namespace AMap {
    class Polygon {
      constructor(options: {
        path: number[][][];
        fillColor?: string;
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
        fillOpacity?: number;
        zIndex?: number;
        cursor?: string;
      });
      setMap(map: AMap.Map | null): void;
      hide(): void;
      show(): void;
      setOptions(options: any): void;
      getBounds(): AMap.Bounds | undefined;
      on(event: string, handler: (e: any) => void): void;
      off(event: string, handler: (e: any) => void): void;
      setPath(path: number[][][]): void;
      contains(point: AMap.LngLat): boolean;
    }
    class LngLat {
      constructor(lng: number, lat: number);
      lng: number;
      lat: number;
    }
    interface Map {
      on(event: string, handler: (e: any) => void): void;
      off(event: string, handler: (e: any) => void): void;
      getPixelFromLngLat(lnglat: LngLat): any;
      getLngLatFromPixel(pixel: any): LngLat;
    }
    interface Bounds {}
    namespace GeometryUtil {
      function isPointInRing(point: number[], ring: number[][]): boolean;
    }
  }
}

// 样式常量
const AREA_STYLES = {
  DEFAULT: {
    fillColor: "rgba(59, 178, 208, 0.3)",
    strokeColor: "rgba(28, 25, 23, 0.3)",
    strokeWeight: 1,
    strokeOpacity: 1,
    fillOpacity: 0.6,
    zIndex: 10,
  },
  SELECTED: {
    fillColor: "rgba(193, 237, 150, 0.6)",
    strokeColor: "rgba(28, 25, 23, 0.8)",
    strokeWeight: 2,
    strokeOpacity: 1,
    fillOpacity: 0.6,
    zIndex: 20,
  },
  DESTINATION: {
    fillColor: "rgba(199, 187, 168, 0.5)",
    strokeColor: "rgba(28, 25, 23, 0.5)",
    strokeWeight: 1,
    strokeOpacity: 1,
    fillOpacity: 0.6,
    zIndex: 15,
  },
  HOVER: {
    fillColor: "rgba(255, 0, 0, 0.6)",
    strokeColor: "rgba(28, 25, 23, 0.8)",
    strokeWeight: 2,
    strokeOpacity: 1,
    fillOpacity: 0.6,
    zIndex: 25,
  },
};

export default function ProvinceLayers() {
  const { map } = useMap();
  const actorRef = MachineContext.useActorRef();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [amapLoaded, setAmapLoaded] = useState(false); // 标记SDK是否加载完成

  // 状态管理
  const currentArea = MachineContext.useSelector(
    (state) => state.context.currentArea
  );
  const destinationAreas = MachineContext.useSelector(
    (state) => state.context.destinationAreas
  );
  const hoveredAreaId = useRef<string | null>(null);

  // 存储多边形实例（扩展存储path用于点在面判断）
  const polygonsRef = useRef<
    Map<
      string,
      {
        polygon: AMap.Polygon;
        area: any;
        path: number[][][]; // 存储坐标用于手动判断点在面内
      }
    >
  >(new Map());

  const mapMouseMoveHandler = useRef<((e: any) => void) | null>(null);

  // 加载高德地图SDK
  useEffect(() => {
    // 确保只在浏览器环境中执行
    if (typeof window === "undefined") {
      return;
    }

    const loadAMapSDK = async () => {
      // **[新增日志]** 检查是否已加载
      if (window.AMap) {
        console.log("✅ AMap SDK 已经存在");
        setAmapLoaded(true);
        return;
      }

      const key = process.env.NEXT_PUBLIC_AMAP_KEY;
      if (!key) {
        console.error("❌ 致命错误：请设置高德地图密钥 NEXT_PUBLIC_AMAP_KEY");
        return;
      }
      console.log("⏳ 尝试加载高德地图SDK...");

      try {
        const script = document.createElement("script");
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
        script.async = true;

        script.onload = () => {
          console.log("✅ 高德地图SDK加载完成");
          setAmapLoaded(true);
        };

        script.onerror = () => {
          console.error("❌ 高德地图SDK加载失败");
        };

        document.body.appendChild(script);
        console.log("✅ SDK script 标签已插入 DOM"); // **[新增日志]**
      } catch (error) {
        console.error("❌ 加载SDK出错:", error);
      }
    };

    loadAMapSDK();

    // 清理函数
    return () => {
      const script = document.querySelector(
        `script[src*="webapi.amap.com/maps"]`
      );
      if (script) document.body.removeChild(script);
    };
  }, []);

  // 获取省份数据
  useEffect(() => {
    // 确保只在浏览器环境中执行
    if (typeof window === "undefined") {
      return;
    }

    const fetchProvinces = async () => {
      if (!amapLoaded) {
        console.log("⏳ 等待 AMap SDK 加载完成才能获取省份数据"); // **[新增日志]**
        return;
      }

      try {
        const key = process.env.NEXT_PUBLIC_AMAP_KEY;
        if (!key) {
          console.error("❌ 致命错误：请设置高德地图密钥 NEXT_PUBLIC_AMAP_KEY");
          return;
        }

        console.log("⏳ 开始请求行政区划数据..."); // **[新增日志]**

        // 关键修复：extensions=all 获取边界坐标
        const url = `https://restapi.amap.com/v3/config/district?key=${key}&keywords=中国&subdistrict=1&extensions=all`;

        const response = await fetch(url);
        const data = await response.json();

        if (
          data.status === "1" &&
          data.districts &&
          data.districts.length > 0
        ) {
          // 提取中国的一级子区域（各省）
          const chinaDistricts = data.districts[0].districts;

          // 过滤掉没有polyline的无效区域
          const validProvinces = chinaDistricts.filter(
            (prov: any) => prov.polyline
          );
          setProvinces(validProvinces);
          console.log("✅ 获取到省份数据:", validProvinces.length);
          if (validProvinces.length === 0) {
            console.warn(
              "⚠️ 警告：获取到的省份数据数量为 0。请检查 API 密钥是否正确或数据返回是否为空。"
            ); // **[新增警告]**
          }
        } else {
          console.error("❌ 获取行政区数据失败:", data.info);
        }
      } catch (error) {
        console.error("❌ 获取省份数据失败:", error);
      }
    };

    fetchProvinces();
  }, [amapLoaded]);

  // 解析坐标并容错
  const parsePolyline = useCallback((polyline: string): number[][][] => {
    if (!polyline) return [];

    return polyline
      .split("|")
      .map((poly) => {
        return poly
          .split(";")
          .filter((point) => {
            if (!point) return false;
            const [lng, lat] = point.split(",").map(Number);
            return !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0;
          })
          .map((point) => {
            const [lng, lat] = point.split(",").map(Number);
            return [lng, lat];
          });
      })
      .filter((poly) => poly.length > 3); // 至少需要3个点形成面
  }, []);

  // 判断点是否在区域内（兼容2.0版本）
  const isPointInArea = useCallback(
    (lng: number, lat: number, areaId: string): boolean => {
      // 确保只在浏览器环境中执行
      if (typeof window === "undefined" || !window.AMap || !lng || !lat)
        return false;

      const item = polygonsRef.current.get(areaId);
      if (!item) return false;

      const point = [lng, lat];
      // 使用GeometryUtil判断点是否在面内（2.0版本推荐方式）
      return item.path.some((ring) => {
        return window.AMap.GeometryUtil.isPointInRing(point, ring);
      });
    },
    []
  );

  // 更新区域样式
  const updateAreaStyle = useCallback(
    (areaId: string, isHover: boolean = false) => {
      const item = polygonsRef.current.get(areaId);
      if (!item) return;

      const { polygon, area } = item;
      let baseStyle = AREA_STYLES.DEFAULT;

      if (currentArea?.id === areaId) {
        baseStyle = AREA_STYLES.SELECTED;
      } else if (destinationAreas.some((dest: any) => dest.id === areaId)) {
        baseStyle = AREA_STYLES.DESTINATION;
      }

      const finalStyle = isHover
        ? { ...baseStyle, ...AREA_STYLES.HOVER }
        : baseStyle;

      polygon.setOptions(finalStyle);
    },
    [currentArea, destinationAreas]
  );

  // 处理地图鼠标移动
  const handleMapMouseMove = useCallback(
    (e: any) => {
      if (!map || !e.lnglat) return;

      const { lng, lat } = e.lnglat;
      let currentHoverId: string | null = null;

      // 遍历所有区域判断鼠标是否在其中
      Array.from(polygonsRef.current.keys()).forEach((areaId) => {
        if (isPointInArea(lng, lat, areaId)) {
          currentHoverId = areaId;
        }
      });

      // 处理移出事件
      if (hoveredAreaId.current && currentHoverId !== hoveredAreaId.current) {
        updateAreaStyle(hoveredAreaId.current, false);
      }
      actorRef.send({ type: "event:area:hover:end" });

      // 处理移入事件
      if (currentHoverId && currentHoverId !== hoveredAreaId.current) {
        updateAreaStyle(currentHoverId, true);
        const areaName = polygonsRef.current.get(currentHoverId)?.area.name;
        actorRef.send({
          type: "event:area:hover",
          areaId: currentHoverId,
        });
      }

      hoveredAreaId.current = currentHoverId;
    },
    [map, isPointInArea, updateAreaStyle, actorRef]
  );

  // 创建省份多边形
  const createProvincePolygon = useCallback(
    (province: any) => {
      // 确保只在浏览器环境中执行
      if (
        typeof window === "undefined" ||
        !map ||
        !window.AMap ||
        !province ||
        !province.polyline
      )
        return;

      // 解析坐标
      const path = parsePolyline(province.polyline);
      if (path.length === 0) {
        console.warn(`省份${province.name}无有效坐标`, province.adcode);
        return;
      }

      try {
        const polygon = new window.AMap.Polygon({
          path,
          ...AREA_STYLES.DEFAULT,
          cursor: "pointer",
        });

        // 绑定点击事件
        polygon.on("click", () => {
          actorRef.send({
            type: "event:area:select",
            areaId: province.adcode,
          });
        });

        // 添加到地图
        polygon.setMap(map);

        // 存储多边形实例和坐标
        polygonsRef.current.set(province.adcode, {
          polygon,
          area: province,
          path,
        });

        // 初始化样式
        updateAreaStyle(province.adcode, false);
      } catch (error) {
        console.error(`创建${province.name}多边形失败`, error);
      }
    },
    [map, parsePolyline, updateAreaStyle, actorRef]
  );

  // 初始化省份多边形
  useEffect(() => {
    // 确保只在浏览器环境中执行
    if (typeof window === "undefined") {
      return;
    }

    if (!map) {
      console.log("⏳ 等待地图实例 (map) 准备就绪..."); // **[新增日志]**
      return;
    }
    if (!amapLoaded) {
      console.log("⏳ 等待 AMap SDK 加载完成..."); // **[新增日志]**
      return;
    }
    if (provinces.length === 0) {
      console.log("⏳ 等待省份数据加载..."); // **[新增日志]**
      return;
    }

    console.log("✨ 所有条件满足，开始创建多边形，省份数量:", provinces.length); // **[新增日志]**

    // 清空已有多边形
    polygonsRef.current.forEach(({ polygon }) => {
      try {
        polygon.setMap(null);
      } catch (e) {
        console.error("❌ 移除旧多边形失败", e);
      }
    });
    polygonsRef.current.clear();

    // 创建所有省份多边形
    provinces.forEach((province) => {
      createProvincePolygon(province);
    });

    console.log("✅ 多边形创建完毕，总数:", polygonsRef.current.size); // **[新增日志]**

    // 绑定地图鼠标移动事件
    mapMouseMoveHandler.current = handleMapMouseMove;
    map.on("mousemove", mapMouseMoveHandler.current);

    // 清理函数
    return () => {
      if (map && mapMouseMoveHandler.current) {
        map.off("mousemove", mapMouseMoveHandler.current);
      }
      polygonsRef.current.forEach(({ polygon }) => {
        try {
          polygon.setMap(null);
        } catch (e) {
          console.error("清理多边形失败", e);
        }
      });
      polygonsRef.current.clear();
      hoveredAreaId.current = null;
    };
  }, [map, amapLoaded, provinces, createProvincePolygon, handleMapMouseMove]);

  // 监听区域状态变化更新样式
  useEffect(() => {
    // 确保只在浏览器环境中执行
    if (typeof window === "undefined" || !map || !amapLoaded) return;

    Array.from(polygonsRef.current.keys()).forEach((areaId) => {
      const isHover = hoveredAreaId.current === areaId;
      updateAreaStyle(areaId, isHover);
    });
  }, [currentArea, destinationAreas, map, amapLoaded, updateAreaStyle]);

  return null;
}
