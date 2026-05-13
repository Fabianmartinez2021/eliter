import { orderMiscellaneousConstants } from "../constants/orderMiscellaneous.constants";

export default function orderMiscellaneous(state = { controller: new AbortController(), }, action) {
    switch (action.type) {
        //Crear un pedido
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_CREATE_REQUEST:
            return { 
                loading: true 
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_CREATE_SUCCESS:
            return {
                success: true,
                order: action.order,
                loading: false,
              };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_CREATE_FAILURE:
            return { 
                error: action.error,
                loading: false
            };


        //Actualización de un pedido
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_UPDATE_REQUEST:
            return {
                updating: true
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_UPDATE_SUCCESS:
            return {
                success: true,
                updating: false,
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_UPDATE_FAILURE:
            return {
                error: action.error,
                updating: false
            };


        // Tabla de todos los pedidos
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_TABLE_REQUEST:
            return {
                loading: true
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_TABLE_SUCCESS:
            return {
                table: action.order,
                loading: false
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_TABLE_FAILURE:
            return { 
                error: action.error,
                loading: false
            };


        // obtener un pedido en específico
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_GET_REQUEST:
            return {
                loading: true
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_GET_SUCCESS:
            return {
                order: action.order,
                loading: false
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_GET_FAILURE:
            return {
                error: action.error,
                loading: false
            };
    

        // Obtener todas las ayudas para las ordenes
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_GET_REQUEST:
            return {
                getting: true
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_GET_SUCCESS:
            return {
                orderHelperList: action.order,
                getting: false
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_GET_FAILURE:
            return {
                error: action.error,
                getting: false
            };
    

        // Crear una de las ayudas para las órdenes
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_SET_REQUEST:
            return {
                setting: true
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_SET_SUCCESS:
            return {
                success: true,
                setting: false
            };
        case orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_SET_FAILURE:
            return {
                error: action.error,
                setting: false
            };
    
        default:
        return state
    }
}