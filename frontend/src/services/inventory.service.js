/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const inventoryService = {

    inventoryTable: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        };
        const response = await fetch(`${apiUrl}/inventory/table-inventory`, requestOptions);
        return handleResponse(response);
            
    },

    inventoryReportSales: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/report-sales`, requestOptions);
        return handleResponse(response);
            
    },

    inventoryReportOffers: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/report-offers`, requestOptions);
        return handleResponse(response);
            
    },

    //reporte de inventarios
    inventoryTableReport: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/report-inventories`, requestOptions);

        return handleResponse(response);
    },

    //reporte de balance
    balanceTableReport: async (user, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, filters })
        };
        const response = await fetch(`${apiUrl}/inventory/report-balance`, requestOptions);
        return handleResponse(response);
    },

    //reporte de inventarios sin salidas
    inventoryTableReportPlus: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/report-inventories-plus`, requestOptions);
        return handleResponse(response);
    },

    //reporte de inventarios resumido por agencia
    inventoryTableReportSummaryAgency: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/report-inventories-summary-agency/`, requestOptions);
        return handleResponse(response);
    },

    //reporte de inventarios diario
    inventoryTableReportDaily: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        };
        const response = await fetch(`${apiUrl}/inventory/report-inventories-daily`, requestOptions);
        return handleResponse(response);
    },

    inventoryTableHistory: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/table-history`, requestOptions);
        return handleResponse(response);
            
    },

    inventoryCreate: async (inventory) => {

        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(inventory)
        };
        const response = await fetch(`${apiUrl}/inventory/create-inventory`, requestOptions);
        return handleResponse(response);
    },

    inventoryUpdate: async (id, inventory) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(inventory)
        };
        const response = await fetch(`${apiUrl}/inventory/update-inventory/${id}`, requestOptions);
        await handleResponse(response);
        return inventory;
    },

    //Resetear producto
    inventoryReset: async (id, inventory) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(inventory)
        };
        const response = await fetch(`${apiUrl}/inventory/reset-inventory/${id}`, requestOptions);
        await handleResponse(response);
        return inventory;
    },

    inventoryReadjustment: async (id, inventory) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(inventory)
        };
        const response = await fetch(`${apiUrl}/inventory/readjustment-inventory/${id}`, requestOptions);
        await handleResponse(response);
        return inventory;
    },

    inventoryGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/inventory/get-inventory/${id}`, requestOptions);
        return await handleResponse(response);
    },

    inventoryList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/inventory/get-inventories`, requestOptions);
        return await handleResponse(response);
    },

    //Detalle de mermas
    inventoryDetailDecreases: async (detail, controller) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(detail),
            signal: controller.signal
        };
        const response = await fetch(`${apiUrl}/inventory/detail-decrease`, requestOptions);
        return await handleResponse(response);
    },

    //Detalle de salidas
    inventoryDetailDepartures: async (detail, controller) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(detail),
            signal: controller.signal
        };
        const response = await fetch(`${apiUrl}/inventory/detail-departures`, requestOptions);
        return await handleResponse(response);
    },

    //Detalle de recortes
    inventoryDetailCut: async (detail, controller) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(detail),
            signal: controller.signal
        };
        const response = await fetch(`${apiUrl}/inventory/detail-cut`, requestOptions);
        return await handleResponse(response);
    },

    inventoryTableAdjustmentHistory: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/table-history-adjustment`, requestOptions);
        return handleResponse(response);
            
    },

    inventoryEntryTableHistory: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory/table-entry-history`, requestOptions);
        return handleResponse(response);
            
    },

}

