/* eslint-disable */
import { downloadConstants } from "../constants";
import { salesFiscalConstants } from "../constants/salesFiscal.constants";
import { dataService } from "../services";
import { offlineFiscalService } from "../services/offlineFiscal.service";
import { salesFiscalService } from "../services/salesFiscal.service";
import { alertActions } from "./";
import { pedingFiscalActions } from "./pendingFiscal.actions";
import { dataActions } from "./data.actions";

export const salesFiscalActions = {
  //Ventas generales (No usado se usa @dataTableUser)
  dataTableFiscal() {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService.salesFiscalTable().then(
        (salesFiscal) => {
          dispatch(success(salesFiscal));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE, error };
    }
  },

  //Ventas generales
  dataTableFiscalUser(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .salesFiscalTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
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
          ? salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(salesFiscal) {
      if (!isExcel) {
        return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
      } else {
        let data = salesFiscal;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  //Ventas del dia
  dataTableFiscalDaily(user) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService.salesFiscalTableDaily(user).then(
        (salesFiscal) => {
          dispatch(success(salesFiscal));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE, error };
    }
  },

  //Registrar venta
  createSaleFiscal(salesFiscal) {
    return (dispatch) => {
      dispatch(request(salesFiscal));

      salesFiscalService.salesFiscalCreate(salesFiscal).then(
        (saleFiscal) => {
          dispatch(success(saleFiscal));
          dispatch(
            alertActions.success("¡Se ha registrado la venta correctamente!")
          );
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_REQUEST, salesFiscal };
    }
    function success(saleFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_SUCCESS, saleFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_FAILURE, error };
    }
  },

  //Registrar ventas offline
  processSalesFiscalOffline(salesFiscal) {
    return (dispatch) => {
      dispatch(request(salesFiscal));

      salesFiscalService.salesFiscalOffline(salesFiscal).then(
        () => {
          dispatch(success(salesFiscal));
          //limpiar data de redux y local storage
          dispatch(pedingFiscalActions.updateSaleFiscalOffline([]));
          offlineFiscalService.removeOfflineData();
          dispatch(
            alertActions.success("¡Se han procesado las ventas correctamente!")
          );
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_OFFLINE_REQUEST, salesFiscal };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_OFFLINE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_OFFLINE_FAILURE, error };
    }
  },

  //Obtenr información venta
  getSaleFiscal(id) {
    return (dispatch) => {
      dispatch(request(id));

      salesFiscalService.salesFiscalGet(id).then(
        (salesFiscal) => {
          dispatch(success(salesFiscal));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(id) {
      return { type: salesFiscalConstants.SALES_FISCAL_GET_REQUEST, id };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_GET_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_GET_FAILURE, error };
    }
  },

  //Actualizar información venta
  updateSaleFiscal(id, salesFiscal) {
    return (dispatch) => {
      dispatch(request(salesFiscal));

      salesFiscalService.salesFiscalUpdate(id, salesFiscal).then(
        (salesFiscal) => {
          dispatch(success(salesFiscal));
          dispatch(
            alertActions.success(
              "Los datos han sido actualizados correctamente"
            )
          );
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(id) {
      return { type: salesFiscalConstants.SALES_FISCAL_UPDATE_REQUEST, id };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_UPDATE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_UPDATE_FAILURE, error };
    }
  },

  listSalesFiscal() {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService.salesFiscalList().then(
        (list) => {
          dispatch(success(list));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_SELECT_REQUEST };
    }
    function success(list) {
      return { type: salesFiscalConstants.SALES_FISCAL_SELECT_SUCCESS, list };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_SELECT_FAILURE, error };
    }
  },

  //Obtener data para venta, monedas, productos y terminales de la sucursal
  salesFiscalDataForm(id) {
    return (dispatch) => {
      dispatch(request(id));

      salesFiscalService.salesFiscalDataForm(id).then(
        (data) => {
          
          dispatch(success(data));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(id) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_REQUEST, id };
    }
    function success(data) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_SUCCESS, data };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_FAILURE, error };
    }
  },

  /**
   * Obtener data para venta, monedas, productos y terminales de la sucursal
   * para uso offline
   * - Se ejecuta a los 10 segundos de inactividad
   * - Consulta si el timer sobrepasa la fecha del timer
   * - recibe id de usuario
   */
  salesFiscalDataFormOffline(id) {
    return (dispatch) => {
      //Chequear la fecha del timer y consultar
      dataService
        .checkIfUpdateData()
        .then(() => {
          dispatch(request(id));

          salesFiscalService.salesFiscalDataForm(id).then(
            (data) => {
              dispatch(success(data));
              //actualizar en localStorage
              dataService.updateDataOffline(data);
              //actualizar en redux
              dispatch(dataActions.update(data));
            },
            //no hacer dispatch de error ya que puede estar offline
            (error) => {
              //reiniciar nuevamente el timer para no consultar consecutivamente si da error
              dataService.resetTimer();
              //console.log('error',error);
            }
          );
        })
        .catch((e) => {
          //console.log(e)
        });
    };

    function request(id) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_REQUEST, id };
    }
    function success(data) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_SUCCESS, data };
    }
  },

  /**
   * Obtener data para venta, monedas, productos y terminales de la sucursal
   * luego de actualizar alguna terminal, producto o moneda
   */
  salesFiscalDataFormUpdate(id) {
    return (dispatch) => {
      dispatch(request(id));

      salesFiscalService.salesFiscalDataForm(id).then(
        (data) => {
          dispatch(success(data));
          //actualizar en localStorage
          dataService.updateDataOffline(data);
          //actualizar en redux
          dispatch(dataActions.update(data));
        },
        //no hacer dispatch de error
        (error) => {
          //console.log('error',error);
        }
      );
    };

    function request(id) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_UPDATE_REQUEST, id };
    }
    function success(data) {
      return { type: salesFiscalConstants.SALES_FISCAL_DATA_UPDATE_SUCCESS, data };
    }
  },

  salesFiscalPaymentMethods(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .salesFiscalPaymentMethods(
          user,
          pageIndex,
          pageSize,
          sortBy,
          filters,
          isExcel
        )
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
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
          ? salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(salesFiscal) {
      if (!isExcel) {
        return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
      } else {
        let data = salesFiscal;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  salesFiscalPaymentMethodsClose(data) {
    return (dispatch) => {
      dispatch(request(data));

      salesFiscalService.salesFiscalPaymentMethodsClose(data)
      .then(
        (saleFiscal) => {
          dispatch(success(saleFiscal));
          dispatch(
            alertActions.success("¡Se ha realizado el registro correctamente!")
          );
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_REQUEST, salesFiscal };
    }
    function success(sale) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_SUCCESS, sale };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_CREATE_FAILURE, error };
    }
  },

  salesFiscalPaymentMethodsHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .salesFiscalPaymentMethodsHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
            if(isExcel){
              dispatch(reset())
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
        ? salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST
        : downloadConstants.EXCEL_TABLE_REQUEST 
      };
    }
    function success(salesFiscal) {
      if (!isExcel) {
        return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
      } else {
        let data = salesFiscal;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  salesFiscalPaymentMethodsChart(user, filters) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService.salesFiscalPaymentMethodsChart(user, filters).then(
        (salesFiscal) => {
          dispatch(success(salesFiscal));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE, error };
    }
  },

  salesFiscalPaymentMethodsGeneralReportHistory(
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .salesFiscalPaymentMethodsGeneralReportHistory(
          user,
          pageIndex,
          pageSize,
          sortBy,
          filters,
          isExcel
        )
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
            if(isExcel){
              dispatch(reset())
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
        ? salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST 
        : downloadConstants.EXCEL_TABLE_REQUEST 
      };
    }
    function success(salesFiscal) {
      if (!isExcel) {
        return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
      } else {
        let data = salesFiscal;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  //Detalle de pago de monedas: reporte de formas de pago
  salesFiscalDetailPaymentMethods(sale) {
    return (dispatch, getState) => {
      //Abortar consultas anteriores si existen
      const { controller } = getState().salesFiscal;
      if (controller) {
        controller.abort();
      }

      const newController = new AbortController();
      dispatch(request(newController));

      salesFiscalService.salesFiscalPaymentMethodsDetail(saleFiscal, newController).then(
        (salesFiscal) => {
          dispatch(success(salesFiscal));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(newController) {
      return {
        type: salesFiscalConstants.SALES_FISCAL_TABLE_DETAIL_REQUEST,
        controller: newController,
      };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_DETAIL_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_DETAIL_FAILURE, error };
    }
  },

  salesFiscalCommissionReports(user, pageIndex, pageSize, sortBy, filters) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .salesFiscalCommissionReports(user, pageIndex, pageSize, sortBy, filters)
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE, error };
    }
  },

  telesalesFiscalCommissionReports(user, pageIndex, pageSize, sortBy, filters) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .telesalesFiscalCommissionReports(user, pageIndex, pageSize, sortBy, filters)
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE, error };
    }
  },

  //Ventas generales
  salesFiscalCombosChart(user, pageIndex, pageSize, sortBy, filters) {
    return (dispatch) => {
      dispatch(request());

      salesFiscalService
        .salesFiscalCombosChart(user, pageIndex, pageSize, sortBy, filters)
        .then(
          (salesFiscal) => {
            dispatch(success(salesFiscal));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST };
    }
    function success(salesFiscal) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS, salesFiscal };
    }
    function failure(error) {
      return { type: salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE, error };
    }
  },
  dataInvoiceTotalsByCompany(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
    return (dispatch) => {
      dispatch(request());
  
      salesFiscalService
        .invoiceTotalsByCompany(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (totals) => {
            dispatch(success(totals));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };
  
    function request() {
      return { type: !isExcel ? salesFiscalConstants.INVOICE_TOTALS_COMPANY_REQUEST : downloadConstants.EXCEL_TABLE_REQUEST };
    }
    function success(totals) {
      if (!isExcel) {
        return { type: salesFiscalConstants.INVOICE_TOTALS_COMPANY_SUCCESS, totals };
      } else {
        let data = totals;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return { type: !isExcel ? salesFiscalConstants.INVOICE_TOTALS_COMPANY_FAILURE : downloadConstants.EXCEL_TABLE_FAILURE, error };   
    }
  }
};
