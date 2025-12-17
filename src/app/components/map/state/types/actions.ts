// 临时修改以避免Mapbox类型错误

// ... existing code ...
interface ActionApplyDestinationAreaIdsToMap {
  type: "action:applyDestinationAreaIdsToMap";
  destinationAreasFeatureIds: number[];
}

// 删除重复的StateActions类型定义，因为我们从./types/actions导入了它
// type StateActions =
//   | ActionParseUrl
//   | ActionEnterWorldMapView
//   | ActionEnterAreaView
//   | ActionUpdateMapPopup
//   | ActionUpdateDestinationAreas
//   | ActionSetMapRef
//   | ActionSetHighlightedArea
//   | ActionClearHighlightedArea
//   | ActionResetAreaViewMap
//   | ActionSetCurrentArea
//   | ActionEnterProductionAreaView
//   | ActionExitProductionAreaView
//   | ActionEnterTransportationAreaView
//   | ActionExitTransportationAreaView
//   | ActionEnterImpactAreaView
//   | ActionExitImpactAreaView
//   | ActionApplyDestinationAreaIdsToMap;

export type { StateActions };
import { assign, createMachine, assertEvent, fromPromise } from "xstate";
import { StateEvents } from "./events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";
// 移除了 Mapbox 相关的导入
// import { MapRef } from "react-map-gl";
// import { GeoJSONFeature } from "mapbox-gl";
import { IMapPopup } from "../../../map-popup";
import { EItemType } from "@/types/components";
import {
  AreaWithCentroidProps,
  FetchAreaResponse,
} from "@/app/api/areas/[id]/route";
import { worldViewState } from "../../indexmap";
import { Legend } from "../../legend/index";
import { AREA_SOURCE_ID, AREA_SOURCE_LAYER_ID } from "../../constants";

// ... existing code ...
