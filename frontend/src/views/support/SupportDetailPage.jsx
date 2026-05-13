/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import {
    Container, Card, CardBody, Button, Input,
    Modal, ModalBody, Row, Col, Spinner
} from 'reactstrap';
import { supportActions } from '../../actions/support.actions';
import { playSendSound } from '../../helpers/sounds';
import { useNotification } from '../../helpers/internalNotification';
import { useDarkMode } from '../../helpers/darkModeContext';
import '../../assets/css/darkMode.css';
import '../../assets/css/supportDetail.css';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import EmojiPicker from "../../components/EmojiPicker/EmojiPicker";

// Paleta rojo-naranja refinada, estilo Messenger
const brandColor = '#e74c3c';
const brandColorGradient = 'linear-gradient(135deg, #e74c3c 0%, #e67e22 100%)';
// Mis mensajes: gradiente coral-cálido con ligero brillo
const myBubbleGradient = 'linear-gradient(145deg, #ff6b4a 0%, #e85d3a 50%, #d94a2b 100%)';
const myBubbleShadow = '0 2px 8px rgba(232, 93, 58, 0.35), 0 1px 2px rgba(0,0,0,0.08)';
// Mensajes del otro: gris cálido que complementa la paleta naranja
const supportBubbleBg = 'linear-gradient(180deg, #f8f6f4 0%, #efece8 100%)';
const supportBubbleBorder = '1px solid rgba(210, 140, 90, 0.15)';
const supportBubbleShadow = '0 1px 3px rgba(0,0,0,0.06)';
const chatBg = '#f5f3f0';

const styles = {
    pageWrapper: {
        background: chatBg,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    statusBadge: (isClosed) => ({
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        backgroundColor: isClosed ? '#95a5a6' : '#27ae60',
        background: isClosed ? '#95a5a6' : 'linear-gradient(135deg, #27ae60, #2ecc71)',
        color: '#fff',
        border: 'none',
        boxShadow: isClosed ? 'none' : '0 4px 10px rgba(39, 174, 96, 0.25)'
    }),
    chatScrollArea: {
        overflowY: 'auto',
        background: chatBg,
        display: 'block',
        minHeight: 0, // permite que el flex hijo se contraiga y muestre scroll
    },
    bubbleTypography: {
        sender: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.8px', opacity: 0.95 },
        message: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '0.95rem', lineHeight: 1.45, fontWeight: 450 },
        time: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '0.65rem', opacity: 0.6, letterSpacing: '0.3px' }
    }
};

// Estilos: scrollbar + animación typing
const ScrollStyles = () => (
    <style>
        {`
            .custom-scroll::-webkit-scrollbar { width: 6px; }
            .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            .custom-scroll::-webkit-scrollbar-thumb { background: rgba(231, 76, 60, 0.35); border-radius: 10px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(231, 76, 60, 0.5); }
            .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(231, 76, 60, 0.35) transparent; }
            
            @keyframes typingBounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }
            .typing-dot { animation: typingBounce 1.4s ease-in-out infinite; }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            .btn-support-icon { transition: all 0.25s ease; }
            .btn-support-icon:hover { transform: scale(1.08); }
            .btn-support-icon:active { transform: scale(0.96); }
            
            .visto-by-text[data-tooltip] { position: relative; }
            .visto-by-text[data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 0;
                margin-bottom: 6px;
                padding: 8px 12px;
                background: #333;
                color: #fff;
                font-size: 0.7rem;
                white-space: pre-line;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                max-width: 280px;
            }
        `}
    </style>
);

// Indicador de escritura estilo Messenger (cuando YO escribo)
const TypingIndicator = () => (
    <div className="d-flex justify-content-end mb-2">
        <div className="d-flex align-items-center px-3 py-2" style={{
            borderRadius: '18px 18px 4px 18px',
            background: myBubbleGradient,
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: myBubbleShadow
        }}>
            <span style={{ ...styles.bubbleTypography.sender, color: 'rgba(255,255,255,0.95)', marginRight: '6px', fontSize: '0.7rem' }}>Escribiendo</span>
            <span className="d-flex align-items-center">
                <span className="typing-dot mr-1" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}></span>
                <span className="typing-dot mr-1" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}></span>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}></span>
            </span>
        </div>
    </div>
);

// Umbral para considerar "en línea" (60 seg - en producción la latencia puede retrasar las actualizaciones)
const ONLINE_THRESHOLD_MS = 60 * 1000;

