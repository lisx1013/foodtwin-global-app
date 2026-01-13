"use client";

// 临时修改以避免 Mapbox 类型错误
import { assign, createMachine, assertEvent, fromPromise } from "xstate";
import { StateEvents } from "./types/events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";
import { IMapPopup } from "../../map-popup";
import {
  AreaWithCentroidProps,
  FetchAreaResponse,
} from "@/app/api/areas/[id]/route";
import { Legend } from "../legend";

// 定义视图枚举
export enum EViewType {
  world = "world",
  area = "area",
}

export enum EAreaViewType {
  production = "production",
  transportation = "transportation",
  impact = "impact",
}

// 修复：EItemType 原本定义但未引用，若不需要可删除，若逻辑需要请保留
export enum EItemType {
  food = "food",
  country = "country",
}

// 修改上下文类型：使用 unknown 替代 any 解决 no-explicit-any
interface StateContext {
  viewType: EViewType | null;
  mapRef: unknown | null; // AMap 实例或 Mapbox 实例，设为 unknown 需在使用时转换
  legend: Legend | null;
  highlightedArea: unknown | null;
  currentAreaId: string | null;
  currentArea: FetchAreaResponse | null;
  currentAreaFeature: unknown | null;
  currentAreaViewType: EAreaViewType | null;
  destinationAreas: AreaWithCentroidProps[];
  destinationAreasFeatureIds: number[];
  mapPopup: IMapPopup | null;
  mapBounds: BBox | null;
  eventHandlers: {
    mousemove: boolean;
    zoomEnd: boolean;
  };
}

const getViewFromUrl = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const val = EAreaViewType[params.get("view") as keyof typeof EAreaViewType];
  return (val || null) as EAreaViewType | null;
};

export const parseViewUrl = () => {
  if (typeof window === "undefined") return { viewType: EViewType.world };
  const pathname = window.location.pathname;
  if (pathname.startsWith("/area/")) {
    const [, , areaId] = pathname.split("/");
    const areaViewType = getViewFromUrl() || EAreaViewType.production;
    return {
      viewType: EViewType.area,
      currentAreaId: areaId,
      currentAreaViewType: areaViewType,
    };
  }
  return { viewType: EViewType.world };
};

