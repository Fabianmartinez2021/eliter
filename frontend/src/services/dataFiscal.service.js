/* eslint-disable */
import { passphraseDataFiscal } from '../config/config';
import CryptoJS from "crypto-js";
import moment from 'moment';
const minutes = 30;//tiempo del timer

export const dataFiscalService = {

    //Guardar o actualizar monedas terminales y productos en el localStorage
    updateDataFiscalOffline: (saleFiscal) => {
        return new Promise(function(resolve, reject) {
           
            try {
                var cryptSale = CryptoJS.AES.encrypt(JSON.stringify(saleFiscal), passphraseDataFiscal).toString();
                localStorage.setItem('saleFiscal', cryptSale);

                const endDate =  moment().utc().add(minutes, 'minutes');
                localStorage.setItem('timer', endDate);
                //finalizar con éxito
                resolve();

            } catch (error) {
                reject(error);
            }
            
        });
    },

    //verificar fecha del store
    checkIfUpdateDataFiscal: () => {
        return new Promise(function(resolve, reject) {
            try {
                let timer = localStorage.getItem('timer');

                if(timer){
                    //console.log('dateactual', new Date());
                    //console.log('dateTimer', new Date(timer));
                    var isafter = moment(new Date()).isAfter(new Date(timer));
                    //si la fecha actual es mayor a la fecha del local storage
                    if(isafter){
                        resolve('ejecutar consulta de monedas, productos y terminales');
                    }else{
                        //no consultar todavia
                        reject();
                    }

                //si no hay timer se crea y se consulta
                }else{
                    const endDate =  moment().utc().add(minutes, 'minutes');
                    localStorage.setItem('timer', endDate);
                    resolve('ejecutar consulta de monedas, productos y terminales');
                }
            } catch (error) {
                reject(error);
            }
  
        })
    },

    //reiniciar timer en caso de error en la consulta
    resetTimer: () => {
        return new Promise(function(resolve, reject) {
            try {
                const endDate =  moment().utc().add(minutes, 'minutes');
                localStorage.setItem('timer', endDate);
                resolve('reset timer');
            } catch (error) {
                reject(error);
            }
        });
    }

}

