/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const reportsFiscalService = {

    reportsFiscalTable: async(user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel }) 
        }
        const response = await fetch(`${apiUrl}/reports/report-fiscal`, requestOptions);
        
        return handleResponse(response);
    }
}
