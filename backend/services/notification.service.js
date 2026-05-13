const mongoose = require('mongoose');
const config = require('../config.json');
const db = require('../_helpers/db');
const Notification = db.Notification;
const User = db.User;
const emailService = require('./email.service');
const role = require('../enums/roles.enum');

module.exports = {
    create,
    createForAdmins,
    createForAdminsAndManagersOfAgency,
    createForManagersOfAgency,
    createForAllManagers,
    createForAdminsAndAllManagers,
    sendSupportTicketEmailToOptedInAdmins,
    sendSupportTicketEmailToOptedInManagers,
    getByUserId,
    markRead,
    markReadByTicket,
    delete: deleteNotification,
    _delete
};

/**
 * Crea una notificación para un usuario
 */
async function create(params) {
    const notification = new Notification(params);
    await notification.save();
    return notification;
}

/**
 * Crea notificaciones para admins (rol 1), excluyendo al creador del ticket
 */
async function createForAdmins(params) {
    const admins = await User.find({ role: 1 }).select('_id').lean();
    if (!admins || admins.length === 0) return [];
    const creatorId = params.excludeUserId ? String(params.excludeUserId) : null;
    const filtered = creatorId
        ? admins.filter(a => String(a._id) !== creatorId)
        : admins;
    if (filtered.length === 0) return [];
    const notifications = filtered.map(admin => ({
        userId: admin._id,
        ticketId: params.ticketId,
        ticketNumber: params.ticketNumber,
        title: params.title,
        message: params.message,
        senderName: params.senderName,
        type: params.type || 'info'
    }));
    return Notification.insertMany(notifications);
}

/**
 * Crea notificaciones para admins (rol 1) + gerentes (rol 3) de la misma tienda.
 * - Admins: todos
 * - Gerentes: solo los de la agencia del ticket (creatorAgencyId)
 */
async function createForAdminsAndManagersOfAgency(params) {
    const creatorId = params.excludeUserId ? String(params.excludeUserId) : null;
    const creatorAgencyId = params.creatorAgencyId ? String(params.creatorAgencyId) : null;

    const admins = await User.find({ role: 1 }).select('_id').lean();
    const adminNotifications = admins
        .filter(a => !creatorId || String(a._id) !== creatorId)
        .map(a => ({
            userId: a._id,
            ticketId: params.ticketId,
            ticketNumber: params.ticketNumber,
            title: params.title,
            message: params.message,
            senderName: params.senderName,
            type: params.type || 'info'
        }));

    let managerNotifications = [];
    if (creatorAgencyId && mongoose.Types.ObjectId.isValid(creatorAgencyId)) {
        const agencyObjId = new mongoose.Types.ObjectId(creatorAgencyId);
        const managers = await User.find({ role: role.rol.Manager, agency: agencyObjId }).select('_id').lean();
        managerNotifications = managers
            .filter(m => !creatorId || String(m._id) !== creatorId)
            .map(m => ({
                userId: m._id,
                ticketId: params.ticketId,
                ticketNumber: params.ticketNumber,
                title: params.title,
                message: params.message,
                senderName: params.senderName,
                type: params.type || 'info'
            }));
    }

    const all = [...adminNotifications, ...managerNotifications];
    return all.length > 0 ? Notification.insertMany(all) : [];
}

/**
 * Crea notificaciones SOLO para gerentes (rol 3) de una tienda específica.
 * Usado cuando admin (rol 1) crea un ticket y selecciona la tienda destino.
 */
async function createForManagersOfAgency(params) {
    const targetAgencyId = params.targetAgencyId ? String(params.targetAgencyId) : null;
    if (!targetAgencyId || !mongoose.Types.ObjectId.isValid(targetAgencyId)) return [];

    const agencyObjId = new mongoose.Types.ObjectId(targetAgencyId);
    const managers = await User.find({ role: role.rol.Manager, agency: agencyObjId }).select('_id').lean();
    if (!managers || managers.length === 0) return [];

    const notifications = managers.map(m => ({
        userId: m._id,
        ticketId: params.ticketId,
        ticketNumber: params.ticketNumber,
        title: params.title,
        message: params.message,
        senderName: params.senderName,
        type: params.type || 'info'
    }));
    return Notification.insertMany(notifications);
}

/**
 * Crea notificaciones para TODOS los gerentes (rol 3), sin importar la tienda.
 * Usado para tickets de difusión (admin selecciona "todas las tiendas").
 */
