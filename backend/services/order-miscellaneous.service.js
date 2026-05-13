const db = require('../_helpers/db');
const OrderMiscellaneus = db.OrderMiscellaneous;
const OrderMiscellaneousHelper = db.OrderMiscellaneousHelper;
const Sales = db.Sales;
const Miscellaneous = db.Miscellaneous;
const Agency = db.Agency;
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const role = require('../enums/roles.enum');
const Inventory = db.MiscellaneousInventory;
const webhook = require('../_helpers/webhook');

let orderMiscellaneousService = {

    /**
     * Función para registrar ventas
     * 
     * @param {params} orderParam 
     */
    create: async (orderParam) => {

        // No se van a poder emitir órdenes entre las 9:00pm y las 11:59pm

        // Se obtiene la hora actual para de esta manera poder hacer las respectivas restricciones por hora
        let currentDate = new Date(moment().utc().subtract(4, 'hours'));

        // Se fijan las horas NO permitidas
        var beginningTime = moment('9:00pm', 'h:mma').utc().subtract(4, 'hours');
        var endTime = moment('11:59pm', 'h:mma').utc().subtract(4, 'hours');
        
        if(moment(currentDate).isBetween(beginningTime, endTime)){
            //throw('No se pueden realizar pedidos entre las 9:00pm y las 11:59pm');
        }

        let user = orderParam.user;
        let orderProducts = [];     // Productos que se van a incluir en la orden, ya sean los anexos o los de la primera orden
        
        // Se comienza a crear la orden
        let order = {
            products: [], 
            agency: user.agency,
            user: user.id,
            comment: orderParam.order.comment
        }
        
        // Se fija la hora de corte para los pedidos
        var limitTime = moment('08:00am', 'h:mma').utc().subtract(4, 'hours');

        let startDate = (moment(currentDate).isAfter(limitTime)) ? limitTime : moment(limitTime).subtract(1, 'days');
        let endDate = (moment(currentDate).isAfter(limitTime)) ? moment(limitTime).add(1, 'days') : limitTime;
        
        // Se busca la ultima orden del dia o del dia anterior
        const query = {
            createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)},
            agency: user.agency,
        }

        let lastOrder = await OrderMiscellaneus.findOne(query).sort({createdDate: -1})

        // Si la orden es una inicial, se adicionará entonces la columna de la izquierda, y de lo contrario la de la derecha
        if (!lastOrder || (!lastOrder.isModification && !lastOrder.wasConfirmed)){
            orderProducts = orderParam.order.product    // Corrresponde con la columna de la orden inicial
        }
        else{
            // Se verifica si los datos enviados en efecto corresponden con una modificacion, para evitar errores por si el ususario no recargó la página
            if(!orderParam.order.isModification){
                throw('RECARGAR LA PÁGINA. La orden ya fué confirmada, por lo que ya corresponde realizar un anexo')
            }

            orderProducts = orderParam.order.productModification    // Corresponde con la columna de anexo
        }

        // En caso de que no hayan ordenes en el dia, simplemente se crea una nueva orden, pero en caso contrario pueden suceder diversos casos
        if (lastOrder){
            // Si la orden NO ha sido modificada NI confirmada, se elimina la antigua para crear una nueva
            if (!lastOrder.wasConfirmed ){
                await OrderMiscellaneus.findByIdAndDelete(lastOrder._id)

                if (lastOrder.isModification){
                    // Habrá una nueva ultima orden
                    lastOrder = await OrderMiscellaneus.findOne(query).sort({createdDate: -1})
                    order.isModification = true;
                }
            }

            // Si la orden ya fue confirmada, se crea una nueva pero agregando nuevos datos correspondientes a la modificacion y etiquetada de que es una modificacion
            if (lastOrder.wasConfirmed){

                // NO se permitirán nuevos anexos una vez el que agregaron inicialmente ya fue confirmado
                if (lastOrder.isModification){
                    throw('Su anexo inicial ya fue confirmado y está siendo procesado por lo que no puede hacer más anexos por el dia');
                }

                order.isModification = true;
            }
        }

        //const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        //await delay(500);

        // Se obtiene la lista de todos los productos
        const productList = await Miscellaneous.find().lean();


        // Se comienza a crear la orden por cada producto
        for(var key in orderProducts){

            let codeNumber = parseInt(key, 10);

            let productToMatch = await productList.find( item => item.code === codeNumber);
            if (!productToMatch || (orderProducts[key] === null)){
                continue;
            }

            // Se obtiene el inventario del producto basado en su código
            const inventoryAmount = orderParam.order.inventory && orderParam.order.inventory[codeNumber] !== undefined 
                ? parseFloat(orderParam.order.inventory[codeNumber]) 
                : 0;

            // Se almacena el id y la cantidad de cada producto
            let productOrder = { 
                product: productToMatch._id,
                kg: parseFloat(orderProducts[key].toString().replace(/,/g, '')),
                kgDifferential: 0,
                kgTotal: parseFloat(orderProducts[key].toString().replace(/,/g, '')),
                wasModified: false,
                inventory: inventoryAmount
            }

            order.products.push(productOrder)
        }

        // Si la nueva orden es una modificacion, se modifican entonces los campos de cada producto para agregarle el diferencial
        if (order.isModification){
            // Se comienza a crear la orden por cada producto
            for(var key in order.products){
                
                /*
                let lastOrderKg = lastOrder.products[key]?.kg ?? 0;
                let lastOrderKgTotal = lastOrder.products[key]?.kgTotal ?? 0;
                let lastOrderKgDifferential = lastOrder.products[key]?.kgDifferential ?? 0;
                 */
                
                let lastOrderKg = lastOrder.products[key] ? lastOrder.products[key].kg : 0;
                let lastOrderKgTotal = lastOrder.products[key] ? lastOrder.products[key].kgTotal : 0;
                let lastOrderKgDifferential = lastOrder.products[key] ? lastOrder.products[key].kgDifferential : 0;
                let lastOrderInventory = lastOrder.products[key] ? lastOrder.products[key].inventory : 0;

                // Se almacena el id y la cantidad de cada producto
                order.products[key].kg = lastOrderKg;
                order.products[key].kgDifferential = order.products[key].kgTotal + lastOrderKgDifferential;
                order.products[key].kgTotal = lastOrderKg + order.products[key].kgTotal;
                order.products[key].wasModified = !!(order.products[key].kgTotal-lastOrderKgTotal);
                // Mantener el inventario de la orden anterior (o usar el nuevo si viene en orderParam)
                if (orderParam.order.inventory) {
                    // Obtener el código del producto para buscarlo en el inventario
                    const product = productList.find(item => item._id.toString() === order.products[key].product.toString());
                    if (product && orderParam.order.inventory[product.code] !== undefined) {
                        order.products[key].inventory = parseFloat(orderParam.order.inventory[product.code]);
                    } else {
                        order.products[key].inventory = lastOrderInventory;
                    }
                } else {
                    order.products[key].inventory = lastOrderInventory;
                }
                
                /*
                order.products[key].kg = lastOrder.products[key].kg;
                order.products[key].kgDifferential = order.products[key].kgTotal + lastOrder.products[key].kgDifferential;
                order.products[key].kgTotal = lastOrder.products[key].kg + order.products[key].kgTotal,
                order.products[key].wasModified = !!(order.products[key].kgTotal-lastOrder.products[key].kgTotal);
                */
            }
        }
        
        let newOrder = new OrderMiscellaneus(order)

        let newOrderSaved = await newOrder.save();

        
        // Se almacenan los datos en su respectiva posicion del inventario
        let inventory = await Inventory.find({ agency: user.agency }).populate('product');
        
        for (let inventoryProduct of inventory) {
            
            if (!inventoryProduct.product) continue;    // Ya que hay productos que este parámetro es null
            
            const productId = inventoryProduct.product._id;

            // Se busca el producto del inventario, en la lista de productos de la orden
            const product = order.products.find(item => item.product.toString() === productId.toString())
            
            if (!product) continue;

            if (order.isModification){
                Object.assign(inventoryProduct, { 
                    modification: product.kgDifferential,
                    modificationWasConfirmed: false
                });
            }
            else{
                Object.assign(inventoryProduct, { 
                    order: product.kg,
                    orderWasConfirmed: false
                });
            }

            await inventoryProduct.save();
        }

        // Enviar webhook al backend de fábrica
        try {
            // Obtener datos poblados de la orden para el webhook
            const orderWithPopulated = await OrderMiscellaneus.findById(newOrderSaved._id)
                .populate('agency', 'name')
                .populate('user', 'username firstName lastName')
                .lean();

            // Preparar productos para el webhook (con información del producto)
            const productsForWebhook = [];
            for (const orderProduct of orderWithPopulated.products) {
                const product = await Miscellaneous.findById(orderProduct.product).lean();
                if (product) {
                    productsForWebhook.push({
                        productId: product._id.toString(),
                        productCode: product.code,
                        productName: product.name,
                        kg: orderProduct.kg,
                        kgDifferential: orderProduct.kgDifferential,
                        kgTotal: orderProduct.kgTotal,
                        wasModified: orderProduct.wasModified || false,
                        pz: orderProduct.pz || 0,
                        inventory: orderProduct.inventory || 0
                    });
                }
            }

            const webhookData = {
                orderId: newOrderSaved._id.toString(),
                agencyId: orderWithPopulated.agency?._id?.toString() || orderWithPopulated.agency?.toString(),
                agencyName: orderWithPopulated.agency?.name || '',
                userId: orderWithPopulated.user?._id?.toString() || orderWithPopulated.user?.toString(),
                userName: orderWithPopulated.user ? 
                    `${orderWithPopulated.user.firstName || ''} ${orderWithPopulated.user.lastName || ''}`.trim() || orderWithPopulated.user.username : 
                    '',
                username: orderWithPopulated.user?.username || orderParam.user?.name || '',
                products: productsForWebhook,
                comment: orderWithPopulated.comment || '',
                isModification: orderWithPopulated.isModification || false,
                wasConfirmed: orderWithPopulated.wasConfirmed || false,
                wasModified: orderWithPopulated.wasModified || false,
                order: orderWithPopulated.order,
                createdDate: orderWithPopulated.createdDate,
                updatedDate: orderWithPopulated.updatedDate,
                action: 'created'
            };

            const webhookResult = await webhook.sendOrderMiscellaneousUpdate(webhookData);

            if (webhookResult) {
                console.log('[ORDER_MISCELLANEOUS][WEBHOOK] Webhook enviado exitosamente');
                console.log('[ORDER_MISCELLANEOUS][WEBHOOK] Respuesta de fábrica:', JSON.stringify(webhookResult, null, 2));
            } else {
                console.warn('[ORDER_MISCELLANEOUS][WEBHOOK] Webhook retornó null/undefined - puede que no se haya enviado');
            }
        } catch (webhookError) {
            console.error('[ORDER_MISCELLANEOUS][WEBHOOK] Error al enviar webhook:', webhookError?.message || webhookError);
            // No lanzar error para que la creación de la orden no falle si el webhook falla
        }

        return newOrderSaved;
    },

    /**
     * Función para actualizar ventas
     * 
     * @param {id} id de venta 
     * @param {params} orderParam
     */
    update: async (id, orderParam) => {

        

        // Unicamente podrán utilizarlo los administradores y los del departamento de cobranza
        if ((orderParam.user.role !== role.rol.Admin)  && (orderParam.user.role !== role.rol.Supervisor) && (orderParam.user.role !== role.rol.AuditorFinanciero)){
            throw('El usuario no está autorizado para realizar confirmaciones')
        }
        
        // Se obtiene la orden que se va a confirmar
        let orderToConfirm = await OrderMiscellaneus.findById(id);

        if (!orderToConfirm){
            throw('La orden NO existe. RECARGAR LA PÁGINA')
        }

        if (orderToConfirm.wasConfirmed){
            throw('La orden ya ha sido confirmada')
        }

        // Si existe orderParam.order, significa se realizó una modificacion a la orden
        if (orderParam.order){

            // Se procede a modificar los productos de la orden original creando una nueva orden pero con los datos correctos

            let originalOrder = await OrderMiscellaneus.findById(id);

            let newOrderParams = {
                user: {
                    id: originalOrder.user,
                    agency: originalOrder.agency
                },
                order: {
                    // No importa que ambos arreglos sean los mismos porque finalmente se va a agarrar dependiendo de la orden anterior 
                    product: orderParam.order.product,
                    productModification: orderParam.order.productModification,
                    comment: originalOrder.comment,
                    inventory: orderParam.order.inventory || {},  // Se pasa para que cada producto pueda obtener su inventario

                    isModification: true    // Sirve al momento de confirmar anexos
                }
            }

            let newOrder = await orderMiscellaneousService.create(newOrderParams);

            // La nueva orden creada, será la nueva orden a confirmar
            id = newOrder._id;

            orderToConfirm = await OrderMiscellaneus.findById(id);
        }

        // Se realiza la confirmación de la orden agregandole los datos como que fué confirmada, asi como el usuario y fecha de confirmacipon 
        let changes = {
            wasConfirmed: true,
            confirmationUser: orderParam.user.id,
            updatedDate: moment().utc().subtract(4, 'hours'),
        }

        Object.assign(orderToConfirm, changes)

        await orderToConfirm.save();


        // Si es una modificacion de algun pedido, se le debe anexar al pedido original
        if (orderToConfirm.isModification){
                
            // Se busca la ultima ORDEN del dia, o del dia anterior

            // Se obtiene la hora actual para de esta manera poder hacer las respectivas limitaciones por hora
            let currentDate = new Date(moment().utc().subtract(4, 'hours'));

            // Se fija la hora de corte para los pedidos
            var limitTime = moment('08:00am', 'h:mma').utc().subtract(4, 'hours');

            let startDate = (moment(currentDate).isAfter(limitTime)) ? limitTime : moment(limitTime).subtract(1, 'days');
            let endDate = (moment(currentDate).isAfter(limitTime)) ? moment(limitTime).add(1, 'days') : limitTime;
                    
            // Se buscan entonces los pedidos que se van a anexar
            const query = {
                createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)},
                agency: orderToConfirm.agency
            }
                    
            // Se busca la primera orden del dia
            let originalOrder = await OrderMiscellaneus.findOne(query).sort({createdDate: 1});

            // Se busca la ultima orden que corresponde con la modificacion
            let modificationOrder = await OrderMiscellaneus.findById(id).lean();
            
            let changes = {
                wasModified: true,
                products:  modificationOrder.products,
            }

            // Se asignan los nuevos datos a la orden original
            Object.assign(originalOrder, changes);

            await originalOrder.save();
        }

        
        // Se almacenan los datos en su respectiva posicion del inventario
        let inventory = await Inventory.find({ agency: orderToConfirm.agency }).populate('product');
        
        for (let inventoryProduct of inventory) {

            if (!inventoryProduct.product) continue;
            
            const productId = inventoryProduct.product._id;

            // Se busca el producto del inventario, en la lista de productos de la orden
            const product = orderToConfirm.products.find(item => item.product.toString() === productId.toString())
            
            if (!product) continue;

            if (orderToConfirm.isModification){
                Object.assign(inventoryProduct, { 
                    modification: product.kgDifferential,
                    modificationWasConfirmed: true
                });
            }
            else{
                Object.assign(inventoryProduct, { 
                    order: product.kg,
                    orderWasConfirmed: true
                });
            }

            await inventoryProduct.save();
        }

        return
    },

    /**
     * Función para obtener
     * 
     * @param {id} id de venta 
     */
    getOrder: async (id) => {
        const sale = await Sales.findById(id);

        // Validar
        if (!sale) throw 'venta no encontrada';

        return sale;
    },

    /**
     * Funcion para obtener las ventas con paginación y filtros
     * 
     * Filtra por rol de usuario y sucursal 
     */
    orderTable: async (orderParam) => {

        // resultados por página
        const pageSize = orderParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = orderParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(orderParam.sortBy){
            let direction = orderParam.sortBy.desc == true ? -1 : 1
            sortBy = { [orderParam.sortBy.id] : direction } 
        }

        //stage o query principal
        const stages = [ 
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            // NOTA: confirmationUser ahora es un string plano en el modelo (nombre del usuario que confirmó),
            // por lo que NO se debe hacer lookup contra la colección de users,
            // ya que se perdería el valor original al intentar hacer match con _id.
            //total de punto de venta
            { $unwind: '$agency' },
            { $unwind: '$user' },
            // Se obtienen los datos de los productos
            { $lookup: {
                from: "miscellaneous",
                localField: "products.product",
                foreignField: "_id",
                as: "productList",
                },
            },
            {   $set: {
                'products': {
                    $map: {
                    'input': '$products', 
                    'in': {
                        $mergeObjects: [
                        '$$this', {
                            'product': {
                            $arrayElemAt: [
                                '$productList', {
                                $indexOfArray: [
                                    '$productList._id', '$$this.product'
                                ]
                                }
                            ]
                            }
                        }
                        ]
                    }
                    }
                }
                }
            },
            {
            $project: {
                productList: 0,
            }
            },
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } }
        ];
      

        //Si es admin o supervisor ve todos las sucursales y usuarios

        //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
        if(orderParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(orderParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (orderParam.filters) {

            //Si hay filtro de sucursal
            if(orderParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(orderParam.filters.agency) } },
                );
            }

            // Por defecto no se mostrarán los anexos que ya fueron confirmados
            if(!orderParam.filters.showConfirmedModifications){
                stages.unshift(
                    { $match: { $or: [ { isModification: { $eq: false, }}, { wasConfirmed: { $eq: false }}]}}
                );
            }

            if(orderParam.filters.startDate && !orderParam.filters.endDate){
                const startDate =  moment(orderParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!orderParam.filters.startDate && orderParam.filters.endDate){
                const endDate =  moment(orderParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }
 
            if(orderParam.filters.startDate && orderParam.filters.endDate){
                
                const startDate = moment(orderParam.filters.startDate).utc().startOf('day')
                const endDate = moment(orderParam.filters.endDate).utc().endOf('day')

                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
            
            if(orderParam.filters.startDate && orderParam.filters.endDate){
                const startDate =  moment(orderParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(orderParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

         //Si todos los filtros son vacios se consulta la fecha actual
        if( !orderParam.filters.startDate && !orderParam.filters.endDate){
            
            const startDate = moment().utc().subtract(4, 'hours').startOf('day')
            const endDate = moment().utc().subtract(4, 'hours').endOf('day')

            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const order = await OrderMiscellaneus.aggregate(stages);


        // Se procede a crear la data mezclada

        let array = order[0].data

        // Se obtiene la lista de todos los productos
        const productList = await Miscellaneous.find().lean();

        // Se comienza a crear la orden por cada producto
        let resultsTotalProducts = productList.map((item) => {

            let newProduct = { 
                product: item,
                kg: 0,
                kgDifferential: 0,     // Diferencial de la modificación
                kgTotal: 0,            // Los kg del primer pedido, más el diferencial de las modificaciones
            
            };
            
            for(var key in array){
                
                // No aplicará para las modificaciones
                if (array[key].isModification){
                    continue;
                }

                // No aplicará para las órdenes que no han sido confirmadas
                if (!array[key].isModification && !array[key].wasConfirmed){
                    continue;
                }

                let productToMatch = array[key].products.find( item2 => item2.product.code === item.code);
    
                if (!productToMatch){
                    continue;
                }

                newProduct.kg += productToMatch.kg;
                newProduct.kgDifferential += productToMatch.kgDifferential;
                newProduct.kgTotal += productToMatch.kgTotal;
    
            }

            return newProduct;
        })

        // Se filtran del arreglo creado, los productos cuyos codigos no son números y se ordenan de manera descendente
        const isNumber = (string) => {
            return /^\d+$/.test(string);
        }
        const filteredArray = resultsTotalProducts.filter(item => { return isNumber(item.product.code) }).sort((itemA, itemB) => (itemA.product.code - itemB.product.code));

        
        let resultsTotal = [
            {
                products: filteredArray,
                createdDate: array.length === 0 ? moment().utc() : order[0].data[0].createdDate
            }
        ];

        return {
            results: order[0].data, 
            resultsTotal,   
            metadata: order[0].metadata,
        }
    },

    
    getOrderHelper: async () => {

        return await OrderMiscellaneousHelper.find().lean();
    },

    setOrderHelper: async (orderParam) => {

        // Inicialmente se busca si ya hay un registro de esa sucursal para eliminarlo antes de crear uno nuevo
        let existingRegister = await OrderMiscellaneousHelper.findOne({ agency: orderParam.agency }).lean();

        if (existingRegister){
            await OrderMiscellaneousHelper.findByIdAndDelete(existingRegister._id);
        }
        
        let orderProducts = orderParam.products;

        const productList = await Miscellaneous.find().lean();

        // Se comienza a crear la orden
        let orderHelper = {
            products: [],
            agency: orderParam.agency,
            user: orderParam.user.id,
            orderType: orderParam.orderType,
        };
        
        // Se comienza a crear cada producto
        for(var key in orderProducts){

            let productToMatch = productList.find( item => item.code === key);

            if (!productToMatch || (orderProducts[key] === null)){
                continue;
            }

            // Se almacena el id y la cantidad de cada producto
            let productOrder = { 
                product: productToMatch._id,
                quantity: parseFloat(orderProducts[key].toString().replace(/,/g, '')),
            }

            orderHelper.products.push(productOrder)
        }

        let newOrderHelper = new OrderMiscellaneousHelper(orderHelper);

        let newOrderHelperSaved = await newOrderHelper.save();

        // Ahora se relaciona estos datos con la agencia
        let relatedAgency = await Agency.findById(orderParam.agency);

        Object.assign(relatedAgency, {orderHelper: newOrderHelperSaved._id} );

        await relatedAgency.save();


        // Se almacenan los datos en su respectiva posicion del inventario
        let inventory = await Inventory.find({ agency: orderParam.agency }).populate('product');

        
        for (let inventoryProduct of inventory) {

            let productCode = inventoryProduct.product.code

            Object.assign(inventoryProduct, {minimumStock: orderProducts[productCode]});

            await inventoryProduct.save();
        }

        return
    }
}

module.exports = orderMiscellaneousService;