// src/services/purchaseOrder.ts
import { makeAuthenticatedRequest } from './auth.ts';
import type { CreatePurchaseOrderType } from './interfaces/purchaseOrder.ts';

export async function createPurchaseOrder(purchaseOrder: CreatePurchaseOrderType): Promise<number> {
    try {
        const createData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'purchase.order',
                method: 'create',
                args: [purchaseOrder],
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
