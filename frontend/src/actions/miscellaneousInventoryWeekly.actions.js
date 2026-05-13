/* eslint-disable */
import { miscellaneousInventoryWeeklyConstants } from '../constants';
import { miscellaneousInventoryWeeklyService } from '../services';
import { alertActions } from '.';

export const miscellaneousInventoryWeeklyActions = {
    dataTableWeekly(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            miscellaneousInventoryWeeklyService.dataTableWeekly(user, pageIndex, pageSize, sortBy, filters)
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

        function request() { return { type: miscellaneousInventoryWeeklyConstants.MISCELLANEOUS_INVENTORY_WEEKLY_TABLE_REQUEST } }
        function success(inventories) { return { type: miscellaneousInventoryWeeklyConstants.MISCELLANEOUS_INVENTORY_WEEKLY_TABLE_SUCCESS, inventories } }
        function failure(error) { return { type: miscellaneousInventoryWeeklyConstants.MISCELLANEOUS_INVENTORY_WEEKLY_TABLE_FAILURE, error } }
    },
}
