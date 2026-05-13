/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const cronService = {

    //Historial de ejecucion del cron
    cronTableHistory: async ( pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/cron/cron-history`, requestOptions);
        return handleResponse(response);
            
    },

}

