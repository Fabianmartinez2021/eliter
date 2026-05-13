/* eslint-disable */
import { cronConstants } from '../constants';
import { cronService } from '../services';
import { alertActions } from './';

export const cronActions = {

    dataTableReportCron(pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            cronService.cronTableHistory(pageIndex, pageSize, sortBy, filters)
                .then(
                    data => {
                        dispatch(success(data))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: cronConstants.CRON_TABLE_REQUEST } }
        function success(data) { return { type: cronConstants.CRON_TABLE_SUCCESS, data } }
        function failure(error) { return { type: cronConstants.CRON_TABLE_FAILURE, error } }
    },

};
