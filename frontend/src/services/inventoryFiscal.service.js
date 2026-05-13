/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const inventoryFiscalService = {

    inventoryFiscalTable: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        };
        const response = await fetch(`${apiUrl}/inventory-special/table-inventory-special`, requestOptions);
        return handleResponse(response);
            
    },

    inventoryFiscalReportSales: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        
        const response = await fetch(`${apiUrl}/inventory-special/report-sales-special`, requestOptions);
       
        return handleResponse(response);
            
    },

    //reporte de inventarios
    inventoryFiscalTableReport: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/inventory-special/report-inventories-special`, requestOptions);
        return handleResponse(response);
    },

    // //reporte de balance
    // balanceFiscalTableReport: async (user, filters) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ user, filters })
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/report-balance-fiscal`, requestOptions);
    //     return handleResponse(response);
    // },

    // //reporte de inventarios sin salidas
    // inventoryFiscalTableReportPlus: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/report-inventories-plus-fiscal`, requestOptions);
    //     return handleResponse(response);
    // },

    // //reporte de inventarios diario
    // inventoryFiscalTableReportDaily: async (user) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ user })
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/report-inventories-daily-fiscal`, requestOptions);
    //     return handleResponse(response);
    // },

    inventoryFiscalTableHistory : async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel }),
        };
        
        try {
            const response = await fetch(`${apiUrl}/inventory-special/table-history-special`, requestOptions);
           
            const data = await handleResponse(response);
    
            return data;
        } catch (error) {
            console.error("Error al obtener los datos:", error);
            throw error;
        }
    },
    inventoryFiscalCreate: async (inventoryFiscal) => {
        
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(inventoryFiscal)
        };
        const response = await fetch(`${apiUrl}/inventory-special/create-inventory-special`, requestOptions);
        
        return handleResponse(response);
    },

    // inventoryFiscalUpdate: async (id, inventory) => {
    //     const requestOptions = {
    //         method: 'PUT',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify(inventory)
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/update-inventory-fiscal/${id}`, requestOptions);
    //     await handleResponse(response);
    //     return inventory;
    // },

    // //Resetear producto
    // inventoryFiscalReset: async (id, inventory) => {
    //     const requestOptions = {
    //         method: 'PUT',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify(inventory)
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/reset-inventory-fiscal/${id}`, requestOptions);
    //     await handleResponse(response);
    //     return inventory;
    // },

    // inventoryFiscalReadjustment: async (id, inventory) => {
    //     const requestOptions = {
    //         method: 'PUT',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify(inventory)
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/readjustment-inventory-fiscal/${id}`, requestOptions);
    //     await handleResponse(response);
    //     return inventory;
    // },

    inventoryFiscalGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/inventory-special/get-inventory-special/${id}`, requestOptions);
        return await handleResponse(response);
    },

    inventoryFiscalList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/inventory-special/get-inventories-special`, requestOptions);
        return await handleResponse(response);
    },

    // //Detalle de mermas
    // inventoryFiscalDetailDecreases: async (detail, controller) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify(detail),
    //         signal: controller.signal
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/detail-decrease-fiscal`, requestOptions);
    //     return await handleResponse(response);
    // },

    // //Detalle de salidas
    // inventoryFiscalDetailDepartures: async (detail, controller) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify(detail),
    //         signal: controller.signal
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/detail-departures-fiscal`, requestOptions);
    //     return await handleResponse(response);
    // },

    // //Detalle de recortes
    // inventoryFiscalDetailCut: async (detail, controller) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify(detail),
    //         signal: controller.signal
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/detail-cut-fiscal`, requestOptions);
    //     return await handleResponse(response);
    // },

    // inventoryFiscalTableAdjustmentHistory: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/table-history-adjustment-fiscal`, requestOptions);
    //     return handleResponse(response);
            
    // },

    // inventoryFiscalEntryTableHistory: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
    //     const requestOptions = {
    //         method: 'POST',
    //         headers: { ... authHeader(), 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
    //     };
    //     const response = await fetch(`${apiUrl}/inventory-fiscal/table-entry-history-fiscal`, requestOptions);
    //     return handleResponse(response);
            
    // },

}

