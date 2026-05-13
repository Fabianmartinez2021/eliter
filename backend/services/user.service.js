const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment');
const db = require('../_helpers/db');
const emailService = require('./email.service');
const User = db.User;
const Seller = db.Seller;
const Operator = db.Operator;
const Coin = db.Coin;
const Product = db.Product;
const Agency = db.Agency;
const Offer = db.Offer;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const role = require('../enums/roles.enum');

let userService = {

    /**
     * Función para autenticar usuario.
     * Acepta nombre de usuario O correo electrónico (el campo "username" puede contener cualquiera de los dos).
     * 
     * @param {string} username Nombre de usuario o correo electrónico 
     * @param {string} password Contraseña 
     */
    authenticate: async ({ username, password }) => {
        const value = (username || '').trim();
        if (!value) return;
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const query = isEmail
            ? { email: new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
            : { $or: [{ username: value }, { email: new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] };
        const user = await User.findOne(query).populate('agency');
        //Verificar cuenta
        if (user && user.status == 2)
            throw 'Tu cuenta no ha sido verificada';

        if (user && bcrypt.compareSync(password, user.hash)) {
            const token = jwt.sign({ sub: user.id }, config.secret);
           
            // Obtener data para modo offline: todas las consultas en paralelo para reducir tiempo de carga
            const [coins, products, sellers, operators, agency, offers] = await Promise.all([
                Coin.find(),
                Product.find().sort({ name: 'asc' }),
                Seller.find({ agency: user.agency.id, status: 1 }),
                Operator.find({ agency: user.agency.id, status: 1 }),
                Agency.findById(user.agency.id).populate('terminal'),
                Offer.find({ agency: user.agency.id }).populate('product')
            ]);
            return {
                user:{
                    ...user.toJSON(),
                    token,
                },
                data:{
                    coins,
                    products,
                    sellers,
                    operators,
                    agency,
                    offers
                }
            };
        }
    },

    /**
     * Recuperación según opción: password (usuario+enlace), username (solo usuario), both (usuario+enlace por correo).
     * @param {string} emailOrUsername - Correo o usuario según opción
     * @param {string} [origin] - URL base del frontend
     * @param {string} [option] - 'password' | 'username' | 'both'
     */
    forgotPassword: async (emailOrUsername, origin, option) => {
        const value = (emailOrUsername || '').trim().toLowerCase();
        if (!value) return;
        const opt = option === 'username' || option === 'both' ? option : 'password';
        let user;
        if (opt === 'username' || opt === 'both') {
            user = await User.findOne({ email: new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
        } else {
            user = await User.findOne({
                $or: [
                    { email: new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
                    { username: value }
                ]
            });
        }
        if (!user) return;
        const toEmail = user.email || (user.username && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.username) ? user.username : null);
        if (!toEmail) return;
        const usernameLine = `Tu nombre de usuario es: ${user.username}`;
        if (opt === 'username') {
            emailService.sendMail({
                to: toEmail,
                subject: 'Recuperación de usuario',
                text: usernameLine,
                html: `<p><strong>${usernameLine}</strong></p>`
            }).catch((err) => console.error('Error enviando correo de recuperación de usuario:', err));
            return;
        }
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        const base = (origin && /^https?:\/\//i.test(origin) ? origin : (process.env.FRONTEND_URL || config.frontendUrl || '')).replace(/\/$/, '');
        const resetUrl = base ? `${base}/reset-password?token=${token}` : '';
        if (base && resetUrl) {
            emailService.sendMail({
                to: toEmail,
                subject: opt === 'both' ? 'Recuperación de usuario y contraseña' : 'Recuperación de contraseña',
                text: `${usernameLine}\n\nPara restablecer tu contraseña abre este enlace: ${resetUrl}\n\nEl enlace expira en 1 hora.`,
                html: `<p><strong>${usernameLine}</strong></p><p>Para restablecer tu contraseña haz clic en el siguiente enlace:</p><p><a href="${resetUrl}">Restablecer contraseña</a></p><p>El enlace expira en 1 hora.</p>`
            }).catch(async (err) => {
                console.error('Error enviando correo de recuperación:', err);
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();
            });
        } else {
            console.warn('No se envió correo de recuperación: falta URL del frontend (origin en la petición, FRONTEND_URL o config.frontendUrl).');
        }
    },

    /**
     * Restablece la contraseña con el token recibido por correo.
     */
    resetPassword: async (token, newPassword) => {
        if (!token || !newPassword) throw 'Token y nueva contraseña son requeridos';
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) throw 'El enlace ha expirado o no es válido. Solicita uno nuevo.';
        user.hash = bcrypt.hashSync(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    },

    getAll: async () => {
        return await User.find().populate('agency');
    },

    /**
     * Función para obtener usuario por id
     *  
     * @param {string} id 
     */
    getById: async (id) => {
        const user = await User.findById(id);
        return user;
    },


    /**
     * Función para registrar usuario
     * 
     * @param {params} userParam 
     */
    create: async (userParam) => {
        if (await User.findOne({ username: userParam.username })) {
            throw 'Nombre de usuario "' + userParam.username + '" ya usado';
        }
        const email = (userParam.email || '').trim().toLowerCase();
        if (email && await User.findOne({ email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') })) {
            throw 'El correo "' + userParam.email + '" ya está registrado en otra cuenta';
        }

        const toCreate = { ...userParam };
        const emailVal = (toCreate.email || '').trim().toLowerCase();
        toCreate.email = emailVal || null;
        const user = new User(toCreate);

        // encriptar pass
        if (userParam.password) {
            user.hash = bcrypt.hashSync(userParam.password, 10);
        }

        // save user
        await user.save();
    },

    /**
     * Función para actualizar usuario
     * 
     * @param {id} id de usuario 
     * @param {params} userParam - puede incluir origin (URL del frontend) para enlace de verificación de correo
     */
    update: async (id, userParam) => {
        const user = await User.findById(id);

        // Validar
        if (!user) throw 'Usuario no encontrado';
        if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
            throw 'Nombre de usuario "' + userParam.username + '" ya usado';
        }

        const origin = userParam.origin;
        if (userParam.email !== undefined) {
            const email = (userParam.email || '').trim().toLowerCase();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw 'El correo no tiene un formato válido';
            }
            if (email) {
                const existing = await User.findOne({
                    email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
                    _id: { $ne: user._id }
                });
                if (existing) throw 'El correo "' + email + '" ya está registrado en otra cuenta';
            }
            if (!email) {
                user.emailVerified = false;
                user.emailVerificationToken = undefined;
                user.emailVerificationExpires = undefined;
            } else if (user.email !== email) {
                user.emailVerified = false;
                user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
                user.emailVerificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }
        }

        // Encriptar password si fue ingresado
        if (userParam.password) {
            userParam.hash = bcrypt.hashSync(userParam.password, 10);
        }

        // Copiar solo campos permitidos; NUNCA sobrescribir agency, role, status con valores vacíos
        const { origin: _o, ...rest } = userParam;
        const allowed = ['firstName', 'lastName', 'username', 'email', 'hash'];
        const protectedFields = ['agency', 'role', 'status']; // solo actualizar si viene un valor válido
        const toAssign = {};
        for (const key of allowed) {
            if (key in rest) toAssign[key] = rest[key];
        }
        for (const key of protectedFields) {
            const val = rest[key];
            if (val != null && val !== '') toAssign[key] = val;
        }
        if ('email' in toAssign) {
            const emailVal = (toAssign.email || '').trim().toLowerCase();
            toAssign.email = emailVal || null;
        }
        if (user.role === role.rol.Admin && 'receiveSupportTicketNotificationsByEmail' in rest) {
            toAssign.receiveSupportTicketNotificationsByEmail = Boolean(rest.receiveSupportTicketNotificationsByEmail);
        }
        if (user.role === role.rol.Manager) {
            if ('notifyEmailDiffusionTicket' in rest) toAssign.notifyEmailDiffusionTicket = Boolean(rest.notifyEmailDiffusionTicket);
            if ('notifyEmailSameStoreTicket' in rest) toAssign.notifyEmailSameStoreTicket = Boolean(rest.notifyEmailSameStoreTicket);
            if ('notifyEmailTicketReplies' in rest) toAssign.notifyEmailTicketReplies = Boolean(rest.notifyEmailTicketReplies);
        }
        Object.assign(user, toAssign);

        await user.save();

        if (userParam.email !== undefined && user.email && user.emailVerificationToken) {
            const base = (origin && /^https?:\/\//i.test(origin) ? origin : (process.env.FRONTEND_URL || config.frontendUrl || '')).replace(/\/$/, '');
            const verifyUrl = base ? `${base}/verify-email?token=${user.emailVerificationToken}` : '';
            if (base && verifyUrl) {
                emailService.sendMail({
                    to: user.email,
                    subject: 'Verifica tu correo',
                    // El texto plano se queda igual (como respaldo)
                    text: `¡Oh! Lo sentimos. Para poder usar nuestra plataforma, necesitamos que verifiques tu correo electrónico: ${verifyUrl}\n\nEl enlace expira en 7 días.`,
                    // EL CAMBIO DEBE SER AQUÍ:
                    html: `
                        <p>¡Oh! Lo sentimos.</p>
                        <p>Para poder usar nuestra plataforma, necesitamos que <strong>verifiques tu correo electrónico</strong>:</p>
                        <p><a href="${verifyUrl}" style="color: #6a1b9a; font-weight: bold;">Haz clic aquí para verificar correo</a></p>
                        <p style="color: gray; font-size: 12px;">El enlace expira en 7 días.</p>
                    `
                }).catch((err) => console.error('Error enviando correo de verificación:', err));
            } else {
                console.warn('No se envió correo de verificación: falta URL del frontend (origin, FRONTEND_URL o config.frontendUrl).');
            }
        }

        const saved = await User.findById(user.id).populate('agency', 'name');
        return saved && saved.toJSON ? saved.toJSON() : (user.toJSON ? user.toJSON() : user);
    },

    verifyEmail: async (token) => {
        const trimmedToken = (token && typeof token === 'string') ? token.trim() : '';
        if (!trimmedToken) throw 'Token de verificación requerido';
        const user = await User.findOne({
            emailVerificationToken: trimmedToken,
            emailVerificationExpires: { $gt: new Date() }
        });
        if (!user) throw 'El enlace de verificación ha expirado o no es válido';
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        const populated = await User.findById(user.id).populate('agency', 'name');
        return populated && populated.toJSON ? populated.toJSON() : (user.toJSON ? user.toJSON() : user);
    },


    /**
     * Funcion para obtener los usuarios con paginación y filtros menos el usuario admin interno
     */
    dataTable: async () => {
        const users = await User.find({ username: { $ne: "adminDev" } }).populate('agency','name')
        return {
            results: users, 
        }
    },

    /**
     * Funcion para obtener los usuarios con paginación y filtros menos el usuario admin interno
     */
    dataTable: async (userParam) => {

        const users = await User.find({ username: { $ne: "adminDev" }}).populate('agency', 'name');

        return {
            results: users, 
        }
    },

    /**
     * Funcion para obtener los cajeros para filtros en reportes
     * 
     * Y traer todas las sucursales tambien
     */
    getUsersAgency: async (userParam) => {

        //Solo cajeros
        let params = {role: { $eq: role.rol.Cashier }};

        //Si es gerente o cajero solo consultar los cajeros de la sucursal 
        if( userParam.role == role.rol.Cashier ){
            params = { agency: ObjectId(userParam.agency), role: { $eq: role.rol.Cashier } }
        }

        if(userParam.role == role.rol.Manager ){
            params = { agency: ObjectId(userParam.agency), role: { $in: [role.rol.Manager, role.rol.Cashier ] } }
        }

        if(userParam.role == role.rol.Admin ){
            params = {  role: { $in: [ role.rol.Admin, role.rol.Supervisor, role.rol.Cashier, role.rol.Manager ] } }
        }

        if (userParam.role == role.rol.AuditorFinanciero) {
            params = {}; // No se filtra por rol, se obtienen todos los usuarios
        }

        //Si viene el campo admin y es true traer solo usuarios admin/supervisor/gerente
        if(userParam.admin){
            params = {  role: { $in: [role.rol.Admin, role.rol.Supervisor, role.rol.Manager ] } }
        }

        //Si viene el campo admin y es true traer solo usuarios admin/supervisor/gerente
        if(userParam.product){
            params = {  role: { $in: [role.rol.Admin, role.rol.Supervisor ] } }
        }

         //Si viene el campo manager y es true traer solo usuarios gerentes
         if(userParam.manager){
            params = {  role: { $in: [ role.rol.Manager ] } }
        }
        
        const users = await User.find(params).sort({firstName: 'asc', lastName: 'asc'}).populate('agency','name');
        
        const agencies = await Agency.find().sort({name: 'asc'}); 

        /*
        // Se buscan los vendedores para la agencia correspondiente
        const sellers = await Seller.find({ agency: ObjectId(userParam.agency) }).sort({firstName: 'asc', lastName: 'asc'}).populate('agency','name');
        */
        
        return {
            users, 
            agencies,
            // sellers
        }
    },

    registerSeller: async (userParam) => {

        // Buscar usuario
        if (await Seller.findOne({ firstName: userParam.firstName, lastName: userParam.lastName })) {
            throw 'El vendedor ' + userParam.firstName + ' ' + userParam.lastName + ' ya está registrado';
        }

        // Procesar weeklyGoalHistory si viene en userParam
        if (userParam.weeklyGoalHistory && Array.isArray(userParam.weeklyGoalHistory)) {
            // Convertir las fechas de string a Date si es necesario
            userParam.weeklyGoalHistory = userParam.weeklyGoalHistory.map(goal => ({
                ...goal,
                date: new Date(goal.date),
                weeklyTicketGoal: goal.weeklyTicketGoal !== undefined ? goal.weeklyTicketGoal : 0
            }));
            
            // Ordenar el historial por fecha (más reciente primero)
            userParam.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Procesar goalHistoryEntries si viene del frontend (nuevo formato)
        if (userParam.goalHistoryEntries && Array.isArray(userParam.goalHistoryEntries)) {
            // Inicializar el historial si no existe
            if (!userParam.weeklyGoalHistory) {
                userParam.weeklyGoalHistory = [];
            }

            // Procesar cada entrada del historial
            userParam.goalHistoryEntries.forEach(entry => {
                if (entry.changeType === 'weekly_goal_update' && entry.newValues) {
                    const newEntry = {
                        date: new Date(entry.date),
                        weeklyGoal: entry.newValues.weeklyGoal || userParam.weeklyGoal || 0,
                        weeklyGoalMinimumPercentageOfSales: entry.newValues.weeklyGoalMinimumPercentageOfSales || userParam.weeklyGoalMinimumPercentageOfSales || 80,
                        weeklyTicketGoal: entry.newValues.weeklyTicketGoal !== undefined ? entry.newValues.weeklyTicketGoal : (userParam.weeklyTicketGoal !== undefined ? userParam.weeklyTicketGoal : 0)
                    };

                    // Verificar si ya existe esta entrada
                    const exists = userParam.weeklyGoalHistory.some(existingEntry => 
                        existingEntry.date.getTime() === newEntry.date.getTime() &&
                        existingEntry.weeklyGoal === newEntry.weeklyGoal &&
                        existingEntry.weeklyGoalMinimumPercentageOfSales === newEntry.weeklyGoalMinimumPercentageOfSales &&
                        (existingEntry.weeklyTicketGoal || 0) === (newEntry.weeklyTicketGoal || 0)
                    );
                    
                    if (!exists) {
                        userParam.weeklyGoalHistory.push(newEntry);
                    }
                }
            });

            // Ordenar el historial por fecha (más reciente primero)
            userParam.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Eliminar goalHistoryEntries de userParam
            delete userParam.goalHistoryEntries;
        }

        // Preparar los datos para crear el seller con conversiones de tipos adecuadas
        const sellerData = { ...userParam };

        // Convertir tipos y asegurar valores correctos
        if (sellerData.weeklyGoal !== undefined && sellerData.weeklyGoal !== null) {
            sellerData.weeklyGoal = Number(sellerData.weeklyGoal);
        }
        if (sellerData.weeklyGoalMinimumPercentageOfSales !== undefined && sellerData.weeklyGoalMinimumPercentageOfSales !== null) {
            sellerData.weeklyGoalMinimumPercentageOfSales = Number(sellerData.weeklyGoalMinimumPercentageOfSales);
        }
        if (sellerData.weeklyTicketGoal !== undefined && sellerData.weeklyTicketGoal !== null) {
            sellerData.weeklyTicketGoal = Number(sellerData.weeklyTicketGoal);
        }
        if (sellerData.applyForWeeklyGoal !== undefined) {
            // Convertir string "true"/"false" a boolean si es necesario
            sellerData.applyForWeeklyGoal = typeof sellerData.applyForWeeklyGoal === 'string' 
                ? sellerData.applyForWeeklyGoal === 'true' 
                : Boolean(sellerData.applyForWeeklyGoal);
        }
        if (sellerData.creditLimit !== undefined && sellerData.creditLimit !== null) {
            sellerData.creditLimit = Number(sellerData.creditLimit);
        }
        if (sellerData.agency !== undefined && sellerData.agency !== null) {
            sellerData.agency = ObjectId(sellerData.agency);
        }
        if (sellerData.wholesalesGoal !== undefined && sellerData.wholesalesGoal !== null) {
            sellerData.wholesalesGoal = Number(sellerData.wholesalesGoal);
        }
        if (sellerData.wholesalesGoalCommissionPercentage !== undefined && sellerData.wholesalesGoalCommissionPercentage !== null) {
            sellerData.wholesalesGoalCommissionPercentage = Number(sellerData.wholesalesGoalCommissionPercentage);
        }

        const seller = new Seller(sellerData);

        const sellerSaved = await seller.save();

        if (!sellerSaved) {
            throw 'Hubo un error guardando el vendedor. Intentelo de nuevo';
        }
    }, 

    getSellers: async () => {

        const sellers = await Seller.find().populate('agency', 'name');

        return {
            results: sellers,
        };
    },

    getSellerById: async (id) => {

        // Primero intentar buscar por _id del Seller
        let seller = await Seller.findById(id);
        
        // Si no se encuentra, intentar buscar por agency (ObjectId)
        if (!seller) {
            // Verificar si el id es un ObjectId válido para agency
            if (ObjectId.isValid(id)) {
                seller = await Seller.findOne({ agency: ObjectId(id) });
            }
        }

        return seller;
    },

    updateSeller: async (id, userParam) => {

        const seller = await Seller.findById(id);

        // Validar
        if (!seller) throw 'Usuario no encontrado';
        if ((seller.firstName !== userParam.firstName) || (seller.lastName !== userParam.lastName) ) {
            if (await Seller.findOne({ firstName: userParam.firstName, lastName: userParam.lastName })) {
                throw 'El vendedor ' + userParam.firstName + ' ' + userParam.lastName + ' ya está registrado';
            }
        }

        // Procesar weeklyGoalHistory si viene en userParam
        if (userParam.weeklyGoalHistory && Array.isArray(userParam.weeklyGoalHistory)) {
            // Convertir las fechas de string a Date si es necesario
            const newHistoryEntries = userParam.weeklyGoalHistory.map(goal => ({
                ...goal,
                date: new Date(goal.date),
                weeklyTicketGoal: goal.weeklyTicketGoal !== undefined ? goal.weeklyTicketGoal : 0
            }));

            // Agregar nuevos registros al historial existente en lugar de sobrescribirlo
            if (!seller.weeklyGoalHistory) {
                seller.weeklyGoalHistory = [];
            }

            // Agregar solo los nuevos registros que no existan ya
            newHistoryEntries.forEach(newEntry => {
                const exists = seller.weeklyGoalHistory.some(existingEntry => 
                    existingEntry.date.getTime() === newEntry.date.getTime() &&
                    existingEntry.weeklyGoal === newEntry.weeklyGoal &&
                    existingEntry.weeklyGoalMinimumPercentageOfSales === newEntry.weeklyGoalMinimumPercentageOfSales &&
                    (existingEntry.weeklyTicketGoal || 0) === (newEntry.weeklyTicketGoal || 0)
                );
                
                if (!exists) {
                    seller.weeklyGoalHistory.push(newEntry);
                }
            });

            // Ordenar el historial por fecha (más reciente primero)
            seller.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Remover weeklyGoalHistory de userParam para evitar sobrescribir
            delete userParam.weeklyGoalHistory;
        }

        // Procesar goalHistoryEntries si viene del frontend (nuevo formato)
        if (userParam.goalHistoryEntries && Array.isArray(userParam.goalHistoryEntries)) {
            // Agregar nuevos registros al historial existente
            if (!seller.weeklyGoalHistory) {
                seller.weeklyGoalHistory = [];
            }

            // Procesar cada entrada del historial
            userParam.goalHistoryEntries.forEach(entry => {
                if (entry.changeType === 'weekly_goal_update' && entry.newValues) {
                    const newEntry = {
                        date: new Date(entry.date),
                        weeklyGoal: entry.newValues.weeklyGoal || userParam.weeklyGoal || seller.weeklyGoal,
                        weeklyGoalMinimumPercentageOfSales: entry.newValues.weeklyGoalMinimumPercentageOfSales || userParam.weeklyGoalMinimumPercentageOfSales || seller.weeklyGoalMinimumPercentageOfSales,
                        weeklyTicketGoal: entry.newValues.weeklyTicketGoal !== undefined ? entry.newValues.weeklyTicketGoal : (userParam.weeklyTicketGoal !== undefined ? userParam.weeklyTicketGoal : (seller.weeklyTicketGoal || 0))
                    };

                    // Verificar si ya existe esta entrada
                    const exists = seller.weeklyGoalHistory.some(existingEntry => 
                        existingEntry.date.getTime() === newEntry.date.getTime() &&
                        existingEntry.weeklyGoal === newEntry.weeklyGoal &&
                        existingEntry.weeklyGoalMinimumPercentageOfSales === newEntry.weeklyGoalMinimumPercentageOfSales &&
                        existingEntry.weeklyTicketGoal === newEntry.weeklyTicketGoal
                    );
                    
                    if (!exists) {
                        seller.weeklyGoalHistory.push(newEntry);
                    }
                }
            });

            // Ordenar el historial por fecha (más reciente primero)
            seller.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Eliminar goalHistoryEntries de userParam
            delete userParam.goalHistoryEntries;
        }

        // copiar propiedades de userParam a seller
        Object.assign(seller, userParam);

        // Asegurar que meta semanal y porcentaje se persistan y marcar como modificados para Mongoose
        if (userParam.weeklyGoal !== undefined && userParam.weeklyGoal !== null) {
            seller.weeklyGoal = Number(userParam.weeklyGoal);
            seller.markModified('weeklyGoal');
        }
        if (userParam.weeklyGoalMinimumPercentageOfSales !== undefined && userParam.weeklyGoalMinimumPercentageOfSales !== null) {
            seller.weeklyGoalMinimumPercentageOfSales = Number(userParam.weeklyGoalMinimumPercentageOfSales);
            seller.markModified('weeklyGoalMinimumPercentageOfSales');
        }
        if (userParam.weeklyTicketGoal !== undefined && userParam.weeklyTicketGoal !== null) {
            seller.weeklyTicketGoal = Number(userParam.weeklyTicketGoal);
            seller.markModified('weeklyTicketGoal');
        }
        if (userParam.applyForWeeklyGoal !== undefined) {
            // Convertir string "true"/"false" a boolean si es necesario
            const applyValue = typeof userParam.applyForWeeklyGoal === 'string' 
                ? userParam.applyForWeeklyGoal === 'true' 
                : Boolean(userParam.applyForWeeklyGoal);
            seller.applyForWeeklyGoal = applyValue;
            seller.markModified('applyForWeeklyGoal');
        }
        if (userParam.creditLimit !== undefined && userParam.creditLimit !== null) {
            seller.creditLimit = Number(userParam.creditLimit);
            seller.markModified('creditLimit');
        }
        if (userParam.agency !== undefined && userParam.agency !== null) {
            seller.agency = ObjectId(userParam.agency);
            seller.markModified('agency');
        }
        if (userParam.firstName !== undefined && userParam.firstName !== null) {
            seller.firstName = userParam.firstName;
            seller.markModified('firstName');
        }

        // save seller
        const sellerSaved = await seller.save();

        if (!sellerSaved) {
            throw 'Hubo un error guardando el vendedor. Intentelo de nuevo';
        }
        return sellerSaved;
    },

    /**
     * Función helper para agregar una nueva entrada al historial de metas semanales
     * 
     * @param {string} sellerId - ID del vendedor
     * @param {Object} goalData - Datos de la nueva meta { date, weeklyGoal, weeklyGoalMinimumPercentageOfSales }
     * @returns {Object} Vendedor actualizado
     */
    addWeeklyGoalToHistory: async (sellerId, goalData) => {
        const seller = await Seller.findById(sellerId);
        
        if (!seller) {
            throw 'Vendedor no encontrado';
        }

        // Inicializar el historial si no existe
        if (!seller.weeklyGoalHistory) {
            seller.weeklyGoalHistory = [];
        }

        // Crear nueva entrada
        const newEntry = {
            date: new Date(goalData.date),
            weeklyGoal: goalData.weeklyGoal,
            weeklyGoalMinimumPercentageOfSales: goalData.weeklyGoalMinimumPercentageOfSales
        };

        // Verificar si ya existe una entrada con la misma fecha y datos
        const exists = seller.weeklyGoalHistory.some(existingEntry => 
            existingEntry.date.getTime() === newEntry.date.getTime() &&
            existingEntry.weeklyGoal === newEntry.weeklyGoal &&
            existingEntry.weeklyGoalMinimumPercentageOfSales === newEntry.weeklyGoalMinimumPercentageOfSales
        );

        if (!exists) {
            seller.weeklyGoalHistory.push(newEntry);
            
            // Ordenar el historial por fecha (más reciente primero)
            seller.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            await seller.save();
        }

        return seller;
    },

    /**
     * Función para obtener la meta semanal histórica de un vendedor para una fecha específica
     * 
     * @param {string} sellerId - ID del vendedor
     * @param {Date} targetDate - Fecha para la cual se quiere obtener la meta
     * @returns {Object} Objeto con weeklyGoal y weeklyGoalMinimumPercentageOfSales
     */
    getSellerWeeklyGoalForDate: async (sellerId, targetDate) => {
        const seller = await Seller.findById(sellerId);
        
        if (!seller) {
            throw 'Vendedor no encontrado';
        }

        // Si no hay historial, usar los valores actuales como fallback
        if (!seller.weeklyGoalHistory || seller.weeklyGoalHistory.length === 0) {
            return {
                weeklyGoal: seller.weeklyGoal,
                weeklyGoalMinimumPercentageOfSales: seller.weeklyGoalMinimumPercentageOfSales,
                weeklyTicketGoal: seller.weeklyTicketGoal || 0,
                goalDate: null
            };
        }

        // Convertir targetDate a Date si es string
        const searchDate = new Date(targetDate);
        
        // Encontrar el lunes de la semana del targetDate
        const targetMonday = moment(searchDate).startOf('week').add(1, 'day'); // Lunes de esa semana

        // Ordenar el historial por fecha descendente (más reciente primero)
        const sortedHistory = seller.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Buscar la meta más reciente que sea anterior o igual al lunes de la semana objetivo
        for (const goalRecord of sortedHistory) {
            const goalDate = moment(goalRecord.date);
            const goalMonday = goalDate.startOf('week').add(1, 'day'); // Lunes de la semana cuando se estableció la meta
            
            if (goalMonday.isSameOrBefore(targetMonday)) {
                return {
                    weeklyGoal: goalRecord.weeklyGoal,
                    weeklyGoalMinimumPercentageOfSales: goalRecord.weeklyGoalMinimumPercentageOfSales,
                    weeklyTicketGoal: goalRecord.weeklyTicketGoal !== undefined ? goalRecord.weeklyTicketGoal : (seller.weeklyTicketGoal || 0),
                    goalDate: goalDate.toDate()
                };
            }
        }

        // Si no se encuentra ninguna meta en el historial para esa fecha,
        // usar los valores actuales como fallback
        return {
            weeklyGoal: seller.weeklyGoal,
            weeklyGoalMinimumPercentageOfSales: seller.weeklyGoalMinimumPercentageOfSales,
            weeklyTicketGoal: seller.weeklyTicketGoal || 0,
            goalDate: null
        };
    },

    /**
     * Función para obtener el historial completo de metas semanales de un vendedor
     * 
     * @param {string} sellerId - ID del vendedor
     * @returns {Array} Array con todo el historial de metas
     */
    getSellerWeeklyGoalHistory: async (sellerId) => {
        const seller = await Seller.findById(sellerId);
        
        if (!seller) {
            throw 'Vendedor no encontrado';
        }

        return seller.weeklyGoalHistory || [];
    },

}

module.exports = userService;