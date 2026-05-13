const db = require('../_helpers/db');
const Product = db.Product;
const NoteMarket = db.NoteMarket;
const InventoryFiscal = db.InventoryFiscal;
const InventoryRecordFiscal = db.InventoryRecordFiscal;
const Agency = db.Agency;
const OrderMiscellaneous = db.OrderMiscellaneous;
const OrderMarketMiscellaneous = db.OrderMarketMiscellaneous;
const mongoose = require('mongoose');
const invoiceService = require('./invoice.service');

let webhookService = {
    /**
     * Procesa un webhook de nota de mercado recibido del backend de fábrica
     * 
     * @param {object} payload - Payload del webhook
     * @param {string} action - Acción: 'created', 'updated' o 'deleted'
     */
    handleNoteMarketWebhook: async (payload) => {
        try {
            if (!payload || !payload.data) {
                throw new Error('Payload inválido: falta campo data');
            }

            // Si la acción es 'deleted', manejar la eliminación
            if (payload.action === 'deleted') {
                return await webhookService.deleteNoteMarket(payload);
            }

            // Si la acción es 'audited', manejar la auditoría
            if (payload.action === 'audited') {
                return await webhookService.handleNoteMarketAudit(payload);
            }

            const { 
                id,
                order,
                products,
                agency,
                user,
                userName,
                total,
                isWholesale,
                appliedWholesaleDiscount,
                differential,
                combosDifferential,
                wholesaleDiscountDifferential,
                totalDifferential,
                totalWeight,
                valueDollar,
                valueEur,
                valueCop,
                totalDollar,
                seller,
                operator,
                comment,
                marketId,
                marketName,
                marketCompany,
                marketAttendant,
                marketAddress,
                driverId,
                driverName,
                status,
                audit,
                commentAudit,
                createdDate
            } = payload.data;

            // Función auxiliar para convertir a ObjectId de forma segura
            const toObjectId = (value) => {
                if (!value) return null;
                if (value instanceof mongoose.Types.ObjectId) return value;
                if (mongoose.Types.ObjectId.isValid(value)) {
                    return new mongoose.Types.ObjectId(value);
                }
                return null;
            };

            // Preparar datos para la nota de mercado
            const resolvedAgency =  toObjectId(marketId);

            const noteMarketData = {
                products: products || [],
                agency: resolvedAgency,
                user: toObjectId(user),
                userName: userName || '',
                total: total !== undefined && total !== null ? total : 0,
                isWholesale: isWholesale || false,
                appliedWholesaleDiscount: appliedWholesaleDiscount || false,
                differential: differential !== undefined && differential !== null ? differential : 0,
                combosDifferential: combosDifferential !== undefined && combosDifferential !== null ? combosDifferential : 0,
                wholesaleDiscountDifferential: wholesaleDiscountDifferential !== undefined && wholesaleDiscountDifferential !== null ? wholesaleDiscountDifferential : 0,
                totalDifferential: totalDifferential !== undefined && totalDifferential !== null ? totalDifferential : 0,
                totalWeight: totalWeight !== undefined && totalWeight !== null ? totalWeight : 0,
                valueDollar: valueDollar !== undefined && valueDollar !== null ? valueDollar : 0,
                valueEur: valueEur !== undefined && valueEur !== null ? valueEur : 0,
                valueCop: valueCop !== undefined && valueCop !== null ? valueCop : 0,
                totalDollar: totalDollar !== undefined && totalDollar !== null ? totalDollar : 0,
                seller: toObjectId(seller),
                operator: toObjectId(operator),
                comment: comment || '',
                marketId: toObjectId(marketId),
                marketName: marketName || '',
                marketCompany: marketCompany || '',
                marketAttendant: marketAttendant || '',
                marketAddress: marketAddress || '',
                driverId: toObjectId(driverId),
                driverName: driverName || '',
                idTicket: payload.data.idTicket || null,
                status: status || 'pending',
                createdDate: createdDate ? new Date(createdDate) : undefined
            };

            // Solo incluir audit y commentAudit si vienen explícitamente en el payload
            // Esto preserva los valores existentes cuando llega un webhook updated sin estos campos
            if (audit !== undefined) {
                noteMarketData.audit = Boolean(audit);
            }
            if (commentAudit !== undefined) {
                noteMarketData.commentAudit = String(commentAudit);
            }

            // Si viene un order desde fábrica, establecerlo explícitamente
            // Esto previene que el auto-incremento lo sobrescriba
            if (order !== undefined && order !== null) {
                noteMarketData.order = parseInt(order);
            }

            // Si hay un ID en el payload, buscar si ya existe la nota
            let noteMarket;
            if (id && mongoose.Types.ObjectId.isValid(id)) {
                noteMarket = await NoteMarket.findById(id);
            }

            // Si existe y la acción es 'updated', actualizar
            if (noteMarket && payload.action === 'updated') {
                // Object.assign solo actualiza los campos que están en noteMarketData
                // Si audit y commentAudit no están en noteMarketData, no se sobrescriben
                Object.assign(noteMarket, noteMarketData);
                const saved = await noteMarket.save();
                
                return {
                    success: true,
                    message: `Nota de mercado ${order || id} actualizada correctamente`,
                    noteMarket: saved,
                    action: 'updated'
                };
            } 
            // Si no existe o la acción es 'created', crear nueva
            else {
                // Si viene un order desde fábrica, usarlo directamente
                if (order !== undefined && order !== null) {
                    noteMarketData.order = parseInt(order);
                }
                
                // Usar findOneAndUpdate con upsert para evitar que el plugin mongoose-sequence
                // sobrescriba el order. Esto no ejecuta los hooks pre-save donde se ejecuta el auto-increment
                const query = {};
                if (id && mongoose.Types.ObjectId.isValid(id)) {
                    query._id = new mongoose.Types.ObjectId(id);
                } else if (order !== undefined && order !== null) {
                    // Si no hay ID pero hay order, buscar por order para evitar duplicados
                    query.order = parseInt(order);
                } else {
                    // Si no hay ID ni order, usar un ID temporal
                    query._id = new mongoose.Types.ObjectId();
                    noteMarketData._id = query._id;
                }
                
                // Si la nota ya existe, preservar audit y commentAudit si no vienen en el payload
                const existingNote = await NoteMarket.findOne(query);
                if (existingNote && (audit === undefined || commentAudit === undefined)) {
                    // Si la nota existe y no vienen audit/commentAudit en el payload, preservarlos
                    const updateData = { ...noteMarketData };
                    if (audit === undefined) {
                        updateData.audit = existingNote.audit !== undefined ? existingNote.audit : false;
                    }
                    if (commentAudit === undefined) {
                        updateData.commentAudit = existingNote.commentAudit || '';
                    }
                    // Actualizar con $set para preservar los valores existentes
                    const updated = await NoteMarket.findOneAndUpdate(
                        query,
                        { $set: updateData },
                        { new: true }
                    );
                    return {
                        success: true,
                        message: `Nota de mercado ${order || id || 'existente'} actualizada correctamente`,
                        noteMarket: updated,
                        action: 'created'
                    };
                }
                
                const created = await NoteMarket.findOneAndUpdate(
                    query,
                    { $setOnInsert: noteMarketData },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: false // Evitar que se ejecuten defaults que puedan sobrescribir el order
                    }
                );
                
                return {
                    success: true,
                    message: `Nota de mercado ${order || id || 'nueva'} creada correctamente`,
                    noteMarket: created,
                    action: 'created'
                };
            }

        } catch (error) {
            console.error('Error procesando webhook de nota de mercado:', error);
            throw error;
        }
    },

    /**
     * Procesa un webhook de invoice recibido del backend de fábrica
     * Actualiza el inventario fiscal de cada tienda según su agencyId
     * 
     * @param {object} payload - Payload del webhook
     */
    handleInvoiceWebhook: async (payload) => {
        try {
            if (!payload || !payload.data) {
                throw new Error('Payload inválido: falta campo data');
            }

            const invoiceData = payload.data;

            // Función auxiliar para convertir a ObjectId de forma segura
            const toObjectId = (value) => {
                if (!value) return null;
                if (value instanceof mongoose.Types.ObjectId) return value;
                if (mongoose.Types.ObjectId.isValid(value)) {
                    return new mongoose.Types.ObjectId(value);
                }
                return null;
            };

            // Obtener el agencyId del invoice (puede venir en agencyId, agency, o market.agencyId)
            let agencyId = invoiceData.agencyId || invoiceData.agency || 
                          (invoiceData.market && invoiceData.market.agencyId) || 
                          (invoiceData.market && invoiceData.market.id);

            if (!agencyId) {
                throw new Error('No se encontró agencyId en el payload del invoice');
            }

            // Convertir a ObjectId
            const resolvedAgencyId = toObjectId(agencyId);
            if (!resolvedAgencyId) {
                throw new Error(`agencyId inválido: ${agencyId}`);
            }

            // Verificar que la agencia existe
            const agency = await Agency.findById(resolvedAgencyId);
            if (!agency) {
                throw new Error(`Agencia no encontrada con ID: ${agencyId}`);
            }

            // Validar que hay productos
            if (!invoiceData.products || !Array.isArray(invoiceData.products) || invoiceData.products.length === 0) {
                throw new Error('El invoice no contiene productos válidos');
            }

            // Primero, guardar/actualizar la factura en el modelo Invoice
            const savedInvoice = await invoiceService.syncInvoiceFromWebhook(payload);

            const processedProducts = [];
            const errors = [];

            // Procesar cada producto del invoice
            for (let item of invoiceData.products) {
                try {
                    // Buscar el producto por ID o código
                    let productId = item.id;
                    
                    if (!productId && item.code) {
                        const productByCode = await Product.findOne({ code: item.code });
                        if (productByCode) {
                            productId = productByCode._id.toString();
                        }
                    }

                    if (!productId && item.name) {
                        const productByName = await Product.findOne({ name: item.name });
                        if (productByName) {
                            productId = productByName._id.toString();
                        }
                    }

                    if (!productId) {
                        errors.push(`Producto no encontrado: ${item.name || item.code || 'sin nombre'}`);
                        continue;
                    }

                    const productObjectId = toObjectId(productId);
                    if (!productObjectId) {
                        errors.push(`ID de producto inválido: ${productId}`);
                        continue;
                    }

                    // Obtener la cantidad en kg (puede venir como kg o units según la presentación)
                    let kgToAdd = 0;
                    if (item.presentation === 'kg' || item.presentation === 'Kg' || !item.presentation) {
                        kgToAdd = parseFloat(item.kg || 0);
                    } else {
                        // Si es por unidades, convertir según sea necesario
                        // Por ahora, asumimos que units también puede representar kg en algunos casos
                        kgToAdd = parseFloat(item.units || item.kg || 0);
                    }

                    if (kgToAdd <= 0) {
                        continue;
                    }

                    // Buscar si el producto ya existe en el inventario fiscal para esta agencia
                    let inventoryFiscal = await InventoryFiscal.findOne({
                        product: productObjectId,
                        agency: resolvedAgencyId
                    });

                    if (inventoryFiscal) {
                        // Producto existente: actualizar el peso total
                        const previousKg = parseFloat(inventoryFiscal.kg);
                        const total = previousKg + kgToAdd;

                        // Registrar la entrada en el historial
                        const inventoryRecord = new InventoryRecordFiscal({
                            product: productObjectId,
                            agency: resolvedAgencyId,
                            kg: previousKg.toFixed(3), // Peso anterior
                            in: kgToAdd.toFixed(3), // Peso entrante
                            out: 0,
                            total: total.toFixed(3), // Peso total
                            note: `Invoice ${invoiceData.controlNumber || invoiceData.order || ''} desde fábrica`,
                            comment: `Entrada automática desde invoice. Order: ${invoiceData.order || 'N/A'}`,
                            typeIn: 'entrada',
                            type: 0,
                            price: item.price || item.unitPrice || 0,
                            regularPrice: item.regularPrice || 0,
                            differential: item.differential || 0,
                            wholesaleDiscountDifferential: item.wholesaleDiscountDifferential || 0,
                            totalDifferential: item.totalDifferential || 0,
                            isOffer: item.isOffer || false,
                            isWholesale: false,
                            isCredit: false,
                            isCombo: false,
                            isInit: false
                        });
                        await inventoryRecord.save();

                        // Actualizar el inventario fiscal
                        inventoryFiscal.kg = total;
                        inventoryFiscal.updatedDate = new Date();
                        await inventoryFiscal.save();
                    } else {
                        // Producto no existente: crear uno nuevo en el Inventario Fiscal
                        const newInventory = new InventoryFiscal({
                            product: productObjectId,
                            agency: resolvedAgencyId,
                            kg: kgToAdd,
                            createdDate: new Date(),
                            minimumStock: item.minimumStock || 0,
                            order: 0,
                            orderWasConfirmed: false,
                            modification: 0,
                            modificationWasConfirmed: false,
                            updatedDate: new Date()
                        });
                        await newInventory.save();

                        // Registrar la entrada inicial en el historial
                        const inventoryRecord = new InventoryRecordFiscal({
                            product: productObjectId,
                            agency: resolvedAgencyId,
                            kg: 0, // Peso inicial
                            in: kgToAdd.toFixed(3), // Peso entrante
                            out: 0,
                            total: kgToAdd.toFixed(3), // Peso total
                            note: `Invoice ${invoiceData.controlNumber || invoiceData.order || ''} desde fábrica`,
                            comment: `Entrada automática inicial desde invoice. Order: ${invoiceData.order || 'N/A'}`,
                            typeIn: 'entrada',
                            type: 0,
                            price: item.price || item.unitPrice || 0,
                            regularPrice: item.regularPrice || 0,
                            differential: item.differential || 0,
                            wholesaleDiscountDifferential: item.wholesaleDiscountDifferential || 0,
                            totalDifferential: item.totalDifferential || 0,
                            isOffer: item.isOffer || false,
                            isWholesale: false,
                            isCredit: false,
                            isCombo: false,
                            isInit: true // Inventario inicial
                        });
                        await inventoryRecord.save();
                    }

                    processedProducts.push({
                        productId: productId,
                        name: item.name || item.code,
                        kg: kgToAdd
                    });

                } catch (productError) {
                    errors.push(`Error procesando ${item.name || item.code}: ${productError.message}`);
                }
            }

            const result = {
                success: true,
                message: `Invoice procesado correctamente. ${processedProducts.length} productos actualizados en inventario fiscal`,
                agencyId: agencyId,
                agencyName: agency.name,
                invoiceId: savedInvoice ? savedInvoice.id : null,
                processedProducts: processedProducts.length,
                products: processedProducts
            };

            if (errors.length > 0) {
                result.warnings = errors;
                result.message += `. ${errors.length} advertencias`;
            }

            return result;

        } catch (error) {
            throw error;
        }
    },

    /**
     * Procesa un webhook de auditoría de nota de mercado recibido del backend de fábrica
     * Actualiza los campos audit y commentAudit de la nota
     * 
     * @param {object} payload - Payload del webhook con action: 'audited'
     */
    handleNoteMarketAudit: async (payload) => {
        try {
            // El ID puede venir en payload.data.id o payload.data.noteId
            let noteMarketId = payload.data?.id || payload.data?.noteId;
            
            if (!noteMarketId) {
                throw new Error('ID de nota de mercado no encontrado en el payload');
            }

            // Validar que el ID sea un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(noteMarketId)) {
                throw new Error(`ID de nota de mercado inválido: ${noteMarketId}`);
            }

            const objectId = new mongoose.Types.ObjectId(noteMarketId);

            // Buscar la nota antes de actualizar para verificar que existe
            const noteMarketBefore = await NoteMarket.findById(objectId);
            
            if (!noteMarketBefore) {
                throw new Error(`Nota de mercado con ID ${noteMarketId} no encontrada`);
            }

            // Obtener valores de auditoría del payload
            const audit = payload.data?.audit !== undefined ? Boolean(payload.data.audit) : false;
            const commentAudit = payload.data?.commentAudit !== undefined ? String(payload.data.commentAudit) : '';

            // Usar findByIdAndUpdate para asegurar que los cambios se persistan
            const updated = await NoteMarket.findByIdAndUpdate(
                objectId,
                {
                    $set: {
                        audit: audit,
                        commentAudit: commentAudit
                    }
                },
                {
                    new: true, // Retornar el documento actualizado
                    runValidators: true, // Ejecutar validadores del schema
                    upsert: false // No crear si no existe
                }
            );

            if (!updated) {
                throw new Error(`Error al actualizar la nota de mercado con ID ${noteMarketId}`);
            }
            
            return {
                success: true,
                message: `Nota de mercado ${updated.order || noteMarketId} auditada correctamente`,
                noteMarket: updated,
                action: 'audited'
            };

        } catch (error) {
            console.error('Error procesando auditoría de nota de mercado:', error);
            throw error;
        }
    },

    /**
     * Elimina una nota de mercado por su ID recibido desde el webhook de fábrica
     * 
     * @param {object} payload - Payload del webhook con action: 'deleted'
     */
    deleteNoteMarket: async (payload) => {
        try {
            
            // El ID puede venir en payload.data.id o payload.data.noteMarket.id
            let noteMarketId = payload.data?.id || payload.data?.noteMarket?.id;
            
            if (!noteMarketId) {
                throw new Error('ID de nota de mercado no encontrado en el payload');
            }

            // Validar que el ID sea un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(noteMarketId)) {
                throw new Error(`ID de nota de mercado inválido: ${noteMarketId}`);
            }

            const objectId = new mongoose.Types.ObjectId(noteMarketId);

            // Buscar la nota antes de eliminarla para verificar que existe
            const noteMarket = await NoteMarket.findById(objectId);
            
            if (!noteMarket) {
                throw new Error(`Nota de mercado con ID ${noteMarketId} no encontrada`);
            }

            // Guardar información de la nota antes de eliminarla (para el mensaje de respuesta)
            const orderNumber = noteMarket.order || noteMarketId;
            
            // Eliminar la nota
            await NoteMarket.findByIdAndDelete(objectId);
            
            
            return {
                success: true,
                message: `Nota de mercado ${orderNumber} eliminada correctamente`,
                deletedId: noteMarketId,
                action: 'deleted'
            };

        } catch (error) {
            console.error('[DELETE NOTE MARKET] Error eliminando nota de mercado:', error);
            throw error;
        }
    },

    /**
     * Procesa un webhook de order-miscellaneous recibido del backend de fábrica
     * Actualiza la orden con los datos de confirmación desde fábrica
     * 
     * @param {object} payload - Payload del webhook
     */
    handleOrderMiscellaneousWebhook: async (payload) => {
        try {
            if (!payload || !payload.data) {
                throw new Error('Payload inválido: falta campo data');
            }

            const orderData = payload.data;

            // Función auxiliar para convertir a ObjectId de forma segura
            const toObjectId = (value) => {
                if (!value) return null;
                if (value instanceof mongoose.Types.ObjectId) return value;
                if (mongoose.Types.ObjectId.isValid(value)) {
                    return new mongoose.Types.ObjectId(value);
                }
                return null;
            };

            // Obtener el orderId del payload
            let orderId = orderData.orderId;
            
            if (!orderId) {
                throw new Error('orderId no encontrado en el payload');
            }

            // Validar que el ID sea un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                throw new Error(`orderId inválido: ${orderId}`);
            }

            const objectId = toObjectId(orderId);

            // Buscar la orden antes de actualizar para verificar que existe
            const order = await OrderMiscellaneous.findById(objectId);
            
            if (!order) {
                throw new Error(`Orden miscellaneous con ID ${orderId} no encontrada`);
            }

            // Preparar los datos a actualizar
            const updateData = {};

            // Actualizar wasConfirmed si viene en el payload
            if (orderData.wasConfirmed !== undefined) {
                updateData.wasConfirmed = Boolean(orderData.wasConfirmed);
            }

            // Actualizar confirmationUser si viene en el payload (es un string)
            if (orderData.confirmationUser !== undefined) {
                updateData.confirmationUser = String(orderData.confirmationUser);
            }

            // Actualizar updatedDate si viene en el payload
            if (orderData.updatedDate) {
                updateData.updatedDate = new Date(orderData.updatedDate);
            }

            // Actualizar order (número de orden) si viene en el payload
            if (orderData.order !== undefined && orderData.order !== null) {
                updateData.order = parseInt(orderData.order);
            }

            // Actualizar agencyId si viene en el payload
            if (orderData.agencyId) {
                const agencyObjectId = toObjectId(orderData.agencyId);
                if (agencyObjectId) {
                    updateData.agency = agencyObjectId;
                }
            }

            // Si no hay datos para actualizar, retornar la orden sin cambios
            if (Object.keys(updateData).length === 0) {
                return {
                    success: true,
                    message: `Orden miscellaneous ${order.order || orderId} no requiere actualización`,
                    order: order,
                    action: payload.action
                };
            }

            // Actualizar la orden
            const updated = await OrderMiscellaneous.findByIdAndUpdate(
                objectId,
                {
                    $set: updateData
                },
                {
                    new: true, // Retornar el documento actualizado
                    runValidators: true // Ejecutar validadores del schema
                }
            );

            if (!updated) {
                throw new Error(`Error al actualizar la orden miscellaneous con ID ${orderId}`);
            }
            
            return {
                success: true,
                message: `Orden miscellaneous ${updated.order || orderId} actualizada correctamente`,
                order: updated,
                action: payload.action
            };

        } catch (error) {
            console.error('Error procesando webhook de order-miscellaneous:', error);
            throw error;
        }
    },

    /**
     * Procesa un webhook de order-market-miscellaneous recibido del backend de fábrica
     * Crea o actualiza la orden de mercado de misceláneos en tiendas.
     *
     * Soporta acciones: 'created', 'updated', 'deleted', 'audited'.
     *
     * @param {object} payload - Payload del webhook
     */
    handleOrderMarketMiscellaneousWebhook: async (payload) => {
        try {
            if (!payload || !payload.data) {
                throw new Error('Payload inválido: falta campo data');
            }

            // Delegar a manejadores específicos según la acción
            if (payload.action === 'deleted') {
                return await webhookService.deleteOrderMarketMiscellaneous(payload);
            }

            if (payload.action === 'audited') {
                return await webhookService.handleOrderMarketMiscellaneousAudit(payload);
            }

            const {
                id,
                orderId,
                order,
                products,
                modifiedProducts,
                agency,
                user,
                userName,
                total,
                totalWeight,
                valueDollar,
                valueEur,
                valueCop,
                totalDollar,
                seller,
                operator,
                comment,
                marketId,
                marketName,
                marketCompany,
                marketAttendant,
                marketAddress,
                driverId,
                driverName,
                status,
                invoice,
                audit,
                commentAudit,
                createdDate,
            } = payload.data;

            // Función auxiliar para convertir a ObjectId de forma segura
            const toObjectId = (value) => {
                if (!value) return null;
                if (value instanceof mongoose.Types.ObjectId) return value;
                if (mongoose.Types.ObjectId.isValid(value)) {
                    return new mongoose.Types.ObjectId(value);
                }
                return null;
            };

            // Resolver agency a partir de marketId o agency del payload
            const resolvedAgency =
                toObjectId(marketId) || toObjectId(agency) || null;

            const dataToSave = {
                products: products || [],
                modifiedProducts: modifiedProducts || [],
                agency: resolvedAgency,
                user: toObjectId(user),
                userName: userName || '',
                total: total !== undefined && total !== null ? total : 0,
                totalWeight:
                    totalWeight !== undefined && totalWeight !== null
                        ? totalWeight
                        : 0,
                valueDollar:
                    valueDollar !== undefined && valueDollar !== null
                        ? valueDollar
                        : 0,
                valueEur:
                    valueEur !== undefined && valueEur !== null ? valueEur : 0,
                valueCop:
                    valueCop !== undefined && valueCop !== null ? valueCop : 0,
                totalDollar:
                    totalDollar !== undefined && totalDollar !== null
                        ? totalDollar
                        : 0,
                seller: toObjectId(seller),
                operator: toObjectId(operator),
                comment: comment || '',
                marketId: toObjectId(marketId),
                marketName: marketName || '',
                marketCompany: marketCompany || '',
                marketAttendant: marketAttendant || '',
                marketAddress: marketAddress || '',
                driverId: toObjectId(driverId),
                driverName: driverName || '',
                status: status || 'pending',
                invoice: Boolean(invoice),
            };

            // Solo incluir audit y commentAudit si vienen explícitamente, para no pisar valores locales en updates normales
            if (audit !== undefined) {
                dataToSave.audit = Boolean(audit);
            }
            if (commentAudit !== undefined) {
                dataToSave.commentAudit = String(commentAudit);
            }

            // Mantener número de orden si viene desde fábrica
            if (order !== undefined && order !== null) {
                dataToSave.order = parseInt(order);
            }

            // Determinar con qué ID trabajar (id u orderId)
            const mainId = id || orderId;
            let query = {};

            if (mainId && mongoose.Types.ObjectId.isValid(mainId)) {
                query._id = new mongoose.Types.ObjectId(mainId);
            } else if (order !== undefined && order !== null) {
                query.order = parseInt(order);
            } else {
                query._id = new mongoose.Types.ObjectId();
            }

            let existingOrder = await OrderMarketMiscellaneous.findOne(query);

            if (existingOrder && payload.action === 'updated') {
                Object.assign(existingOrder, dataToSave);

                const saved = await existingOrder.save();

                return {
                    success: true,
                    message: `Orden de mercado misceláneos ${saved.order || mainId} actualizada correctamente`,
                    orderMarketMiscellaneous: saved,
                    action: 'updated',
                };
            } else {
                // Crear nueva o hacer upsert si ya existe pero queremos asegurar consistencia
                const created = await OrderMarketMiscellaneous.findOneAndUpdate(
                    query,
                    { $setOnInsert: dataToSave },
                    {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true,
                    }
                );

                return {
                    success: true,
                    message: `Orden de mercado misceláneos ${created.order || mainId || 'nueva'} creada correctamente`,
                    orderMarketMiscellaneous: created,
                    action: 'created',
                };
            }
        } catch (error) {
            console.error(
                'Error procesando webhook de order-market-miscellaneous:',
                error
            );
            throw error;
        }
    },

    /**
     * Procesa un webhook de auditoría de orden de mercado misceláneos
     * Actualiza únicamente los campos audit y commentAudit.
     *
     * @param {object} payload - Payload del webhook con action: 'audited'
     */
    handleOrderMarketMiscellaneousAudit: async (payload) => {
        try {
            const data = payload.data || {};
            const mainId = data.id || data.orderId;

            if (!mainId) {
                throw new Error(
                    'ID de order-market-miscellaneous no encontrado en el payload'
                );
            }

            if (!mongoose.Types.ObjectId.isValid(mainId)) {
                throw new Error(
                    `ID de order-market-miscellaneous inválido: ${mainId}`
                );
            }

            const objectId = new mongoose.Types.ObjectId(mainId);

            const orderBefore =
                await OrderMarketMiscellaneous.findById(objectId);

            if (!orderBefore) {
                throw new Error(
                    `Orden de mercado misceláneos con ID ${mainId} no encontrada`
                );
            }

            const audit =
                data.audit !== undefined ? Boolean(data.audit) : false;
            const commentAudit =
                data.commentAudit !== undefined ? String(data.commentAudit) : '';

            const updated = await OrderMarketMiscellaneous.findByIdAndUpdate(
                objectId,
                {
                    $set: {
                        audit,
                        commentAudit,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                    upsert: false,
                }
            );

            if (!updated) {
                throw new Error(
                    `Error al actualizar la orden de mercado misceláneos con ID ${mainId}`
                );
            }

            return {
                success: true,
                message: `Orden de mercado misceláneos ${updated.order || mainId} auditada correctamente`,
                orderMarketMiscellaneous: updated,
                action: 'audited',
            };
        } catch (error) {
            console.error(
                'Error procesando auditoría de order-market-miscellaneous:',
                error
            );
            throw error;
        }
    },

    /**
     * Elimina una orden de mercado misceláneos por su ID recibido desde el webhook de fábrica.
     *
     * @param {object} payload - Payload del webhook con action: 'deleted'
     */
    deleteOrderMarketMiscellaneous: async (payload) => {
        try {
            const data = payload.data || {};
            const mainId = data.id || data.orderId;

            if (!mainId) {
                throw new Error(
                    'ID de order-market-miscellaneous no encontrado en el payload'
                );
            }

            if (!mongoose.Types.ObjectId.isValid(mainId)) {
                throw new Error(
                    `ID de order-market-miscellaneous inválido: ${mainId}`
                );
            }

            const objectId = new mongoose.Types.ObjectId(mainId);

            const existing =
                await OrderMarketMiscellaneous.findById(objectId);

            if (!existing) {
                throw new Error(
                    `Orden de mercado misceláneos con ID ${mainId} no encontrada`
                );
            }

            const orderNumber = existing.order || mainId;

            await OrderMarketMiscellaneous.findByIdAndDelete(objectId);

            return {
                success: true,
                message: `Orden de mercado misceláneos ${orderNumber} eliminada correctamente`,
                deletedId: mainId,
                action: 'deleted',
            };
        } catch (error) {
            console.error(
                '[DELETE ORDER MARKET MISC] Error eliminando orden de mercado misceláneos:',
                error
            );
            throw error;
        }
    },
};

module.exports = webhookService;

