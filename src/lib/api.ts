import axios from "axios";

// 基础配置
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || " http://10.0.3.4:5000",
});

export const FoodTwinApi = {
  // 1. 获取全球国家边界 GeoJSON
  getCountryPolygons: async () => {
    // 对应文档中可能存在的 /geometry/countries 接口
    const { data } = await apiClient.get(
      "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson&limit=100"
    );
    return data;
  },

  // 2. 获取海量粮食产区分布点
  // 通常支持按粮食种类(cropType)或区域过滤
  getCropDistribution: async (params?: { cropGroup?: string }) => {
    const { data } = await apiClient.get(
      "http://10.0.3.4:5000/api/gpkg/data?file=file1&format=geojson&limit=100",
      {
        params,
      }
    );

    // 数据清洗：确保格式符合高德 MassMarks [lng, lat] 要求
    return data.map((item: any) => ({
      lnglat: [item.longitude, item.latitude],
      name: item.regionName,
      style: getCropStyleIndex(item.cropGroup), // 转换种类到样式索引
      value: item.productionValue, // 产量
      cropGroup: item.cropGroup,
    }));
  },

  // 3. 获取特定国家详细粮食统计（用于点击弹窗）
  getCountryDetail: async (isoCode: string) => {
    const { data } = await apiClient.get(`/stats/country/${isoCode}`);
    return data;
  },
};

// 辅助函数：根据粮食分组返回颜色索引
function getCropStyleIndex(group: string): number {
  const groups: Record<string, number> = {
    Grains: 0, // 谷物 -> 样式1
    Vegetables: 1, // 蔬菜 -> 样式2
    Fruits: 2, // 水果 -> 样式3
    Oilseeds: 3, // 油料 -> 样式4
  };
  return groups[group] ?? 0;
}
