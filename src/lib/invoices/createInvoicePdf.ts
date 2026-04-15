import { generateInvoicePdf } from "./generateInvoicePdf";
import { uploadInvoiceToStorage } from "./uploadInvoiceToStorage";

type InvoiceData = {
  invoiceNumber: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  city?: string;
  totalFee: number;
  representativeFee: number;
  artistNet: number;
};

export async function createInvoicePdf(data: InvoiceData) {
  const pdfBlob = await generateInvoicePdf(data);

  const publicUrl = await uploadInvoiceToStorage(
    pdfBlob,
    data.invoiceNumber
  );

  return publicUrl;
}