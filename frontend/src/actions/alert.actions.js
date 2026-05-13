/* eslint-disable */
import { alertConstants } from '../constants';

export const alertActions = {
    success,
    error,
    clear
};

function success(message) {
    return { type: alertConstants.SUCCESS, message };
}

function error(message) {
    if(message == "TypeError: Failed to fetch"){
        return { type: alertConstants.ERROR, message: "No pudo conectarse, verifique su conexión a internet e intente nuevamente" };
    }else{
        return { type: alertConstants.ERROR, message };
    }
    
}

function clear() {
    return { type: alertConstants.CLEAR };
}