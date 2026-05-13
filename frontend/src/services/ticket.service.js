/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const ticketService = {

    ticketTable: async (agency) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(agency)
        };
        const response = await fetch(`${apiUrl}/ticket/table-ticket`, requestOptions);
        return handleResponse(response); 
    },

    ticketTableWholesale: async (agency) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(agency)
        };
        const response = await fetch(`${apiUrl}/ticket/table-ticket-wholesale`, requestOptions);
        return handleResponse(response); 
    },

    ticketCreate: async (ticket) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket)
        };
        const response = await fetch(`${apiUrl}/ticket/create-ticket`, requestOptions);
        return handleResponse(response);
    },

    updateTicketData: async (id, ticket) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket)
        };
    
        const response = await fetch(`${apiUrl}/ticket/update-ticket/${id}`, requestOptions);
        return handleResponse(response);
    },

    removeTicket: async (id, agency) => {
        const requestOptions = {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(agency)
        };
    
        const response = await fetch(`${apiUrl}/ticket/remove-ticket/${id}`, requestOptions);
        return handleResponse(response);
    },
 

}

