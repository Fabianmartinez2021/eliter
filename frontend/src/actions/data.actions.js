/* eslint-disable */
import { dataConstants } from '../constants';

export const dataActions = {
    update
};

//actualizar data de ventas offile: monedas, productos, terminales y ofertas
function update(data) {
    return { type: dataConstants.UPDATE_DATA, data };
}