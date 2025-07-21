// src/services/interfaces/purchaseOrder.ts

export type PurchaseOrderLine = [
    number, // Command (0 for create)
    number, // ID (0 for new records)
    {
        product_id: number;
        product_qty: number;
        price_unit: number;
    }
];

export interface CreatePurchaseOrderType {
    partner_id: number;
    date_order: string;
    date_planned: string;
    user_id: number;
    origin: string;
    payment_term_id: number;
    order_line: PurchaseOrderLine[];
}
