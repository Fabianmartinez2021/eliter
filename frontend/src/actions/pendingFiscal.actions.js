/* eslint-disable */
import { pendingFiscalConstants } from '../constants/pendingFiscal.constants';

export const pedingFiscalActions = {

    //actualizar data de ventas offline
    updateSaleFiscalOffline(salesFiscal) {
        return { type: pendingFiscalConstants.PENDING_SALES_FISCAL_DATA, salesFiscal };
    },
};