export interface ProductType {
  name: string;
  default_code: string;
  barcode?: string;
  list_price: number;
  standard_price: number;
  type?: string;
  categ_id?: number;
  uom_id?: number;
  uom_po_id?: number;
  description_sale?: string;
  description_purchase?: string;
  tax_ids?: number[];
  is_storable: boolean;
}
