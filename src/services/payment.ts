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
export async function createPayment(paymentData: PaymentData): Promise<number> {
    try {
        const createData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment',
                method: 'create',
                args: [paymentData],
                kwargs: {},
            },
        };
        const result = await makeAuthenticatedRequest(createData);
        return result.result;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
}

/**
 * Post a payment (confirm it)
 * @param paymentId ID of the payment to post
 * @returns Result of the post operation
 */
export async function postPayment(paymentId: number): Promise<boolean> {
    try {
        const postData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment',
                method: 'action_post',
                args: [[paymentId]],
                kwargs: {},
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
 * Get invoice move lines that need reconciliation (outstanding receivables)
 * @param invoiceId ID of the invoice
 * @returns Array of move line IDs that need reconciliation
 */
export async function getInvoiceReceivableLines(invoiceId: number): Promise<number[]> {
    try {
        // First get the invoice to find its move_id
        const invoiceData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'read',
                args: [[invoiceId], ['line_ids']],
                kwargs: {},
            },
        };
        const invoiceResult = await makeAuthenticatedRequest(invoiceData);

        if (!invoiceResult.result || !invoiceResult.result[0]) {
            throw new Error(`Invoice ${invoiceId} not found`);
        }

        const lineIds = invoiceResult.result[0].line_ids;

        // Get the receivable lines (lines with account_type = 'asset_receivable' and not reconciled)
        const searchData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move.line',
                method: 'search',
                args: [[
                    ['id', 'in', lineIds],
                    ['account_id.account_type', '=', 'asset_receivable'],
                    ['reconciled', '=', false]
                ]],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(searchData);
        return result.result || [];
    } catch (error) {
        console.error('Error getting invoice receivable lines:', error);
        throw error;
    }
}

/**
 * Get payment move lines for reconciliation
 * @param paymentId ID of the payment
 * @returns Array of move line IDs from the payment
 */
export async function getPaymentMoveLines(paymentId: number): Promise<number[]> {
    try {
        // Get payment details to find its move_id
        const paymentData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.payment',
                method: 'read',
                args: [[paymentId], ['move_id']],
                kwargs: {},
            },
        };
        const paymentResult = await makeAuthenticatedRequest(paymentData);

        if (!paymentResult.result || !paymentResult.result[0] || !paymentResult.result[0].move_id) {
            throw new Error(`Payment ${paymentId} not found or has no move`);
        }

        const moveId = paymentResult.result[0].move_id[0];

        // Get move lines from the payment move
        const moveData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'read',
                args: [[moveId], ['line_ids']],
                kwargs: {},
            },
        };
        const moveResult = await makeAuthenticatedRequest(moveData);

        if (!moveResult.result || !moveResult.result[0]) {
            throw new Error(`Payment move ${moveId} not found`);
        }

        const lineIds = moveResult.result[0].line_ids;

        // Get the payable/receivable lines from the payment (opposite side)
        const searchData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move.line',
                method: 'search',
                args: [[
                    ['id', 'in', lineIds],
                    ['account_id.account_type', '=', 'asset_receivable'],
                    ['reconciled', '=', false]
                ]],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(searchData);
        return result.result || [];
    } catch (error) {
        console.error('Error getting payment move lines:', error);
        throw error;
    }
}

/**
 * Reconcile invoice and payment move lines
 * @param lineIds Array of move line IDs to reconcile
 * @returns Result of reconciliation
 */
export async function reconcileLines(lineIds: number[]): Promise<boolean> {
    try {
        if (lineIds.length < 2) {
            throw new Error('Need at least 2 lines to reconcile');
        }

        const reconcileData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move.line',
                method: 'reconcile',
                args: [lineIds],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(reconcileData);
        return result.result !== false;
    } catch (error) {
        console.error('Error reconciling lines:', error);
        throw error;
    }
}

/**
 * Complete payment process: create, post, and reconcile with invoice
 * @param paymentData Payment data
 * @param invoiceId Invoice ID to reconcile with
 * @returns Payment ID
 */
export async function processPaymentAndReconcile(paymentData: PaymentData, invoiceId: number): Promise<number> {
    try {
        console.log(`Creating payment for invoice ${invoiceId}...`);

        // 1. Create the payment
        const paymentId = await createPayment(paymentData);
        console.log(`Created payment with ID: ${paymentId}`);

        // 2. Post the payment
        await postPayment(paymentId);
        console.log(`Posted payment ${paymentId}`);

        // 3. Get invoice receivable lines
        const invoiceLines = await getInvoiceReceivableLines(invoiceId);
        console.log(`Found ${invoiceLines.length} invoice receivable lines`);

        // 4. Get payment move lines
        const paymentLines = await getPaymentMoveLines(paymentId);
        console.log(`Found ${paymentLines.length} payment move lines`);

        // 5. Reconcile the lines
        const allLines = [...invoiceLines, ...paymentLines];
        if (allLines.length >= 2) {
            await reconcileLines(allLines);
            console.log(`Reconciled payment ${paymentId} with invoice ${invoiceId}`);
        } else {
            console.warn(`Not enough lines to reconcile (found ${allLines.length})`);
        }

        return paymentId;
    } catch (error) {
        console.error('Error in payment and reconciliation process:', error);
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
                kwargs: {},
            },
        };
        const result = await makeAuthenticatedRequest(readData);
        return result.result[0] || null;
    } catch (error) {
        console.error('Error getting payment details:', error);
        throw error;
    }
}

/**
 * Check if an invoice is fully paid
 * @param invoiceId ID of the invoice
 * @returns True if invoice is fully paid
 */
export async function isInvoicePaid(invoiceId: number): Promise<boolean> {
    try {
        const invoiceData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'account.move',
                method: 'read',
                args: [[invoiceId], ['payment_state', 'amount_residual']],
                kwargs: {},
            },
        };
        const result = await makeAuthenticatedRequest(invoiceData);

        if (result.result && result.result[0]) {
            const invoice = result.result[0];
            return invoice.payment_state === 'paid' || invoice.amount_residual === 0;
        }

        return false;
    } catch (error) {
        console.error('Error checking invoice payment status:', error);
        throw error;
    }
}