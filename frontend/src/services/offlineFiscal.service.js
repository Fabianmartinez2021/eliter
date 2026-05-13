/* eslint-disable */
import { passphraseSaleFiscal } from '../config/config';
import CryptoJS from "crypto-js"

export const offlineFiscalService = {

    //Guardar venta en localstorage para procesar luego
    addSaleFiscalOffline: (saleFiscal) => {
        return new Promise(function(resolve, reject) {
            let dataSaleFiscal = [];

            try {

                //verificar si hay algo en el localStorage
                let salesFiscal = localStorage.getItem('SALEPROCESS');

                //Si hay algo se obtiene lo existente y se añade al array
                if(salesFiscal){

                    //Desencriptar data del local storage
                    var bytes  = CryptoJS.AES.decrypt(salesFiscal, passphraseSaleFiscal);
                    var originalData = bytes.toString(CryptoJS.enc.Utf8);
                    dataSaleFiscal = JSON.parse(originalData);

                    dataSaleFiscal.push(saleFiscal);
                    var cryptSale = CryptoJS.AES.encrypt(JSON.stringify(dataSaleFiscal), passphraseSaleFiscal).toString();
                    localStorage.setItem('SALEFISCALPROCESS', cryptSale);

                //De lo contrario simplemente se añade
                }else{
                    dataSaleFiscal.push(saleFiscal);
                    var cryptSale = CryptoJS.AES.encrypt(JSON.stringify(dataSaleFiscal), passphraseSaleFiscal).toString();
                    localStorage.setItem('SALEFISCALPROCESS', cryptSale);
                }
                //finalizar con éxito
                resolve(dataSaleFiscal);

            } catch (error) {
                reject(error);
            }
            
        });
    },

    //Eliminar ventas offline luego de ser procesadas
    removeOfflineData: () => {
        localStorage.removeItem('SALEFISCALPROCESS');
    }

}

