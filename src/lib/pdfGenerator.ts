import { jsPDF } from 'jspdf';

/**
 * Generates an advanced PDF for a vehicle rental contract mimicking the Voiturelib template.
 * @param data The contract data used to populate the fields.
 * @returns jsPDF instance
 */
export const generateAdvancedPDF = (data: any) => {
  const doc = new jsPDF();

  // Common styles
  doc.setFont("helvetica");

  // --- Header ---
  // Voiturelib' logo text
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246); // Blue for "Voiture"
  doc.text("Voiture", 10, 15);
  doc.setTextColor(239, 68, 68); // Red for "lib'"
  doc.text("lib'", 38, 15);
  
  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Contrat de location de véhicule entre particuliers", 65, 15);

  // Helper for drawing bounding boxes and titles
  const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(x, y, w, h);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 2, y + 4);
    // Draw a subtle line under the title for aesthetics
    doc.setDrawColor(220, 220, 220);
    doc.line(x, y + 6, x + w, y + 6);
  };

  // Section 1: Le locataire
  drawBox(10, 20, 90, 65, "Le locataire");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Prénom et Nom :", 12, 30);
  doc.text(data?.clientName || ".......................................................", 38, 30);
  
  doc.text("Téléphone :", 12, 36);
  doc.text(data?.clientPhone || ".......................................................", 30, 36);
  
  doc.text("Adresse :", 12, 42);
  doc.text(data?.clientAddress || ".......................................................", 27, 42);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("(à confirmer par justif. de domicile)", 12, 45);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Date et lieu naissance :", 12, 51);
  doc.text((data?.clientBirthDate ? `${data.clientBirthDate} à ${data.clientBirthPlace || ''}` : '') || ".......................................................", 45, 51);
  
  doc.text("Permis de conduire no :", 12, 57);
  doc.text(data?.licenseNumber || ".......................................................", 45, 57);
  
  doc.text("Date obtention permis :", 12, 63);
  doc.text(data?.licenseDate || ".......................................................", 45, 63);
  
  doc.rect(12, 67, 3, 3);
  doc.text("d'autres conducteurs sont autorisés à conduire le véhicule", 17, 70);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("lister ces conducteurs sur une feuille séparée en notant leur no de permis", 12, 74);
  doc.text("Pour que l'assurance Voiturelib' fonctionne le conducteur doit avoir au", 12, 78);
  doc.text("moins 21 ans et son permis depuis plus de 2 ans.", 12, 81);

  // Section 2: La Location
  drawBox(10, 88, 90, 30, "La Location");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Date et heure début de location :", 12, 98);
  doc.text(data?.startDate || "......................................", 58, 98);
  
  doc.text("Date et heure de fin de location :", 12, 104);
  doc.text(data?.endDate || "......................................", 58, 104);
  
  doc.text("Kilométrage pré-payé :", 12, 110);
  doc.text((data?.rentalDurationDays ? (data.rentalDurationDays * 100).toString() : ".............") + " km", 45, 110); // Example calculation
  
  doc.text("Prix de la location :", 12, 116);
  doc.text((data?.dailyRate && data?.rentalDurationDays ? (data.dailyRate * data.rentalDurationDays).toString() : ".............") + " €", 40, 116);

  // Section 3: Le Propriétaire
  drawBox(105, 20, 95, 25, "Le Propriétaire");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Prénom et Nom :", 107, 30);
  doc.text("Nokhba Rental", 135, 30);
  doc.text("Téléphone(s) :", 107, 36);
  doc.text("+33 1 23 45 67 89", 130, 36);

  // Section 4: Le Véhicule loué
  drawBox(105, 48, 95, 25, "Le Véhicule loué");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Marque et modèle :", 107, 58);
  doc.text((data?.vehicleMake ? `${data.vehicleMake} ${data.vehicleModel}` : '') || "......................................", 135, 58);
  doc.text("Immatriculation :", 107, 64);
  doc.text(data?.vehiclePlate || "......................................", 132, 64);
  doc.text("Date 1ère mise en circulation :", 107, 70);
  doc.text(data?.vehicleRegistrationDate?.toString() || "...........................", 150, 70);

  // Section 5: Assurance, Assistance, dépôt de garantie
  drawBox(105, 76, 95, 55, "Assurance, Assistance, dépôt de garantie");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Dépôt de garantie : chèque de", 107, 86);
  doc.text(data?.deposit?.toString() || "............", 152, 86);
  doc.text("€", 170, 86);

  doc.rect(107, 90, 3, 3);
  doc.setFont("helvetica", "bold");
  doc.text("Voiture particulière assurée par Voiturelib'", 112, 93);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text('("VP" sur la carte grise)', 170, 93);
  
  doc.text("En cas d'accident, vol ou panne :", 107, 97);
  doc.text("- le locataire doit prévenir le propriétaire, établir un constat amiable en cas", 107, 100);
  doc.text("d'accident, un dépôt de plainte au commissariat en cas de vol.", 107, 103);
  doc.text("Prévenez dès que possible Voiturelib' au 09 77 19 74 05", 107, 106);
  doc.text('- constat amiable : indiquer dans la rubrique 8 "Société d\'assurance" le Nom :', 107, 109);
  doc.text('"COVEA FLEET" et N° de contrat : "125401436". Laisser vides les autres infos', 107, 112);
  doc.text("rubrique 8.", 107, 115);
  doc.text("- les véhicules agés de moins de 10 ans bénéficient en plus d'une assistance", 107, 118);
  doc.text("panne et accident, joignable 24h/24 au 01 47 11 67 67", 107, 121);
  doc.text('(indiquer à l\'opérateur le no de contrat Voiturelib\' : 125401436)', 107, 124);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(107, 126, 3, 3);
  doc.text("Autre type de véhicule, NON assuré par Voiturelib", 112, 129);

  // Section 6: État du véhicule avant la location
  drawBox(10, 135, 190, 65, "État du véhicule avant la location");
  
  // Car Diagram Placeholder
  doc.setDrawColor(200, 200, 200);
  doc.rect(12, 145, 85, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Car Diagram Placeholder", 32, 168);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(0, 0, 0);
  doc.text("noter sur ce schéma les accrocs sur la carrosserie", 22, 195);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Compteur km au départ :", 105, 145);
  doc.text(data?.vehicleStartMileage?.toString() || "................", 140, 145);
  doc.text("km", 160, 145);
  
  doc.text("Carburant :", 145, 155);
  // Fuel gauge placeholder 1
  doc.rect(165, 148, 25, 10);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Fuel Gauge P.", 168, 154);
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(9);
  doc.text("État extérieur :", 105, 165);
  doc.text(".........................................................................................", 105, 172);
  doc.text(".........................................................................................", 105, 178);
  
  doc.text("État intérieur :", 105, 185);
  doc.text(".........................................................................................", 105, 192);
  doc.text(".........................................................................................", 105, 198);

  // Section 7: Clauses and signatures
  doc.setDrawColor(150, 150, 150);
  doc.rect(10, 205, 190, 28);
  
  doc.rect(12, 208, 3, 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("les clauses de location détaillées sur www.voiturelib.com/contrat-location-vehicule-entre-particulier s'appliquent (recommandé).", 17, 211);
  
  doc.rect(12, 214, 3, 3);
  doc.text("d'autres clauses sont jointes sur papier libre", 17, 217);
  
  doc.setFontSize(9);
  doc.text("Signature du locataire :", 20, 225);
  if (data?.signature) {
    doc.addImage(data.signature, "PNG", 60, 220, 25, 10);
  }
  doc.text("Signature du propriétaire :", 110, 225);

  // Section 8: remplir au retour
  // Create an outer rect with a gray background for the left 'Tab'
  doc.rect(10, 238, 190, 50);
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 238, 8, 50, 'F');
  doc.setDrawColor(150, 150, 150);
  doc.rect(10, 238, 190, 50, 'S'); // re-stroke the boundary

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 150, 150);
  doc.text("remplir au retour", 16, 282, { angle: 90 });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  doc.text("Date et heure réelles de fin de location :", 20, 245);
  doc.text("..........................................", 75, 245);
  
  doc.text("Compteur km au retour :", 20, 251);
  doc.text("...........................", 55, 251);
  
  doc.text("Kilométrage parcouru :", 20, 257);
  doc.text("...........................", 52, 257);
  doc.text("Une compensation de ............. € est versée / remboursée pour la différence de kilométrage", 85, 257);
  doc.text("et / ou de carburant.", 160, 261);
  
  doc.text("Carburant au retour :", 145, 245);
  // Fuel gauge placeholder 2
  doc.setDrawColor(200, 200, 200);
  doc.rect(175, 239, 20, 8);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text("Gauge P.", 180, 244);
  doc.setTextColor(0, 0, 0);
  
  doc.setDrawColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text("Compte-rendu final de la location :", 20, 268);
  
  doc.rect(70, 265, 3, 3);
  doc.text("Aucun dommage - dépôt de garantie restitué.", 75, 268);
  
  doc.rect(70, 271, 3, 3);
  doc.text("Dommages légers - dépôt de garantie restitué contre paiement d'une somme de ............. €", 75, 274);
  
  doc.rect(70, 277, 3, 3);
  doc.setFont("helvetica", "bold");
  doc.text("Dommages importants - dépôt de garantie encaissé ou conservé", 75, 280);
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text("Indiquer tous les détails des dommages subis par le véhicule sur papier libre signé par les deux parties.", 75, 284);

  return doc;
};
