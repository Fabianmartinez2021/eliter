const db = require('../_helpers/db');
const Product = db.Product;
const Offer = db.Offer;
const ProductRecord = db.ProductRecord;
const Combos = db.Combos;
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const webhook = require('../_helpers/webhook');

let productService = {

    /**  Función para registrar producto
     * 
     * @param {Object} productParam - Nombre del producto
     * @param {String} productParam.user - Código del objeto en la base de datos del usuario que realiza la modificacion 
     * @param {String} productParam.code - Código que va a tener el nuevo producto
     * @param {String} productParam.name - Nombre del producto
     * @param {String} productParam.presentation - Presentacion del producto (kg o unid)
     * @param {Boolean} productParam.applyWholesaleDiscount - Si aplica para descuento al mayor
     * @param {Boolean} productParam.endPrice - 
     * @param {Boolean} productParam.decrease - Si el producto merma por empaque
     * @param {Boolean} productParam.reweigh - Si el producto merma por repesaje
     * @param {Boolean} productParam.mincemeat - Si el producto merma por picadillo
     * @param {Boolean} productParam.exempt - Producto excento
     * @param {Boolean} productParam.taxed - Producto gravado
     * @param {Number} productParam.price - Nuevo precio del producto
     * @param {Number} [productParam.wholesalePrice] - Nuevo precio al mayor del producto
     * @param {Number} [productParam.minWeight] - Peso mínimo para que el producto pueda ser vendido al mayor
     * @param {Number} [productParam.wholesaleDiscountPrice] - Nuevo precio por descuento al mayor
     */

    create: async (productParam) => {

        //Código de product
        if (await Product.findOne({ code: productParam.code })) {
            throw 'Código de producto "' + productParam.code + '" ya usado';
        }

        const product = new Product(productParam);
        const catalogSaved = await product.save();

        if (!catalogSaved) {
            throw 'Error registrando la producto';
        }

    },

    /** Función para actualizar productos
     * 
     * @param {String} id - Código del objeto del producto que va a ser actualizado
     * @param {Object} productParam - Nombre del producto
     * @param {String} productParam.user - Código del objeto en la base de datos del usuario que realiza la modificacion 
     * @param {String} productParam.name - Nombre del producto
     * @param {String} productParam.presentation - Presentacion del producto (kg o unid)
     * @param {Boolean} productParam.applyWholesaleDiscount - Si aplica para descuento al mayor
     * @param {Boolean} productParam.endPrice - 
     * @param {Boolean} productParam.decrease - Si el producto merma por empaque
     * @param {Boolean} productParam.reweigh - Si el producto merma por repesaje
     * @param {Boolean} productParam.mincemeat - Si el producto merma por picadillo
     * @param {Boolean} productParam.exempt - Producto excento
     * @param {Boolean} productParam.taxed - Producto gravado
     * @param {Number} productParam.price - Nuevo precio del producto
     * @param {Number} [productParam.wholesalePrice] - Nuevo precio al mayor del producto
     * @param {Number} [productParam.minWeight] - Peso mínimo para que el producto pueda ser vendido al mayor
     * @param {Number} [productParam.wholesaleDiscountPrice] - Nuevo precio por descuento al mayor
     */

    update: async (id, productParam) => {
        const product = await Product.findById(id);

        // Validar
        if (!product) throw 'producto no encontrado';

        //  Se quitan las comas de los numeros antes de guardar

        let price = parseFloat(productParam.price.toString().replace(/,/g, ''));
        productParam.price = price;

        let wholesalePrice = parseFloat(productParam.wholesalePrice.toString().replace(/,/g, ''));
        productParam.wholesalePrice = wholesalePrice;

        let minWeight = parseFloat(productParam.minWeight.toString().replace(/,/g, ''));
        productParam.minWeight = minWeight;

        let wholesaleDiscountPrice = parseFloat(productParam.wholesaleDiscountPrice.toString().replace(/,/g, ''));
        productParam.wholesaleDiscountPrice = wholesaleDiscountPrice;

        // Se modifica la fecha de actualizacion
        productParam.updateDate = moment().utc();

        // Se guardan los precios anteriores del producto
        productParam.lastPrice = product.price;
        productParam.lastWholesalePrice = product.wholesalePrice;

        // copiar propiedades de productParam a product
        Object.assign(product, productParam);
        await product.save();

        const history = new ProductRecord(productParam);

        history.code = product.code;
        history.price = price;
        const save = await history.save();

        if (!save) {
            throw 'Error registrando en historial';
        }

        // Se verifica si ese producto está en algún combo para actualizar el precio

        let combos = await Combos.find()

        for (let combo of combos) {

            for (let item of combo.items) {

                if (item.id.toString() === id) {

                    // Se calcula el nuevo precio regular del combo completo
                    let newCombosRegularPrice = combo.regularPrice - item.kg * item.regularPrice + item.kg * price

                    // Se asigna el nuevo precio del producto y el nuevo total
                    Object.assign(item, { regularPrice: price, total: price * item.kg });

                    // Se asigna el nuevo precio regular del combo
                    Object.assign(combo, { regularPrice: newCombosRegularPrice });

                    // Se obtienen los nuevos precios relativos en relacion a su total
                    for (let product of combo.items) {
                        Object.assign(product, { price: product.regularPrice * combo.price / combo.regularPrice });
                    }

                    await combo.save()
                }
            }
        }

        // Enviar webhook al backend de fábrica
        try {
            const webhookData = {
                productId: id,
                code: product.code,
                name: product.name,
                presentation: product.presentation,
                price: price,
                lastPrice: product.lastPrice,
                wholesalePrice: wholesalePrice,
                lastWholesalePrice: product.lastWholesalePrice,
                wholesaleDiscountPrice: wholesaleDiscountPrice,
                applyWholesaleDiscount: product.applyWholesaleDiscount,
                minWeight: minWeight,
                minWeightWholesaleDiscount: product.minWeightWholesaleDiscount,
                decrease: product.decrease,              // Merma por empaque
                reweigh: product.reweigh,               // Merma por humedad/repesaje
                mincemeat: product.mincemeat,           // Merma por picadillo
                exempt: product.exempt,                 // Producto exento
                taxed: product.taxed,                   // Producto gravado
                pz: product.pz,                        // Piezas
                image: product.image,
                updateDate: productParam.updateDate,
                user: productParam.user
            };


            const webhookResult = await webhook.sendProductUpdate(webhookData);

            if (webhookResult) {
                console.log('[PRODUCT][WEBHOOK] Webhook enviado exitosamente');
                console.log('[PRODUCT][WEBHOOK] Respuesta de fábrica:', JSON.stringify(webhookResult, null, 2));
            } else {
                console.warn('[PRODUCT][WEBHOOK] Webhook retornó null/undefined - puede que no se haya enviado');
            }
        } catch (webhookError) {
            console.error('[PRODUCT][WEBHOOK] Error enviando webhook a fábrica:');
            console.error('[PRODUCT][WEBHOOK] Error message:', webhookError?.message || webhookError);
            console.error('[PRODUCT][WEBHOOK] Error stack:', webhookError?.stack);
            // No lanzamos el error para no interrumpir el flujo de actualización del producto
        }

    },

    /** Función para obtener un producto mediante su id
     * 
     * @param {String} id - `id` de producto en la base de datos `Product`
     */

    getProduct: async (id) => {
        const product = await Product.findById(id);

        // Validar
        if (!product) throw 'producto no encontrado';

        return product;
    },

    /** Funcion para obtener todos las productos
     * 
     */

    getAll: async () => {
        return await Product.find().sort({ name: 'asc' });
    },

    /**
     * Obtener productos y ofertas
     */
    getProductOffer: async (idAgency) => {
        const products = await Product.find().sort({ name: 'asc' });
        const offers = await Offer.find({ agency: idAgency }).populate('product')

        return {
            products,
            offers
        }
    },

    /** Funcion para obtener los productos que no estan en historial
     *
     */

    dataTable: async () => {
        const products = await Product.find().sort({ name: 1 });
        return {
            results: products,
        }
    },

    /**
     * Funcion para obtener las productos de historial
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

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if (productParam.filters.code) {
            productCode = { $eq: productParam.filters.code }
        }

        //Stage inicial de la consulta
        let stages = [
            { $match: { code: productCode } },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: sortBy },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }]
                }
            },
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

        //Si todos los filtros son vacios se consulta la fecha actual
        if (!productParam.filters.code && !productParam.filters.startDate && !productParam.filters.endDate) {
            const startDate = moment().utc().startOf('day');
            const endDate = moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const products = await ProductRecord.aggregate(stages);

        return {
            results: products[0].data,
            metadata: products[0].metadata,
        }
    },
}

module.exports = productService;