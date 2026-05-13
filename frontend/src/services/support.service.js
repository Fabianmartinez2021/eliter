import authHeader from '../helpers/auth-header'; 
import handleResponse from '../helpers/handleResponse'; 
import { apiUrl } from '../config/config'; 

// 1. Definimos las funciones
function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/support/${id}`, requestOptions).then(handleResponse);
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/support`, requestOptions).then(handleResponse);
}

function create(ticket) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
    };
    return fetch(`${apiUrl}/support/register`, requestOptions).then(handleResponse);
}

function addReply(id, message, role = 'Soporte', image = null) {
    const body = { message, role };
    if (image) body.image = image;
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
    return fetch(`${apiUrl}/support/${id}/reply`, requestOptions).then(handleResponse);
}

/**
 * NUEVO: Función para cerrar el ticket
 */
function closeTicket(id) {
    const requestOptions = {
        method: 'PUT',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/support/${id}/close`, requestOptions).then(handleResponse);
}

/**
 * Marca todos los mensajes del ticket como vistos por el usuario actual
 */
function markSeen(id) {
    const requestOptions = {
        method: 'PUT',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/support/${id}/mark-seen`, requestOptions).then(handleResponse);
}

/**
 * Eliminar un ticket de soporte
 */
function deleteTicket(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/support/${id}`, requestOptions).then(handleResponse);
}

/**
 * Eliminar varios tickets por lotes
 */
function deleteBatch(ids) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    };
    return fetch(`${apiUrl}/support/delete-batch`, requestOptions).then(handleResponse);
}

// 2. Exportamos el objeto actualizado
export const supportService = {
    getById,
    getAll,
    create,
    addReply,
    markSeen,
    closeTicket,
    deleteTicket,
    deleteBatch
};