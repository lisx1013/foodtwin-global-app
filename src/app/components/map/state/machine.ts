// 临时修改以避免Mapbox类型错误
import { assign, createMachine, assertEvent, fromPromise } from "xstate";
import { StateEvents } from "./types/events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";
// 移除了 Mapbox 相关的导入
// import { MapRef } from "react-map-gl";
// import { GeoJSONFeature } from "mapbox-gl";
import { IMapPopup } from "../../map-popup";
import { EItemType } from "@/types/components";
import {
  AreaWithCentroidProps,
  FetchAreaResponse,
} from "@/app/api/areas/[id]/route";
import { worldViewState } from "../indexmap";
import { Legend } from "../legend";
import { AREA_SOURCE_ID, AREA_SOURCE_LAYER_ID } from "../constants";

// 删除重复定义的Action接口和StateActions类型，因为这些已经在 ./types/actions.ts 中定义并导入了

const getViewFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const val = EAreaViewType[params.get("view") as keyof typeof EAreaViewType];
  return (val || null) as EAreaViewType | null;
};

export const parseViewUrl = () => {
  // Parse area view URLs
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

  // default to world view
  return {
    viewType: EViewType.world,
  };
};

export enum EViewType {
  world = "world",
  area = "area",
}

export enum EAreaViewType {
  production = "production",
  transportation = "transportation",
  impact = "impact",
}

// 修改了上下文类型，使用 any 替代 Mapbox 特定类型
interface StateContext {
  viewType: EViewType | null;
  mapRef: any | null; // 使用 any 替代 MapRef
  legend: Legend | null;
  highlightedArea: any | null; // 使用 any 替代 GeoJSONFeature
  currentAreaId: string | null;
  currentArea: FetchAreaResponse | null;
  currentAreaFeature: any | null; // 使用 any 替代 GeoJSONFeature
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

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EARgAcAZiIB2AGz7dUswE4ArHbOGATDYA0IAJ6I7zoobNfQwAWYJCnKRtnAF9oj1RMHDoSckoaOkZmdi4+AWEwITZpOSQQRWVVdU0dBEM7KSIbfTMTZ10bFydg-Q9vBAMG3RcpXWdXYOsnG1j49Cw8QhSKKlpCTNYOQQoEDbAyYs1ylTUNUpqAWkNDfSJ9ZzMpMYfnQyl9dy9Ec9siA11dEx2GxNe4GYIzEAJebJHj8MSCdi4FhQdbZWF5dgHUpHSqnUAXMy6OxEZzmO5SOqjRwfPrfaxEUI2N5Ah6AuwmCFQpKLbhkMDcBAAMzAbAAxgALJEoiDqMBEJHUNAAazlXIWxF5-KFIolUoQCrQou4uOKWIUSmOVTOehGfnq13ewTM3QBhl6iGcUhMDJMXoCvuBhiJnLm3OIvG4MAQ6G4EHoZrKFtx1S+HVMDl8vl0wXqQLs7oQ52cdl0DMcJmCYxMNhMrSGIcS6qIEajMbjEl0JXNFROKYQrUGLOLNlGjzuBfOBm9w0rL3+vruDehixbYGjaFj8ecXcTPat+JthhsRBaR5c12zBh6n0LLSI5bCXv+umdBiXYebkbX8MRyNRHFXDEilkQ4k17a1bwBRoHWzOp9AcIwJ2aYkbBaatuidd4onfJtNQFVYCB2dg9ileMQOxMD920RAjAaEwAQMAIATMQIzALWwGgmCx7FtEcbHBOJIVDXC+XwugiLYEi-w7HccXAg8EH0elujsINnDuQlRhMAsrEcfxzGCCsiSPbocOSPD0kICSpJRCRt1Avc8Wo-t7H8EdHBzbN6MrHSLD8WxrkMQEvJcGJBLVczRMswjdjIUiJEMWTKKcmp9EBW4nCBJl7maIYCzGR5TAveilMeLozJ5KKCIQXgyDQCBBFFXF-wQLYUGs-ZyO7S0Uq+OpjE9VwgVCdkRn4nTHm9JoWlCIYgSGQwKo1KrxNq+rGuapgNhyOEhBEMRJC63cer7J1gmgnM7CMEIOnCHSrj8V5XmLFxgiJHMlqICzqrWhqmpOFr0XhERCgTOSqJqIMbikdk-gpBxs0CHT2mPbMmRrZwnWuMLZkbSKtWqtgyG4FhYEUMg2GNAGtuyNqOrB5K+0uVSSUeex+JzX12mCXyc3TMZLCG0lHk+77xKJkmyfISnNqyDggb20RxDABnHL7F5jweSaTGeytglQnTq0195IngqQpCdOxRZWqyJdJ8mZepuWdryEHBGApK1Ygh1flQhj3nuCx8xvdpiyISJ9f0JTLH+D7wuE-GxKs3BOAjJqWrp2LVZOiDmYGtnhs5saeZvArOPg30wjsEb+OtgnxJTtO2EB3JgaVw7PZzhTQm9BamiJdSgX9fLZtuEcWOr8YRjrpPCMb7h05p+XW8V0GjvB3qEHUm4rBaDTqRacbS5cUtnoti3gUJIKZ+ihAWDQAAxdACFgDPtiz9fGdz-rWfGK5WhMDHdiUdfjV1eFhI8pIwqCXvhAOAmgIqEAcl3Zy3wlLpkuo8J6-cJxWEsG5MwxZvLdFcDjISeNFikGWNFZByZc6jGPE8TCUcmGAInFEUwzR4K5QrJpfQn0FYIlUMiWh8lUHPFZqEV4-F-bOAnPRVGI51LOj9ldMhiDlpamFGKSUIiKJewUlYC2txq5DCUiEUIpICxvRPIAq6et+IBBzAJXGy5wxfnXLGUREMvhOD8ICTBLwKQ4JvOcMI3ogRjXHlWJwn1AI-mEVAbxm86TnQeGhbmUjry0mBOdT0EDDIdEmDfaqsUpTJL7LWUsExuZGCsJhGkiAgrnQtq8GGUdniPBceQtxX0baEV+htMRG8mbVhPI6f4hC2j6zeBNYxF4Lb6FCKVUIJTxbE3ttLKmVERn0PuAyYs1hXhOBYsFXmxhbCBCJPYHWR4OTxwoZo2e+pU4LzYBU+hhUsy2jqdWB4jSt5EjopWCwzxAjmytg83pYsrL3yfmgF+HyFLnDGdxCY1xzaekiACli50JiAmQoCQI1ZYixCAA */
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

