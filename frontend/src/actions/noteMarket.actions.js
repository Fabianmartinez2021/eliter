/* eslint-disable */
import { noteMarketConstants, downloadConstants } from '../constants';
import { noteMarketService } from '../services';
import { alertActions } from './';

export const noteMarketActions = {
  //Obtener tabla de notas de entrega
  dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
    return (dispatch) => {
      dispatch(request());

      noteMarketService
        .noteMarketTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
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
          ? noteMarketConstants.NOTE_MARKET_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(data) {
      if (!isExcel) {
        return { type: noteMarketConstants.NOTE_MARKET_TABLE_SUCCESS, data };
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
          ? noteMarketConstants.NOTE_MARKET_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  //Obtener una nota de entrega por ID
  getNoteMarket(id) {
    return (dispatch) => {
      dispatch(request(id));

      noteMarketService
        .getNoteMarket(id)
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
      return { type: noteMarketConstants.NOTE_MARKET_GET_REQUEST, id };
    }
    function success(note) {
      return { type: noteMarketConstants.NOTE_MARKET_GET_SUCCESS, note };
    }
    function failure(error) {
      return { type: noteMarketConstants.NOTE_MARKET_GET_FAILURE, error };
    }
  },

  //Actualizar una nota de entrega
  updateNoteMarket(id, data) {
    return (dispatch) => {
      dispatch(request(data));

      noteMarketService
        .updateNoteMarket(id, data)
        .then(
          (note) => {
            dispatch(success(note));
            dispatch(alertActions.success('¡La nota de entrega ha sido actualizada correctamente!'));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request(data) {
      return { type: noteMarketConstants.NOTE_MARKET_UPDATE_REQUEST, data };
    }
    function success(note) {
      return { type: noteMarketConstants.NOTE_MARKET_UPDATE_SUCCESS, note };
    }
    function failure(error) {
      return { type: noteMarketConstants.NOTE_MARKET_UPDATE_FAILURE, error };
    }
  },
};

