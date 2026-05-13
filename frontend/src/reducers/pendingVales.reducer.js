import pendingValesConstants from '../constants/pendingVales.constants';

export default function pendingVales(state = {}, action) {
    switch (action.type) {
        //Crear PENDING_VALES
        case pendingValesConstants.PENDING_VALES_CREATE_REQUEST:
            return { 
                registering: true 
            };
        case pendingValesConstants.PENDING_VALES_CREATE_SUCCESS:
            return {
                success: true,
              };
        case pendingValesConstants.PENDING_VALES_CREATE_FAILURE:
            return {};
      
        //DataTable
        case pendingValesConstants.PENDING_VALES_TABLE_REQUEST:
            return {
                loading: true
            };
        case pendingValesConstants.PENDING_VALES_TABLE_SUCCESS:
            return {
                table: action.pendingVales,
                loading: false
            };
        case pendingValesConstants.PENDING_VALES_TABLE_FAILURE:
            return { 
                error: action.error,
                loading: false
            };

        //Actualización de PENDING_VALES
        case pendingValesConstants.PENDING_VALES_UPDATE_REQUEST:
            return {
                updating: true
            };
        case pendingValesConstants.PENDING_VALES_UPDATE_SUCCESS:
            return {
                successUpdated: true,
            };
        case pendingValesConstants.PENDING_VALES_UPDATE_FAILURE:
            return {
                error: action.error
            };
        
        default:
        return state
    }
}