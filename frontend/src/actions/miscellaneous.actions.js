/* eslint-disable */
import { downloadConstants, miscellaneousConstants } from '../constants';

import { miscellaneousService } from '../services';
import { alertActions, salesActions } from './';

export const miscellaneousActions = {

    dataPending(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return (dispatch) => {
          dispatch(request());
    
         miscellaneousService.pendingTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
            .then(
              (pending) => {
                dispatch(success(pending));
                if (isExcel) {
                  dispatch(reset())
                }
              },
              (error) => {
                dispatch(failure(error.toString()));
                dispatch(alertActions.error(error.toString()))
              }
            )
        }
    
        function request() {
          return {
            type: !isExcel
              ? miscellaneousConstants.MISCELLANEOUS_PENDING_REQUEST
              : downloadConstants.EXCEL_TABLE_REQUEST,
          };
        }
        function success(pending) {
          if (!isExcel) {
            return { type: miscellaneousConstants.MISCELLANEOUS_PENDING_SUCCESS, pending };
          } else {
            let data = pending;
            return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
          }
        }
        function reset() {
          return { type: downloadConstants.EXCEL_TABLE_RESET };
        }
        function failure(error) {
          return {
            type: !isExcel
              ? miscellaneousConstants.MISCELLANEOUS_PENDING_FAILURE
              : downloadConstants.EXCEL_TABLE_FAILURE,
            error,
          };
    
      }
    
    },

    //Registrar producto
    createProduct(data) {
        return dispatch => {
            dispatch(request(data));

            miscellaneousService.miscellaneousCreate(data)
                .then(
                    product => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado la producto correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: miscellaneousConstants.MISCELLANEOUS_CREATE_REQUEST } }
        function success() { return { type: miscellaneousConstants.MISCELLANEOUS_CREATE_SUCCESS } }
        function failure() { return { type: miscellaneousConstants.MISCELLANEOUS_CREATE_FAILURE } }
    },

    dataTable() {
        return dispatch => {
            dispatch(request());

            miscellaneousService.miscellaneousTable()
                .then(
                    miscellaneous => {
                        dispatch(success(miscellaneous))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: miscellaneousConstants.MISCELLANEOUS_TABLE_REQUEST } }
        function success(miscellaneous) { return { type: miscellaneousConstants.MISCELLANEOUS_TABLE_SUCCESS, miscellaneous } }
        function failure(error) { return { type: miscellaneousConstants.MISCELLANEOUS_TABLE_FAILURE, error } }
    },

    //Obtenr información producto
    getProduct(id) {
        return dispatch => {
            dispatch(request());

            miscellaneousService.miscellaneousGet(id)
                .then(
                    product => {
                        dispatch(success(product));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: miscellaneousConstants.MISCELLANEOUS_GET_REQUEST } }
        function success(product) { return { type: miscellaneousConstants.MISCELLANEOUS_GET_SUCCESS, product } }
        function failure(error) { return { type: miscellaneousConstants.MISCELLANEOUS_GET_FAILURE, error } }
    },

    //Actualizar información producto
    updateProduct(id, product, user) {
        return dispatch => {
            dispatch(request());

            miscellaneousService.miscellaneousUpdate(id, product)
                .then(
                    product => {
                        dispatch(success(product));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));

                        //Actualizar en el storage venta, monedas, productos y terminales de la sucursal 
                        dispatch(salesActions.salesDataFormUpdate(user.agency.id));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: miscellaneousConstants.MISCELLANEOUS_UPDATE_REQUEST } }
        function success(product) { return { type: miscellaneousConstants.MISCELLANEOUS_UPDATE_SUCCESS, product } }
        function failure(error) { return { type: miscellaneousConstants.MISCELLANEOUS_UPDATE_FAILURE, error } }
    },

    // Historial de las acciones a los produsuministros
    dataTableHistory(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            miscellaneousService.miscellaneousTableHistory(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    miscellaneous => {
                        dispatch(success(miscellaneous))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: miscellaneousConstants.MISCELLANEOUS_TABLE_REQUEST } }
        function success(miscellaneous) { return { type: miscellaneousConstants.MISCELLANEOUS_TABLE_SUCCESS, miscellaneous } }
        function failure(error) { return { type: miscellaneousConstants.MISCELLANEOUS_TABLE_FAILURE, error } }
    },
















    //Obtener listado de productos
    listMiscellaneous() {
        return dispatch => {
            dispatch(request());

            miscellaneousService.productList()
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

        function request() { return { type: miscellaneousConstants.MISCELLANEOUS_SELECT_REQUEST } }
        function success(list) { return { type: miscellaneousConstants.MISCELLANEOUS_SELECT_SUCCESS, list } }
        function failure(error) { return { type: miscellaneousConstants.MISCELLANEOUS_SELECT_FAILURE, error } }
    },
    accepteMiscellaneous(id, comment) {
      return (dispatch) => {
        dispatch(request());
    
        miscellaneousService.accepteMiscellaneous(id, comment).then(
          (pending) => {
            dispatch(success(pending));
            dispatch(alertActions.success("Factura anulada correctamente"));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
      };
    
      function request() {
        return { type: miscellaneousConstants.MISCELLANEOUS_ACCEPT_REQUEST };
      }
      function success(pending) {
        return { type: miscellaneousConstants.MISCELLANEOUS_ACCEPT_SUCCESS, pending };
      }
      function failure(error) {
        return { type: miscellaneousConstants.MISCELLANEOUS_ACCEPT_FAILURE, error };
      }
    },
    getPendingById(id){
      return (dispatch) => {
        dispatch(request());

        miscellaneousService.getPendingById(id).then(

          (pending) => {
            dispatch(success(pending));
          },
          (error) => {
            dispatch(failure(error));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: miscellaneousConstants.MISCELLANEOUS_GET_PENDING_REQUEST };
    }
    function success(pending) {
      return { type: miscellaneousConstants.MISCELLANEOUS_GET_PENDING_SUCCESS, pending };
    }
    function failure(error) {
      return { type: miscellaneousConstants.MISCELLANEOUS_GET_PENDING_FAILURE, error };
    } 
    },

};
