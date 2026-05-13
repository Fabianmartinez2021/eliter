/* eslint-disable */
import { inventoryConstants, downloadConstants } from '../constants';
import { inventoryService } from '../services';
import { alertActions } from './';

export const inventoryActions = {

    dataTable(user) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTable(user)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: inventoryConstants.INVENTORY_TABLE_REQUEST } }
        function success(inventories) { return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_TABLE_FAILURE, error } }
    },

    //Historial de salida por venta
    dataTableSell(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryReportSales(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    //Historial de salida por ofertas
    dataTableOffers(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryReportOffers(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    dataTableReportInventories(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTableReport(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    dataTableReportBalance(user, filters) {
        return dispatch => {
            dispatch(request());

            inventoryService.balanceTableReport(user, filters)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: inventoryConstants.BALANCE_TABLE_REQUEST } }
        function success(inventories) { return { type: inventoryConstants.BALANCE_TABLE_SUCCESS, inventories } }
        function failure(error) { return { type:  inventoryConstants.BALANCE_TABLE_FAILURE, error } }
    },


    dataTableReportInventoriesPlus(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTableReportPlus(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    // Reporte de inventarios resumido por agencia
    dataTableReportInventoriesSummaryAgency(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTableReportSummaryAgency(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                        if (isExcel) {
                            dispatch(reset())
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST : downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) {
            if (!isExcel) {
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            } else {
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE : downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    dataTableReportInventoriesDaily(user) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTableReportDaily(user)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: inventoryConstants.INVENTORY_TABLE_REQUEST } }
        function success(inventories) { return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_TABLE_FAILURE, error } }
    },

    dataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    //Registrar inventario
    createInventory(inventory) {
        
        return dispatch => {
            dispatch(request(inventory));

            inventoryService.inventoryCreate(inventory)
                .then(
                    inventory => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado el inventario correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(inventory) { return { type: inventoryConstants.INVENTORY_CREATE_REQUEST, inventory } }
        function success(inventory) { return { type: inventoryConstants.INVENTORY_CREATE_SUCCESS, inventory } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_CREATE_FAILURE, error } }
    },

    //Obtenr información inventario
    getInventory(id) {
        return dispatch => {
            dispatch(request(id));

            inventoryService.inventoryGet(id)
                .then(
                    inventory => {
                        dispatch(success(inventory));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: inventoryConstants.INVENTORY_GET_REQUEST, id } }
        function success(inventory) { return { type: inventoryConstants.INVENTORY_GET_SUCCESS, inventory } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_GET_FAILURE, error } }
    },

    //Actualizar información inventario
    updateInventory(id, inventory) {
        return dispatch => {
            dispatch(request(inventory));

            inventoryService.inventoryUpdate(id,inventory)
                .then(
                    inventory => {
                        dispatch(success(inventory));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: inventoryConstants.INVENTORY_UPDATE_REQUEST, id } }
        function success(inventory) { return { type: inventoryConstants.INVENTORY_UPDATE_SUCCESS, inventory } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_UPDATE_FAILURE, error } }
    },

    //Resetear producto en inventario
    resetInventory(id, inventory) {
        return dispatch => {
            dispatch(request(inventory));

            inventoryService.inventoryReset(id,inventory)
                .then(
                    inventory => {
                        dispatch(success(inventory));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: inventoryConstants.INVENTORY_UPDATE_REQUEST, id } }
        function success(inventory) { return { type: inventoryConstants.INVENTORY_UPDATE_SUCCESS, inventory } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_UPDATE_FAILURE, error } }
    },

    //Actualizar información inventario reajuste
    updateInventoryReadjustment(id, inventory) {
        return dispatch => {
            dispatch(request(inventory));

            inventoryService.inventoryReadjustment(id,inventory)
                .then(
                    inventory => {
                        dispatch(success(inventory));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: inventoryConstants.INVENTORY_UPDATE_REQUEST, id } }
        function success(inventory) { return { type: inventoryConstants.INVENTORY_UPDATE_SUCCESS, inventory } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_UPDATE_FAILURE, error } }
    },

    //Actualizar información carrera
    listInventories() {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryList()
                .then(
                    list => {
                        dispatch(success(list));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: inventoryConstants.INVENTORY_SELECT_REQUEST } }
        function success(list) { return { type: inventoryConstants.INVENTORY_SELECT_SUCCESS, list } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_SELECT_FAILURE, error } }
    },

    //Detalle de mermas
    inventoryDetailDecrease(detail) {
        return (dispatch, getState ) => {
            
            //Abortar consultas anteriores si existen
            const { controller } = getState().inventories;
            if(controller){
                controller.abort();
            }
            
            const newController = new AbortController();
            dispatch(request(newController));

            inventoryService.inventoryDetailDecreases(detail, newController)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(newController) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(inventories) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_FAILURE, error } }
    },

    //Detalle de salidas
    inventoryDetailDepartures(detail) {
        return (dispatch, getState ) => {
            
            //Abortar consultas anteriores si existen
            const { controller } = getState().inventories;
            if(controller){
                controller.abort();
            }
            
            const newController = new AbortController();
            dispatch(request(newController));

            inventoryService.inventoryDetailDepartures(detail, newController)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(newController) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(inventories) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_FAILURE, error } }
    },

    //Detalle de recortes
    inventoryDetailCut(detail) {
        return (dispatch, getState ) => {
            
            //Abortar consultas anteriores si existen
            const { controller } = getState().inventories;
            if(controller){
                controller.abort();
            }
            
            const newController = new AbortController();
            dispatch(request(newController));

            inventoryService.inventoryDetailCut(detail, newController)
                .then(
                    inventories => {
                        dispatch(success(inventories))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(newController) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(inventories) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
        function failure(error) { return { type: inventoryConstants.INVENTORY_TABLE_DETAIL_FAILURE, error } }
    },

    //historial de ajustes de inventario fisico
    dataTableAdjustmentHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryTableAdjustmentHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    dataTableEntryHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            inventoryService.inventoryEntryTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: inventoryConstants.INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? inventoryConstants.INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

};
