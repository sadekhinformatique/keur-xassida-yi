import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/api/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    const msg = error.response?.data?.error || error.response?.data?.detail || 'Une erreur est survenue';
    if (error.response?.status !== 401) {
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/api/auth/login/', data),
  me: () => api.get('/api/auth/me/'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/api/auth/change-password/', data),
  forgotPassword: (data: { email: string }) => api.post('/api/auth/forgot-password/', data),
};

// Employees
export const employeesAPI = {
  list: (params?: any) => api.get('/api/employees/', { params }),
  detail: (id: number) => api.get(`/api/employees/${id}/`),
  create: (data: FormData) =>
    api.post('/api/employees/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    api.patch(`/api/employees/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/api/employees/${id}/`),
};

// Attendance
export const attendanceAPI = {
  list: (params?: any) => api.get('/api/attendance/', { params }),
  today: () => api.get('/api/attendance/today/'),
  dashboard: () => api.get('/api/attendance/dashboard/'),
  checkIn: (data: any) => api.post('/api/attendance/check_in/', data),
  checkOut: (data: any) => api.post('/api/attendance/check_out/', data),
};

// QR Code
export const qrAPI = {
  generate: (duration: number) => api.post('/api/qr-session/generate/', { duration_seconds: duration }),
  active: () => api.get('/api/qr-session/active/'),
  verify: (data: any) => api.post('/api/qr-session/verify/', data),
};

// Schedules
export const schedulesAPI = {
  list: (params?: any) => api.get('/api/schedules/', { params }),
  create: (data: any) => api.post('/api/schedules/', data),
  update: (id: number, data: any) => api.patch(`/api/schedules/${id}/`, data),
  delete: (id: number) => api.delete(`/api/schedules/${id}/`),
};

// Reports
export const reportsAPI = {
  list: (params?: any) => api.get('/api/reports/', { params }),
  summary: (params?: any) => api.get('/api/reports/summary/', { params }),
  exportCSV: (params?: any) => api.get('/api/reports/export_csv/', { params, responseType: 'blob' }),
  exportExcel: (params?: any) => api.get('/api/reports/export_excel/', { params, responseType: 'blob' }),
  exportPDF: (params?: any) => api.get('/api/reports/export_pdf/', { params, responseType: 'blob' }),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/api/settings/'),
  update: (data: any) => api.post('/api/settings/', data),
};

// Departments & Services
export const deptAPI = {
  list: () => api.get('/api/employees/departments/'),
  create: (data: any) => api.post('/api/employees/departments/', data),
  delete: (id: number) => api.delete(`/api/employees/departments/${id}/`),
};

export const serviceAPI = {
  list: (params?: any) => api.get('/api/employees/services/', { params }),
  create: (data: any) => api.post('/api/employees/services/', data),
  delete: (id: number) => api.delete(`/api/employees/services/${id}/`),
};
