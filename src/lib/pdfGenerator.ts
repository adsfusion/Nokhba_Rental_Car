import { jsPDF } from 'jspdf';

// ─── Palette ────────────────────────────────────────────────────────────────
// Matte black background feel via near-black fills; pure gold accent lines.
const BLACK  = [15,  15,  15]  as const;   // near-black text
const GOLD   = [191, 155, 48]  as const;   // muted luxury gold
const SILVER = [140, 140, 140] as const;   // secondary labels
const WHITE  = [255, 255, 255] as const;
const PANEL  = [248, 247, 244] as const;   // warm off-white panel fill
const DARK   = [30,  30,  30]  as const;   // header bar fill

// ─── Types ───────────────────────────────────────────────────────────────────
export interface LuxuryPDFData {
  contractNumber: string;
  issueDate:      string;
  status:         string;

  // Client
  clientName:     string;
  clientPhone:    string;
  clientAddress:  string;
  clientEmail?:   string;
  licenseNumber:  string;

  // Vehicle
  vehicleBrand:   string;
  vehicleModel:   string;
  vehiclePlate:   string;
  vehicleYear?:   string | number;

  // Rental terms
  startDate:      string;
  endDate:        string;
  totalDays:      number;
  dailyRate:      number;
  depositAmount:  number;
  totalAmount:    number;

  // Signature — caller must pass a validated `data:image/png;base64,...` string
  signaturePng?:  string;
  signedAt?:      string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shorthand to set RGB text color */
function tc(doc: jsPDF, [r, g, b]: readonly [number, number, number]) {
  doc.setTextColor(r, g, b);
}

/** Shorthand to set RGB draw color */
function dc(doc: jsPDF, [r, g, b]: readonly [number, number, number]) {
  doc.setDrawColor(r, g, b);
}

/** Shorthand to set RGB fill color */
function fc(doc: jsPDF, [r, g, b]: readonly [number, number, number]) {
  doc.setFillColor(r, g, b);
}

/** Draw a filled rectangle */
function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.rect(x, y, w, h, 'F');
}

/** Draw a thin horizontal gold rule */
function goldRule(doc: jsPDF, x: number, y: number, w: number, lw = 0.5) {
  dc(doc, GOLD);
  doc.setLineWidth(lw);
  doc.line(x, y, x + w, y);
}

/** Draw a thin horizontal silver rule */
function silverRule(doc: jsPDF, x: number, y: number, w: number) {
  dc(doc, [220, 218, 212]);
  doc.setLineWidth(0.2);
  doc.line(x, y, x + w, y);
}

/**
 * Draw a panel (optional fill) with a gold-accented title bar.
 * Returns the Y position of the first content line inside the panel.
 */
function drawPanel(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  title: string,
  titleBarH = 8,
): number {
  // Panel background
  fc(doc, PANEL);
  fillRect(doc, x, y, w, h);

  // Title bar — dark fill
  fc(doc, DARK);
  fillRect(doc, x, y, w, titleBarH);

  // Gold left accent stripe in title bar
  fc(doc, GOLD);
  fillRect(doc, x, y, 2, titleBarH);

  // Title text
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  tc(doc, GOLD);
  doc.text(title.toUpperCase(), x + 5, y + titleBarH - 2.5);

  // Outer border
  dc(doc, GOLD);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, h);

  return y + titleBarH + 4; // first content line
}

/**
 * Render a key/value row inside a panel.
 * Returns next Y.
 */
