"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useMap } from "@uiw/react-amap";
import { MachineContext } from "../state";

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
  lnglat: AMap.LngLat;
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

  // 修复 ts(2352): 使用 unknown 转换不兼容的类型
  const destinationAreas = MachineContext.useSelector(
    (state) => state.context.destinationAreas as unknown as { id: string }[]
  );

  const hoveredAreaId = useRef<string | null>(null);
  const polygonsRef = useRef<Map<string, PolygonInstance>>(new Map());

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
        void e; // 修复 no-console
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
      } else if (destinationAreas?.some((d) => d.id === areaId)) {
        baseStyle = AREA_STYLES.DESTINATION;
      }

      item.polygon.setOptions(
        isHover ? { ...baseStyle, ...AREA_STYLES.HOVER } : baseStyle
      );
    },
    [currentArea, destinationAreas]
  );

  const handleMapMouseMove = useCallback(
    (e: unknown) => {
      if (!map || !amapLoaded) return;
      const event = e as MapMoveEvent;
      const { lng, lat } = event.lnglat;
      let currentHoverId: string | null = null;

      polygonsRef.current.forEach((item, id) => {
        const isInside = window.AMap.GeometryUtil.isPointInRing(
          [lng, lat],
          item.path[0]
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
    [map, amapLoaded, updateAreaStyle, actorRef]
  );

  useEffect(() => {
    if (!map || !amapLoaded || provinces.length === 0) return;

    const currentPolygonsRef = polygonsRef.current;
    currentPolygonsRef.forEach((item) => item.polygon.setMap(null));
    currentPolygonsRef.clear();

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

      polygon.setMap(map as unknown as AMap.Map);
      currentPolygonsRef.set(province.adcode, {
        polygon,
        area: province,
        path,
      });
      updateAreaStyle(province.adcode, false);
    });

    map.on("mousemove", handleMapMouseMove);

    return () => {
      map.off("mousemove", handleMapMouseMove);
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
