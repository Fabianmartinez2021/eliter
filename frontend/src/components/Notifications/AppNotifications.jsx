/* eslint-disable */
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { supportActions } from '../../actions/support.actions';
import { useNotification } from '../../helpers/internalNotification';
import { notificationService } from '../../services/notification.service';

export default function AppNotifications() {
    const dispatch = useDispatch();
    const location = useLocation();
    const pathname = location?.pathname || '';
    const currentUser = useSelector(state => state.authentication?.user);
    const { addNotification, loadFromBackend } = useNotification();
    const tickets = useSelector(state => state.support?.tickets || []);
    const prevReplyCountsRef = useRef({});

    useEffect(() => {
        if (!currentUser) return;
        if (pathname === '/login') return;
        dispatch(supportActions.getAll());
    }, [currentUser, dispatch, pathname]);

    useEffect(() => {
        if (!currentUser) return;
        if (pathname === '/login') return;
        const interval = setInterval(() => {
            dispatch(supportActions.getAllSilent());
        }, 4000);
        return () => clearInterval(interval);
    }, [currentUser, dispatch, pathname]);

    useEffect(() => {
        if (!currentUser) return;
        if (pathname === '/login') return;
        const fetchNotifications = () => {
            notificationService.getAll()
                .then(list => { loadFromBackend(Array.isArray(list) ? list : []); })
                .catch(() => {});
        };
        fetchNotifications();
        const retryFetch = setTimeout(fetchNotifications, 1500);
        const interval = setInterval(fetchNotifications, 5000);
        return () => {
            clearTimeout(retryFetch);
            clearInterval(interval);
        };
    }, [currentUser, pathname, loadFromBackend]);

    useEffect(() => {
        if (!tickets?.length || !currentUser) return;
        const currentUserId = String(currentUser.id || currentUser._id || '');
        const match = pathname.match(/\/support-detail\/([^/]+)/);
        const viewingTicketId = match ? match[1] : null;
        const isAdmin = currentUser?.role === 1;
        tickets.forEach((t) => {
            const tid = t._id;
            const creatorId = t.user ? String(t.user._id || t.user.id || '') : '';
            const amCreator = creatorId && creatorId === currentUserId;
            const hasReplied = (t.replies || []).some((r) => {
                const sid = r.sender ? String(r.sender._id || r.sender.id || r.sender) : '';
                return sid === currentUserId;
            });
            const isManager = currentUser?.role === 3;
            const isBroadcast = !!t.broadcastToAllManagers;
            const amInvolved = isAdmin || amCreator || hasReplied || (isManager && isBroadcast);
            if (!amInvolved) {
                prevReplyCountsRef.current[tid] = (t.replies || []).length;
                return;
            }
            const replies = t.replies || [];
            const count = replies.length;
            const prev = prevReplyCountsRef.current[tid];
            if (prev === undefined) {
                prevReplyCountsRef.current[tid] = count;
                return;
            }
            if (count > prev) {
                const lastReply = replies[count - 1];
                const sender = lastReply?.sender;
                const senderId = sender ? String(sender._id || sender.id || sender) : '';
                if (senderId && senderId !== currentUserId) {
                    const isViewingThisTicket = viewingTicketId && String(tid) === String(viewingTicketId);
                    if (isViewingThisTicket) {
                        prevReplyCountsRef.current[tid] = count;
                        return;
                    }
                    const getDisplayName = (obj) => {
                        if (!obj || typeof obj !== 'object') return '';
                        const first = obj.firstName || obj.firstname || '';
                        const last = obj.lastName || obj.lastname || '';
                        const full = `${String(first).trim()} ${String(last).trim()}`.trim();
                        return full || obj.username || '';
                    };
                    let senderName = lastReply?.senderDisplayName || getDisplayName(sender);
                    if (!senderName || senderName === 'Usuario') {
                        if (creatorId && senderId === creatorId && t.user) {
                            senderName = getDisplayName(t.user);
                        }
                        if ((!senderName || senderName === 'Usuario') && replies.length > 0) {
                            const otherWithSender = replies.find((r) => {
                                const s = r.sender;
                                return (r.senderDisplayName && r.senderDisplayName !== 'Usuario') || (typeof s === 'object' && s && String(s._id || s.id || s) === senderId);
                            });
                            if (otherWithSender) {
                                senderName = otherWithSender.senderDisplayName || getDisplayName(otherWithSender.sender);
                            }
                        }
                    }
                    senderName = senderName || 'Usuario';
                    const msgText = (lastReply?.message || '').trim();
                    const hasImage = !!(lastReply?.image);
                    let msg;
                    if (!msgText && hasImage) {
                        msg = 'envió una imagen';
                    } else if (msgText) {
                        msg = msgText.slice(0, 50) + (msgText.length > 50 ? '...' : '');
                    } else {
                        msg = '';
                    }
                    addNotification({
                        title: `${senderName} te respondió`,
                        message: msg ? `${t.affair || 'Ticket'} - "${msg}"` : `${t.affair || 'Ticket'} - Nueva respuesta`,
                        type: 'info',
                        ticketId: tid,
                        ticketNumber: t.supportNumber,
                        senderName
                    });
                }
            }
            prevReplyCountsRef.current[tid] = count;
        });
    }, [tickets, currentUser, addNotification, pathname]);

    return null;
}
