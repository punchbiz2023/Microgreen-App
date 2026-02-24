/**
 * API service for backend communication
 */

import axios from 'axios';

let API_BASE_URL: string;

if (import.meta.env.VITE_API_URL) {
  // Use explicit environment variable if provided
  API_BASE_URL = import.meta.env.VITE_API_URL;
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development: use localhost:8001
  API_BASE_URL = 'http://localhost:8000';
} else {
  // Public deployment: construct backend URL from frontend URL
  // Replace port 5174 with 8000 in the hostname
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;

  // For VS Code devtunnels
  if (currentHost.includes('devtunnels')) {
    const backendHost = currentHost.replace('-5174.', '-8000.');
    API_BASE_URL = `${protocol}//${backendHost}`;
  } else if (currentHost.includes('ngrok')) {
    API_BASE_URL = `${protocol}//${currentHost}`;
  } else {
    API_BASE_URL = `${protocol}//${currentHost}`;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERFACES ---

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  preference_mode: 'home' | 'pro';
  created_at: string;
}

export interface Seed {
  id: number;
  seed_type: string;
  name: string;
  latin_name?: string;
  difficulty: string;

  // Growing Defaults
  seed_count_per_gram?: string;
  sow_density?: string;
  soaking_duration_hours?: number;
  blackout_time_days?: number;
  germination_days?: number;
  harvest_days?: number;

  // Textual
  soaking_req?: string;
  watering_req?: string;

  // Environmental
  avg_yield_grams?: number;
  ideal_temp?: number;
  ideal_humidity?: number;

  // Rich Info
  description?: string;
  taste?: string;
  nutrition?: string;
  pros?: string;
  cons?: string;
  suggested_seed_weight?: number;
  external_links?: Array<{ url: string; desc: string }>;
  care_instructions?: string;
  source_url?: string;
  fertilizer_info?: string;
  growth_tips?: string;

  is_mucilaginous: boolean;
  growth_category?: string;

  // Pro Specs
  target_dli?: number;
  protein_gram_per_100g?: number;
  vitamin_c_mg_per_100g?: number;

  growth_days: number;
}

export interface Crop {
  id: number;
  seed_id: number;
  start_datetime: string; // ISO String
  tray_size?: string;
  number_of_trays: number;
  status: string;
  created_at: string;
  harvested_at?: string;
  seed: Seed;
  harvest?: Harvest;

  custom_settings: Record<string, any>;
  notification_settings: Record<string, any>;
  daily_logs: DailyLog[];

  // Pro Cultivation Specs
  ppfd_level?: number;
  light_hours_per_day: number;

  // Pro Financials
  seed_cost: number;
  soil_cost: number;
  energy_cost_per_kwh: number;
  other_costs: number;
}

export interface DailyLog {
  id: number;
  crop_id: number;
  day_number: number;
  watered: boolean;
  temperature?: number;
  humidity?: number;
  photo_path?: string;
  notes?: string;
  actions_recorded: string[]; // List of action types
  predicted_yield?: number;
  logged_at: string;
}

export interface Harvest {
  id: number;
  crop_id: number;
  actual_weight: number;
  predicted_weight: number;
  accuracy_percent: number;
  notes?: string;
  harvested_at: string;
}

export interface Prediction {
  predicted_yield: number;
  base_yield: number;
  yield_efficiency: number;
  potential_loss: number;
  suggestions: Suggestion[];
  status: string;
}

export interface Suggestion {
  type: 'success' | 'warning' | 'critical';
  issue: string;
  message: string;
  potential_loss?: string;
}

// --- API FUNCTIONS ---

export const seedsApi = {
  getAll: () => api.get<Seed[]>('/api/seeds'),
  getById: (id: number) => api.get<Seed>(`/api/seeds/${id}`),
};

export const cropsApi = {
  create: (data: {
    seed_id: number;
    start_datetime: string;
    tray_size?: string;
    number_of_trays?: number;
    custom_settings?: Record<string, any>;
    notification_settings?: Record<string, any>;
    initial_log?: {
      day_number: number;
      watered: boolean;
      temperature: number;
      humidity: number;
      notes: string;
      actions_recorded: string[];
    };
    ppfd_level?: number;
    light_hours_per_day: number;
    seed_cost: number;
    soil_cost: number;
    energy_cost_per_kwh: number;
    other_costs: number;
  }) => api.post<Crop>('/api/crops', data),

  getAll: (status?: string) =>
    api.get<Crop[]>('/api/crops', { params: { status } }),

  getById: (id: number) => api.get<Crop>(`/api/crops/${id}`),

  delete: (id: number) => api.delete(`/api/crops/${id}`),

  getSuggestion: (id: number) => api.get<{ suggestion: string; status: string }>(`/api/crops/${id}/suggestion`),

  logAction: (cropId: number, data: { action_type: string; notes?: string; temperature?: number; humidity?: number }) =>
    api.post(`/api/crops/${cropId}/actions`, data),
};

export const logsApi = {
  create: (cropId: number, data: {
    day_number: number;
    watered?: boolean;
    temperature?: number;
    humidity?: number;
    notes?: string;
    actions_recorded?: string[];
  }) => api.post<DailyLog>(`/api/crops/${cropId}/logs`, data),

  getAll: (cropId: number) =>
    api.get<DailyLog[]>(`/api/crops/${cropId}/logs`),

  getByDay: (cropId: number, day: number) =>
    api.get<DailyLog>(`/api/crops/${cropId}/logs/${day}`),

  uploadPhoto: (cropId: number, day: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/crops/${cropId}/logs/${day}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const predictionsApi = {
  get: (cropId: number) => api.get<Prediction>(`/api/predictions/${cropId}`),
};

export const harvestApi = {
  create: (cropId: number, data: {
    actual_weight: number;
    notes?: string;
  }) => api.post<Harvest>(`/api/crops/${cropId}/harvest`, data),

  get: (cropId: number) => api.get<Harvest>(`/api/crops/${cropId}/harvest`),
};

export const statsApi = {
  get: () => api.get<{
    scope: 'global' | 'personal';
    total_crops: number;
    active_crops: number;
    harvested_crops: number;
    avg_prediction_accuracy: number;
    total_yield_grams: number;
  }>('/api/stats'),
};

export const adminApi = {
  getAllUsers: () => api.get<User[]>('/api/admin/users'),
  createSeed: (data: Partial<Seed>) => api.post<Seed>('/api/seeds', data),
  updateSeed: (id: number, data: Partial<Seed>) => api.put<Seed>(`/api/seeds/${id}`, data),
  deleteSeed: (id: number) => api.delete(`/api/seeds/${id}`),
};

export const aiApi = {
  chat: (messages: Array<{ role: string; parts: string[] }>) =>
    api.post<{ response: string; status: string }>('/api/ai/chat', { messages }),
};

export default api;


