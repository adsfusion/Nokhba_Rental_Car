import * as z from 'zod';

export const damageSchema = z.object({
  id: z.string(),
  type: z.enum(['Minor', 'Major']),
  description: z.string(),
  photos: z.array(z.string()).optional(),
});

export const contractBaseSchema = z.object({
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  clientBirthDate: z.string().optional(),
  clientBirthPlace: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseDate: z.string().optional(),
  hasOtherDrivers: z.boolean(),
  vehicleId: z.string().min(1, 'Please select a vehicle'),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().optional(),
  vehiclePlate: z.string().optional(),
  vehicleStartMileage: z.number().optional(),
  vehicleRegistrationDate: z.string().optional(),
  status: z.enum(['draft', 'pending_signature', 'signed', 'active', 'completed', 'cancelled']).optional(),
  returnMileage: z.number().optional(),
  returnFuelLevel: z.string().optional(),
  returnCondition: z.string().optional(),
  returnNotes: z.string().optional(),
  returnDamages: z.array(damageSchema).optional(),
  initialDamages: z.array(damageSchema).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  pickupLocation: z.string().optional(),
  returnLocation: z.string().optional(),
  contractId: z.string().regex(/^CTR-[A-Z0-9]{6}$/, 'Contract ID must be in format CTR-XXXXXX'),
  rentalDurationDays: z.number().min(1, 'Duration must be at least 1 day'),
  insuranceOption: z.enum(['Basic', 'Premium', 'Full Coverage']),
  dailyRate: z.number().min(0),
  deposit: z.number().min(0),
  paymentMethod: z.enum(['Cash', 'Card', 'Transfer']),
  signature: z.string().optional(),
});

export const contractSchema = contractBaseSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return end >= start;
      }
    }
    return true;
  },
  { message: 'End date must be after or equal to start date', path: ['endDate'] }
);

export type ContractFormData = z.infer<typeof contractSchema>;