    states: {
      "world:view": {
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

        entry: "action:enterWorldMapView",
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

      "area:fetching": {
        invoke: {
          src: "actor:fetchArea",
          input: ({ context: { currentAreaId, currentArea } }) => ({
            areaId: currentAreaId,
            currentArea,
          }),
          onDone: {
            target: "area:view:entering",
            actions: ["action:resetAreaViewMap", "action:setCurrentArea"],
            reenter: true,
          },
        },
      },

      "page:load": {
        always: [
          {
            target: "world:view",
            guard: "guard:isWorldView",
          },
          {
            target: "area:view:entering",
            guard: "guard:isCurrentAreaLoaded",
          },
          {
            target: "area:fetching",
            reenter: true,
          },
        ],

        entry: {
          type: "action:parseUrl",
        },
      },

      "page:mounting": {
        on: {
          "event:page:mount": {
            target: "map:mounting",
            reenter: true,
          },
        },
      },

      "area:view:entering": {
        always: [
          {
            target: "area:view:production",
            guard: "guard:areaHasNoFlows",
            reenter: true,
          },
          {
            target: "area:view:production",
            guard: "guard:isAreaProductionView",
          },
          {
            target: "area:view:transportation",
            guard: "guard:isAreaTransportationView",
          },
          {
            target: "area:view:impact",
            reenter: true,
          },
        ],
      },

      "area:view:production": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view:production",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view:production",
            actions: "action:clearHighlightedArea",
          },
        },

        entry: ["action:enterProductionAreaView"],

