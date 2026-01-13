import axios from "axios";

// --- 定义类型接口以消除 any ---

interface GeoJsonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    regionName: string;
    cropGroup: string;
    productionValue: number;
    longitude?: number;
    latitude?: number;
  };
}

// 定义返回给高德地图 MassMarks 的数据结构
export interface MassMarkData {
  lnglat: [number, number];
  name: string;
  style: number;
  value: number;
  cropGroup: string;
}

// --- 基础配置 ---
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://10.0.3.4:5000",
});

export const FoodTwinApi = {
  // 1. 获取全球国家边界 GeoJSON
  getCountryPolygons: async () => {
    const { data } = await apiClient.get(
      "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson&limit=100"
    );
    return data;
  },

  // 2. 获取海量粮食产区分布点
  getCropDistribution: async (params?: {
    cropGroup?: string;
  }): Promise<MassMarkData[]> => {
    const { data } = await apiClient.get(
      "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson&limit=100",
      { params }
    );

    // 修复 any 错误：通过 map 的参数类型约束
    const features = (data.features || data) as GeoJsonFeature[];

    return features.map((item) => {
      const props = item.properties || {};
      const geometry = item.geometry || {};

      return {
        // 优先取 geometry 坐标，备选取 properties 中的经纬度
        lnglat: geometry.coordinates || [
          props.longitude || 0,
          props.latitude || 0,
        ],
        name: props.regionName,
        style: getCropStyleIndex(props.cropGroup),
        value: props.productionValue,
        cropGroup: props.cropGroup,
      };
    });
  },

  // 3. 获取特定国家详细粮食统计
  getCountryDetail: async (isoCode: string) => {
    const { data } = await apiClient.get(`/stats/country/${isoCode}`);
    return data;
  },
};

// 辅助函数：根据粮食分组返回颜色索引
function getCropStyleIndex(group: string): number {
  const groups: Record<string, number> = {
    Grains: 0,
    Vegetables: 1,
    Fruits: 2,
    Oilseeds: 3,
  };
  return groups[group] ?? 0;
}
