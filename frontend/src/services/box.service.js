/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const boxService = {

    boxOpening: async (box) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(box)
        };
        const response = await fetch(`${apiUrl}/box/box-opening`, requestOptions);
        return handleResponse(response);
    },

    boxWithdraw: async (box) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(box)
        };
        const response = await fetch(`${apiUrl}/box/box-withdrawal`, requestOptions);
        return handleResponse(response);
    },

    //Reporte de caja
    boxTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/box/box-report`, requestOptions);
        return handleResponse(response); 
    },

    //Detalle de caja
    boxDetails: async (sale, controller) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(sale),
            signal: controller.signal
        };
        const response = await fetch(`${apiUrl}/box/box-details`, requestOptions);
        return await handleResponse(response);
    },

    //Reporte de caja para cerrar
    boxToCloseTable: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/box/box-to-close-report`, requestOptions);
        return handleResponse(response); 
    },

    //Cierre de caja
    boxClose: async (box) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(box)
        };
        const response = await fetch(`${apiUrl}/box/box-close`, requestOptions);
        return handleResponse(response);
    },

    //Reporte de cierres de caja
    boxCloseTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/box/box-close-report`, requestOptions);
        return handleResponse(response); 
    },

    boxCorrection: async (box) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(box)
        };
        const response = await fetch(`${apiUrl}/box/box-correction`, requestOptions);
        return handleResponse(response);
    },
    // Historial de caja
    boxDataTableHistory: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/box/table-history`, requestOptions);
        return await handleResponse(response);
    },

    // Ingreso de dinero a caja
    boxAdd: async (box) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(box)
        };
        const response = await fetch(`${apiUrl}/box/box-addition`, requestOptions);
        return handleResponse(response);
    },
}

