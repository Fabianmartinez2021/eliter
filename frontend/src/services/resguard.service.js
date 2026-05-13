/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const resguardService = {

    // Ingreso de dinero a caja
    resguardAdd: async (user, resguard) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, resguard})
        };
        const response = await fetch(`${apiUrl}/resguard/addition`, requestOptions);
        return handleResponse(response);
    },

    resguardWithdrawal: async (user, resguard) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, resguard})
        };
        const response = await fetch(`${apiUrl}/resguard/withdrawal`, requestOptions);
        return handleResponse(response);
    },

    resguardConfirmWithdrawal: async (user, id) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
        const response = await fetch(`${apiUrl}/resguard/confirm-withdrawal/${id}`, requestOptions);
        return handleResponse(response);
    },

    resguardConfirmMultipleWithdrawals: async (user, ids) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, ids }) // Enviar un array de IDs
        };
        const response = await fetch(`${apiUrl}/resguard/confirm-multiple-withdrawals`, requestOptions);
        return handleResponse(response);
    },

    getResguardOperation: async (user, id) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
        const response = await fetch(`${apiUrl}/resguard/get-operation/${id}`, requestOptions);

        return await handleResponse(response);
    },

    //Reporte de caja
    resguardReport: async (user, filters, isExcel) => {

        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/resguard/resguard-report`, requestOptions);
        return handleResponse(response); 
    },


    // Historial de resguardo
    resguardDataTableHistory: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/resguard/table-history`, requestOptions);
        return await handleResponse(response);
    },

    // Historial de resguardo
    resguardWithdrawalsTableHistory: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/resguard/withdrawal-table-history`, requestOptions);
        return await handleResponse(response);
    },
}

