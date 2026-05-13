/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

const pendingValesService = {

    pendingValesTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/pending-vales/table-pending-vales`, requestOptions);
        return handleResponse(response); 
    },

    pendingValesCreate: async (pendingVales) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingVales)
        };
        const response = await fetch(`${apiUrl}/pending-vales/create-pending-vales`, requestOptions);
        return handleResponse(response);
    },

    pendingValesUpdate: async (id, pendingVales) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingVales)
        };
    
        const response = await fetch(`${apiUrl}/pending-vales/update-pending-vales/${id}`, requestOptions);
        return handleResponse(response);
    },


}

export default pendingValesService;