import { accountsPayableConstants } from '../constants';

export default function accountsPayable(state = {}, action) {
    switch (action.type) {
        case accountsPayableConstants.ACCOUNTS_PAYABLE_CREATE_REQUEST:
            return {
                registering: true
            };
        case accountsPayableConstants.ACCOUNTS_PAYABLE_CREATE_SUCCESS:
            return {
                success: true
            };
        case accountsPayableConstants.ACCOUNTS_PAYABLE_CREATE_FAILURE:
            return {};

        case accountsPayableConstants.ACCOUNTS_PAYABLE_TABLE_REQUEST:
            return {
                loading: true
            };
        case accountsPayableConstants.ACCOUNTS_PAYABLE_TABLE_SUCCESS:
            return {
                table: action.accountsPayable,
                loading: false
            };
        case accountsPayableConstants.ACCOUNTS_PAYABLE_TABLE_FAILURE:
            return {
                error: action.error,
                loading: false
            };

        default:
            return state;
    }
}
