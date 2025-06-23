// src/index.ts
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import * as path from "path";
import { fileURLToPath } from 'url';
import type { InvoiceData } from './interfaces/invoice_data.ts';
import type { Dte } from "./types/dte.ts"
import type { Product } from './types/product.ts';
import type { Customer } from './types/customer.ts';
import type { Commune } from './types/commune.ts';
import { createInvoice } from './services/invoice.ts';
import { createPartner, findPartner } from './services/partner.ts';
import type { CreatePartnerType } from './services/interfaces/partner.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../data/dtes/facturas/dtes_type33_2025_01.xlsx");
const workbook = XLSX.read(readFileSync(filePath), { type: 'buffer' });

const dtesSheet = workbook.Sheets['DTEs'];
const jsonDtesSheet: unknown[] = XLSX.utils.sheet_to_json(dtesSheet);
const dtes: Dte[] = jsonDtesSheet as Dte[];

const productsSheet = workbook.Sheets['Products'];
const jsonProductsSheet: unknown[] = XLSX.utils.sheet_to_json(productsSheet);
const products: Product[] = jsonProductsSheet as Product[];

const customersSheet = workbook.Sheets['Customers'];
const jsonCustomersSheet: unknown[] = XLSX.utils.sheet_to_json(customersSheet);
const customers: Customer[] = jsonCustomersSheet as Customer[];

const communesSheet = workbook.Sheets['Communes'];
const jsoncommunesSheet: unknown[] = XLSX.utils.sheet_to_json(communesSheet);
const communes: Commune[] = jsoncommunesSheet as Commune[];

const odooInvoices: InvoiceData[] = dtes.map(invoice => ({
    l10n_latam_document_number: invoice.folio,
    partner_id: 39,
    move_type: 'out_invoice',
    invoice_date: invoice.start_date,
    invoice_line_ids: [
        [0, 0, {
            product_id: 5,
            quantity: 1,
            price_unit: 100,
        }],
    ],
    invoice_date_due: invoice.end_date
}));
// console.log(odooInvoices)

for (const dte of dtes) {
    try {
        const partner = customers.find(customer => customer.id == dte.customer_id);
        if (!partner) {
            throw new Error("Partner not found");
        }

        const commune = communes.find(commune => commune.id == partner.commune_id);
        if (!commune) {
            throw new Error("Commune not found");
        }

        const partnerId = await findPartner(partner.rut);

        if (!partnerId) {
            const partnerData: CreatePartnerType = {
                l10n_latam_identification_type_id: 4, // RUT
                l10n_cl_sii_taxpayer_type: "1", // VAT Affected
                country_id: 46, // Chile
                state_id: 1186, // RM
                name: partner.name,
                company_type: partner.type_customer,
                city: commune.name,
                street: partner.address,
                l10n_cl_activity_description: partner.business_activity,
                vat: partner.rut,
            };
            const newPartner = await createPartner(partnerData);
            console.log(newPartner);
        }
    } catch (error) {
        console.error(error);
    }
    break
}


// odooInvoices.forEach((invoice) => createInvoice(invoice))
// createInvoice(odooInvoices[0])
