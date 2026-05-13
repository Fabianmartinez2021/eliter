const mongoose = require('mongoose');
const db = require('../_helpers/db');
const Support = db.Support;
const User = db.User;
const notificationService = require('./notification.service');
const role = require('../enums/roles.enum');

module.exports = {
    create,
    getAll,
    getById,
    addReply,
    markSeen,
    closeTicket,
    _delete,
    deleteBatch
};

const TARGET_ALL_STORES = 'all';

/**
 * Crea un nuevo ticket de soporte
 * - Si admin con targetAgencyId='all': ticket de difusión → todos los gerentes ven/responden y reciben notificaciones
 * - Si admin con targetAgencyId específica: notifica solo gerentes de esa tienda
 * - Si gerente u otro con agency: admins + gerentes de esa tienda
 */
async function create(params) {
    const { targetAgencyId, ...supportParams } = params;
    const support = new Support(supportParams);

    const creator = await User.findById(params.user).select('firstName lastName agency role').lean();
    const senderName = creator
        ? `${(creator.firstName || '').trim()} ${(creator.lastName || '').trim()}`.trim() || 'Usuario'
        : 'Usuario';

    const isBroadcast = targetAgencyId === TARGET_ALL_STORES;
    let ticketAgencyId = null;

    if (isBroadcast) {
        support.broadcastToAllManagers = true;
    } else if (targetAgencyId && mongoose.Types.ObjectId.isValid(targetAgencyId)) {
        support.targetAgency = targetAgencyId;
        ticketAgencyId = String(targetAgencyId);
    } else if (creator?.agency) {
        ticketAgencyId = String(creator.agency._id || creator.agency);
        support.targetAgency = creator.agency;
    }
    await support.save();

    try {
        const isAdmin = creator && Number(creator.role) === role.rol.Admin;
        if (isAdmin && isBroadcast) {
            // Admin crea difusión: notificar a TODOS los gerentes
            await notificationService.createForAllManagers({
                ticketId: support._id,
                ticketNumber: support.supportNumber || 0,
                title: 'Nuevo ticket de soporte (difusión)',
                message: `${senderName} creó un ticket para todos: "${params.affair}"`,
                senderName,
                type: 'info',
                excludeUserId: params.user
            });
        } else if (isAdmin && ticketAgencyId) {
            // Admin crea para tienda específica
            await notificationService.createForManagersOfAgency({
                ticketId: support._id,
                ticketNumber: support.supportNumber || 0,
                title: 'Nuevo ticket de soporte (administración)',
                message: `${senderName} creó un ticket para tu tienda: "${params.affair}"`,
                senderName,
                type: 'info',
                targetAgencyId
            });
        } else if (ticketAgencyId) {
            // Gerente u otro usuario con tienda: notificar a admins + TODOS los gerentes de esa tienda
            await notificationService.createForAdminsAndManagersOfAgency({
                ticketId: support._id,
                ticketNumber: support.supportNumber || 0,
                title: 'Nuevo ticket de soporte',
                message: `${senderName} creó un ticket: "${params.affair}"`,
                senderName,
                type: 'info',
                excludeUserId: params.user,
                creatorAgencyId: ticketAgencyId
            });
        } else {
            // Usuario sin tienda (ej. admin sin target): solo admins
            await notificationService.createForAdminsAndManagersOfAgency({
                ticketId: support._id,
                ticketNumber: support.supportNumber || 0,
                title: 'Nuevo ticket de soporte',
                message: `${senderName} creó un ticket: "${params.affair}"`,
                senderName,
                type: 'info',
                excludeUserId: params.user,
                creatorAgencyId: null
            });
        }
        // excludeUserId: quien creó el ticket (admin o gerente) — no enviar correo por su propia acción
        const emailParams = { ticketId: support._id, ticketNumber: support.supportNumber || 0, senderName, message: `${senderName} creó un ticket: "${params.affair}"`, excludeUserId: params.user };
        Promise.all([
            notificationService.sendSupportTicketEmailToOptedInAdmins({ ...emailParams, title: 'Nuevo ticket de soporte' }),
            isAdmin && isBroadcast ? notificationService.sendSupportTicketEmailToOptedInManagers({ type: 'diffusion', ...emailParams, title: 'Nuevo ticket de soporte (difusión)' }) : null,
            ticketAgencyId ? notificationService.sendSupportTicketEmailToOptedInManagers({ type: 'sameStore', agencyId: ticketAgencyId, ...emailParams, title: isAdmin ? 'Nuevo ticket de soporte (administración)' : 'Nuevo ticket de soporte' }) : null
        ].filter(Boolean)).catch((err) => console.error('[support] Error enviando correos:', err));
    } catch (err) {
        console.error('[support] Error creando notificaciones:', err);
    }
    return support;
}

