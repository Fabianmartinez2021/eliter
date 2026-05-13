import { reportsFiscalConstans } from "../constants/reportsFiscal.constans";

export default function reportsFiscal(state = { Controller: new AbortController(),}, action) {
    switch(action.type){
        case reportsFiscalConstans.REPORTS_FISCAL_TABLE_REQUEST:
            return {
                loading: true
            };
        case reportsFiscalConstans.REPORTS_FISCAL_TABLE_SUCCESS:
            return{
                data: action.reportFiscal,
                loading: false
            };
        case reportsFiscalConstans.REPORTS_FISCAL_TABLE_FAILURE:
            return{
                error: action.error,
                loading: false
            };
        default:
        return state
    }
}