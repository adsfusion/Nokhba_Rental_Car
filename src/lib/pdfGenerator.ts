import jsPDF from 'jspdf';

export interface LuxuryPDFData {
  contractNumber: string;
  issueDate?: string;
  status?: string;

  // Client
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientEmail?: string;
  licenseNumber: string;

  // Vehicle
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear?: string | number;
  vehicleStartMileage?: number | string;

  // Rental terms
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate?: number;
  depositAmount: number;
  totalAmount: number;
  currency?: string;

  // Signature
  signaturePng?: string;
  signedAt?: string;

  // Return data (for rendering the bottom box if it's completed)
  returnedAt?: string;
  returnMileage?: number | string;
  returnFuelLevel?: string;
}

export function generateNokhbaPDF(data: LuxuryPDFData): jsPDF {
  const doc = new jsPDF();
  doc.setFont("helvetica");

  // --- Header ---
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text("NOKHBA", 10, 15);
  doc.setTextColor(239, 68, 68);
  doc.text("RENTAL", 45, 15);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Contrat de location de véhicule entre particuliers", 80, 15);

  const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(x, y, w, h);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 2, y + 4);
    doc.setDrawColor(220, 220, 220);
    doc.line(x, y + 6, x + w, y + 6);
  };

  // Section 1: Le locataire
  drawBox(10, 20, 90, 65, "Le locataire");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Prénom et Nom :", 12, 30);
  doc.text(data.clientName || ".......................................................", 38, 30);
  doc.text("Téléphone :", 12, 36);
  doc.text(data.clientPhone || ".......................................................", 30, 36);
  doc.text("Adresse :", 12, 42);
  doc.text(data.clientAddress || ".......................................................", 27, 42);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("(à confirmer par justif. de domicile)", 12, 45);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Permis de conduire no :", 12, 57);
  doc.text(data.licenseNumber || ".......................................................", 45, 57);

  doc.rect(12, 67, 3, 3);
  doc.text("d'autres conducteurs sont autorisés à conduire le véhicule", 17, 70);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("lister ces conducteurs sur une feuille séparée", 12, 74);
  doc.text("Le conducteur doit avoir au moins 21 ans et 2 ans de permis.", 12, 81);

  // Section 2: La Location
  drawBox(10, 88, 90, 30, "La Location");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Début de location :", 12, 98);
  doc.text(data.startDate || "......................................", 58, 98);
  doc.text("Fin de location :", 12, 104);
  doc.text(data.endDate || "......................................", 58, 104);
  doc.text("Durée :", 12, 110);
  doc.text(`${data.totalDays || "......"} jour(s)`, 45, 110);
  doc.text("Prix total de la location :", 12, 116);
  doc.text(`${data.totalAmount} ${data.currency || 'MAD'}`, 48, 116);

  // Section 3: Le Propriétaire
  drawBox(105, 20, 95, 25, "Le Propriétaire");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Prénom et Nom :", 107, 30);
  doc.text("NOKHBA RENTAL", 135, 30);
  doc.text("Téléphone(s) :", 107, 36);
  doc.text("+212 6 00 00 00 00", 130, 36);

  // Section 4: Le Véhicule loué
  drawBox(105, 48, 95, 25, "Le Véhicule loué");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Marque et modèle :", 107, 58);
  doc.text(`${data.vehicleBrand || ''} ${data.vehicleModel || ''}`, 135, 58);
  doc.text("Immatriculation :", 107, 64);
  doc.text(data.vehiclePlate || "......................................", 132, 64);
  doc.text("Année :", 107, 70);
  doc.text(data.vehicleYear?.toString() || "...........................", 150, 70);

  // Section 5: Assurance, Assistance, dépôt de garantie
  drawBox(105, 76, 95, 55, "Assurance, Assistance, dépôt de garantie");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Dépôt de garantie : chèque de", 107, 86);
  doc.text(data.depositAmount?.toString() || "............", 152, 86);
  doc.text(data.currency || 'MAD', 170, 86);

  doc.text("En cas d'accident, vol ou panne :", 107, 97);
  doc.text("- le locataire doit prévenir le propriétaire, établir un constat", 107, 100);
  doc.text("amiable en cas d'accident, un dépôt de plainte au commissariat.", 107, 103);
  doc.text("- Prévenez dès que possible l'assurance.", 107, 106);

  // Section 6: État du véhicule avant la location
  drawBox(10, 135, 190, 65, "État du véhicule avant la location");

  doc.setDrawColor(200, 200, 200);
  doc.rect(12, 145, 85, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Schéma carrosserie (Placeholder)", 30, 168);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(0, 0, 0);
  doc.text("noter sur ce schéma les accrocs sur la carrosserie", 22, 195);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Compteur km au départ :", 105, 145);
  doc.text(data.vehicleStartMileage?.toString() || "................", 145, 145);
  doc.text("km", 165, 145);

  doc.text("Carburant :", 145, 155);
  doc.rect(165, 148, 25, 10);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Jauge", 172, 154);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(9);
  doc.text("État extérieur :", 105, 165);
  doc.text(".........................................................................................", 105, 172);
  doc.text("État intérieur :", 105, 185);
  doc.text(".........................................................................................", 105, 192);

  // Section 7: Clauses and signatures
  doc.setDrawColor(150, 150, 150);
  doc.rect(10, 205, 190, 28);
  doc.rect(12, 208, 3, 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Les clauses de location s'appliquent (recommandé).", 17, 211);

  doc.setFontSize(9);
  doc.text("Signature du locataire :", 20, 225);
  if (data.signaturePng) {
    doc.addImage(data.signaturePng, "PNG", 60, 220, 25, 10);
  }
  doc.text("Signature du propriétaire :", 110, 225);

  // Section 8: Remplir au retour
  doc.rect(10, 238, 190, 50);
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 238, 8, 50, 'F');
  doc.setDrawColor(150, 150, 150);
  doc.rect(10, 238, 190, 50, 'S');

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 150, 150);
  doc.text("remplir au retour", 16, 282, { angle: 90 });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text("Date et heure réelles de fin de location :", 20, 245);
  doc.text(data.returnedAt ? new Date(data.returnedAt).toLocaleDateString() : "..........................................", 75, 245);

  doc.text("Compteur km au retour :", 20, 251);
  doc.text(data.returnMileage?.toString() || "...........................", 55, 251);

  doc.text("Carburant au retour :", 145, 245);
  doc.setDrawColor(200, 200, 200);
  doc.rect(175, 239, 20, 8);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(data.returnFuelLevel || "Jauge", 180, 244);
  doc.setTextColor(0, 0, 0);

  doc.setDrawColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text("Compte-rendu final de la location :", 20, 268);
  doc.rect(70, 265, 3, 3);
  doc.text("Aucun dommage - dépôt de garantie restitué.", 75, 268);
  doc.rect(70, 271, 3, 3);
  doc.text("Dommages légers - dépôt de garantie restitué contre paiement.", 75, 274);
  doc.rect(70, 277, 3, 3);
  doc.setFont("helvetica", "bold");
  doc.text("Dommages importants - dépôt de garantie encaissé ou conservé", 75, 280);

  return doc;
}
