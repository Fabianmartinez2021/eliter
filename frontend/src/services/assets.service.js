/* eslint-disable */
import { passphrase, apiUrl, passphraseData } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
import CryptoJS from "crypto-js"

export const assetsService = {
    
    register: async (user, assets) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, assets})
        };
    
        return await fetch(`${apiUrl}/assets/register`, requestOptions).then(handleResponse);
    },
    
    deleteAssets: async (id, user) => {
        const requestOptions = {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
        return await fetch(`${apiUrl}/assets/delete/${id}`, requestOptions).then(handleResponse);
    },
    
    restoreAssets: async (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
        return await fetch(`${apiUrl}/assets/restore/${id}`, requestOptions).then(handleResponse);
    },

    updateAssets: async (id, data, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({data, user})
        };
    
        return await fetch(`${apiUrl}/assets/update/${id}`, requestOptions).then(handleResponse);
    },

    getAssets: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        return await fetch(`${apiUrl}/assets/${id}`, requestOptions).then(handleResponse);
    },

    getList: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };

        return await fetch(`${apiUrl}/assets/table`, requestOptions).then(handleResponse);
    },

    getDumpList: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };

        return await fetch(`${apiUrl}/assets/dump-table`, requestOptions).then(handleResponse);
    },
    
    getRecordList: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };

        return await fetch(`${apiUrl}/assets/table-record`, requestOptions).then(handleResponse);
    },
};

