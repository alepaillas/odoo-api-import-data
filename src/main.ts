// src/index.ts
import { ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD } from './utils/env.ts';
import type { InvoiceData } from "./interfaces/InvoiceData.ts";
import { authenticate } from './services/auth.ts';

if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_PASSWORD) {
    throw new Error('Missing environment variables');
}

async function createInvoice(invoiceData: InvoiceData) {
    try {
        const { sessionId, userId } = await authenticate()

        // Prepare the data for creating the invoice
        const data = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute',
                args: [
                    ODOO_DB,
                    userId,
                    ODOO_PASSWORD,
                    'account.move',
                    'create',
                    invoiceData
                ],
            },
        };

        // Make the request to create the invoice
        const response = await fetch(`${ODOO_URL}/jsonrpc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${sessionId}`,
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();
        console.log('Invoice creation response:', responseData);
    } catch (error) {
        console.error('Error creating invoice:', error);
    }
}

// Example usage
const invoiceData: InvoiceData = {
    partner_id: 39,
    move_type: 'out_invoice',
    invoice_line_ids: [
        [0, 0, {
            product_id: 5,
            quantity: 1,
            price_unit: 100,
        }],
    ],
};

createInvoice(invoiceData);
