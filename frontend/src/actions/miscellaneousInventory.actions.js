/* eslint-disable */
import { miscellaneousInventoryConstants, downloadConstants } from '../constants';
import { miscellaneousInventoryService } from '../services';
import { alertActions } from '.';

export const miscellaneousInventoryActions = {

    //Registrar inventario
    createInventory(inventory) {
        return dispatch => {
            dispatch(request(inventory));

            miscellaneousInventoryService.inventoryCreate(inventory)
                .then(
                    inventory => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha enviado el pedido correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_REQUEST, inventory } }
        function success(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_SUCCESS, inventory } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_FAILURE, error } }
    },
    
    dataTable(user) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryTable(user)
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

        function request() { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST } }
        function success(inventories) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE, error } }
    },
    
    //Actualizar información inventario reajuste
    updateInventoryReadjustment(id, inventory) {
        return dispatch => {
            dispatch(request(inventory));

            miscellaneousInventoryService.inventoryReadjustment(id,inventory)
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

        function request(id) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_REQUEST, id } }
        function success(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_SUCCESS, inventory } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_FAILURE, error } }
    },

    //Registrar salida
    createDeparture(departure) {
        return dispatch => {
            dispatch(request(departure));

            miscellaneousInventoryService.departureCreate(departure)
                .then(
                    sale => { 
                        dispatch(success(sale));
                        dispatch(alertActions.success('¡Se ha registrado la salida correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_REQUEST, inventory } }
        function success(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_SUCCESS, inventory } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_FAILURE, error } }
    },

    dataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    // Reporte de inventario
    dataTableReportInventories(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryTableReport(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    updatePending(id, pending) {
        return dispatch => {
            dispatch(request());
            miscellaneousInventoryService.pendingUpdate(id, pending)
            .then((pending) => {
                dispatch(success(pending));
                dispatch(alertActions.success('¡Se ha actualizado el pedido correctamente!'));
            }, (error) => {
                dispatch(failure(error.toString()));
                dispatch(alertActions.error(error.toString())); 
            } ) }

            function request() { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_PENDING_REQUEST } }
            function success(pending) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_PENDING_SUCCESS, pending } }
            function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_PENDING_FAILURE, error } }
    },






























    //Historial de salida por venta
    dataTableSell(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryReportSales(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    //Historial de salida por ofertas
    dataTableOffers(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryReportOffers(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },




    dataTableReportInventoriesPlus(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryTableReportPlus(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    dataTableReportInventoriesDaily(user) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryTableReportDaily(user)
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

        function request() { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST } }
        function success(inventories) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE, error } }
    },


    //Obtenr información inventario
    getInventory(id) {
        return dispatch => {
            dispatch(request(id));

            miscellaneousInventoryService.inventoryGet(id)
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

        function request(id) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_GET_REQUEST, id } }
        function success(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_GET_SUCCESS, inventory } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_GET_FAILURE, error } }
    },

    //Actualizar información inventario
    updateInventory(id, inventory) {
        return dispatch => {
            dispatch(request(inventory));

            miscellaneousInventoryService.inventoryUpdate(id,inventory)
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

        function request(id) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_REQUEST, id } }
        function success(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_SUCCESS, inventory } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_FAILURE, error } }
    },

    //Resetear producto en inventario
    resetInventory(id, inventory) {
        return dispatch => {
            dispatch(request(inventory));

            miscellaneousInventoryService.inventoryReset(id,inventory)
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

        function request(id) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_REQUEST, id } }
        function success(inventory) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_SUCCESS, inventory } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_FAILURE, error } }
    },


    //Actualizar información carrera
    listInventories() {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryList()
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

        function request() { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_SELECT_REQUEST } }
        function success(list) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_SELECT_SUCCESS, list } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_SELECT_FAILURE, error } }
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

            miscellaneousInventoryService.inventoryDetailDecreases(detail, newController)
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

        function request(newController) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(inventories) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_FAILURE, error } }
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

            miscellaneousInventoryService.inventoryDetailDepartures(detail, newController)
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

        function request(newController) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(inventories) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_FAILURE, error } }
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

            miscellaneousInventoryService.inventoryDetailCut(detail, newController)
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

        function request(newController) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_REQUEST, controller:newController  } }
        function success(inventories) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_SUCCESS, inventories } }
        function failure(error) { return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_FAILURE, error } }
    },

    //historial de ajustes de inventario fisico
    dataTableAdjustmentHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryTableAdjustmentHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    dataTableEntryHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryService.inventoryEntryTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
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

        function request() { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(inventories) { 
            if(!isExcel){
                return { type: miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS, inventories }
            }else{
                let data = inventories;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

};
