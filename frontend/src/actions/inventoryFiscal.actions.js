/* eslint-disable */
import {  downloadConstants } from '../constants';
import { inventoryFiscalConstants } from '../constants/inventoryFiscal.constans';
import { inventoryFiscalService } from '../services/inventoryFiscal.service';
import { alertActions } from './';

export const inventoryFiscalActions = {

    dataTable(user) {
        return dispatch => {
            dispatch(request());

            inventoryFiscalService.inventoryFiscalTable(user)
                .then(
                    inventoriesFiscal => {
                        dispatch(success(inventoriesFiscal))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_REQUEST } }
        function success(inventoriesFiscal) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_SUCCESS, inventoriesFiscal } }
        function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_FAILURE, error } }
    },

    // //Historial de salida por venta
    dataTableSell(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryFiscalService.inventoryFiscalReportSales(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    inventoriesFiscal => {
                        dispatch(success(inventoriesFiscal))
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

        function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventoriesFiscal) { 
            if(!isExcel){
                return { type: inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_SUCCESS, inventoriesFiscal }
            }else{
                let data = inventoriesFiscal;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    // //Historial de salida por ofertas
    // dataTableOffers(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.inventoryReportOffers(user, pageIndex, pageSize, sortBy, filters, isExcel)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                     if(isExcel){
    //                         dispatch(reset())
    //                     }
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
    //     function success(inventories) { 
    //         if(!isExcel){
    //             return { type: inventoryFiscalConstants.INVENTORY_TABLE_SUCCESS, inventories }
    //         }else{
    //             let data = inventories;
    //             return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
    //         }
    //     }
    //     function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
    //     function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    // },

    dataTableReportInventoriesFiscal(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryFiscalService.inventoryFiscalTableReport(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    inventories => {
                        dispatch(success(inventories))
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

        function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryFiscalConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    // dataTableReportBalance(user, filters) {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.balanceTableReport(user, filters)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: inventoryFiscalConstants.BALANCE_TABLE_REQUEST } }
    //     function success(inventories) { return { type: inventoryFiscalConstants.BALANCE_TABLE_SUCCESS, inventories } }
    //     function failure(error) { return { type:  inventoryFiscalConstants.BALANCE_TABLE_FAILURE, error } }
    // },


    // dataTableReportInventoriesPlus(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.inventoryTableReportPlus(user, pageIndex, pageSize, sortBy, filters, isExcel)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                     if(isExcel){
    //                         dispatch(reset())
    //                     }
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
    //     function success(inventories) { 
    //         if(!isExcel){
    //             return { type: inventoryFiscalConstants.INVENTORY_TABLE_SUCCESS, inventories }
    //         }else{
    //             let data = inventories;
    //             return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
    //         }
    //     }
    //     function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
    //     function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    // },

    // dataTableReportInventoriesDaily(user) {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.inventoryTableReportDaily(user)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: inventoryFiscalConstants.INVENTORY_TABLE_REQUEST } }
    //     function success(inventories) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_SUCCESS, inventories } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_FAILURE, error } }
    // },

    dataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryFiscalService.inventoryFiscalTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    inventoriesFiscal => {
                        dispatch(success(inventoriesFiscal))
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

        function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventoriesFiscal) { 
            if(!isExcel){
                return { type: inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_SUCCESS, inventoriesFiscal }
            }else{
                let data = inventoriesFiscal;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    //Registrar inventario
    createInventoryFiscal(inventoryFiscal) {
        
        return dispatch => {
            dispatch(request(inventoryFiscal));

            inventoryFiscalService.inventoryFiscalCreate(inventoryFiscal)
                .then(
                    inventoryFiscal => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado el inventario correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(inventoryFiscal) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_CREATE_REQUEST, inventoryFiscal } }
        function success(inventoryFiscal) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_CREATE_SUCCESS, inventoryFiscal } }
        function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_CREATE_FAILURE, error } }
    },

    //Obtenr información inventario
    getInventoryFiscal(id) {
        return dispatch => {
            dispatch(request(id));

            inventoryFiscalService.inventoryGet(id)
                .then(
                    inventoryFiscal => {
                        dispatch(success(inventoryFiscal));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_GET_REQUEST, id } }
        function success(inventoryFiscal) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_GET_SUCCESS, inventoryFiscal } }
        function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_FISCAL_GET_FAILURE, error } }
    },

    // //Actualizar información inventario
    // updateInventory(id, inventory) {
    //     return dispatch => {
    //         dispatch(request(inventory));

    //         inventoryFiscalService.inventoryUpdate(id,inventory)
    //             .then(
    //                 inventory => {
    //                     dispatch(success(inventory));
    //                     dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request(id) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_REQUEST, id } }
    //     function success(inventory) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_SUCCESS, inventory } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_FAILURE, error } }
    // },

    // //Resetear producto en inventario
    // resetInventory(id, inventory) {
    //     return dispatch => {
    //         dispatch(request(inventory));

    //         inventoryFiscalService.inventoryReset(id,inventory)
    //             .then(
    //                 inventory => {
    //                     dispatch(success(inventory));
    //                     dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request(id) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_REQUEST, id } }
    //     function success(inventory) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_SUCCESS, inventory } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_FAILURE, error } }
    // },

    // //Actualizar información inventario reajuste
    // updateInventoryReadjustment(id, inventory) {
    //     return dispatch => {
    //         dispatch(request(inventory));

    //         inventoryFiscalService.inventoryReadjustment(id,inventory)
    //             .then(
    //                 inventory => {
    //                     dispatch(success(inventory));
    //                     dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request(id) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_REQUEST, id } }
    //     function success(inventory) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_SUCCESS, inventory } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_UPDATE_FAILURE, error } }
    // },

    // //Actualizar información carrera
    // listInventories() {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.inventoryList()
    //             .then(
    //                 list => {
    //                     dispatch(success(list));
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: inventoryFiscalConstants.INVENTORY_SELECT_REQUEST } }
    //     function success(list) { return { type: inventoryFiscalConstants.INVENTORY_SELECT_SUCCESS, list } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_SELECT_FAILURE, error } }
    // },

    // //Detalle de mermas
    // inventoryDetailDecrease(detail) {
    //     return (dispatch, getState ) => {
            
    //         //Abortar consultas anteriores si existen
    //         const { controller } = getState().inventories;
    //         if(controller){
    //             controller.abort();
    //         }
            
    //         const newController = new AbortController();
    //         dispatch(request(newController));

    //         inventoryFiscalService.inventoryDetailDecreases(detail, newController)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request(newController) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
    //     function success(inventories) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_FAILURE, error } }
    // },

    // //Detalle de salidas
    // inventoryDetailDepartures(detail) {
    //     return (dispatch, getState ) => {
            
    //         //Abortar consultas anteriores si existen
    //         const { controller } = getState().inventories;
    //         if(controller){
    //             controller.abort();
    //         }
            
    //         const newController = new AbortController();
    //         dispatch(request(newController));

    //         inventoryFiscalService.inventoryDetailDepartures(detail, newController)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request(newController) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
    //     function success(inventories) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_FAILURE, error } }
    // },

    // //Detalle de recortes
    // inventoryDetailCut(detail) {
    //     return (dispatch, getState ) => {
            
    //         //Abortar consultas anteriores si existen
    //         const { controller } = getState().inventories;
    //         if(controller){
    //             controller.abort();
    //         }
            
    //         const newController = new AbortController();
    //         dispatch(request(newController));

    //         inventoryFiscalService.inventoryDetailCut(detail, newController)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request(newController) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
    //     function success(inventories) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
    //     function failure(error) { return { type: inventoryFiscalConstants.INVENTORY_TABLE_DETAIL_FAILURE, error } }
    // },

    // //historial de ajustes de inventario fisico
    // dataTableAdjustmentHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.inventoryTableAdjustmentHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                     if(isExcel){
    //                         dispatch(reset())
    //                     }
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
    //     function success(inventories) { 
    //         if(!isExcel){
    //             return { type: inventoryFiscalConstants.INVENTORY_TABLE_SUCCESS, inventories }
    //         }else{
    //             let data = inventories;
    //             return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
    //         }
    //     }
    //     function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
    //     function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    // },

    // dataTableEntryHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    //     return dispatch => {
    //         dispatch(request());

    //         inventoryFiscalService.inventoryEntryTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
    //             .then(
    //                 inventories => {
    //                     dispatch(success(inventories))
    //                     if(isExcel){
    //                         dispatch(reset())
    //                     }
    //                 },
    //                 error => {
    //                     dispatch(failure(error.toString()));
    //                     dispatch(alertActions.error(error.toString()));
    //                 }
    //             );
    //     };

    //     function request() { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
    //     function success(inventories) { 
    //         if(!isExcel){
    //             return { type: inventoryFiscalConstants.INVENTORY_TABLE_SUCCESS, inventories }
    //         }else{
    //             let data = inventories;
    //             return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
    //         }
    //     }
    //     function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
    //     function failure(error) { return { type: !isExcel ? inventoryFiscalConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    // },

};
