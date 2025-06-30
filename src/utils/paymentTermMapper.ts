// src/services/paymentTermMapper.ts
export function paymentTermMapper(paymentTermId: number | null): number {
  switch (paymentTermId) {
    case 17879:
      return 1; // pago inmediato
    case 21644:
      return 11; // Cedido a Factoring anfisbena
    case 3253:
      return 12; // Cheque 30 días anfisbena
    case 14881:
      return 13; // Cheque al día Contra entrega
    case 3254:
      return 14; // Crédito 30 días
    case 14777:
      return 15; // Crédito 45 días
    case 14778:
      return 16; // Crédito 60 días
    case 15409:
      return 17; // Crédito 90 días
    case 16217:
      return 18; // Crédito 15 días
    // case 3249:
    // case 15711:
    // case 3256:
    // case 14882:
    // case 3251:
    // case 3250:
    // case 3252:
    // case 3255:
    default:
      return 1;
  }
}

// export function paymentTermMapper(paymentTermId: number | null): number {
//   switch (paymentTermId) {
//     case 17879:
//       return 1; // pago inmediato
//     case 21644:
//       // return 11; // Cedido a Factoring anfisbena
//       return 12; // Cedido a Factoring integramundo
//     case 3253:
//       // return 12; // Cheque 30 días anfisbena
//       return 13; // Cheque 30 días integramundo
//     case 14881:
//       // return 13; // Cheque al día Contra entrega
//       return 14; // Cheque al día Contra entrega
//     case 3254:
//       // return 14; // Crédito 30 días
//       return 15; // Crédito 30 días
//     case 14777:
//       // return 15; // Crédito 45 días
//       return 16; // Crédito 45 días
//     case 14778:
//       // return 16; // Crédito 60 días
//       return 17; // Crédito 60 días
//     case 15409:
//       // return 17; // Crédito 90 días
//       return 18; // Crédito 90 días
//     case 16217:
//       // return 18; // Crédito 15 días
//       return 19; // Crédito 15 días
//     // case 3249:
//     // case 15711:
//     // case 3256:
//     // case 14882:
//     // case 3251:
//     // case 3250:
//     // case 3252:
//     // case 3255:
//     default:
//       return 1;
//   }
// }
