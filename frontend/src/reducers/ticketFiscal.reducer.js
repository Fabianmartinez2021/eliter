import {ticketFiscalConstants}  from '../constants/ticketFiscal.constants'


export default function ticketFiscal(state = {}, action) {
    switch (action.type) {
        //Crear ticket
        case ticketFiscalConstants.TICKET_FISCAL_CREATE_REQUEST:
            return { 
                registering: true 
            };
        case ticketFiscalConstants.TICKET_FISCAL_CREATE_SUCCESS:
            return {
                success: true,
              };
        case ticketFiscalConstants.TICKET_FISCAL_CREATE_FAILURE:
            return {};
      
        //DataTable
        case ticketFiscalConstants.TICKET_FISCAL_TABLE_REQUEST:
            return {
                loading: true
            };
        case ticketFiscalConstants.TICKET_FISCAL_TABLE_SUCCESS:
            return {
                data: action.ticket,
                loading: false
            };
        case ticketFiscalConstants.TICKET_FISCAL_TABLE_FAILURE:
            return { 
                error: action.error,
                loading: false
            };

        //Actualización de ticket
        case ticketFiscalConstants.TICKET_FISCAL_UPDATE_REQUEST:
            return {
                updating: true
            };
        case ticketFiscalConstants.TICKET_FISCAL_UPDATE_SUCCESS:
            return {
                successUpdated: true,
            };
        case ticketFiscalConstants.TICKET_FISCAL_UPDATE_FAILURE:
            return {
                error: action.error
            };
            
        //Eliminacion de ticket
        case ticketFiscalConstants.TICKET_FISCAL_DELETE_REQUEST:
            return {
                deleting: true
            };
        case ticketFiscalConstants.TICKET_FISCAL_DELETE_SUCCESS:
            return {
                successDeleted: true,
                newData: action.ticket,
            };
        case ticketFiscalConstants.TICKET_FISCAL_DELETE_FAILURE:
            return {
                error: action.error
            };
    
        default:
        return state
    }
}