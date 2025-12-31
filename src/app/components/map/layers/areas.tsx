"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useMap } from "@uiw/react-amap";
import { MachineContext } from "../state";

/**
 * 补全高德地图命名空间，解决 ts(2503) 和 ts(2339) 报错
 */
declare global {
  namespace AMap {
    class LngLat {
      constructor(lng: number, lat: number);
      lng: number;
      lat: number;
    }
    interface PolygonOptions {
      path: number[][][] | number[][];
      fillColor?: string;
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      fillOpacity?: number;
      zIndex?: number;
      cursor?: string;
    }
    class Polygon {
      constructor(options: PolygonOptions);
      setMap(map: Map | null): void;
      setOptions(options: Partial<PolygonOptions>): void;
      on(event: string, handler: (e: any) => void): void;
      off(event: string, handler: (e: any) => void): void;
    }
    interface Map {
      on(event: string, handler: (e: any) => void): void;
      off(event: string, handler: (e: any) => void): void;
      plugin(name: string | string[], callback: () => void): void;
      setFitView(overlay?: any): void;
      destroy(): void;
    }
    namespace GeometryUtil {
      function isPointInRing(point: number[], ring: number[][]): boolean;
    }
  }
  interface Window {
    AMap: typeof AMap;
  }
}

// 定义业务接口，消除 "Unexpected any"
interface ProvinceArea {
  adcode: string;
  name: string;
  polyline: string;
}

interface PolygonInstance {
  polygon: AMap.Polygon;
  area: ProvinceArea;
  path: number[][][];
}

interface MapMoveEvent {
  lnglat: {
    lng: number;
    lat: number;
  };
}

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
  const [provinces, setProvinces] = useState<ProvinceArea[]>([]);
  const [amapLoaded, setAmapLoaded] = useState(false);

  const currentArea = MachineContext.useSelector(
    (state) => state.context.currentArea
  );
  const destinationAreas = MachineContext.useSelector(
    (state) => state.context.destinationAreas
  );

  const hoveredAreaId = useRef<string | null>(null);
  const polygonsRef = useRef<Map<string, PolygonInstance>>(new Map());
  const mapMouseMoveHandler = useRef<((e: MapMoveEvent) => void) | null>(null);

  // 加载 SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.AMap) {
      setAmapLoaded(true);
      return;
    }
    const key = process.env.NEXT_PUBLIC_AMAP_KEY;
    if (!key) return;

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
    script.async = true;
    script.onload = () => setAmapLoaded(true);
    document.body.appendChild(script);
  }, []);

  // 获取省份数据
  useEffect(() => {
    if (!amapLoaded) return;
    const fetchProvinces = async () => {
      try {
        const key = process.env.NEXT_PUBLIC_AMAP_KEY;
        const url = `https://restapi.amap.com/v3/config/district?key=${key}&keywords=中国&subdistrict=1&extensions=all`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "1" && data.districts?.[0]?.districts) {
          const valid = data.districts[0].districts.filter(
            (p: ProvinceArea) => p.polyline
          );
          setProvinces(valid);
        }
      } catch (e) {
        // 捕获异常
      }
    };
    fetchProvinces();
  }, [amapLoaded]);

  const parsePolyline = useCallback((polyline: string): number[][][] => {
    if (!polyline) return [];
    return polyline
      .split("|")
      .map((poly) => poly.split(";").map((pt) => pt.split(",").map(Number)))
      .filter((p) => p.length > 3);
  }, []);

  const updateAreaStyle = useCallback(
    (areaId: string, isHover = false) => {
      const item = polygonsRef.current.get(areaId);
      if (!item) return;

      let baseStyle = AREA_STYLES.DEFAULT;
      if (currentArea?.id === areaId) {
        baseStyle = AREA_STYLES.SELECTED;
      } else if (
        Array.isArray(destinationAreas) &&
        destinationAreas.some((d: any) => d.id === areaId)
      ) {
        baseStyle = AREA_STYLES.DESTINATION;
      }

      item.polygon.setOptions(
        isHover ? { ...baseStyle, ...AREA_STYLES.HOVER } : baseStyle
      );
    },
    [currentArea, destinationAreas]
  );

  const handleMapMouseMove = useCallback(
    (e: MapMoveEvent) => {
      if (!map || !e.lnglat) return;
      const { lng, lat } = e.lnglat;
      let currentHoverId: string | null = null;

      polygonsRef.current.forEach((item, id) => {
        const isInside = item.path.some((ring) =>
          window.AMap.GeometryUtil.isPointInRing([lng, lat], ring)
        );
        if (isInside) currentHoverId = id;
      });

      if (hoveredAreaId.current && currentHoverId !== hoveredAreaId.current) {
        updateAreaStyle(hoveredAreaId.current, false);
        actorRef.send({ type: "event:area:hover:end" });
      }

      if (currentHoverId && currentHoverId !== hoveredAreaId.current) {
        updateAreaStyle(currentHoverId, true);
        actorRef.send({ type: "event:area:hover", areaId: currentHoverId });
      }
      hoveredAreaId.current = currentHoverId;
    },
    [map, updateAreaStyle, actorRef]
  );

  // 创建并管理多边形，解决 image_3a5a99 错误
  useEffect(() => {
    if (!map || !amapLoaded || provinces.length === 0) return;

    // 保存当前的 ref 值以避免清理函数中的警告
    const currentPolygonsRef = polygonsRef.current;
    const currentMapMouseMoveHandler = mapMouseMoveHandler.current;

    // 清理之前的多边形
    currentPolygonsRef.forEach((item) => item.polygon.setMap(null));
    currentPolygonsRef.clear();

    // 创建新的多边形
    provinces.forEach((province) => {
      const path = parsePolyline(province.polyline);
      if (path.length === 0) return;

      const polygon = new window.AMap.Polygon({
        path,
        ...AREA_STYLES.DEFAULT,
        cursor: "pointer",
      });

      polygon.on("click", () => {
        actorRef.send({ type: "event:area:select", areaId: province.adcode });
      });

      // 正确用法：使用 setMap 挂载到地图，解决 addSource/addLayer 报错
      polygon.setMap(map);
      currentPolygonsRef.set(province.adcode, {
        polygon,
        area: province,
        path,
      });
      updateAreaStyle(province.adcode, false);
    });

    // 设置鼠标移动事件处理器
    if (currentMapMouseMoveHandler) {
      map.on("mousemove", currentMapMouseMoveHandler);
    }

    // 清理函数
    return () => {
      if (currentMapMouseMoveHandler) {
        map.off("mousemove", currentMapMouseMoveHandler);
      }
      currentPolygonsRef.forEach((item) => item.polygon.setMap(null));
    };
  }, [
    map,
    amapLoaded,
    provinces,
    parsePolyline,
    handleMapMouseMove,
    updateAreaStyle,
    actorRef,
  ]);

  return null;
}
