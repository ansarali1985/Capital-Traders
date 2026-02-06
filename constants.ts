
import { Brand, Vehicle, Service, BusinessInfo, Tyre, AppTheme } from './types';

export const THEMES: { id: AppTheme; name: string; classes: string }[] = [
  { id: 'classic', name: 'Classic Blue', classes: 'from-blue-600 to-blue-800' },
  { id: 'dark', name: 'Stealth Black', classes: 'from-gray-800 to-black' },
  { id: 'industrial', name: 'Industrial Amber', classes: 'from-amber-600 to-amber-800' },
  { id: 'modern-red', name: 'Racing Red', classes: 'from-red-600 to-red-800' },
  { id: 'emerald', name: 'Emerald Green', classes: 'from-emerald-600 to-emerald-800' },
  { id: 'midnight', name: 'Midnight Purple', classes: 'from-indigo-800 to-purple-900' },
  { id: 'sunset', name: 'Sunset Orange', classes: 'from-orange-500 to-pink-600' },
  { id: 'ocean', name: 'Deep Ocean', classes: 'from-cyan-600 to-blue-900' },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'b1', name: 'Bridgestone', origin: 'Japan', logo: 'https://picsum.photos/seed/bridge/200/200' },
  { id: 'b2', name: 'Michelin', origin: 'France', logo: 'https://picsum.photos/seed/mich/200/200' },
  { id: 'b3', name: 'Yokohama', origin: 'Japan', logo: 'https://picsum.photos/seed/yoko/200/200' },
  { id: 'b4', name: 'Dunlop', origin: 'UK', logo: 'https://picsum.photos/seed/dun/200/200' },
  { id: 'b5', name: 'Continental', origin: 'Germany', logo: 'https://picsum.photos/seed/cont/200/200' },
  { id: 'b6', name: 'General Tyre', origin: 'Pakistan', logo: 'https://picsum.photos/seed/gen/200/200' },
];

export const INITIAL_TYRES: Tyre[] = [
  { id: 't1', brandId: 'b1', pattern: 'Ecopia EP150', size: '195/65/R15', price: 18500, stock: 24, image: 'https://picsum.photos/seed/t1/400/300' },
  { id: 't2', brandId: 'b3', pattern: 'Advan DB V122', size: '185/65/R15', price: 21000, stock: 12, image: 'https://picsum.photos/seed/t2/400/300' },
  { id: 't3', brandId: 'b6', pattern: 'Euro Star', size: '175/70/R13', price: 9500, stock: 40, image: 'https://picsum.photos/seed/t3/400/300' },
  { id: 't4', brandId: 'b2', pattern: 'Primacy 4', size: '215/55/R17', price: 35000, stock: 8, image: 'https://picsum.photos/seed/t4/400/300' },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', make: 'Toyota', model: 'Corolla', yearRange: '2014-2023', recommendedSizes: ['195/65/R15', '205/55/R16'], image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=400&q=80' },
  { id: 'v2', make: 'Honda', model: 'Civic', yearRange: '2016-2024', recommendedSizes: ['215/55/R16', '215/50/R17'], image: 'https://images.unsplash.com/photo-1594070319944-7c0c63146b7a?auto=format&fit=crop&w=400&q=80' },
  { id: 'v3', make: 'Suzuki', model: 'Alto', yearRange: '2019-2024', recommendedSizes: ['145/80/R13', '155/70/R13'], image: 'https://images.unsplash.com/photo-1631557993077-ec07073b88cc?auto=format&fit=crop&w=400&q=80' },
  { id: 'v4', make: 'Honda', model: 'City', yearRange: '2009-2024', recommendedSizes: ['175/65/R15', '185/60/R15'], image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80' },
];

export const INITIAL_SERVICES: Service[] = [
  { id: 's1', title: 'Wheel Alignment', description: 'Precision 3D computerised wheel alignment for maximum tyre life.', price: 1500, image: 'https://picsum.photos/seed/align/400/300' },
  { id: 's2', title: 'Nitrogen Filling', description: 'Stay cool and maintain pressure longer with high-purity nitrogen.', price: 500, image: 'https://picsum.photos/seed/nitro/400/300' },
  { id: 's3', title: 'Tyre Repair', description: 'Professional puncture repair and sidewall inspection.', price: 300, image: 'https://picsum.photos/seed/repair/400/300' },
  { id: 's4', title: 'Used Tyres', description: 'Quality inspected used tyres for budget-conscious drivers.', price: 4000, image: 'https://picsum.photos/seed/used/400/300' },
  { id: 's5', title: 'Home Delivery', description: 'Get your tyres delivered and fitted at your doorstep.', price: 1000, image: 'https://picsum.photos/seed/home/400/300' },
];

export const INITIAL_BUSINESS: BusinessInfo = {
  name: 'CAPITAL TRADERS',
  address: 'Plot #12, Sector I-10/3, Industrial Area, Islamabad, Pakistan',
  phone: '+92 51 1234567',
  email: 'info@capitaltraders.pk',
  whatsapp: '+92 300 1234567',
};
