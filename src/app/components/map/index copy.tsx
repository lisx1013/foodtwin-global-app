"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "mapbox-gl/dist/mapbox-gl.css";
// Added specific types to replace 'any'
import type { MapRef, MapLayerMouseEvent } from "react-map-gl";
import mapboxgl from "mapbox-gl";

import MapPopup from "@/app/components/map-popup";

import { MachineContext, MachineProvider } from "./state";
import Legend from "./legend";
import FoodGroupsLayer from "./layers/foodgroups";
import AreaLayers from "./layers/areas";
import { AREA_SOURCE_ID } from "./constants";
import { EItemType } from "@/types/components";
import ParticlesLayer from "./layers/particles";

const Map = dynamic(() => import("react-map-gl").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      Loading map...
    </div>
  ),
});

const Source = dynamic(() => import("react-map-gl").then((mod) => mod.Source), {
  ssr: false,
});

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const mapboxStyleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;
const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

// FIXED: Corrected bounds type casting to avoid the error in image_dddd55.png
export const worldViewState = {
  bounds: [-170, -70, 170, 80] as [number, number, number, number],
};

// FIXED: Defined interface to replace 'any' for icons
interface MapIcon {
  name: string;
  url: string;
}

function loadIcons(map: mapboxgl.Map) {
  const icons: MapIcon[] = [
    { name: "port-icon", url: "/icons/port.png" },
    { name: "shipping_container-icon", url: "/icons/shipping_container.png" },
    { name: "producing_area-icon", url: "/icons/producing_area.png" },
  ];

  icons.forEach((icon) => {
    map.loadImage(icon.url, (error, image) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(`Error loading icon ${icon.name}:`, error);
        return;
      }
      if (map && image && !map.hasImage(icon.name)) {
        map.addImage(icon.name, image);
      }
    });
  });
}

function GlobeInner() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const actorRef = MachineContext.useActorRef();
  const mapRef = useRef<MapRef>(null); // FIXED: Specified MapRef type

  // Selectors
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

  // FIXED: Added specific MapLayerMouseEvent type
  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
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

  // FIXED: Added missing dependency 'actorRef' (image_ddd668.png)
  useEffect(() => {
    actorRef.send({
      type: "event:page:mount",
    });
  }, [actorRef]);

  // FIXED: Added missing dependencies for URL enter
  useEffect(() => {
    if (pageIsMounting || mapIsMounting) return;
    actorRef.send({
      type: "event:url:enter",
      pathname,
    });
  }, [pageIsMounting, mapIsMounting, pathname, params, actorRef]);

  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (mapRef.current) {
      const mapContainer = mapRef.current.getContainer();
      if (mapContainer) {
        resizeObserver.observe(mapContainer);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []); // mapRef is a stable ref, no need for dependency

  // FIXED: Added 'router' and specific event type (image_ddd668.png)
  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (mapRef.current) {
        const features = mapRef.current.queryRenderedFeatures(event.point, {
          layers: ["area-clickable-polygon"],
        });

        if (features.length > 0) {
          const feature = features[0];
          if (feature?.properties?.id) {
            router.push(`/area/${feature.properties.id}`);
          }
        }
      }
    },
    [router]
  );

  if (typeof window === "undefined") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex-1 z-10">
      <Legend />
      <Map
        mapboxAccessToken={mapboxAccessToken}
        ref={mapRef}
        initialViewState={worldViewState}
        minZoom={1.5}
        maxZoom={8}
        onClick={onClick}
        onLoad={() => {
          if (mapRef.current) {
            actorRef.send({
              type: "event:map:mount",
              mapRef: mapRef.current,
            });

            const map = mapRef.current.getMap();
            loadIcons(map);
          }
        }}
        onMouseMove={eventHandlers.mousemove ? handleMouseMove : undefined}
        onMouseOut={eventHandlers.mousemove ? handleMouseOut : undefined}
        onZoomEnd={eventHandlers.zoomEnd ? handleZoomEnd : undefined}
        style={{ width: "100%", height: "100%", flex: 1 }}
        mapStyle={mapboxStyleUrl}
      >
        {VECTOR_TILES_URL && (
          <Source
            id={AREA_SOURCE_ID}
            type="vector"
            tiles={[`${VECTOR_TILES_URL}/areas/{z}/{x}/{y}.pbf`]}
          />
        )}

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
      </Map>
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
