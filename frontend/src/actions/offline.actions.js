/* eslint-disable */
import { offlineConstants } from '../constants';
import { offlineService } from '../services';
import { alertActions, pedingActions } from '.';

export const offlineActions = {

    addSaleOffline(sale) {
        return dispatch => {
            dispatch(request());

            offlineService.addSaleOffline(sale)
                .then(
                    (dataSale) => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha guardado la venta correctamente!'));
                        dispatch(pedingActions.updateSaleOffline(dataSale));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: offlineConstants.SALES_OFFLINE_CREATE_REQUEST } }
        function success() { return { type: offlineConstants.SALES_OFFLINE_CREATE_SUCCESS } }
        function failure(error) { return { type: offlineConstants.SALES_OFFLINE_CREATE_FAILURE, error } }
    },
    
};
