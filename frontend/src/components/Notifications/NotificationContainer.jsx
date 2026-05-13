/* eslint-disable */
import React from 'react';
import { history } from '../../helpers';
import { useNotification } from '../../helpers/internalNotification';
import { useDarkMode } from '../../helpers/darkModeContext';
import './notifications.css';

const typeConfig = {
    info: { icon: 'fa-info-circle', color: '#e67e22' },
    success: { icon: 'fa-check-circle', color: '#28a745' },
    warning: { icon: 'fa-exclamation-triangle', color: '#ffc107' },
    error: { icon: 'fa-times-circle', color: '#dc3545' }
};

export default function NotificationContainer() {
    const { notifications, removeNotification, markNotificationRead } = useNotification();
    const { darkMode } = useDarkMode();

    const handleToastClick = (n) => {
        if (n.ticketId) {
            markNotificationRead(n.id);
            removeNotification(n.id);
            history.push(`/support-detail/${n.ticketId}`);
        } else {
            removeNotification(n.id);
        }
    };

    const handleClose = (e, n) => {
        e.stopPropagation();
        removeNotification(n.id);
    };

    if (notifications.length === 0) return null;

    return (
        <div className={`notification-container ${darkMode ? 'dark-mode' : ''}`}>
            {notifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.info;
                return (
                    <div
                        key={n.id}
                        className={`notification-toast ${n.ticketId ? 'notification-toast-clickable' : ''}`}
                        style={{ borderLeftColor: config.color }}
                        role="alert"
                        onClick={n.ticketId ? () => handleToastClick(n) : undefined}
                        title={n.ticketId ? 'Haz clic para ir a la conversación' : undefined}
                    >
                        <i className={`fa ${config.icon} notification-icon`} style={{ color: config.color }} />
                        <div className="notification-content">
                            <strong className="notification-title">{n.title}</strong>
                            {n.message && <div className="notification-message">{n.message}</div>}
                        </div>
                        <button
                            type="button"
                            className="notification-close"
                            onClick={(e) => handleClose(e, n)}
                            aria-label="Cerrar"
                        >
                            <i className="fa fa-times" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
