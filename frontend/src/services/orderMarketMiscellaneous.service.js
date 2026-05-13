/* eslint-disable */
import { apiUrl } from "../config/config";
import authHeader from "../helpers/auth-header";
import handleResponse from "../helpers/handleResponse";

export const orderMarketMiscellaneousService = {
  //Obtener tabla de notas de entrega de suministros
  orderMarketMiscellaneousTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        pageIndex,
        pageSize,
        sortBy,
        filters,
        isExcel,
      }),
    };
    const response = await fetch(`${apiUrl}/order-market-miscellaneous/table-order-market-miscellaneous`, requestOptions);
    return handleResponse(response);
  },

  //Obtener una nota de suministro por ID
  getOrderMarketMiscellaneous: async (id) => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(`${apiUrl}/order-market-miscellaneous/get-order-market-miscellaneous/${id}`, requestOptions);
    return handleResponse(response);
  },

  //Actualizar una nota de suministro
  updateOrderMarketMiscellaneous: async (id, data) => {
    const requestOptions = {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(`${apiUrl}/order-market-miscellaneous/update-order-market-miscellaneous/${id}`, requestOptions);
    return handleResponse(response);
  },
};
