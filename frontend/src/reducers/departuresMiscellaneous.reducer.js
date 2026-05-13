import { departureMiscellaneousConstants } from '../constants/departuresMiscellaneous.constans';

export default function departureMiscellaneous(state = {}, action) {
    switch (action.type) {
        //Crear salida
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_CREATE_REQUEST:
            return { 
                registering: true 
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_CREATE_SUCCESS:
            return {
                success: true,
              };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_CREATE_FAILURE:
            return {};
      
        //DataTable
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_TABLE_REQUEST:
            return {
                loading: true
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_TABLE_SUCCESS:
            return {
                data: action.departure,
                loading: false
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_TABLE_FAILURE:
            return { 
                error: action.error,
                loading: false
            };

        //obtener salida
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_GET_REQUEST:
            return {
                searching: true
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_GET_SUCCESS:
            return {
                sale: action.sale,
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_GET_FAILURE:
            return {
                error: action.error
            };

        //Actualización de salida
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_UPDATE_REQUEST:
            return {
                updating: true
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_UPDATE_SUCCESS:
            return {
                success: true,
                saleUpdated: action.sale,
            };
        case departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_UPDATE_FAILURE:
            return {
                error: action.error
            };
    
        default:
        return state
    }
}