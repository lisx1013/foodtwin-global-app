"use client";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
// 新增：导入动态加载工具
import dynamic from "next/dynamic";

// 新增：动态导入地图组件（避开服务器渲染）
const MyMap = dynamic(() => import("@/app/components/map/MyMap"), {
  ssr: false,
  loading: () => <div style={{ height: "800px" }}>地图加载中...</div>,
});

const Home = () => {
  return (
    <div>
      {/* 保留原来的搜索按钮 */}
      <div className="absolute right-4 top-4 z-20">
        <Button
          href="/search"
          as={Link}
          startContent={
            <MagnifyingGlass size={20} className="text-neutral-400" />
          }
          className="rounded border-neutral-600 border bg-neutral-100/60 text-neutral-800 font-header text-xs tracking-tight"
        >
          Search the map
        </Button>
      </div>

      {/* 新增：地图组件（占满页面） */}
      <div style={{ width: "100%", height: "100vh" }}>
        <MyMap />
      </div>
    </div>
  );
};

export default Home;