        exit: "action:exitProductionAreaView",
      },

      "area:view:transportation": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view:transportation",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view:transportation",
            actions: "action:clearHighlightedArea",
          },

          "event:map:zoomend": {
            target: "area:view:transportation",
            actions: "action:applyDestinationAreaIdsToMap",
          },
        },

        entry: [
          "action:enterTransportationAreaView",
          "action:applyDestinationAreaIdsToMap",
        ],
        exit: "action:exitTransportationAreaView",
      },

      "area:view:impact": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view:impact",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view:impact",
            actions: "action:clearHighlightedArea",
          },
        },

        entry: [
          "action:enterImpactAreaView",
          "action:applyDestinationAreaIdsToMap",
        ],

        exit: "action:exitImpactAreaView",
      },

      "area:view:noFlows": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },
        },
      },
    },

    initial: "page:mounting",
  },
  {
    actions: {
      "action:parseUrl": assign(parseViewUrl),

      "action:setMapRef": assign(({ event }) => {
        assertEvent(event, "event:map:mount");

        return {
          mapRef: event.mapRef,
        };
      }),
      "action:setHighlightedArea": assign(({ event, context }) => {
        assertEvent(event, "event:map:mousemove");

        const { highlightedArea, mapRef } = context;

        // 由于我们使用了 any 类型，这里暂时返回空对象
        // 在高德地图完全实现后，需要重新实现这部分逻辑
        if (!mapRef) {
          return {};
        }

        // 暂时返回空对象避免错误
        return {};
      }),
      "action:clearHighlightedArea": assign(({ event, context }) => {
        assertEvent(event, "event:map:mouseout");

        const { highlightedArea, mapRef } = context;

        // 暂时返回空对象避免错误
        if (!mapRef) {
          return {};
        }

        // 暂时返回空对象避免错误
        return {};
      }),
      "action:resetAreaViewMap": assign(({ context }) => {
        const { mapRef, currentAreaFeature, destinationAreasFeatureIds } =
          context;

        // 暂时返回空对象避免错误
        if (!mapRef) return {};

        // 暂时返回空对象避免错误
        return {};
      }),
      // ... existing code ...
      // ... existing code ...
      "action:setCurrentArea": assign(({ event, context }) => {
        // 类型守卫检查是否为异步操作完成事件
        if (!("output" in event)) {
          return {};
        }

        const doneEvent = event as {
          output: FetchAreaResponse;
        };

        const { mapRef } = context;

        // 暂时返回空对象避免错误
        if (!mapRef) return {};

        // 暂时返回部分数据避免错误
        return {
          currentArea: doneEvent.output,
          destinationAreas: doneEvent.output.destinationAreas,
        };
      }),
      // ... existing code ...
      // ... existing code ...
      "action:enterProductionAreaView": assign(({ context }) => {
        const { mapRef } = context;

        // 暂时返回空对象避免错误
        if (mapRef) {
          // 高德地图相关代码将在后续实现
        }

        return {
          legend: { type: "category" } as Legend,
        };
      }),
      "action:exitProductionAreaView": assign(({ context }) => {
        const { mapRef } = context;

        // 暂时返回空对象避免错误
        if (mapRef) {
          // 高德地图相关代码将在后续实现
        }

        return {};
      }),

      "action:enterTransportationAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        // 暂时返回空对象避免错误
        if (!mapRef || !currentArea) return {};

        return { legend: null };
      }),
      "action:exitTransportationAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        // 暂时返回空对象避免错误
        if (mapRef && currentArea) {
          // 高德地图相关代码将在后续实现
        }

        return {};
      }),
      "action:enterImpactAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        // 暂时返回空对象避免错误
        if (mapRef && currentArea) {
          // 高德地图相关代码将在后续实现
        }

        return {};
      }),
      "action:exitImpactAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        // 暂时返回空对象避免错误
        if (mapRef && currentArea) {
          // 高德地图相关代码将在后续实现
        }

        const legend: Legend = {
          type: "category",
        };

        return {
          legend,
        };
      }),
      "action:applyDestinationAreaIdsToMap": assign(({ context }) => {
        const { mapRef, destinationAreas } = context;

        // 暂时返回空对象避免错误
        if (!mapRef) {
          return {};
        }

        // 暂时返回空数组避免错误
        return {
          destinationAreasFeatureIds: [],
        };
      }),

      "action:enterWorldMapView": assign(({ context }) => {
        const { mapRef, currentAreaFeature } = context;

        // 暂时返回空对象避免错误
        if (mapRef) {
          // 高德地图相关代码将在后续实现
        }

        return {
          currentAreaId: null,
          currentArea: null,
          currentAreaFeature: null,
          legend: { type: "category" } as Legend,
        };
      }),
    },
    guards: {
      "guard:isWorldView": ({ context }) => {
        return context.viewType === EViewType.world;
      },
      "guard:areaHasNoFlows": ({ context }) => {
        return context.currentArea?.destinationAreas.length === 0;
      },
      "guard:isAreaProductionView": () => {
        return getViewFromUrl() === EAreaViewType.production;
      },
      "guard:isAreaTransportationView": () => {
        return getViewFromUrl() === EAreaViewType.transportation;
      },
      "guard:isAreaImpactView": () => {
        return getViewFromUrl() === EAreaViewType.impact;
      },
      "guard:isCurrentAreaLoaded": ({ context }) => {
        return context.currentArea?.id === context.currentAreaId;
      },
    },
    actors: {
      "actor:fetchArea": fromPromise<
        FetchAreaResponse,
        { areaId: string; currentArea: FetchAreaResponse }
      >(async ({ input }) => {
        const { areaId, currentArea } = input;
        if (areaId === currentArea?.id) {
          return currentArea;
        }
        const response = await fetch(`/api/areas/${input.areaId}`);
        return await response.json();
      }),
    },
  }
);
