/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const coinService = {

    coinTable: async () => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/coin/table-coin`, requestOptions);
        return handleResponse(response);   
    },

    coinTableHistory: async (user, pageIndex, pageSize, sortBy, filters = {}) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/coin/table-coin-history`, requestOptions);
        return handleResponse(response); 
    },

    coinCreate: async (coin) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(coin)
        };
        const response = await fetch(`${apiUrl}/coin/create-coin`, requestOptions);
        return handleResponse(response);
    },

    coinUpdate: async (id, coin) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(coin)
        };
        const response = await fetch(`${apiUrl}/coin/update-coin/${id}`, requestOptions);
        await handleResponse(response); // Asegurarse de devolver la respuesta correcta
        return coin;
    },

    coinGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/coin/get-coin/${id}`, requestOptions);
        return handleResponse(response); // No es necesario usar await aquí
    },

    coinList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/coin/get-coins`, requestOptions);
        return handleResponse(response); // No es necesario usar await aquí
    }
}
