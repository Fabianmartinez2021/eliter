import { dataConstants } from '../constants';
import CryptoJS from "crypto-js"
import { passphraseData } from '../config/config';
let sale = localStorage.getItem('sale');

if(sale){
	
	try{
		var bytes  = CryptoJS.AES.decrypt(sale, passphraseData);
		var originalData = bytes.toString(CryptoJS.enc.Utf8);
		sale = JSON.parse(originalData);
    }catch(e){
        console.log(e);
    }
    
}

const initialState = sale ? { dataGet: true, sale } : {};

export default function data(state = initialState, action) {

    switch (action.type) {
        case dataConstants.UPDATE_DATA:
            return {
                dataGet: true,
                sale: action.data
            };
        default:
            return state
    }
}