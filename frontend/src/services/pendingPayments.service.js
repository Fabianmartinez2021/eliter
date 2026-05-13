/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const pendingPaymentsService = {

    pendingPaymentsTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/pending-payments/table-pending-payments`, requestOptions);
        return handleResponse(response); 
    },

    pendingPaymentsCreate: async (pendingPayments) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingPayments)
        };
        const response = await fetch(`${apiUrl}/pending-payments/create-pending-payments`, requestOptions);
        return handleResponse(response);
    },

    pendingPaymentsUpdate: async (id, pendingPayments) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingPayments)
        };
    
        const response = await fetch(`${apiUrl}/pending-payments/update-pending-payments/${id}`, requestOptions);
        return handleResponse(response);
    },

    pendingPaymentsAdminUpdate: async (id, body) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };
        const response = await fetch(`${apiUrl}/pending-payments/admin-update-pending/${id}`, requestOptions);
        return handleResponse(response);
    },

    pendingPaymentsAdminDeleteUnpaid: async (id) => {
        const requestOptions = {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/pending-payments/admin-delete-unpaid-pending/${id}`, requestOptions);
        return handleResponse(response);
    },


}