async function createForAllManagers(params) {
    const excludeUserId = params.excludeUserId ? String(params.excludeUserId) : null;
    const managers = await User.find({ role: role.rol.Manager }).select('_id').lean();
    if (!managers || managers.length === 0) return [];

    const notifications = managers
        .filter(m => !excludeUserId || String(m._id) !== excludeUserId)
        .map(m => ({
            userId: m._id,
            ticketId: params.ticketId,
            ticketNumber: params.ticketNumber,
            title: params.title,
            message: params.message,
            senderName: params.senderName,
            type: params.type || 'info'
        }));
    return notifications.length > 0 ? Notification.insertMany(notifications) : [];
}

/**
 * Crea notificaciones para admins + TODOS los gerentes. Usado en respuestas a tickets de difusión.
 */
async function createForAdminsAndAllManagers(params) {
    const excludeUserId = params.excludeUserId ? String(params.excludeUserId) : null;

    const admins = await User.find({ role: 1 }).select('_id').lean();
    const adminNotifications = admins
        .filter(a => !excludeUserId || String(a._id) !== excludeUserId)
        .map(a => ({
            userId: a._id,
            ticketId: params.ticketId,
            ticketNumber: params.ticketNumber,
            title: params.title,
            message: params.message,
            senderName: params.senderName,
            type: params.type || 'info'
        }));

    const managers = await User.find({ role: role.rol.Manager }).select('_id').lean();
    const managerNotifications = managers
        .filter(m => !excludeUserId || String(m._id) !== excludeUserId)
        .map(m => ({
            userId: m._id,
            ticketId: params.ticketId,
            ticketNumber: params.ticketNumber,
            title: params.title,
            message: params.message,
            senderName: params.senderName,
            type: params.type || 'info'
        }));

    const all = [...adminNotifications, ...managerNotifications];
    return all.length > 0 ? Notification.insertMany(all) : [];
}

/**
 * Envía por correo el resumen del evento de ticket de soporte a los admins que tienen
 * receiveSupportTicketNotificationsByEmail === true y email válido (sin límite de mensajes).
 * Excluye a excludeUserId (quien creó el ticket o quien respondió) para no notificar las propias acciones.
 */
async function sendSupportTicketEmailToOptedInAdmins(params) {
    const ticketId = params.ticketId ? String(params.ticketId) : '';
    const ticketNumber = params.ticketNumber != null ? params.ticketNumber : '';
    const title = params.title || 'Ticket de soporte';
    const message = params.message || '';
    const senderName = params.senderName || 'Usuario';
    const excludeUserId = params.excludeUserId ? String(params.excludeUserId) : null;
    const frontendUrl = (process.env.FRONTEND_URL || config.frontendUrl || '').replace(/\/$/, '');
    const linkLine = frontendUrl && ticketId
        ? `\n\nVer ticket: ${frontendUrl}/support-detail/${ticketId}`
        : '';

    const admins = await User.find({
        role: role.rol.Admin,
        receiveSupportTicketNotificationsByEmail: true,
        email: { $exists: true, $nin: [null, ''] }
    }).select('email _id firstName lastName').lean();

    if (!admins || admins.length === 0) return;

    const filtered = excludeUserId
        ? admins.filter(a => String(a._id) !== excludeUserId)
        : admins;
    if (filtered.length === 0) return;

    const subject = `[Soporte] #${ticketNumber} ${title}`;
    const text = `${title}\n${message}\n— ${senderName}${linkLine}`;
    const html = `<p><strong>${title}</strong></p><p>${message.replace(/\n/g, '<br>')}</p><p>— ${senderName}</p>${linkLine ? `<p><a href="${frontendUrl}/support-detail/${ticketId}">Ver ticket</a></p>` : ''}`;

    const sendPromises = filtered.map((admin) => {
        const to = (admin.email || '').trim();
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Promise.resolve();
        return emailService.sendMail({ to, subject, text, html }).catch((err) => {
            console.error('[notification] Error enviando correo de soporte a admin:', to, err);
        });
    });
    await Promise.allSettled(sendPromises);
}

/**
 * Envía correo a gerentes que optaron por notificaciones según el tipo de evento.
 * - diffusion: ticket de difusión creado → gerentes con notifyEmailDiffusionTicket
 * - sameStore: ticket creado por/admin para una tienda → solo gerentes de ESA tienda con notifyEmailSameStoreTicket
 * - reply: respuesta en ticket → gerentes de la tienda del ticket con notifyEmailTicketReplies
 * NUNCA notifica a gerentes de otras tiendas.
 * excludeUserId: quien creó el ticket o quien respondió (admin o gerente) — no se le envía correo por su propia acción.
 */
