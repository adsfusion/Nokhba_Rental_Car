import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  Users, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Bell,
  Search,
  Globe,
  Plus,
  CheckCircle2,
  ArrowLeft,
  Phone,
  IdCard,
  Euro,
  Clock,
  Briefcase,
  UserPlus,
  Calendar,
  PenLine,
  Download,
  AlertCircle,
  Info,
  XCircle,
  Trash2,
  Package,
  Edit2,
  ClipboardCheck,
  ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { cn } from './lib/utils';
import { EmptyState } from './components/ui/EmptyState';

// --- Types ---
type Role = 'saas_admin' | 'tenant' | 'client';

enum View {
  DASHBOARD = 'dashboard', // Tenant Dashboard
  FLEET = 'fleet',
  CLIENTS = 'clients',
  CONTRACTS = 'contracts',
  SETTINGS = 'settings',
  // SaaS Admin Views
  SAAS_DASHBOARD = 'saas_dashboard',
  SAAS_AGENCIES = 'saas_agencies',
  SAAS_PACKAGES = 'saas_packages',
  // Client Views
  CLIENT_RENTALS = 'client_rentals',
}

type NavItem = {
  title: string;
  icon: React.ElementType;
  view: View;
  badge?: string;
};

type NotificationType = 'success' | 'error' | 'info';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

// --- Mock Data ---
const navItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, view: View.DASHBOARD },
  { title: 'Fleet', icon: Car, view: View.FLEET, badge: '12' },
  { title: 'Clients', icon: Users, view: View.CLIENTS },
  { title: 'Contracts', icon: FileText, view: View.CONTRACTS },
];

const secondaryNavItems: NavItem[] = [
  { title: 'Settings', icon: Settings, view: View.SETTINGS },
];

type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: number;
  plate: string;
  status: string;
  type: string;
  registrationDate: string;
  color: string;
  currentMileage: number;
  oilChangeMileage: number;
  oilChangeInterval: number;
  photos?: string[];
  maintenanceReason?: string;
  maintenanceReturnDate?: string;
};

let mockVehicles: Vehicle[] = [
  { id: 1, make: 'Mercedes-Benz', model: 'G-Class', year: 2024, plate: 'NC-2024-KM', status: 'Available', type: 'Luxury', registrationDate: '2024-01-15', color: 'Black', currentMileage: 12500, oilChangeMileage: 10000, oilChangeInterval: 15000 },
  { id: 2, make: 'Audi', model: 'RS7', year: 2023, plate: 'AU-777-RS', status: 'In Use', type: 'Sport', registrationDate: '2023-05-20', color: 'Nardo Grey', currentMileage: 25400, oilChangeMileage: 20000, oilChangeInterval: 10000 },
  { id: 3, make: 'BMW', model: 'M5 CS', year: 2024, plate: 'BM-M5-CS', status: 'Maintenance', type: 'Sport', registrationDate: '2023-11-10', color: 'Frozen Deep Green', currentMileage: 18200, oilChangeMileage: 10000, oilChangeInterval: 10000, maintenanceReason: 'Brake pads replacement', maintenanceReturnDate: '2026-06-15' },
  { id: 4, make: 'Range Rover', model: 'Autobiography', year: 2023, plate: 'RR-VOGUE', status: 'Available', type: 'Luxury', registrationDate: '2023-02-28', color: 'White', currentMileage: 35100, oilChangeMileage: 30000, oilChangeInterval: 15000 },
];

const vehicleListeners = new Set<() => void>();

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState(mockVehicles);
  useEffect(() => {
    const listener = () => setVehicles([...mockVehicles]);
    vehicleListeners.add(listener);
    return () => { vehicleListeners.delete(listener); };
  }, []);
  
  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle = { ...vehicle, id: Math.max(0, ...mockVehicles.map(v => v.id)) + 1 };
    mockVehicles.push(newVehicle);
    vehicleListeners.forEach(listener => listener());
  };

  const updateVehicle = (id: number, updates: Partial<Vehicle>) => {
    mockVehicles = mockVehicles.map(v => v.id === id ? { ...v, ...updates } : v);
    vehicleListeners.forEach(listener => listener());
  };

  return { vehicles, addVehicle, updateVehicle };
};

let mockContracts: ContractFormData[] = [];
const contractListeners = new Set<() => void>();

let contractIdSequence = 1000;

export const useContracts = () => {
  const [contracts, setContracts] = useState(mockContracts);
  useEffect(() => {
    const listener = () => setContracts([...mockContracts]);
    contractListeners.add(listener);
    return () => { contractListeners.delete(listener); };
  }, []);
  
  const addContract = (contract: ContractFormData) => {
    mockContracts.push(contract);
    contractListeners.forEach(listener => listener());
  };

  const updateContract = (id: string, updates: Partial<ContractFormData>) => {
    mockContracts = mockContracts.map(c => c.contractId === id ? { ...c, ...updates } : c);
    contractListeners.forEach(listener => listener());
  };

  const getNextContractId = () => {
    contractIdSequence += 1;
    return `CTR-${contractIdSequence.toString().padStart(6, '0')}`;
  };

  return { contracts, addContract, updateContract, getNextContractId };
};

// --- Schemas ---
const contractBaseSchema = z.object({
  // Client Details
  clientName: z.string().min(2, "Client name is required"),
  clientPhone: z.string().min(8, "Valid phone number is required"),
  clientAddress: z.string().min(5, "Address is required"),
  clientBirthDate: z.string().min(1, "Birth date is required"),
  clientBirthPlace: z.string().min(2, "Birth place is required"),
  licenseNumber: z.string().min(5, "Driving license is required"),
  licenseDate: z.string().min(1, "License date is required"),
  hasOtherDrivers: z.boolean(),
  // Vehicle
  vehicleId: z.string().min(1, "Please select a vehicle"),
  vehicleMake: z.string().min(1, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleYear: z.number().min(1900, "Valid year is required"),
  vehiclePlate: z.string().min(1, "Plate is required"),
  vehicleStartMileage: z.number().min(0),
  vehicleRegistrationDate: z.string().optional(),
  // Return Checklist
  status: z.enum(["Active", "Completed", "Cancelled"]).optional(),
  returnMileage: z.number().optional(),
  returnFuelLevel: z.string().optional(),
  returnCondition: z.string().optional(),
  returnNotes: z.string().optional(),
  returnDamages: z.array(z.object({
    id: z.string(),
    type: z.enum(["Minor", "Major"]),
    description: z.string(),
    photos: z.array(z.string()).optional()
  })).optional(),
  initialDamages: z.array(z.object({
    id: z.string(),
    type: z.enum(["Minor", "Major"]),
    description: z.string(),
    photos: z.array(z.string()).optional()
  })).optional(),
  // Terms
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  pickupLocation: z.string().min(3, "Pickup location is required"),
  returnLocation: z.string().min(3, "Return location is required"),
  contractId: z.string().regex(/^CTR-[A-Z0-9]{6}$/, "Contract ID must be in format CTR-XXXXXX"),
  rentalDurationDays: z.number().min(1, "Duration must be at least 1 day"),
  insuranceOption: z.enum(["Basic", "Premium", "Full Coverage"]),
  // Pricing
  dailyRate: z.number().min(0),
  deposit: z.number().min(0),
  paymentMethod: z.enum(["Cash", "Card", "Transfer"]),
  // Signature
  signature: z.string().min(2, "Signature is required")
});

const contractSchema = contractBaseSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return end >= start;
    }
  }
  return true;
}, {
  message: "End date must be after or equal to Start date",
  path: ["endDate"],
});

type ContractFormData = z.infer<typeof contractSchema>;

const clientSchema = contractBaseSchema.pick({
  clientName: true,
  clientPhone: true,
  clientAddress: true,
  clientBirthDate: true,
  clientBirthPlace: true,
  licenseNumber: true,
  licenseDate: true,
  hasOtherDrivers: true,
});
type ClientFormData = z.infer<typeof clientSchema>;

