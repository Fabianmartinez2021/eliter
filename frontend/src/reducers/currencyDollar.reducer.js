import { currencyDollarConstants } from "../constants/currencyDollar.constants";

// Definimos el estado inicial de manera explícita

  
  export default function currencyDollar(state = {}, action) {
    switch (action.type) {
      case currencyDollarConstants.DOLLAR_REQUEST:
        return {
          ...state,
          loading: true,
        };
      case currencyDollarConstants.DOLLAR_SUCCESS:
        return {
          loading: false,
          data: action.payload,  // Asegúrate de que 'action.payload' tenga la estructura esperada
          error: null,
        };
      case currencyDollarConstants.DOLLAR_FAILURE:
        return {
          loading: false,
          data: null,
          error: action.error,
        };
      default:
        return state;
    }
  }
  