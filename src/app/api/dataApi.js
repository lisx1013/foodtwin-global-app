import request from "@/utils/request";

// 1. 服务状态检查
export const checkHealth = () => {
  return request({
    url: "/health",
    method: "get",
  });
};

// 2. 获取数据统计
export const getCrcStats = () => {
  return request({
    url: "/crc",
    method: "get",
  });
};

// 3. 地图区域查询（传国家参数，比如中国）
export const getMapRegionData = (country) => {
  return request({
    url: "/map/region-data",
    method: "get",
    params: { country }, // 拼接成 ?country=中国
  });
};

// 4. 搜索建议（传关键词，比如“中”）
export const getSearchSuggest = (keyword) => {
  return request({
    url: "/search/suggest",
    method: "get",
    params: { keyword }, // 拼接成 ?keyword=中
  });
};

// 5. 获取所有国家列表
export const getAllCountries = () => {
  return request({
    url: "/search/countries",
    method: "get",
  });
};

// 6. 数据批量下载
export const batchExportData = () => {
  return request({
    url: "/batch-export",
    method: "get",
  });
};
