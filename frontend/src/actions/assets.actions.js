/* eslint-disable */
import {assetsConstants, downloadConstants } from '../constants';
import {assetsService } from '../services';
import { alertActions, dataActions } from './';

export const assetsActions = {
        
    register(user, assets) {
        return dispatch => {
            dispatch(request(assets));
    
            assetsService.register(user, assets)
                .then(
                    assets => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Registro exitoso!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(assets) { return { type: assetsConstants.REGISTER_REQUEST, assets } }
        function success(assets) { return { type: assetsConstants.REGISTER_SUCCESS, assets } }
        function failure(error) { return { type: assetsConstants.REGISTER_FAILURE, error } }
    },
        
    deleteAssets(id, user) {
        return dispatch => {
            dispatch(request(id));
    
            assetsService.deleteAssets(id, user)
                .then(
                    assets => {
                        dispatch(success(id))
                        dispatch(alertActions.success('El activo ha sido eliminado correctamente'));
                    },
                    error => {
                        dispatch(failure(id, error.toString()))
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: assetsConstants.DELETE_REQUEST, id } }
        function success(id) { return { type: assetsConstants.DELETE_SUCCESS, id } }
        function failure(id, error) { return { type: assetsConstants.DELETE_FAILURE, id, error } }
    },
        
    restoreAssets(id, user) {
        return dispatch => {
            dispatch(request(id));
    
            assetsService.restoreAssets(id, user)
                .then(
                    assets => {
                        dispatch(success(id))
                        dispatch(alertActions.success('El activo ha sido restaurado correctamente'));
                    },
                    error => {
                        dispatch(failure(id, error.toString()))
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: assetsConstants.RESTORE_REQUEST, id } }
        function success(id) { return { type: assetsConstants.RESTORE_SUCCESS, id } }
        function failure(id, error) { return { type: assetsConstants.RESTORE_FAILURE, id, error } }
    },
    
    //Actualizar información usuario
    update(id, data, user) {
        return dispatch => {
            dispatch(request(id));
    
            assetsService.updateAssets(id, data, user)
                .then(
                    assets => {
                        dispatch(success(assets));
                        dispatch(alertActions.success('Sus datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: assetsConstants.UPDATE_DATA_REQUEST, id } }
        function success(assets) { return { type: assetsConstants.UPDATE_DATA_SUCCESS, assets } }
        function failure(error) { return { type: assetsConstants.UPDATE_DATA_FAILURE, error } }
    },

    //Obtener información usuario
    getAssets(id) {
        return dispatch => {
            dispatch(request(id));

            assetsService.getAssets(id)
                .then(
                    assets => {
                        dispatch(success(assets));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: assetsConstants.ASSETS_GET_REQUEST, id } }
        function success(assets) { return { type: assetsConstants.ASSETS_GET_SUCCESS, assets } }
        function failure(error) { return { type: assetsConstants.ASSETS_GET_FAILURE, error } }
    },

    //Listado de activos
    getList(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            assetsService.getList(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    assets => {
                        dispatch(success(assets))
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

        function request() { return { type: !isExcel ? assetsConstants.ASSETS_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(data) { 
            if(!isExcel){
                return { type: assetsConstants.ASSETS_TABLE_SUCCESS, data }
            }else{
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? assetsConstants.ASSETS_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },
    
    //Listado de activos en la papelera de activos
    getDumpList(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            assetsService.getDumpList(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    assets => {
                        dispatch(success(assets))
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

        function request() { return { type: !isExcel ? assetsConstants.ASSETS_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(data) { 
            if(!isExcel){
                return { type: assetsConstants.ASSETS_TABLE_SUCCESS, data }
            }else{
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? assetsConstants.ASSETS_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    // Obtener el registro de activos
    getRecordList(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            assetsService.getRecordList(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    assets => {
                        dispatch(success(assets))
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

        function request() { return { type: !isExcel ? assetsConstants.ASSETS_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(data) { 
            if(!isExcel){
                return { type: assetsConstants.ASSETS_TABLE_SUCCESS, data }
            }else{
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? assetsConstants.ASSETS_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },
};

