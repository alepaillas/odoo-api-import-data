// src/services/interfaces/purchaseOrder.ts
export interface CreatePurchaseOrderType {
    partner_id: number;
    date_order: string;
    date_planned: string;
    user_id: string;
    origin: string;
    payment_term_id: string;
    order_line: Array<{
        product_id: number;
        product_qty: number;
        price_unit: number;
    }>;
}
