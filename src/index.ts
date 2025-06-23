// src/index.ts
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import * as path from "path";
import { fileURLToPath } from 'url';
import type { Dte } from "./types/dte.ts"
import type { InvoiceData } from './interfaces/invoice_data.ts';
import { createInvoice } from './services/invoice.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../data/dtes/facturas/dtes_type33_2025_01.xlsx");
const workbook = XLSX.read(readFileSync(filePath), { type: 'buffer' });

// Assuming the data is in a sheet named 'DTEs'
const worksheet = workbook.Sheets['DTEs'];

// Convert the worksheet to JSON
const jsonData: unknown[] = XLSX.utils.sheet_to_json(worksheet);
const invoices: Dte[] = jsonData as Dte[];

// Map the data to the desired fields
const odooInvoices: InvoiceData[] = invoices.map(row => ({
    l10n_latam_document_number: row.folio,
    partner_id: 39,
    move_type: 'out_invoice',
    invoice_date: row.start_date,
    invoice_line_ids: [
        [0, 0, {
            product_id: 5,
            quantity: 1,
            price_unit: 100,
        }],
    ],
    invoice_date_due: row.end_date
}));
console.log(odooInvoices)

// odooInvoices.forEach((invoice) => createInvoice(invoice))
createInvoice(odooInvoices[0])
