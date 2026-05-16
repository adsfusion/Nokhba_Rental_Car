import * as z from 'zod';
import { contractBaseSchema } from './contract';

export const clientSchema = contractBaseSchema.pick({
  clientName: true,
  clientPhone: true,
  clientAddress: true,
  clientBirthDate: true,
  clientBirthPlace: true,
  licenseNumber: true,
  licenseDate: true,
  hasOtherDrivers: true,
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const addClientSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  driver_license_number: z.string().min(5, 'License number is required'),
  driver_license_expiry: z.string().min(1, 'License date is required'),
});

export type AddClientFormData = z.infer<typeof addClientSchema>;
