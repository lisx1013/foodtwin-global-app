"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import MapPopup from "@/app/components/map-popup";
import { MachineContext, MachineProvider } from "./state";
import Legend from "./legend";
import FoodGroupsLayer from "./layers/foodgroups";
import AreaLayers from "./layers/areas";
import { EItemType } from "@/types/components";
import ParticlesLayer from "./layers/particles";

// 高德地图相关导入
import { APILoader, Map } from "@uiw/react-amap";

type AMapInstance = AMap.Map;
type AmapClickEvent = AMap.MapsEvent;
type AmapPixel = AMap.Pixel;

// ------------------- Environment variables for Amap -------------------
const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY;
const amapSecurityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

export const worldViewState = {
  center: [108.948024, 34.263161] as [number, number], // 西安作为中心点
  zoom: 3,
} as {
  center: [number, number];
  zoom: number;
};

function loadIcons(map: AMapInstance) {
  // 移除了 console.log 语句
}

function AmapVectorTileSource() {
  const mapRef = MachineContext.useSelector((state) => state.context.mapRef);

  useEffect(() => {
    // 确保 mapRef 存在且 AMap JS SDK 已加载
    if (!mapRef || typeof AMap === "undefined" || !VECTOR_TILES_URL) return;

    // AMap.TileLayer.Flexible 是加载自定义瓦片的标准方式
    const tileLayer = new AMap.TileLayer.Flexible({
      zIndex: 10,
      getTileUrl: (x: number, y: number, z: number) => {
        const tmsY = Math.pow(2, z) - 1 - y;
        return `${VECTOR_TILES_URL}/areas/${z}/${x}/${y}.pbf`;
      },
      onTileError: (error: Error) => {
        // 移除了 console.error 语句
      },
    });

    tileLayer.show();

    return () => {
      if (tileLayer) {
        try {
          tileLayer.hide();
        } catch (e) {
          // 移除了 console.warn 语句
        }
      }
    };
  }, [mapRef]);

  return null;
}

function queryAmapFeatures(map: AMapInstance, pixel: AmapPixel) {
  // 移除了 console.log 语句
  return [];
}

function GlobeInner() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const actorRef = MachineContext.useActorRef();
  // MapRef 类型更改为 AMapInstance
  const mapRef = useRef<AMapInstance | null>(null);

  // Selectors (保持不变)
  const pageIsMounting = MachineContext.useSelector((s) =>
    s.matches("page:mounting")
  );
  const mapIsMounting = MachineContext.useSelector((s) =>
    s.matches("map:mounting")
  );
  const eventHandlers = MachineContext.useSelector(
    (state) => state.context.eventHandlers
  );
  const mapPopup = MachineContext.useSelector(
    (state) => state.context.mapPopup
  );
  const currentArea = MachineContext.useSelector(
    (state) => state.context.currentArea
  );

  const handleMouseMove = useCallback(
    (event: AmapClickEvent) => {
      actorRef.send({
        type: "event:map:mousemove",
        mapEvent: event,
      });
    },
    [actorRef]
  );

  const handleMouseOut = useCallback(() => {
    actorRef.send({
      type: "event:map:mouseout",
    });
  }, [actorRef]);

  const handleZoomEnd = useCallback(() => {
    actorRef.send({
      type: "event:map:zoomend",
    });
  }, [actorRef]);

  // ------------------- 生命周期 (保持不变) -------------------
  useEffect(() => {
    actorRef.send({ type: "event:page:mount" });
  }, [actorRef]);

  useEffect(() => {
    if (pageIsMounting || mapIsMounting) return;
    actorRef.send({
      type: "event:url:enter",
      pathname,
    });
  }, [pageIsMounting, mapIsMounting, pathname, params, actorRef]);

  // ------------------- 容器 Resize 逻辑 (调整) -------------------
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (mapRef.current) {
          // 使用一个轻量级操作来触发重绘
          const zoom = mapRef.current.getZoom();
          mapRef.current.setZoom(zoom);
        }
      }, 100); // 100ms 防抖延迟
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const container = document.getElementById("amap-container");

    if (container) {
      resizeObserver.observe(container);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // ------------------- 地图点击事件重写 -------------------
  const onClick = useCallback(
    (event: AmapClickEvent) => {
      if (mapRef.current) {
        // 1. 使用高德地图 API 模拟查询
        // event.pixel 提供了点击的像素坐标
        const features = queryAmapFeatures(mapRef.current, event.pixel);

        if (features.length > 0) {
          const feature = features[0];
          if (feature?.properties) {
            router.push(`/area/${feature.properties.id}`);
          }
        } else {
          actorRef.send({ type: "event:area:unselect" });
        }
      }
    },
    [router, actorRef]
  );

  // 在组件渲染前添加检查
  if (!amapKey || !amapSecurityCode) {
    // 移除了 console.error 语句
    return <div>地图加载失败：缺少必要的配置信息</div>;
  }

  // ------------------- 渲染 -------------------

  return (
    <div className="w-full h-full relative flex-1 z-10" id="amap-container">
      <Legend />
      <APILoader
        version="2.0"
        akey={amapKey}
        securityCode={amapSecurityCode}
        plugins={["AMap.TileLayer.Flexible"]}
      >
        <Map
          center={worldViewState.center}
          zoom={worldViewState.zoom}
          zooms={[3, 8]}
          viewMode="3D"
          style={{ width: "100%", height: "100%", flex: 1 }}
          onClick={onClick}
          onMousemove={eventHandlers.mousemove ? handleMouseMove : undefined}
          onMouseout={eventHandlers.mousemove ? handleMouseOut : undefined}
          onZoomend={eventHandlers.zoomEnd ? handleZoomEnd : undefined}
          onComplete={(mapInstance) => {
            mapRef.current = mapInstance as AMap.Map;

            actorRef.send({
              type: "event:map:mount",
              mapRef: mapRef.current,
            });

            loadIcons(mapRef.current);
          }}
        >
          {/* 自定义的矢量瓦片 Source */}
          <AmapVectorTileSource />

          {/* 子图层 (内部需重写) */}
          <FoodGroupsLayer />
          <AreaLayers />
          {currentArea && <ParticlesLayer areaId={currentArea.id} />}

          {/* MapPopup (需适配高德地图) */}
          {mapPopup && <MapPopup {...mapPopup} />}
          {currentArea && (
            <MapPopup
              id={currentArea.id}
              longitude={currentArea.centroid.coordinates[0]}
              latitude={currentArea.centroid.coordinates[1]}
              label={currentArea.name}
              itemType={EItemType.area}
              colorScheme="dark"
            />
          )}
        </Map>
      </APILoader>
    </div>
  );
}

// 保持不变
export default function Globe() {
  return (
    <MachineProvider>
      <GlobeInner />
    </MachineProvider>
  );
}
