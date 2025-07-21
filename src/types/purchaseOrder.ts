export interface PurchaseOrder {
    RUT: string;
    Proveedor: string;
    "Nº OC": number;
    "Fecha emisión": string;
    "Fecha entrega": string;
    "Forma de pago": string;
    "Observaciones pago": string;
    Moneda: string;
    "Orden Internacional": string;
    Observaciones: string;
    Descuento: number | null;
    Exento: number;
    Neto: number;
    IVA: number;
    "Impuesto adicional": number;
    Total: number;
    Estado: string;
    "Folios de compra asociados": string;
    "Recepciones asociadas (fechas ingreso stock)": string;
    "Realizada por": string;
}

export interface PurchaseOrderDetail {
    RUT: string;
    Proveedor: string;
    "Nº OC": number;
    Código: string;
    Producto: string;
    Descripción: string;
    Cantidad: number;
    Pendiente: number;
    Precio: number;
    Descuento: number | null;
    Recargo: number | null;
    "Tasa impuesto adicional": string;
    "Afecto/Exento": string;
}