// src/_reducers/support.reducer.js
import { supportConstants } from '../constants';

const initialState = { 
    tickets: [], 
    ticket: null, 
    loading: false, // Para la lista general
    loadingTicket: false, // Para el detalle individual (más específico)
    creating: false, // Para crear ticket (evitar doble envío)
    requestedTicketId: null, // Para ignorar respuestas de tickets distintos (ej. al cambiar entre varios del mismo usuario)
    error: null 
};

export function support(state = initialState, action) {
    switch (action.type) {
        // --- LISTAR TODOS LOS TICKETS ---
        case supportConstants.GETALL_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case supportConstants.GETALL_SUCCESS:
            return {
                ...state,
                loading: false,
                tickets: action.supports 
            };
        case supportConstants.GETALL_FAILURE:
            return { 
                ...state,
                loading: false,
                error: action.error
            };

        // --- VER UN TICKET ESPECÍFICO ---
        case supportConstants.GETBYID_REQUEST:
            return {
                ...state,
                loadingTicket: true,
                ticket: null,
                requestedTicketId: action.id || null,
                error: null
            };
        case supportConstants.GETBYID_SUCCESS: {
            const newTicket = action.ticket;
            const prevTicket = state.ticket;
            const requestedId = action.requestedId ? String(action.requestedId) : null;
            const newTicketId = newTicket?._id ? String(newTicket._id) : null;
            // Ignorar respuestas de tickets distintos (evita race al cambiar entre tickets del mismo usuario)
            if (prevTicket && newTicket && String(prevTicket._id) !== String(newTicket._id)) {
                return state;
            }
            if (requestedId && newTicketId && requestedId !== newTicketId) {
                return state;
            }
            const prevCount = prevTicket?.replies?.length || 0;
            const newCount = newTicket?.replies?.length || 0;
            const statusChanged = prevTicket?.status !== newTicket?.status;
            // Hash de seenBy para detectar cambios en "visto"
            const seenByHash = (t) => (t?.replies || []).map(r =>
                (r.seenBy || []).map(s => String(s?.user?._id || s?.user) + (s?.seenAt || '')).join(',')
            ).join('|');
            const seenByChanged = prevTicket && seenByHash(prevTicket) !== seenByHash(newTicket);
            const lastSeenHash = (t) => {
                const u = t?.user;
                const uLast = u?.lastSeenAt ? String(u.lastSeenAt) : '';
                const rLast = (t?.replies || []).map(r => {
                    const s = r?.sender;
                    return s?.lastSeenAt ? String(s.lastSeenAt) : '';
                }).join('|');
                return uLast + '|' + rLast;
            };
            const lastSeenChanged = prevTicket && lastSeenHash(prevTicket) !== lastSeenHash(newTicket);
            // Actualizar si: nuevo mensaje, status cambió, visto cambió, lastSeen cambió, o es carga inicial
            const shouldUpdate = !prevTicket || prevCount !== newCount || statusChanged || seenByChanged || lastSeenChanged || state.loadingTicket;
            if (prevTicket && !shouldUpdate) {
                return state;
            }
            return {
                ...state,
                loadingTicket: false,
                ticket: newTicket,
                requestedTicketId: null
            };
        }
        case supportConstants.GETBYID_FAILURE:
            return {
                ...state,
                loadingTicket: false,
                ticket: null,
                error: action.error
            };

        // --- CREAR TICKET ---
        case supportConstants.CREATE_REQUEST:
            return { 
                ...state, 
                creating: true 
            };
        case supportConstants.CREATE_SUCCESS:
            return { 
                ...state, 
                creating: false, 
                // Agregamos el nuevo ticket al inicio de la lista actual
                tickets: [action.support, ...state.tickets] 
            };
        case supportConstants.CREATE_FAILURE:
            return { 
                ...state, 
                creating: false, 
                error: action.error 
            };

        // --- ELIMINAR TICKET ---
        case supportConstants.DELETE_SUCCESS:
            return {
                ...state,
                tickets: state.tickets.filter(t => t._id !== action.id),
                ticket: state.ticket?._id === action.id ? null : state.ticket
            };

        // --- ELIMINAR TICKETS POR LOTES ---
        case supportConstants.DELETE_BATCH_SUCCESS: {
            const idsToRemove = new Set((action.ids || []).map(String));
            return {
                ...state,
                tickets: state.tickets.filter(t => !idsToRemove.has(String(t._id))),
                ticket: state.ticket && idsToRemove.has(String(state.ticket._id)) ? null : state.ticket
            };
        }

        default:
            return state;
    }
}