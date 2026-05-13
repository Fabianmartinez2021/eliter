const db = require('../_helpers/db');
const Inventory = db.MiscellaneousInventory;
const InventoryRecord = db.MiscellaneousInventoryRecord;
const InventoryReport = db.InventoryReport;
const InventoryPending = db.MiscellaneousInventoryPending;
const InventoryPendingFull = db.MiscellaneousInventoryPendingFull;
const Product = db.Miscellaneous;
const ProductRecord = db.ProductRecord;
const Users = db.User;
const Agency = db.Agency;
const AdjustmentRecord = db.MiscellaneousAdjustmentRecord;
const typeSupplyEnum = require('../enums/typeSupply.enum');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment');
const role = require('../enums/roles.enum');

let inventoryService = {

    /**
     * Función para registrar inventario pendiente de confirmación
     * 
     * @param {params} inventoryParam 
     */

    createPending : async (inventoryParam) => {


        // 1. Guardar individualmente en InventoryMiscellaneousPending
        for (let item of inventoryParam.products) {
            const pendingProduct = new InventoryPending({
            product: item.id,
            agency: inventoryParam.agency,
            kg: parseFloat(item.kg),
            confirmed: false,
            user: inventoryParam.user,
            price: item.price,
            note: inventoryParam.note || 'Entrada pendiente',
            comment: inventoryParam.comment || '',
            typeIn: inventoryParam.typeIn || 'manual'
            });

            const savedProduct = await pendingProduct.save();
            if (!savedProduct) {
            throw new Error('Error registrando producto pendiente');
            }
        }

        // 2. Guardar el objeto completo en InventoryMiscellaneousPendingFull
        const fullPending = new InventoryPendingFull({
            ...inventoryParam,
            confirmed: false
        });

        const savedFull = await fullPending.save();
        if (!savedFull) {
            throw new Error('Error registrando inventario completo pendiente');
        }
    },
    approvePendingToInventory: async (pendingId, comment) => {

        const pendingFull = await InventoryPendingFull.findById(pendingId).lean();

        if (!pendingFull) {
            throw new Error('Pendiente no encontrado');
        }

        const typeIn = pendingFull.typeIn || '2';

        const inventoryParam = {
            agency: pendingFull.agency,
            user: pendingFull.user,
            note: pendingFull.note,
            comment: pendingFull.comment,
            typeIn: typeIn,
            products: pendingFull.products.map(p => ({
                id: p.id || p.product,
                kg: p.kg,
                price: p.price
            }))
        };


    //Recorrer productos
        for (let item of inventoryParam.products) {

            let product = await Inventory.findOne({ product: item.id, agency: inventoryParam.agency });

            //Si existe el producto en inventario se modifica
            if (product) {
                //lo que esta actualmente en kg mas los kg entrantes
                let total = parseFloat(item.kg) + parseFloat(product.kg);

                //registrar la entrada en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = inventoryParam.agency;
                inventoryRecordParam.amountBefore = product.kg.toFixed(3);//arrastrar kg anterior
                inventoryRecordParam.in = item.kg.toFixed(3)//kgs entrantes
                inventoryRecordParam.amountAfter = total.toFixed(3);
                inventoryRecordParam.note = inventoryParam.note;
                inventoryRecordParam.comment = inventoryParam.comment;
                inventoryRecordParam.price = item.price;
                inventoryRecordParam.typeIn = inventoryParam.typeIn;
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();

                if (!recordSaved) {
                    throw 'Error registrando el inventario';
                }

                //Actualizar kgs en inventario
                Object.assign(product, { kg: total });
                await product.save();

                //Si no existe el producto en inventario se inserta
            } else {

                let user = await Users.findById(inventoryParam.user).lean();

                let newProd = {
                    product: item.id,
                    agency: inventoryParam.agency,
                    kg: item.kg,
                };

                const inventory = new Inventory(newProd);
                const inventorySaved = await inventory.save();
                if (!inventorySaved) {
                    throw 'Error registrando el inventario';
                }

                //registrar la entrada en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = inventoryParam.agency;
                inventoryRecordParam.amountBefore = 0;
                inventoryRecordParam.in = item.kg.toFixed(3)//kgs entrantes
                inventoryRecordParam.amountAfter = item.kg.toFixed(3);//Total el mismo
                inventoryRecordParam.note = inventoryParam.note;
                inventoryRecordParam.comment = inventoryParam.comment;
                inventoryRecordParam.price = item.price;
                inventoryRecordParam.typeIn = inventoryParam.typeIn;
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();

                if (!recordSaved) {
                    throw 'Error registrando el inventario';
                }
            }
        }

        await InventoryPending.updateMany(
            { agency: pendingFull.agency, user: pendingFull.user, confirmed: false },
            { $set: { confirmed: true } }
        );

        await InventoryPendingFull.findByIdAndUpdate(pendingId, { $set: { confirmed: true } });
    },
    updatePending: async (id, pending, userId) => {
    if (!ObjectId.isValid(id)) {
        throw new Error('ID de producto no válido');
    }
    
    try {
        // 1. Obtener el pedido original
        const originalPending = await InventoryPendingFull.findById(id);
        if (!originalPending) {
            throw new Error('Producto no encontrado');
        }

        // 2. Guardar los datos originales antes de modificar (solo si es la primera modificación)
        if (!originalPending.originalData) {
            originalPending.originalData = {
                products: originalPending.products,
                note: originalPending.note,
                comment: originalPending.comment,
                createdDate: originalPending.createdDate
            };
            await originalPending.save();
        }

        // 3. Agregar la modificación al historial
        const modification = {
            date: new Date(),
            user: userId,
            changes: {
                products: pending.products, // Estos son los NUEVOS datos
                note: pending.note,
                comment: pending.comment
            }
        };

        // 4. Actualizar SOLO el estado de confirmación e historial, NO los datos principales
        const updatedPending = await InventoryPendingFull.findByIdAndUpdate(
            id,
            {
                $set: {
                    confirmed: true,
                    modified: true,
                    wasModified: true,
                    modifiedDate: new Date(),
                    modifiedBy: userId
                },
                $push: {
                    modifications: modification
                }
            },
            { new: true, runValidators: true }
        );

        // 5. Procesar el inventario con los datos MODIFICADOS (del pending que recibiste)
        const typeIn = updatedPending.typeIn || '2';
        const inventoryParam = {
            agency: updatedPending.agency,
            user: updatedPending.user,
            note: pending.note, // Usar los datos NUEVOS del pending recibido
            comment: pending.comment, // Usar los datos NUEVOS
            typeIn: typeIn,
            products: pending.products.map(p => ({ // Usar los productos NUEVOS
                id: p.id || p.product,
                kg: p.kg,
                price: p.price
            }))
        };

        // Recorrer productos
        for (let item of inventoryParam.products) {
            let product = await Inventory.findOne({ product: item.id, agency: inventoryParam.agency });

            if (product) {
                let total = parseFloat(item.kg) + parseFloat(product.kg);

                // Registrar la entrada en historial
                let inventoryRecordParam = {
                    product: item.id,
                    agency: inventoryParam.agency,
                    amountBefore: product.kg.toFixed(3),
                    in: item.kg.toFixed(3),
                    amountAfter: total.toFixed(3),
                    note: inventoryParam.note,
                    comment: inventoryParam.comment,
                    price: item.price,
                    typeIn: inventoryParam.typeIn
                };
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();

                if (!recordSaved) {
                    throw new Error('Error registrando el inventario');
                }

                // Actualizar kgs en inventario
                product.kg = total;
                await product.save();

            } else {
                // Si no existe el producto en inventario se inserta
                let newProd = {
                    product: item.id,
                    agency: inventoryParam.agency,
                    kg: item.kg,
                };

                const inventory = new Inventory(newProd);
                const inventorySaved = await inventory.save();
                if (!inventorySaved) {
                    throw new Error('Error registrando el inventario');
                }

                // Registrar la entrada en historial
                let inventoryRecordParam = {
                    product: item.id,
                    agency: inventoryParam.agency,
                    amountBefore: 0,
                    in: item.kg.toFixed(3),
                    amountAfter: item.kg.toFixed(3),
                    note: inventoryParam.note,
                    comment: inventoryParam.comment,
                    price: item.price,
                    typeIn: inventoryParam.typeIn
                };
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();

                if (!recordSaved) {
                    throw new Error('Error registrando el inventario');
                }
            }
        }

        // 6. Actualizar otros pendientes de la misma agencia/usuario
        const updateResult = await InventoryPending.updateMany(
            { agency: updatedPending.agency, user: updatedPending.user, confirmed: false },
            { $set: { confirmed: true } }
        );

        return updatedPending;

    } catch(error) {
        console.error('[updatePending] Error:', error.message, error.stack);
        throw error;
    }
},
    getPendingById: async (id) => {
        if ( !ObjectId.isValid(id)) {
            throw new Error('ID de producto no válido');
        }
        try {
            const pending = await InventoryPendingFull.findById(id).populate('agency');

            if (!pending) {
                throw new Error('Producto no encontrado');
            }
            return pending;

        }catch(error) {
            console.error('Error en inventoryPendingFullTable:', error.message, error.stack);
            throw error;
        }
    },       
    dataTablePending: async (params) => {


        const pageSize = params.pageSize || 10;
        const pageIndex = params.pageIndex || 1;

        let sortBy = { createdDate: -1 };

        if (params.sortBy) {
            const direction = params.sortBy.desc === true ? -1 : 1;
            sortBy = { [params.sortBy.id]: direction };
        }

        const stages = [];

        if (params.user?.role === 3 && params.user?.agency) {
            stages.push({
                $match: {
                    agency: ObjectId(params.user.agency)
                }
            });
        }

        // Filtros dinámicos
        if (params.filters) {
            const filters = params.filters;

            // Filtrar por agencia
            if (filters.agency && ObjectId.isValid(filters.agency)) {
            stages.push({ $match: { agency: ObjectId(filters.agency) } });
            }

            // Filtrar por usuario
            if (filters.user && ObjectId.isValid(filters.user)) {
            stages.push({ $match: { user: ObjectId(filters.user) } });
            }

            // Filtro por fechas
            if (filters.startDate && filters.endDate) {
            const startDate = new Date(`${filters.startDate}T00:00:00Z`);
            const endDate = new Date(`${filters.endDate}T23:59:59Z`);
            stages.push({
                $match: { createdDate: { $gte: startDate, $lte: endDate } },
            });
            }

            // Filtro por estado de confirmación
            if (typeof filters.confirmed === 'boolean') {
            stages.push({ $match: { confirmed: filters.confirmed } });
            }
        }

        // Lookup de agencia
        stages.push({
            $lookup: {
            from: 'agencies',
            localField: 'agency',
            foreignField: '_id',
            as: 'agencyDetails',
            },
        });

        stages.push({
            $unwind: {
            path: '$agencyDetails',
            preserveNullAndEmptyArrays: true,
            },
        });

        // Lookup de usuario
        stages.push({
            $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
            },
        });

        stages.push({
            $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true,
            },
        });

        try {
            const results = await InventoryPendingFull.aggregate([
            ...stages,
            { $sort: sortBy },
            { $skip: (pageIndex - 1) * pageSize },
            { $limit: pageSize },
            ]);

            const total = await InventoryPendingFull.countDocuments(
            stages.find(s => s.$match)?.$match || {}
            );


        const response = {
            results: results.map(entry => ({
                ...entry,
                agencyName: entry.agencyDetails?.name || null,
                userName: entry.userDetails
                ? `${entry.userDetails.firstName || ''} ${entry.userDetails.lastName || ''}`.trim()
                : null,
            })),
            metadata: {
                total,
                pageSize,
                pageIndex,
            },
            };


        return response;
        } catch (error) {
            console.error('Error en inventoryPendingFullTable:', error.message, error.stack);
            throw error;
        }
    },

    /** Función para registrar inventario
     * 
     * @param {params} inventoryParam 
     */
     create: async (inventoryParam) => {


        //Recorrer productos
        for (let item of inventoryParam.products) {

            let product = await Inventory.findOne({ product: item.id, agency: inventoryParam.agency });

            //Si existe el producto en inventario se modifica
            if (product) {
                //lo que esta actualmente en kg mas los kg entrantes
                let total = parseFloat(item.kg) + parseFloat(product.kg);

                //registrar la entrada en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = inventoryParam.agency;
                inventoryRecordParam.amountBefore = product.kg.toFixed(3);//arrastrar kg anterior
                inventoryRecordParam.in = item.kg.toFixed(3)//kgs entrantes
                inventoryRecordParam.amountAfter = total.toFixed(3);
                inventoryRecordParam.note = inventoryParam.note;
                inventoryRecordParam.comment = inventoryParam.comment;
                inventoryRecordParam.price = item.price;
                inventoryRecordParam.typeIn = inventoryParam.typeIn;
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();

                if (!recordSaved) {
                    throw 'Error registrando el inventario';
                }

                //Actualizar kgs en inventario
                Object.assign(product, { kg: total });
                await product.save();

                //Si no existe el producto en inventario se inserta
            } else {

                let user = await Users.findById(inventoryParam.user).lean();

                let newProd = {
                    product: item.id,
                    agency: inventoryParam.agency,
                    kg: item.kg,
                };

                const inventory = new Inventory(newProd);
                const inventorySaved = await inventory.save();
                if (!inventorySaved) {
                    throw 'Error registrando el inventario';
                }

                //registrar la entrada en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = inventoryParam.agency;
                inventoryRecordParam.amountBefore = 0;
                inventoryRecordParam.in = item.kg.toFixed(3)//kgs entrantes
                inventoryRecordParam.amountAfter = item.kg.toFixed(3);//Total el mismo
                inventoryRecordParam.note = inventoryParam.note;
                inventoryRecordParam.comment = inventoryParam.comment;
                inventoryRecordParam.price = item.price;
                inventoryRecordParam.typeIn = inventoryParam.typeIn;
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();

                if (!recordSaved) {
                    throw 'Error registrando el inventario';
                }
            }
        }
    },

    //Inventario actual
    dataTable: async (inventoryParam) => {


        let stages = [
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            {
                $project: {
                    id: "$_id",
                    _id: 0,//excluir 0 _id
                    // 1 incluir
                    agency: 1,
                    product: 1,
                    physical: 1,
                    kg: { $round: [ "$kg", 3 ] },
                    order: 1,
                    orderWasConfirmed: 1,
                    modification: 1,
                    modificationWasConfirmed: 1,
                    minimumStock: 1,
                    createdDate: 1,
                    updatedDate: 1
                }
            }
        ]

        //Si el rol es Cajero, solo su sucursal

        //  El Gerente podrá ver todos los inventarios, pero únicamente podrá modificar los suyos 

        if ((inventoryParam.user.role == role.rol.Cashier) || (inventoryParam.user.role == role.rol.Telesales)) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        const inventories = await Inventory.aggregate(stages);

        // Se busca la ultima ORDEN del dia, o del dia anterior
        
        // Se obtiene la hora actual para de esta manera poder hacer las respectivas limitaciones por hora
        let currentDate = new Date(moment().utc().subtract(4, 'hours'));

        // Se fija la hora de corte para los pedidos
        var limitTime = moment('08:00am', 'h:mma').utc().subtract(4, 'hours');

        let startDate = (moment(currentDate).isAfter(limitTime)) ? limitTime : moment(limitTime).subtract(1, 'days');
        let endDate = (moment(currentDate).isAfter(limitTime)) ? moment(limitTime).add(1, 'days') : limitTime;

        const query = {
            createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)},
            agency: inventoryParam.user.agency,
        }
        const order = await db.OrderMiscellaneous.findOne(query)


        // Se busca el ultimo ANEXO del dia, o del dia anterior
        query.isModification = true;

        const modification = await db.OrderMiscellaneous.findOne(query).sort({createdDate: -1})

       

        return {
            results: inventories,
            order,
            modification
        }
    },

    /** Función para actualizar inventario 'readjustment'
     * 
     * (Inventario físico)
     * 
     * @param {id} id de inventario 
     * @param {params} inventoryParam
     */
    readjustment: async (id, inventoryParam) => {

        const inventory = await Inventory.findById(id);

        // Validar
        if (!inventory) throw 'inventario no encontrado';

        // if (Number(inventoryParam.physical) > inventory.kg) {
        //     throw ('El inventario físico no debe ser mayor. Es posible que se haya olvidado de dar ingreso al suministro')
        // }

        //fecha de actualización
        let actualDate = moment().subtract(4, 'hours');        
        inventory.updatedDate = actualDate;

        // copiar propiedades de inventoryParam a inventory
        // Actualiza el campo physical
        Object.assign(inventory, inventoryParam);
        //actualizar inventario
        await inventory.save();

         //registrar en historial de ajustes 
        let adjustmentRecordParam = {}
        adjustmentRecordParam.user = inventoryParam.user;//usuario que ingresa el dato
        adjustmentRecordParam.product = inventory.product;//producto
        adjustmentRecordParam.agency = inventory.agency;//sucursal
        adjustmentRecordParam.kg = inventoryParam.physical;// inventario fisico
        adjustmentRecordParam.comment = inventoryParam.comment;// inventario fisico
        const record = new AdjustmentRecord(adjustmentRecordParam);
        const recordSaved = await record.save();

        if(!recordSaved){
            throw 'Error registrando el inventario';  
        }
    },

    /**
     * Función para registrar salidas
     * 
     * @param {params} depParam 
     */
    createDeparture: async (depParam) => {


        let type = depParam.type;

        /**
         * Recorrer cada producto y crear un array de productos para las salidas
         */
        for (let item of depParam.items) {

            //Registrar salida de cada producto en inventario
            let inventory = await Inventory.findOne({ product: item.id, agency: depParam.agency }).populate('product');

            //Si se encuetra en el inventario se editan los valores para un nuevo historial
            if (inventory) {

                //Registrar en historial de inventario

                //lo que hay actualmente menos lo que viene
                let total = parseFloat(inventory.kg) - parseFloat(item.kg);

                let inventoryParam = {};
                inventoryParam.product = item.id;
                inventoryParam.agency = depParam.agency;
                inventoryParam.amountBefore = inventory.kg.toFixed(3);//arrastrar kg anterior;
                inventoryParam.in = 0;//entrada 0
                inventoryParam.out = type == typeSupplyEnum.out.cutout ? 0 : item.kg.toFixed(3); //Salida
                inventoryParam.amountAfter = total.toFixed(3);
                inventoryParam.note = ' ';
                inventoryParam.price = item.price;
                inventoryParam.comment = depParam.comment ? depParam.comment : '';
                inventoryParam.type = type;

                const record = new InventoryRecord(inventoryParam);
                await record.save();

                //Actualizar total en inventario
                await Inventory.findOneAndUpdate({ product: item.id, agency: depParam.agency }, { kg: total });
            }
            else {
                throw ('El producto ' + item.name + ' no existe en el inventario')
            }
        }
    },

    /**
     * Funcion para obtener las inventario con paginación y filtros
     */
    dataTableHistory: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (inventoryParam.sortBy) {
            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id]: direction }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if (inventoryParam.filters.code) {
            productCode = Number(inventoryParam.filters.code)
        }

        let stages = [
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match: { "product.code": productCode } },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            { $sort: sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if (!inventoryParam.isExcel) {
            stages.push(
                { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if (inventoryParam.user.role == role.rol.Manager) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if (inventoryParam.filters.agency) {

                stages.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
            const startDate = moment().utc().startOf('day');
            const endDate = moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryRecord.aggregate(stages);

        return {
            results: !inventoryParam.isExcel ? inventories[0].data : inventories,
            metadata: !inventoryParam.isExcel ? inventories[0].metadata : [],
        }
    },

    /**
     * Reporte semanal "simple": mismo comportamiento y filtros que dataTableInventoryReport,
     * pero devolviendo solo la columna de USADO por producto (y datos básicos).
     */
    dataTableInventoryReportWeekly: async (inventoryParam) => {
        // Reutilizamos la lógica completa del reporte grande
        const fullReport = await module.exports.dataTableInventoryReport(inventoryParam);

        // fullReport.results incluye: product, agency, date (rango semana), totalOutSell, totalOutSellAmount, etc.
        // Aquí solo exponemos lo necesario para "usado por producto"
        const results = fullReport.results.map(r => ({
            product: r.product,
            agency: r.agency,
            date: r.date, // rango de la semana, ej: "2026-02-23 al 2026-03-01"
            // usado (cantidad)
            totalUsed: r.totalOutSell, // alias directo para que el frontend use totalUsed
            totalOutSell: r.totalOutSell,
            // ajuste de usado (viene ya calculado en el reporte grande)
            usedAdjustment: r.usedAdjustment || 0,
            // usado (monto) por si lo necesitas en el frontend
            totalOutSellAmount: r.totalOutSellAmount,
        }));

        return {
            results,
            // mantenemos metadata y totalOutSellAmount global por compatibilidad
            metadata: fullReport.metadata,
            totalOutSellAmount: fullReport.totalOutSellAmount,
        };
    },

    /**
     * Reporte de inventarios de suministros para el frontend - Versión Semanal
     */
    dataTableInventoryReport: async (inventoryParam) => {
        const pageSize = inventoryParam.pageSize;
        const pageIndex = inventoryParam.pageIndex;
        
        let sortBy = { "_id.weekStart": -1 };
        if (inventoryParam.sortBy) {
            let direction = inventoryParam.sortBy.desc ? -1 : 1;
            sortBy = inventoryParam.sortBy.id === "date" ? 
                { "_id.weekStart": direction } : 
                { [inventoryParam.sortBy.id]: direction };
        }

        let productCode = { $exists: true, $ne: null };
        if (inventoryParam.filters.code) {
            productCode = Number(inventoryParam.filters.code);
        }


        // Pipeline de agregación para agrupación semanal
        let stages = [
            { $lookup: {
                from: 'miscellaneous',
                localField: 'product',
                foreignField: '_id',
                as: 'product'
            }},
            { $unwind: '$product' },
            { $match: { "product.code": productCode } },
            { 
                $group: {
                    _id: {
                        product: '$product._id',
                        agency: '$agency',
                        weekStart: {
                            $let: {
                                vars: {
                                    weekStartDate: {
                                        $dateFromParts: {
                                            year: { $year: "$createdDate" },
                                            month: { $month: "$createdDate" },
                                            day: {
                                                $subtract: [
                                                    { $dayOfMonth: "$createdDate" },
                                                    {
                                                        // Ajuste para que la semana empiece el lunes y
                                                        // el domingo pertenezca a la misma semana (no a la siguiente)
                                                        $cond: [
                                                            { $eq: [{ $dayOfWeek: "$createdDate" }, 1] }, // domingo
                                                            6,
                                                            { $subtract: [{ $dayOfWeek: "$createdDate" }, 2] } // lun=2 -> 0, mar=3 ->1, ...
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                in: "$$weekStartDate"
                            }
                        }
                    },
                    // ENTRADAS
                    totalIn: {
                        $sum: {
                            $cond: [{
                                $in: ["$typeIn", [
                                    typeSupplyEnum.in.dispatch,
                                    typeSupplyEnum.in.externProvider,
                                    typeSupplyEnum.in.storeRelocation
                                ]]
                            }, "$in", 0]
                        }
                    },
                    // SALIDAS GENERALES
                    totalOut: {
                        $sum: {
                            $cond: [{
                                $in: ["$type", [
                                    typeSupplyEnum.out.used,
                                    typeSupplyEnum.out.trash,
                                    typeSupplyEnum.out.transfer
                                ]]
                            }, "$out", 0]
                        }
                    },
                    // SALIDAS TYPE 2 (trash)
                    totalOutType2: {
                        $sum: {
                            $cond: [{ $eq: ["$type", typeSupplyEnum.out.trash] }, "$out", 0]
                        }
                    },
                    // SALIDAS TYPE 3 (transfer)
                    totalOutType3: {
                        $sum: {
                            $cond: [{ $eq: ["$type", typeSupplyEnum.out.transfer] }, "$out", 0]
                        }
                    },
                    // USADO (type 1)
                    totalOutSell: {
                        $sum: {
                            $cond: [{ $eq: ["$type", typeSupplyEnum.out.used] }, "$out", 0]
                        }
                    },
                    // MONTO TOTAL USADO
                    totalOutSellAmount: {
                        $sum: {
                            $multiply: [
                                "$price",
                                { $cond: [{ $eq: ["$type", typeSupplyEnum.out.used] }, "$out", 0] }
                            ]
                        }
                    },
                    usedAdjustment: {
                        $sum: {
                            $cond: [
                                { $gt: ["$adjustment", 0] },
                                { $subtract: ["$amountBefore", "$adjustment"] },
                                0
                            ]
                        }
                    },
                    // OTROS CAMPOS
                    price: {
                        $first: {
                            $cond: [
                                { $eq: ["$product.lastPrice", 0] },
                                "$price",
                                "$product.lastPrice"
                            ]
                        }
                    },
                    product: { $first: '$product' },
                        weekRange: {
                            $first: {
                                $concat: [
                                    {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: {
                                                $let: {
                                                    vars: {
                                                        weekStartDate: {
                                                            $dateFromParts: {
                                                                year: { $year: "$createdDate" },
                                                                month: { $month: "$createdDate" },
                                                                day: {
                                                                    $subtract: [
                                                                        { $dayOfMonth: "$createdDate" },
                                                                        {
                                                                            $cond: [
                                                                                { $eq: [{ $dayOfWeek: "$createdDate" }, 1] }, // domingo
                                                                                6,
                                                                                { $subtract: [{ $dayOfWeek: "$createdDate" }, 2] }
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    },
                                                    in: "$$weekStartDate"
                                                }
                                            }
                                        }
                                    },
                                    " al ",
                                    {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: {
                                                $dateAdd: {
                                                    startDate: {
                                                        $let: {
                                                            vars: {
                                                                weekStartDate: {
                                                                    $dateFromParts: {
                                                                        year: { $year: "$createdDate" },
                                                                        month: { $month: "$createdDate" },
                                                                        day: {
                                                                            $subtract: [
                                                                                { $dayOfMonth: "$createdDate" },
                                                                                {
                                                                                    $cond: [
                                                                                        { $eq: [{ $dayOfWeek: "$createdDate" }, 1] },
                                                                                        6,
                                                                                        { $subtract: [{ $dayOfWeek: "$createdDate" }, 2] }
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            in: "$$weekStartDate"
                                                        }
                                                    },
                                                    unit: "day",
                                                    amount: 6
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                    agency: { $first: '$agency' }
                }
            },
            { $sort: sortBy },
            { $lookup: {
                from: 'agencies',
                localField: 'agency',
                foreignField: '_id',
                as: 'agency'
            }},
            { $unwind: '$agency' },
        ];

        // Paginación
        if (!inventoryParam.isExcel) {
            stages.push({
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (pageSize * pageIndex) - pageSize },
                        { $limit: pageSize }
                    ],
                    totalOutSellAmount: [{
                        $group: {
                            _id: null,
                            total: { $sum: "$totalOutSellAmount" }
                        }
                    }]
                }
            });
        }

        // Filtro por agencia según rol
        if (inventoryParam.user.role === role.rol.Manager) {
            stages.unshift({
                $match: { agency: ObjectId(inventoryParam.user.agency) }
            });
        }

        // Filtros
        if (inventoryParam.filters) {
            if (inventoryParam.filters.agency) {
                stages.unshift({
                    $match: { agency: ObjectId(inventoryParam.filters.agency) }
                });
            }
            
            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift({
                    $match: {
                        createdDate: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    }
                });
            } else if (inventoryParam.filters.startDate) {
                // Si solo se envía startDate en este reporte semanal,
                // se interpreta como "la semana de esa fecha" (startDate hasta startDate + 6 días)
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.startDate).utc().add(6, 'days').endOf('day');
                stages.unshift({
                    $match: {
                        createdDate: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    }
                });
            } else if (inventoryParam.filters.endDate) {
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift({
                    $match: { createdDate: { $lte: new Date(endDate) } }
                });
            }
        }

        // Si no hay filtros de fecha, mostrar solo la semana actual
        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
            const startDate = moment().startOf('week').add(1, 'day'); // Lunes de esta semana
            const endDate = moment().endOf('week').add(1, 'day'); // Domingo de esta semana
            
            stages.unshift({
                $match: {
                    createdDate: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            });
        }

        const inventories = await InventoryRecord.aggregate(stages);
        let DataResult = inventoryParam.isExcel ? inventories : inventories[0].data;

        // Calcular los campos adicionales para cada semana
        await Promise.all(DataResult.map(async (weeklyInventory) => {
            try {
                // Obtener el stock inicial de la semana (último registro del día anterior al inicio de la semana)
                const weekStart = moment(weeklyInventory._id.weekStart).startOf('day');
                const dayBeforeWeek = moment(weekStart).subtract(1, 'day').endOf('day');
                
                const dataBeforeWeek = await InventoryRecord.findOne({
                    product: weeklyInventory.product._id,
                    agency: weeklyInventory.agency._id,
                    createdDate: { $lte: new Date(dayBeforeWeek) }
                }).sort({ createdDate: -1 });

                const initial = dataBeforeWeek ? dataBeforeWeek.amountAfter : 0;

                // Obtener el inventario físico al final de la semana
                const weekEnd = moment(weekStart).add(6, 'days').endOf('day');
                const physicalRecord = await InventoryRecord.findOne({
                    product: weeklyInventory.product._id,
                    agency: weeklyInventory.agency._id,
                    createdDate: { $lte: new Date(weekEnd) }
                }).sort({ createdDate: -1 });

                const physicalQuantity = physicalRecord ? physicalRecord.amountAfter : 0;

                // Cálculo teórico
                const TotalQuantity = initial + weeklyInventory.totalIn - weeklyInventory.totalOut;

                // Asignar campos al resultado
                Object.assign(weeklyInventory, {
                    initial: initial,
                    TotalQuantity: TotalQuantity,
                    physicalQuantity: physicalQuantity,
                    date: weeklyInventory.weekRange // Usar el rango de fechas en lugar de fecha única
                });

            } catch (err) {
                console.error("Error procesando inventario semanal:", err);
                throw err;
            }
        }));

        return {
            results: DataResult,
            metadata: !inventoryParam.isExcel ? inventories[0].metadata : [],
            totalOutSellAmount: !inventoryParam.isExcel ? 
                (inventories[0]?.totalOutSellAmount?.[0]?.total || 0) : null
        };
    },

    /**
     * Reporte de inventarios (calculado)
     */
    dataTableInventoryReportMixed: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex;

        //orden por defecto
        var sortBy = { "_id.createdDate": -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (inventoryParam.sortBy) {

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1

            if (inventoryParam.sortBy.id == "date") {
                sortBy = { "_id.createdDate": direction }
            } else {
                sortBy = { [inventoryParam.sortBy.id]: direction }
            }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if (inventoryParam.filters.code) {
            productCode = Number(inventoryParam.filters.code)
        }

        //agrupar por fecha, producto, agencia
        //Sacar total en ventas, entradas, salidas por merma, repesaje, degustación y empaques
        let stages = [
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match: { "product.code": productCode } },
            {
                $group: {
                    _id: { product: '$product._id', agency: '$agency' },
                    // Total en salidas del producto
                    totalOut: { $sum: { $cond: [{ $eq: ["$typeIn", 0] }, "$out", 0] } },
                    // Total de salidas por ventas o uso del producto
                    totalOutSell: { $sum: { $cond: [{ $eq: ["$type", typeSupplyEnum.out.used] }, "$out", 0] } },
                    // Total de salidas por ventas o uso del producto (En dólares)
                    totalOutSellAmount : { $sum : {  $multiply : ["$price", { $cond: [{ $eq: ["$type", typeSupplyEnum.out.used] }, "$out", 0] }] } },
                    // Total de salidas por desechos del producto
                    totalOutTrash: { $sum: { $cond: [{ $eq: ["$type", typeSupplyEnum.out.trash] }, "$out", 0] } },
                    // Total de salidas por desechos del transferencia entre tiendas
                    totalOutTransfer: { $sum: { $cond: [{ $eq: ["$type", typeSupplyEnum.out.transfer] }, "$out", 0] } },
                    //total entradas
                    totalIn: { $sum: { $cond: [{ $eq: ["$type", 0] }, "$in", 0] } },
                    // Total de entradas por despacho
                    totalInDispatch: { $sum: { $cond: [{ $eq: ["$typeIn", typeSupplyEnum.in.dispatch] }, "$in", 0] } },
                    // Total de entradas por proveedor externo
                    totalInExternProvider: { $sum: { $cond: [{ $eq: ["$typeIn", typeSupplyEnum.in.externProvider] }, "$in", 0] } },
                    // Total de entradas por transferencia entre tiendas
                    totalInStoreRelocation: { $sum: { $cond: [{ $eq: ["$typeIn", typeSupplyEnum.in.storeRelocation] }, "$in", 0] } },

                    price: { $last: '$price' },
                    product: { $first: '$product' },
                    agency: { $first: '$agency' }
                }
            },
            { $sort: sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if (!inventoryParam.isExcel) {
            stages.push(
                { $facet: { 
                        metadata: [
                            { $count: "total" }
                        ], 
                        data: [
                            { $skip: (pageSize * pageIndex) - pageSize }, 
                            { $limit: pageSize }
                        ],
                        // Total de salidas por ventas o uso del producto (En dólares)
                        totalOutSellAmount : [
                            {   $group : {
                                    _id : null,
                                    total : { $sum : "$totalOutSellAmount" }
                                }
                            }
                        ]
                    }, 
                },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if (inventoryParam.user.role == role.rol.Manager) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if (inventoryParam.filters.agency) {

                stages.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
                throw ('Para obtener la data mezclada debe existir una FECHA FINAL')
            }

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                throw ('Para obtener la data mezclada debe existir una FECHA INICIAL')
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }
        else {
            throw ('Para obtener la data mezclada debe existir una FECHA INICIAL y UNA FECHA FINAL')
        }

        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
            throw ('Para obtener la data mezclada debe existir una FECHA INICIAL y UNA FECHA FINAL')
        }

        const inventories = await InventoryRecord.aggregate(stages);

        let DataResult = inventories;

        if (!inventoryParam.isExcel) {
            DataResult = inventories[0].data;
        }

        //Buscar inventario inicial por producto 
        await Promise.all(DataResult.map(async (inventory) => {

            try {

                const endDate = moment(inventoryParam.filters.startDate).subtract(1, 'days').endOf('day');

                //1. Consultar ultima operacion del dia anterior
                const dataDayBefore = await InventoryRecord.findOne({
                    product: inventory.product._id,
                    agency: inventory.agency._id,
                    createdDate: { $lte: new Date(endDate) }
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                //Fecha del registro: inicio y fin del dia
                const dayStart = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const dayEnd = moment(inventoryParam.filters.endDate).utc().endOf('day');

                //TotalQuantity: Consultar ultima operacion registrada para obtener el total
                //Y que no sea inventario fisico : 14
                let totalArithmetic = await InventoryRecord.findOne({
                    product: inventory.product._id,
                    agency: inventory.agency._id,
                    createdDate: { $lte: new Date(dayEnd) }
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                //inventario fisico ingresado y ajuste
                let aritmetic = totalArithmetic.type === typeSupplyEnum.out.used ? totalArithmetic.amountBefore : totalArithmetic.amountAfter;

                return Object.assign(inventory, {
                    initial: (dataDayBefore && dataDayBefore.amountAfter) ? dataDayBefore.amountAfter : 0,
                    physicalQuantity: totalArithmetic.amountAfter,
                    TotalQuantity: aritmetic,
                    priceAt: totalArithmetic.price
                });

            } catch (err) {
                throw err;
            }
        }));

        //Sacar total aritmentico
        await Promise.all(DataResult.map(async (inventory) => {

            let total = inventory.initial + inventory.totalInDispatch + inventory.totalInExternProvider + inventory.totalInStoreRelocation - inventory.totalOutSell - inventory.totalOutTrash - inventory.totalOutTransfer;

            Object.assign(inventory, {
                TotalAmount: total
            });
        }));

        return {
            //results: inventories, 
            results: DataResult,
            metadata: !inventoryParam.isExcel ? inventories[0].metadata : [],
            totalOutSellAmount: !inventoryParam.isExcel ? inventories[0].totalOutSellAmount[0].total : null,
        }
    },

    /** Función para actualizar inventario
     * 
     * @param {id} id de inventario 
     * @param {params} inventoryParam
     */
    update: async (id, inventoryParam) => {

        const inventory = await Inventory.findById(id);

        // Validar
        if (!inventory) throw 'inventario no encontrado';

        let inventorykg = inventory.kg;
        //fecha de actualización
        // inventory.updatedDate = Date.now();

        // copiar propiedades de inventoryParam a inventory
        Object.assign(inventory, inventoryParam);

        await inventory.save();

        //registrar la entrada en historial
        let inventoryRecordParam = {}
        inventoryRecordParam.product = inventory.product;
        inventoryRecordParam.agency = inventory.agency;
        inventoryRecordParam.kg = inventorykg;// lo anterior
        inventoryRecordParam.in = 0//kgs entrantes
        inventoryRecordParam.out = parseFloat(inventorykg) - parseFloat(inventoryParam.kg)//salida es la diferencia
        inventoryRecordParam.total = parseFloat(inventoryParam.kg).toFixed(3);//Total
        inventoryRecordParam.note = " ";
        inventoryRecordParam.type = typeSupplyEnum.out.reweigh;
        const record = new InventoryRecord(inventoryRecordParam);
        const recordSaved = await record.save();

        if (!recordSaved) {
            throw 'Error registrando el inventario';
        }
    },



    /**
     * Función para obtener
     * 
     * @param {id} id de inventario 
     */
    getInventory: async (id) => {
        const inventory = await Inventory.findById(id).populate('product', 'name price').populate('agency', 'name');

        // Validar
        if (!inventory) throw 'inventario no encontrado';

        return inventory;
    },

    /**
     * Funcion para obtener todos los inventario
     */
    getAll: async () => {
        return await Inventory.find().sort({ name: 'asc' });
    },


    /**
     * Reporte de ventas
     */
    reportSales: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (inventoryParam.sortBy) {

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id]: direction }

        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if (inventoryParam.filters.code) {
            productCode = { $eq: inventoryParam.filters.code }
        }

        let stages = []
        let stageTotal = []

        //  Filtrar por Detal, Mayor o Crédito
        if (inventoryParam.filters.searchType) {

            if (inventoryParam.filters.searchType === "wholesale") {
                stages.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isWholesale": true, "isCredit": false } },
                );
                stageTotal.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isWholesale": true, "isCredit": false } },
                );
            }
            else if (inventoryParam.filters.searchType === "credit") {
                stages.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isCredit": true } },
                );
                stageTotal.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isCredit": true } },
                );
            }
            else if (inventoryParam.filters.searchType === "combo") {
                stages.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isCombo": true } },
                );
                stageTotal.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isCombo": true } },
                );
            }
            else {
                stages.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isWholesale": false } },
                );
                stageTotal.unshift(
                    { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used }, "isWholesale": false } },
                );
            }
        }
        else {
            stages.unshift(
                { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used } } },
            );
            stageTotal.unshift(
                { $match: { "out": { $gt: 0 }, "type": { $eq: typeSupplyEnum.out.used } } },
            );
        }
        //agrupar por fecha, producto, agencia y donde existan salidas "out" y sea de tipo sale o venta

        stages.push(
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            {
                $group: {
                    _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } } },
                    totalOutAmount: { $sum: "$out" },
                    totalCash: { $sum: { $multiply: ["$price", "$out"] } },
                    product: { $first: '$product' },
                    createdDate: { $first: { $dateToString: { format: "%G-%m-%d", date: "$createdDate" } } },
                    agency: { $first: '$agency' }
                }
            },
            { $match: { "product.code": productCode } },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            { $sort: sortBy }
        );

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if (!inventoryParam.isExcel) {
            stages.push(
                { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }] } },
            );
        }

        //stage del total 
        stageTotal.push(
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match: { "product.code": productCode } },
            {
                $group:
                {
                    _id: null,
                    totalAmount: { $sum: { $multiply: ["$price", "$out"] } },
                    totalKg: { $sum: "$out" }
                }
            }
        );

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if (inventoryParam.user.role == role.rol.Manager) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
            stageTotal.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if (inventoryParam.filters.agency) {

                stages.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
                stageTotal.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            //Si hay filtro de tipo de salida
            if (inventoryParam.filters.type) {

                stages.unshift(
                    { $match: { type: parseInt(inventoryParam.filters.type) } },
                );
                stageTotal.unshift(
                    { $match: { type: parseInt(inventoryParam.filters.type) } },
                );
            }

            //filtro por nombres
            if (inventoryParam.filters.names) {
                let regex = new RegExp(inventoryParam.filters.names, 'gi');
                stages.unshift(
                    { $match: { names: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { names: { $regex: regex } } },
                );
            }

            //filtro por teléfono
            if (inventoryParam.filters.phone) {
                let regex = new RegExp(inventoryParam.filters.phone, 'gi');
                stages.unshift(
                    { $match: { phone: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { phone: { $regex: regex } } },
                );
            }

            //filtro por comentario
            if (inventoryParam.filters.comment) {
                let regex = new RegExp(inventoryParam.filters.comment, 'gi');
                stages.unshift(
                    { $match: { comment: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { comment: { $regex: regex } } },
                );
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        //Si todos los filtros son vacios se consulta la fecha actual
        if (!inventoryParam.filters.code && !inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
            const startDate = moment().startOf('day');
            const endDate = moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
            stageTotal.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryRecord.aggregate(stages);

        let total = [];

        if (!inventoryParam.isExcel) {

            //Sumar total si las fechas se definieron o si es el día actual
            if ((inventoryParam.filters.startDate && inventoryParam.filters.endDate) || (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate)) {
                //Total del resultado
                total = await InventoryRecord.aggregate(stageTotal);
            }

        }

        return {
            results: !inventoryParam.isExcel ? inventories[0].data : inventories,
            metadata: !inventoryParam.isExcel ? inventories[0].metadata : [],
            total
        }

    },

    /**
     * Funcion para redirigir de donde obtener el reporte de inventario, si de la base de datos, o habrá que calcularlo
     *
     */

    getInventoryReport: async (inventoryParam) => {

        // Si se pide del mismo dia o un rango que lo incluya, se deberá entonces calcular de la manera normal

        // En caso de que se pidan los datos del mismo dia
        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {

            return await inventoryService.dataTableInventoryReport(inventoryParam);
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                throw ('ERROR. Debe colocar una fecha límite inferior')
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {

                return await inventoryService.dataTableInventoryReport(inventoryParam);
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {

                let currentDate = moment().utc().subtract(4, 'hours')

                let startDate = moment(inventoryParam.filters.startDate).utc().subtract(4, 'hours').startOf('days');
                let endDate = moment(inventoryParam.filters.endDate).utc().subtract(4, 'hours').endOf('days');

                // Si el rango de dias incluye el dia actual, se calcula normalmente, de lo contrario se obtiene todo de la base de datos
                if (moment(currentDate).isSame(startDate, 'day') || moment(currentDate).isSame(endDate, 'day') || moment(currentDate).isBetween(startDate, endDate, 'day')) {

                    return await inventoryService.dataTableInventoryReport(inventoryParam);
                }
                else {

                    let data = await inventoryService.dataTableInventoryReportSaved(inventoryParam);

                    // En caso de que haya data, se envía, y de lo contrario se calcula de la manera normal

                    if (data.results.length > 0) {
                        return data
                    }
                    else {

                        // Se creará nueva data unicamente para los casos en lo que la fecha inicial de búsqueda sea igual a la final
                        if (moment(startDate).isSame(endDate, 'day')) {

                            // Si hay filtro por agencia, se verifica que esa agencia esté activa, es decir, que exista un historial de inventario para ese dia
                            if (inventoryParam.filters.agency) {
                                let historyData = await inventoryService.dataTableHistory(inventoryParam);

                                if (historyData.results.length === 0) {
                                    return await inventoryService.dataTableInventoryReportSaved(inventoryParam);
                                }
                            }

                            // Se ingresan los parámetros tal que se consiga todos los reportes de inventario de todas las tiendas
                            let params = {
                                user: {
                                    role: 1,
                                },
                                sortBy: { id: 'date', desc: true },
                                filters: {
                                    agency: '',
                                    code: '',
                                    startDate: moment(inventoryParam.filters.startDate).utc().startOf('day'),
                                    endDate: moment(inventoryParam.filters.startDate).utc().endOf('day'),
                                },
                                isExcel: true
                            }

                            // Se obtiene el reporte de invetario de cada producto, de cada tienda
                            let dataTable = await inventoryService.dataTableInventoryReport(params);

                            if (dataTable.results.length > 0) {
                                // Se realiza un Reporte para cada uno de los productos

                                await Promise.all(dataTable.results.map(async (item) => {

                                    delete item._id

                                    item.product = item.product._id;
                                    item.agency = item.agency._id;

                                    let newInventoryReport = new InventoryReport(item);

                                    return await newInventoryReport.save();
                                }))

                                // Y ahora que ya se creó la data, se envía rápidamente
                                return await inventoryService.dataTableInventoryReportSaved(inventoryParam);
                            }
                            else {

                                // Si directamente no hay data en InventoryRecord, no se va a guardar nada y va a haber un loop infinito por lo que en este caso se calcula de manera normal
                                return await inventoryService.dataTableInventoryReport(inventoryParam);
                            }
                        }
                        else {
                            return await inventoryService.dataTableInventoryReport(inventoryParam);
                        }
                    }
                }
            }
        }
    },



    /**
     * Reporte de inventarios (calculado)
     */
    dataTableInventoryReportSaved: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex;

        //orden por defecto
        var sortBy = { "date": -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (inventoryParam.sortBy) {

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1

            if (inventoryParam.sortBy.id == "date") {
                sortBy = { "date": direction }
            } else {
                sortBy = { [inventoryParam.sortBy.id]: direction }
            }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if (inventoryParam.filters.code) {
            productCode = { $eq: inventoryParam.filters.code }
        }

        //agrupar por fecha, producto, agencia
        //Sacar total en ventas, entradas, salidas por merma, repesaje, degustación y empaques
        let stages = [
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match: { "product.code": productCode } },
            { $sort: sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if (!inventoryParam.isExcel) {
            stages.push(
                { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if (inventoryParam.user.role == role.rol.Manager) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if (inventoryParam.filters.agency) {

                stages.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { date: { $gte: new Date(startDate) } } },
                );
            }

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { date: { $lte: new Date(endDate) } } },
                );
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
            const startDate = moment().startOf('day');
            const endDate = moment().endOf('day');
            stages.unshift(
                { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryReport.aggregate(stages);

        let DataResult = inventories;

        if (!inventoryParam.isExcel) {
            DataResult = inventories[0].data;
        }

        let totalAdjustmentAmountSum = 0

        //Sacar total aritmentico
        await Promise.all(DataResult.map(async (inventory) => {

            if (inventory.product.code == '31' || inventory.product.code == '32') {

                let total = inventory.initialAmount + inventory.totalInAmount - inventory.totalSellAmount + inventory.totalCutAmount - inventory.totalDecreaseAmount - inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if (inventory.physicalAmount > 0) {
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, {
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            } else {

                let total = inventory.initialAmount + inventory.totalInAmount - inventory.totalSellAmount - inventory.totalCutAmount - inventory.totalDecreaseAmount - inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if (inventory.physicalAmount > 0) {
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, {
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }
            totalAdjustmentAmountSum += inventory.totalAdjustmentAmount
        }));

        return {
            //results: inventories, 
            results: DataResult,
            metadata: !inventoryParam.isExcel ? inventories[0].metadata : [],
            totalAdjustmentAmountSum
        }
    },


    /**
     * Funcion para obtener las inventario con paginación y filtros
     */
    dataTableAdjustmentHistory: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (inventoryParam.sortBy) {
            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id]: direction }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if (inventoryParam.filters.code) {
            productCode = { $eq: inventoryParam.filters.code }
        }

        let stages = []

        // Si únicamente se piden los ajustes finales
        if (inventoryParam.filters.finalAdjustments) {
            stages = [
                {
                    $match: {
                        $expr: {
                            $and: [{ $ne: [{ $hour: "$createdDate" }, 23] },
                            { $ne: [{ $minute: "$createdDate" }, 59] },
                            { $ne: [{ $second: "$createdDate" }, 59] },]
                        }
                    }
                },
                {
                    $group: {
                        _id: { agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } } },
                        user: { $last: '$user' },
                        product: { $last: '$product' },
                        agency: { $last: '$agency' },
                        kg: { $last: '$kg' },
                        createdDate: { $last: '$createdDate' }
                    }
                },
                { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
                { $unwind: '$product' },
                { $match: { "product.code": productCode } },
                { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
                { $unwind: '$agency' },
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $unset: ["user.hash", "user.createdDate"] },//Remover pass user y createdDate
                { $sort: sortBy },
            ];
        }
        else {
            stages = [
                { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
                { $unwind: '$product' },
                { $match: { "product.code": productCode } },
                {
                    $match: {
                        $expr: {
                            $and: [{ $ne: [{ $hour: "$createdDate" }, 23] },
                            { $ne: [{ $minute: "$createdDate" }, 59] },
                            { $ne: [{ $second: "$createdDate" }, 59] },]
                        }
                    }
                },
                { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
                { $unwind: '$agency' },
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $unset: ["user.hash", "user.createdDate"] },//Remover pass user y createdDate
                { $sort: sortBy },
            ];
        }
        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if (!inventoryParam.isExcel) {
            stages.push(
                { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if (inventoryParam.user.role == role.rol.Manager) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if (inventoryParam.filters.agency) {
                stages.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            //Si hay filtro de usuario
            if (inventoryParam.filters.idUser) {
                stages.unshift(
                    { $match: { user: ObjectId(inventoryParam.filters.idUser) } },
                );
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
            const startDate = moment().utc().startOf('day');
            const endDate = moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await AdjustmentRecord.aggregate(stages);

        return {
            results: !inventoryParam.isExcel ? inventories[0].data : inventories,
            metadata: !inventoryParam.isExcel ? inventories[0].metadata : [],
        }
    },



    dataTableEntryHistory: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (inventoryParam.sortBy) {
            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id]: direction }
        }

        let stages = [
            { $match: { "type": { $eq: 0 } } },
            {
                $match: {
                    $expr: {
                        $and: [{ $ne: [{ $hour: "$createdDate" }, 0o0] },
                        { $ne: [{ $minute: "$createdDate" }, 30] },]
                    }
                }
            },
            { $lookup: { from: 'miscellaneous', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            // Nuevo: exponer company como campo de primer nivel para el front
            { $addFields: { company: '$agency.company' } },
            { $sort: sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if (!inventoryParam.isExcel) {
            stages.push(
                { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if (inventoryParam.user.role == role.rol.Manager) {
            stages.unshift(
                { $match: { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            // Filtro por compañía (company) usando la colección de agencias
            if (inventoryParam.filters.company) {
                let regex = new RegExp(inventoryParam.filters.company, 'gi');

                let agencies = await Agency.find({
                    company: { $regex: regex }
                }).select('_id');

                let agencyIds = agencies.map(agency => agency._id);

                if (agencyIds.length > 0) {
                    stages.unshift({
                        $match: { agency: { $in: agencyIds.map(id => ObjectId(id)) } }
                    });
                } else {
                    // Si no hay agencias que coincidan, retornar resultados vacíos
                    return {
                        results: [],
                        metadata: [],
                    };
                }
            }

            //Si hay filtro de sucursal
            if (inventoryParam.filters.agency) {

                stages.unshift(
                    { $match: { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if (inventoryParam.filters.startDate && !inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if (!inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if (inventoryParam.filters.startDate && inventoryParam.filters.endDate) {
                const startDate = moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate = moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

            if (inventoryParam.filters.searchType) {

                if (inventoryParam.filters.searchType === "dispatch") {
                    stages.unshift(
                        { $match: { "typeIn": { $eq: typeSupplyEnum.in.dispatch } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "externProvider") {
                    stages.unshift(
                        { $match: { "typeIn": { $eq: typeSupplyEnum.in.externProvider } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "storeRelocation") {
                    stages.unshift(
                        { $match: { "typeIn": { $eq: typeSupplyEnum.in.storeRelocation } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "correction") {
                    stages.unshift(
                        { $match: { "typeIn": { $eq: typeSupplyEnum.in.correction } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "return") {
                    stages.unshift(
                        { $match: { "typeIn": { $eq: typeSupplyEnum.in.return } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "wholesaleReturn") {
                    stages.unshift(
                        { $match: { "typeIn": { $eq: typeSupplyEnum.in.wholesaleReturn } } },
                    );
                }
            }
        }

        if (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate && !inventoryParam.filters.company) {
            const startDate = moment().utc().startOf('day');
            const endDate = moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventory = await InventoryRecord.aggregate(stages);

        return {
            results: !inventoryParam.isExcel ? inventory[0].data : inventory,
            metadata: !inventoryParam.isExcel ? inventory[0].metadata : [],
        }
    },

}

module.exports = inventoryService;