/**
 * Obtiene todos los tickets con información expandida.
 * Gerentes (rol 3): tickets de su tienda (user en agency) O tickets admin dirigidos a su tienda (targetAgency).
 */
async function getAll(userId) {
    let query = {};
    if (userId) {
        const user = await User.findById(userId).select('role agency').lean();
        const isManager = user && Number(user.role) === role.rol.Manager;
        if (isManager) {
            if (!user.agency) {
                // Gerente sin agency: solo tickets de difusión
                query = { broadcastToAllManagers: true };
            } else {
                const agencyId = user.agency;
                const userIdsInAgency = await User.find({ agency: agencyId }).distinct('_id');
                query = {
                    $or: [
                        { user: { $in: userIdsInAgency } },
                        { targetAgency: agencyId },
                        { broadcastToAllManagers: true }
                    ]
                };
            }
        }
    }
    const tickets = await Support.find(query)
        .sort({ createdDate: -1 })
        .populate({
            path: 'user',
            select: 'firstName lastName username agency lastSeenAt',
            populate: { path: 'agency', select: 'name' }
        })
        .populate({ path: 'targetAgency', select: 'name' })
        .populate({
            path: 'replies.sender',
            select: 'firstName lastName username lastSeenAt'
        })
        .populate({
            path: 'replies.seenBy.user',
            select: 'firstName'
        })
        .populate({
            path: 'closedBy',
            select: 'firstName lastName'
        })
        .lean();
    return tickets.map(t => addSenderDisplayNames(t));
}

function addSenderDisplayNames(ticket) {
    if (!ticket.replies || !Array.isArray(ticket.replies)) return ticket;
    const creatorName = ticket.user ? `${(ticket.user.firstName || '').trim()} ${(ticket.user.lastName || '').trim()}`.trim() || ticket.user.username : '';
    const creatorId = ticket.user ? String(ticket.user._id || ticket.user.id || '') : '';
    return {
        ...ticket,
        replies: ticket.replies.map(r => {
            const sender = r.sender;
            let displayName = '';
            if (sender && typeof sender === 'object') {
                displayName = `${(sender.firstName || '').trim()} ${(sender.lastName || '').trim()}`.trim() || sender.username || '';
            }
            if (!displayName && creatorId && sender && String(sender._id || sender.id || sender) === creatorId) {
                displayName = creatorName;
            }
            return { ...r, senderDisplayName: displayName || 'Usuario' };
        })
    };
}

/**
 * Obtiene un ticket por ID con su información completa e HILO DE RESPUESTAS.
 * Gerentes (rol 3): solo si el ticket pertenece a su tienda.
 */
