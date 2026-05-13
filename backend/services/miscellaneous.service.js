const db = require('../_helpers/db');
const Miscellaneous = db.Miscellaneous;
const MiscellaneousRecord = db.MiscellaneousRecord;
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const webhook = require('../_helpers/webhook');

let miscellaneousService = {

    /**  Función para registrar producto
     * 
     * @param {Object} productParam - Nombre del producto
     * @param {String} productParam.user - Código del objeto en la base de datos del usuario que realiza la modificacion 
     * @param {String} productParam.code - Código que va a tener el nuevo producto
     * @param {String} productParam.name - Nombre del producto
     * @param {String} productParam.presentation - Presentacion del producto (kg o unid)
     * @param {Number} productParam.price - Nuevo precio del producto
     */

    create: async (productParam) => {

        //Código de product
        if (await Miscellaneous.findOne({ code: productParam.code })) {
            throw 'Código de producto "' + productParam.code + '" ya usado';
        }

        const product = new Miscellaneous(productParam);
        const catalogSaved = await product.save();

        if (!catalogSaved) {
            throw 'Error registrando el producto';
        }


        let newRecord = await Miscellaneous.findOne({ code: catalogSaved.code }).lean()

        delete newRecord._id
        newRecord.user = productParam.user

        const history = new MiscellaneousRecord(newRecord);

        await history.save();
    },

    /** Función para actualizar productos
     * 
     * @param {String} id - Código del objeto del producto que va a ser actualizado
     * @param {Object} productParam - Nombre del producto
     * @param {String} productParam.user - Código del objeto en la base de datos del usuario que realiza la modificacion 
     * @param {String} productParam.name - Nombre del producto
     * @param {String} productParam.presentation - Presentacion del producto (kg o unid)
     * @param {Number} productParam.price - Nuevo precio del producto
     */

    update: async (id, productParam) => {

        const product = await Miscellaneous.findById(id);

        // Validar
        if (!product) throw 'producto no encontrado';

        //  Se quitan las comas de los numeros antes de guardar

        let price = parseFloat(productParam.price.toString().replace(/,/g, ''));
        productParam.price = price;

        // Se modifica la fecha de actualizacion
        productParam.updateDate = moment().utc();

        // Se guardan los precios anteriores del producto
        productParam.lastPrice = product.price;

        // copiar propiedades de productParam a product
        Object.assign(product, productParam);
        const productSaved = await product.save();

        const history = new MiscellaneousRecord(productParam);

        history.code = product.code;
        history.price = price;
        const save = await history.save();

        if (!save) {
            throw 'Error registrando en historial';
        }

        // Enviar webhook al backend de fábrica
        try {
            const webhookData = {
                miscellaneousId: id,
                code: product.code,
                name: product.name,
                presentation: product.presentation,
                price: price,
                lastPrice: product.lastPrice,
                updateDate: productParam.updateDate,
                user: productParam.user
            };

            const webhookResult = await webhook.sendMiscellaneousUpdate(webhookData);

            if (webhookResult) {
                console.log('[MISCELLANEOUS][WEBHOOK] Webhook enviado exitosamente');
                console.log('[MISCELLANEOUS][WEBHOOK] Respuesta de fábrica:', JSON.stringify(webhookResult, null, 2));
            } else {
                console.warn('[MISCELLANEOUS][WEBHOOK] Webhook retornó null/undefined - puede que no se haya enviado');
            }
        } catch (webhookError) {
            console.error('[MISCELLANEOUS][WEBHOOK] Error enviando webhook a fábrica:');
            console.error('[MISCELLANEOUS][WEBHOOK] Error message:', webhookError?.message || webhookError);
            console.error('[MISCELLANEOUS][WEBHOOK] Error stack:', webhookError?.stack);
            // No lanzamos el error para no interrumpir el flujo de actualización del producto
        }

        return productSaved
    },

    /** Funcion para obtener los productos que no estan en historial
     *
     */

    dataTable: async () => {
        const products = await Miscellaneous.find()
        return {
            results: products,
        }
    },

    /** Función para obtener un producto mediante su id
     * 
     * @param {String} id - `id` de producto en la base de datos `Product`
     */

    getProduct: async (id) => {

        const product = await Miscellaneous.findById(id);

        if (!product) throw 'producto no encontrado';

        return product;
    },

    /** Funcion para obtener las productos de historial
     * 
     */
    dataTableHistory: async (productParam) => {

        // resultados por página
        const pageSize = productParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = productParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if (productParam.sortBy) {

            let direction = productParam.sortBy.desc == true ? -1 : 1
            sortBy = { [productParam.sortBy.id]: direction }

        }

        //Stage inicial de la consulta
        let stages = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: sortBy },
            { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }] } },
        ];


        //Filtros para la consulta
        if (productParam.filters) {

            //Si hay filtro de tipo de salida
            if (productParam.filters.presentation) {
                stages.unshift(
                    { $match: { presentation: productParam.filters.presentation } },
                );
            }

            //Si hay filtro de usuario
            if (productParam.filters.idUser) {
                stages.unshift(
                    { $match: { user: ObjectId(productParam.filters.idUser) } },
                );
            }

            //filtro por nombres
            if (productParam.filters.name) {
                let regex = new RegExp(productParam.filters.name, 'gi');
                stages.unshift(
                    { $match: { name: { $regex: regex } } },
                );
            }

            //filtro por código
            if (productParam.filters.code) {
                stages.unshift(
                    { $match: { code: productParam.filters.code } },
                );
            }

            if (productParam.filters.startDate && !productParam.filters.endDate) {
                const startDate = moment(productParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if (!productParam.filters.startDate && productParam.filters.endDate) {
                const endDate = moment(productParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if (productParam.filters.startDate && productParam.filters.endDate) {
                const startDate = moment(productParam.filters.startDate).utc().startOf('day');
                const endDate = moment(productParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        const products = await MiscellaneousRecord.aggregate(stages);

        return {
            results: products[0].data,
            metadata: products[0].metadata,
        }
    },
}

module.exports = miscellaneousService;