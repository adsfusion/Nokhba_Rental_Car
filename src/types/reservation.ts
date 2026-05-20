export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  tenant_id: string;
  client_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  total_amount: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}
