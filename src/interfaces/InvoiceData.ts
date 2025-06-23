export interface InvoiceData {
    partner_id: number;
    move_type: string;
    invoice_line_ids: Array<[0, 0, {
        product_id: number;
        quantity: number;
        price_unit: number;
    }]>;
}