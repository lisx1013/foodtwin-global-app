// Deleted:import { Popup } from "react-map-gl";
import { EItemType } from "@/types/components";
import TypeIcon from "./icons/type-icon";
import "./css/popup.css";

export interface IMapPopup {
  id: string;
  label: string;
  itemType: EItemType;
  longitude: number;
  latitude: number;
  colorScheme?: "light" | "dark";
}

function MapPopup({
  id,
  label,
  itemType,
  longitude,
  latitude,
  colorScheme = "light",
}: IMapPopup) {
  // 高德地图使用信息窗体而不是Popup
  const colorClasses =
    colorScheme === "light"
      ? "bg-white text-neutral-800"
      : "bg-neutral-800 text-white";

  // 由于高德地图的InfoWindow需要通过地图实例来控制，
  // 这里返回一个用于定位的标记和内容的组合
  return (
    <div
      key={id}
      style={{
        position: "absolute",
        left: `${longitude}px`,
        top: `${latitude}px`,
        zIndex: 10,
        transform: "translate(-50%, -100%)", // 使标记点位于底部中心
      }}
    >
      <div
        className={`flex gap-2 items-center font-header tracking-tighter ${colorClasses} p-2 rounded`}
        style={{
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
        }}
      >
        <TypeIcon itemType={itemType} />
        <span>{label}</span>
      </div>
      {/* 添加一个向下的箭头指示器 */}
      <div
        className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"
        style={{
          marginLeft: "calc(50% - 4px)",
        }}
      />
    </div>
  );
}

export default MapPopup;
