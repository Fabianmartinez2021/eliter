/* eslint-disable */
import { passphrase, apiUrl, passphraseData } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
import CryptoJS from "crypto-js"

export const authorizationCodeService = {
    
    registerCode: async (user, data) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, ...data})
        };
    
        return await fetch(`${apiUrl}/authorization-code/create`, requestOptions).then(handleResponse);
    },
    
    createBoxWithdrawalCode: async (user, data) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, ...data})
        };
    
        return await fetch(`${apiUrl}/authorization-code/create-box-withdrawal-code`, requestOptions).then(handleResponse);
    },
    
    deleteCode: async (id) => {
        const requestOptions = {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        return await fetch(`${apiUrl}/authorization-code/delete/${id}`, requestOptions).then(handleResponse);
    },

    getCodes: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, pageIndex, pageSize, sortBy, filters, isExcel})
        };
    
        return await fetch(`${apiUrl}/authorization-code/codes`, requestOptions).then(handleResponse);
    },
    
    getCode: async (user, data) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({user, data})
        };
    
        return await fetch(`${apiUrl}/authorization-code/get-code`, requestOptions).then(handleResponse);
    },
};