function formatLastSeen(date) {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (isToday && diffHours < 24) return `hoy, hace ${diffHours} h`;
    if (isYesterday) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

// Indicador cuando el OTRO está escribiendo (lado izquierdo)
const TypingIndicatorFromOther = ({ senderName }) => (
    <div className="d-flex justify-content-start mb-2">
        <div className="d-flex align-items-center px-3 py-2" style={{
            borderRadius: '18px 18px 18px 4px',
            background: supportBubbleBg,
            border: supportBubbleBorder,
            boxShadow: supportBubbleShadow
        }}>
            <span style={{ ...styles.bubbleTypography.sender, color: brandColor, marginRight: '6px', fontSize: '0.7rem' }}>{senderName} está escribiendo</span>
            <span className="d-flex align-items-center">
                <span className="typing-dot mr-1" style={{ width: 6, height: 6, borderRadius: '50%', background: brandColor }}></span>
                <span className="typing-dot mr-1" style={{ width: 6, height: 6, borderRadius: '50%', background: brandColor }}></span>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: brandColor }}></span>
            </span>
        </div>
    </div>
);

function SupportDetailPage() {
    const { id } = useParams();
    const history = useHistory();
    const dispatch = useDispatch();
    const { darkMode } = useDarkMode();
    const chatContainerRef = useRef(null);
    const { markTicketNotificationsRead } = useNotification();

    const ticket = useSelector(state => state.support.ticket);
    const loading = useSelector(state => state.support.loadingTicket);
    const currentUser = useSelector(state => state.authentication?.user);
    const canDelete = currentUser?.role !== 3;
    const canFinalize = currentUser?.role !== 3;
    const [message, setMessage] = useState('');
    const [chatImage, setChatImage] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [imageZoomUrl, setImageZoomUrl] = useState(null);
    const [imageZoomScale, setImageZoomScale] = useState(1);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const messageInputRef = useRef(null);
    const emojiBtnIdRef = useRef(`emoji-btn-${Date.now()}`);

    const openImageZoom = (url) => {
        setImageZoomUrl(url);
        setImageZoomScale(1);
    };

    const downloadImage = (url) => {
        if (!url) return;
        const ext = url.match(/data:image\/(\w+);/)?.[1] || 'png';
        const link = document.createElement('a');
        link.href = url;
        link.download = `imagen-soporte-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const [simulatedTypingFrom, setSimulatedTypingFrom] = useState(null);
    const fileInputRef = useRef(null);

    const handleChatImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        if (file.size > 3 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = () => setChatImage(reader.result);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const toggleModal = () => setModalOpen(!modalOpen);
    const toggleDeleteModal = () => setDeleteModalOpen(!deleteModalOpen);
    const isClosed = ticket?.status?.toLowerCase() === 'cerrado' || ticket?.status?.toLowerCase() === 'finalizado';

    const prevReplyCountRef = useRef(0);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        const count = ticket?.replies?.length || 0;
        if (count > prevReplyCountRef.current) {
            const prevCount = prevReplyCountRef.current;
            prevReplyCountRef.current = count;
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
            // Notificar solo si hay nueva respuesta de otro usuario (no en carga inicial)
            if (prevCount > 0) {
                const lastReply = ticket?.replies?.[count - 1];
                const sender = lastReply?.sender || lastReply?.user;
                const senderId = sender ? String(sender.id || sender._id || sender) : '';
                const currentUserId = currentUser ? String(currentUser.id || currentUser._id || '') : '';
                if (senderId && currentUserId && senderId !== currentUserId) {
                    const fullName = `${(sender?.firstName || '').trim()} ${(sender?.lastName || '').trim()}`.trim();
                    const senderName = fullName || sender?.username || 'Usuario';
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    setSimulatedTypingFrom({ senderId, senderName });
                    const t = setTimeout(() => {
                        setSimulatedTypingFrom(null);
                        typingTimeoutRef.current = null;
                    }, 1500);
                    typingTimeoutRef.current = t;
                }
            }
        } else {
            prevReplyCountRef.current = count;
            // Cuando el mensaje ya llegó (mismo count, polling actualizó), quitar "escribiendo" para mostrar el mensaje
            setSimulatedTypingFrom(prev => {
                if (!prev || count === 0) return prev;
                const lastReply = ticket?.replies?.[count - 1];
                const sender = lastReply?.sender || lastReply?.user;
                const senderId = sender ? String(sender.id || sender._id || sender) : '';
                return senderId === prev.senderId ? null : prev;
            });
        }
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [ticket?.replies, ticket?.supportNumber, ticket?._id, currentUser]);

    useEffect(() => {
        if (id) {
            dispatch(supportActions.getById(id));
        }
    }, [id, dispatch]);

    // Marcar notificaciones como leídas cuando se carga el ticket
    useEffect(() => {
        if (id && ticket) {
            markTicketNotificationsRead(id);
        }
    }, [id, ticket, markTicketNotificationsRead]);

    const POLLING_INTERVAL_MS = 20000;

    // Polling y marcado de visto: actualiza el ticket cada 1.5s y marca visto cada 3s
    useEffect(() => {
        if (!id || !ticket || isClosed) return;
        
        // Marcar visto inmediatamente al abrir (solo si hay usuario actual)
        if (currentUser) {
            dispatch(supportActions.markSeen(id));
        }
        
        let markSeenCounter = 0;
        const interval = setInterval(() => {
            // Actualizar ticket cada 1.5s
            dispatch(supportActions.getByIdSilent(id));
            
            // Marcar visto cada 3s (cada 2 ciclos de polling)
            markSeenCounter++;
            if (markSeenCounter >= 2 && currentUser) {
                dispatch(supportActions.markSeen(id));
                markSeenCounter = 0;
            }
        }, POLLING_INTERVAL_MS);
        
        return () => clearInterval(interval);
    }, [id, ticket?._id, isClosed, currentUser?.id, dispatch]);

    const handleSendReply = () => {
        if (message.trim() || chatImage) {
            const currentUserId = currentUser?.id || currentUser?._id;
            const ticketCreatorId = ticket?.user?._id || ticket?.user?.id;
            const isTicketCreator = currentUserId && ticketCreatorId && String(currentUserId) === String(ticketCreatorId);
            const role = isTicketCreator ? 'Cliente' : 'Soporte';
            playSendSound();
            dispatch(supportActions.addReply(id, message.trim() || ' ', role, chatImage));
            setMessage('');
            setChatImage(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirmClose = () => {
        dispatch(supportActions.closeTicket(id));
        toggleModal();
    };

    const handleConfirmDelete = () => {
        dispatch(supportActions.deleteTicket(id))
            .then(() => {
                toggleDeleteModal();
                history.push('/support-list');
            })
            .catch(() => {});
    };

    // Nombre y estado (online/offline) del contacto con quien hablo
    const currentUserId = currentUser ? String(currentUser.id || currentUser._id || '') : '';
    const ticketCreatorId = ticket?.user ? String(ticket.user._id || ticket.user.id || ticket.user) : '';
    const isTicketCreator = currentUserId && ticketCreatorId && currentUserId === ticketCreatorId;
    let contactName = 'Soporte';
    let contactLastSeenAt = null;
    let contactLastReplyAt = null; // fallback: si envió mensaje recientemente = activo
    if (ticket) {
        if (isTicketCreator) {
            // Yo soy el cliente: el contacto es el último que respondió (soporte)
            const replies = ticket.replies || [];
            for (let i = replies.length - 1; i >= 0; i--) {
                const reply = replies[i];
                const sender = reply?.sender || reply?.user;
                const sid = sender ? String(sender._id || sender.id || sender) : '';
                if (sid && sid !== currentUserId) {
                    const fn = `${(sender?.firstName || '').trim()} ${(sender?.lastName || '').trim()}`.trim();
                    contactName = fn || sender?.username || 'Soporte';
                    contactLastSeenAt = sender?.lastSeenAt || null;
                    contactLastReplyAt = reply?.createdAt || null;
                    break;
                }
            }
        } else {
            // Yo soy soporte: el contacto es el creador del ticket
            const u = ticket.user;
            const fn = u ? `${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim() : '';
            contactName = fn || u?.username || 'Usuario';
            contactLastSeenAt = u?.lastSeenAt || null;
            // Última actividad del creador: último reply que envió o createdDate si no ha respondido
            const replies = ticket.replies || [];
            let lastCreatorReplyAt = ticket?.createdDate || null;
            for (let i = replies.length - 1; i >= 0; i--) {
                const sender = replies[i]?.sender || replies[i]?.user;
                const sid = sender ? String(sender._id || sender.id || sender) : '';
                if (sid === ticketCreatorId) {
                    lastCreatorReplyAt = replies[i]?.createdAt || lastCreatorReplyAt;
                    break;
                }
            }
            contactLastReplyAt = lastCreatorReplyAt;
        }
    }
    const now = Date.now();
    const parseSafe = (val) => {
        if (!val) return Infinity;
        const d = new Date(val);
        return isNaN(d.getTime()) ? Infinity : now - d.getTime();
    };
    const lastSeenMs = parseSafe(contactLastSeenAt);
    const lastReplyMs = parseSafe(contactLastReplyAt);
    // Online si actividad reciente (lastSeenAt o última respuesta) dentro del umbral
    const isContactOnline = (lastSeenMs < ONLINE_THRESHOLD_MS) || (lastReplyMs < ONLINE_THRESHOLD_MS);
    // Para "última vez conectado": usar el más reciente entre lastSeenAt y última respuesta
    const toValidDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };
    const dLastSeen = toValidDate(contactLastSeenAt);
    const dLastReply = toValidDate(contactLastReplyAt);
    const lastActivityDate = (!dLastSeen && !dLastReply) ? null
        : (!dLastSeen) ? dLastReply
        : (!dLastReply) ? dLastSeen
        : new Date(Math.max(dLastSeen.getTime(), dLastReply.getTime()));
    const lastSeenFormatted = lastActivityDate ? formatLastSeen(lastActivityDate) : null;
    const lastSeenText = isContactOnline ? 'En línea' : (lastSeenFormatted ? `Offline · Última vez ${lastSeenFormatted}` : 'Offline');
    const statusColor = isContactOnline ? '#27ae60' : '#6b7280';

    return (
        <div className={`d-flex support-detail-page ${darkMode ? 'dark-mode' : ''}`} id="wrapper">
            <ScrollStyles />
            <SideBar />
            <div id="page-content-wrapper" style={{ ...styles.pageWrapper, background: chatBg }}>
                <AdminNavbar />

                <Container fluid className="support-detail-container py-2 flex-grow-1 d-flex flex-column overflow-hidden px-0 px-md-2 px-lg-4" style={{ height: 'calc(100vh - 72px)', minHeight: 0 }}>
                    {loading ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                            <Spinner color="danger" />
                            <p className="text-muted mt-2">Cargando ticket...</p>
                        </div>
                    ) : !ticket ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                            <i className="fa fa-lock text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                            <p className="text-muted mb-2">No tienes acceso a este ticket</p>
                            <p className="text-muted small mb-3">Solo puedes ver tickets de tu tienda</p>
                            <Button
                                className="rounded-pill"
                                style={{ background: brandColorGradient, border: 'none', color: '#fff' }}
                                onClick={() => history.push('/support-list')}
                            >
                                <i className="fa fa-arrow-left mr-2"></i> Volver al listado
                            </Button>
                        </div>
                    ) : (
                        <>
                        <Row className="flex-grow-1 overflow-hidden g-0">
                            {/* PANEL CENTRAL: CHAT */}
                            <Col xs="12" lg="9" xl="10" className="d-flex flex-column h-100 overflow-hidden">
                                <Card className="flex-grow-1 d-flex flex-column border-0 overflow-hidden support-chat-card support-chat-card-mobile" style={{
                                    borderRadius: '16px',
                                    background: '#fff',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                    maxHeight: '100%' 
                                }}>
                                    <div className="px-2 px-sm-4 py-2 d-flex justify-content-between align-items-center border-bottom flex-shrink-0 flex-nowrap" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                        <div className="d-flex align-items-center min-w-0 flex-grow-1 overflow-hidden">
                                            <Button
                                                color="link"
                                                className="d-lg-none p-0 mr-2 flex-shrink-0"
                                                style={{ minWidth: 40, height: 40, color: '#2d3748' }}
                                                onClick={() => history.push('/support-list')}
                                                title="Volver al listado de tickets"
                                                aria-label="Volver al listado de tickets"
                                            >
                                                <i className="fa fa-arrow-left" style={{ fontSize: '1.25rem' }}></i>
                                            </Button>
                                            <div 
                                                className="d-flex align-items-center justify-content-center mr-3" 
                                                style={{ 
                                                    width: '40px', 
                                                    height: '40px', 
                                                    minWidth: '40px',
                                                    flexShrink: 0,
                                                    background: brandColorGradient, 
                                                    borderRadius: '12px', 
                                                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.35)',
                                                    padding: '0'
                                                }}
                                            >
                                                <i className="fa fa-comments text-white" style={{ fontSize: '18px' }}></i>
                                            </div>
                                            <div>
                                                <h5 className="mb-0 font-weight-bold text-truncate" style={{ color: '#2d3748' }}>{contactName}</h5>
                                                <small className="font-weight-bold" style={{ color: statusColor }}>
                                                    ● {lastSeenText}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                            <span style={styles.statusBadge(isClosed)}>{ticket.status}</span>
                                        </div>
                                    </div>

                                    {/* ÁREA DE MENSAJES */}
                                    <div 
                                        className="flex-grow-1 px-2 px-sm-4 py-2 custom-scroll support-chat-messages support-chat-messages-mobile" 
                                        style={styles.chatScrollArea} 
                                        ref={chatContainerRef}
                                    >
                                        {/* Primer mensaje (asunto/descripción) - scroll con el chat, tono naranja suave */}
                                        <div className="px-2 px-sm-3 py-3 mb-3 rounded" style={{ background: 'linear-gradient(135deg, rgba(255,107,74,0.12) 0%, rgba(232,93,58,0.08) 100%)', border: '1px solid rgba(232,93,58,0.2)' }}>
                                            <small className="d-block mb-2 font-weight-bold" style={{ color: '#c94a2d', fontSize: '0.7rem', letterSpacing: '0.5px' }}> ASUNTO</small>
                                            <div className="d-flex align-items-center mb-1">
                                                <i className="fa fa-tag mr-2" style={{ color: brandColor, fontSize: '0.9rem' }}></i>
                                                <h6 className="mb-0 font-weight-bold" style={{ color: '#2d3748', fontSize: '1rem' }}>{ticket.affair || 'Sin asunto'}</h6>
                                            </div>
                                            <p className="mb-1" style={{ ...styles.bubbleTypography.message, color: '#050505', fontSize: '0.9rem' }}>{ticket.description}</p>
                                            {ticket.initialImage && (
                                                <div className="mb-2">
                                                    <img src={ticket.initialImage} alt="Adjunto" style={{ maxWidth: 160, maxHeight: 120, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer' }} onClick={() => openImageZoom(ticket.initialImage)} />
                                                    <small className="d-block mt-1" style={{ fontSize: '0.65rem', opacity: 0.8 }}>Click para ampliar o descargar</small>
                                                </div>
                                            )}
                                            <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem' }}>
                                                <span className="mr-2">{ticket.user?.firstName || "Usuario"}</span>
                                                <span>·</span>
                                                <span className="ml-2">{new Date(ticket.createdDate).toLocaleDateString()} {new Date(ticket.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        {/* Respuestas Dinámicas */}
                                        {ticket.replies?.map((reply, index) => {
                                            const sender = reply.sender || reply.user;
                                            const senderId = (typeof sender === 'object') 
                                                ? String(sender.id || sender._id || sender) 
                                                : (sender ? String(sender) : '');
                                            const currentUserId = currentUser ? String(currentUser.id || currentUser._id || '') : '';
                                            const isFromCurrentUser = senderId && currentUserId && senderId === currentUserId;
                                            const senderNameFull = `${(sender?.firstName || '').trim()} ${(sender?.lastName || '').trim()}`.trim();
                                            const senderName = senderNameFull || sender?.username || ticket.user?.firstName || 'Usuario';
                                            const isLastReply = index === (ticket.replies?.length || 0) - 1;
                                            const showTypingInstead = simulatedTypingFrom && isLastReply && !isFromCurrentUser && senderId === simulatedTypingFrom.senderId;
                                            const seenByList = reply.seenBy || [];
                                            const seenByDetails = seenByList
                                                .filter(s => {
                                                    const uid = s?.user?._id || s?.user || s;
                                                    return uid && String(uid) !== senderId;
                                                })
                                                .map(s => {
                                                    const u = s?.user;
                                                    const name = (u?.firstName || u?.username || 'Alguien')?.trim() || 'Alguien';
                                                    const seenAt = s?.seenAt ? new Date(s.seenAt) : null;
                                                    const timeStr = seenAt ? seenAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                                    return { name, timeStr };
                                                })
                                                .filter(x => x.name);
                                            const isSeenByOthers = isFromCurrentUser && seenByDetails.length > 0;

                                            if (showTypingInstead) {
                                                return <TypingIndicatorFromOther key={`typing-${index}`} senderName={simulatedTypingFrom.senderName} />;
                                            }

                                            return (
                                                <div key={index} className={`d-flex mb-3 ${isFromCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
                                                    <div className={`d-flex flex-column ${isFromCurrentUser ? 'align-items-end' : 'align-items-start'}`}>
                                                        <div className="p-3" style={{
                                                            minWidth: 180,
                                                            maxWidth: '95%',
                                                            borderRadius: isFromCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                            background: isFromCurrentUser ? myBubbleGradient : supportBubbleBg,
                                                            color: isFromCurrentUser ? 'rgba(255,255,255,0.98)' : '#1a1a1a',
                                                            border: isFromCurrentUser ? '1px solid rgba(255,255,255,0.25)' : supportBubbleBorder,
                                                            boxShadow: isFromCurrentUser ? myBubbleShadow : supportBubbleShadow
                                                        }}>
                                                            <div style={{ 
                                                                ...styles.bubbleTypography.sender, 
                                                                marginBottom: '6px', 
                                                                textTransform: 'uppercase',
                                                                color: isFromCurrentUser ? 'rgba(255,255,255,0.95)' : brandColor,
                                                                borderBottom: isFromCurrentUser ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.06)',
                                                                paddingBottom: '4px'
                                                            }}>
                                                                {senderName}
                                                            </div>
                                                            {reply.image && (
                                                                <div className="mb-2" style={{ display: 'inline-block' }}>
                                                                    <img src={reply.image} alt="Imagen" style={{ maxWidth: 160, maxHeight: 120, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => openImageZoom(reply.image)} onMouseEnter={e => { e.target.style.opacity = 0.9; }} onMouseLeave={e => { e.target.style.opacity = 1; }} />
                                                                    <small className="d-block mt-1" style={{ fontSize: '0.65rem', opacity: 0.8 }}>Click para ampliar o descargar</small>
                                                                </div>
                                                            )}
                                                            {reply.message?.trim() && <p className="mb-1" style={styles.bubbleTypography.message}>{reply.message}</p>}
                                                            <div className="d-flex align-items-center justify-content-end" style={{ gap: '6px' }}>
                                                                <span style={styles.bubbleTypography.time}>
                                                                    {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isFromCurrentUser && isSeenByOthers && (
                                                            <small
                                                                className="mt-1 px-1 visto-by-text"
                                                                style={{
                                                                    fontSize: '0.6rem',
                                                                    color: '#6b7280',
                                                                    lineHeight: 1.2,
                                                                    cursor: seenByDetails.length > 2 ? 'help' : 'default',
                                                                    textDecoration: seenByDetails.length > 2 ? 'underline dotted' : 'none'
                                                                }}
                                                                data-tooltip={seenByDetails.length > 2 ? seenByDetails.map(d => `Visto por ${d.name}${d.timeStr ? ` a las ${d.timeStr}` : ''}`).join('\n') : undefined}
                                                            >
                                                                {seenByDetails.length <= 2 ? (
                                                                    seenByDetails.map((d, i) => (
                                                                        <span key={i}>
                                                                            {i > 0 && ' • '}
                                                                            Visto por {d.name}{d.timeStr ? ` a las ${d.timeStr}` : ''}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    `Visto por ${seenByDetails.length} personas (pasa el cursor)`
                                                                )}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Indicador de escritura estilo Messenger */}
                                        {message.trim() && !isClosed && <TypingIndicator />}
                                    </div>

                                    {/* INPUT */}
                                    <div className="p-2 flex-shrink-0" style={{ background: '#fff', boxShadow: '0 -1px 3px rgba(0,0,0,0.06)' }}>
                                        {chatImage && (
                                            <div className="d-flex align-items-center mb-2 px-2">
                                                <img src={chatImage} alt="Vista previa" style={{ maxHeight: 50, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
                                                <Button color="link" size="sm" className="p-0 ml-2 text-muted" onClick={() => setChatImage(null)}>
                                                    <i className="fa fa-times"></i>
                                                </Button>
                                            </div>
                                        )}
                                        <div className="d-flex align-items-center px-2 px-sm-4 py-2 rounded-pill" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff"
                                                onChange={handleChatImageChange}
                                                style={{ display: 'none' }}
                                            />
                                            <Button color="link" className="p-0 mr-1 mr-sm-2 flex-shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isClosed} title="Adjuntar imagen" aria-label="Adjuntar imagen">
                                                <i className="fa fa-image" style={{ color: brandColor, fontSize: '1.1rem' }}></i>
                                            </Button>
                                            <Input
                                                innerRef={messageInputRef}
                                                type="text"
                                                className="border-0 bg-transparent shadow-none flex-grow-1 mr-1 mr-sm-2 min-w-0"
                                                placeholder="Escribe un mensaje..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                disabled={isClosed}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                                style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '0.95rem' }}
                                            />
                                            <Button color="link" className="p-0 mr-1 mr-sm-2 flex-shrink-0" id={emojiBtnIdRef.current} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)} disabled={isClosed} title="Emojis" aria-label="Emojis">
                                                <span role="img" aria-label="Emoji sonriente" style={{ fontSize: '1.2rem' }}>😊</span>
                                            </Button>
                                            <EmojiPicker
                                                isOpen={emojiPickerOpen}
                                                toggle={() => setEmojiPickerOpen(!emojiPickerOpen)}
                                                targetId={emojiBtnIdRef.current}
                                                onSelect={(emoji) => {
                                                    setMessage(prev => prev + emoji);
                                                    if (messageInputRef.current) messageInputRef.current.focus();
                                                }}
                                            />
                                            <Button color="link" className="p-0 mr-1 mr-sm-2 flex-shrink-0" disabled={isClosed} title="Like rápido" aria-label="Enviar like" onClick={() => { const role = isTicketCreator ? 'Cliente' : 'Soporte'; dispatch(supportActions.addReply(id, '👍', role)); playSendSound(); }}>
                                                <span role="img" aria-label="Pulgar hacia arriba" style={{ fontSize: '1.3rem' }}>👍</span>
                                            </Button>
                                            <Button color="link" className="p-0 ml-1 ml-sm-2 flex-shrink-0" onClick={handleSendReply} disabled={(!message.trim() && !chatImage) || isClosed} title="Enviar" aria-label="Enviar mensaje">
                                                <i className="fa fa-paper-plane" style={{ color: brandColor, fontSize: '1.25rem', transition: 'transform 0.2s' }}></i>
                                            </Button>
                                        </div>
                                        <div className="d-none d-lg-flex flex-wrap justify-content-end gap-2 mt-1 px-2">
                                            <Button color="secondary" size="sm" outline onClick={() => { setMessage(''); setChatImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                                <i className="fa fa-times mr-1"></i> Cancelar
                                            </Button>
                                            <Button color="secondary" size="sm" outline onClick={() => history.push('/support-create')}>
                                                <i className="fa fa-arrow-left mr-1"></i> Volver
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            {/* PANEL DERECHO - oculto en móvil, acciones en barra inferior */}
                            <Col lg="3" xl="2" className="h-100 d-none d-lg-flex">
                                <Card className="shadow-sm border-0 mb-3" style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                    <div className="px-3 py-2 text-white" style={{ background: brandColorGradient, boxShadow: '0 2px 6px rgba(231, 76, 60, 0.25)' }}>
                                        <h6 className="mb-0 font-weight-bold" style={{ fontSize: '0.75rem' }}>INFORMACIÓN</h6>
                                    </div>
                                    <CardBody className="p-3">
                                        <div className="mb-3">
                                            <label className="d-block mb-0 text-muted small font-weight-bold">REFERENCIA</label>
                                            <p className="font-weight-bold mb-0" style={{ color: brandColor, fontSize: '0.95rem' }}>#{ticket.supportNumber || id.slice(-6)}</p>
                                        </div>
                                        <div className="mb-3">
                                            <label className="d-block mb-0 text-muted small font-weight-bold">SOLICITANTE</label>
                                            <div className="d-flex align-items-center">
                                                <div className="d-flex align-items-center justify-content-center mr-2" style={{ width: '32px', height: '32px', background: brandColorGradient, borderRadius: '50%', flexShrink: 0 }}>
                                                    <i className="fa fa-user text-white" style={{ fontSize: '0.85rem' }}></i>
                                                </div>
                                                <div>
                                                    <p className="mb-0 font-weight-bold" style={{ fontSize: '0.9rem', color: '#050505' }}>{ticket.user?.firstName}</p>
                                                    <small className="text-muted">
                                                        {ticket.broadcastToAllManagers
                                                            ? 'Dirigido a: Todas las tiendas (difusión)'
                                                            : (ticket.targetAgency?.name ? `Dirigido a: ${ticket.targetAgency.name}` : (ticket.user?.agency?.name || '—'))}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                        {ticket.affair && (
                                            <div className="mb-3">
                                                <label className="d-block mb-0 text-muted small font-weight-bold">ASUNTO</label>
                                                <p className="mb-0" style={{ fontSize: '0.9rem', color: '#050505' }}>{ticket.affair}</p>
                                            </div>
                                        )}
                                        {ticket.description && (
                                            <div className="mb-3">
                                                <label className="d-block mb-0 text-muted small font-weight-bold">DESCRIPCIÓN</label>
                                                <p className="mb-0 small" style={{ color: '#475569', lineHeight: 1.4 }}>
                                                    {ticket.description.length > 120
                                                        ? `${ticket.description.slice(0, 120).trim()}...`
                                                        : ticket.description}
                                                </p>
                                            </div>
                                        )}
                                        <hr style={{ borderColor: 'rgba(0,0,0,0.08)' }} />
                                        <div className="d-flex flex-column mb-2" style={{ gap: '8px' }}>
                                            {!isClosed && canFinalize && (
                                                <Button 
                                                    className="btn-support-icon btn-sm rounded-pill py-2 font-weight-bold" 
                                                    onClick={toggleModal}
                                                    title="Finalizar caso"
                                                    style={{ 
                                                        background: brandColorGradient, 
                                                        border: 'none', 
                                                        color: '#fff',
                                                        boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                                                    }}
                                                >
                                                    <i className="fa fa-check-circle mr-2" style={{ fontSize: '1rem' }}></i>
                                                    Marcar finalizar
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button 
                                                    color="danger" 
                                                    outline 
                                                    className="btn-support-icon btn-sm rounded-pill py-2" 
                                                    onClick={toggleDeleteModal}
                                                    title="Eliminar ticket"
                                                >
                                                    <i className="fa fa-trash-alt mr-2" style={{ fontSize: '0.9rem' }}></i> Eliminar
                                                </Button>
                                            )}
                                        </div>
                                        <Button 
                                            block 
                                            className="btn-sm rounded-pill py-2 font-weight-bold" 
                                            onClick={() => history.push('/support-list')}
                                            style={{ 
                                                background: brandColorGradient, 
                                                border: 'none', 
                                                color: '#fff',
                                                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.25)'
                                            }}
                                        >
                                            <i className="fa fa-arrow-left mr-2"></i> Volver
                                        </Button>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* BARRA INFERIOR MÓVIL - tipo app nativa (Cerrar ticket, Volver, Eliminar) */}
                        <div className="d-lg-none support-bottom-bar">
                            <div className="support-bottom-actions">
                                {!isClosed && canFinalize && (
                                    <button type="button" className="support-bottom-btn" onClick={toggleModal} title="Cerrar ticket">
                                        <i className="fa fa-check-circle"></i>
                                        <span>Cerrar ticket</span>
                                    </button>
                                )}
                                <button type="button" className="support-bottom-btn outline" onClick={() => history.push('/support-list')} title="Volver al listado">
                                    <i className="fa fa-arrow-left"></i>
                                    <span>Volver</span>
                                </button>
                                {canDelete && (
                                    <button type="button" className="support-bottom-btn danger-outline" onClick={toggleDeleteModal} title="Eliminar ticket">
                                        <i className="fa fa-trash-alt"></i>
                                        <span>Eliminar</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        </>
                    )}
                </Container>

                <Modal isOpen={modalOpen} toggle={toggleModal} centered>
                    <ModalBody className="text-center p-4">
                        <h5 className="font-weight-bold">¿Cerrar ticket?</h5>
                        <p className="text-muted small">No se podrán enviar más mensajes en esta conversación.</p>
                        <div className="d-flex justify-content-center mt-3 gap-2">
                            <Button color="light" onClick={toggleModal} className="rounded-pill px-4">Cancelar</Button>
                            <Button onClick={handleConfirmClose} className="rounded-pill px-4" style={{ background: brandColorGradient, border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(231, 76, 60, 0.35)' }}>Confirmar</Button>
                        </div>
                    </ModalBody>
                </Modal>

                <Modal isOpen={deleteModalOpen} toggle={toggleDeleteModal} centered>
                    <ModalBody className="text-center p-4">
                        <div className="mb-3">
                            <i className="fa fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: brandColor }}></i>
                        </div>
                        <h5 className="font-weight-bold">¿Eliminar ticket?</h5>
                        <p className="text-muted small">Esta acción no se puede deshacer.</p>
                        <div className="d-flex justify-content-center mt-3">
                            <Button color="secondary" onClick={toggleDeleteModal} className="mr-2 rounded-pill px-4">Cancelar</Button>
                            <Button color="danger" onClick={handleConfirmDelete} className="rounded-pill px-4" style={{ boxShadow: '0 4px 12px rgba(220,53,69,0.3)' }}>Eliminar</Button>
                        </div>
                    </ModalBody>
                </Modal>

                <Modal isOpen={!!imageZoomUrl} toggle={() => setImageZoomUrl(null)} size="xl" className="modal-image-zoom">
                    <ModalBody className="p-0 position-relative" style={{ minHeight: '70vh', background: '#1a1a1a' }}>
                        <div className="position-absolute top-0 end-0 d-flex align-items-center gap-2 p-2" style={{ zIndex: 10 }}>
                            <Button color="light" size="sm" onClick={() => setImageZoomScale(s => Math.min(3, s + 0.25))} title="Acercar">
                                <i className="fa fa-search-plus"></i>
                            </Button>
                            <Button color="light" size="sm" onClick={() => setImageZoomScale(s => Math.max(0.5, s - 0.25))} title="Alejar">
                                <i className="fa fa-search-minus"></i>
                            </Button>
                            <Button color="light" size="sm" onClick={() => downloadImage(imageZoomUrl)} title="Descargar">
                                <i className="fa fa-download"></i>
                            </Button>
                            <Button color="light" size="sm" onClick={() => setImageZoomUrl(null)} title="Cerrar">
                                <i className="fa fa-times"></i>
                            </Button>
                        </div>
                        <div className="d-flex align-items-center justify-content-center overflow-auto p-4" style={{ minHeight: '70vh' }} onClick={() => setImageZoomUrl(null)}>
                            <img
                                src={imageZoomUrl}
                                alt="Vista ampliada"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    maxWidth: '90%',
                                    maxHeight: '85vh',
                                    transform: `scale(${imageZoomScale})`,
                                    transformOrigin: 'center center',
                                    cursor: 'pointer',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                }}
                            />
                        </div>
                    </ModalBody>
                </Modal>
            </div>
        </div>
    );
}

export default SupportDetailPage;
