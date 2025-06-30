// src/services/payment.ts
import { makeAuthenticatedRequest } from './auth.ts';
import type { PaymentData } from "./interfaces/payment.ts"

/**
 * Find a payment method by name
 * @param name Name of the payment method to search for
 * @returns ID of the payment method or null if not found
 */
export async function findPaymentMethodByName(name: string): Promise<number | null> {
    try {
        const searchData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment.method',
                method: 'search',
                args: [[['name', '=', name]]],
                kwargs: { limit: 1 },
            },
        };

        const result = await makeAuthenticatedRequest(searchData);

        if (result.result && result.result.length > 0) {
            return result.result[0];
        }
        return null;
    } catch (error) {
        console.error('Error finding payment method:', error);
        throw error;
    }
}

/**
 * Find a payment journal by name
 * @param name Name of the journal to search for
 * @returns ID of the journal or null if not found
 */
export async function findPaymentJournalByName(name: string): Promise<number | null> {
    try {
        const searchData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.journal',
                method: 'search',
                args: [[['name', '=', name], ['type', 'in', ['bank', 'cash']]]],
                kwargs: { limit: 1 },
            },
        };

        const result = await makeAuthenticatedRequest(searchData);

        if (result.result && result.result.length > 0) {
            return result.result[0];
        }
        return null;
    } catch (error) {
        console.error('Error finding payment journal:', error);
        throw error;
    }
}

/**
 * Create a payment for an invoice
 * @param params Parameters for creating the payment
 * @returns ID of the created payment
 */
// Update this function in src/services/payment.ts
export async function createPayment(paymentData: PaymentData): Promise<number> {
    try {
        const createData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment',
                method: 'create',
                args: [paymentData],
                kwargs: {}, // Ensure kwargs are included
            },
        };

        const result = await makeAuthenticatedRequest(createData);
        return result.result;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
}

export async function postPayment(paymentId: number): Promise<boolean> {
    try {
        const postData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment',
                method: 'action_post',
                args: [[paymentId]],
                kwargs: {}, // Ensure kwargs are included
            },
        };

        const result = await makeAuthenticatedRequest(postData);
        return result.result;
    } catch (error) {
        console.error('Error posting payment:', error);
        throw error;
    }
}

/**
 * Get payment details
 * @param paymentId ID of the payment
 * @returns Payment details or null if not found
 */
export async function getPaymentDetails(paymentId: number): Promise<any> {
    try {
        const readData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment',
                method: 'read',
                args: [[paymentId]],
            },
        };

        const result = await makeAuthenticatedRequest(readData);
        return result.result[0] || null;
    } catch (error) {
        console.error('Error getting payment details:', error);
        throw error;
    }
}
