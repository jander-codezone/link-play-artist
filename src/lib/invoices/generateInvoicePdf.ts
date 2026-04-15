import html2pdf from "html2pdf.js";
import { generateInvoiceHtml } from "./generateInvoiceHtml";

type GenerateInvoicePdfInput = {
  invoiceNumber: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  city?: string;
  totalFee: number;
  representativeFee: number;
  artistNet: number;
};

export async function generateInvoicePdf(data: GenerateInvoicePdfInput) {
  const html = generateInvoiceHtml(data);

  const element = document.createElement("div");
  element.innerHTML = html;

  const pdfBlob = await html2pdf()
    .set({
      margin: 0,
      filename: `${data.invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .outputPdf("blob");

  return pdfBlob as Blob;
}