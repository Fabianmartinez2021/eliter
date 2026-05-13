/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const departureMiscellaneousService = {

    departureTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/departure-miscellaneous/table-departure`, requestOptions);
        return handleResponse(response); 
    },

    departureCreate: async (departure) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(departure)
        };
        const response = await fetch(`${apiUrl}/departure-miscellaneous/create-departure`, requestOptions);
        return handleResponse(response);
    },

    departureGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/departure-miscellaneous/get-departure/${id}`, requestOptions);
        return await handleResponse(response);
    },

    departureList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/departure-miscellaneous/get-departures`, requestOptions);
        return await handleResponse(response);
    },

    //Detalle de salidas en reporte de inventarios
    inventoryDetailDepartures: async (detail, controller) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(detail),
            signal: controller.signal
        };
        const response = await fetch(`${apiUrl}/departure-miscellaneous/detail-departures`, requestOptions);
        return await handleResponse(response);
    },

}

