/* eslint-disable */
import { offlineFiscalConstants} from '../constants/offlineFiscal.constants'
import { offlineFiscalService } from '../services/offlineFiscal.service';
import { alertActions} from '.';
import { pedingFiscalActions } from './pendingFiscal.actions';

export const offlineFiscalActions = {

    addSaleFiscalOffline(saleFiscal) {
        return dispatch => {
            dispatch(request());

            offlineFiscalService.addSaleFiscalOffline(saleFiscal)
                .then(
                    (dataSale) => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha guardado la venta correctamente!'));
                        dispatch(pedingFiscalActions.updateSaleFiscalOffline(dataSale));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: offlineFiscalConstants.SALES_FISCAL_OFFLINE_CREATE_REQUEST } }
        function success() { return { type: offlineFiscalConstants.SALES_FISCAL_OFFLINE_CREATE_SUCCESS } }
        function failure(error) { return { type: offlineFiscalConstants.SALES_FISCAL_OFFLINE_CREATE_FAILURE, error } }
    },
    
};
