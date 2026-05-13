import { supportConstants } from '../constants';
import { supportService } from '../services';
import { alertActions } from './';

export const supportActions = {
    create,
    getAll,
    getAllSilent,
    getById,
    getByIdSilent,
    addReply,
    markSeen,
    closeTicket,
    deleteTicket,
    deleteBatch
};

/**
 * NUEVA ACCIÓN: Cerrar el caso
 */
function closeTicket(id) {
    return dispatch => {
        dispatch(request());

        supportService.closeTicket(id)
            .then(
                ticket => {
                    // Reutilizamos GETBYID_SUCCESS para que el ticket se actualice en pantalla con status "Cerrado"
                    dispatch(success(ticket));
                    dispatch(alertActions.success('El caso ha sido cerrado correctamente'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request() { return { type: supportConstants.GETBYID_REQUEST } }
    function success(ticket) { return { type: supportConstants.GETBYID_SUCCESS, ticket } }
    function failure(error) { return { type: supportConstants.GETBYID_FAILURE, error } }
}

/**
 * ACCIÓN: Añadir respuesta al hilo (role: 'Soporte' para admin, 'Cliente' para usuario)
 */
function addReply(id, message, role = 'Soporte', image = null) {
    return dispatch => {
        dispatch(request());

        supportService.addReply(id, message, role, image)
            .then(
                ticket => {
                    dispatch(success(ticket));
                    dispatch(alertActions.success('Mensaje enviado correctamente'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request() { return { type: supportConstants.ADD_REPLY_REQUEST } }
    function success(ticket) { return { type: supportConstants.GETBYID_SUCCESS, ticket } }
    function failure(error) { return { type: supportConstants.ADD_REPLY_FAILURE, error } }
}

function getById(id) {
    return dispatch => {
        dispatch(request(id));

        supportService.getById(id)
            .then(
                ticket => dispatch(success(ticket, id)),
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(id) { return { type: supportConstants.GETBYID_REQUEST, id } }
    function success(ticket, requestedId) { return { type: supportConstants.GETBYID_SUCCESS, ticket, requestedId } }
    function failure(error) { return { type: supportConstants.GETBYID_FAILURE, error } }
}

function getByIdSilent(id) {
    return dispatch => {
        supportService.getById(id)
            .then(ticket => dispatch({ type: supportConstants.GETBYID_SUCCESS, ticket, requestedId: id }))
            .catch(() => {});
    };
}

function markSeen(id) {
    return dispatch => {
        supportService.markSeen(id)
            .then(ticket => dispatch({ type: supportConstants.GETBYID_SUCCESS, ticket, requestedId: id }))
            .catch(() => {});
    };
}

function create(ticket) {
    return dispatch => {
        dispatch(request());

        return supportService.create(ticket)
            .then(
                support => { 
                    dispatch(success(support));
                    dispatch(alertActions.success('Ticket de soporte creado con éxito'));
                    return support;
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                    return Promise.reject(error);
                }
            );
    };

    function request() { return { type: supportConstants.CREATE_REQUEST } }
    function success(support) { return { type: supportConstants.CREATE_SUCCESS, support } }
    function failure(error) { return { type: supportConstants.CREATE_FAILURE, error } }
}

function getAll() {
    return dispatch => {
        dispatch(request());

        supportService.getAll()
            .then(
                supports => dispatch(success(supports)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: supportConstants.GETALL_REQUEST } }
    function success(supports) { return { type: supportConstants.GETALL_SUCCESS, supports } }
    function failure(error) { return { type: supportConstants.GETALL_FAILURE, error } }
}

function getAllSilent() {
    return dispatch => {
        supportService.getAll()
            .then(supports => dispatch({ type: supportConstants.GETALL_SUCCESS, supports }))
            .catch(() => {});
    };
}

/**
 * Eliminar un ticket de soporte. Retorna promesa para permitir redirección en éxito.
 */
function deleteTicket(id) {
    return dispatch => {
        dispatch(request(id));

        return supportService.deleteTicket(id)
            .then(
                () => {
                    dispatch(success(id));
                    dispatch(alertActions.success('Ticket eliminado correctamente'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                    return Promise.reject(error);
                }
            );
    };

    function request() { return { type: supportConstants.DELETE_REQUEST } }
    function success(id) { return { type: supportConstants.DELETE_SUCCESS, id } }
    function failure(error) { return { type: supportConstants.DELETE_FAILURE, error } }
}

/**
 * Eliminar varios tickets por lotes (solo admin).
 */
function deleteBatch(ids) {
    return dispatch => {
        return supportService.deleteBatch(ids)
            .then(
                (result) => {
                    dispatch({ type: supportConstants.DELETE_BATCH_SUCCESS, ids });
                    dispatch(alertActions.success(result.message || `${ids.length} ticket(s) eliminado(s) correctamente`));
                },
                error => {
                    dispatch(alertActions.error(error.toString()));
                    return Promise.reject(error);
                }
            );
    };
}