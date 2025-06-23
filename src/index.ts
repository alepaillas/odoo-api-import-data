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
import type { City } from './types/city.ts';
import type { PaymentType } from './types/payment_type.ts';
import { createInvoice } from './services/invoice.ts';
import { createPartner, findPartner } from './services/partner.ts';
import type { CreatePartnerType } from './services/interfaces/partner.ts';
import { findRegionByCommune } from './services/territory.ts';

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
const jsonCommunesSheet: unknown[] = XLSX.utils.sheet_to_json(communesSheet);
const communes: Commune[] = jsonCommunesSheet as Commune[];

const citiesSheet = workbook.Sheets['Cities'];
const jsonCitiesSheet: unknown[] = XLSX.utils.sheet_to_json(citiesSheet);
const cities: City[] = jsonCitiesSheet as City[];

const paymentTypesSheet = workbook.Sheets['Payment_Types'];
const jsonPaymentTypesSheet: unknown[] = XLSX.utils.sheet_to_json(paymentTypesSheet);
const paymentTypes: PaymentType[] = jsonPaymentTypesSheet as PaymentType[];

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

        const city = cities.find(city => city.id == partner.city_id);
        if (!city) {
            throw new Error("City not found");
        }

        const region = findRegionByCommune(commune.name)
        if (!region) {
            console.log(commune)
            throw new Error("Region not found");
        }

        if (partner.type_payment_id != 0) {
            const paymentType = paymentTypes.find(paymentType => paymentType.id == partner.type_payment_id);
            if (!paymentType) {
                console.log(partner.type_payment_id)
                throw new Error("PaymentType not found");
            }
        }

        const partnerId = await findPartner(partner.rut);

        if (!partnerId) {
            const child_ids: number[] = [];

            let payment_contact: number | undefined = undefined;
            if (partner.name_payment) {
                const partnerData: CreatePartnerType = {
                    l10n_cl_sii_taxpayer_type: "3", // End consumer
                    company_type: "person",
                    function: "Contacto de pago",
                    name: partner.name_payment,
                    phone: partner.phone_payment,

                };
                const newPartner = await createPartner(partnerData);
                console.log(newPartner);
                if (newPartner) {
                    payment_contact = newPartner
                    child_ids.push(payment_contact);
                }
            }

            let business_contact: number | undefined = undefined;
            if (partner.business_contact) {
                const partnerData: CreatePartnerType = {
                    l10n_cl_sii_taxpayer_type: "3", // End consumer
                    company_type: "person",
                    function: "Contacto comercial",
                    name: partner.business_contact,
                    email: partner.email_commercial,
                };
                const newPartner = await createPartner(partnerData);
                console.log(newPartner);
                if (newPartner) {
                    business_contact = newPartner
                    child_ids.push(business_contact);
                }
            }

            let property_payment_term_id: number;
            switch (partner.type_payment_id) {
                case 17879:
                    property_payment_term_id = 1;
                    break;
                case 21644:
                    property_payment_term_id = 11; // Cedido a Factoring
                    break;
                case 3253:
                    property_payment_term_id = 12; // Cheque 30 días
                    break;
                case 14881:
                    property_payment_term_id = 13; // Cheque al día Contra entrega
                    break;
                case 3254:
                    property_payment_term_id = 14; // Crédito 30 días
                    break;
                case 14777:
                    property_payment_term_id = 15; // Crédito 45 días
                    break;
                case 14778:
                    property_payment_term_id = 16; // Crédito 60 días
                    break;
                case 15409:
                    property_payment_term_id = 17; // Crédito 90 días
                    break;
                case 16217:
                    property_payment_term_id = 18; // Crédito 15 días
                    break;
                case 3249:
                    property_payment_term_id = 1;
                    break;
                case 15711:
                    property_payment_term_id = 1;
                    break;
                case 3256:
                    property_payment_term_id = 1;
                    break;
                case 14882:
                    property_payment_term_id = 1;
                    break;
                case 3251:
                    property_payment_term_id = 1;
                    break;
                case 3250:
                    property_payment_term_id = 1;
                    break;
                case 3252:
                    property_payment_term_id = 1;
                    break;
                case 3255:
                    property_payment_term_id = 1;
                    break;
                default:
                    property_payment_term_id = 1;
            }

            let state_id: number | boolean;
            switch (region) {
                case "Arica y Parinacota":
                    state_id = 1188;
                    break;
                case "Tarapacá":
                    state_id = 1174;
                    break;
                case "Antofagasta":
                    state_id = 1175;
                    break;
                case "Atacama":
                    state_id = 1176;
                    break;
                case "Coquimbo":
                    state_id = 1177;
                    break;
                case "Valparaíso":
                    state_id = 1178;
                    break;
                case "Región del Libertador Gral. Bernardo O'Higgins":
                    state_id = 1179;
                    break;
                case "Región del Maule":
                    state_id = 1180;
                    break;
                case "Región del Biobío":
                    state_id = 1181;
                    break;
                case "Región del Ñuble":
                    state_id = 1189;
                    break;
                case "Región de la Araucanía":
                    state_id = 1182;
                    break;
                case "Región de los Ríos":
                    state_id = 1187;
                    break;
                case "Región de los Lagos":
                    state_id = 1183;
                    break;
                case "Región Aisén del Gral. Carlos Ibañez del Campo":
                    state_id = 1184;
                    break;
                case "Región de Magallanes y de la Antártica Chilena":
                    state_id = 1185;
                    break;
                case "Región Metropolitana de Santiago":
                    state_id = 1186;
                    break;
                default:
                    state_id = false;
            }

            const partnerData: CreatePartnerType = {
                l10n_latam_identification_type_id: 4, // RUT
                l10n_cl_sii_taxpayer_type: "1", // VAT Affected
                country_id: 46, // Chile
                state_id: state_id,
                name: partner.name,
                company_type: partner.type_customer,
                city: commune.name,
                street: partner.address,
                street2: city.name,
                l10n_cl_activity_description: partner.business_activity,
                vat: partner.rut,
                email: partner.email,
                phone: partner.phone ? partner.phone : "",
                mobile: partner.mobile ? partner.mobile : "",
                comment: partner.reference ? partner.reference : "",
                property_payment_term_id: property_payment_term_id,
                child_ids: child_ids
            };
            const newPartner = await createPartner(partnerData);
            console.log(newPartner);
        }
    } catch (error) {
        console.error(error);
    }
}


// odooInvoices.forEach((invoice) => createInvoice(invoice))
// createInvoice(odooInvoices[0])
