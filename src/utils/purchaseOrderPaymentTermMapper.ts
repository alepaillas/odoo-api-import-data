// src/services/paymentTermMapper.ts

// FOR INTEGRAMUNDO
export function paymentTermMapper(paymentTermString: string): number {
  switch (paymentTermString) {
    case "Al contado":
      return 1; // pago inmediato
    case "Transferencia":
      return 1; // pago inmediato
    case "Pagado con Transferencia":
      return 1; // pago inmediato
    case "Cedido a Factoring":
      return 12; // Cedido a Factoring
    case "Cheque 30 dias":
      return 13; // Cheque 30 días
    case "Cheque al día Contra entrega":
      return 14; // Cheque al día Contra entrega
    case "Crédito 30 días":
      return 15; // Crédito 30 días
    case "Crédito 45 días":
      return 16; // Crédito 45 días
    case "Crédito 60 días":
      return 17; // Crédito 60 días
    case "Crédito 90 días":
      return 18; // Crédito 90 días
    case "Crédito 15 días":
      return 19; // Crédito 15 días
    default:
      return 1;
  }
}