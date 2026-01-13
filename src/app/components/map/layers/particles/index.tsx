"use client";

// 1. 仅导入必要的类型，保持简洁
import { FC } from "react";

interface ParticlesLayerProps {
  areaId: string;
}

/**
 * 修复说明：
 * 1. 移除了解构赋值中的变量重命名（因为该变量在函数体中完全未被使用）。
 * 2. 直接在参数列表中保留占位，或直接简写，以通过 ESLint 的未使用变量检查。
 */
const ParticlesLayer: FC<ParticlesLayerProps> = () => {
  // 因为目前功能只是返回 null，不解构 areaId 也不会影响功能
  return null;
};

export default ParticlesLayer;
