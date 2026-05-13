/* eslint-disable */
import { boxConstants, downloadConstants } from '../constants';
import { boxService } from '../services';
import { alertActions } from './';

export const boxActions = {

    //Apertura de caja
    boxOpening(box) {
        return dispatch => {
            dispatch(request(box));

            boxService.boxOpening(box)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha aperturado la caja correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(box) { return { type: boxConstants.BOX_CREATE_REQUEST, box } }
        function success(box) { return { type: boxConstants.BOX_CREATE_SUCCESS, box } }
        function failure(error) { return { type: boxConstants.BOX_CREATE_FAILURE, error } }
    },

    boxWithdraw(box) {
        return dispatch => {
            dispatch(request(box));

            boxService.boxWithdraw(box)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha retirado de la caja correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(box) { return { type: boxConstants.BOX_WITHDRAWAL_REQUEST, box } }
        function success(box) { return { type: boxConstants.BOX_WITHDRAWAL_SUCCESS, box } }
        function failure(error) { return { type: boxConstants.BOX_WITHDRAWAL_FAILURE, error } }
    },

    //Ventas generales
    boxTable(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            boxService.boxTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    boxes => {
                        dispatch(success(boxes))
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

        function request() { return { type: !isExcel ? boxConstants.BOX_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(boxes) { 
            if(!isExcel){
                return { type: boxConstants.BOX_TABLE_SUCCESS, boxes }
            }else{
                let data = boxes;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? boxConstants.BOX_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    //Detalle de caja por divisa: reporte de caja
    boxDetails(box) {
        return (dispatch, getState ) => {
            
            //Abortar consultas anteriores si existen
            const { controller } = getState().box;
            if(controller){
                controller.abort();
            }
           
            const newController = new AbortController();
            dispatch(request(newController));

            boxService.boxDetails(box, newController)
                .then(
                    box => {
                        dispatch(success(box))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(newController) { return { type: boxConstants.BOX_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(box) { return { type: boxConstants.BOX_TABLE_DETAIL_SUCCESS, box } }
        function failure(error) { return { type: boxConstants.BOX_TABLE_DETAIL_FAILURE, error } }
    },

    //Reporte 
    boxToCloseTable(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            boxService.boxToCloseTable(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    boxes => {
                        dispatch(success(boxes))
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

        function request() { return { type: !isExcel ? boxConstants.BOX_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(boxes) { 
            if(!isExcel){
                return { type: boxConstants.BOX_TABLE_SUCCESS, boxes }
            }else{
                let data = boxes;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? boxConstants.BOX_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    //Cierre de caja
    boxClose(box) {
        return dispatch => {
            dispatch(request(box));

            boxService.boxClose(box)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado correctamente el cierre!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(box) { return { type: boxConstants.BOX_CLOSING_REQUEST, box } }
        function success(box) { return { type: boxConstants.BOX_CLOSING_SUCCESS, box } }
        function failure(error) { return { type: boxConstants.BOX_CLOSING_FAILURE, error } }
    },

    //Reporte de cierres de caja 
    boxCloseTable(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            boxService.boxCloseTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    boxes => {
                        dispatch(success(boxes))
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

        function request() { return { type: !isExcel ? boxConstants.BOX_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(boxes) { 
            if(!isExcel){
                return { type: boxConstants.BOX_TABLE_SUCCESS, boxes }
            }else{
                let data = boxes;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? boxConstants.BOX_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    boxCorrection(box) {
        return dispatch => {
            dispatch(request(box));

            boxService.boxCorrection(box)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha realizado la corrección de la caja!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(box) { return { type: boxConstants.BOX_CORRECTION_REQUEST, box } }
        function success(box) { return { type: boxConstants.BOX_CORRECTION_SUCCESS, box } }
        function failure(error) { return { type: boxConstants.BOX_CORRECTION_FAILURE, error } }
    },

    boxDataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            boxService.boxDataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    boxes => {
                        dispatch(success(boxes))
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

        function request() { return { type: !isExcel ? boxConstants.BOX_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(boxes) { 
            if(!isExcel){
                return { type: boxConstants.BOX_TABLE_SUCCESS, boxes }
            }else{
                let data = boxes;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? boxConstants.BOX_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    boxAdd(box) {
        return dispatch => {
            dispatch(request(box));

            boxService.boxAdd(box)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha agregado el dinero a la caja correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(box) { return { type: boxConstants.BOX_ADD_REQUEST, box } }
        function success(box) { return { type: boxConstants.BOX_ADD_SUCCESS, box } }
        function failure(error) { return { type: boxConstants.BOX_ADD_FAILURE, error } }
    },
};
