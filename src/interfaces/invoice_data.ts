export interface InvoiceData {
  l10n_latam_document_number: number;
  invoice_date: string;
  invoice_date_due: string;
  partner_id: number;
  move_type: string;
  invoice_line_ids: Array<
    [
      0,
      0,
      {
        product_id: number;
        quantity: number;
        price_unit: number;
        name?: string;
      }
    ]
  >;
  invoice_payment_term_id: number;
  // invoice_user_id: number;
  ref: string;
  narration: string;
}