async function sendSupportTicketEmailToOptedInManagers(params) {
    const { type, agencyId } = params;
    const ticketId = params.ticketId ? String(params.ticketId) : '';
    const ticketNumber = params.ticketNumber != null ? params.ticketNumber : '';
    const title = params.title || 'Ticket de soporte';
    const message = params.message || '';
    const senderName = params.senderName || 'Usuario';
    const excludeUserId = params.excludeUserId != null && params.excludeUserId !== '' ? String(params.excludeUserId) : null;
    const frontendUrl = (process.env.FRONTEND_URL || config.frontendUrl || '').replace(/\/$/, '');
    const linkLine = frontendUrl && ticketId
        ? `\n\nVer ticket: ${frontendUrl}/support-detail/${ticketId}`
        : '';

    let query = { role: role.rol.Manager };
    if (type === 'diffusion') {
        query.notifyEmailDiffusionTicket = true;
    } else if (type === 'sameStore' && agencyId && mongoose.Types.ObjectId.isValid(agencyId)) {
        query.notifyEmailSameStoreTicket = true;
        query.agency = new mongoose.Types.ObjectId(agencyId);
    } else if (type === 'reply') {
        query.notifyEmailTicketReplies = true;
        if (agencyId && mongoose.Types.ObjectId.isValid(agencyId)) {
            query.agency = new mongoose.Types.ObjectId(agencyId);
        }
    } else {
        return;
    }

    query.email = { $exists: true, $nin: [null, ''] };

    const managers = await User.find(query).select('email _id').lean();
    if (!managers || managers.length === 0) return;

    // No enviar correo a quien realizó la acción (creó el ticket o escribió la respuesta), sea admin o gerente
    const filtered = excludeUserId
        ? managers.filter(m => m._id && String(m._id) !== excludeUserId)
        : managers;
    if (filtered.length === 0) return;

    const subject = `[Soporte] #${ticketNumber} ${title}`;
    const text = `${title}\n${message}\n— ${senderName}${linkLine}`;
    const html = `<p><strong>${title}</strong></p><p>${message.replace(/\n/g, '<br>')}</p><p>— ${senderName}</p>${linkLine ? `<p><a href="${frontendUrl}/support-detail/${ticketId}">Ver ticket</a></p>` : ''}`;

    const sendPromises = filtered.map((m) => {
        const to = (m.email || '').trim();
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Promise.resolve();
        return emailService.sendMail({ to, subject, text, html }).catch((err) => {
            console.error('[notification] Error enviando correo de soporte a gerente:', to, err);
        });
    });
    await Promise.allSettled(sendPromises);
}

/**
 * Obtiene notificaciones de un usuario (no leídas primero, luego por fecha).
 * Para gerentes (rol 3): solo notificaciones de tickets de su tienda (agency).
 */
async function getByUserId(userId) {
    const user = await User.findById(userId).select('role agency').lean();
    if (!user) return [];

    let query = { userId };
    if (user.role === role.rol.Manager && user.agency) {
        const agencyId = String(user.agency);
        const notifications = await Notification.find(query)
            .sort({ read: 1, createdAt: -1 })
            .populate({
                path: 'ticketId',
                select: 'affair supportNumber status user targetAgency broadcastToAllManagers',
                populate: [
                    { path: 'user', select: 'agency' },
                    { path: 'targetAgency', select: 'name' }
                ]
            })
            .lean();
        return notifications.filter(n => {
            const ticket = n.ticketId;
            if (!ticket) return false;
            if (ticket.broadcastToAllManagers) return true; // Tickets de difusión: todos los gerentes
            const ticketUserAgency = ticket.user?.agency;
            const ticketUserAgencyId = ticketUserAgency ? String(ticketUserAgency._id || ticketUserAgency) : null;
            const ticketTargetAgencyId = ticket.targetAgency ? String(ticket.targetAgency._id || ticket.targetAgency) : null;
            return ticketUserAgencyId === agencyId || ticketTargetAgencyId === agencyId;
        });
    }

    return Notification.find(query)
        .sort({ read: 1, createdAt: -1 })
        .populate('ticketId', 'affair supportNumber status')
        .lean();
}

/**
 * Marca una notificación como leída
 */
async function markRead(id, userId) {
    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) return null;
    notification.read = true;
    await notification.save();
    return notification;
}

/**
 * Marca todas las notificaciones de un ticket como leídas para un usuario
 */
async function markReadByTicket(ticketId, userId) {
    return Notification.updateMany(
        { ticketId, userId },
        { $set: { read: true } }
    );
}

/** Elimina una notificación (solo si pertenece al usuario) */
async function deleteNotification(id, userId) {
    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) return null;
    await Notification.findByIdAndDelete(id);
    return notification;
}

async function _delete(id) {
    return Notification.findByIdAndDelete(id);
}
