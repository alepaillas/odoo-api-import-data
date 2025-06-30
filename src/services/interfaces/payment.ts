export interface PaymentData {
    payment_method_id: number;
    payment_type: 'inbound' | 'outbound';
    partner_id: number;
    partner_type: 'customer' | 'supplier';
    amount: number;
    currency_id?: number;
    journal_id: number;
    communication?: string;
    invoice_ids?: [number];
    date?: string;
    payment_date?: string;
}