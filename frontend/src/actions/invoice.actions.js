import { downloadConstants } from "../constants";
import { invoiceConstants } from "../constants/invoice.constants";
import { invoiceService } from '../services/invoice.service';
import { alertActions } from "./alert.actions";

export const invoiceActions = {

  //tickets generales
  dataTicketsInvoice(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
    return (dispatch) => {
      dispatch(request());

      invoiceService
        .invoiceTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
        .then(
          (invoice) => {
            dispatch(success(invoice));
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
          ? invoiceConstants.INVOICE_TABLE_REQUEST
          : downloadConstants.EXCEL_TABLE_REQUEST,
      };
    }
    function success(invoice) {
      if (!isExcel) {
        return { type: invoiceConstants.INVOICE_TABLE_SUCCESS, invoice };
      } else {
        let data = invoice;
        return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
      }
    }
    function reset() {
      return { type: downloadConstants.EXCEL_TABLE_RESET };
    }
    function failure(error) {
      return {
        type: !isExcel
          ? invoiceConstants.INVOICE_TABLE_FAILURE
          : downloadConstants.EXCEL_TABLE_FAILURE,
        error,
      };

  }

},
dataInvoiceTotalsByAgencyMonthly(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
  return (dispatch) => {
    dispatch(request());

    invoiceService
      .invoiceTotalsByAgencyMonthly(user, pageIndex, pageSize, sortBy, filters, isExcel)
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
    return { type: !isExcel ? invoiceConstants.INVOICE_TOTALS_REQUEST : downloadConstants.EXCEL_TABLE_REQUEST };
  }
  function success(totals) {
    if(!isExcel){
    return { type: invoiceConstants.INVOICE_TOTALS_SUCCESS, totals };}
      else{
        let data = totals;
      return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
    }
  }
  // function reset() {
  //   return { type: downloadConstants.EXCEL_TABLE_RESET };
  // }
  function failure(error) {
    return { type: !isExcel ? invoiceConstants.INVOICE_TOTALS_FAILURE : downloadConstants.EXCEL_TABLE_FAILURE, error };
  }
},
updateInvoice(id, updateFields) {
  return (dispatch) => {
    dispatch(request());

    invoiceService.updateInvoice(id, updateFields).then(
      (updatedInvoice) => {
        dispatch(success(updatedInvoice));
        dispatch(alertActions.success("Factura actualizada correctamente"));
      },
      (error) => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request() {
    return { type: invoiceConstants.UPDATE_INVOICE_REQUEST };
  }
  function success(invoice) {
    return { type: invoiceConstants.UPDATE_INVOICE_SUCCESS, invoice };
  }
  function failure(error) {
    return { type: invoiceConstants.UPDATE_INVOICE_FAILURE, error };
  }
},
getInvoiceById(id) {
  return (dispatch) => {
    dispatch(request());

    invoiceService.getInvoiceById(id).then(
      (invoice) => {
        dispatch(success(invoice));
      },
      (error) => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request() {
    return { type: invoiceConstants.GET_INVOICE_REQUEST };
  }
  function success(invoice) {
    return { type: invoiceConstants.GET_INVOICE_SUCCESS, invoice };
  }
  function failure(error) {
    return { type: invoiceConstants.GET_INVOICE_FAILURE, error };
  }
},
anulateInvoice(id, comment) {
  return (dispatch) => {
    dispatch(request());

    invoiceService.anulateInvoice(id, comment).then(
      (invoice) => {
        dispatch(success(invoice));
        dispatch(alertActions.success("Factura anulada correctamente"));
      },
      (error) => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request() {
    return { type: invoiceConstants.ANULATE_INVOICE_REQUEST };
  }
  function success(invoice) {
    return { type: invoiceConstants.ANULATE_INVOICE_SUCCESS, invoice };
  }
  function failure(error) {
    return { type: invoiceConstants.ANULATE_INVOICE_FAILURE, error };
  }
},
invoiceStatsByCompanyBranch(user, filters) {
  return (dispatch) => {
    dispatch(request());

    invoiceService.invoiceStatsByCompanyBranch(user, filters).then(
      (stats) => {
        dispatch(success(stats));
      },
      (error) => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request() {
    return { type: invoiceConstants.INVOICE_STATS_BY_COMPANY_BRANCH_REQUEST };
  }
  function success(stats) {
    return { type: invoiceConstants.INVOICE_STATS_BY_COMPANY_BRANCH_SUCCESS, stats };
  }
  function failure(error) {
    return { type: invoiceConstants.INVOICE_STATS_BY_COMPANY_BRANCH_FAILURE, error };
  }
},
paymentFiscalMethodsStatsByCompanyBranch(user, filters) {
  return (dispatch) => {
    dispatch(request());

    invoiceService.paymentFiscalMethodsStatsByCompanyBranch(user, filters).then(
      (stats) => {
        dispatch(success(stats));
      },
      (error) => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request() {
    return { type: invoiceConstants.PAYMENT_FISCAL_METHODS_STATS_BY_COMPANY_BRANCH_REQUEST };
  }
  function success(stats) {
    return { type: invoiceConstants.PAYMENT_FISCAL_METHODS_STATS_BY_COMPANY_BRANCH_SUCCESS, stats };
  }
  function failure(error) {
    return { type: invoiceConstants.PAYMENT_FISCAL_METHODS_STATS_BY_COMPANY_BRANCH_FAILURE, error };
  }
}
}