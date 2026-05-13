/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

export const miscellaneousService = {

    miscellaneousCreate: async (data) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
        const response = await fetch(`${apiUrl}/miscellaneous/create`, requestOptions);
        return handleResponse(response);
    },

    pendingTable:  async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({
            user,
            pageIndex,
            pageSize,
            sortBy,
            filters,
            isExcel,
          }),
        };
        const response = await fetch (`${apiUrl}/miscellaneous-inventory/table-pending`, requestOptions);
        return handleResponse(response)
      },


    miscellaneousTable: async () => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },

        };
        const response = await fetch(`${apiUrl}/miscellaneous/table-miscellaneous`, requestOptions);
        return handleResponse(response);
    },

  
    miscellaneousGet: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };

        const response = await fetch(`${apiUrl}/miscellaneous/get-miscellaneous/${id}`, requestOptions);
        return await handleResponse(response);
    },

    miscellaneousUpdate: async (id, miscellaneous) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(miscellaneous)
        };
        const response = await fetch(`${apiUrl}/miscellaneous/update-miscellaneous/${id}`, requestOptions);
        await handleResponse(response);
        return miscellaneous;
    },

    miscellaneousTableHistory: async (user, pageIndex, pageSize, sortBy, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters })
        };
        const response = await fetch(`${apiUrl}/miscellaneous/table-miscellaneous-history`, requestOptions);
        return handleResponse(response);
    },

    accepteMiscellaneous: async (id, comment) => {
        const requestOptions = {
            method: 'PATCH',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment }),
        };
        const response = await fetch(`${apiUrl}/miscellaneous-inventory/approve-inventory/${id}`, requestOptions);
        return handleResponse(response);
    },

    getPendingById: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };  
        const response = await fetch(`${apiUrl}/miscellaneous-inventory/get-pending/${id}`, requestOptions);
        return await handleResponse(response);
    },











    miscellaneousList: async () => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/miscellaneous/get-miscellaneouss`, requestOptions);
        return await handleResponse(response);
    },

    miscellaneousOfferList: async (idAgency) => {
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        };
        const response = await fetch(`${apiUrl}/miscellaneous/miscellaneous-offer/${idAgency}`, requestOptions);
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

    combosCreate: async (miscellaneous) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(miscellaneous)
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

    combosUpdate: async (id, miscellaneous) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(miscellaneous)
        };
        const response = await fetch(`${apiUrl}/combos/update/${id}`, requestOptions);
        await handleResponse(response);
        return miscellaneous;
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

}

