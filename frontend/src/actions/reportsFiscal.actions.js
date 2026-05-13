import { downloadConstants } from '../constants';
import { reportsFiscalConstans } from '../constants/reportsFiscal.constans';
import { alertActions } from './';
import { reportsFiscalService } from '../services/reportsFiscal.service';

export const reportsFiscalActions = {

    dataTableReportFiscal(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            reportsFiscalService.reportsFiscalTable(user, pageIndex, pageSize, sortBy, filters,isExcel)
                .then(
                    reportFiscal => {
                        dispatch(success(reportFiscal))
                        if(isExcel){
                            dispatch(reset())
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()))
                    }
                );
        };

        function request() { return { type: !isExcel ? reportsFiscalConstans.REPORTS_FISCAL_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST}}
        function success(reportFiscal) {
            if(!isExcel){
                return { type: reportsFiscalConstans.REPORTS_FISCAL_TABLE_SUCCESS, reportFiscal}
            }else{
                let data = reportFiscal;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data}
            }
        }
        function reset() {return { type: downloadConstants.EXCEL_TABLE_RESET}}
        function failure(error) { return { type: !isExcel ? reportsFiscalConstans.REPORTS_FISCAL_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error }}
    },

}