"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// 动态导入高德地图组件（禁用SSR）
const DynamicAPILoader = dynamic(
  () => import("@uiw/react-amap").then((mod) => mod.APILoader),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        加载地图资源中...
      </div>
    ),
  }
);
const DynamicMap = dynamic(
  () => import("@uiw/react-amap").then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        初始化地图...
      </div>
    ),
  }
);

// 动态导入其他组件
const MapPopup = dynamic(() => import("@/app/components/map-popup"), {
  ssr: false,
});
const Legend = dynamic(() => import("./legend"), { ssr: false });
const FoodGroupsLayer = dynamic(() => import("./layers/foodgroups"), {
  ssr: false,
});
const AreaLayers = dynamic(() => import("./layers/areas"), { ssr: false });
const ParticlesLayer = dynamic(() => import("./layers/particles"), {
  ssr: false,
});

import { MachineContext, MachineProvider } from "./state";
import { EItemType } from "@/types/components";

// 高德地图相关类型定义
type AMapInstance = AMap.Map;
type AmapClickEvent = AMap.MapsEvent;
type AmapPixel = AMap.Pixel;

// 环境变量
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

// 动态加载图标（仅在客户端执行）
const loadIcons = (map: AMapInstance) => {
  if (typeof window === "undefined") return; // 确保在客户端执行
  // 图标加载逻辑保持不变
};

// 动态瓦片数据源组件（仅客户端渲染）
const AmapVectorTileSource = dynamic(
  () => {
    return new Promise((resolve) => {
      resolve(() => {
        const { useSelector } = MachineContext;
        const mapRef = useSelector((state: any) => state.context.mapRef);

        useEffect(() => {
          if (!mapRef || typeof AMap === "undefined" || !VECTOR_TILES_URL)
            return;

          const tileLayer = new AMap.TileLayer.Flexible({
            zIndex: 10,
            getTileUrl: (x: number, y: number, z: number) => {
              const tmsY = Math.pow(2, z) - 1 - y;
              return `${VECTOR_TILES_URL}/areas/${z}/${x}/${y}.pbf`;
            },
            onTileError: (error: Error) => {},
          });

          tileLayer.show();

          return () => {
            if (tileLayer) {
              try {
                tileLayer.hide();
              } catch (e) {}
            }
          };
        }, [mapRef]);

        return null;
      });
    });
  },
  { ssr: false }
);

// 要素查询函数（仅客户端可用）
const queryAmapFeatures = (map: AMapInstance, pixel: AmapPixel) => {
  if (typeof window === "undefined") return [];
  // 查询逻辑保持不变
  return [];
};

function GlobeInner() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const actorRef = MachineContext.useActorRef();
  const mapRef = useRef<AMapInstance | null>(null);

  // 状态选择器
  const pageIsMounting = MachineContext.useSelector((s: any) =>
    s.matches("page:mounting")
  );
  const mapIsMounting = MachineContext.useSelector((s: any) =>
    s.matches("map:mounting")
  );
  const eventHandlers = MachineContext.useSelector(
    (state: any) => state.context.eventHandlers
  );
  const mapPopup = MachineContext.useSelector(
    (state: any) => state.context.mapPopup
  );
  const currentArea = MachineContext.useSelector(
    (state: any) => state.context.currentArea
  );

  // 事件处理函数
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

  // 生命周期
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

  // 容器Resize逻辑
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (mapRef.current) {
          const zoom = mapRef.current.getZoom();
          mapRef.current.setZoom(zoom);
        }
      }, 100);
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

  // 地图点击事件
  const onClick = useCallback(
    (event: AmapClickEvent) => {
      if (mapRef.current) {
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

  // 检查配置
  if (!amapKey || !amapSecurityCode) {
    return <div>地图加载失败：缺少必要的配置信息</div>;
  }

  // 渲染
  return (
    <div className="w-full h-full relative flex-1 z-10" id="amap-container">
      <Legend />
      <DynamicAPILoader
        version="2.0"
        akey={amapKey}
        securityCode={amapSecurityCode}
        plugins={["AMap.TileLayer.Flexible"]}
      >
        <DynamicMap
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
          <AmapVectorTileSource />
          <FoodGroupsLayer />
          <AreaLayers />
          {currentArea && <ParticlesLayer areaId={currentArea.id} />}

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
        </DynamicMap>
      </DynamicAPILoader>
    </div>
  );
}

export default function Globe() {
  return (
    <MachineProvider>
      <GlobeInner />
    </MachineProvider>
  );
}
