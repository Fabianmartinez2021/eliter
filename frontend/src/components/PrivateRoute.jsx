import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { passphrase } from '../config/config';
import CryptoJS from "crypto-js";

//Renderizar un componente ruta si el usuario está conectado, de lo contrario, lo redirige a la página /login.
//Verifica rol de igual forma para restringir el acceso
export const PrivateRoute = ({ component: Component, roles, ...rest }) => (

    <Route {...rest} render={props => {
        let currentUser = localStorage.getItem('user');

        //no logueado redireccionar al login
        if (!currentUser) {
            return <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        }

        //Obtener data de usuario
        try{
            let bytes  = CryptoJS.AES.decrypt(currentUser, passphrase);
            let originalData = bytes.toString(CryptoJS.enc.Utf8);
            currentUser = JSON.parse(originalData);
        }catch(err){
            return <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        }
        
        // verificar si la ruta está reestringida por rol
        if (roles && roles.indexOf(currentUser.role) === -1) {
            // rol no autorizado redireccion a la pantalla de entrada
            return <Redirect to={{ pathname: '/home'}} />
        }
        // Autorizado retornar componente
        return <Component {...props} />;

    }} />
)

