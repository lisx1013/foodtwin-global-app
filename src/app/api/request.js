import axios from "axios";

const service = axios.create({
  baseURL: "http://10.68.51.22:5000/api", // 后端服务地址
  timeout: 10000, // 超时时间
});

// 响应拦截器（可选，统一处理返回数据）
service.interceptors.response.use(
  (response) => {
    return response.data; // 直接返回数据体
  },
  (error) => {
    // 移除了 console.log 语句
    return Promise.reject(error);
  }
);

export default service;
