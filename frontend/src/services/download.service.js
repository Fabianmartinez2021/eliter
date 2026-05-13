/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const salesService = {

    salesPaymentMethods: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/sales/report-payment-methods`, requestOptions);
        return await handleResponse(response);
    },


}

