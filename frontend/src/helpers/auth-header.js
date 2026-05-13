
import CryptoJS from "crypto-js"
import { passphrase } from '../config/config';
import { history } from '../helpers';
export default function authHeader(){
    //  Retorna el header de autorización con el token jwt
    let user = localStorage.getItem('user');

    if(user){
    try{
        var bytes  = CryptoJS.AES.decrypt(user, passphrase);
        var originalData = bytes.toString(CryptoJS.enc.Utf8);
        user = JSON.parse(originalData);
        }catch(err){
            history.push('/login');
        }
    }

    if (user && user.token) {
        return { 'Authorization': 'Bearer ' + user.token };
    } else {
        return {};
    }
}
