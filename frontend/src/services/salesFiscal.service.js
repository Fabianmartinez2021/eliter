/* eslint-disable */
import { apiUrl } from "../config/config";
import authHeader from "../helpers/auth-header";
import handleResponse from "../helpers/handleResponse";

export const salesFiscalService = {
  //ventas generales
  salesFiscalTable: async () => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(`${apiUrl}/sales-special/table-sale-special`, requestOptions);
    return handleResponse(response);
  },

  //ventas por usuario
  salesFiscalTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
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
    const response = await fetch(`${apiUrl}/sales-special/sales-special-table`, requestOptions);
    return handleResponse(response);
  },

  //ventas del dia
  salesFiscalTableDaily: async (user) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/table-sale-special-daily`,
      requestOptions
    );
    return handleResponse(response);
  },

  salesFiscalCreate: async (saleFiscal) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(saleFiscal),
    };
    const response = await fetch(`${apiUrl}/sales-special/create-sale-special`, requestOptions);
    
    
    return handleResponse(response);
  },

  salesFiscalOffline: async (salesFiscal) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(salesFiscal),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/process-sales-special-offline`,
      requestOptions
    );
    return handleResponse(response);
  },

  salesFiscalUpdate: async (id, sale) => {
    const requestOptions = {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/update-sale-special/${id}`,
      requestOptions
    );
    await handleResponse(response);
    return sale;
  },

  salesFiscalGet: async (id) => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(
      `${apiUrl}/sales-special/get-sale-special/${id}`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesFiscalList: async () => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(`${apiUrl}/sales-special/get-sales-special`, requestOptions);
    return await handleResponse(response);
  },

  salesFiscalDataForm: async (id) => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(
      `${apiUrl}/sales-special/get-sales-special-data/${id}`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesFiscalPaymentMethods: async (
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) => {
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
    const response = await fetch(
      `${apiUrl}/sales-special/report-special-payment-methods`,
      requestOptions
    );

    const data = await handleResponse(response);

    return data;
  },

  salesFiscalPaymentMethodsClose: async (data) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/report-special-payment-methods-close`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesFiscalPaymentMethodsHistory: async (
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) => {
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

    const response = await fetch(
      `${apiUrl}/sales-special/report-special-payment-methods-history`,
      requestOptions
    );
    const data = await handleResponse(response);
    return data;
  },

  salesFiscalPaymentMethodsChart: async (user, filters) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user, filters }),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/report-special-payment-methods-chart`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesFiscalPaymentMethodsGeneralReportHistory: async (
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel}),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/report-special-payment-methods-general-report-history`,
      requestOptions
    );

    const data = await handleResponse(response);
    
    return data;
  },

  salesFiscalPaymentMethodsDetail: async (sale, controller) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(sale),
      signal: controller.signal,
    };
    const response = await fetch(
      `${apiUrl}/sales-special/detail-special-payment-methods`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesFiscalCommissionReports: async (
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) => {
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
    const response = await fetch(
      `${apiUrl}/sales-special/commission-reports-special`,
      requestOptions
    );
    return await handleResponse(response);
  },

  telesalesFiscalCommissionReports: async (
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) => {
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
    const response = await fetch(
      `${apiUrl}/sales-special/telesales-special-commission-reports`,
      requestOptions
    );
    return await handleResponse(response);
  },

  //ventas por usuario
  salesFiscalCombosChart: async (user, pageIndex, pageSize, sortBy, filters) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters }),
    };
    const response = await fetch(
      `${apiUrl}/sales-special/sales-special-combos-chart`,
      requestOptions
    );
    return handleResponse(response);
  },

  //ventas especiales por compañia

  invoiceTotalsByCompany: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
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
  
    const response = await fetch(`${apiUrl}/sales-special/invoice-totals-by-company`, requestOptions);
    return handleResponse(response);
  },
};
