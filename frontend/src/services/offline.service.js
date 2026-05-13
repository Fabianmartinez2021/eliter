/* eslint-disable */
import { passphraseSale } from '../config/config';
import CryptoJS from "crypto-js"

export const offlineService = {

    //Guardar venta en localstorage para procesar luego
    addSaleOffline: (sale) => {
        return new Promise(function(resolve, reject) {
            let dataSale = [];

            try {

                //verificar si hay algo en el localStorage
                let sales = localStorage.getItem('SALEPROCESS');

                //Si hay algo se obtiene lo existente y se añade al array
                if(sales){

                    //Desencriptar data del local storage
                    var bytes  = CryptoJS.AES.decrypt(sales, passphraseSale);
                    var originalData = bytes.toString(CryptoJS.enc.Utf8);
                    dataSale = JSON.parse(originalData);

                    dataSale.push(sale);
                    var cryptSale = CryptoJS.AES.encrypt(JSON.stringify(dataSale), passphraseSale).toString();
                    localStorage.setItem('SALEPROCESS', cryptSale);

                //De lo contrario simplemente se añade
                }else{
                    dataSale.push(sale);
                    var cryptSale = CryptoJS.AES.encrypt(JSON.stringify(dataSale), passphraseSale).toString();
                    localStorage.setItem('SALEPROCESS', cryptSale);
                }
                //finalizar con éxito
                resolve(dataSale);

            } catch (error) {
                reject(error);
            }
            
        });
    },

    //Eliminar ventas offline luego de ser procesadas
    removeOfflineData: () => {
        localStorage.removeItem('SALEPROCESS');
    }



}

