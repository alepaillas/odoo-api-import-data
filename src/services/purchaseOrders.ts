// src/services/purchaseOrder.ts
import { makeAuthenticatedRequest } from './auth';
import type { CreatePurchaseOrderType } from './interfaces/purchaseOrder';

export async function createPurchaseOrder(purchaseOrder: CreatePurchaseOrderType): Promise<number> {
    try {
        const createData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'purchase.order',
                method: 'create',
                args: [{
                    partner_id: purchaseOrder.partner_id,
                    date_order: purchaseOrder.date_order,
                    date_planned: purchaseOrder.date_planned,
                    user_id: purchaseOrder.user_id,
                    origin: purchaseOrder.origin,
                    payment_term_id: purchaseOrder.payment_term_id,
                    order_line: purchaseOrder.order_line.map(line => ({
                        product_id: line.product_id,
                        product_qty: line.product_qty,
                        price_unit: line.price_unit,
                    })),
                }],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(createData);
        return result.result;
    } catch (error) {
        console.error('Error creating purchase order:', error);
        throw error;
    }
}

export async function getPurchaseOrderDetails(purchaseOrderId: number): Promise<any> {
    try {
        const readData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'purchase.order',
                method: 'read',
                args: [purchaseOrderId, ['partner_id', 'date_order', 'amount_total']],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(readData);
        return result.result;
    } catch (error) {
        console.error('Error getting purchase order details:', error);
        throw error;
    }
}
