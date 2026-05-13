/* eslint-disable */
import { apiUrl } from "../config/config";
import authHeader from "../helpers/auth-header";
import handleResponse from "../helpers/handleResponse";

export const invoiceService = {
  invoiceTable:  async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
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
    const response = await fetch (`${apiUrl}/invoice/invoice-table`, requestOptions);
    return handleResponse(response)
  },
  invoiceTotalsByAgencyMonthly: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user,
        pageIndex,
        pageSize,
        sortBy,
        filters,
        isExcel, }),
    };
    const response = await fetch(`${apiUrl}/invoice/invoice-totals-by-agency-monthly`, requestOptions);
    return handleResponse(response);
  },
  updateInvoice: async (id, updateFields) => {
    const requestOptions = {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(updateFields),
    };
    const response = await fetch(`${apiUrl}/invoice/update/${id}`, requestOptions);
    return handleResponse(response);
  },
  getInvoiceById: async (id) => {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };
  const response = await fetch(`${apiUrl}/invoice/get/${id}`, requestOptions);
  return handleResponse(response);
},
anulateInvoice: async (id, comment) => {

  const requestOptions = {
    method: "PATCH",
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  };
  const response = await fetch(`${apiUrl}/invoice/anulate/${id}`, requestOptions);
  return handleResponse(response);
},
invoiceStatsByCompanyBranch: async (user, filters) => {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ user, filters }),
  };
  const response = await fetch(`${apiUrl}/invoice/invoice-stats-by-company-branch`, requestOptions);
  return handleResponse(response);
},
paymentFiscalMethodsStatsByCompanyBranch: async (user, filters) => {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ user, filters }),
  };
  const response = await fetch(`${apiUrl}/sales-special/payment-fiscal-methods-stats-by-company-branch`, requestOptions);
  return handleResponse(response);
}
}

