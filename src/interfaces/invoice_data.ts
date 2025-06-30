// Add this to your interfaces/invoice_data.ts file
export type InvoiceLine = [
  number, // Command (0 for create)
  number, // ID (0 for new records)
  {
    product_id: number;
    quantity: number;
    price_unit: number;
    name?: string;
    discount?: number;
    // Add other invoice line fields as needed
  }
];

export interface InvoiceData {
  l10n_latam_document_number: string;
  partner_id: number;
  move_type: string;
  invoice_date: string;
  invoice_line_ids: InvoiceLine[];
  invoice_date_due: string;
  invoice_payment_term_id: number;
  ref?: string;
  narration?: string;
  journal_id: number;
  reversed_entry_id?: number;
}