// --- Notification Context ---
export const NotificationContext = React.createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  const addNotification = (title: string, message: string, type: NotificationType = 'info') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    setActiveToasts(prev => [...prev, newNotif]);
    
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 5000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll, unreadCount }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map(toast => (
            <motion.div
              key={`toast-${toast.id}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-80 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-200 p-4 flex gap-3 items-start"
            >
              {toast.type === 'success' && <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />}
              {toast.type === 'error' && <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">{toast.title}</h4>
                <p className="text-xs text-slate-500 leading-snug">{toast.message}</p>
              </div>
              <button 
                onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </motion.div>
           ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

// --- Components ---

const ContractWizard = ({ onCancel, onComplete }: { onCancel: () => void; onComplete: (data: ContractFormData) => void }) => {
  const [step, setStep] = useState(1);
  const { vehicles } = useVehicles();
  const { getNextContractId } = useContracts();
  const [initialContractId] = useState(() => getNextContractId());
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contractData, setContractData] = useState<ContractFormData | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: {
      contractId: initialContractId,
      clientName: "",
      clientPhone: "",
      clientAddress: "",
      clientBirthDate: "",
      clientBirthPlace: "",
      licenseNumber: "",
      licenseDate: "",
      hasOtherDrivers: false,
      rentalDurationDays: 1,
      insuranceOption: "Basic",
      dailyRate: 50,
      deposit: 200,
      paymentMethod: "Cash",
      signature: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: new Date().getFullYear(),
      vehiclePlate: "",
      vehicleStartMileage: 0,
      vehicleRegistrationDate: "",
      status: "Active",
      initialDamages: []
    }
  });

  const startDateStr = watch("startDate");
  const endDateStr = watch("endDate");
  
  React.useEffect(() => {
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      // Reset time to midnight to avoid timezone / DST calculation issues
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        setValue("rentalDurationDays", diffDays > 0 ? diffDays : 1, { shouldValidate: true });
      }
    }
  }, [startDateStr, endDateStr, setValue]);

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { id: 1, name: 'Client', icon: UserPlus },
    { id: 2, name: 'Fleet', icon: Car },
    { id: 3, name: 'Terms', icon: Calendar },
    { id: 4, name: 'Review', icon: CheckCircle2 },
  ];

  const onSubmit = (data: ContractFormData) => {
    setContractData(data);
    setIsSubmitted(true);
  };

  const dailyRate = watch("dailyRate") || 0;
  const deposit = watch("deposit") || 0;
  const rentalDays = watch("rentalDurationDays") || 1;

  const totalRentalPrice = (dailyRate * rentalDays) + deposit;

  if (isSubmitted && contractData) {
    // Generate a placeholder mock URL for the contract
    const contractLink = `${window.location.origin}/contract/${encodeURIComponent(contractData.clientName)}-${Date.now()}`;
    
    const downloadPDF = () => {
      const doc = new jsPDF();
      
      // Agency Logo & Address (Header)
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.text("NOKHBA", 20, 22);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("RENTAL", 63, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("123 Enterprise Avenue", 20, 32);
      doc.text("Paris, France, 75001", 20, 37);
      doc.text("Phone: +33 1 23 45 67 89", 20, 42);
      doc.text("Email: contact@nokhba.com", 20, 47);

      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("Vehicle Rental Agreement", 120, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Contract ID: ${contractData.contractId}`, 120, 32);
      doc.text(`Date Ref: ${new Date().toLocaleDateString()}`, 120, 38);
      
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Le locataire", 20, 65);
      
      const textX = 25;
      const textLine = (label: string, value: string, y: number) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${label} : `, textX, y);
        const labelWidth = doc.getTextWidth(`${label} : `);
        doc.setFont("helvetica", "normal");
        doc.text(value, textX + labelWidth, y);
      };

      textLine("Prénom et Nom", contractData.clientName, 75);
      textLine("Téléphone", contractData.clientPhone, 82);
      textLine("Adresse", contractData.clientAddress, 89);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("(à confirmer par justif. de domicile)", textX, 94);
      
      textLine("Date et lieu naissance", `${contractData.clientBirthDate} / ${contractData.clientBirthPlace}`, 102);
      textLine("Permis de conduire no", contractData.licenseNumber, 109);
      textLine("Date obtention permis", contractData.licenseDate, 116);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (contractData.hasOtherDrivers) {
        doc.text("[ X ] d'autres conducteurs sont autorisés à conduire le véhicule", textX, 126);
      } else {
        doc.text("[   ] d'autres conducteurs sont autorisés à conduire le véhicule", textX, 126);
      }
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("lister ces conducteurs sur une feuille séparée en notant leur no de permis", textX, 131);
      
      doc.setFontSize(8);
      doc.text("Pour que l'assurance Voiturelib' fonctionne le conducteur doit avoir au", textX, 138);
      doc.text("moins 21 ans et son permis depuis plus de 2 ans.", textX, 142);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Le Véhicule loué", 120, 65);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Marque et modèle: ${contractData.vehicleMake} ${contractData.vehicleModel}`, 120, 75);
      doc.text(`Immatriculation: ${contractData.vehiclePlate}`, 120, 82);
      doc.text(`Date 1ère mise en circ: ${contractData.vehicleRegistrationDate}`, 120, 89);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("État du véhicule avant la location", 20, 155);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Compteur km au départ: ${contractData.vehicleStartMileage} km`, 20, 165);
      doc.text(`Carburant: 0 [ ] 1/4 [ ] 1/2 [ ] 3/4 [ ] plein [X]`, 120, 165);
      doc.text(`État extérieur: Bon état général (à compléter sur schéma en annexe)`, 20, 175);
      doc.text(`État intérieur: Propre`, 20, 182);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("La Location", 20, 195);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Date et heure début de loc.: ${contractData.startDate}`, 20, 205);
      doc.text(`Date et heure de fin de loc.: ${contractData.endDate}`, 20, 212);
      doc.text(`Durée: ${contractData.rentalDurationDays} Jours`, 20, 219);
      doc.text(`Lieu Départ: ${contractData.pickupLocation}`, 120, 205);
      doc.text(`Lieu Retour: ${contractData.returnLocation}`, 120, 212);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Assurance, Assistance, dépôt", 20, 232);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Prix de la location: ${contractData.dailyRate} EUR/jour`, 20, 242);
      doc.text(`Dépôt de garantie: chèque de ${contractData.deposit} EUR`, 20, 249);
      const total = (contractData.dailyRate * contractData.rentalDurationDays) + contractData.deposit;
      doc.setFont("helvetica", "bold");
      doc.text(`Total Due: ${total} EUR`, 20, 256);
      doc.setFont("helvetica", "normal");
      doc.text(`Assurance: ${contractData.insuranceOption}`, 120, 242);
      doc.text(`Payment: ${contractData.paymentMethod}`, 120, 249);

      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Agency Terms & Conditions", 20, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("1. Vehicle must be returned with the same fuel level as at the time of pick-up.", 20, 30);
      doc.text("2. The Renter is fully responsible for all traffic violations and fines incurred during the rental.", 20, 35);
      doc.text("3. Smoking is strictly prohibited in the vehicle. A penalty fee will apply for cleaning.", 20, 40);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Signature du locataire", 20, 60);
      if (contractData.signature) {
        doc.addImage(contractData.signature, "PNG", 20, 65, 50, 20);
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Signature du propriétaire", 120, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Electronically Approved by", 120, 70);
      doc.text("Nokhba SaaS Rental Management", 120, 75);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(`Generated by ContractWizard. Verified ID: ${contractData.contractId}`, 20, 290);
      
      doc.save(`Contract_${contractData.contractId}.pdf`);
    };

    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-500 py-12">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-900/10 mb-8">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold border-b pb-4 text-slate-900">Contract Generated Successfully!</h2>
        <p className="text-slate-500">The rental agreement for <span className="font-bold text-slate-800">{contractData.clientName}</span> has been finalized and signed.</p>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm inline-flex flex-col items-center gap-4 mt-8">
          <QRCodeCanvas 
            value={contractLink} 
            size={200}
            level={"H"}
            className="rounded-xl"
          />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 flex flex-col items-center gap-1">
            <span>Scan to View Details</span>
          </p>
        </div>

        <div className="pt-8 flex justify-center gap-4">
          <button
            onClick={downloadPDF}
            className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={18} />
            Download PDF
          </button>
          <button
            onClick={() => onComplete(contractData)}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Done
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                step >= s.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-400"
              )}>
                <s.icon size={18} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest mt-2",
                step >= s.id ? "text-slate-900" : "text-slate-400"
              )}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-container-lowest border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <UserPlus size={14} /> Full Client Name
                    </label>
                    <input 
                      {...register("clientName")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="e.g. John Doe"
                    />
                    {errors.clientName && <p className="text-[10px] text-red-500 font-medium">{errors.clientName.message}</p>}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input 
                       {...register("clientPhone")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="+33 6 12 34 56 78"
                    />
                     {errors.clientPhone && <p className="text-[10px] text-red-500 font-medium">{errors.clientPhone.message}</p>}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      Address
                    </label>
                    <input 
                       {...register("clientAddress")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="123 Main St, City, Country"
                    />
                     {errors.clientAddress && <p className="text-[10px] text-red-500 font-medium">{errors.clientAddress.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      Date of Birth
                    </label>
                    <input 
                       type="date"
                       {...register("clientBirthDate")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm uppercase"
                    />
                     {errors.clientBirthDate && <p className="text-[10px] text-red-500 font-medium">{errors.clientBirthDate.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      Place of Birth
                    </label>
                    <input 
                       {...register("clientBirthPlace")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="e.g. Paris"
                    />
                     {errors.clientBirthPlace && <p className="text-[10px] text-red-500 font-medium">{errors.clientBirthPlace.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <IdCard size={14} /> Driving License NO.
                    </label>
                    <input 
                       {...register("licenseNumber")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="ABC123456789"
                    />
                     {errors.licenseNumber && <p className="text-[10px] text-red-500 font-medium">{errors.licenseNumber.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      License Obtain Date
                    </label>
                    <input 
                       type="date"
                       {...register("licenseDate")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm uppercase"
                    />
                     {errors.licenseDate && <p className="text-[10px] text-red-500 font-medium">{errors.licenseDate.message}</p>}
                  </div>
                  <div className="md:col-span-2 flex items-start gap-3 mt-2">
                    <input 
                      type="checkbox"
                      id="hasOtherDrivers"
                      {...register("hasOtherDrivers")}
                      className="mt-1 w-4 h-4 text-slate-900 bg-slate-50 border-slate-300 rounded focus:ring-slate-900/20"
                    />
                    <label htmlFor="hasOtherDrivers" className="text-sm text-slate-700">
                      <span className="font-bold block">Other drivers authorized</span>
                      <span className="text-xs text-slate-500 italic block">List these drivers on a separate sheet with their license number</span>
                      <span className="text-xs text-slate-500 italic block">Required: driver must be at least 21 years old and hold a license for over 2 years.</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                 <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Car size={14} /> Select Available Vehicle
                </label>
                
                {/* Hidden tracked fields */}
                <input type="hidden" {...register("vehicleId")} />
                <input type="hidden" {...register("vehicleMake")} />
                <input type="hidden" {...register("vehicleModel")} />
                <input type="hidden" {...register("vehicleYear", { valueAsNumber: true })} />
                <input type="hidden" {...register("vehiclePlate")} />
                <input type="hidden" {...register("vehicleStartMileage", { valueAsNumber: true })} />
                <input type="hidden" {...register("vehicleRegistrationDate")} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.filter(v => v.status === 'Available').map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                         setValue("vehicleId", v.id.toString(), { shouldValidate: true });
                         setValue("vehicleMake", v.make, { shouldValidate: true });
                         setValue("vehicleModel", v.model, { shouldValidate: true });
                         setValue("vehicleYear", v.year, { shouldValidate: true });
                         setValue("vehiclePlate", v.plate, { shouldValidate: true });
                         setValue("vehicleStartMileage", v.currentMileage, { shouldValidate: true });
                         setValue("vehicleRegistrationDate", v.registrationDate || '', { shouldValidate: true });
                      }}
                      className={cn(
                        "p-4 border-2 rounded-2xl text-start transition-all group",
                        watch("vehicleId") === v.id.toString() 
                          ? "border-slate-900 bg-slate-900 text-white" 
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Car size={24} className={cn(watch("vehicleId") === v.id.toString() ? "text-white/50" : "text-slate-300")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{v.type}</span>
                      </div>
                      <h4 className="font-bold">{v.make} {v.model}</h4>
                      <p className={cn("text-xs", watch("vehicleId") === v.id.toString() ? "text-white/60" : "text-slate-400")}>{v.plate} • {v.year}</p>
                    </button>
                  ))}
                </div>
                {errors.vehicleId && <p className="text-[10px] text-red-500 font-medium">{errors.vehicleId.message}</p>}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Selected Vehicle Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Car size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{watch("vehicleMake") || 'No vehicle'} {watch("vehicleModel")}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{watch("vehicleYear") || '----'} • SELECTED</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Clock size={14} /> Pickup Date
                    </label>
                    <input 
                       {...register("startDate")}
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Clock size={14} /> Return Date
                    </label>
                    <input 
                       {...register("endDate")}
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pickup Location</label>
                    <input 
                       {...register("pickupLocation")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="e.g. Airport Terminal 1"
                    />
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Return Location</label>
                    <input 
                       {...register("returnLocation")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                      placeholder="e.g. Agency Headquarters"
                    />
                  </div>
                  <div className="space-y-1.5 pt-4 border-t border-slate-200 col-span-1 md:col-span-2">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Additional Terms</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5 focus-within:ring-0">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contract ID</label>
                        <input 
                          {...register("contractId")}
                          readOnly
                          className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm text-slate-500 cursor-not-allowed font-medium"
                          placeholder="CTR-XXXXXX"
                        />
                        <p className="text-[10px] text-slate-400">Auto-generated sequential ID</p>
                      </div>
                      <div className="space-y-1.5 focus-within:ring-0">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration (Days)</label>
                        <input 
                          {...register("rentalDurationDays", { valueAsNumber: true })}
                          type="number"
                          min="1"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                        />
                        <p className="text-[10px] text-slate-400">Auto-calculated from dates, but can be manually adjusted</p>
                        {errors.rentalDurationDays && <p className="text-[10px] text-red-500">{errors.rentalDurationDays.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Insurance Option</label>
                        <select 
                          {...register("insuranceOption")}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                        >
                          <option value="Basic">Basic</option>
                          <option value="Premium">Premium</option>
                          <option value="Full Coverage">Full Coverage</option>
                        </select>
                        {errors.insuranceOption && <p className="text-[10px] text-red-500">{errors.insuranceOption.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Client Summary */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                       <UserPlus size={12} /> Client Details
                    </h4>
                    <p className="text-sm font-bold text-slate-900">{watch("clientName") || 'Not set'}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Phone size={10} /> {watch("clientPhone") || '---'}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                        <IdCard size={10} /> {watch("licenseNumber") || '---'}
                      </p>
                    </div>
                  </div>

                  {/* Vehicle Summary */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                       <Car size={12} /> Selected Vehicle
                    </h4>
                    <p className="text-sm font-bold text-slate-900">{watch("vehicleMake")} {watch("vehicleModel")}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-xs text-slate-500 font-medium">Year: {watch("vehicleYear")}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Ref ID: #{watch("vehicleId")}</p>
                    </div>
                  </div>

                  {/* Logistics Summary */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                       <Calendar size={12} /> Rental Logistics
                    </h4>
                    <div className="grid grid-cols-2 gap-8 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 md:block hidden">
                        <ArrowLeft className="rotate-180" size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Pick-up</p>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock size={10} /> {watch("startDate") || '---'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{watch("pickupLocation") || '---'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Return</p>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock size={10} /> {watch("endDate") || '---'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{watch("returnLocation") || '---'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Contract ID</p>
                        <p className="text-xs font-bold text-slate-700">{watch("contractId") || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Duration</p>
                        <p className="text-xs font-bold text-slate-700">{watch("rentalDurationDays")} Days</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Insurance</p>
                        <p className="text-xs font-bold text-slate-700">{watch("insuranceOption")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Initial Vehicle Damages Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                       <Car size={18} /> Initial Vehicle Condition
                    </h4>
                    <button 
                      type="button"
                      onClick={() => {
                        const currentDamages = watch("initialDamages") || [];
                        setValue("initialDamages", [...currentDamages, { id: Math.random().toString(36).substr(2, 9), type: 'Minor', description: '', photos: [] }], { shouldValidate: true });
                      }}
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} />
                      Add Damage
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(!watch("initialDamages") || watch("initialDamages")?.length === 0) ? (
                      <p className="text-sm text-slate-400 text-center py-4 bg-white rounded-xl border border-slate-100 border-dashed">No pre-existing damages reported.</p>
                    ) : (
                      watch("initialDamages")?.map((damage: any, index: number) => (
                        <div key={damage.id} className="p-4 bg-white rounded-xl border border-slate-200 relative">
                          <button 
                            type="button"
                            onClick={() => {
                              const currentDamages = [...(watch("initialDamages") || [])];
                              currentDamages.splice(index, 1);
                              setValue("initialDamages", currentDamages, { shouldValidate: true });
                            }}
                            className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="grid grid-cols-3 gap-3 mb-3 pr-8">
                            <div className="col-span-1">
                              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Type</label>
                              <select
                                value={damage.type}
                                onChange={(e) => {
                                  const currentDamages = [...(watch("initialDamages") || [])];
                                  currentDamages[index].type = e.target.value as 'Minor' | 'Major';
                                  setValue("initialDamages", currentDamages, { shouldValidate: true });
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                              >
                                <option value="Minor">Minor</option>
                                <option value="Major">Major</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Description</label>
                              <input
                                type="text"
                                value={damage.description}
                                onChange={(e) => {
                                  const currentDamages = [...(watch("initialDamages") || [])];
                                  currentDamages[index].description = e.target.value;
                                  setValue("initialDamages", currentDamages, { shouldValidate: true });
                                }}
                                placeholder="e.g. Scratch on front bumper"
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Photos</label>
                            <div className="flex flex-wrap gap-2">
                              {damage.photos?.map((photo: string, i: number) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                                  <img src={photo} alt="" className="w-full h-full object-cover" />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const currentDamages = [...(watch("initialDamages") || [])];
                                      currentDamages[index].photos?.splice(i, 1);
                                      setValue("initialDamages", [...currentDamages], { shouldValidate: true });
                                    }}
                                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                                <ImagePlus size={16} className="mb-0.5" />
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  multiple
                                  className="hidden" 
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) {
                                      let currentDamages = [...(watch("initialDamages") || [])];
                                      if (!currentDamages[index].photos) {
                                        currentDamages[index].photos = [];
                                      }
                                      
                                      files.forEach(file => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          currentDamages[index].photos!.push(reader.result as string);
                                          setValue("initialDamages", [...currentDamages], { shouldValidate: true });
                                        };
                                        reader.readAsDataURL(file);
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Euro size={18} /> Pricing Details
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Rate (€)</label>
                      <input 
                        type="number"
                        {...register("dailyRate", { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Deposit (€)</label>
                      <input 
                        type="number"
                        {...register("deposit", { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Method</label>
                      <select 
                        {...register("paymentMethod")}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="bg-slate-900 rounded-xl p-4 text-white flex justify-between items-center shadow-lg">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Calculation</p>
                        <p className="text-sm font-medium text-slate-300 mt-1">€{dailyRate} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'} + €{deposit} deposit</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Due Now</p>
                        <p className="text-3xl font-bold tracking-tight">€{totalRentalPrice}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <PenLine size={14} /> Client E-Signature
                    </label>
                    {watch("signature") && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setValue("signature", "", { shouldValidate: true });
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <X size={14} /> Clear Signature
                      </button>
                    )}
                  </div>
                  
                  {watch("signature") ? (
                    <div className="relative bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center">
                      <img src={watch("signature")} alt="Client Signature" className="max-h-24 object-contain" />
                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Capture New Signature
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="w-full h-40 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 transition-colors"
                    >
                      <PenLine size={32} className="mb-3 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 mb-1">Click to Capture Signature</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Required to finalize contract</span>
                    </button>
                  )}
                  {errors.signature && <p className="text-[10px] text-red-500 font-medium">{errors.signature.message}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button 
            type="button"
            onClick={step === 1 ? onCancel : prevStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 4 ? (
            <button 
              type="button"
              onClick={nextStep}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              type="submit"
              className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-900/10 hover:bg-green-700 transition-all flex items-center gap-2"
            >
              Generate Contract
              <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Signature Modal */}
      <AnimatePresence>
        {isSignatureModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <PenLine size={20} /> Capture Signature
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <div className="relative group bg-white border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl overflow-hidden h-64 transition-colors">
                  <SignatureCanvas 
                    ref={signatureRef}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-full cursor-crosshair",
                      style: { width: '100%', height: '100%' }
                    }}
                  />
                  <div className="absolute top-4 left-4 pointer-events-none text-slate-300 flex items-center gap-2 opacity-50">
                    <PenLine size={20} />
                    <span className="text-xs uppercase font-bold tracking-widest">Sign Here</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => signatureRef.current?.clear()}
                    className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <X size={14} /> Clear Draw Area
                  </button>
                </div>
              </div>
              <div className="p-4 flex justify-end gap-3 bg-white">
                <button 
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)} 
                  className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (signatureRef.current && !signatureRef.current.isEmpty()) {
                      const dataUrl = signatureRef.current.toDataURL();
                      setValue("signature", dataUrl, { shouldValidate: true });
                      setIsSignatureModalOpen(false);
                    } else {
                      setIsSignatureModalOpen(false);
                    }
                  }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
                >
                  Save Signature
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EditClientModal = ({
  isOpen,
  onClose,
  contract,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractFormData;
  onSave: (data: ClientFormData) => void;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: contract.clientName,
      clientPhone: contract.clientPhone,
      clientAddress: contract.clientAddress,
      clientBirthDate: contract.clientBirthDate,
      clientBirthPlace: contract.clientBirthPlace,
      licenseNumber: contract.licenseNumber,
      licenseDate: contract.licenseDate,
      hasOtherDrivers: contract.hasOtherDrivers || false,
    }
  });

  useEffect(() => {
    reset({
      clientName: contract.clientName,
      clientPhone: contract.clientPhone,
      clientAddress: contract.clientAddress,
      clientBirthDate: contract.clientBirthDate,
      clientBirthPlace: contract.clientBirthPlace,
      licenseNumber: contract.licenseNumber,
      licenseDate: contract.licenseDate,
      hasOtherDrivers: contract.hasOtherDrivers || false,
    });
  }, [contract, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Client Details</h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 -mx-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input 
              {...register("clientName")}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
              placeholder="Client Name"
            />
            {errors.clientName && <p className="text-[10px] text-red-500">{errors.clientName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
              <input 
                {...register("clientPhone")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                placeholder="Phone Number"
              />
              {errors.clientPhone && <p className="text-[10px] text-red-500">{errors.clientPhone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">DOB</label>
              <input 
                type="date"
                {...register("clientBirthDate")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm uppercase"
              />
              {errors.clientBirthDate && <p className="text-[10px] text-red-500">{errors.clientBirthDate.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
            <input 
              {...register("clientAddress")}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
              placeholder="Address"
            />
            {errors.clientAddress && <p className="text-[10px] text-red-500">{errors.clientAddress.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Place of Birth</label>
              <input 
                {...register("clientBirthPlace")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                placeholder="City"
              />
              {errors.clientBirthPlace && <p className="text-[10px] text-red-500">{errors.clientBirthPlace.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Obtain Date</label>
              <input 
                type="date"
                {...register("licenseDate")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm uppercase"
              />
              {errors.licenseDate && <p className="text-[10px] text-red-500">{errors.licenseDate.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</label>
            <input 
              {...register("licenseNumber")}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
              placeholder="Driving License Number"
            />
            {errors.licenseNumber && <p className="text-[10px] text-red-500">{errors.licenseNumber.message}</p>}
          </div>
          <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input 
              type="checkbox"
              id="editHasOtherDrivers"
              {...register("hasOtherDrivers")}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900/20"
            />
            <label htmlFor="editHasOtherDrivers" className="text-sm text-slate-700 font-medium">
              Other drivers authorized to drive
            </label>
          </div>
          
          <div className="pt-6 flex items-center justify-end gap-3 mt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ReturnVehicleModal = ({
  isOpen,
  onClose,
  contract,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractFormData;
  onSave: (id: string, mileage: number, fuelLevel: string, condition: string, notes: string, damages: { id: string, type: "Minor" | "Major", description: string, photos?: string[] }[]) => void;
}) => {
  const [returnMileage, setReturnMileage] = useState<number>(contract.vehicleStartMileage || 0);
  const [returnFuelLevel, setReturnFuelLevel] = useState<string>('Full');
  const [returnCondition, setReturnCondition] = useState<string>('Good');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [returnDamages, setReturnDamages] = useState<{ id: string, type: "Minor" | "Major", description: string, photos?: string[] }[]>([]);
  const [checklist, setChecklist] = useState({ mileage: false, fuel: false, condition: false });

  useEffect(() => {
    if (isOpen) {
      setReturnMileage(contract.vehicleStartMileage || 0);
      setReturnFuelLevel('Full');
      setReturnCondition('Good');
      setReturnNotes('');
      setReturnDamages([]);
      setChecklist({ mileage: false, fuel: false, condition: false });
    }
  }, [isOpen, contract]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden relative z-10 border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">Return Vehicle: {contract.vehicleMake} {contract.vehicleModel}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full flex-shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Return Mileage (km)</label>
            <input 
              type="number" 
              value={returnMileage} 
              onChange={e => setReturnMileage(parseInt(e.target.value) || 0)} 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none"
            />
            {returnMileage < (contract.vehicleStartMileage || 0) && (
              <p className="text-red-500 text-xs mt-1">Return mileage cannot be less than start mileage ({contract.vehicleStartMileage} km).</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Fuel Level</label>
            <select
              value={returnFuelLevel}
              onChange={e => setReturnFuelLevel(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none"
            >
              <option value="Empty">Empty (0)</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="3/4">3/4</option>
              <option value="Full">Full</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Condition</label>
            <select
              value={returnCondition}
              onChange={e => setReturnCondition(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none"
            >
              <option value="Good">Good (No new damages)</option>
              <option value="Minor">Minor Damage</option>
              <option value="Major">Major Damage</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase text-slate-500">Reported Damages</label>
              <button 
                type="button"
                onClick={() => setReturnDamages([...returnDamages, { id: Math.random().toString(36).substr(2, 9), type: 'Minor', description: '', photos: [] }])}
                className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} />
                Add Damage
              </button>
            </div>
            
            <div className="space-y-4">
              {returnDamages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">No damages reported.</p>
              ) : (
                returnDamages.map((damage, index) => (
                  <div key={damage.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                    <button 
                      onClick={() => {
                        const newDamages = [...returnDamages];
                        newDamages.splice(index, 1);
                        setReturnDamages(newDamages);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3 pr-8">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Type</label>
                        <select
                          value={damage.type}
                          onChange={(e) => {
                            const newDamages = [...returnDamages];
                            newDamages[index].type = e.target.value as 'Minor' | 'Major';
                            setReturnDamages(newDamages);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                        >
                          <option value="Minor">Minor</option>
                          <option value="Major">Major</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Description</label>
                        <input
                          type="text"
                          value={damage.description}
                          onChange={(e) => {
                            const newDamages = [...returnDamages];
                            newDamages[index].description = e.target.value;
                            setReturnDamages(newDamages);
                          }}
                          placeholder="e.g. Scratch on front bumper"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Photos</label>
                      <div className="flex flex-wrap gap-2">
                        {damage.photos?.map((photo, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => {
                                const newDamages = [...returnDamages];
                                newDamages[index].photos?.splice(i, 1);
                                setReturnDamages(newDamages);
                              }}
                              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-slate-400 transition-colors cursor-pointer">
                          <ImagePlus size={16} className="mb-0.5" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="hidden" 
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                let newDamages = [...returnDamages];
                                if (!newDamages[index].photos) {
                                  newDamages[index].photos = [];
                                }
                                
                                files.forEach(file => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    newDamages[index].photos!.push(reader.result as string);
                                    // Trigger re-render after all files or each file are loaded
                                    setReturnDamages([...newDamages]);
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Additional Notes</label>
            <textarea
              value={returnNotes}
              onChange={e => setReturnNotes(e.target.value)}
              rows={2}
              placeholder="Any other comments..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none resize-none"
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Confirmation Checklist</label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={checklist.mileage} onChange={e => setChecklist({...checklist, mileage: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span className="text-sm font-medium text-slate-700">Mileage checked and verified against dashboard</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={checklist.fuel} onChange={e => setChecklist({...checklist, fuel: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span className="text-sm font-medium text-slate-700">Fuel level confirmed and matches report</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={checklist.condition} onChange={e => setChecklist({...checklist, condition: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span className="text-sm font-medium text-slate-700">Vehicle exterior and interior condition inspected</span>
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button 
              onClick={() => onSave(contract.contractId, returnMileage, returnFuelLevel, returnCondition, returnNotes, returnDamages)}
              disabled={returnMileage < (contract.vehicleStartMileage || 0) || !checklist.mileage || !checklist.fuel || !checklist.condition}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 disabled:opacity-50"
            >
              Confirm Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContractsView = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { contracts, addContract, updateContract } = useContracts();
  const { vehicles, updateVehicle } = useVehicles();
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [returningContractId, setReturningContractId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const editingContract = contracts.find(c => c.contractId === editingContractId);
  const returningContract = contracts.find(c => c.contractId === returningContractId);

  const handleSaveClient = (clientData: ClientFormData) => {
    if (editingContractId) {
      updateContract(editingContractId, clientData);
      addNotification('Client Updated', 'Client details have been updated successfully.', 'success');
      setEditingContractId(null);
    }
  };

  const handleSaveReturn = (id: string, mileage: number, fuelLevel: string, condition: string, notes: string, damages: { id: string, type: "Minor" | "Major", description: string, photos?: string[] }[]) => {
    updateContract(id, {
      status: 'Completed',
      returnMileage: mileage,
      returnFuelLevel: fuelLevel,
      returnCondition: condition,
      returnNotes: notes,
      returnDamages: damages
    });

    const contract = contracts.find(c => c.contractId === id);
    if (contract) {
      const vehicle = vehicles.find(v => v.id.toString() === contract.vehicleId);
      if (vehicle) {
        // Update vehicle status and mileage
        updateVehicle(vehicle.id, {
          status: 'Available',
          currentMileage: mileage
        });
      }
    }

    addNotification('Vehicle Returned', 'The vehicle return checklist has been completed.', 'success');
    setReturningContractId(null);
  };

  return (
    <div className="space-y-8">
      {editingContract && (
        <EditClientModal
          isOpen={!!editingContract}
          onClose={() => setEditingContractId(null)}
          contract={editingContract}
          onSave={handleSaveClient}
        />
      )}
      {returningContract && (
        <ReturnVehicleModal
          isOpen={!!returningContract}
          onClose={() => setReturningContractId(null)}
          contract={returningContract}
          onSave={handleSaveReturn}
        />
      )}
      {!isWizardOpen ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Contracts & Agreements</h2>
              <p className="text-slate-500 text-sm">Manage your rental agreements and e-signatures.</p>
            </div>
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
            >
              <Plus size={16} />
              New Contract
            </button>
          </div>

          {/* Contracts List Placeholder */}
          <div className="bg-surface-container-lowest border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Active Records</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Filter:</span>
                <select className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
                  <option>All Status</option>
                  <option>Signed</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>
            
            {contracts.length === 0 ? (
              <EmptyState
                variant="inline"
                icon={<FileText size={28} />}
                title="No contracts found"
                description="You haven't generated any contracts yet. Click the button above to start your first one."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {contracts.map(contract => (
                  <div key={contract.contractId} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Client</p>
                        <p className="text-sm font-bold text-slate-900">{contract.clientName}</p>
                        <p className="text-xs text-slate-500">{contract.clientPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Vehicle</p>
                        <p className="text-sm font-bold text-slate-900">{contract.vehicleMake} {contract.vehicleModel}</p>
                        <p className="text-xs text-slate-500">{contract.vehicleYear}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                        <p className="text-sm font-bold text-slate-900">{contract.rentalDurationDays} Days</p>
                        <p className="text-xs text-slate-500">{contract.startDate} to {contract.endDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total</p>
                        <p className="text-sm font-bold text-slate-900">EUR {(contract.dailyRate * contract.rentalDurationDays) + contract.deposit}</p>
                        <p className={cn("text-xs px-2 py-0.5 rounded-full inline-block mt-0.5", 
                          contract.status === 'Completed' ? "bg-slate-100 text-slate-700 font-bold" : "bg-green-100 text-green-700"
                        )}>
                          {contract.status === 'Completed' ? 'Returned' : 'Active'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setEditingContractId(contract.contractId)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <PenLine size={16} />
                        Edit Client
                      </button>
                      
                      {(contract.status === 'Active' || !contract.status) && (
                        <button 
                          onClick={() => setReturningContractId(contract.contractId)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <ClipboardCheck size={16} />
                          Return Vehicle
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <ContractWizard 
          onCancel={() => setIsWizardOpen(false)} 
          onComplete={(data) => {
            console.log("Contract generated:", data);
            addContract(data);
            updateVehicle(parseInt(data.vehicleId), { status: 'In Use' });
            addNotification('Contract Saved', `Rental agreement for ${data.clientName} has been saved.`, 'success');
            setIsWizardOpen(false);
          }} 
        />
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, setIsOpen, currentView, setView, navItems, secondaryNavItems }: { 
  isOpen: boolean; 
  setIsOpen: (o: boolean) => void;
  currentView: View;
  setView: (v: View) => void;
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside className={cn(
        "fixed inset-y-0 start-0 z-50 w-64 bg-surface-container-lowest border-e border-slate-200 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold">
                N
              </div>
              <span className="font-semibold text-lg tracking-tight">Nokhba Rental</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Main Menu</p>
            {navItems.map((item) => (
              <button
                key={item.title}
                onClick={() => { setView(item.view); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group",
                  currentView === item.view 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn(currentView === item.view ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    currentView === item.view ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer Nav */}
          <div className="p-4 border-t border-slate-100 space-y-1">
            {secondaryNavItems.map((item) => (
              <button
                key={item.title}
                onClick={() => { setView(item.view); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  currentView === item.view ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={18} />
                <span>{item.title}</span>
              </button>
            ))}
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const FleetView = () => {
  const { vehicles, addVehicle, updateVehicle } = useVehicles();
  const { contracts, updateContract } = useContracts();
  const { addNotification } = useNotifications();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ 
    make: '', model: '', year: new Date().getFullYear(), plate: '', 
    status: 'Available', type: 'Luxury', registrationDate: '', color: '', currentMileage: 0, oilChangeMileage: 0, oilChangeInterval: 10000, photos: []
  });
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [returningContractId, setReturningContractId] = useState<string | null>(null);

  const returningContract = contracts.find(c => c.contractId === returningContractId);

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle) {
      updateVehicle(selectedVehicle.id, selectedVehicle);
      addNotification('Vehicle Updated', `${selectedVehicle.make} ${selectedVehicle.model} details saved successfully.`, 'success');
      setIsEditingVehicle(false);
    }
  };

  const handleSaveReturn = (id: string, mileage: number, fuelLevel: string, condition: string, notes: string, damages: { id: string, type: "Minor" | "Major", description: string, photos?: string[] }[]) => {
    updateContract(id, {
      status: 'Completed',
      returnMileage: mileage,
      returnFuelLevel: fuelLevel,
      returnCondition: condition,
      returnNotes: notes,
      returnDamages: damages
    });

    const contract = contracts.find(c => c.contractId === id);
    if (contract) {
      const vehicle = vehicles.find(v => v.id.toString() === contract.vehicleId);
      if (vehicle) {
        updateVehicle(vehicle.id, {
          status: 'Available',
          currentMileage: mileage
        });
        
        // update selectedVehicle if it is the one we are returning
        if (selectedVehicle?.id === vehicle.id) {
          setSelectedVehicle({
            ...selectedVehicle,
            status: 'Available',
            currentMileage: mileage
          });
        }
      }
    }

    addNotification('Vehicle Returned', 'The vehicle return checklist has been completed.', 'success');
    setReturningContractId(null);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicle(newVehicle as Omit<Vehicle, "id">);
    setShowAddModal(false);
    setNewVehicle({ make: '', model: '', year: new Date().getFullYear(), plate: '', status: 'Available', type: 'Luxury', registrationDate: '', color: '', currentMileage: 0, oilChangeMileage: 0, oilChangeInterval: 10000, photos: [] });
  };

  const filteredVehicles = vehicles.filter(v => filterStatus === 'All' || v.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Management</h2>
          <p className="text-slate-500 text-sm">Monitor and manage your vehicle inventory with ease.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            {['All', 'Available', 'In Use', 'Maintenance'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterStatus === status 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 whitespace-nowrap"
          >
            <Car size={16} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Plate / Year</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mileage</th>
                <th className="px-6 py-4 hidden md:table-cell">Rental Period</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => {
                const activeContract = contracts.find(c => c.vehicleId === vehicle.id.toString() && (!c.status || c.status === 'Active'));

                return (
                  <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                          {vehicle.photos && vehicle.photos.length > 0 ? (
                            <img src={vehicle.photos[0]} alt={vehicle.make} className="w-full h-full object-cover" />
                          ) : (
                            <Car size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-slate-500">{vehicle.type} • {vehicle.color || 'Unspecified'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block mb-1">
                        {vehicle.plate}
                      </div>
                      <p className="text-xs text-slate-500 text-left">{vehicle.year} • Reg: {vehicle.registrationDate || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block mb-1",
                        vehicle.status === 'Available' ? "bg-green-50 text-green-700 border-green-200" :
                        vehicle.status === 'In Use' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {vehicle.status}
                      </span>
                      {vehicle.status === 'Maintenance' && vehicle.maintenanceReason && (
                         <div className="text-[10px] text-amber-600 font-medium truncate max-w-[120px]" title={vehicle.maintenanceReason}>
                            {vehicle.maintenanceReason}
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{vehicle.currentMileage?.toLocaleString() || 0} km</p>
                      <p className="text-[10px] text-slate-400">Next Due: {vehicle.oilChangeMileage ? (vehicle.oilChangeMileage + vehicle.oilChangeInterval).toLocaleString() : '-'} km</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {activeContract ? (
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">{activeContract.startDate} →</p>
                          <p className="text-slate-500">{activeContract.endDate}</p>
                        </div>
                      ) : vehicle.status === 'Maintenance' && vehicle.maintenanceReturnDate ? (
                        <div className="text-xs">
                          <p className="font-semibold text-orange-600">Expected Return</p>
                          <p className="text-orange-500 font-medium">{vehicle.maintenanceReturnDate}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(vehicle);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No vehicles found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleAddVehicle} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Add New Vehicle</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Make</label>
                      <input required type="text" value={newVehicle.make} onChange={e => setNewVehicle(prev => ({ ...prev, make: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" placeholder="e.g. BMW" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Model</label>
                      <input required type="text" value={newVehicle.model} onChange={e => setNewVehicle(prev => ({ ...prev, model: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" placeholder="e.g. X5" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Year</label>
                      <input required type="number" value={newVehicle.year} onChange={e => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">License Plate (Reg)</label>
                      <input required type="text" value={newVehicle.plate} onChange={e => setNewVehicle(prev => ({ ...prev, plate: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" placeholder="ABC-1234" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Reg. Date</label>
                      <input required type="date" value={newVehicle.registrationDate} onChange={e => setNewVehicle(prev => ({ ...prev, registrationDate: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Color</label>
                      <input required type="text" value={newVehicle.color} onChange={e => setNewVehicle(prev => ({ ...prev, color: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" placeholder="e.g. Black" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Current KM</label>
                      <input required type="number" value={newVehicle.currentMileage} onChange={e => setNewVehicle(prev => ({ ...prev, currentMileage: parseInt(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Oil KM</label>
                      <input required type="number" value={newVehicle.oilChangeMileage} onChange={e => setNewVehicle(prev => ({ ...prev, oilChangeMileage: parseInt(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Oil Interval</label>
                      <input required type="number" value={newVehicle.oilChangeInterval} onChange={e => setNewVehicle(prev => ({ ...prev, oilChangeInterval: parseInt(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                      <select required value={newVehicle.type} onChange={e => setNewVehicle(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm">
                        <option value="Luxury">Luxury</option>
                        <option value="Sport">Sport</option>
                        <option value="SUV">SUV</option>
                        <option value="Economy">Economy</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Status</label>
                      <select required value={newVehicle.status} onChange={e => setNewVehicle(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm">
                        <option value="Available">Available</option>
                        <option value="In Use">In Use</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  {newVehicle.status === 'Maintenance' && (
                    <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                      <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold uppercase text-orange-800">Return Date</label>
                        <input required type="date" value={newVehicle.maintenanceReturnDate || ''} onChange={e => setNewVehicle({ ...newVehicle, maintenanceReturnDate: e.target.value })} className="w-full px-4 py-2 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm text-slate-700" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-xs font-bold uppercase text-orange-800">Reason</label>
                        <input required type="text" placeholder="e.g. Broken windshield" value={newVehicle.maintenanceReason || ''} onChange={e => setNewVehicle({ ...newVehicle, maintenanceReason: e.target.value })} className="w-full px-4 py-2 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm text-slate-700" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold uppercase text-slate-500">Photos</label>
                    <div className="flex flex-wrap gap-3">
                      {newVehicle.photos?.map((photo: string, i: number) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newPhotos = [...(newVehicle.photos || [])];
                              newPhotos.splice(i, 1);
                              setNewVehicle(prev => ({ ...prev, photos: newPhotos }));
                            }}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                        <ImagePlus size={24} className="mb-1" />
                        <span className="text-[10px] font-bold">Add Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          className="hidden" 
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            let currentPhotos = newVehicle.photos || [];
                            files.forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                currentPhotos = [...currentPhotos, reader.result as string];
                                setNewVehicle(prev => ({ ...prev, photos: currentPhotos }));
                              };
                              reader.readAsDataURL(file);
                            });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                    Add Vehicle
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Vehicle Detail / Edit Modal */}
      <AnimatePresence>
        {selectedVehicle && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              onClick={() => { setSelectedVehicle(null); setIsEditingVehicle(false); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[5vh] bottom-[5vh] md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-lg bg-white md:rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <Car size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                      {isEditingVehicle ? 'Edit Vehicle' : `${selectedVehicle.make} ${selectedVehicle.model}`}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">{selectedVehicle.year} • {selectedVehicle.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedVehicle(null); setIsEditingVehicle(false); }} 
                  className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isEditingVehicle ? (
                  <form id="edit-vehicle-form" onSubmit={handleUpdateVehicle} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Make</label>
                        <input required type="text" value={selectedVehicle.make} onChange={e => setSelectedVehicle({ ...selectedVehicle, make: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Model</label>
                        <input required type="text" value={selectedVehicle.model} onChange={e => setSelectedVehicle({ ...selectedVehicle, model: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Year</label>
                        <input required type="number" value={selectedVehicle.year} onChange={e => setSelectedVehicle({ ...selectedVehicle, year: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">License Plate (Reg)</label>
                        <input required type="text" value={selectedVehicle.plate} onChange={e => setSelectedVehicle({ ...selectedVehicle, plate: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Reg. Date</label>
                        <input required type="date" value={selectedVehicle.registrationDate} onChange={e => setSelectedVehicle({ ...selectedVehicle, registrationDate: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Color</label>
                        <input required type="text" value={selectedVehicle.color} onChange={e => setSelectedVehicle({ ...selectedVehicle, color: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Current KM</label>
                        <input required type="number" value={selectedVehicle.currentMileage} onChange={e => setSelectedVehicle({ ...selectedVehicle, currentMileage: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Oil KM</label>
                        <input required type="number" value={selectedVehicle.oilChangeMileage} onChange={e => setSelectedVehicle({ ...selectedVehicle, oilChangeMileage: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Oil Interval</label>
                        <input required type="number" value={selectedVehicle.oilChangeInterval} onChange={e => setSelectedVehicle({ ...selectedVehicle, oilChangeInterval: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                        <select required value={selectedVehicle.type} onChange={e => setSelectedVehicle({ ...selectedVehicle, type: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm">
                          <option value="Luxury">Luxury</option>
                          <option value="Sport">Sport</option>
                          <option value="SUV">SUV</option>
                          <option value="Economy">Economy</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Status</label>
                        <select required value={selectedVehicle.status} onChange={e => setSelectedVehicle({ ...selectedVehicle, status: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm">
                          <option value="Available">Available</option>
                          <option value="In Use">In Use</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    {selectedVehicle.status === 'Maintenance' && (
                      <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                        <div className="space-y-1.5 col-span-2 md:col-span-1">
                          <label className="text-xs font-bold uppercase text-orange-800">Return Date</label>
                          <input required type="date" value={selectedVehicle.maintenanceReturnDate || ''} onChange={e => setSelectedVehicle({ ...selectedVehicle, maintenanceReturnDate: e.target.value })} className="w-full px-4 py-2 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm text-slate-700" />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold uppercase text-orange-800">Reason</label>
                          <input required type="text" placeholder="e.g. Scheduled Maintenance" value={selectedVehicle.maintenanceReason || ''} onChange={e => setSelectedVehicle({ ...selectedVehicle, maintenanceReason: e.target.value })} className="w-full px-4 py-2 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm text-slate-700" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <label className="text-xs font-bold uppercase text-slate-500">Photos</label>
                      <div className="flex flex-wrap gap-3">
                        {selectedVehicle.photos?.map((photo, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => {
                                const newPhotos = [...(selectedVehicle.photos || [])];
                                newPhotos.splice(i, 1);
                                setSelectedVehicle({ ...selectedVehicle, photos: newPhotos });
                              }}
                              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                          <ImagePlus size={24} className="mb-1" />
                          <span className="text-[10px] font-bold">Add Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="hidden" 
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              let currentPhotos = selectedVehicle.photos || [];
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  currentPhotos = [...currentPhotos, reader.result as string];
                                  setSelectedVehicle({ ...selectedVehicle, photos: currentPhotos });
                                };
                                reader.readAsDataURL(file);
                              });
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* View Mode */}
                    {selectedVehicle.photos && selectedVehicle.photos.length > 0 && (
                      <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 snap-x">
                        {selectedVehicle.photos.map((photo, i) => (
                          <div key={i} className="w-48 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-200 snap-center">
                            <img src={photo} alt="Vehicle" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</p>
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-full border inline-block",
                          selectedVehicle.status === 'Available' ? "bg-green-50 text-green-700 border-green-200" :
                          selectedVehicle.status === 'In Use' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {selectedVehicle.status}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Registration</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVehicle.plate}</p>
                        <p className="text-xs text-slate-500">{selectedVehicle.registrationDate}</p>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Color</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVehicle.color}</p>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Current Mileage</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVehicle.currentMileage?.toLocaleString()} km</p>
                      </div>

                      <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Last Oil Change</p>
                            <p className="text-sm font-bold text-slate-900">{selectedVehicle.oilChangeMileage?.toLocaleString()} km</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Next Due</p>
                            <p className="text-sm font-bold text-slate-900">{(selectedVehicle.oilChangeMileage + selectedVehicle.oilChangeInterval)?.toLocaleString()} km</p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              ((selectedVehicle.currentMileage || 0) - selectedVehicle.oilChangeMileage) / selectedVehicle.oilChangeInterval > 0.9 ? "bg-red-500" :
                              ((selectedVehicle.currentMileage || 0) - selectedVehicle.oilChangeMileage) / selectedVehicle.oilChangeInterval > 0.75 ? "bg-amber-500" :
                              "bg-green-500"
                            )}
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (((selectedVehicle.currentMileage || 0) - selectedVehicle.oilChangeMileage) / selectedVehicle.oilChangeInterval) * 100))}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 text-center font-medium">
                          {Math.max(0, (selectedVehicle.oilChangeMileage + selectedVehicle.oilChangeInterval) - (selectedVehicle.currentMileage || 0)).toLocaleString()} km remaining until next service
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                {isEditingVehicle ? (
                  <>
                    <button 
                      onClick={() => setIsEditingVehicle(false)} 
                      className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      form="edit-vehicle-form"
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    {selectedVehicle.status === 'In Use' && (
                      <button 
                        onClick={() => {
                          const activeContract = contracts.find(c => c.vehicleId === selectedVehicle.id.toString() && (!c.status || c.status === 'Active'));
                          if (activeContract) {
                            setReturningContractId(activeContract.contractId);
                          } else {
                            addNotification('Error', 'No active contract found for this vehicle.', 'info');
                          }
                        }} 
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <ClipboardCheck size={16} />
                        Process Return
                      </button>
                    )}
                    <button 
                      onClick={() => setIsEditingVehicle(true)} 
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button 
                      onClick={() => setSelectedVehicle(null)} 
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
                    >
                      Close Details
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {returningContract && (
        <ReturnVehicleModal
          isOpen={!!returningContractId}
          onClose={() => setReturningContractId(null)}
          contract={returningContract}
          onSave={handleSaveReturn}
        />
      )}
    </div>
  );
};

const Header = ({ onMenuClick, role, setRole, setView }: { onMenuClick: () => void; role: Role; setRole: (r: Role) => void; setView: (v: View) => void }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const { unreadCount, notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-slate-100 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-64">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="bg-transparent border-none text-sm outline-none w-full placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotificationsOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                  className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearAll}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Clear all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <Bell className="mx-auto text-slate-300 mb-2" size={24} />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={cn(
                              "p-4 transition-colors hover:bg-slate-50 flex gap-3 relative group",
                              !notif.read && "bg-blue-50/30"
                            )}
                          >
                            <div className="shrink-0 mt-0.5">
                              {notif.type === 'success' && <CheckCircle2 className="text-green-500" size={18} />}
                              {notif.type === 'error' && <XCircle className="text-red-500" size={18} />}
                              {notif.type === 'info' && <Info className="text-blue-500" size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">{notif.title}</h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                {notif.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.read && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="absolute right-4 top-4 p-1 text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all rounded bg-white shadow-sm border border-slate-200"
                                title="Mark as read"
                              >
                                <CheckCircle2 size={12} />
                              </button>
                            )}
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 self-center absolute right-4 group-hover:opacity-0 transition-opacity" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg flex items-center gap-2">
          <Globe size={18} />
          <span className="text-xs font-semibold uppercase">FR</span>
        </button>
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        
        {/* Role Switcher */}
        <div className="relative">
          <button 
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              {role === 'saas_admin' ? 'SaaS Admin' : role === 'tenant' ? 'Agency' : 'Client'}
            </span>
          </button>
          
          <AnimatePresence>
            {isRoleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1"
                >
                  <button 
                    onClick={() => { setRole('saas_admin'); setView(View.SAAS_DASHBOARD); setIsRoleDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-slate-50", role === 'saas_admin' && "font-bold text-slate-900 bg-slate-50")}
                  >
                    View as SaaS Admin
                  </button>
                  <button 
                    onClick={() => { setRole('tenant'); setView(View.DASHBOARD); setIsRoleDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-slate-50", role === 'tenant' && "font-bold text-slate-900 bg-slate-50")}
                  >
                    View as Agency
                  </button>
                  <button 
                    onClick={() => { setRole('client'); setView(View.CLIENT_RENTALS); setIsRoleDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-slate-50", role === 'client' && "font-bold text-slate-900 bg-slate-50")}
                  >
                    View as Client
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        <button className="flex items-center gap-3 p-1 ps-2 hover:bg-slate-50 rounded-lg transition-colors">
          <span className="hidden sm:block text-sm font-medium text-slate-700">Mohamed Azr</span>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            MA
          </div>
        </button>
      </div>
    </header>
  );
};

const SaasDashboardView = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-slate-500 text-sm">Super Admin Dashboard for Nokhba Rental SaaS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: '142', trend: '+5 this month', color: 'text-indigo-600' },
          { label: 'Active Users', value: '1,204', trend: '+12%', color: 'text-emerald-600' },
          { label: 'MRR', value: '$84,500', trend: '+8.4%', color: 'text-slate-900' },
          { label: 'System Uptime', value: '99.99%', trend: 'Healthy', color: 'text-teal-600' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={cn("text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</h3>
              <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

type Agency = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  plan: string;
};

const SaasAgenciesView = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgency, setNewAgency] = useState<Partial<Agency>>({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    plan: 'Basic Package'
  });
  const { addNotification } = useNotifications();

  const handleCreateAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgency.name || !newAgency.email) return;

    const agency: Agency = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAgency.name,
      email: newAgency.email,
      phone: newAgency.phone || '',
      status: newAgency.status as 'Active' | 'Inactive',
      plan: newAgency.plan || 'Basic Package',
      createdAt: new Date().toLocaleDateString()
    };
    
    setAgencies([...agencies, agency]);
    setShowAddModal(false);
    setNewAgency({ name: '', email: '', phone: '', status: 'Active', plan: 'Basic Package' });
    addNotification('Company Created', `${agency.name} has been added successfully.`, 'success');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Agencies</h2>
          <p className="text-slate-500 text-sm">Manage tenant companies and their subscriptions.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create company
        </button>
      </div>

      {agencies.length === 0 ? (
        <div className="bg-surface-container-lowest border border-slate-200 rounded-2xl shadow-sm text-center py-20">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Agencies Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Click the button above to register a new tenant company in the system.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan / Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{agency.name}</p>
                      <p className="text-xs text-slate-500 font-mono">ID: {agency.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{agency.email}</p>
                      <p className="text-xs text-slate-500">{agency.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block",
                        agency.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{agency.plan}</p>
                      <p className="text-xs text-slate-500">{agency.createdAt}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-block">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Agency Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight">Create Tenant Company</h3>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateAgency} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 block">Company Name *</label>
                  <input required type="text" value={newAgency.name} onChange={e => setNewAgency({ ...newAgency, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none" placeholder="Acme Rentals" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Email *</label>
                    <input required type="email" value={newAgency.email} onChange={e => setNewAgency({ ...newAgency, email: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none" placeholder="admin@acme.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Phone</label>
                    <input type="text" value={newAgency.phone} onChange={e => setNewAgency({ ...newAgency, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none" placeholder="+1..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Status</label>
                    <select value={newAgency.status} onChange={e => setNewAgency({ ...newAgency, status: e.target.value as 'Active' | 'Inactive' })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Pricing Plan</label>
                    <select value={newAgency.plan} onChange={e => setNewAgency({ ...newAgency, plan: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none">
                      <option value="Basic Package">Basic Package</option>
                      <option value="Standard Package">Standard Package</option>
                      <option value="Gold Package">Gold Package</option>
                      <option value="VIP Package">VIP Package</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-900">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20">
                    Create Company
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type PackageType = {
  id: string;
  name: string;
  minCars: number;
  maxCars: number | null;
  price: number;
};

const initialPackages: PackageType[] = [
  { id: '1', name: 'Basic Package', minCars: 0, maxCars: 10, price: 99 },
  { id: '2', name: 'Standard Package', minCars: 11, maxCars: 20, price: 199 },
  { id: '3', name: 'Gold Package', minCars: 21, maxCars: 30, price: 299 },
  { id: '4', name: 'VIP Package', minCars: 31, maxCars: null, price: 399 },
];

const SaasPackagesView = () => {
  const [packages, setPackages] = useState(initialPackages);
  const [editingPkg, setEditingPkg] = useState<PackageType | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkg) {
      setPackages(packages.map(p => p.id === editingPkg.id ? editingPkg : p));
      setEditingPkg(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Packages</h2>
          <p className="text-slate-500 text-sm">Manage pricing and limits for tenant subscriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{pkg.name}</h3>
              <p className="text-3xl font-bold text-slate-900 mb-4">${pkg.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 mb-6 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
                <Car size={16} className="text-slate-400" />
                <span>
                  {pkg.maxCars === null ? `${pkg.minCars}+ Cars` : `${pkg.minCars} - ${pkg.maxCars} Cars`}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setEditingPkg(pkg)}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200 shadow-sm flex items-center justify-center gap-2"
            >
              <Edit2 size={16} /> Edit
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingPkg && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              onClick={() => setEditingPkg(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Edit Package</h3>
                  <button type="button" onClick={() => setEditingPkg(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Package Name</label>
                    <input 
                      required 
                      type="text" 
                      value={editingPkg.name} 
                      onChange={e => setEditingPkg({ ...editingPkg, name: e.target.value })} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm font-medium" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Min Cars</label>
                      <input 
                        required 
                        type="number" 
                        value={editingPkg.minCars} 
                        onChange={e => setEditingPkg({ ...editingPkg, minCars: parseInt(e.target.value) || 0 })} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Max Cars</label>
                      <input 
                        type="number" 
                        value={editingPkg.maxCars === null ? '' : editingPkg.maxCars} 
                        onChange={e => setEditingPkg({ ...editingPkg, maxCars: e.target.value === '' ? null : parseInt(e.target.value) })} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm font-medium" 
                        placeholder="Leave empty"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Monthly Price ($)</label>
                    <input 
                      required 
                      type="number" 
                      value={editingPkg.price} 
                      onChange={e => setEditingPkg({ ...editingPkg, price: parseInt(e.target.value) || 0 })} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm font-medium" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingPkg(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClientDashboardView = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Rentals</h2>
          <p className="text-slate-500 text-sm">Manage your current and past vehicle rentals.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-8 border border-slate-200 rounded-2xl shadow-sm text-center py-20">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Rentals</h3>
        <p className="text-slate-500 max-w-sm mx-auto">You don't have any ongoing rentals at the moment. Contact your agency to start a new contract.</p>
      </div>
    </div>
  );
};

const TenantDashboardView = ({ setCurrentView }: { setCurrentView: (v: View) => void }) => {
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm">Welcome back, here's what's happening with your fleet today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Export Reports
          </button>
          <button 
            onClick={() => setCurrentView(View.FLEET)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <Car size={16} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Contracts', value: '24', trend: '+12%', color: 'text-blue-600' },
          { label: 'Available Cars', value: '8', trend: '32 total', color: 'text-green-600' },
          { label: 'Upcoming Returns', value: '3', trend: 'Today', color: 'text-amber-600' },
          { label: 'Revenue (MTD)', value: '€42,500', trend: '+18.2%', color: 'text-slate-900' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={cn("text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</h3>
              <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-slate-200 rounded-2xl shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <button className="text-sm font-semibold text-slate-500 hover:text-slate-900">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { user: 'Sarah Connor', action: 'signed contract', target: 'MERCEDES G-CLASS', time: '2 mins ago', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { user: 'James Bond', action: 'returned vehicle', target: 'ASTON MARTIN DB11', time: '1 hour ago', icon: Car, color: 'text-green-600', bg: 'bg-green-50' },
              { user: 'John Wick', action: 'added new client', target: 'Vinci Group', time: '4 hours ago', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { user: 'Ellen Ripley', action: 'reported issue', target: 'APC Carrier', time: 'Yesterday', icon: Bell, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((activity, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activity.bg, activity.color)}>
                  <activity.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-semibold text-slate-800">{activity.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Fleet Status</h3>
            <div className="space-y-4">
              {[
                { label: 'In Use', value: 75, color: 'bg-blue-500' },
                { label: 'Maintenance', value: 10, color: 'bg-amber-500' },
                { label: 'Available', value: 15, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/20">
            <h3 className="font-bold mb-2">Upgrade to Pro</h3>
            <p className="text-slate-400 text-xs mb-4">Unlock premium features like multi-user access and advanced analytics.</p>
            <button className="w-full bg-white text-slate-900 font-bold py-2 rounded-xl text-sm hover:bg-slate-100 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const MainApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [role, setRole] = useState<Role>('tenant');
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);

  // Simple login toggle for demo purposes
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="p-8 pb-6 text-center">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                N
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
              <p className="text-slate-500 text-sm">Select a role to view different dashboards</p>
            </div>
            
            <div className="p-8 pt-0 space-y-4">
              <button 
                onClick={() => { setRole('saas_admin'); setCurrentView(View.SAAS_DASHBOARD); setIsLoggedIn(true); }}
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group"
              >
                Login as SaaS Admin
                <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button 
                onClick={() => { setRole('tenant'); setCurrentView(View.DASHBOARD); setIsLoggedIn(true); }}
                className="w-full bg-white border border-slate-200 text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 group"
              >
                Login as Agency (Tenant)
                <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button 
                onClick={() => { setRole('client'); setCurrentView(View.CLIENT_RENTALS); setIsLoggedIn(true); }}
                className="w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 group"
              >
                Login as Client
                <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let currentNavItems: NavItem[] = [];
  let currentSecondaryNavItems: NavItem[] = [];

  if (role === 'saas_admin') {
    currentNavItems = [
      { title: 'Overview', icon: LayoutDashboard, view: View.SAAS_DASHBOARD },
      { title: 'Agencies', icon: Briefcase, view: View.SAAS_AGENCIES },
      { title: 'Packages', icon: Package, view: View.SAAS_PACKAGES },
    ];
    currentSecondaryNavItems = [
      { title: 'Settings', icon: Settings, view: View.SETTINGS },
    ];
  } else if (role === 'tenant') {
    currentNavItems = [
      { title: 'Dashboard', icon: LayoutDashboard, view: View.DASHBOARD },
      { title: 'Fleet', icon: Car, view: View.FLEET, badge: '12' },
      { title: 'Clients', icon: Users, view: View.CLIENTS },
      { title: 'Contracts', icon: FileText, view: View.CONTRACTS },
    ];
    currentSecondaryNavItems = [
      { title: 'Settings', icon: Settings, view: View.SETTINGS },
    ];
  } else if (role === 'client') {
    currentNavItems = [
      { title: 'My Rentals', icon: Car, view: View.CLIENT_RENTALS },
    ];
    currentSecondaryNavItems = [
      { title: 'Settings', icon: Settings, view: View.SETTINGS },
    ];
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        currentView={currentView} 
        setView={setCurrentView}
        navItems={currentNavItems}
        secondaryNavItems={currentSecondaryNavItems}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          role={role}
          setRole={setRole}
          setView={setCurrentView}
        />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentView === View.DASHBOARD && <TenantDashboardView setCurrentView={setCurrentView} />}
                {currentView === View.SAAS_DASHBOARD && <SaasDashboardView />}
                {currentView === View.SAAS_AGENCIES && <SaasAgenciesView />}
                {currentView === View.SAAS_PACKAGES && <SaasPackagesView />}
                {currentView === View.CLIENT_RENTALS && <ClientDashboardView />}

                {currentView === View.FLEET && <FleetView />}
                
                {currentView === View.CONTRACTS && <ContractsView />}
                
                {currentView !== View.DASHBOARD && currentView !== View.SAAS_DASHBOARD && currentView !== View.SAAS_AGENCIES && currentView !== View.SAAS_PACKAGES && currentView !== View.CLIENT_RENTALS && currentView !== View.FLEET && currentView !== View.CONTRACTS && (
                  <EmptyState
                    variant="dashed"
                    icon={currentView === View.CLIENTS ? <Users size={28} /> : <Settings size={28} />}
                    title={String(currentView)}
                    description="This module is currently under development as part of the Phase 4/5 roadmap."
                    className="min-h-[60vh]"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <MainApp />
    </NotificationProvider>
  );
}
