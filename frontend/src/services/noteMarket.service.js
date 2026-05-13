/* eslint-disable */
import { apiUrl } from "../config/config";
import authHeader from "../helpers/auth-header";
import handleResponse from "../helpers/handleResponse";

export const noteMarketService = {
  //Obtener tabla de notas de entrega
  noteMarketTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
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
    const response = await fetch(`${apiUrl}/note-market/table-note-market`, requestOptions);
    return handleResponse(response);
  },

  //Obtener una nota de entrega por ID
  getNoteMarket: async (id) => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(`${apiUrl}/note-market/get-note-market/${id}`, requestOptions);
    return handleResponse(response);
  },

  //Actualizar una nota de entrega
  updateNoteMarket: async (id, data) => {
    const requestOptions = {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(`${apiUrl}/note-market/update-note-market/${id}`, requestOptions);
    return handleResponse(response);
  },
};

