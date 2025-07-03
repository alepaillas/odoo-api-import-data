// src/services/invoice.ts
import type { InvoiceData } from "../interfaces/invoice_data.ts";
import { makeAuthenticatedRequest } from './auth.ts';

export async function createInvoice(invoiceData: InvoiceData): Promise<number> {
    try {
        const createData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'create',
                args: [invoiceData],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(createData);
        console.log('Invoice created with ID:', result.result);
        return result.result;

    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
}

export async function getInvoice(invoiceId: number): Promise<any> {
    try {
        const readData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'read',
                args: [invoiceId, ['name', 'partner_id', 'amount_total', 'state', 'invoice_date']],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(readData);
        return result.result;

    } catch (error) {
        console.error('Error getting invoice:', error);
        throw error;
    }
}

export async function findInvoice(documentNumber: string): Promise<number | null> {
    try {
        const searchData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'search',
                args: [[['sequence_number', '=', documentNumber]]],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(searchData);
        console.log(result)

        if (!result.result || !Array.isArray(result.result) || result.result.length === 0) {
            console.log('No invoice found with document number:', documentNumber);
            return null;
        }

        return result.result[0];

    } catch (error) {
        console.error('Error finding invoice:', error);
        throw error;
    }
}

export async function confirmInvoice(invoiceId: number): Promise<void> {
    try {
        const confirmData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'action_post',
                args: [invoiceId],
                kwargs: {},
            },
        };

        await makeAuthenticatedRequest(confirmData);
        console.log('Invoice confirmed:', invoiceId);

    } catch (error) {
        console.error('Error confirming invoice:', error);
        throw error;
    }
}

export async function cancelInvoice(invoiceId: number): Promise<void> {
    try {
        const cancelData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'button_cancel',
                args: [invoiceId],
                kwargs: {},
            },
        };

        await makeAuthenticatedRequest(cancelData);
        console.log('Invoice cancelled:', invoiceId);

    } catch (error) {
        console.error('Error cancelling invoice:', error);
        throw error;
    }
}