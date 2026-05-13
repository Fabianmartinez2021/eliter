/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
export const productService = {

    productTable: async () => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/product/table-product`, requestOptions);
        return handleResponse(response);
    },

    productTableHistory: async (user, pageIndex, pageSize, sortBy, filters = {}) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };

        const response = await fetch(`${apiUrl}/product/table-product-history`, requestOptions);
        return handleResponse(response);

    },

    productCreate: async (product) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        };
        const response = await fetch(`${apiUrl}/product/create-product`, requestOptions);
        return handleResponse(response);
    },

    productUpdate: async (id, product) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        };
        const response = await fetch(`${apiUrl}/product/update-product/${id}`, requestOptions);
        await handleResponse(response);
        return product;
    },

    productGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };

        const response = await fetch(`${apiUrl}/product/get-product/${id}`, requestOptions);
        return await handleResponse(response);
    },

    productList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/product/get-products`, requestOptions);
        return await handleResponse(response);
    },

    productOfferList: async (idAgency) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/product/product-offer/${idAgency}`, requestOptions);
        return await handleResponse(response);
    },

    /*  Sección de combos */

    combosGetAll: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };

        const response = await fetch(`${apiUrl}/combos`, requestOptions);
        return await handleResponse(response);
    },

    combosCreate: async (product) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        };
        const response = await fetch(`${apiUrl}/combos/create`, requestOptions);
        return handleResponse(response);
    },

    combosGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };

        const response = await fetch(`${apiUrl}/combos/get-combo/${id}`, requestOptions);
        return await handleResponse(response);
    },

    combosDelete: async (id) => {
        const requestOptions = {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };

        const response = await fetch(`${apiUrl}/combos/delete/${id}`, requestOptions);
        return await handleResponse(response);
    },

    combosUpdate: async (id, product) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        };
        const response = await fetch(`${apiUrl}/combos/update/${id}`, requestOptions);
        await handleResponse(response);
        return product;
    },

    combosList: async (data) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
        const response = await fetch(`${apiUrl}/combos/get-combos`, requestOptions);
        return await handleResponse(response);
    },

    dataTableCombosHistory: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };

        const response = await fetch(`${apiUrl}/combos/history-combo`, requestOptions);
        return await handleResponse(response);
    },

    updateProductsPrices: async (rate, products) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ rate, products })
        };
        const response = await fetch(`${apiUrl}/product/update-prices-next-day`, requestOptions);
        return await handleResponse(response);
    },

}

