/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const pendingPaymentsFiscalService = {

    pendingPaymentsTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/pending-payments-special/table-pending-payments`, requestOptions);
        return handleResponse(response); 
    },

    pendingPaymentsCreate: async (pendingPayments) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingPayments)
        };
        const response = await fetch(`${apiUrl}/pending-payments-special/create-pending-payments`, requestOptions);
        return handleResponse(response);
    },

    pendingPaymentsUpdate: async (id, pendingPayments) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingPayments)
        };
    
        const response = await fetch(`${apiUrl}/pending-payments-special/update-pending-payments/${id}`, requestOptions);
        return handleResponse(response);
    },


}

