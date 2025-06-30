export function getMoveType(dteType: number): 'out_invoice' | 'out_refund' {
    switch (dteType) {
        case 33: // Factura electrónica
        case 34: // Factura no afecta o exenta electrónica
            return 'out_invoice';
        case 61: // Nota de crédito electrónica
            return 'out_refund';
        default:
            throw new Error(`Unsupported DTE type: ${dteType}`);
    }
}