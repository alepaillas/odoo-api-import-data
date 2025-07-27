// src/index.ts
import * as XLSX from "xlsx";
import { readdirSync, readFileSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { InvoiceData, InvoiceLine } from "./interfaces/invoice_data.ts";
import type { Dte, DteChild } from "./types/dte.ts";
import type { Product } from "./types/product.ts";
import type { Customer } from "./types/customer.ts";
import type { Commune } from "./types/commune.ts";
import type { City } from "./types/city.ts";
import type { PaymentType } from "./types/payment_type.ts";
import { cancelInvoice, confirmInvoice, createInvoice, findInvoice } from "./services/invoice.ts";
import { createPartner, findPartner } from "./services/partner.ts";
import type { CreatePartnerType } from "./services/interfaces/partner.ts";
import { findRegionByCommune } from "./services/territory.ts";
import { paymentTermMapper } from "./utils/paymentTermMapper.ts";
import { mapRegionToStateId } from "./utils/regionMapper.ts";
import { createProduct, findProductByCode } from "./services/product.ts";
import { createPayment, isInvoicePaid, postPayment, processPaymentAndReconcile } from "./services/payment.ts";
import type { PaymentData } from "./services/interfaces/payment.ts";
import { getMoveType } from "./utils/getMoveType.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your date range
const startDate = new Date('2017-09-01');
const endDate = new Date('2025-12-31');

// Directory where your Excel files are stored
// const directoryPath = path.resolve(__dirname, "../data/dtes/notas de credito");
const directoryPath = path.resolve(__dirname, "../data/dtes/facturas");

// Read all files in the directory
const files = readdirSync(directoryPath);

// Filter files based on the date range
const filteredFiles = files.filter(file => {
  // Extract year and month from the filename
  const match = file.match(/dtes_type33_(\d{4})_(\d{2})\.xlsx/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Months are 0-indexed in JavaScript
    const fileDate = new Date(year, month);

    // Check if the file date is within the specified range
    return fileDate >= startDate && fileDate <= endDate;
  }
  return false;
});

// Process each filtered file
for (const file of filteredFiles) {
  const filePath = path.join(directoryPath, file);
  const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });


  const dtesSheet = workbook.Sheets["DTEs"];
  const jsonDtesSheet: unknown[] = XLSX.utils.sheet_to_json(dtesSheet);
  const dtes: Dte[] = jsonDtesSheet as Dte[];
  // console.log(dtes)

  const productsSheet = workbook.Sheets["Products"];
  const jsonProductsSheet: unknown[] = XLSX.utils.sheet_to_json(productsSheet);
  const products: Product[] = jsonProductsSheet as Product[];

  const customersSheet = workbook.Sheets["Customers"];
  const jsonCustomersSheet: unknown[] = XLSX.utils.sheet_to_json(customersSheet);
  const customers: Customer[] = jsonCustomersSheet as Customer[];

  const communesSheet = workbook.Sheets["Communes"];
  const jsonCommunesSheet: unknown[] = XLSX.utils.sheet_to_json(communesSheet);
  const communes: Commune[] = jsonCommunesSheet as Commune[];

  const citiesSheet = workbook.Sheets["Cities"];
  const jsonCitiesSheet: unknown[] = XLSX.utils.sheet_to_json(citiesSheet);
  const cities: City[] = jsonCitiesSheet as City[];

  const paymentTypesSheet = workbook.Sheets["Payment_Types"];
  const jsonPaymentTypesSheet: unknown[] =
    XLSX.utils.sheet_to_json(paymentTypesSheet);
  const paymentTypes: PaymentType[] = jsonPaymentTypesSheet as PaymentType[];

  const dteChildrenSheet = workbook.Sheets["DTE_Children"];
  const jsonDteChildrenSheet: unknown[] =
    XLSX.utils.sheet_to_json(dteChildrenSheet);
  const dteChildren: DteChild[] = jsonDteChildrenSheet as DteChild[];

  for (const dte of dtes) {
    const moveType = getMoveType(dte.type_document);
    const isInvoice = moveType === 'out_invoice';
    const isCreditNote = moveType === 'out_refund';

    try {
      // Check if an invoice with the same document number already exists
      const existingInvoiceId = await findInvoice(`${dte.folio}`, 17, moveType);
      if (existingInvoiceId) {
        console.log(`Invoice with document number ${dte.folio} already exists. Skipping creation.`);
        continue; // Skip to the next iteration if the invoice exists
      }

      const partner = customers.find(
        (customer) => customer.id == dte.customer_id
      );
      if (!partner) {
        throw new Error("Partner not found");
      }

      const commune = communes.find(
        (commune) => commune.id == partner.commune_id
      );
      if (!commune) {
        throw new Error("Commune not found");
      }

      const city = cities.find((city) => city.id == partner.city_id);
      if (!city) {
        throw new Error("City not found");
      }

      const region = findRegionByCommune(commune.name);
      if (!region) {
        console.log(commune);
        throw new Error("Region not found");
      }

      if (partner.type_payment_id != 0) {
        const paymentType = paymentTypes.find(
          (paymentType) => paymentType.id == partner.type_payment_id
        );
        if (!paymentType) {
          console.log(partner.type_payment_id);
          throw new Error("PaymentType not found");
        }
      }

      const partnerId = await findPartner(partner.rut);

      let newPartnerId;
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
            payment_contact = newPartner;
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
            business_contact = newPartner;
            child_ids.push(business_contact);
          }
        }

        let property_payment_term_id: number;
        property_payment_term_id = paymentTermMapper(partner.type_payment_id);

        let state_id: number | boolean;
        state_id = mapRegionToStateId(region);

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
          child_ids: child_ids,
        };
        newPartnerId = await createPartner(partnerData);
        console.log(newPartnerId);
      }

      // Find all products for this DTE
      const dteProducts = products.filter(
        (product) => product.dte_folio === dte.folio
      );

      // Prepare invoice lines from the products
      const invoiceLines: InvoiceLine[] = await Promise.all(
        dteProducts.map(async (product) => {
          // First try to find the product by code
          let productId = await findProductByCode(product.code);
          console.log(`Product ID: ${productId}`);

          // If product doesn't exist, create it
          if (!productId) {
            console.log(
              `Product with code ${product.code} not found, creating...`
            );
            productId = await createProduct({
              name: product.name,
              default_code: product.code,
              list_price: product.price,
              standard_price: product.unit_cost,
              description_sale: product.description,
              is_storable: true,
            });
            console.log(`Created product with ID: ${productId}`);
          } else {
            console.log(`Found existing product with ID: ${productId}`);
          }

          // Create the invoice line with proper typing
          const line: InvoiceLine = [
            0, // Command to create a new record
            0, // Let Odoo assign the ID
            {
              product_id: productId,
              quantity: product.quantity,
              price_unit: product.price,
              name: product.description || product.name,
              ...(product.discount && { discount: product.discount }),
            },
          ];

          return line;
        })
      );

      let invoicePaymentType: number;
      invoicePaymentType = paymentTermMapper(dte.type_payment_id);

      let dteChild: DteChild | undefined; // Initialize as undefined
      // console.log(dte.seller_name)
      // console.log(dte.contact)
      // console.log(dte.comment)
      let invoiceRef = `${dte.folio} - ${dte.seller_name}`

      if (moveType === 'out_refund') {
        const dteChildFound = dteChildren.find((dteChild) => dteChild.dte_folio == dte.folio);
        if (!dteChildFound) {
          throw new Error("DTE child not found");
        }
        dteChild = dteChildFound;
        // invoiceRef = `${dte.folio} - ${dte.user_name}`
        invoiceRef = `${dteChild.folio} - ${dte.user_name}`
      }

      const invoiceData: InvoiceData = {
        l10n_latam_document_number: `${dte.folio}`,
        partner_id: partnerId ? partnerId : newPartnerId,
        move_type: moveType,
        invoice_date: dte.start_date,
        invoice_line_ids: invoiceLines,
        invoice_date_due: dte.end_date,
        invoice_payment_term_id: invoicePaymentType,
        invoice_user_id: 2,
        ref: invoiceRef,
        narration: `Contacto: ${dte.contact} | Nota: ${dte.comment}`,
        // journal_id: 1, // customer invoices anfisbena
        journal_id: 17, // facturas relbase integramundo
      };
      console.log(invoiceData);

      // // If it's a credit note and you have a reference to the original invoice
      // if (isCreditNote && dteChild && dteChild.folio) { // Added null check for dteChild
      //   const originalInvoiceId = await findInvoice(dteChild.folio);
      //   if (originalInvoiceId) {
      //     invoiceData.reversed_entry_id = originalInvoiceId;
      //   }
      // }

      const newInvoice = await createInvoice(invoiceData);
      // console.log(newInvoice);

      // if (dte.status === 'cancel') {
      //   await cancelInvoice(newInvoice)
      //   console.log(`Cancelled invoice with ID: ${newInvoice}`);
      // }

      // First confirm the invoice
      await confirmInvoice(newInvoice);
      console.log(`Confirmed invoice with ID: ${newInvoice}`);

      if (dte.status === 'paid') {
        const paymentData: PaymentData = {
          payment_method_id: 1, // manual payment
          payment_type: 'inbound',
          partner_id: partnerId ? partnerId : newPartnerId,
          partner_type: 'customer',
          amount: dte.amount_total,
          // currency_id: 45, // CLP anfisbena
          currency_id: 44, // CLP integramundo
          journal_id: 6, // Bank // 10 MercadoPago
          date: dte.updated_at, // dte is updated after payment, there is no proper payment date returned
        }
        console.log(paymentData);

        // Process payment and reconcile in one step
        const paymentId = await processPaymentAndReconcile(paymentData, newInvoice);

        // Verify the invoice is now paid
        const isPaid = await isInvoicePaid(newInvoice);
        console.log(`Invoice ${newInvoice} payment status: ${isPaid ? 'PAID' : 'NOT PAID'}`);

        if (!isPaid) {
          console.warn(`Warning: Invoice ${newInvoice} may not be fully reconciled`);
        }
      }

    } catch (error) {
      console.error(error);
    }
  }
}


