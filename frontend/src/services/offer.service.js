/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
export const offerService = {

    offerCreate: async (offer) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(offer)
        };
        const response = await fetch(`${apiUrl}/offer/create-offer`, requestOptions);
        return handleResponse(response);
    },

    offerTable: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        };
        const response = await fetch(`${apiUrl}/offer/table-offer`, requestOptions);
        return handleResponse(response);    
    },

    removeOffer: async (id, user) => {
        const requestOptions = {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        };
    
        const response = await fetch(`${apiUrl}/offer/remove-offer/${id}`, requestOptions);
        return handleResponse(response);
    },

    reportOffer: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/offer/report-offer`, requestOptions);
        return handleResponse(response); 
    },

}

