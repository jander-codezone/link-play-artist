import { supabase } from "@/integrations/supabase/client";

export async function uploadInvoiceToStorage(
  pdfBlob: Blob,
  invoiceNumber: string
) {
  const fileName = `${invoiceNumber}.pdf`;
  const filePath = `invoices/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error subiendo factura:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("invoices")
    .getPublicUrl(filePath);

  return data.publicUrl;
}