function kv(
  doc: jsPDF,
  x: number, y: number, w: number,
  label: string, value: string,
  labelW = 52,
): number {
  const LINE_H = 6;
  // Label
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  tc(doc, SILVER);
  doc.text(label, x + 3, y);

  // Value
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  tc(doc, BLACK);
  // Clip long values to fit
  const maxW = w - labelW - 6;
  const safeVal = doc.splitTextToSize(value || '—', maxW)[0] ?? '—';
  doc.text(safeVal, x + labelW, y);

  return y + LINE_H;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Generates a premium, luxury-branded PDF rental contract for Nokhba Rental.
 *
 * IMPORTANT: The `signaturePng` field must already be a valid
 * `data:image/png;base64,...` string — callers are responsible for fetching
 * and re-encoding the signature via `signatureUrlToPngBase64()` before
 * calling this function.
 *
 * @returns A jsPDF instance ready for `.save()` or `.output()`.
 */
export function generateNokhbaPDF(data: LuxuryPDFData): jsPDF {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW   = doc.internal.pageSize.getWidth();   // 210 mm
  // const PH   = doc.internal.pageSize.getHeight();  // 297 mm
  const ML   = 12; // margin left
  const MR   = 12; // margin right
  const CW   = PW - ML - MR; // content width = 186 mm

  doc.setFont('helvetica');

  // ── 1. HEADER BAR ──────────────────────────────────────────────────────────
  fc(doc, DARK);
  fillRect(doc, 0, 0, PW, 28);

  // Gold left accent
  fc(doc, GOLD);
  fillRect(doc, 0, 0, 3, 28);

  // Brand
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  tc(doc, WHITE);
  doc.text('NOKHBA', ML + 3, 12);

  doc.setFontSize(20);
  tc(doc, GOLD);
  doc.text('RENTAL', ML + 41, 12);

  // Tagline
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  tc(doc, [160, 140, 80]);
  doc.text('LUXURY CAR RENTAL  ·  CONTRAT DE LOCATION', ML + 3, 18);

  // Contract number & date — right-aligned
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  tc(doc, GOLD);
  doc.text(`N° ${data.contractNumber}`, PW - MR, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  tc(doc, [200, 195, 170]);
  doc.setFontSize(7.5);
  doc.text(`Émis le / Issued: ${data.issueDate}`, PW - MR, 17, { align: 'right' });
  doc.text(`Statut / Status: ${data.status.toUpperCase()}`, PW - MR, 23, { align: 'right' });

  // ── 2. GOLD DIVIDER ────────────────────────────────────────────────────────
  goldRule(doc, 0, 28, PW, 1.2);

  // ── 3. SECTION ROW 1: Client (left 50%) + Vehicle (right 50%) ─────────────
  let y = 34;
  const COL2_X = ML + CW / 2 + 3;
  const COL_W  = CW / 2 - 3;

  // CLIENT INFORMATION panel
  const clientPanelH = 50;
  let cy = drawPanel(doc, ML, y, COL_W, clientPanelH, 'Informations Client / Client Information');
  cy = kv(doc, ML, cy, COL_W, 'Nom / Name',          data.clientName);
  cy = kv(doc, ML, cy, COL_W, 'Téléphone / Phone',   data.clientPhone);
  cy = kv(doc, ML, cy, COL_W, 'Adresse / Address',   data.clientAddress);
  if (data.clientEmail) {
    cy = kv(doc, ML, cy, COL_W, 'Email',              data.clientEmail);
  }
  kv(doc, ML, cy, COL_W, 'Permis / License No.',     data.licenseNumber);

  // VEHICLE DETAILS panel (same row, right column)
  let vy = drawPanel(doc, COL2_X, y, COL_W, clientPanelH, 'Détails Véhicule / Vehicle Details');
  vy = kv(doc, COL2_X, vy, COL_W, 'Marque / Brand',    data.vehicleBrand);
  vy = kv(doc, COL2_X, vy, COL_W, 'Modèle / Model',    data.vehicleModel);
  vy = kv(doc, COL2_X, vy, COL_W, 'Immat. / Plate',    data.vehiclePlate);
  if (data.vehicleYear) {
    kv(doc, COL2_X, vy, COL_W, 'Année / Year',         String(data.vehicleYear));
  }

  y += clientPanelH + 5;

  // ── 4. SECTION ROW 2: Rental Terms (full width) ───────────────────────────
  const termsPanelH = 46;
  let ty = drawPanel(doc, ML, y, CW, termsPanelH, 'Conditions de Location / Rental Terms & Financials');

  // Two-column layout inside the panel
  const TC1 = ML;
  const TC2 = ML + CW / 2;
  const TCW = CW / 2 - 4;

  ty = kv(doc, TC1, ty, TCW, 'Début / Start Date',    data.startDate);
  silverRule(doc, TC1 + 2, ty - 1, TCW - 4);
  ty = kv(doc, TC1, ty, TCW, 'Fin / End Date',         data.endDate);
  silverRule(doc, TC1 + 2, ty - 1, TCW - 4);
  kv(doc, TC1, ty, TCW, 'Durée / Duration',            `${data.totalDays} jour(s) / day(s)`);

  // Right column — financials
  let fy = drawPanel(doc, TC2, y - 12, TCW + 4, termsPanelH, 'Récapitulatif Financier / Financial Summary');
  // Slight overlap correction — re-stamp section
  fc(doc, DARK);
  fillRect(doc, TC2, y - 12, TCW + 4, 8);
  fc(doc, GOLD);
  fillRect(doc, TC2, y - 12, 2, 8);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  tc(doc, GOLD);
  doc.text('RÉCAPITULATIF FINANCIER / FINANCIAL SUMMARY', TC2 + 5, y - 12 + 5.5);

  fy = y - 12 + 12;
  fy = kv(doc, TC2, fy, TCW + 4, 'Tarif / Daily Rate',   `€ ${data.dailyRate.toFixed(2)} / jour`);
  silverRule(doc, TC2 + 2, fy - 1, TCW);
  fy = kv(doc, TC2, fy, TCW + 4, 'Dépôt / Deposit',      `€ ${data.depositAmount.toFixed(2)}`);
  silverRule(doc, TC2 + 2, fy - 1, TCW);

  // Total — emphasized
  fc(doc, GOLD);
  fillRect(doc, TC2 + 2, fy - 1, TCW, 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  tc(doc, DARK);
  doc.text('TOTAL', TC2 + 5, fy + 4.5);
  doc.setFontSize(10);
  doc.text(`€ ${data.totalAmount.toFixed(2)}`, TC2 + TCW - 2, fy + 4.5, { align: 'right' });

  y += termsPanelH + 5;

  // ── 5. LEGAL CLAUSE ───────────────────────────────────────────────────────
  goldRule(doc, ML, y, CW, 0.4);
  y += 4;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  tc(doc, SILVER);
  const clause =
    'Le locataire reconnaît avoir pris connaissance des conditions générales de location et s\'engage à les respecter. ' +
    'The renter acknowledges having read the general rental conditions and agrees to comply with them. ' +
    'Tout dommage, infraction ou perte sera à la charge exclusive du locataire / ' +
    'Any damage, fine or loss shall be the sole responsibility of the renter.';
  const clauseLines = doc.splitTextToSize(clause, CW);
  doc.text(clauseLines, ML, y);
  y += clauseLines.length * 4 + 3;

  goldRule(doc, ML, y, CW, 0.4);
  y += 6;

  // ── 6. SIGNATURE BLOCK ────────────────────────────────────────────────────
  const SIG_BOX_H = 42;
  const SIG_BOX_W = 90;

  // Client signature panel (left)
  drawPanel(doc, ML, y, SIG_BOX_W, SIG_BOX_H, 'Signature du Locataire / Client Signature');

  if (data.signaturePng) {
    // White inner box for signature image
    fc(doc, WHITE);
    fillRect(doc, ML + 2, y + 10, SIG_BOX_W - 4, SIG_BOX_H - 14);
    doc.addImage(data.signaturePng, 'PNG', ML + 4, y + 11, SIG_BOX_W - 8, SIG_BOX_H - 16);
  } else {
    // Placeholder lines
    tc(doc, [200, 198, 195]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature non capturée / Signature not captured', ML + SIG_BOX_W / 2, y + 26, { align: 'center' });
  }

  if (data.signedAt) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    tc(doc, SILVER);
    doc.text(`Signé le / Signed: ${data.signedAt}`, ML + 3, y + SIG_BOX_H - 2);
  }

  // Owner signature panel (right)
  const ownerX = ML + SIG_BOX_W + 6;
  const ownerW = CW - SIG_BOX_W - 6;
  drawPanel(doc, ownerX, y, ownerW, SIG_BOX_H, 'Signature Propriétaire / Owner Signature');

  // Owner identity block
  let oy = y + 12;
  oy = kv(doc, ownerX, oy, ownerW, 'Société', 'Nokhba Rental');
  kv(doc, ownerX, oy, ownerW, 'Représentant', 'Direction Générale');

  // Signature line
  dc(doc, [180, 165, 80]);
  doc.setLineWidth(0.5);
  doc.line(ownerX + 4, y + SIG_BOX_H - 8, ownerX + ownerW - 4, y + SIG_BOX_H - 8);
  tc(doc, SILVER);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Cachet et signature / Stamp & signature', ownerX + ownerW / 2, y + SIG_BOX_H - 3, { align: 'center' });

  y += SIG_BOX_H + 5;

  // ── 7. FOOTER ─────────────────────────────────────────────────────────────
  goldRule(doc, 0, y + 2, PW, 0.8);

  fc(doc, DARK);
  fillRect(doc, 0, y + 2.8, PW, 10);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  tc(doc, [150, 140, 100]);
  doc.text('NOKHBA RENTAL  ·  Luxury Car Rental Services', ML, y + 9);
  tc(doc, SILVER);
  doc.text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, PW - MR, y + 9, { align: 'right' });

  return doc;
}
