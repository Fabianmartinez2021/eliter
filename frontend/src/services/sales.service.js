/* eslint-disable */
import { apiUrl } from "../config/config";
import authHeader from "../helpers/auth-header";
import handleResponse from "../helpers/handleResponse";

export const salesService = {
  //ventas generales
  salesTable: async () => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(`${apiUrl}/sales/table-sale`, requestOptions);
    return handleResponse(response);
  },

  //ventas por usuario
  salesTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
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
    const response = await fetch(`${apiUrl}/sales/sales-table`, requestOptions);
    return handleResponse(response);
  },

  //ventas del dia
  salesTableDaily: async (user) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    };
    const response = await fetch(
      `${apiUrl}/sales/table-sale-daily`,
      requestOptions
    );
    return handleResponse(response);
  },

  salesCreate: async (sale) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    };
    const response = await fetch(`${apiUrl}/sales/create-sale`, requestOptions);
    return handleResponse(response);
  },

  salesDeleteAdmin: async (id) => {
    const requestOptions = {
      method: "DELETE",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(
      `${apiUrl}/sales/admin-delete-sale/${id}`,
      requestOptions
    );
    return handleResponse(response);
  },

  salesAdminUpdate: async (id, body) => {
    const requestOptions = {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
    const response = await fetch(
      `${apiUrl}/sales/admin-update-sale/${id}`,
      requestOptions
    );
    return handleResponse(response);
  },

  salesOffline: async (sales) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(sales),
    };
    const response = await fetch(
      `${apiUrl}/sales/process-sales-offline`,
      requestOptions
    );
    return handleResponse(response);
  },

  salesUpdate: async (id, sale) => {
    const requestOptions = {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    };
    const response = await fetch(
      `${apiUrl}/sales/update-sale/${id}`,
      requestOptions
    );
    await handleResponse(response);
    return sale;
  },

  salesGet: async (id) => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(
      `${apiUrl}/sales/get-sale/${id}`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesList: async () => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(`${apiUrl}/sales/get-sales`, requestOptions);
    return await handleResponse(response);
  },

  salesDataForm: async (id) => {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };
    const response = await fetch(
      `${apiUrl}/sales/get-sales-data/${id}`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesPaymentMethods: async (
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
      `${apiUrl}/sales/report-payment-methods`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesPaymentMethodsClose: async (data) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(
      `${apiUrl}/sales/report-payment-methods-close`,
      requestOptions
    );

    return await handleResponse(response);
  },

  salesPaymentMethodsHistory: async (
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
      `${apiUrl}/sales/report-payment-methods-history`,
      requestOptions
    );
    const data = await handleResponse(response);
    return data;
  },

  salesPaymentMethodsChart: async (user, filters) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user, filters }),
    };
    const response = await fetch(
      `${apiUrl}/sales/report-payment-methods-chart`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesPaymentMethodsGeneralReportHistory: async (
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
      body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel }),
    };
    const response = await fetch(
      `${apiUrl}/sales/report-payment-methods-general-report-history`,
      requestOptions
    );

    const data = await handleResponse(response);

    return data;
  },

  salesPaymentMethodsDetail: async (sale, controller) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(sale),
      signal: controller.signal,
    };
    const response = await fetch(
      `${apiUrl}/sales/detail-payment-methods`,
      requestOptions
    );
    return await handleResponse(response);
  },

  salesCommissionReports: async (
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
      `${apiUrl}/sales/commission-reports`,
      requestOptions
    );
    return await handleResponse(response);
  },

  telesalesCommissionReports: async (
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
      `${apiUrl}/sales/telesales-commission-reports`,
      requestOptions
    );
    return await handleResponse(response);
  },

  //ventas por usuario
  salesCombosChart: async (user, pageIndex, pageSize, sortBy, filters) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters }),
    };
    const response = await fetch(
      `${apiUrl}/sales/sales-combos-chart`,
      requestOptions
    );
    return handleResponse(response);
  },

  //gráfico de ventas por tipo (detal, mayor, abono, credito)
  salesChart: async (user, filters) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ user, filters }),
    };
    const response = await fetch(`${apiUrl}/sales/sales-chart/`, requestOptions);
    return handleResponse(response);
  },

  //Obtener total semanal en tiempo real
  getWeeklyTotalRealtime: async (data) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(`${apiUrl}/sales/weekly-total-realtime/`, requestOptions);
    return handleResponse(response);
  },

  //Obtener total semanal de ventas al mayor en tiempo real
  getWeeklyWholesalesGoalRealtime: async (data) => {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(`${apiUrl}/sales/weekly-wholesales-goal-realtime/`, requestOptions);
    return handleResponse(response);
  },
};
