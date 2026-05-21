-- Migration: Create Vehicle Maintenance Table
-- Description: Independent tracking of vehicle maintenance windows for enterprise fleet management

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY "Agencies can manage their own maintenance records" 
ON vehicle_maintenance 
FOR ALL 
TO authenticated 
USING (tenant_id = auth.uid()) 
WITH CHECK (tenant_id = auth.uid());
