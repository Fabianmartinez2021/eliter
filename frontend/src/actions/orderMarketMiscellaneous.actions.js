/* eslint-disable */
import { orderMarketMiscellaneousConstants, downloadConstants } from '../constants';
import { orderMarketMiscellaneousService } from '../services';
import { alertActions } from './';

export const orderMarketMiscellaneousActions = {
  //Obtener tabla de notas de entrega de suministros
  dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
    return (dispatch) => {
      dispatch(request());

      orderMarketMiscellaneousService
        .orderMarketMiscellaneousTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (data) => {
            dispatch(success(data));
            if (isExcel) {
              dispatch(reset());
            }
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return {
        type: !isExcel
          ? orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(data) {
      if (!isExcel) {
        return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_TABLE_SUCCESS, data };
      } else {
        let excelData = data;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data: excelData };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  //Obtener una nota de suministro por ID
  getOrderMarketMiscellaneous(id) {
    return (dispatch) => {
      dispatch(request(id));

      orderMarketMiscellaneousService
        .getOrderMarketMiscellaneous(id)
        .then(
          (note) => {
            dispatch(success(note));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request(id) {
      return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_GET_REQUEST, id };
    }
    function success(note) {
      return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_GET_SUCCESS, note };
    }
    function failure(error) {
      return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_GET_FAILURE, error };
    }
  },

  //Actualizar una nota de suministro
  updateOrderMarketMiscellaneous(id, data) {
    return (dispatch) => {
      dispatch(request(data));

      orderMarketMiscellaneousService
        .updateOrderMarketMiscellaneous(id, data)
        .then(
          (note) => {
            dispatch(success(note));
            dispatch(alertActions.success('¡La nota de entrega de suministros ha sido actualizada correctamente!'));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request(data) {
      return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_UPDATE_REQUEST, data };
    }
    function success(note) {
      return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_UPDATE_SUCCESS, note };
    }
    function failure(error) {
      return { type: orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_UPDATE_FAILURE, error };
    }
  },
};