async function getById(id, userId) {
    if (userId) {
        await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
    }
    const ticket = await Support.findById(id)
        .populate({
            path: 'user',
            select: 'firstName lastName username agency lastSeenAt',
            populate: { path: 'agency', select: 'name' }
        })
        .populate({ path: 'targetAgency', select: 'name' })
        .populate({
            path: 'replies.sender',
            select: 'firstName lastName username lastSeenAt'
        })
        .populate({
            path: 'replies.seenBy.user',
            select: 'firstName'
        })
        .populate({
            path: 'closedBy',
            select: 'firstName lastName'
        })
        .lean();
    if (!ticket) return null;
    if (userId) {
        const user = await User.findById(userId).select('role agency').lean();
        if (user && user.role === role.rol.Manager) {
            if (ticket.broadcastToAllManagers) return addSenderDisplayNames(ticket); // Tickets difusión: todos pueden ver
            if (!user.agency) return null;
            const managerAgencyId = String(user.agency);
            const ticketUserAgency = ticket.user?.agency;
            const ticketAgencyId = ticketUserAgency ? String(ticketUserAgency._id || ticketUserAgency) : null;
            const targetAgencyId = ticket.targetAgency ? String(ticket.targetAgency._id || ticket.targetAgency) : null;
            const belongsToManagerStore = ticketAgencyId === managerAgencyId || targetAgencyId === managerAgencyId;
            if (!belongsToManagerStore) return null;
        }
    }
    return addSenderDisplayNames(ticket);
}

/**
 * Lógica para insertar una respuesta en el hilo.
 * Notifica a admins y gerentes de la misma tienda (excluyendo al que respondió).
 * Gerentes solo pueden responder en tickets de su tienda.
 */
async function addReply(id, params, userId) {
    if (userId) {
        await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
    }
    const ticket = await Support.findById(id).populate('user', 'agency').populate('targetAgency');
    if (!ticket) throw 'Ticket no encontrado';

    const currentUser = await User.findById(userId).select('role agency').lean();
    if (currentUser && currentUser.role === role.rol.Manager) {
        if (!ticket.broadcastToAllManagers) {
            if (!currentUser.agency) throw 'No tienes permiso para responder en este ticket';
            const managerAgencyId = String(currentUser.agency);
            const ticketUserAgencyId = ticket.user?.agency ? String(ticket.user.agency) : null;
            const ticketTargetAgencyId = ticket.targetAgency ? String(ticket.targetAgency._id || ticket.targetAgency) : null;
            const belongsToManagerStore = ticketUserAgencyId === managerAgencyId || ticketTargetAgencyId === managerAgencyId;
            if (!belongsToManagerStore) throw 'No tienes permiso para responder en este ticket';
        }
    }

    const newReply = {
        sender: userId,
        message: params.message || '',
        image: params.image || undefined,
        role: params.role || 'Cliente', 
        createdAt: new Date()
    };

    ticket.replies.push(newReply);
    ticket.status = 'En Proceso';

    await ticket.save();

    const sender = await User.findById(userId).select('firstName lastName').lean();
    const senderName = sender
        ? `${(sender.firstName || '').trim()} ${(sender.lastName || '').trim()}`.trim() || 'Usuario'
        : 'Usuario';
    const msg = (params.message || '').trim();
    const hasImage = !!(params.image);
    let notificationMessage;
    if (!msg && hasImage) {
        notificationMessage = `${senderName} envió una imagen`;
    } else if (msg) {
        notificationMessage = `${senderName} respondió: "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}"`;
    } else {
        notificationMessage = `${senderName} respondió`;
    }
    try {
        if (ticket.broadcastToAllManagers) {
            await notificationService.createForAdminsAndAllManagers({
                ticketId: ticket._id,
                ticketNumber: ticket.supportNumber || 0,
                title: 'Nueva respuesta en ticket (difusión)',
                message: notificationMessage,
                senderName,
                type: 'info',
                excludeUserId: userId
            });
        } else {
            const ticketTargetAgencyId = ticket.targetAgency ? String(ticket.targetAgency._id || ticket.targetAgency) : null;
            const ticketCreatorAgencyId = ticketTargetAgencyId || (ticket.user?.agency ? String(ticket.user.agency) : null);
            await notificationService.createForAdminsAndManagersOfAgency({
                ticketId: ticket._id,
                ticketNumber: ticket.supportNumber || 0,
                title: 'Nueva respuesta en ticket',
                message: notificationMessage,
                senderName,
                type: 'info',
                excludeUserId: userId,
                creatorAgencyId: ticketCreatorAgencyId
            });
        }
        // excludeUserId: quien respondió (admin o gerente) — no enviar correo por su propia acción
        await notificationService.sendSupportTicketEmailToOptedInAdmins({
            ticketId: ticket._id,
            ticketNumber: ticket.supportNumber || 0,
            title: 'Nueva respuesta en ticket',
            message: notificationMessage,
            senderName,
            excludeUserId: userId
        });
        const ticketTargetAgencyId = ticket.targetAgency ? String(ticket.targetAgency._id || ticket.targetAgency) : null;
        const ticketCreatorAgencyId = ticketTargetAgencyId || (ticket.user?.agency ? String(ticket.user.agency) : null);
        await notificationService.sendSupportTicketEmailToOptedInManagers({
            type: 'reply',
            agencyId: ticketCreatorAgencyId,
            ticketId: ticket._id,
            ticketNumber: ticket.supportNumber || 0,
            title: ticket.broadcastToAllManagers ? 'Nueva respuesta en ticket (difusión)' : 'Nueva respuesta en ticket',
            message: notificationMessage,
            senderName,
            excludeUserId: userId
        });
    } catch (err) {
        console.error('[support] Error creando notificaciones en reply:', err);
    }

    return await getById(id, userId);
}

