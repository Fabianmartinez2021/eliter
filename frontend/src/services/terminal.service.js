/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const terminalService = {

    terminalTable: async () => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/terminal/table-terminal`, requestOptions);
        
        return handleResponse(response);   
    },

    terminalCreate: async (terminal) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(terminal)
        };
        const response = await fetch(`${apiUrl}/terminal/create-terminal`, requestOptions);
        return handleResponse(response);
    },

    terminalUpdate: async (id, terminal) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(terminal)
        };
        const response = await fetch(`${apiUrl}/terminal/update-terminal/${id}`, requestOptions);
        await handleResponse(response);
        return terminal;
    },

    terminalGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/terminal/get-terminal/${id}`, requestOptions);
        return await handleResponse(response);
    },

    terminalList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/terminal/get-terminals`, requestOptions);
        return await handleResponse(response);
    },

    terminalListUnused: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/terminal/get-terminals-unused`, requestOptions);
        return await handleResponse(response);
    },

    terminalRecordsTable: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/terminal/get-terminal-records`, requestOptions);
        return handleResponse(response);   
    },
}

