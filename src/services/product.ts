// src/services/product.ts
import { makeAuthenticatedRequest } from "./auth.ts";
import type { ProductType } from "./interfaces/product.ts";

export async function findProductByCode(code: string): Promise<number | null> {
  try {
    const searchData = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: "product.product",
        method: "search",
        args: [["|", ["default_code", "=", code], ["barcode", "=", code]]],
        kwargs: {},
      },
    };

    const result = await makeAuthenticatedRequest(searchData);

    if (!result.result) {
      console.log("No result property found");
      return null;
    }

    if (!Array.isArray(result.result)) {
      console.log("Result is not an array:", typeof result.result);
      return null;
    }

    if (result.result.length === 0) {
      console.log("No products found with code:", code);
      return null;
    }

    return result.result[0];
  } catch (error) {
    console.error("Error finding product by code:", error);
    throw error;
  }
}

export async function createProduct(product: ProductType): Promise<number> {
  try {
    const createData = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: "product.product",
        method: "create",
        args: [product],
        kwargs: {},
      },
    };

    const result = await makeAuthenticatedRequest(createData);
    return result.result;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function getProductDetails(productId: number): Promise<any> {
  try {
    const readData = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: "product.product",
        method: "read",
        args: [
          productId,
          [
            "name",
            "default_code",
            "barcode",
            "list_price",
            "standard_price",
            "description_sale",
            "description_purchase",
          ],
        ],
        kwargs: {},
      },
    };

    const result = await makeAuthenticatedRequest(readData);
    return result.result;
  } catch (error) {
    console.error("Error getting product details:", error);
    throw error;
  }
}

export async function updateProduct(
  productId: number,
  product: Partial<ProductType>
): Promise<boolean> {
  try {
    const updateData = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: "product.product",
        method: "write",
        args: [productId, product],
        kwargs: {},
      },
    };

    const result = await makeAuthenticatedRequest(updateData);
    return result.result;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteProduct(productId: number): Promise<boolean> {
  try {
    const deleteData = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: "product.product",
        method: "unlink",
        args: [productId],
        kwargs: {},
      },
    };

    const result = await makeAuthenticatedRequest(deleteData);
    return result.result;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}
