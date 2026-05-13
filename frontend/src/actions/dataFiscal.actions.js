/* eslint-disable */
import { dataFiscalConstants } from '../constants/dataFiscal.constans';

export const dataFiscalActions = {
    update
};

//actualizar data de ventas offile: monedas, productos, terminales y ofertas
function update(dataFiscal) {
    return { type: dataFiscalConstants.UPDATE_DATA_FISCAL, dataFiscal };
}