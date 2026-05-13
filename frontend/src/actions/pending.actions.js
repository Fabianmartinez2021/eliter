/* eslint-disable */
import { pendingConstants } from '../constants';

export const pedingActions = {

    //actualizar data de ventas offline
    updateSaleOffline(sales) {
        return { type: pendingConstants.PENDING_SALES_DATA, sales };
    },
};