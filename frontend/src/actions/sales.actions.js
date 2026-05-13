/* eslint-disable */
import { salesConstants, downloadConstants } from "../constants";
import { salesService, offlineService, dataService } from "../services";
import { alertActions, pedingActions } from "./";
import { dataActions } from "./data.actions";

export const salesActions = {
  //Ventas generales (No usado se usa @dataTableUser)
  dataTable() {
    return (dispatch) => {
      dispatch(request());

      salesService.salesTable().then(
        (sales) => {
          dispatch(success(sales));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },

  //Ventas generales
  dataTableUser(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .salesTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (sales) => {
            dispatch(success(sales));
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
          ? salesConstants.SALES_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(sales) {
      if (!isExcel) {
        return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
      } else {
        let data = sales;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesConstants.SALES_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  //Ventas del dia
  dataTableDaily(user) {
    return (dispatch) => {
      dispatch(request());

      salesService.salesTableDaily(user).then(
        (sales) => {
          dispatch(success(sales));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },

  //Registrar venta
  createSale(sales) {
    return (dispatch) => {
      dispatch(request(sales));

      salesService.salesCreate(sales).then(
        (sale) => {
          dispatch(success(sale));
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

    function request(sales) {
      return { type: salesConstants.SALES_CREATE_REQUEST, sales };
    }
    function success(sale) {
      return { type: salesConstants.SALES_CREATE_SUCCESS, sale };
    }
    function failure(error) {
      return { type: salesConstants.SALES_CREATE_FAILURE, error };
    }
  },

  //Registrar ventas offline
  processSalesOffline(sales) {
    return (dispatch) => {
      dispatch(request(sales));

      salesService.salesOffline(sales).then(
        () => {
          dispatch(success(sales));
          //limpiar data de redux y local storage
          dispatch(pedingActions.updateSaleOffline([]));
          offlineService.removeOfflineData();
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

    function request(sales) {
      return { type: salesConstants.SALES_CREATE_OFFLINE_REQUEST, sales };
    }
    function success(sales) {
      return { type: salesConstants.SALES_CREATE_OFFLINE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_CREATE_OFFLINE_FAILURE, error };
    }
  },

  //Obtenr información venta
  getSale(id) {
    return (dispatch) => {
      dispatch(request(id));

      salesService.salesGet(id).then(
        (sales) => {
          dispatch(success(sales));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(id) {
      return { type: salesConstants.SALES_GET_REQUEST, id };
    }
    function success(sales) {
      return { type: salesConstants.SALES_GET_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_GET_FAILURE, error };
    }
  },

  //Actualizar información venta
  updateSale(id, sales) {
    return (dispatch) => {
      dispatch(request(sales));

      salesService.salesUpdate(id, sales).then(
        (sales) => {
          dispatch(success(sales));
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
      return { type: salesConstants.SALES_UPDATE_REQUEST, id };
    }
    function success(sales) {
      return { type: salesConstants.SALES_UPDATE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_UPDATE_FAILURE, error };
    }
  },

  listSales() {
    return (dispatch) => {
      dispatch(request());

      salesService.salesList().then(
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
      return { type: salesConstants.SALES_SELECT_REQUEST };
    }
    function success(list) {
      return { type: salesConstants.SALES_SELECT_SUCCESS, list };
    }
    function failure(error) {
      return { type: salesConstants.SALES_SELECT_FAILURE, error };
    }
  },

  //Obtener data para venta, monedas, productos y terminales de la sucursal
  salesDataForm(id) {
    return (dispatch) => {
      dispatch(request(id));

      salesService.salesDataForm(id).then(
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
      return { type: salesConstants.SALES_DATA_REQUEST, id };
    }
    function success(data) {
      return { type: salesConstants.SALES_DATA_SUCCESS, data };
    }
    function failure(error) {
      return { type: salesConstants.SALES_DATA_FAILURE, error };
    }
  },

  /**
   * Obtener data para venta, monedas, productos y terminales de la sucursal
   * para uso offline
   * - Se ejecuta a los 10 segundos de inactividad
   * - Consulta si el timer sobrepasa la fecha del timer
   * - recibe id de usuario
   */
  salesDataFormOffline(id) {
    return (dispatch) => {
      //Chequear la fecha del timer y consultar
      dataService
        .checkIfUpdateData()
        .then(() => {
          dispatch(request(id));

          salesService.salesDataForm(id).then(
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
      return { type: salesConstants.SALES_DATA_REQUEST, id };
    }
    function success(data) {
      return { type: salesConstants.SALES_DATA_SUCCESS, data };
    }
  },

  /**
   * Obtener data para venta, monedas, productos y terminales de la sucursal
   * luego de actualizar alguna terminal, producto o moneda
   */
  salesDataFormUpdate(id) {
    return (dispatch) => {
      dispatch(request(id));

      salesService.salesDataForm(id).then(
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
      return { type: salesConstants.SALES_DATA_UPDATE_REQUEST, id };
    }
    function success(data) {
      return { type: salesConstants.SALES_DATA_UPDATE_SUCCESS, data };
    }
  },

  salesPaymentMethods(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .salesPaymentMethods(
          user,
          pageIndex,
          pageSize,
          sortBy,
          filters,
          isExcel
        )
        .then(
          (sales) => {
            dispatch(success(sales));
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
          ? salesConstants.SALES_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(sales) {
      if (!isExcel) {
        return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
      } else {
        let data = sales;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesConstants.SALES_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  salesPaymentMethodsClose(data) {
    return (dispatch) => {
      dispatch(request(data));

      salesService.salesPaymentMethodsClose(data).then(
        (sale) => {
          dispatch(success(sale));
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

    function request(sales) {
      return { type: salesConstants.SALES_CREATE_REQUEST, sales };
    }
    function success(sale) {
      return { type: salesConstants.SALES_CREATE_SUCCESS, sale };
    }
    function failure(error) {
      return { type: salesConstants.SALES_CREATE_FAILURE, error };
    }
  },

  salesPaymentMethodsHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .salesPaymentMethodsHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (sales) => {
            dispatch(success(sales));
            if (isExcel) {
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
          ? salesConstants.SALES_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST
      };
    }
    function success(sales) {
      if (!isExcel) {
        return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
      } else {
        let data = sales;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesConstants.SALES_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  salesPaymentMethodsChart(user, filters) {
    return (dispatch) => {
      dispatch(request());

      salesService.salesPaymentMethodsChart(user, filters).then(
        (sales) => {
          dispatch(success(sales));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },

  salesPaymentMethodsGeneralReportHistory(
    user,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    isExcel
  ) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .salesPaymentMethodsGeneralReportHistory(
          user,
          pageIndex,
          pageSize,
          sortBy,
          filters,
          isExcel
        )
        .then(
          (sales) => {
            dispatch(success(sales));
            if (isExcel) {
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
          ? salesConstants.SALES_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST
      };
    }
    function success(sales) {
      if (!isExcel) {
        return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
      } else {
        let data = sales;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? salesConstants.SALES_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };
    }
  },

  //Detalle de pago de monedas: reporte de formas de pago
  salesDetailPaymentMethods(sale) {
    return (dispatch, getState) => {
      //Abortar consultas anteriores si existen
      const { controller } = getState().sales;
      if (controller) {
        controller.abort();
      }

      const newController = new AbortController();
      dispatch(request(newController));

      salesService.salesPaymentMethodsDetail(sale, newController).then(
        (sales) => {
          dispatch(success(sales));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request(newController) {
      return {
        type: salesConstants.SALES_TABLE_DETAIL_REQUEST,
        controller: newController,
      };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_DETAIL_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_DETAIL_FAILURE, error };
    }
  },

  salesCommissionReports(user, pageIndex, pageSize, sortBy, filters) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .salesCommissionReports(user, pageIndex, pageSize, sortBy, filters)
        .then(
          (sales) => {
            dispatch(success(sales));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },

  telesalesCommissionReports(user, pageIndex, pageSize, sortBy, filters) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .telesalesCommissionReports(user, pageIndex, pageSize, sortBy, filters)
        .then(
          (sales) => {
            dispatch(success(sales));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },

  //Ventas generales
  salesCombosChart(user, pageIndex, pageSize, sortBy, filters) {
    return (dispatch) => {
      dispatch(request());

      salesService
        .salesCombosChart(user, pageIndex, pageSize, sortBy, filters)
        .then(
          (sales) => {
            dispatch(success(sales));
          },
          (error) => {
            dispatch(failure(error.toString()));
            dispatch(alertActions.error(error.toString()));
          }
        );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(sales) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, sales };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },

  //Gráfico de ventas por tipo
  salesChart(user, filters) {
    return (dispatch) => {
      dispatch(request());

      salesService.salesChart(user, filters).then(
        (chartData) => {
          dispatch(success(chartData));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesConstants.SALES_CHART_REQUEST };
    }
    function success(chartData) {
      return { type: salesConstants.SALES_CHART_SUCCESS, chartData };
    }
    function failure(error) {
      return { type: salesConstants.SALES_CHART_FAILURE, error };
    }
  },

  //Obtener total semanal en tiempo real
  getWeeklyTotalRealtime(data) {
    return (dispatch) => {
      dispatch(request());

      salesService.getWeeklyTotalRealtime(data).then(
        (data) => {
          dispatch(success(data));
        },
        (error) => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
    };

    function request() {
      return { type: salesConstants.SALES_TABLE_REQUEST };
    }
    function success(data) {
      return { type: salesConstants.SALES_TABLE_SUCCESS, weeklyTotal: data };
    }
    function failure(error) {
      return { type: salesConstants.SALES_TABLE_FAILURE, error };
    }
  },
};
