import { pendingFiscalConstants } from "../constants/pendingFiscal.constants";
import CryptoJS from "crypto-js"
import { passphraseSaleFiscal } from '../config/config';
let salesFiscal = localStorage.getItem('SALEFISCALPROCESS');

if(salesFiscal){
    
    try{
        var bytes  = CryptoJS.AES.decrypt(salesFiscal, passphraseSaleFiscal);
        var originalData = bytes.toString(CryptoJS.enc.Utf8);
        salesFiscal = JSON.parse(originalData);
    }catch(e){
        console.log(e);
    }
    
}

const initialState = salesFiscal ? { salesFiscal } : { salesFiscal : []};

export default function pendingFiscal(state = initialState, action) {

    switch (action.type) {
        case pendingFiscalConstants.PENDING_SALES_FISCAL_DATA:
            return {
                ...state,
                salesFiscal: action.salesFiscal,
            };
        default:
            return state
    }
}