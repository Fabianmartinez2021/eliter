import axios from 'axios';
import { apiUrl } from '../config/config'
import authHeader from '../helpers/auth-header';

export const obtainCurrencyData = async () => {
    try {
        const response = await axios.get(`${apiUrl}/api/obtener-divisas`, {
            headers: authHeader() // Incluye los encabezados de autenticación
        });
        return response.data; // Retorna los datos para ser usados en el frontend
    } catch (error) {
        console.error('Error al obtener datos de divisas desde el backend:', error);
        throw error; // Lanza el error para manejarlo en la acción
    }
};
