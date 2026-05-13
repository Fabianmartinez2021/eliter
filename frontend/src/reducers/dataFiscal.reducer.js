import { dataFiscalConstants } from '../constants/dataFiscal.constans';
import CryptoJS from "crypto-js"
import { passphraseDataFiscal } from '../config/config';
let saleFiscal = localStorage.getItem('saleFiscal');

if(saleFiscal){
    
    try{
        var bytes  = CryptoJS.AES.decrypt(saleFiscal, passphraseDataFiscal);
        var originalData = bytes.toString(CryptoJS.enc.Utf8);
        saleFiscal = JSON.parse(originalData);
    }catch(e){
        console.log(e);
    }
    
}

const initialState = saleFiscal ? { dataGet: true, saleFiscal } : {};

export default function dataFiscal(state = initialState, action) {

    switch (action.type) {
        case dataFiscalConstants.UPDATE_DATA_FISCAL:
            return {
                dataGet: true,
                saleFiscal: action.dataFiscal
            };
        default:
            return state
    }
}