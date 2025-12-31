"use client";

interface ParticlesLayerProps {
  areaId: string;
}

// 通过给 areaId 添加下划线来规避 no-unused-vars 检查
export default function ParticlesLayer({
  areaId: _areaId,
}: ParticlesLayerProps) {
  return null;
}
