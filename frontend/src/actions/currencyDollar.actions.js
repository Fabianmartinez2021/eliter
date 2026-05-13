import { currencyDollarConstants } from "../constants/currencyDollar.constants";
import { obtainCurrencyData } from "../services/currencyDollar.service";

export const currencyDollarActions = {
    fetchCurrencyDollarData,
}

function fetchCurrencyDollarData() {
    return async dispatch => {
        dispatch({ type: currencyDollarConstants.DOLLAR_REQUEST });
        try {
            const response = await obtainCurrencyData();
            // Log de la respuesta que viene de la API
            dispatch({
                type: currencyDollarConstants.DOLLAR_SUCCESS,
                payload: response, // Asegúrate de que 'response.data' tenga la estructura correcta
            });
        } catch (error) {
            dispatch({
                type: currencyDollarConstants.DOLLAR_FAILURE,
                error,
            });
        }
    }
}
