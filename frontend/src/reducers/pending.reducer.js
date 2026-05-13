import { pendingConstants } from '../constants';
import CryptoJS from "crypto-js"
import { passphraseSale } from '../config/config';
let sales = localStorage.getItem('SALEPROCESS');

if(sales){
	
	try{
		var bytes  = CryptoJS.AES.decrypt(sales, passphraseSale);
		var originalData = bytes.toString(CryptoJS.enc.Utf8);
		sales = JSON.parse(originalData);
    }catch(e){
        console.log(e);
    }
    
}

const initialState = sales ? { sales } : {};

export default function pending(state = initialState, action) {

    switch (action.type) {
        case pendingConstants.PENDING_SALES_DATA:
            return {
                sales: action.sales
            };
        default:
            return state
    }
}