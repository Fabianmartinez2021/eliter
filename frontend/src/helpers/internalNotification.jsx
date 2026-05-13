/* eslint-disable */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import NotificationContainer from '../components/Notifications/NotificationContainer';
import { playNotificationSound } from './sounds';
import { notificationService } from '../services/notification.service';

const NotificationContext = createContext(null);
const DISMISSED_STORAGE_KEY = 'fatt_dismissed_notification_ids';
const MAX_STORED_IDS = 500;

function loadDismissedFromStorage() {
    try {
        const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
        return new Set();
    }
}

function saveDismissedToStorage(set) {
    try {
        const arr = [...set].slice(-MAX_STORED_IDS);
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(arr));
    } catch {}
}

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotification debe usarse dentro de NotificationProvider');
    return ctx;
};

/** Las notificaciones en la campana no se borran solas; solo cuando el usuario hace clic en la X */

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [notificationHistory, setNotificationHistory] = useState([]);
    const dismissedIdsRef = React.useRef(loadDismissedFromStorage());

    const addNotification = useCallback(({ title, message, type = 'info', duration = 0, ticketId, ticketNumber, senderName }) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, title, message, type, ticketId }]);
        // Para notificaciones de tickets: solo toast + sonido. NO agregar a notificationHistory (campana)
        // para evitar duplicados: el backend crea la notificación y loadFromBackend la añade a la campana.
        if (ticketId) {
            playNotificationSound();
            // No añadimos a notificationHistory - lo hace loadFromBackend desde el backend
        }
        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const notify = useCallback((title, message, type = 'info', duration = 6000) => {
        return addNotification({ title, message, type, duration });
    }, [addNotification]);

    /** Carga notificaciones persistentes del backend al iniciar sesión */
    const loadFromBackend = useCallback((list) => {
        if (!list || !Array.isArray(list)) return;
        const mapped = list
            .filter(n => !dismissedIdsRef.current.has(String(n._id)))
            .map(n => {
                const ticketId = n.ticketId?._id || n.ticketId;
                const ticketNumber = n.ticketNumber ?? n.ticketId?.supportNumber;
                return {
                    id: n._id,
                    backendId: n._id,
                    ticketId,
                    ticketNumber,
                    title: n.title || 'Notificación',
                    message: n.message || '',
                    senderName: n.senderName || '',
                    type: n.type || 'info',
                    timestamp: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
                    read: !!n.read
                };
            });
        const backendTicketIds = new Set(mapped.map(m => String(m.ticketId)).filter(Boolean));
        setNotificationHistory(prev => {
            const byId = new Map(prev.map(n => [String(n.id), n]));
            const newUnread = mapped.filter(m => !m.read && !byId.has(String(m.id)));
            prev.forEach(n => {
                if (n.temp && n.ticketId && backendTicketIds.has(String(n.ticketId))) {
                    byId.delete(String(n.id));
                }
            });
            mapped.forEach(n => { byId.set(String(n.id), n); });
            const next = [...byId.values()].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            if (newUnread.length > 0) {
                playNotificationSound();
            }
            return next;
        });
    }, []);

    const todayNotifications = useMemo(() => notificationHistory, [notificationHistory]);

    /** Solo cuentan las no leídas (rojas). Las verdes no suman en el contador. */
    const unreadCount = useMemo(() => todayNotifications.filter(n => !n.read).length, [todayNotifications]);

    const markNotificationRead = useCallback((id) => {
        setNotificationHistory(prev => {
            const item = prev.find(n => String(n.id) === String(id));
            if (item?.backendId) {
                notificationService.markRead(item.backendId).catch(() => {});
            }
            return prev.map(n => String(n.id) === String(id) ? { ...n, read: true } : n);
        });
    }, []);

    /** Marca todas las notificaciones de un ticket como leídas (al abrir el ticket) */
    const markTicketNotificationsRead = useCallback((ticketId) => {
        if (!ticketId) return;
        notificationService.markReadByTicket(ticketId).catch(() => {});
        setNotificationHistory(prev =>
            prev.map(n => (String(n.ticketId) === String(ticketId) ? { ...n, read: true } : n))
        );
    }, []);

    const dismissNotification = useCallback((idOrNotification) => {
        const id = typeof idOrNotification === 'object' ? idOrNotification?.id : idOrNotification;
        const backendId = typeof idOrNotification === 'object' ? idOrNotification?.backendId : null;
        const idStr = String(id);
        dismissedIdsRef.current.add(idStr);
        if (backendId) {
            dismissedIdsRef.current.add(String(backendId));
            notificationService.delete(backendId).catch(() => {});
        }
        saveDismissedToStorage(dismissedIdsRef.current);
        setNotificationHistory(prev => prev.filter(n => String(n.id) !== idStr && String(n.backendId) !== String(backendId)));
        setNotifications(prev => prev.filter(n => String(n.id) !== idStr));
    }, []);

    const dismissAllNotifications = useCallback(() => {
        setNotificationHistory(prev => {
            prev.forEach(n => {
                dismissedIdsRef.current.add(String(n.id));
                if (n.backendId) {
                    dismissedIdsRef.current.add(String(n.backendId));
                    notificationService.delete(n.backendId).catch(() => {});
                }
            });
            saveDismissedToStorage(dismissedIdsRef.current);
            return [];
        });
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            notificationHistory,
            todayNotifications,
            unreadCount,
            addNotification,
            removeNotification,
            markNotificationRead,
            markTicketNotificationsRead,
            dismissNotification,
            dismissAllNotifications,
            loadFromBackend,
            notify
        }}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
}