/**
 * Marca todos los mensajes del ticket como vistos por el usuario (estilo WhatsApp).
 */
async function markSeen(id, userId) {
    if (!userId) return null;
    await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
    const ticket = await Support.findById(id);
    if (!ticket) return null;
    const userIdStr = String(userId);
    let updated = false;
    if (ticket.replies && Array.isArray(ticket.replies)) {
        for (const reply of ticket.replies) {
            const seenBy = reply.seenBy || [];
            const alreadySeen = seenBy.some(s => {
                const uid = s?.user?._id || s?.user;
                return uid && String(uid) === userIdStr;
            });
            if (!alreadySeen) {
                reply.seenBy = reply.seenBy || [];
                reply.seenBy.push({ user: userId, seenAt: new Date() });
                updated = true;
            }
        }
        if (updated) await ticket.save();
    }
    return await getById(id, userId);
}

/**
 * NUEVA FUNCIÓN: Lógica para cerrar el caso
 * El gerente (rol 3) no puede finalizar tickets.
 */
async function closeTicket(id, closedByUserId) {
    if (closedByUserId) {
        const user = await User.findById(closedByUserId).select('role').lean();
        if (user && user.role === role.rol.Manager) {
            throw new Error('El gerente no puede finalizar tickets');
        }
    }
    const ticket = await Support.findById(id);
    if (!ticket) throw 'Ticket no encontrado';

    // Cambiamos el estado a Cerrado y guardamos quién cerró y cuándo
    ticket.status = 'Cerrado';
    ticket.closedDate = new Date();
    ticket.closedBy = closedByUserId || null;
    
    await ticket.save();

    // Retornamos el ticket actualizado con todos sus datos populados
    return await getById(id, closedByUserId);
}

/**
 * Eliminar un ticket de soporte
 * El gerente (rol 3) no puede eliminar tickets.
 */
async function _delete(id, userId) {
    if (userId) {
        const user = await User.findById(userId).select('role').lean();
        if (user && user.role === role.rol.Manager) {
            throw new Error('El gerente no puede eliminar tickets');
        }
    }
    const ticket = await Support.findById(id);
    if (!ticket) throw 'Ticket no encontrado';

    await Support.findByIdAndRemove(id);
}

/**
 * Eliminar varios tickets por lotes
 * El gerente (rol 3) no puede eliminar tickets.
 */
async function deleteBatch(ids, userId) {
    if (userId) {
        const user = await User.findById(userId).select('role').lean();
        if (user && user.role === role.rol.Manager) {
            throw new Error('El gerente no puede eliminar tickets');
        }
    }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('No se especificaron tickets para eliminar');
    }
    const result = await Support.deleteMany({ _id: { $in: ids } });
    return { deletedCount: result.deletedCount };
}