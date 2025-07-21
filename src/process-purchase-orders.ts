import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { PurchaseOrder, PurchaseOrderDetail } from "./types/purchaseOrder";
import { findPartner } from "./services/partner.ts";
import { sleep } from "./utils/sleep.ts";
import { paymentTermMapper } from "./utils/purchaseOrderPaymentTermMapper.ts";
import type { CreatePurchaseOrderType, PurchaseOrderLine } from "./services/interfaces/purchaseOrder.ts";
import { findProductByCode } from "./services/product.ts";
import { createPurchaseOrder } from "./services/purchaseOrders.ts";
import { convertDateFormat } from "./utils/convertDateFormat.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../data/ordenes-de-compra/ordenes-compra.xls");
const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });

// Read the purchase orders sheet
const purchaseOrdersSheet = workbook.Sheets["Órdenes de compra"];

if (purchaseOrdersSheet && purchaseOrdersSheet["!ref"]) {
    const purchaseOrdersRange = XLSX.utils.decode_range(purchaseOrdersSheet["!ref"]);
    purchaseOrdersRange.s.r = 5; // Start from row 6 (0-indexed)
    purchaseOrdersSheet["!ref"] = XLSX.utils.encode_range(purchaseOrdersRange);

    const jsonPurchaseOrdersSheet: unknown[] = XLSX.utils.sheet_to_json(purchaseOrdersSheet);
    const purchaseOrders: PurchaseOrder[] = jsonPurchaseOrdersSheet as PurchaseOrder[];

    // Read the details sheet
    const detailsSheet = workbook.Sheets["Detalle"];

    if (detailsSheet) {
        const jsonDetailsSheet: unknown[] = XLSX.utils.sheet_to_json(detailsSheet);
        const purchaseOrderDetails: PurchaseOrderDetail[] = jsonDetailsSheet as PurchaseOrderDetail[];

        // Map to store purchase orders with their details
        const purchaseOrdersWithDetails = new Map<number, PurchaseOrder & { details: PurchaseOrderDetail[] }>();

        // Initialize the map with purchase orders
        purchaseOrders.forEach((purchaseOrder) => {
            purchaseOrdersWithDetails.set(purchaseOrder["Nº OC"], { ...purchaseOrder, details: [] });
        });

        // Associate details with their respective purchase orders
        purchaseOrderDetails.forEach((detail) => {
            const purchaseOrder = purchaseOrdersWithDetails.get(detail["Nº OC"]);
            if (purchaseOrder) {
                purchaseOrder.details.push(detail);
            }
        });

        // Use for...of loop to handle asynchronous operations sequentially
        for (const purchaseOrder of purchaseOrdersWithDetails.values()) {
            try {
                console.log(`Purchase Order: ${purchaseOrder["Nº OC"]}`);
                console.log("Details:", purchaseOrder.details);

                const partnerId = await findPartner(purchaseOrder.RUT);
                if (!partnerId) {
                    console.error(`Partner with RUT: ${purchaseOrder.RUT} not found, skipping purchase order.`);
                } else {
                    console.log(`Partner with RUT ${purchaseOrder.RUT} found with id ${partnerId}`);

                    const paymentTermId = paymentTermMapper(purchaseOrder["Forma de pago"])

                    let orderLines: PurchaseOrderLine[] = [];
                    for (const purchaseOrderDetail of purchaseOrder.details) {
                        const productId = await findProductByCode(purchaseOrderDetail.Código);

                        if (!productId) {
                            console.error(
                                `Product with code ${purchaseOrderDetail.Código} not found.`
                            );

                            break
                        } else {
                            console.log(
                                `Product with code ${purchaseOrderDetail.Código} found with ID: ${productId}.`
                            );

                            const orderLine: PurchaseOrderLine = [0, 0, {
                                product_id: productId,
                                product_qty: purchaseOrderDetail.Cantidad,
                                price_unit: purchaseOrderDetail.Precio
                            }]

                            orderLines.push(orderLine)
                        }
                    }

                    if (orderLines.length === purchaseOrder.details.length) {
                        const purchaseOrderData: CreatePurchaseOrderType = {
                            partner_id: partnerId,
                            date_order: convertDateFormat(purchaseOrder["Fecha emisión"]),
                            date_planned: convertDateFormat(purchaseOrder["Fecha entrega"]),
                            user_id: 2,
                            origin: `${purchaseOrder["Nº OC"]}-${purchaseOrder["Realizada por"]}`,
                            payment_term_id: paymentTermId,
                            order_line: orderLines,
                        }

                        console.log(purchaseOrderData)

                        const purchaseOrderId = await createPurchaseOrder(purchaseOrderData)
                        console.log(`Created Purchase Order with ID: ${purchaseOrderId}`)

                        await sleep(500); // Wait for 2 seconds before the next iteration
                    } else {
                        console.error(`Couldn't find a product in the order details.`)
                    }

                }
            } catch (error) {
                console.error(error);
            }
        }
    } else {
        console.error("The 'Detalle' sheet is missing.");
    }
} else {
    console.error("The specified sheet or range reference is missing.");
}
