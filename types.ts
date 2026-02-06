
export interface Tyre {
  id: string;
  brandId: string;
  pattern: string;
  size: string; // e.g., 195/65/R15
  price: number;
  stock: number;
  image: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  origin: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  yearRange: string;
  recommendedSizes: string[];
  image: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export type AppTheme = 'classic' | 'dark' | 'industrial' | 'modern-red' | 'emerald' | 'midnight' | 'sunset' | 'ocean';

export interface AppState {
  brands: Brand[];
  tyres: Tyre[];
  vehicles: Vehicle[];
  services: Service[];
  businessInfo: BusinessInfo;
  adminCredentials: AdminCredentials;
  theme: AppTheme;
}
