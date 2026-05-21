export type Role = 'super_admin' | 'sub_admin' | 'tenant_admin' | 'tenant_user';

export type NotificationType = 'success' | 'error' | 'info';

export type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
};

// ── Real DB enum values (lowercase) ──────────────────────────────────────────
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'inactive';

export type Vehicle = {
  id: string;
  tenant_id: string;
  brand: string;               // DB: brand (not "make")
  model: string;
  year: number | null;
  color: string | null;
  license_plate: string;       // DB: license_plate (not "plate")
  vin: string | null;          // VIN / chassis number
  vehicle_type: string | null; // DB: vehicle_type (Economy | Mid-size | SUV | Luxury | Other)
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  status: VehicleStatus;       // DB enum: available | rented | maintenance | inactive
  mileage: number | null;      // DB: mileage (not "current_mileage")
  fuel_type: string | null;    // Diesel | Gasoline | Electric | Hybrid | Other
  transmission: string | null; // Manual | Automatic
  images: string[] | null;     // DB: images, stored as jsonb
  notes: string | null;
  currency?: 'MAD' | 'EUR' | 'USD';
  registration_date: string | null;    // DB: date field, format YYYY-MM-DD
  insurance_expiry: string | null;     // DB: date field, format YYYY-MM-DD
  technical_inspection: string | null; // DB: date field, format YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
};

export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'active' | 'completed' | 'cancelled';

export type VehicleMaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

export type VehicleMaintenance = {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: VehicleMaintenanceStatus;
  cost: number | null;
  created_at?: string;
  updated_at?: string;
};

export type Contract = {
  id: string;
  tenant_id: string;
  contract_number: string;
  client_id: string;          // FK to clients.id (UUID)
  vehicle_id: string;         // FK to vehicles.id (UUID)
  created_by: string | null;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  daily_rate: number;
  total_days: number;
  subtotal: number;
  discount: number | null;
  tax: number | null;
  total_amount: number;
  deposit_amount: number | null;
  status: ContractStatus;
  signature_url: string | null;
  signed_at: string | null;
  qr_code_token: string | null;
  pdf_url: string | null;
  notes: string | null;
  currency?: 'MAD' | 'EUR' | 'USD';
  extra_data: Record<string, unknown> | null;
  return_mileage: number | null;
  return_fuel_level: string | null;
  return_notes: string | null;
  returned_at: string | null;
  terms_accepted: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type Client = {
  id: string;
  tenant_id: string;
  full_name: string;            // DB: full_name (not "name")
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  id_type: 'national_id' | 'passport' | 'driver_license' | 'residence_permit' | null;
  id_number: string | null;
  id_expiry_date: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  driver_license_number: string | null;   // DB: driver_license_number (not "license_number")
  driver_license_expiry: string | null;   // DB: driver_license_expiry (not "license_date")
  driver_license_front_url: string | null;
  driver_license_back_url: string | null;
  notes: string | null;
  is_blacklisted: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type Agency = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  plan: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  max_vehicles: number;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  is_active: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
};

export type NotificationContextType = {
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
};

export * from './reservation';
