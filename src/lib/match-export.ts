/**
 * Single match PDF+PNG export with full details, player photos, and team logo
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export interface SingleMatchExportData {
  matchId: number;
  date: string;
  opponent: string;
  venue: string;
  ourScore: number | null;
  opponentScore: number | null;
  result: string;
  overs: number;
  seriesName?: string;
  batting: {
    player_name: string;
    photo_url: string | null;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    out: boolean;
    dismissal_type: string | null;
    strike_rate: string;
  }[];
  bowling: {
    player_name: string;
    photo_url: string | null;
    overs: string;
    maidens: number;
    runs_conceded: number;
    wickets: number;
    economy: string;
    extras: string;
  }[];
  fielding: {
    player_name: string;
    photo_url: string | null;
    catches: number;
    runouts: number;
    stumpings: number;
    dropped_catches: number;
  }[];
}

export interface MatchExportOptions {
  teamName?: string;
  logoUrl?: string | null;
  watermarkHandle?: string | null;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportSingleMatchPDF(
  match: SingleMatchExportData,
  options: MatchExportOptions = {}
) {
  const doc = new jsPDF();
  const pageWidth = 210;
  let currentY = 15;
  let textStartX = 14;

  // Logo
  if (options.logoUrl) {
    const logoBase64 = await loadImageAsBase64(options.logoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 14, 10, 18, 18);
        textStartX = 38;
      } catch {}
    }
  }

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`vs ${match.opponent || "Unknown"}`, textStartX, currentY + 5);

  if (options.teamName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(options.teamName, textStartX, currentY + 12);
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, currentY + 5, { align: "right" });

  currentY = options.logoUrl ? 35 : 28;

  // Match Info Box
  doc.setFillColor(41, 128, 185);
  doc.roundedRect(14, currentY, 182, 22, 3, 3, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  
  const scoreText = match.ourScore !== null ? `${match.ourScore} - ${match.opponentScore}` : "N/A";
  doc.text(`Score: ${scoreText}  |  Result: ${match.result || "N/A"}  |  Overs: ${match.overs}`, 20, currentY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${match.date}  |  ${match.venue || "N/A"}${match.seriesName ? `  |  ${match.seriesName}` : ""}`, 20, currentY + 16);
  doc.setTextColor(0, 0, 0);
  
  currentY += 30;

  // Batting Scorecard
  if (match.batting.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("🏏 BATTING SCORECARD", 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Player", "R", "B", "4s", "6s", "SR", "Status"]],
      body: match.batting.map((b) => [
        b.player_name,
        b.runs,
        b.balls,
        b.fours,
        b.sixes,
        b.strike_rate,
        b.out ? (b.dismissal_type || "Out") : "Not Out",
      ]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Bowling Scorecard
  if (match.bowling.length > 0) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("🎯 BOWLING SCORECARD", 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Player", "O", "M", "R", "W", "Econ", "Extras"]],
      body: match.bowling.map((b) => [
        b.player_name,
        b.overs,
        b.maidens,
        b.runs_conceded,
        b.wickets,
        b.economy,
        b.extras,
      ]),
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68], fontStyle: "bold", fontSize: 9, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Fielding
  if (match.fielding.length > 0) {
    if (currentY > 250) { doc.addPage(); currentY = 20; }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("🧤 FIELDING HIGHLIGHTS", 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Player", "Catches", "Run Outs", "Stumpings"]],
      body: match.fielding.map((f) => [f.player_name, f.catches, f.runouts, f.stumpings]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  const pageHeight = 297;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    if (options.watermarkHandle) {
      doc.setFontSize(8);
      doc.text(options.watermarkHandle, 14, pageHeight - 10);
    } else if (options.teamName) {
      doc.setFontSize(8);
      doc.text(options.teamName, 14, pageHeight - 10);
    }
    doc.setTextColor(0, 0, 0);
  }

  const safeName = (match.opponent || "match").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `match-vs-${safeName}-${match.date}.pdf`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(blobUrl); }, 100);
}

export async function exportSingleMatchPNG(element: HTMLElement, filename: string) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
