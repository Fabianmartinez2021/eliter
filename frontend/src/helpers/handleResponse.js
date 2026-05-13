import { userService } from '../services';
import { history } from '../helpers';


function logout() {
    // eliminar usuario del almacenamiento local para cerrar sesión
    userService.logout();
}

export default function handleResponse(response) {

    return response.text().then(text => {
        let data = null;
        if (text && text.length) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                // HTML u otro no-JSON (404/500, proxy, endpoint inexistente)
                const isHtml = /^\s*</.test(text);
                const msg = isHtml
                    ? `El servidor no devolvió JSON (${response.status}). Suele pasar si la ruta del API no existe o hay error en el backend. Comprueba la URL y que el endpoint esté implementado.`
                    : 'Respuesta del servidor no válida (no es JSON).';
                if (!response.ok && response.status === 401) {
                    logout();
                    history.push('/login');
                }
                return Promise.reject(msg);
            }
        }

        if (!response.ok) {
            if (response.status === 401) {
                // auto logout si se retorna 401
                logout();
                history.push('/login');
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}