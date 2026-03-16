import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export interface SeriesExportData {
  name: string;
  venue: string | null;
  dateRange: string | null;
  standing: { played: number; won: number; lost: number; tied: number; other: number };
  topRuns: { name: string; value: number }[];
  topWickets: { name: string; value: number }[];
  topFielding: { name: string; value: number }[];
  matches: {
    date: string;
    opponent: string;
    ourScore: number | null;
    opponentScore: number | null;
    result: string;
    overs: number;
  }[];
}

export interface SeriesExportOptions {
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

export async function exportSeriesPDF(data: SeriesExportData, options: SeriesExportOptions = {}) {
  const doc = new jsPDF();
  const pageWidth = 210;
  let currentY = 15;
  let textStartX = 14;

  if (options.logoUrl) {
    const logoBase64 = await loadImageAsBase64(options.logoUrl);
    if (logoBase64) {
      try { doc.addImage(logoBase64, "PNG", 14, 10, 18, 18); textStartX = 38; } catch {}
    }
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.name, textStartX, currentY + 5);

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

  // Series info box
  doc.setFillColor(41, 128, 185);
  doc.roundedRect(14, currentY, 182, 22, 3, 3, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const { played, won, lost, tied } = data.standing;
  doc.text(`P: ${played}  |  W: ${won}  |  L: ${lost}  |  T: ${tied}`, 20, currentY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const infoLine = [data.dateRange, data.venue].filter(Boolean).join("  |  ");
  if (infoLine) doc.text(infoLine, 20, currentY + 16);
  doc.setTextColor(0, 0, 0);
  currentY += 30;

  // Top Performers
  const sections = [
    { title: "🏏 TOP RUN SCORERS", data: data.topRuns, color: [16, 185, 129] as [number, number, number], label: "Runs" },
    { title: "🎯 TOP WICKET TAKERS", data: data.topWickets, color: [239, 68, 68] as [number, number, number], label: "Wickets" },
    { title: "🧤 BEST FIELDERS", data: data.topFielding, color: [59, 130, 246] as [number, number, number], label: "Contributions" },
  ];

  for (const section of sections) {
    if (section.data.length === 0) continue;
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...section.color);
    doc.text(section.title, 14, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Player", section.label]],
      body: section.data.slice(0, 5).map((r, i) => [i + 1, r.name, r.value]),
      theme: "striped",
      headStyles: { fillColor: section.color, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 12 } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Matches table
  if (data.matches.length > 0) {
    if (currentY > 220) { doc.addPage(); currentY = 20; }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MATCH RESULTS", 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Date", "Opponent", "Score", "Result"]],
      body: data.matches.map(m => [
        m.date,
        m.opponent || "-",
        m.ourScore !== null ? `${m.ourScore} - ${m.opponentScore}` : "-",
        m.result || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 282, pageWidth - 14, 282);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: "center" });
    if (options.watermarkHandle) { doc.setFontSize(8); doc.text(options.watermarkHandle, 14, 287); }
    else if (options.teamName) { doc.setFontSize(8); doc.text(options.teamName, 14, 287); }
    doc.setTextColor(0, 0, 0);
  }

  const safeName = data.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `series-${safeName}.pdf`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(blobUrl); }, 100);
}

export async function exportSeriesPNG(element: HTMLElement, filename: string) {
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
