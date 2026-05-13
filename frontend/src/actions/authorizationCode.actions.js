/* eslint-disable */
import { authorizationCodeConstants, downloadConstants } from '../constants';
import {authorizationCodeService } from '../services';
import { alertActions } from './';

export const authorizationCodeActions = {
        
    register(user, data) {
        return dispatch => {
            dispatch(request());
    
            authorizationCodeService.registerCode(user, data)
                .then(
                    code => { 
                        dispatch(success(code));
                        dispatch(alertActions.success('¡Registro exitoso!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request() { return { type: authorizationCodeConstants.REGISTER_REQUEST } }
        function success(data) { return { type: authorizationCodeConstants.REGISTER_SUCCESS, data } }
        function failure(error) { return { type: authorizationCodeConstants.REGISTER_FAILURE, error } }
    },

    createBoxWithdrawalCode(user, data) {
        return dispatch => {
            dispatch(request());
    
            authorizationCodeService.createBoxWithdrawalCode(user, data)
                .then(
                    code => { 
                        dispatch(success(code));
                        dispatch(alertActions.success('¡Registro exitoso!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request() { return { type: authorizationCodeConstants.REGISTER_REQUEST } }
        function success(data) { return { type: authorizationCodeConstants.REGISTER_SUCCESS, data } }
        function failure(error) { return { type: authorizationCodeConstants.REGISTER_FAILURE, error } }
    },
        
    deleteCode(id) {
        return dispatch => {
            dispatch(request(id));
    
            authorizationCodeService.deleteCode(id)
                .then(
                    code => {
                        dispatch(success())
                        dispatch(alertActions.success('El código ha sido eliminado correctamente'));
                    },
                    error => {
                        dispatch(failure(id, error.toString()))
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request() { return { type: authorizationCodeConstants.DELETE_REQUEST } }
        function success() { return { type: authorizationCodeConstants.DELETE_SUCCESS } }
        function failure(error) { return { type: authorizationCodeConstants.DELETE_FAILURE, error } }
    },
       
    //Obtener información usuario
    getCodes(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            authorizationCodeService.getCodes(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    data => {
                        dispatch(success(data))
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

        function request() { return { type: !isExcel ? authorizationCodeConstants.TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(data) { 
            if(!isExcel){
            return { type: authorizationCodeConstants.TABLE_SUCCESS, data }
         }else{
            return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
         }
        }
         function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: authorizationCodeConstants.TABLE_FAILURE, error } }
    },
   
    //Obtener información usuario
    getCode(user, data) {
        return dispatch => {
            dispatch(request());

            authorizationCodeService.getCode(user, data)
                .then(
                    data => {
                        dispatch(success(data));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: authorizationCodeConstants.CODE_REQUEST } }
        function success(data) { return { type: authorizationCodeConstants.CODE_SUCCESS, data } }
        function failure(error) { return { type: authorizationCodeConstants.CODE_FAILURE, error } }
    },
};

