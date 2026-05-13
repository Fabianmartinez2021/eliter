import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';
import { apiUrl } from '../config/config';

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/notifications`, requestOptions).then(handleResponse);
}

function markRead(id) {
    const requestOptions = {
        method: 'PUT',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/notifications/${id}/read`, requestOptions).then(handleResponse);
}

function markReadByTicket(ticketId) {
    const requestOptions = {
        method: 'PUT',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/notifications/ticket/${ticketId}/read`, requestOptions).then(handleResponse);
}

function deleteNotification(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };
    return fetch(`${apiUrl}/notifications/${id}`, requestOptions).then(handleResponse);
}

export const notificationService = {
    getAll,
    markRead,
    markReadByTicket,
    delete: deleteNotification
};
