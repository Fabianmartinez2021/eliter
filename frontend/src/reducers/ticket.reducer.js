import { ticketConstants } from '../constants';

export default function ticket(state = {}, action) {
	switch (action.type) {
		//Crear ticket
		case ticketConstants.TICKET_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case ticketConstants.TICKET_CREATE_SUCCESS:
			return {
				success: true,
			  };
		case ticketConstants.TICKET_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case ticketConstants.TICKET_TABLE_REQUEST:
			return {
				loading: true
			};
		case ticketConstants.TICKET_TABLE_SUCCESS:
			return {
				data: action.ticket,
				loading: false
			};
		case ticketConstants.TICKET_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Actualización de ticket
		case ticketConstants.TICKET_UPDATE_REQUEST:
			return {
				updating: true
			};
		case ticketConstants.TICKET_UPDATE_SUCCESS:
			return {
				successUpdated: true,
			};
		case ticketConstants.TICKET_UPDATE_FAILURE:
			return {
				error: action.error
            };
            
        //Eliminacion de ticket
		case ticketConstants.TICKET_DELETE_REQUEST:
			return {
				deleting: true
			};
		case ticketConstants.TICKET_DELETE_SUCCESS:
			return {
                successDeleted: true,
                newData: action.ticket,
			};
		case ticketConstants.TICKET_DELETE_FAILURE:
			return {
				error: action.error
			};
	
		default:
		return state
	}
}