export const globeViewMachine = createMachine(
  {
    id: "globeView",
    types: {
      context: {} as StateContext,
      events: {} as StateEvents,
      actions: {} as StateActions,
    },
    context: {
      viewType: EViewType.world,
      mapRef: null,
      legend: { type: "category" },
      highlightedArea: null,
      currentAreaId: null,
      currentArea: null,
      currentAreaFeature: null,
      currentAreaViewType: null,
      destinationAreas: [],
      destinationAreasFeatureIds: [],
      mapPopup: null,
      mapBounds: null,
      eventHandlers: {
        mousemove: true,
        zoomEnd: true,
      },
    },
    initial: "page:mounting",
    states: {
      "page:mounting": {
        on: {
          "event:page:mount": {
            target: "map:mounting",
            reenter: true,
          },
        },
      },
      "map:mounting": {
        on: {
          "event:map:mount": {
            target: "page:load",
            actions: "action:setMapRef",
            reenter: true,
          },
        },
      },
      "page:load": {
        entry: { type: "action:parseUrl" },
        always: [
          { target: "world:view", guard: "guard:isWorldView" },
          { target: "area:view:entering", guard: "guard:isCurrentAreaLoaded" },
          { target: "area:fetching", reenter: true },
        ],
      },
      "area:fetching": {
        invoke: {
          src: "actor:fetchArea",
          input: ({ context: { currentAreaId, currentArea } }) => ({
            areaId: currentAreaId || "",
            currentArea,
          }),
          onDone: {
            target: "area:view:entering",
            actions: ["action:resetAreaViewMap", "action:setCurrentArea"],
            reenter: true,
          },
        },
      },
      "world:view": {
        entry: "action:enterWorldMapView",
        on: {
          "event:map:mousemove": {
            target: "world:view",
            actions: "action:setHighlightedArea",
          },
          "event:map:mouseout": {
            target: "world:view",
            actions: "action:clearHighlightedArea",
          },
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },
        },
      },
      "area:view:entering": {
        always: [
          { target: "area:view:production", guard: "guard:areaHasNoFlows" },
          {
            target: "area:view:production",
            guard: "guard:isAreaProductionView",
          },
          {
            target: "area:view:transportation",
            guard: "guard:isAreaTransportationView",
          },
          { target: "area:view:impact" },
        ],
      },
      "area:view:production": {
        entry: ["action:enterProductionAreaView"],
        on: {
          "event:map:mousemove": { actions: "action:setHighlightedArea" },
          "event:map:mouseout": { actions: "action:clearHighlightedArea" },
          "event:url:enter": { target: "page:load", reenter: true },
        },
        exit: "action:exitProductionAreaView",
      },
      "area:view:transportation": {
        entry: [
          "action:enterTransportationAreaView",
          "action:applyDestinationAreaIdsToMap",
        ],
        on: {
          "event:map:zoomend": {
            actions: "action:applyDestinationAreaIdsToMap",
          },
          "event:url:enter": { target: "page:load", reenter: true },
        },
        exit: "action:exitTransportationAreaView",
      },
      "area:view:impact": {
        entry: [
          "action:enterImpactAreaView",
          "action:applyDestinationAreaIdsToMap",
        ],
        on: { "event:url:enter": { target: "page:load", reenter: true } },
        exit: "action:exitImpactAreaView",
      },
    },
  },
  {
    actions: {
      "action:parseUrl": assign(parseViewUrl),
      "action:setMapRef": assign(({ event }) => {
        assertEvent(event, "event:map:mount");
        return { mapRef: event.mapRef };
      }),
      "action:setHighlightedArea": assign(({ context }) => {
        // 修复：移除 event 解构以解决 no-unused-vars
        if (!context.mapRef) return {};
        return {};
      }),
      "action:clearHighlightedArea": assign(({ context }) => {
        if (!context.mapRef) return {};
        return {};
      }),
      "action:resetAreaViewMap": assign(({ context }) => {
        if (!context.mapRef) return {};
        return {};
      }),
      "action:setCurrentArea": assign(({ event }) => {
        if (!("output" in event)) return {};
        const doneEvent = event as { output: FetchAreaResponse };
        return {
          currentArea: doneEvent.output,
          destinationAreas: doneEvent.output.destinationAreas,
        };
      }),
      "action:enterProductionAreaView": assign(() => ({
        legend: { type: "category" } as Legend,
      })),
      "action:exitProductionAreaView": assign(() => ({})),
      "action:enterTransportationAreaView": assign(() => ({ legend: null })),
      "action:exitTransportationAreaView": assign(() => ({})),
      "action:enterImpactAreaView": assign(() => ({})),
      "action:exitImpactAreaView": assign(() => ({
        legend: { type: "category" } as Legend,
      })),
      "action:applyDestinationAreaIdsToMap": assign(() => ({
        destinationAreasFeatureIds: [],
      })),
      "action:enterWorldMapView": assign(() => ({
        currentAreaId: null,
        currentArea: null,
        currentAreaFeature: null,
        legend: { type: "category" } as Legend,
      })),
    },
    guards: {
      "guard:isWorldView": ({ context }) =>
        context.viewType === EViewType.world,
      "guard:areaHasNoFlows": ({ context }) =>
        context.currentArea?.destinationAreas.length === 0,
      "guard:isAreaProductionView": () =>
        getViewFromUrl() === EAreaViewType.production,
      "guard:isAreaTransportationView": () =>
        getViewFromUrl() === EAreaViewType.transportation,
      "guard:isCurrentAreaLoaded": ({ context }) =>
        context.currentArea?.id === context.currentAreaId,
    },
    actors: {
      "actor:fetchArea": fromPromise<
        FetchAreaResponse,
        { areaId: string; currentArea: FetchAreaResponse | null }
      >(async ({ input }) => {
        const { areaId, currentArea } = input;
        if (areaId === currentArea?.id) return currentArea;
        const response = await fetch(`/api/areas/${areaId}`);
        return await response.json();
      }),
    },
  }
);
