/* eslint-disable */
import { userConstants, downloadConstants } from '../constants';
import { userService } from '../services';
import { alertActions, dataActions } from './';
import { history } from '../helpers';

export const userActions = {
    login(username, password) {
        return dispatch => {
            dispatch(request({ username }));
    
            userService.login(username, password)
                .then(
                    user => {
                        dispatch(success(user.user));
                        //actualizar en redux monedas productos y terminales
                        dispatch(dataActions.update(user.data))
                        history.push('/home');
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(user) { return { type: userConstants.LOGIN_REQUEST, user } }
        function success(user) { return { type: userConstants.LOGIN_SUCCESS, user } }
        function failure(error) { return { type: userConstants.LOGIN_FAILURE, error } }
    },
    
    logout() {
        userService.logout();
        return { type: userConstants.LOGOUT };
    },
    
    register(user) {
        return dispatch => {
            dispatch(request(user));
    
            userService.register(user)
                .then(
                    user => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Registro exitoso!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
        function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
        function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
    },
    
    getAll() {
        return dispatch => {
            dispatch(request());
    
            userService.getAll()
                .then(
                    users => dispatch(success(users)),
                    error => dispatch(failure(error.toString()))
                );
        };
    
        function request() { return { type: userConstants.GETALL_REQUEST } }
        function success(users) { return { type: userConstants.GETALL_SUCCESS, users } }
        function failure(error) { return { type: userConstants.GETALL_FAILURE, error } }
    },
    
    _delete(id) {
        return dispatch => {
            dispatch(request(id));
    
            userService.delete(id)
                .then(
                    user => dispatch(success(id)),
                    error => dispatch(failure(id, error.toString()))
                );
        };
    
        function request(id) { return { type: userConstants.DELETE_REQUEST, id } }
        function success(id) { return { type: userConstants.DELETE_SUCCESS, id } }
        function failure(id, error) { return { type: userConstants.DELETE_FAILURE, id, error } }
    },
    
    //Actualizar información usuario (opciones: { successMessage } para mensaje distinto)
    update(id, data, options = {}) {
        return (dispatch, getState) => {
            dispatch(request(id));
            const successMessage = options.successMessage || 'Sus datos han sido actualizados correctamente';
    
            userService.update(id, data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success(successMessage));
                        if (successMessage === 'Correo enviado' && typeof localStorage !== 'undefined') {
                            const count = parseInt(localStorage.getItem('verificationEmailSendCount') || '0', 10) + 1;
                            localStorage.setItem('verificationEmailSendCount', String(count));
                            localStorage.setItem('lastVerificationEmailSentAt', String(Date.now()));
                        }
                        if (user && user.id) {
                            const currentUser = getState()?.authentication?.user;
                            const mergedUser = currentUser ? { ...currentUser, ...user } : user;
                            const responseHasFullAgency = mergedUser?.agency != null && typeof mergedUser.agency === 'object' && mergedUser.agency.id != null && mergedUser.agency.name != null;
                            if (currentUser?.agency != null && !responseHasFullAgency) {
                                mergedUser.agency = currentUser.agency;
                            }
                            dispatch({ type: userConstants.UPDATE_CURRENT_USER, user: mergedUser });
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },

    //editar info usuario (solo admin)
    updateUser(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.updateUserData(id,data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('Sus datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },

    //editar info cliente
    updateClient(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.updateClientData(id,data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },

    /**
     * Consulta para DataTable de usuarios
     */
    dataTable(user) {
        return dispatch => {
            dispatch(request());

            userService.usersTable(user)
                .then(
                    users => {
                        dispatch(success(users))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: userConstants.USER_TABLE_REQUEST } }
        function success(users) { return { type: userConstants.USER_TABLE_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_TABLE_FAILURE, error } }
    },

    //Obtener información usuario
    getUser(id) {
        return dispatch => {
            dispatch(request(id));

            userService.getById(id)
                .then(
                    user => {
                        dispatch(success(user));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: userConstants.USER_GET_REQUEST, id } }
        function success(user) { return { type: userConstants.USER_GET_SUCCESS, user } }
        function failure(error) { return { type: userConstants.USER_GET_FAILURE, error } }
    },

    //Obtener información de cliente
    getClient(id) {
        return dispatch => {
            dispatch(request(id));

            userService.getClientById(id)
                .then(
                    user => {
                        dispatch(success(user));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: userConstants.USER_GET_REQUEST, id } }
        function success(user) { return { type: userConstants.USER_GET_SUCCESS, user } }
        function failure(error) { return { type: userConstants.USER_GET_FAILURE, error } }
    },


    /**
     * Obtener listado de usuarios y sucursales
     * @param {*} user 
     */
    getListUserAgencies(user) {
        return dispatch => {
            dispatch(request(user));

            userService.usersList(user)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_LIST_FAILURE, error } }
    },

    //Listado de clientes
    clientsList(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            userService.clientsList(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    users => {
                        dispatch(success(users))
                        if(isExcel){
                            dispatch(reset())
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: !isExcel ? userConstants.USER_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(users) { 
            if(!isExcel){
                return { type: userConstants.USER_TABLE_SUCCESS, users }
            }else{
                let data = users;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? userConstants.USER_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },


    /**
     * Obtener listado de clientes al DETAL
     * @param {*} client 
     */
    getListClientTypeahead(user) {
        return dispatch => {
            dispatch(request(user));

            userService.clientTypeahead(user)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_LIST_FAILURE, error } }
    },

    //Obtener información de cliente
    getWholesaleClient(id) {
        return dispatch => {
            dispatch(request(id));

            userService.getWholesaleClientById(id)
                .then(
                    user => {
                        dispatch(success(user));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: userConstants.USER_GET_REQUEST, id } }
        function success(user) { return { type: userConstants.USER_GET_SUCCESS, user } }
        function failure(error) { return { type: userConstants.USER_GET_FAILURE, error } }
    },


    // Registrar un nuevo cliente al mayor
    createWholesaleClient(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.createWholesaleClientData(data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('El cliente ha sido registrado correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },


    //editar info cliente
    updateWholesaleClient(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.updateWholesaleClientData(id,data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },

    //Listado de clientes
    wholesaleClientsList(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            userService.WholesaleClientsList(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    users => {
                        dispatch(success(users))
                        if(isExcel){
                            dispatch(reset())
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: !isExcel ? userConstants.USER_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(users) { 
            if(!isExcel){
                return { type: userConstants.USER_TABLE_SUCCESS, users }
            }else{
                let data = users;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? userConstants.USER_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },


    /**
     * Obtener listado de clientes al MAYOR por el numero de cédula
     * @param {*} client 
     */
     getListWholesaleClientTypeahead(user) {
        return dispatch => {
            dispatch(request(user));

            userService.WholesaleClientTypeahead(user)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_LIST_FAILURE, error } }
    },

    /**
     * Obtener listado de PAGOS PENDIENTES por el numero de documento
     * @param {*} client 
     */
     getListPendingPaymentsTypeahead(user) {
        return dispatch => {
            dispatch(request(user));

            userService.PendingPaymentsTypeahead(user)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_LIST_FAILURE, error } }
    },

    /**
     * Obtener listado de clientes al MAYOR por el código del cliente
     * @param {*} client 
     */
     getListWholesaleClientByCodeTypeahead(code) {
        return dispatch => {
            dispatch(request(code));

            userService.WholesaleClientByCodeTypeahead(code)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_LIST_FAILURE, error } }
    },

    // Sección para los vendedores

    registerSeller(user) {
        return dispatch => {
            dispatch(request(user));
    
            userService.registerSeller(user)
                .then(
                    user => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Registro exitoso!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
        function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
        function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
    },

    getSellers() {
        return dispatch => {
            dispatch(request());
    
            userService.getSellers()
                .then(
                    users => {
                        dispatch(success(users))
                    },
                    error => dispatch(failure(error.toString()))
                );
        };
    
        function request() { return { type: userConstants.USER_TABLE_REQUEST } }
        function success(users) { return { type: userConstants.USER_TABLE_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_TABLE_FAILURE, error } }
    },

    getSeller(id) {
        return dispatch => {
            dispatch(request(id));

            userService.getSellerById(id)
                .then(
                    user => {
                        dispatch(success(user));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: userConstants.USER_GET_REQUEST, id } }
        function success(user) { return { type: userConstants.USER_GET_SUCCESS, user } }
        function failure(error) { return { type: userConstants.USER_GET_FAILURE, error } }
    },


    updateSeller(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.updateSeller(id,data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('Sus datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },
    
    // Sección para los operadores

    registerOperator(user) {
        return dispatch => {
            dispatch(request(user));
    
            userService.registerOperator(user)
                .then(
                    user => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Registro exitoso!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
        function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
        function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
    },

    getOperators() {
        return dispatch => {
            dispatch(request());
    
            userService.getOperators()
                .then(
                    users => {
                        dispatch(success(users))
                    },
                    error => dispatch(failure(error.toString()))
                );
        };
    
        function request() { return { type: userConstants.USER_TABLE_REQUEST } }
        function success(users) { return { type: userConstants.USER_TABLE_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_TABLE_FAILURE, error } }
    },

    getOperator(id) {
        return dispatch => {
            dispatch(request(id));

            userService.getOperatorById(id)
                .then(
                    user => {
                        dispatch(success(user));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: userConstants.USER_GET_REQUEST, id } }
        function success(user) { return { type: userConstants.USER_GET_SUCCESS, user } }
        function failure(error) { return { type: userConstants.USER_GET_FAILURE, error } }
    },


    updateOperator(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.updateOperator(id,data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('Sus datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_DATA_FAILURE, error } }
    },
    
    // Desempeño de los operadores
    operatorPerformanceReport(user, filters) {
        return dispatch => {
            dispatch(request());

            userService.operatorPerformanceReport(user, filters)
                .then(
                    sales => {
                        dispatch(success(sales))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: userConstants.USER_TABLE_REQUEST } }
        function success(users) { return { type: userConstants.USER_TABLE_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_TABLE_FAILURE, error } }
    },


   cashierPerformanceReport(user, filters) {
        return dispatch => {
            dispatch(request());

            userService.cashierPerformanceReport(user, filters)
                .then(
                    sales => {
                        dispatch(success(sales))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: userConstants.USER_TABLE_REQUEST } }
        function success(users) { return { type: userConstants.USER_TABLE_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_TABLE_FAILURE, error } }
    },


    ////////////////////////////////////////////////////////////vale


    //Obtener información de cliente
    getValeClient(id) {
        return dispatch => {
            dispatch(request(id));

            userService.getValeClientById(id)
                .then(
                    user => {
                        dispatch(success(user));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: userConstants.USER_VALE_GET_REQUEST, id } }
        function success(user) { return { type: userConstants.USER_VALE_GET_SUCCESS, user } }
        function failure(error) { return { type: userConstants.USER_VALE_GET_FAILURE, error } }
    },


    // Registrar un nuevo cliente al mayor
    createValeClient(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.createValeClientData(data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('El cliente ha sido registrado correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_VALE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_VALE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_VALE_DATA_FAILURE, error } }
    },


    //editar info cliente
    updateValeClient(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            userService.updateValeClientData(id,data)
                .then(
                    user => {
                        dispatch(success(user));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: userConstants.UPDATE_VALE_DATA_REQUEST, id } }
        function success(user) { return { type: userConstants.UPDATE_VALE_DATA_SUCCESS, user } }
        function failure(error) { return { type: userConstants.UPDATE_VALE_DATA_FAILURE, error } }
    },

    //Listado de clientes
    ValeClientsList(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            userService.ValeClientsList(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    users => {
                        dispatch(success(users))
                        if(isExcel){
                            dispatch(reset())
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: !isExcel ? userConstants.USER_VALE_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(users) { 
            if(!isExcel){
                return { type: userConstants.USER_VALE_TABLE_SUCCESS, users }
            }else{
                let data = users;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? userConstants.USER_VALE_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },


    /**
     * Obtener listado de clientes al MAYOR por el numero de cédula
     * @param {*} client 
     */
     getListValeClientTypeahead(user) {
        return dispatch => {
            dispatch(request(user));

            userService.ValeClientTypeahead(user)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_VALE_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_VALE_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_VALE_LIST_FAILURE, error } }
    },
     getListValeClientByCodeTypeahead(code) {
        return dispatch => {
            dispatch(request(code));

            userService.ValeClientByCodeTypeahead(code)
                .then(
                    users => {
                        dispatch(success(users));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(user) { return { type: userConstants.USER_VALE_LIST_REQUEST, user } }
        function success(users) { return { type: userConstants.USER_VALE_LIST_SUCCESS, users } }
        function failure(error) { return { type: userConstants.USER_VALE_LIST_FAILURE, error } }
    },

    //Obtener lista de choferes
    getDrivers() {
        return dispatch => {
            dispatch(request());

            userService.getDrivers()
                .then(
                    drivers => {
                        dispatch(success(drivers));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: userConstants.USER_LIST_REQUEST } }
        function success(drivers) { return { type: userConstants.USER_LIST_SUCCESS, users: drivers } }
        function failure(error) { return { type: userConstants.USER_LIST_FAILURE, error } }
    },
};

