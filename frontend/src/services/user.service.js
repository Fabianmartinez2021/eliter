/* eslint-disable */
import { passphrase, apiUrl, passphraseData } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
import CryptoJS from "crypto-js"

export const userService = {

    login: (username, password) => {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        };
    
        return fetch(`${apiUrl}/users/authenticate`, requestOptions)
            .then(handleResponse)
            .then(user => {

                // almacenar detalles de usuario y token jwt en almacenamiento local para mantener al usuario conectado entre actualizaciones de página
                var cryptUser = CryptoJS.AES.encrypt(JSON.stringify(user.user), passphrase).toString();
                localStorage.setItem('user', cryptUser);
    
                // almacenar data de monedas, productos y terminales en almacenamiento local para permitir ventas offline
                var cryptData = CryptoJS.AES.encrypt(JSON.stringify(user.data), passphraseData).toString();
                localStorage.setItem('sale', cryptData);
                return user;
    
            });
    },

    logout() {
        // eliminar usuario del almacenamiento local para cerrar sesión
        localStorage.removeItem('user');
        localStorage.removeItem('timer');
        localStorage.removeItem('sale');
    },

    setUserInLocalStorage(user) {
        if (typeof localStorage === 'undefined' || !user) return;
        var cryptUser = CryptoJS.AES.encrypt(JSON.stringify(user), passphrase).toString();
        localStorage.setItem('user', cryptUser);
    },
    
    getAll() {
        console.log('Realizando solicitud GET para obtener todos los usuarios...');
        return dispatch => {
            dispatch(request());
            userService.getAll()
                .then(users => {
                    console.log('Respuesta de los usuarios:', users); // Log la respuesta recibida
                    dispatch(success(users));
                })
                .catch(error => {
                    console.log('Error al obtener usuarios:', error); // Log el error
                    dispatch(failure(error.toString()));
                });
        };
    
        function request() { return { type: userConstants.GETALL_REQUEST } }
        function success(users) { return { type: userConstants.GETALL_SUCCESS, users } }
        function failure(error) { return { type: userConstants.GETALL_FAILURE, error } }
    },
    
    
    getById(id) {
        console.log('Realizando solicitud GET para obtener el usuario con id:', id);
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        return fetch(`${apiUrl}/users/${id}`, requestOptions)
            .then(response => {
                console.log('Respuesta de obtener usuario:', response); // Log la respuesta completa
                return handleResponse(response);
            })
            .then(user => {
                console.log('Usuario recibido:', user); // Log los datos del usuario
                return user;
            })
            .catch(error => {
                console.error('Error al obtener el usuario:', error); // Log del error
            });
    },
    
    //obtener cliente
    getClientById: (id) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        return fetch(`${apiUrl}/client/${id}`, requestOptions).then(handleResponse);
    },
    
    register: (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        return fetch(`${apiUrl}/users/register`, requestOptions).then(handleResponse);
    },
    
    update: (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        return fetch(`${apiUrl}/users/update-user/${id}`, requestOptions).then(handleResponse).then((updatedUser) => {
            if (updatedUser && updatedUser.id) {
                let userData = localStorage.getItem('user');
                if (userData) {
                    var bytes = CryptoJS.AES.decrypt(userData, passphrase);
                    var originalData = bytes.toString(CryptoJS.enc.Utf8);
                    userData = JSON.parse(originalData);
                    var previousAgency = userData.agency;
                    Object.assign(userData, updatedUser);
                    var responseHasFullAgency = updatedUser.agency != null && typeof updatedUser.agency === 'object' && updatedUser.agency.id != null && updatedUser.agency.name != null;
                    if (previousAgency != null && !responseHasFullAgency) {
                        userData.agency = previousAgency;
                    }
                    var cryptUser = CryptoJS.AES.encrypt(JSON.stringify(userData), passphrase).toString();
                    localStorage.setItem('user', cryptUser);
                }
            }
            return updatedUser;
        })
    },

    updateUserData: (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        return fetch(`${apiUrl}/users/update-user/${id}`, requestOptions).then(handleResponse);
    },

    //Actualizar cliente
    updateClientData: (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        return fetch(`${apiUrl}/client/update-client/${id}`, requestOptions).then(handleResponse);
    },

    usersTable: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        };
        const response = await fetch(`${apiUrl}/users/table-users`, requestOptions);
        return handleResponse(response);
    },

    usersList: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
        const response = await fetch(`${apiUrl}/users/list-users`, requestOptions);
        return handleResponse(response);
    },
    
    _delete: (id) => {
        const requestOptions = {
            method: 'DELETE',
            headers: authHeader()
        };
        return fetch(`${apiUrl}/users/${id}`, requestOptions).then(handleResponse);
    },
    
    //tabla de clientes
    clientsList: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/client/table-clients`, requestOptions);
        return handleResponse(response);
            
    },

    //lista de clientes al DETAL
    clientTypeahead: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({document:user})
        };
        const response = await fetch(`${apiUrl}/client/search-document`, requestOptions);
        return handleResponse(response);
    },

    //obtener cliente al mayor
    getWholesaleClientById: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        const response = await fetch(`${apiUrl}/wholesale-client/${id}`, requestOptions);
        return handleResponse(response);
    },

    //Registrar un nuevo cliente al mayor
    createWholesaleClientData: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        const response = await fetch(`${apiUrl}/wholesale-client/create-client/`, requestOptions);
        return handleResponse(response);
    },

    //Actualizar cliente al mayor
    updateWholesaleClientData: async (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        const response = await fetch(`${apiUrl}/wholesale-client/update-client/${id}`, requestOptions);
        return handleResponse(response);
    },

    //tabla de clientes al MAYOR
    WholesaleClientsList: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/wholesale-client/table-clients`, requestOptions);
        return handleResponse(response);
            
    },

    //lista de clientes al MAYOR mediante número de cédula
    WholesaleClientTypeahead: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({document:user})
        };
        const response = await fetch(`${apiUrl}/wholesale-client/search-document`, requestOptions);
        return handleResponse(response);
    },
    
    //lista de CUENTAS PENDIENTES mediante número de documento
    PendingPaymentsTypeahead: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({document:user})
        };
        const response = await fetch(`${apiUrl}/pending-payments/typeahead-pending-payments`, requestOptions);
        return handleResponse(response);
    },
    
    //lista de clientes al MAYOR mediante código del cliente
    WholesaleClientByCodeTypeahead: async (code) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({clientCode:code})
        };
        const response = await fetch(`${apiUrl}/wholesale-client/search-code`, requestOptions);
        return handleResponse(response);
    },

    // Seccion para los vendedores

    registerSeller: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        return await fetch(`${apiUrl}/users/register-seller`, requestOptions).then(handleResponse);
    },

    
    getSellers: async () => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };

        return await fetch(`${apiUrl}/users/sellers`, requestOptions).then(handleResponse);
    },

    getSellerById: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        return await fetch(`${apiUrl}/users/sellers/${id}`, requestOptions).then(handleResponse);
    },

    
    updateSeller: async (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };

        return await fetch(`${apiUrl}/users/update-seller/${id}`, requestOptions).then(handleResponse);
    },

    // Obtener historial de metas semanales
    getWeeklyGoalHistory: async (sellerId) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };

        return await fetch(`${apiUrl}/users/sellers/${sellerId}/weekly-goal-history`, requestOptions).then(handleResponse);
    },


    
    // Seccion para los operadores

    registerOperator: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        return await fetch(`${apiUrl}/workers/register-operator`, requestOptions).then(handleResponse);
    },

    
    getOperators: async () => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };

        return await fetch(`${apiUrl}/workers/operators`, requestOptions).then(handleResponse);
    },

    getOperatorById: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        return await fetch(`${apiUrl}/workers/operators/${id}`, requestOptions).then(handleResponse);
    },

    
    updateOperator: async (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };

        return await fetch(`${apiUrl}/workers/update-operator/${id}`, requestOptions).then(handleResponse);
    },

    operatorPerformanceReport: async (user, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, filters })
        };
        const response = await fetch(`${apiUrl}/workers/operators-performance-report`, requestOptions);
        
        return await handleResponse(response);
    },

    cashierPerformanceReport: async (user, filters) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, filters })
        };
        const response = await fetch(`${apiUrl}/workers/cashiers-performance-report`, requestOptions);
        
        return await handleResponse(response);
    },

    ////////////////////////////////////////////////////////////vale

    //obtener cliente al mayor
    getValeClientById: async (id) => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
    
        const response = await fetch(`${apiUrl}/vale-client/${id}`, requestOptions);
        return handleResponse(response);
    },

    //Registrar un nuevo cliente al mayor
    createValeClientData: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        const response = await fetch(`${apiUrl}/vale-client/create-client/`, requestOptions);
        return handleResponse(response);
    },

    //Actualizar cliente al mayor
    updateValeClientData: async (id, user) => {
        const requestOptions = {
            method: 'PUT',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        };
    
        const response = await fetch(`${apiUrl}/vale-client/update-client/${id}`, requestOptions);
        return handleResponse(response);
    },

    //tabla de clientes al MAYOR
    ValeClientsList: async ( user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/vale-client/table-clients`, requestOptions);
        return handleResponse(response);
            
    },

    //lista de clientes al MAYOR mediante número de cédula
    ValeClientTypeahead: async (user) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({document:user})
        };
        const response = await fetch(`${apiUrl}/vale-client/search-document`, requestOptions);
        return handleResponse(response);
    },

     //lista de clientes al MAYOR mediante código del cliente
    ValeClientByCodeTypeahead: async (code) => {
        const requestOptions = {
            method: 'POST',
            headers: { ... authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({clientCode:code})
        };
        const response = await fetch(`${apiUrl}/vale-client/search-code`, requestOptions);
        return handleResponse(response);
    },

    //Obtener lista de choferes
    getDrivers: async () => {
        const requestOptions = {
            method: 'GET',
            headers: authHeader()
        };
        const response = await fetch(`${apiUrl}/users/drivers`, requestOptions);
        return handleResponse(response);
    },

};

