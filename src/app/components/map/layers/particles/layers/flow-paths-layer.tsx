"use client";

import { FeatureCollection, LineString } from "geojson";

interface FlowPathsLayerProps {
  pathsData: FeatureCollection<LineString> | undefined;
}

export function FlowPathsLayer({ pathsData }: FlowPathsLayerProps) {
  // 由于高德地图不直接支持通过React组件添加GeoJSON数据，
  // 这个组件将在DeckGL Overlay中处理，而不是在这里直接渲染
  // 参考项目中的DeckGLOverlay实现
  if (!pathsData) return null;

  // 在高德地图中，我们通过DeckGL Overlay来渲染路径
  // 因此这里返回null，实际渲染由DeckGL处理
  return null;
}
