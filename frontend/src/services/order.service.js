/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
export const orderService = {
    
    orderCreate: async (user, order) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, order})
        };
        const response = await fetch(`${apiUrl}/order/create-order`, requestOptions);
        return handleResponse(response);
    },
    
    orderUpdate: async (user, id, order) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, order})
        };
        const response = await fetch(`${apiUrl}/order/update-order/${id}`, requestOptions);
        await handleResponse(response);
        return order;
    },

    //ventas por usuario
    orderTable: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/order/table-order`, requestOptions);
        return handleResponse(response); 
    },

    orderGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/order/get-order/${id}`, requestOptions);
        return await handleResponse(response);
    },

    
    getOrderHelper: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/order/get-order-helper/`, requestOptions);
        return await handleResponse(response);
    },

    
    //ventas por usuario
    setOrderHelper: async (user, data) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, ...data })
        };
        const response = await fetch(`${apiUrl}/order/set-order-helper`, requestOptions);
        return handleResponse(response); 
    },

}

