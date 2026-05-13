const db = require('../_helpers/db');
const Inventory = db.Inventory;
const InventoryRecord = db.InventoryRecord;
const InventoryReport = db.InventoryReport;
const Product = db.Product;
const ProductRecord = db.ProductRecord;
const OfferRecord = db.OfferRecord;
const Agency = db.Agency;
const AdjustmentRecord = db.AdjustmentRecord;
const Sales = db.Sales;
const PendingPayments = db.PendingPayments;
const enumOut = require('../enums/typeOut.enum'); 
const enumIn = require('../enums/typeIn.enum'); 
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const cutOut = require('../enums/cutout.enum');
const moment = require('moment');
const role = require('../enums/roles.enum');
const e = require('express');

let inventoryService = {

    /**
     * Función para registrar inventario
     * 
     * @param {params} inventoryParam 
     */
    create: async (inventoryParam) => {
       
        //Recorrer productos
        for (let item of inventoryParam.products) {


            let product = await Inventory.findOne({ product:item.id, agency:inventoryParam.agency });

            //Si existe el producto en inventario se modifica
            if(product){
    
                //lo que esta actualmente en kg mas los kg entrantes
                let total = parseFloat(item.kg) + parseFloat(product.kg);
                
                //registrar la entrada en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = inventoryParam.agency;
                inventoryRecordParam.kg = product.kg.toFixed(3);//arrastrar kg anterior
                inventoryRecordParam.in = item.kg.toFixed(3)//kgs entrantes
                inventoryRecordParam.total = total.toFixed(3);
                inventoryRecordParam.note = inventoryParam.note;
                inventoryRecordParam.comment = inventoryParam.comment;
                inventoryRecordParam.typeIn = enumIn.in[inventoryParam.typeIn];
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();
    
                if(!recordSaved){
                    throw 'Error registrando el inventario';  
                }
    
                //Actualizar kgs en inventario
                Object.assign(product, { kg:total });
                await product.save(); 
    
            //Si no existe el producto en inventario se inserta
            }else{
               
                let newProd = {};

                newProd.product = item.id;
                newProd.agency = inventoryParam.agency;
                newProd.kg = item.kg;
                const inventory = new Inventory(newProd);
                const inventorySaved = await inventory.save();
                if(!inventorySaved){
                    throw 'Error registrando el inventario';  
                }
    
                //registrar la entrada en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = inventoryParam.agency;
                inventoryRecordParam.kg = 0;//
                inventoryRecordParam.in = item.kg.toFixed(3)//kgs entrantes
                inventoryRecordParam.total = item.kg.toFixed(3);//Total el mismo
                inventoryRecordParam.note = inventoryParam.note;
                inventoryRecordParam.comment = inventoryParam.comment;
                inventoryRecordParam.isInit = true; //true ya que es el inventario inicial
                if (inventoryParam.typeIn != null && inventoryParam.typeIn !== '') {
                    inventoryRecordParam.typeIn = enumIn.in[inventoryParam.typeIn];
                }
                const record = new InventoryRecord(inventoryRecordParam);
                const recordSaved = await record.save();
    
                if(!recordSaved){
                    throw 'Error registrando el inventario';  
                }
    
            }
        }   

    },

    /**
     * Función para actualizar inventario 'reweigh'
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
        inventoryRecordParam.out = parseFloat(inventorykg)-parseFloat(inventoryParam.kg)//salida es la diferencia
        inventoryRecordParam.total = parseFloat(inventoryParam.kg).toFixed(3);//Total
        inventoryRecordParam.note = " ";
        inventoryRecordParam.type = enumOut.out.reweigh;
        const record = new InventoryRecord(inventoryRecordParam);
        const recordSaved = await record.save();

        if(!recordSaved){
            throw 'Error registrando el inventario';  
        }
    },

    /**
     * Función para actualizar inventario 'readjustment'
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
     * Función para actualizar inventario 'reset'
     * Coloca el inventario en 0
     * 
     * @param {id} id de inventario 
     * @param {params} inventoryParam
     */
    resetInventory: async (id, inventoryParam) => {

        const inventory = await Inventory.findById(id);

        // Validar
        if (!inventory) throw 'inventario no encontrado';

        let inventorykg = inventory.kg;
        
        // resetear tabla inventory a 0 
        Object.assign(inventory, {kg:0});
        await inventory.save();

        //registrar total en 0 en el historial
        let inventoryRecordParam = {}
        inventoryRecordParam.product = inventory.product;
        inventoryRecordParam.agency = inventory.agency;
        inventoryRecordParam.kg = inventorykg;// lo anterior
        inventoryRecordParam.in = 0//kgs entrantes
        inventoryRecordParam.out = 0//salida
        inventoryRecordParam.total = 0;//Total
        inventoryRecordParam.note = " ";
        inventoryRecordParam.type = enumOut.out.reset;
        inventoryRecordParam.comment = "Restaurar producto por "+inventoryParam.user;
        const record = new InventoryRecord(inventoryRecordParam);
        const recordSaved = await record.save();

        if(!recordSaved){
            throw 'Error registrando el inventario';  
        }
    },

    /**
     * Función para obtener
     * 
     * @param {id} id de inventario 
     */
    getInventory: async (id) => {
        const inventory = await Inventory.findById(id).populate('product','name price').populate('agency','name');

        // Validar
        if (!inventory) throw 'inventario no encontrado';

        return inventory;
    },

    /**
     * Funcion para obtener todos los inventario
     */
    getAll: async () => {
        return await Inventory.find().sort({name: 'asc'});
    },

    //Inventario actual
    dataTable: async (inventoryParam) => {
        if (!inventoryParam || !inventoryParam.user) {
            throw new Error('No se recibió información del usuario. Debe iniciar sesión de nuevo.');
        }

        let stages = [ 
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product'} },
            { $unwind: '$product' },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'}},
            { $unwind: '$agency'},
            { $project: {
                id:"$_id", 
                _id:0,//excluir 0 _id
                // 1 incluir
                agency: 1,
                product: 1,
                physical: 1,
                minimumStock: 1,
                order: 1,
                orderWasConfirmed: 1,
                modification: 1,
                modificationWasConfirmed: 1,
                kg: { $round: [ "$kg", 3 ] },//Round valor de kg para excel
                createdDate: 1,
                updatedDate: 1
            }}
        ]

        //Si el rol es Cajero, solo su sucursal

        //  El Gerente podrá ver todos los inventarios, pero únicamente podrá modificar los suyos 

        if((inventoryParam.user.role == role.rol.Cashier)){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
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
        const order = await db.Order.findOne(query)


        // Se busca el ultimo ANEXO del dia, o del dia anterior
        query.isModification = true;

        const modification = await db.Order.findOne(query).sort({createdDate: -1})

        return {
            results: inventories, 
            order,
            modification
        }
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
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id] : direction } 
            
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        let stages = []
        let stageTotal = []

        //  Filtrar por Detal, Mayor o Crédito
        if(inventoryParam.filters.searchType){

            if(inventoryParam.filters.searchType === "wholesale"){
                stages.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isWholesale": true, "isCredit": false  } },
                );
                stageTotal.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isWholesale": true, "isCredit": false    } },
                );
            }
            else if (inventoryParam.filters.searchType === "credit"){
                stages.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isCredit": true  } },
                );
                stageTotal.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isCredit": true  } },
                );
            }
            else if (inventoryParam.filters.searchType === "combo"){
                stages.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isCombo": true  } },
                );
                stageTotal.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isCombo": true  } },
                );
            }
            else{
                stages.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isWholesale": false} },
                );
                stageTotal.unshift(
                    { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isWholesale": false} },
                );
            }
        }
        else{
            stages.unshift(
                { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }} },
            );
            stageTotal.unshift(
                { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }} },
            );
        }
        //agrupar por fecha, producto, agencia y donde existan salidas "out" y sea de tipo sale o venta

        stages.push(            
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product'} },
            { $unwind: '$product' },
            { $group : {
                    _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" }}},
                    totalOutAmount: { $sum: "$out" },
                    totalCash : { $sum : {  $multiply : ["$price", "$out"] } },
                    product: { $first: '$product' },
                    createdDate: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                    agency: { $first: '$agency' }
                }
            },
            { $match : { "product.code": productCode }},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'}},
            { $unwind: '$agency'},
            { $sort : sortBy }
        );

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //stage del total 
        stageTotal.push( 
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product'} },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $group : 
                { 
                    _id: null, 
                    totalAmount: { $sum: {  $multiply : ["$price", "$out"] } }, 
                    totalKg: { $sum: "$out" } 
                } 
            } 
        );

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
            stageTotal.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
               
               stages.unshift(
                   { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
               );
               stageTotal.unshift(
                   { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
               );
           }

           //Si hay filtro de tipo de salida
           if(inventoryParam.filters.type){
               
               stages.unshift(
                   { $match : { type: parseInt(inventoryParam.filters.type) } },
               );
               stageTotal.unshift(
                   { $match : { type: parseInt(inventoryParam.filters.type) } },
               );
           }

           //filtro por nombres
           if(inventoryParam.filters.names){
               let regex = new RegExp(inventoryParam.filters.names,'gi');
               stages.unshift(
                   { $match: { names: { $regex: regex } } },
               );
               stageTotal.unshift(
                   { $match: { names: { $regex: regex } } },
               );
           }

           //filtro por teléfono
           if(inventoryParam.filters.phone){
               let regex = new RegExp(inventoryParam.filters.phone,'gi');
               stages.unshift(
                   { $match: { phone: { $regex: regex } } },
               );
               stageTotal.unshift(
                   { $match: { phone: { $regex: regex } } },
               );
           }

           //filtro por comentario
           if(inventoryParam.filters.comment){
               let regex = new RegExp(inventoryParam.filters.comment,'gi');
               stages.unshift(
                   { $match: { comment: { $regex: regex } } },
               );
               stageTotal.unshift(
                   { $match: { comment: { $regex: regex } } },
               );
           }

           if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
               const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
               stages.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate) } } },
               );
               stageTotal.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate) } } },
               );
           }

           if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
               const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
               stages.unshift(
                   { $match: { createdDate: { $lte: new Date(endDate) } } },
               );
               stageTotal.unshift(
                   { $match: { createdDate: { $lte: new Date(endDate) } } },
               );
           }

           if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
               const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
               const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
               stages.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
               );
               stageTotal.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
               );
           }

       }

       //Si todos los filtros son vacios se consulta la fecha actual
       if(!inventoryParam.filters.code && !inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
           const startDate =  moment().startOf('day');
           const endDate =  moment().endOf('day');
           stages.unshift(
               { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
           );
           stageTotal.unshift(
               { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
           );
       }

       const inventories = await InventoryRecord.aggregate(stages);

       let total = [];
       
       if(!inventoryParam.isExcel){

           //Sumar total si las fechas se definieron o si es el día actual
           if((inventoryParam.filters.startDate && inventoryParam.filters.endDate) || (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate)){
               //Total del resultado
               total = await InventoryRecord.aggregate(stageTotal);
           }
           
       }

       return {
           results: !inventoryParam.isExcel ? inventories[0].data: inventories, 
           metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
           total
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
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){
            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id] : direction } 
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        let stages = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.searchType){

                if(inventoryParam.filters.searchType === "wholesale"){
                    stages.unshift(
                        { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isWholesale": true, "isCredit": false  } },
                    );
                }
                else if (inventoryParam.filters.searchType === "credit"){
                    stages.unshift(
                        { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isCredit": true  } },
                    );
                }
                else if (inventoryParam.filters.searchType === "combo"){
                    stages.unshift(
                        { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isCombo": true  } },
                    );
                }
                else if (inventoryParam.filters.searchType === "cut"){
                    stages.unshift(
                        { $match : {"type": { $eq:enumOut.out.cutout }} },
                    );
                }
                else{
                    stages.unshift(
                        { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale }, "isWholesale": false} },
                    );
                }
            }

        }

        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const inventories = await InventoryRecord.aggregate(stages);

        return {
            results: !inventoryParam.isExcel ? inventories[0].data: inventories, 
            metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
        }
    },

    /**
     * Funcion para redirigir de donde obtener el reporte de inventario, si de la base de datos, o habrá que calcularlo
     *
     */

    getInventoryReport: async (inventoryParam) => {

        // Si se pide del mismo dia o un rango que lo incluya, se deberá entonces calcular de la manera normal
       
        // En caso de que se pidan los datos del mismo dia
        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
           return await inventoryService.dataTableInventoryReport(inventoryParam);
        }
        
        //Filtros para la consulta
        if (inventoryParam.filters) {

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
       
                throw('ERROR. Debe colocar una fecha límite inferior')
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){

                return await inventoryService.dataTableInventoryReport(inventoryParam);
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){

                let currentDate = moment().utc().subtract(4 , 'hours')

                let startDate = moment(inventoryParam.filters.startDate).utc().subtract(4 , 'hours').startOf('days');
                let endDate = moment(inventoryParam.filters.endDate).utc().subtract(4 , 'hours').endOf('days');

                // Si el rango de dias incluye el dia actual, se calcula normalmente, de lo contrario se obtiene todo de la base de datos
                if (moment(currentDate).isSame(startDate, 'day') || moment(currentDate).isSame(endDate, 'day') || moment(currentDate).isBetween(startDate, endDate, 'day')){

                    return await inventoryService.dataTableInventoryReport(inventoryParam);
                }
                else{
                    
                    let data = await inventoryService.dataTableInventoryReportSaved(inventoryParam);

                    // En caso de que haya data, se envía, y de lo contrario se calcula de la manera normal

                    if (data.results.length > 0){
                        return data
                    }
                    else{

                        // Se creará nueva data unicamente para los casos en lo que la fecha inicial de búsqueda sea igual a la final
                        if (moment(startDate).isSame(endDate, 'day')){

                            // Si hay filtro por agencia, se verifica que esa agencia esté activa, es decir, que exista un historial de inventario para ese dia
                            if (inventoryParam.filters.agency){
                                let historyData = await inventoryService.dataTableHistory(inventoryParam);

                                if (historyData.results.length === 0){
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
    
                            if (dataTable.results.length > 0){
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
                            else{
                                
                                // Si directamente no hay data en InventoryRecord, no se va a guardar nada y va a haber un loop infinito por lo que en este caso se calcula de manera normal
                                return await inventoryService.dataTableInventoryReport(inventoryParam);
                            }
                        }
                        else{
                            return await inventoryService.dataTableInventoryReport(inventoryParam);
                        }
                    }
                }
            }  
        }  
    },

    /**
     * Resumen de inventario por sucursal/compañía al cierre del día.
     * Devuelve, por sucursal, el nombre de la sucursal, la compañía,
     * el inventario total en kg (TotalQuantity) y el inventario total en $ (TotalAmount)
     * usando la misma lógica de cálculo que getInventoryReport/dataTableInventoryReport.
     *
     * Espera los mismos filtros que getInventoryReport. Si no se envían fechas,
     * utiliza el comportamiento por defecto (día actual) de getInventoryReport.
     */
    getDailyInventorySummaryByAgency: async (inventoryParam) => {

        // Forzar isExcel para obtener todos los registros sin paginación
        const params = Object.assign({}, inventoryParam, {
            pageSize: inventoryParam.pageSize || 1000000,
            pageIndex: inventoryParam.pageIndex || 1,
            isExcel: true,
        });

        // Usamos getInventoryReport para respetar toda la lógica de fechas (día actual vs histórico)
        const report = await inventoryService.getInventoryReport(params);

        const summaryByAgency = {};

        // Regex de compañía si viene en los filtros, pero solo lo aplicamos aquí,
        // sin afectar el comportamiento de getInventoryReport en otros usos.
        let companyRegex = null;
        if (inventoryParam.filters && inventoryParam.filters.company) {
            companyRegex = new RegExp(inventoryParam.filters.company, 'i');
        }

        (report.results || []).forEach((item) => {

            if (!item.agency) {
                return;
            }

            // Si se envió company, filtrar por el nombre de compañía de la agencia
            if (companyRegex && (!item.agency.company || !companyRegex.test(item.agency.company))) {
                return;
            }

            const agencyId = (item.agency._id ? item.agency._id : item.agency).toString();

            if (!summaryByAgency[agencyId]) {
                summaryByAgency[agencyId] = {
                    agencyId: item.agency._id || item.agency,
                    agencyName: item.agency.name || '',
                    company: item.agency.company || '',
                    totalKg: 0,
                    totalAmount: 0,
                    totalPhysicalAmount: 0,
                };
            }

            const totalQty = typeof item.TotalQuantity === 'number' ? item.TotalQuantity : 0;
            const totalAmt = typeof item.TotalAmount === 'number' ? item.TotalAmount : 0;
            const physicalAmt = typeof item.physicalAmount === 'number' ? item.physicalAmount : 0;

            summaryByAgency[agencyId].totalKg += totalQty;
            summaryByAgency[agencyId].totalAmount += totalAmt;
            summaryByAgency[agencyId].totalPhysicalAmount += physicalAmt;
        });

        const results = Object.values(summaryByAgency).map((agencySummary) => ({
            ...agencySummary,
            totalDifference: agencySummary.totalAmount - agencySummary.totalPhysicalAmount,
        }));

        // Totales globales para pintar en el footer del front
        const totals = results.reduce((acc, item) => {
            acc.totalKg += item.totalKg || 0;
            acc.totalAmount += item.totalAmount || 0;
            acc.totalPhysicalAmount += item.totalPhysicalAmount || 0;
            acc.totalDifference += item.totalDifference || 0;
            return acc;
        }, {
            totalKg: 0,
            totalAmount: 0,
            totalPhysicalAmount: 0,
            totalDifference: 0,
        });

        return {
            results,
            totals,
        };
    },

    /**
     * Reporte de inventarios (calculado)
     */
    dataTableInventoryReport: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex; 

        //orden por defecto
        var sortBy = { "_id.createdDate" : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1

            if(inventoryParam.sortBy.id == "date"){
                sortBy = { "_id.createdDate" : direction } 
            }else{
                sortBy = { [inventoryParam.sortBy.id] : direction } 
            }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        //agrupar por fecha, producto, agencia
        //Sacar total en ventas, entradas, salidas por merma, repesaje, degustación y empaques
        let stages = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $group : {
                    _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                    totalOutAmount: { $sum: "$out" },
                    totalSell: { $sum: { $cond: [{ $eq: ["$type", enumOut.out.sale] }, "$out", 0] } },
                    //total entradas sin el inicial
                    totalIn: {$sum: { $cond: [ {$and : [ { $eq: [ "$type", 0] },//solo compras 
                                { $eq: [ "$isInit",false] }//sin inicial
                    ]},"$in", 0 ]}},
                    //total por ventas al mayor
                    totalWholesales: { $sum: { $cond: [ {$and : [ { $eq: ["$type", enumOut.out.sale] },{ $eq: ["$isWholesale", true] }, 
                    ]}, "$out", 0] }},
                    //diferencial total por ventas al mayor
                    totalWholesaleDifferential: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$differential", 0] }},
                    //diferencial total por descuento en ventas al mayor
                    totalWholesaleDiscountDifferential: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$wholesaleDiscountDifferential", 0] }},
                    //diferencial total por ventas al mayor
                    totalInCredit: { $sum: { $cond: [{ $eq: ["$isCredit", true] }, "$out", 0] } },
                    //diferencial total por ventas al mayor
                    totalInCreditDifferential: { $sum: { $cond: [ { $eq: ["$isCredit", true] }, "$differential", 0] }},
                    //diferencial total por ventas al mayor
                    totalComboDifferential: { $sum: { $cond: [ { $eq: ["$isCombo", true] }, "$differential", 0] }},
                    //total salidas de mermas
                    totalDecrease: { $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh, enumOut.out.decrease, enumOut.out.mincemeat ]] }, "$out", 0] }},
                    //Merma por empaque
                    totalPacking: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.decrease ]] }, "$out", 0] }
                    },
                    //Merma por humedad
                    totalReweigh: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh ]] }, "$out", 0] }
                    },
                    //Merma por picadillo
                    totalMincemeat: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.mincemeat ]] }, "$out", 0] }
                    },
                    //total salidas por  degustación, empaques, donación, vales, correcciones, traslados, traslados de tienda y recortes
                    totalOut: { $sum: { $cond: [{ $in: ["$type", [ enumOut.out.packaging,  enumOut.out.tasting, enumOut.out.donation
                        , enumOut.out.coupon, enumOut.out.correction, enumOut.out.transfer, enumOut.out.transferToFatt ]] }, "$out", 0] }
                    },
                    //total donacion
                    totalDonation: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.donation ]] }, "$out", 0] }
                    },
                    //total degustacion
                    totalTasting: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.tasting ]] }, "$out", 0] }
                    },
                    //total empaques
                    totalPackaging: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.packaging ]] }, "$out", 0] }
                    },
                    //total vale
                    totalCoupon: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.coupon ]] }, "$out", 0] }
                    },
                    //total correccion
                    totalCorrection: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.correction ]] }, "$out", 0] }
                    },
                    //total tralsado
                    totalTransfer: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.transfer ]] }, "$out", 0] }
                    },
                    //total tralsado a fatt
                    totalTransferToFatt: { $sum: { $cond: [{ $in: ["$type", [ enumOut.out.transferToFatt ]] }, "$out", 0] } },
                    //total salidas por  degustación, empaques, donación, vales, correcciones, traslados y recortes
                    totalOut: { $sum: { $cond: [{ $in: ["$type", [ enumOut.out.packaging,  enumOut.out.tasting, enumOut.out.donation
                        , enumOut.out.coupon, enumOut.out.correction, enumOut.out.transfer, enumOut.out.transferToFatt ]] }, "$out", 0] }
                    },
                    //Total de recorte
                    totalCut: { $sum: "$cut" },
                    product: { $first: '$product' },
                    date: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                    agency: { $first: '$agency' }
                }
            }, 
            { $sort : sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryRecord.aggregate(stages);

        let DataResult = inventories;

        if(!inventoryParam.isExcel){
            DataResult = inventories[0].data;
        }

        //Buscar inventario inicial por producto 
        await Promise.all(DataResult.map(async (inventory) => {

            // console.log("inventory.date:", inventory);

            try {

                const endDate =  moment(inventory.date).subtract(1, 'days').endOf('day');
                // console.log("endDate:", endDate.toISOString())
                //1. Consultar ultima operacion del dia anterior
                const dataDayBefore = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $lte: new Date(endDate)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                // console.log("Última operación del día anterior (dataDayBefore):", dataDayBefore);

                //Fecha del registro: inicio y fin del dia
                const dayStart = moment(inventory.date).utc().startOf('day');
                const dayEnd = moment(inventory.date).utc().endOf('day');
            
                //TotalQuantity: Consultar ultima operacion registrada para obtener el total
                //Y que no sea inventario fisico : 14
                let totalArithmetic = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id,
                    type: { $ne: enumOut.out.adjustment },//sin ajuste
                    createdDate:{ $gte: new Date(dayStart), $lte: new Date(dayEnd)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                // console.log("Última operación registrada (sin ajustes):", totalArithmetic);

                //Si no hay total aritmetico el dia actual tomo el del dia anterior no importa si es de tipo ajuste  
                if(!totalArithmetic){
                    totalArithmetic = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id,
                        createdDate:{ $lt: new Date(endDate)} 
                    }).sort({ createdDate: -1 });
                    // console.log("Última operación del día anterior para total aritmético:", totalArithmetic);
     
                }

                //Consultar ultima operacion registrada para obtener el total
                const physicalTotal = await AdjustmentRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $gte: new Date(dayStart), $lte: new Date(dayEnd) } 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                // console.log("Última operación física registrada:", physicalTotal);

                //inventario fisico ingresado y ajuste
                let physical = 0;
                let totalAdjustment = 0;

                if(physicalTotal){
                    physical = physicalTotal.kg;
                    totalAdjustment = physicalTotal.kg - (totalArithmetic ? totalArithmetic.total:0);
                }
                // console.log("Inventario físico:", physical, "Total ajuste:", totalAdjustment);


                /**
                 * Consultar precio del producto en base a diferentes criterios
                 * Primero se verifica si hubo historial de ofertas 
                 * Segundo se busca en el historial de cambios de precio de los productos
                 * Tercero si no hay los anteriores se toma el precio actual
                 */

                //incializar precio de producto en 0
                let endPriceProduct = 0;
                // console.log("Consultando precios del producto...");


                //Consultar si la fecha esta dentro de un rango de oferta cerrada
                const offerClosed = await OfferRecord.findOne({ 
                    createdDate:{ $lte: new Date(dayEnd)},
                    endDate:{ $gte: new Date(dayStart)},
                    product: inventory.product._id, agency:inventory.agency._id,
                })

                // console.log('Oferta cerrada encontrada:', offerClosed);
                
                //Si tiene oferta finalizada
                if(offerClosed){
                    endPriceProduct = offerClosed.price;
                }else{

                    const offerOpen = await OfferRecord.findOne({ 
                        createdDate:{ $lte: new Date(dayEnd)},
                        endDate:{ $eq: null },
                        product: inventory.product._id, agency:inventory.agency._id,
                    });

                    // console.log('Oferta abierta encontrada:', offerOpen);

                    //si tiene oferta abierta
                    if(offerOpen){
                        endPriceProduct = offerOpen.price;
                    }else{
                        //consultar precio de producto en historial para sacar totales financieros
                        const productRecordEndPrice = await ProductRecord.find({ 
                            createdDate:{ $lte: new Date(dayEnd) },
                            code: inventory.product.code,
                            endPrice:true
                        }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                        // console.log('Historial de precio final encontrado:', productRecordEndPrice);

                        //Si no hay precio final 
                        if(productRecordEndPrice.length > 0){
                            //tomar precio final marcado en historial
                            endPriceProduct = productRecordEndPrice[0].price;
                        }else{
                            //Si no hay precio marcado como final del dia, se toma el ultimo del historial
                            const productRecord = await ProductRecord.find({ 
                                createdDate:{ $lte: new Date(dayEnd) },
                                code: inventory.product.code,
                            }).sort({ createdDate: -1 });//ordenado fecha desc

                            // console.log('Historial de precios encontrado:', productRecord);

                            if(productRecord.length > 0){
                                //tomar ultimo precio registrado de historial
                                endPriceProduct = productRecord[0].price;
                            }else{
                                //Si no hay historial menor o igual a la fecha obtengo el ultimo
                                const productRecordCode = await ProductRecord.findOne({ 
                                    code: inventory.product.code,
                                }).sort({ createdDate: -1 });//ordenado fecha desc

                                // console.log('Precio más reciente en historial:', productRecordCode);

                                if(productRecordCode){
                                    endPriceProduct = productRecordCode.price; 
                                }else{
                                    //Si no hay historial se toma el precio actual en product
                                    const productStore = await Product.findOne({ code: inventory.product.code})

                                    // console.log('Precio actual del producto:', productStore);

                                    if(productStore){
                                        endPriceProduct = productStore.price; 
                                    }
                                }
                            }
                        }
                    }
                }
                
                //1.1 Calcular totales financieros (Precio * kg) a cada campo

                //2. Si hay operaciones el dia anterior el inicial es Aritmetico del dia anterior
                if(dataDayBefore){

           

                    const result = Object.assign(inventory, { 
                        initial: dataDayBefore.total,
                        initialAmount: dataDayBefore.total * endPriceProduct,
                        totalAdjustment, 
                        totalAdjustmentAmount:totalAdjustment * endPriceProduct,
                        physicalQuantity: physical, 
                        physicalAmount: physical * endPriceProduct, 
                        TotalQuantity: totalArithmetic ? totalArithmetic.total:0,
                        TotalAmount: totalArithmetic ? totalArithmetic.total * endPriceProduct:0,
                        totalInAmount: inventory.totalIn * endPriceProduct,
                        totalSellAmount: inventory.totalSell * endPriceProduct,
                        totalCutAmount: inventory.totalCut * endPriceProduct,
                        totalDecreaseAmount: inventory.totalDecrease * endPriceProduct,
                        /** */
                        totalWholesalesAmount: inventory.totalWholesales * endPriceProduct,
                        totalInCreditAmount: inventory.totalInCredit * endPriceProduct,
                        /** */
                        totalPackingAmount: inventory.totalPacking * endPriceProduct,
                        totalReweighAmount: inventory.totalReweigh * endPriceProduct,
                        totalMincemeatAmount: inventory.totalMincemeat * endPriceProduct,
                        /** */
                        totalDonationAmount: inventory.totalDonation * endPriceProduct,
                        totalTastingAmount: inventory.totalTasting * endPriceProduct,
                        totalPackagingAmount: inventory.totalPackaging * endPriceProduct,
                        totalCouponAmount: inventory.totalCoupon * endPriceProduct,
                        totalCorrectionAmount: inventory.totalCorrection * endPriceProduct,
                        totalTransferAmount: inventory.totalTransfer * endPriceProduct,
                        totalTransferToFattAmount: inventory.totalTransferToFatt * endPriceProduct,
                        /** */
                        totalOutAmount: inventory.totalOut * endPriceProduct,
                        priceAt:endPriceProduct
                    });

                    // console.log("Resultado después de asignar del día anterior:", result);
                    return result;
                }

                //3. Si no hay fisico y no hay operaciones el dia anterior 
                if(!dataDayBefore){
                   

                    const actualDate = moment(inventory.date).format('YYYY-MM-DD');
                    
                    //3.1. Se consulta primer registro del dia actual
                    //Esto quiere decir que es la primera subida de inventario en la bd
                    const currentData = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id, 
                        createdDate:{ $gte: new Date(actualDate)} 
                    }).sort({ createdDate: 1 });//ordenado fecha asc y tomar ese documento

                    //3.2. Si hay operaciones el dia actual
                    if(currentData){
                        // console.log("Operación del día actual encontrada:", currentData);

                        return Object.assign(inventory, { 
                            initial: currentData.total, 
                            initialAmount: currentData.total * endPriceProduct,
                            totalAdjustment, 
                            //totalAdjustmentAmount:totalAdjustment * endPriceProduct,
                            physicalQuantity: physical, 
                            physicalAmount: physical * endPriceProduct, 
                            TotalQuantity: totalArithmetic? totalArithmetic.total:0,
                            TotalAmount: totalArithmetic ? totalArithmetic.total * endPriceProduct:0,
                            totalInAmount: inventory.totalIn * endPriceProduct,
                            totalSellAmount: inventory.totalSell * endPriceProduct,
                            totalCutAmount: inventory.totalCut * endPriceProduct,
                            totalDecreaseAmount: inventory.totalDecrease * endPriceProduct,
                            /** */
                            totalWholesalesAmount: inventory.totalWholesales * endPriceProduct,
                            totalInCreditAmount: inventory.totalInCredit * endPriceProduct,
                            /** */
                            totalPackingAmount: inventory.totalPacking * endPriceProduct,
                            totalReweighAmount: inventory.totalReweigh * endPriceProduct,
                            totalMincemeatAmount: inventory.totalMincemeat * endPriceProduct,
                            /** */
                            totalDonationAmount: inventory.totalDonation * endPriceProduct,
                            totalTastingAmount: inventory.totalTasting * endPriceProduct,
                            totalPackagingAmount: inventory.totalPackaging * endPriceProduct,
                            totalCouponAmount: inventory.totalCoupon * endPriceProduct,
                            totalCorrectionAmount: inventory.totalCorrection * endPriceProduct,
                            totalTransferAmount: inventory.totalTransfer * endPriceProduct,
                            totalTransferToFattAmount: inventory.totalTransferToFatt * endPriceProduct,
                            /** */
                            totalOutAmount: inventory.totalOut * endPriceProduct,
                            priceAt:endPriceProduct
                        });
                    }else{
                        console.log("No se encontraron operaciones para el día actual.");

                        //3.3. Si no hay operaciones el dia actual todo en 0
                        return Object.assign(inventory, { 
                            initial: 0, 
                            initialAmount: 0,
                            totalAdjustment,
                            //totalAdjustmentAmount: totalAdjustment * endPriceProduct, 
                            physicalQuantity: physical, 
                            physicalAmount: physical * endPriceProduct, 
                            TotalQuantity: 0,
                            TotalAmount: 0,
                            totalInAmount: inventory.totalIn * endPriceProduct,
                            totalSellAmount: inventory.totalSell * endPriceProduct,
                            totalCutAmount: inventory.totalCut * endPriceProduct,
                            totalDecreaseAmount: inventory.totalDecrease * endPriceProduct,
                            /** */
                            totalWholesalesAmount: inventory.totalWholesales * endPriceProduct,
                            totalInCreditAmount: inventory.totalInCredit * endPriceProduct,
                            /** */
                            totalPackingAmount: inventory.totalPacking * endPriceProduct,
                            totalReweighAmount: inventory.totalReweigh * endPriceProduct,
                            totalMincemeatAmount: inventory.totalMincemeat * endPriceProduct,
                            /** */
                            totalDonationAmount: inventory.totalDonation * endPriceProduct,
                            totalTastingAmount: inventory.totalTasting * endPriceProduct,
                            totalPackagingAmount: inventory.totalPackaging * endPriceProduct,
                            totalCouponAmount: inventory.totalCoupon * endPriceProduct,
                            totalCorrectionAmount: inventory.totalCorrection * endPriceProduct,
                            totalTransferAmount: inventory.totalTransfer * endPriceProduct,
                            totalTransferToFattAmount: inventory.totalTransferToFatt * endPriceProduct,
                            /** */
                            totalOutAmount: inventory.totalOut * endPriceProduct,
                            priceAt:endPriceProduct
                        });
                    }
                }


            } catch(err) {
                console.error("Error durante el procesamiento del inventario:", err);
 
                throw err;
            }

        }));

        let totalAdjustmentAmountSum = 0

        //Sacar total aritmentico
        await Promise.all(DataResult.map(async (inventory) => {

            if(inventory.product.code == '31' || inventory.product.code == '32'){

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount+inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, { 
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }else{

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount-inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
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
            metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
            totalAdjustmentAmountSum
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
        var sortBy = { "date" : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1

            if(inventoryParam.sortBy.id == "date"){
                sortBy = { "date" : direction } 
            }else{
                sortBy = { [inventoryParam.sortBy.id] : direction } 
            }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        //agrupar por fecha, producto, agencia
        //Sacar total en ventas, entradas, salidas por merma, repesaje, degustación y empaques
        let stages = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $sort : sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

             //Si hay filtro de sucursal
             if(inventoryParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { date: { $gte: new Date(startDate) } } },
                );
            }

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { date: { $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryReport.aggregate(stages);
        
        let DataResult = inventories;

        if(!inventoryParam.isExcel){
            DataResult = inventories[0].data;
        }
        
        let totalAdjustmentAmountSum = 0

        //Sacar total aritmentico
        await Promise.all(DataResult.map(async (inventory) => {

            if(inventory.product.code == '31' || inventory.product.code == '32'){

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount+inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, { 
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }else{

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount-inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
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
            metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
            totalAdjustmentAmountSum
        }
    },


    
    /**
     * Funcion para redirigir de donde obtener el balance de inventario, si de la base de datos, o habrá que calcularlo
     *
     */

    getBalanceReport: async (inventoryParam) => {
        if (!inventoryParam || !inventoryParam.user) {
            throw new Error('No se recibió información del usuario. Debe iniciar sesión de nuevo.');
        }

        const filters = inventoryParam.filters || {};

        // Si se pide del mismo dia o un rango que lo incluya, se deberá entonces calcular de la manera normal
        // En caso de que no haya filtro de fecha o se pidan los datos del mismo dia
        if (!filters.startDate) {
            return await inventoryService.dataTableBalanceReport(inventoryParam);
        }

        // Filtros para la consulta con fecha
        if (filters.startDate) {

            let currentDate = moment().utc().subtract(4 , 'hours');
            
            let startDate = moment(filters.startDate).utc().subtract(4 , 'hours')
                
            // Si el dia corresponde con el dia actual,  se calcula el balance normalmente
            if (moment(currentDate).isSame(startDate, 'day')){

                return await inventoryService.dataTableBalanceReport(inventoryParam);
            }
            else{
                return await inventoryService.dataTableBalanceReportSaved(inventoryParam);
            }
        }  
    },


    /**
     * Reporte de balances
     */
    dataTableBalanceReport: async (inventoryParam) => {
        if (!inventoryParam || !inventoryParam.user) {
            throw new Error('No se recibió información del usuario. Debe iniciar sesión de nuevo.');
        }

        //orden por defecto
        var sortBy = { "_id.createdDate" : -1};

        //agrupar por fecha, producto, agencia
        //Sacar total en ventas, entradas, salidas por merma, repesaje, degustación y empaques
        let stages = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $group : {
                    _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                    totalOutAmount: { $sum: "$out" },
                    totalSell: { $sum: { $cond: [{ $eq: ["$type", enumOut.out.sale] }, "$out", 0] } },
                    //total entradas sin el inicial
                    totalIn: {$sum: { $cond: [ {$and : [ { $eq: [ "$type", 0] },//solo compras 
                                { $eq: [ "$isInit",false] }//sin inicial
                    ]},"$in", 0 ]}},
                    //total por ventas al mayor
                    totalWholesales: { $sum: { $cond: [ {$and : [ { $eq: ["$type", enumOut.out.sale] },{ $eq: ["$isWholesale", true] }, 
                    ]}, "$out", 0] }},
                    //diferencial total por ventas al mayor
                    totalWholesaleDifferential: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$differential", 0] }},
                    //diferencial total por descuento en ventas al mayor
                    totalWholesaleDiscountDifferential: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$wholesaleDiscountDifferential", 0] }},
                    //diferencial total por ventas al mayor
                    totalInCredit: { $sum: { $cond: [{ $eq: ["$isCredit", true] }, "$out", 0] } },
                    //diferencial total por ventas al mayor
                    totalInCreditDifferential: { $sum: { $cond: [ { $eq: ["$isCredit", true] }, "$differential", 0] }},
                    //diferencial total por ventas al mayor
                    totalComboDifferential: { $sum: { $cond: [ { $eq: ["$isCombo", true] }, "$differential", 0] }},
                    //total salidas de mermas
                    totalDecrease: { $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh, enumOut.out.decrease, enumOut.out.mincemeat ]] }, "$out", 0] }},
                    //Merma por empaque
                    totalPacking: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.decrease ]] }, "$out", 0] }
                    },
                    //Merma por humedad
                    totalReweigh: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh ]] }, "$out", 0] }
                    },
                    //Merma por picadillo
                    totalMincemeat: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.mincemeat ]] }, "$out", 0] }
                    },
                    //total salidas por  degustación, empaques, donación, vales, correcciones, traslados y recortes
                    totalOut: { $sum: { $cond: [{ $in: ["$type", [ enumOut.out.packaging,  enumOut.out.tasting, enumOut.out.donation
                        , enumOut.out.coupon, enumOut.out.correction, enumOut.out.transfer, enumOut.out.transferToFatt ]] }, "$out", 0] }
                    },
                    //total donacion
                    totalDonation: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.donation ]] }, "$out", 0] }
                    },
                    //total degustacion
                    totalTasting: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.tasting ]] }, "$out", 0] }
                    },
                    //total empaques
                    totalPackaging: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.packaging ]] }, "$out", 0] }
                    },
                    //total vale
                    totalCoupon: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.coupon ]] }, "$out", 0] }
                    },
                    //total correccion
                    totalCorrection: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.correction ]] }, "$out", 0] }
                    },
                    //total tralsado
                    totalTransfer: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.transfer ]] }, "$out", 0] }
                    },
                    //total tralsado a tienda
                    totalTransferToFatt: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.transferToFatt ]] }, "$out", 0] }
                    },
                    //Total de recorte
                    totalCut: { $sum: "$cut" },
                    product: { $first: '$product' },
                    date: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                    agency: { $first: '$agency' }
                }
            }, 
            { $sort : sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
        ];

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryRecord.aggregate(stages);
        let DataResult = inventories;

        //Buscar inventario inicial por producto y setear iniciales ajustes etc.
        await Promise.all(DataResult.map(async (inventory) => {

            try {

                const endDate =  moment(inventory.date).subtract(1, 'days').endOf('day');

                //1. Consultar ultima operacion del dia anterior
                const dataDayBefore = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $lte: new Date(endDate)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                //Fecha del registro: inicio y fin del dia
                const dayStart = moment(inventory.date).utc().startOf('day');
                const dayEnd = moment(inventory.date).utc().endOf('day');

                //TotalQuantity: Consultar ultima operacion registrada para obtener el total
                //Y que no sea inventario fisico : 14
                let totalArithmetic = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id,
                    type: { $ne: enumOut.out.adjustment },//sin ajuste
                    createdDate:{ $gte: new Date(dayStart), $lte: new Date(dayEnd)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                //Si no hay total aritmetico el dia actual tomo el del dia anterior no importa si es de tipo ajuste  
                if(!totalArithmetic){
                    totalArithmetic = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id,
                        createdDate:{ $lt: new Date(endDate)} 
                    }).sort({ createdDate: -1 });
                }

                //Consultar ultima operacion registrada para obtener el total
                const physicalTotal = await AdjustmentRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $gte: new Date(dayStart), $lte: new Date(dayEnd) } 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                //inventario fisico ingresado y ajuste
                let physical = 0;
                let totalAdjustment = 0;

                if(physicalTotal){
                    physical = physicalTotal.kg;
                    totalAdjustment = physicalTotal.kg - (totalArithmetic ? totalArithmetic.total:0);
                }

                /**
                 * Consultar precio del producto en base a diferentes criterios
                 * Primero se verifica si hubo historial de ofertas 
                 * Segundo se busca en el historial de cambios de precio de los productos
                 * Tercero si no hay los anteriores se toma el precio actual
                 */

                //incializar precio de producto en 0
                let endPriceProduct = 0;

                //Consultar si la fecha esta dentro de un rango de oferta cerrada
                const offerClosed = await OfferRecord.findOne({ 
                    createdDate:{ $lte: new Date(dayEnd)},
                    endDate:{ $gte: new Date(dayStart)},
                    product: inventory.product._id, agency:inventory.agency._id,
                })
                
                //Si tiene oferta finalizada
                if(offerClosed){
                    endPriceProduct = offerClosed.price;
                }else{

                    const offerOpen = await OfferRecord.findOne({ 
                        createdDate:{ $lte: new Date(dayEnd)},
                        endDate:{ $eq: null },
                        product: inventory.product._id, agency:inventory.agency._id,
                    });

                    //si tiene oferta abierta
                    if(offerOpen){
                        endPriceProduct = offerOpen.price;
                    }else{
                        //consultar precio de producto en historial para sacar totales financieros
                        const productRecordEndPrice = await ProductRecord.find({ 
                            createdDate:{ $lte: new Date(dayEnd) },
                            code: inventory.product.code,
                            endPrice:true
                        }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                        //Si no hay precio final 
                        if(productRecordEndPrice.length > 0){
                            //tomar precio final marcado en historial
                            endPriceProduct = productRecordEndPrice[0].price;
                        }else{
                            //Si no hay precio marcado como final del dia, se toma el ultimo del historial
                            const productRecord = await ProductRecord.find({ 
                                createdDate:{ $lte: new Date(dayEnd) },
                                code: inventory.product.code,
                            }).sort({ createdDate: -1 });//ordenado fecha desc

                            if(productRecord.length > 0){
                                //tomar ultimo precio registrado de historial
                                endPriceProduct = productRecord[0].price;
                            }else{
                                //Si no hay historial menor o igual a la fecha obtengo el ultimo
                                const productRecordCode = await ProductRecord.findOne({ 
                                    code: inventory.product.code,
                                }).sort({ createdDate: -1 });//ordenado fecha desc

                                if(productRecordCode){
                                    endPriceProduct = productRecordCode.price; 
                                }else{
                                    //Si no hay historial se toma el precio actual en product
                                    const productStore = await Product.findOne({ code: inventory.product.code})

                                    if(productStore){
                                        endPriceProduct = productStore.price; 
                                    }
                                }
                            }
                        }
                    }
                }
                
                //1.1 Calcular totales financieros (Precio * kg) a cada campo

                //2. Si hay operaciones el dia anterior el inicial es Aritmetico del dia anterior
                if(dataDayBefore){
                    return Object.assign(inventory, { 
                        initial: dataDayBefore.total,
                        initialAmount: dataDayBefore.total * endPriceProduct,
                        totalAdjustment, 
                        //totalAdjustmentAmount:totalAdjustment * endPriceProduct,
                        physicalQuantity: physical, 
                        physicalAmount: physical * endPriceProduct, 
                        TotalQuantity: totalArithmetic ? totalArithmetic.total:0,
                        TotalAmount: totalArithmetic ? totalArithmetic.total * endPriceProduct:0,
                        totalInAmount: inventory.totalIn * endPriceProduct,
                        totalSellAmount: inventory.totalSell * endPriceProduct,
                        totalCutAmount: inventory.totalCut * endPriceProduct,
                        totalDecreaseAmount: inventory.totalDecrease * endPriceProduct,
                        /** */
                        totalWholesalesAmount: inventory.totalWholesales * endPriceProduct,
                        totalInCreditAmount: inventory.totalInCredit * endPriceProduct,
                        /** */
                        totalPackingAmount: inventory.totalPacking * endPriceProduct,
                        totalReweighAmount: inventory.totalReweigh * endPriceProduct,
                        totalMincemeatAmount: inventory.totalMincemeat * endPriceProduct,
                        /** */
                        totalDonationAmount: inventory.totalDonation * endPriceProduct,
                        totalTastingAmount: inventory.totalTasting * endPriceProduct,
                        totalPackagingAmount: inventory.totalPackaging * endPriceProduct,
                        totalCouponAmount: inventory.totalCoupon * endPriceProduct,
                        totalCorrectionAmount: inventory.totalCorrection * endPriceProduct,
                        totalTransferAmount: inventory.totalTransfer * endPriceProduct,
                        totalTransferToFattAmount: inventory.totalTransferToFatt * endPriceProduct,
                        /** */
                        totalOutAmount: inventory.totalOut * endPriceProduct,
                        priceAt:endPriceProduct
                    });
                }

                //3. Si no hay fisico y no hay operaciones el dia anterior 
                if(!dataDayBefore){
                   
                    const actualDate = moment(inventory.date).format('YYYY-MM-DD');
                    //3.1. Se consulta primer registro del dia actual
                    //Esto quiere decir que es la primera subida de inventario en la bd
                    const currentData = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id, 
                        createdDate:{ $gte: new Date(actualDate)} 
                    }).sort({ createdDate: 1 });//ordenado fecha asc y tomar ese documento

                    //3.2. Si hay operaciones el dia actual
                    if(currentData){
                        return Object.assign(inventory, { 
                            initial: currentData.total, 
                            initialAmount: currentData.total * endPriceProduct,
                            totalAdjustment, 
                            //totalAdjustmentAmount:totalAdjustment * endPriceProduct,
                            physicalQuantity: physical, 
                            physicalAmount: physical * endPriceProduct, 
                            TotalQuantity: totalArithmetic? totalArithmetic.total:0,
                            TotalAmount: totalArithmetic ? totalArithmetic.total * endPriceProduct:0,
                            totalInAmount: inventory.totalIn * endPriceProduct,
                            totalSellAmount: inventory.totalSell * endPriceProduct,
                            totalCutAmount: inventory.totalCut * endPriceProduct,
                            totalDecreaseAmount: inventory.totalDecrease * endPriceProduct,
                            /** */
                            totalWholesalesAmount: inventory.totalWholesales * endPriceProduct,
                            totalInCreditAmount: inventory.totalInCredit * endPriceProduct,
                            /** */
                            totalPackingAmount: inventory.totalPacking * endPriceProduct,
                            totalReweighAmount: inventory.totalReweigh * endPriceProduct,
                            totalMincemeatAmount: inventory.totalMincemeat * endPriceProduct,
                            /** */
                            totalDonationAmount: inventory.totalDonation * endPriceProduct,
                            totalTastingAmount: inventory.totalTasting * endPriceProduct,
                            totalPackagingAmount: inventory.totalPackaging * endPriceProduct,
                            totalCouponAmount: inventory.totalCoupon * endPriceProduct,
                            totalCorrectionAmount: inventory.totalCorrection * endPriceProduct,
                            totalTransferAmount: inventory.totalTransfer * endPriceProduct,
                            totalTransferToFattAmount: inventory.totalTransferToFatt * endPriceProduct,
                            /** */
                            totalOutAmount: inventory.totalOut * endPriceProduct,
                            priceAt:endPriceProduct
                        });
                    }else{
                        //3.3. Si no hay operaciones el dia actual todo en 0
                        return Object.assign(inventory, { 
                            initial: 0, 
                            initialAmount: 0,
                            totalAdjustment,
                            //totalAdjustmentAmount: totalAdjustment * endPriceProduct, 
                            physicalQuantity: physical, 
                            physicalAmount: physical * endPriceProduct, 
                            TotalQuantity: 0,
                            TotalAmount: 0,
                            totalInAmount: inventory.totalIn * endPriceProduct,
                            totalSellAmount: inventory.totalSell * endPriceProduct,
                            totalCutAmount: inventory.totalCut * endPriceProduct,
                            totalDecreaseAmount: inventory.totalDecrease * endPriceProduct,
                            /** */
                            totalWholesalesAmount: inventory.totalWholesales * endPriceProduct,
                            totalInCreditAmount: inventory.totalInCredit * endPriceProduct,
                            /** */
                            totalPackingAmount: inventory.totalPacking * endPriceProduct,
                            totalReweighAmount: inventory.totalReweigh * endPriceProduct,
                            totalMincemeatAmount: inventory.totalMincemeat * endPriceProduct,
                            /** */
                            totalDonationAmount: inventory.totalDonation * endPriceProduct,
                            totalTastingAmount: inventory.totalTasting * endPriceProduct,
                            totalPackagingAmount: inventory.totalPackaging * endPriceProduct,
                            totalCouponAmount: inventory.totalCoupon * endPriceProduct,
                            totalCorrectionAmount: inventory.totalCorrection * endPriceProduct,
                            totalTransferAmount: inventory.totalTransfer * endPriceProduct,
                            totalTransferToFattAmount: inventory.totalTransferToFatt * endPriceProduct,
                            /** */
                            totalOutAmount: inventory.totalOut * endPriceProduct,
                            priceAt:endPriceProduct
                        });
                    }
                }


            } catch(err) {
                throw err;
            }

        }));

        //Sacar total aritmentico
        await Promise.all(DataResult.map(async (inventory) => {

            if(inventory.product.code == '31' || inventory.product.code == '32'){

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount+inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, { 
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }else{

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount-inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, { 
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }
        }));

        /**
         * Sacar todos los totales
         */

        var initialAmountSum = 0;
        var totalInAmountSum = 0;
        var totalSellAmountSum = 0;
        var totalCutAmountSum = 0;
        var totalDecreaseAmountSum = 0;
        var totalOutAmountSum = 0;
        var TotalAmountSum = 0;
        var physicalAmountSum = 0;
        var totalAdjustmentAmountSum = 0;
        var totalPercent = 0;

        var totalCutInSum = 0;
        var totalCutOutSum = 0;

        //totales detallados de mermas
        var totalPackingSum = 0;
        var totalReweighSum = 0;
        var totalMincemeatSum = 0;

        //totales detallados de salidas
        var totalDonationSum = 0;
        var totalTastingSum = 0;
        var totalPackagingSum = 0;
        var totalCouponSum = 0;
        var totalCorrectionSum = 0;
        var totalTransferSum = 0;
        var totalTransferToFattSum = 0;

        // Inventario bruto
        var inventoryGross = 0;
        // Inicial menos ventas
        var initialMinusSell = 0;
        // Porcentaje
        var percentCut = 0; 
        var percentDecreases = 0; 
        var percentOuts = 0; 

        //Egresos diversos
        var variousExpenses = 0;

        var noResults = false;

        //diferencial total de las ventas al mayor
        var totalWholesaleDifferentialSum = 0;
        var totalWholesaleDiscountDifferentialSum = 0;
        var totalWholesalesSum = 0;
        var totalInCreditSum = 0;
        var totalInCreditDifferentialSum = 0;

        // Diferencial total por combos
        var totalComboDifferentialSum = 0;
        // Diferencial total por cupón (detal/detal fiscal)
        var totalCouponDifferentialSum = 0;

        await Promise.all(DataResult.map(async (inventory) => {
            initialAmountSum += inventory.initialAmount;//Inicial
            totalInAmountSum += inventory.totalInAmount;//Compras
            totalSellAmountSum += inventory.totalSellAmount;//Ventas
            //Manejo de recortes
            if(inventory.product.code == '31' || inventory.product.code == '32'){
                totalCutInSum += inventory.totalCutAmount;
            }else{
                totalCutOutSum += inventory.totalCutAmount;
            }
            totalCutAmountSum += inventory.totalCutAmount;//Recortes
            totalDecreaseAmountSum += inventory.totalDecreaseAmount;//Mermas
            totalOutAmountSum += inventory.totalOutAmount;//Salidas
            //TotalAmountSum += inventory.TotalAmount;//Total Aritmentico
            physicalAmountSum += inventory.physicalAmount;//Inventario fisico
            totalAdjustmentAmountSum += inventory.totalAdjustmentAmount;//Ajustes

            //totales de mermas detallados
            totalPackingSum +=  inventory.totalPackingAmount;
            totalReweighSum +=  inventory.totalReweighAmount;
            totalMincemeatSum +=  inventory.totalMincemeatAmount;
            
            //totales de salidas detallados
            totalDonationSum += inventory.totalDonationAmount;
            totalTastingSum += inventory.totalTastingAmount;
            totalPackagingSum += inventory.totalPackagingAmount;
            totalCouponSum += inventory.totalCouponAmount;
            totalCorrectionSum += inventory.totalCorrectionAmount;
            totalTransferSum += inventory.totalTransferAmount;
            totalTransferToFattSum += inventory.totalTransferToFattAmount;

            //totales de los valores correspondientes a las ventas al mayor
            totalWholesaleDifferentialSum += inventory.totalWholesaleDifferential;
            totalWholesaleDiscountDifferentialSum += inventory.totalWholesaleDiscountDifferential;
            totalWholesalesSum += inventory.totalWholesalesAmount;
            totalInCreditSum += inventory.totalInCreditAmount;
            totalInCreditDifferentialSum += inventory.totalInCreditDifferential;
            
            //total de los diferenciales por combos
            totalComboDifferentialSum += inventory.totalComboDifferential;
        }));


/*        let stage = [
            { $group : {
                    _id: { agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                    //total por ventas al mayor
                    totalWholesales: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$total", 0] }},
                    //diferencial total por ventas al mayor
                    totalInCredit: { $sum: { $cond: [{ $eq: ["$isCredit", true] }, "$total", 0] } },
                    //diferencial total por ventas al mayor
                    totalWholesaleDifferential: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$differential", 0] }},
                    date: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                    agency: { $first: '$agency' }
                }
            }, 
            { $sort : sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
        ];


        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stage.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
                stage.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
                stage.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stage.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const dataWholesales = await Sales.aggregate(stage);

        //let totalWholesalesSum = 0
        //let totalInCreditSum = 0
        //let totalWholesaleDifferentialSum = 0

        //Si hay filtro de sucursal
        if(inventoryParam.filters.agency){
            totalWholesalesSum = dataWholesales.totalWholesales
            totalInCreditSum = dataWholesales.totalInCredit
            //let totalWholesaleDifferentialSum = totalWholesaleDifferentialSum.totalWholesaleDifferential
        }else{
            dataWholesales.map((wholesale) => {

                totalWholesalesSum += wholesale.totalWholesales;
                totalInCreditSum = wholesale.totalInCredit;
                 //let totalWholesaleDifferentialSum = wholesale.totalWholesaleDifferential
            })
        }
*/



        if(DataResult.length > 0){
            noResults = true
            try {
                //total recortes
                totalCutAmountSum = Math.abs(totalCutOutSum-totalCutInSum);
                //total aritmetico 
                TotalAmountSum = initialAmountSum+totalInAmountSum-totalSellAmountSum-totalCutAmountSum-totalDecreaseAmountSum-totalOutAmountSum;
                //porcentaje
                totalPercent = ((Math.abs(totalAdjustmentAmountSum)*100)/TotalAmountSum);

                inventoryGross = initialAmountSum+totalInAmountSum;
                initialMinusSell = Math.abs(inventoryGross-totalSellAmountSum);

                if(totalSellAmountSum> 0){
                    percentCut = parseFloat((totalCutAmountSum/totalSellAmountSum).toFixed(2));
                    percentDecreases = parseFloat((totalDecreaseAmountSum/totalSellAmountSum).toFixed(2));
                    percentOuts = parseFloat((totalOutAmountSum/totalSellAmountSum).toFixed(2));
                }

                //egresos diversos recortes+mermas+salidas
                variousExpenses = totalCutAmountSum+totalDecreaseAmountSum+totalOutAmountSum;
            } catch (error) {
                
            }
        }

        let currentDate = moment().utc().format("YYYY-MM-DD")

        if(inventoryParam.filters.startDate){
            currentDate =  moment(inventoryParam.filters.startDate).utc().format("YYYY-MM-DD")
        }

        let agencyName = "TODAS";
        
        if(inventoryParam.filters.agency){
            const agency = await Agency.findById(inventoryParam.filters.agency);

            if(agency){
                agencyName = agency.name;
            }
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            const agency = await Agency.findById(inventoryParam.user.agency);

            if(agency){
                agencyName = agency.name;
            }
        }

        // Se busca la tasa del BCV del dia para obtener los valores en dólares para las ventas al mayor
        let stagesSales = {};
        
        //Filtros para la consulta
        if (inventoryParam.filters.startDate){

            const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
    
            stagesSales.createdDate = { $lte: new Date(endDate) } 
            
        }else{
            
            const endDate =  moment().utc().endOf('day');

            stagesSales.createdDate = { $lte: new Date(endDate) } 
        }

        const sales = await Sales.findOne(stagesSales).sort({createdDate: -1});

        let valueDollar = (sales && sales.valueDollar != null) ? sales.valueDollar : 0;

        //Si ha habido pagos de créditos creados ese mismo dia, se resta al total por créditos
        let creditStages = {}

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            creditStages.agency = new ObjectId(inventoryParam.user.agency)
        }

        if(inventoryParam.filters.agency){
            creditStages.agency = new ObjectId(inventoryParam.filters.agency)
        }

        if(inventoryParam.filters.startDate){

            const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
            const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
    
            creditStages.createdDate = { $gte: new Date(startDate), $lte: new Date(endDate) }    
        
        }else{

            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            
            creditStages.createdDate = { $gte: new Date(startDate), $lte: new Date(endDate) } 
        }       

        const result = await PendingPayments.find(creditStages)
        
        // Si hubo pagos pendientes el dia
        if (JSON.stringify(result) !== '[]') { //    

            result.forEach((pendingPayment) => {

                //Si sí hay pagos
                if (pendingPayment.payments.length !== 0){

                    pendingPayment.payments.forEach((payment) => {

                        if (moment(payment.createdDate).day() == moment(inventoryParam.filters.startDate).day()){

                            totalInCreditSum -= payment.total * valueDollar 
                        }
                    }) 
                }
            })
        }

        // Diferencial por cupón: suma de couponDiscount convertido a dólares usando la tasa de cada venta
        const couponMatch = { createdDate: creditStages.createdDate };
        if (creditStages.agency) couponMatch.agency = creditStages.agency;
        const couponResult = await Sales.aggregate([
            { $match: couponMatch },
            {
                $group: {
                    _id: null,
                    totalCouponDifferential: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $ne: [{ $ifNull: ["$couponDiscount", 0] }, 0] },
                                    { $ne: [{ $ifNull: ["$valueDollar", 0] }, 0] }
                                ]},
                                { $divide: [{ $ifNull: ["$couponDiscount", 0] }, { $ifNull: ["$valueDollar", 1] }] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        totalCouponDifferentialSum = (couponResult[0] && couponResult[0].totalCouponDifferential) ? couponResult[0].totalCouponDifferential : 0;

        // Total de clientes = tickets del día (misma fuente que historial forma de pago)
        const totalClientsResult = await Sales.aggregate([
            { $match: couponMatch },
            { $count: "totalClients" }
        ]);
        const totalClientsSum = totalClientsResult[0]?.totalClients ?? 0;

        
        let DataBalance = []
        DataBalance.push({name:"Fecha", value: currentDate });//0
        DataBalance.push({name:"Sucursal", value: agencyName });//1
        DataBalance.push({name:"Inventario inicial", value: initialAmountSum });//2
        DataBalance.push({name:"Envios", value: totalInAmountSum });//3
        DataBalance.push({name:"Ventas", value: totalSellAmountSum });//4
        DataBalance.push({name:"Recorte", value: totalCutAmountSum });//5
        DataBalance.push({name:"Mermas", value: totalDecreaseAmountSum });//6
        DataBalance.push({name:"Salidas", value: totalOutAmountSum });//7
        DataBalance.push({name:"Debe haber", value: TotalAmountSum });//8
        DataBalance.push({name:"Inventario final", value: physicalAmountSum });//9
        DataBalance.push({name:"Faltante", value: Math.abs(totalAdjustmentAmountSum) });//10
        DataBalance.push({name:"%", value: totalPercent });//11

        //Nuevos campos y detalles
        DataBalance.push({name:"Inventario bruto", value: inventoryGross });//12
        DataBalance.push({name:"INICIAL - VENTAS", value: initialMinusSell });//13
        DataBalance.push({name:"Porcentaje recortes", value: percentCut });//14
        DataBalance.push({name:"Porcentaje mermas", value: percentDecreases });//15 
        DataBalance.push({name:"Empaque", value: totalPackingSum });//16
        DataBalance.push({name:"Humedad", value: totalReweighSum });//17
        DataBalance.push({name:"Picadillo", value: totalMincemeatSum });//18
        //detalles salidas
        DataBalance.push({name:"Donacion", value: totalDonationSum });//19
        DataBalance.push({name:"Degustacion", value: totalTastingSum });//20
        DataBalance.push({name:"Empaques", value: totalPackagingSum });//21
        DataBalance.push({name:"Vale", value: totalCouponSum });//22
        DataBalance.push({name:"Correccion", value: totalCorrectionSum });//23
        DataBalance.push({name:"Traslado", value: totalTransferSum });//24

        DataBalance.push({name:"Porcentaje salidas", value: percentOuts });//25
        DataBalance.push({name:"EGRESOS DIVERSOS", value: variousExpenses });//26
        //  Detalles de las ventas al mayor
        DataBalance.push({name:"Ventas al mayor", value: totalWholesalesSum });//27
        DataBalance.push({name:"Ventas al detal", value: (totalSellAmountSum-totalWholesalesSum)});//28
        DataBalance.push({name:"Total en credito", value: (totalInCreditSum-totalInCreditDifferentialSum) });//29
        DataBalance.push({name:"Dif. Ventas al mayor", value: totalWholesaleDifferentialSum });//30
        // Ventas reales = Total ventas (en $) menos la suma de TODOS los diferenciales
        // Combos y cupón ya están en $; wholesale y wholesaleDiscount en Bs → se convierten con valueDollar
        const totalSellAmountSumDollar = valueDollar > 0
            ? (totalSellAmountSum < valueDollar ? totalSellAmountSum : totalSellAmountSum / valueDollar)
            : 0;
        const totalAllDifferentialsDollar = valueDollar > 0
            ? ((totalWholesaleDifferentialSum + totalWholesaleDiscountDifferentialSum) / valueDollar) + totalComboDifferentialSum + totalCouponDifferentialSum
            : totalComboDifferentialSum + totalCouponDifferentialSum;
        const ventasRealesDollar = Math.max(0, Math.round((totalSellAmountSumDollar - totalAllDifferentialsDollar) * 100) / 100);
        DataBalance.push({name:"Ventas reales", value: ventasRealesDollar });//31
        //  Valor de la tasa BCV del dia
        DataBalance.push({name:"Tasa BCV", value: valueDollar });//32
        //  Diferencial total por venta de combos (en $)
        DataBalance.push({name:"Dif. por venta de combos", value: totalComboDifferentialSum });//33
        //  Diferencial por descuento en ventas al mayor
        DataBalance.push({name:"Dif. por descuento en ventas al mayor", value: totalWholesaleDiscountDifferentialSum });//34
        //  Diferencial por cupón - ya está en dólares
        DataBalance.push({name:"Dif. por cupón", value: totalCouponDifferentialSum });//35
        DataBalance.push({name:"Traslado a fabrica", value: totalTransferToFattSum });//36
        DataBalance.push({name:"Total de diferenciales", value: totalAllDifferentialsDollar });//37
        DataBalance.push({name:"Total de clientes", value: totalClientsSum });//38

        
        return {
            results: DataBalance,
            metadata: noResults
        }
    },


    
    /**
     * Reporte de balances (desde datos guardados)
     */
    dataTableBalanceReportSaved: async (inventoryParam) => {
        if (!inventoryParam || !inventoryParam.user) {
            throw new Error('No se recibió información del usuario. Debe iniciar sesión de nuevo.');
        }

        //orden por defecto
        var sortBy = { "date" : -1};

        //agrupar por fecha, producto, agencia
        //Sacar total en ventas, entradas, salidas por merma, repesaje, degustación y empaques
        let stages = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $sort : sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
        ];

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
                stages.unshift(
                    { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryReport.aggregate(stages);
        let DataResult = inventories;

        // Se creará nueva data unicamente para los casos en no haya data de ese dia
        if (DataResult.length === 0){
                            
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

            // Se obtiene el reporte de invetario de cada producto, de cada tienda, del dia anterior
            let dataTable = await inventoryService.dataTableInventoryReport(params);

            // Si por casualidad no hay nada en el reporte de inventario, va a ocurrir un loop infinito por lo que 
            if (dataTable.results.length > 0){
                // Se realiza un Reporte para cada uno de los productos

                dataTable.results.forEach( async (item) => {

                    delete item._id

                    item.product = item.product._id;
                    item.agency = item.agency._id;

                    let newInventoryReport = new InventoryReport(item);

                    await newInventoryReport.save();
                }) 
            
                // Una vez se cree la data, se vuelve a llamar a la funcion y se devuelven los respectivos resultados
                return await inventoryService.dataTableBalanceReportSaved(inventoryParam)
            }
            else{
                return await inventoryService.dataTableBalanceReport(inventoryParam)
            }

        }

        //Sacar total aritmentico
        await Promise.all(DataResult.map(async (inventory) => {

            if(inventory.product.code == '31' || inventory.product.code == '32'){

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount+inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, { 
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }else{

                let total = inventory.initialAmount+inventory.totalInAmount-inventory.totalSellAmount-inventory.totalCutAmount-inventory.totalDecreaseAmount-inventory.totalOutAmount;

                let totalAdjustmentAmount = 0
                if(inventory.physicalAmount>0){
                    totalAdjustmentAmount = total - inventory.physicalAmount;
                }
                Object.assign(inventory, { 
                    TotalAmount: total,
                    totalAdjustmentAmount: totalAdjustmentAmount
                });
            }
        }));

        /**
         * Sacar todos los totales
         */

        var initialAmountSum = 0;
        var totalInAmountSum = 0;
        var totalSellAmountSum = 0;
        var totalCutAmountSum = 0;
        var totalDecreaseAmountSum = 0;
        var totalOutAmountSum = 0;
        var TotalAmountSum = 0;
        var physicalAmountSum = 0;
        var totalAdjustmentAmountSum = 0;
        var totalPercent = 0;

        var totalCutInSum = 0;
        var totalCutOutSum = 0;

        //totales detallados de mermas
        var totalPackingSum = 0;
        var totalReweighSum = 0;
        var totalMincemeatSum = 0;

        //totales detallados de salidas
        var totalDonationSum = 0;
        var totalTastingSum = 0;
        var totalPackagingSum = 0;
        var totalCouponSum = 0;
        var totalCorrectionSum = 0;
        var totalTransferSum = 0;
        var totalTransferToFattSum = 0;

        // Inventario bruto
        var inventoryGross = 0;
        // Inicial menos ventas
        var initialMinusSell = 0;
        // Porcentaje
        var percentCut = 0; 
        var percentDecreases = 0; 
        var percentOuts = 0; 

        //Egresos diversos
        var variousExpenses = 0;

        var noResults = false;

        //diferencial total de las ventas al mayor
        var totalWholesaleDifferentialSum = 0;
        var totalWholesaleDiscountDifferentialSum = 0;
        var totalWholesalesSum = 0;
        var totalInCreditSum = 0;
        var totalInCreditDifferentialSum = 0;

        // Diferencial total por combos
        var totalComboDifferentialSum = 0;
        // Diferencial total por cupón (detal/detal fiscal)
        var totalCouponDifferentialSum = 0;

        await Promise.all(DataResult.map(async (inventory) => {
            initialAmountSum += inventory.initialAmount;//Inicial
            totalInAmountSum += inventory.totalInAmount;//Compras
            totalSellAmountSum += inventory.totalSellAmount;//Ventas
            //Manejo de recortes
            if(inventory.product.code == '31' || inventory.product.code == '32'){
                totalCutInSum += inventory.totalCutAmount;
            }else{
                totalCutOutSum += inventory.totalCutAmount;
            }
            totalCutAmountSum += inventory.totalCutAmount;//Recortes
            totalDecreaseAmountSum += inventory.totalDecreaseAmount;//Mermas
            totalOutAmountSum += inventory.totalOutAmount;//Salidas
            //TotalAmountSum += inventory.TotalAmount;//Total Aritmentico
            physicalAmountSum += inventory.physicalAmount;//Inventario fisico
            totalAdjustmentAmountSum += inventory.totalAdjustmentAmount;//Ajustes

            //totales de mermas detallados
            totalPackingSum +=  inventory.totalPackingAmount;
            totalReweighSum +=  inventory.totalReweighAmount;
            totalMincemeatSum +=  inventory.totalMincemeatAmount;
            
            //totales de salidas detallados
            totalDonationSum += inventory.totalDonationAmount;
            totalTastingSum += inventory.totalTastingAmount;
            totalPackagingSum += inventory.totalPackagingAmount;
            totalCouponSum += inventory.totalCouponAmount;
            totalCorrectionSum += inventory.totalCorrectionAmount;
            totalTransferSum += inventory.totalTransferAmount;
            totalTransferToFattSum += inventory.totalTransferToFattAmount || 0;

            //totales de los valores correspondientes a las ventas al mayor
            totalWholesaleDifferentialSum += inventory.totalWholesaleDifferential;
            totalWholesaleDiscountDifferentialSum += inventory.totalWholesaleDiscountDifferential;
            totalWholesalesSum += inventory.totalWholesalesAmount;
            totalInCreditSum += inventory.totalInCreditAmount;
            totalInCreditDifferentialSum += inventory.totalInCreditDifferential;
            
            //total de los diferenciales por combos
            totalComboDifferentialSum += inventory.totalComboDifferential;
        }));


        if(DataResult.length > 0){
            noResults = true
            try {
                //total recortes
                totalCutAmountSum = Math.abs(totalCutOutSum-totalCutInSum);
                //total aritmetico 
                TotalAmountSum = initialAmountSum+totalInAmountSum-totalSellAmountSum-totalCutAmountSum-totalDecreaseAmountSum-totalOutAmountSum;
                //porcentaje
                totalPercent = ((Math.abs(totalAdjustmentAmountSum)*100)/TotalAmountSum);

                inventoryGross = initialAmountSum+totalInAmountSum;
                initialMinusSell = Math.abs(inventoryGross-totalSellAmountSum);

                if(totalSellAmountSum> 0){
                    percentCut = parseFloat((totalCutAmountSum/totalSellAmountSum).toFixed(2));
                    percentDecreases = parseFloat((totalDecreaseAmountSum/totalSellAmountSum).toFixed(2));
                    percentOuts = parseFloat((totalOutAmountSum/totalSellAmountSum).toFixed(2));
                }

                //egresos diversos recortes+mermas+salidas
                variousExpenses = totalCutAmountSum+totalDecreaseAmountSum+totalOutAmountSum;
            } catch (error) {
                
            }
        }

        let currentDate = moment().utc().format("YYYY-MM-DD")

        if(inventoryParam.filters.startDate){
            currentDate =  moment(inventoryParam.filters.startDate).utc().format("YYYY-MM-DD")
        }

        let agencyName = "TODAS";
        
        if(inventoryParam.filters.agency){
            const agency = await Agency.findById(inventoryParam.filters.agency);

            if(agency){
                agencyName = agency.name;
            }
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            const agency = await Agency.findById(inventoryParam.user.agency);

            if(agency){
                agencyName = agency.name;
            }
        }

        // Se busca la tasa del BCV del dia para obtener los valores en dólares para las ventas al mayor
        let stagesSales = {};
        
        //Filtros para la consulta
        if (inventoryParam.filters.startDate){

            const startDate =  moment(inventoryParam.filters.startDate).utc().subtract(4, 'days').startOf('day');
            const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
    
            stagesSales.createdDate = { $gte: new Date(startDate), $lte: new Date(endDate) } 
            
        }else{
            
            const startDate =  moment().subtract(3, 'days').startOf('day');
            const endDate =  moment().endOf('day');

            stagesSales.createdDate = { $gte: new Date(startDate), $lte: new Date(endDate) } 
        }

        const sales = await Sales.findOne(stagesSales).sort({createdDate: -1});

        let valueDollar = (sales && sales.valueDollar != null) ? sales.valueDollar : 0;

        //Si ha habido pagos de créditos creados ese mismo dia, se resta al total por créditos
        let creditStages = {}

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            creditStages.agency = new ObjectId(inventoryParam.user.agency)
        }

        if(inventoryParam.filters.agency){
            creditStages.agency = new ObjectId(inventoryParam.filters.agency)
        }

        if(inventoryParam.filters.startDate){

            const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
            const endDate =  moment(inventoryParam.filters.startDate).utc().endOf('day');
    
            creditStages.createdDate = { $gte: new Date(startDate), $lte: new Date(endDate) }    
        
        }else{

            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            
            creditStages.createdDate = { $gte: new Date(startDate), $lte: new Date(endDate) } 
        }       

        const result = await PendingPayments.find(creditStages)
        
        // Si hubo pagos pendientes el dia
        if (JSON.stringify(result) !== '[]') { //    

            result.forEach((pendingPayment) => {

                //Si sí hay pagos
                if (pendingPayment.payments.length !== 0){

                    pendingPayment.payments.forEach((payment) => {

                        if (moment(payment.createdDate).day() == moment(inventoryParam.filters.startDate).day()){

                            totalInCreditSum -= payment.total * valueDollar 
                        }
                    }) 
                }
            })
        }

        // Diferencial por cupón: suma de couponDiscount convertido a dólares usando la tasa de cada venta
        const couponMatchSaved = { createdDate: creditStages.createdDate };
        if (creditStages.agency) couponMatchSaved.agency = creditStages.agency;
        const couponResultSaved = await Sales.aggregate([
            { $match: couponMatchSaved },
            {
                $group: {
                    _id: null,
                    totalCouponDifferential: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $ne: [{ $ifNull: ["$couponDiscount", 0] }, 0] },
                                    { $ne: [{ $ifNull: ["$valueDollar", 0] }, 0] }
                                ]},
                                { $divide: [{ $ifNull: ["$couponDiscount", 0] }, { $ifNull: ["$valueDollar", 1] }] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        totalCouponDifferentialSum = (couponResultSaved[0] && couponResultSaved[0].totalCouponDifferential) ? couponResultSaved[0].totalCouponDifferential : 0;

        // Total de clientes = tickets del día (misma fuente que historial forma de pago)
        const totalClientsResultSaved = await Sales.aggregate([
            { $match: couponMatchSaved },
            { $count: "totalClients" }
        ]);
        const totalClientsSumSaved = totalClientsResultSaved[0]?.totalClients ?? 0;

        
        let DataBalance = []
        DataBalance.push({name:"Fecha", value: currentDate });//0
        DataBalance.push({name:"Sucursal", value: agencyName });//1
        DataBalance.push({name:"Inventario inicial", value: initialAmountSum });//2
        DataBalance.push({name:"Envios", value: totalInAmountSum });//3
        DataBalance.push({name:"Ventas", value: totalSellAmountSum });//4
        DataBalance.push({name:"Recorte", value: totalCutAmountSum });//5
        DataBalance.push({name:"Mermas", value: totalDecreaseAmountSum });//6
        DataBalance.push({name:"Salidas", value: totalOutAmountSum });//7
        DataBalance.push({name:"Debe haber", value: TotalAmountSum });//8
        DataBalance.push({name:"Inventario final", value: physicalAmountSum });//9
        DataBalance.push({name:"Faltante", value: Math.abs(totalAdjustmentAmountSum) });//10
        DataBalance.push({name:"%", value: totalPercent });//11

        //Nuevos campos y detalles
        DataBalance.push({name:"Inventario bruto", value: inventoryGross });//12
        DataBalance.push({name:"INICIAL - VENTAS", value: initialMinusSell });//13
        DataBalance.push({name:"Porcentaje recortes", value: percentCut });//14
        DataBalance.push({name:"Porcentaje mermas", value: percentDecreases });//15 
        DataBalance.push({name:"Empaque", value: totalPackingSum });//16
        DataBalance.push({name:"Humedad", value: totalReweighSum });//17
        DataBalance.push({name:"Picadillo", value: totalMincemeatSum });//18
        //detalles salidas
        DataBalance.push({name:"Donacion", value: totalDonationSum });//19
        DataBalance.push({name:"Degustacion", value: totalTastingSum });//20
        DataBalance.push({name:"Empaques", value: totalPackagingSum });//21
        DataBalance.push({name:"Vale", value: totalCouponSum });//22
        DataBalance.push({name:"Correccion", value: totalCorrectionSum });//23
        DataBalance.push({name:"Traslado", value: totalTransferSum });//24

        DataBalance.push({name:"Porcentaje salidas", value: percentOuts });//25
        DataBalance.push({name:"EGRESOS DIVERSOS", value: variousExpenses });//26
        //  Detalles de las ventas al mayor
        DataBalance.push({name:"Ventas al mayor", value: totalWholesalesSum });//27
        DataBalance.push({name:"Ventas al detal", value: (totalSellAmountSum-totalWholesalesSum)});//28
        DataBalance.push({name:"Total en credito", value: (totalInCreditSum-totalInCreditDifferentialSum) });//29
        DataBalance.push({name:"Dif. Ventas al mayor", value: totalWholesaleDifferentialSum });//30
        // Ventas reales = Total ventas (en $) menos la suma de TODOS los diferenciales
        // Combos y cupón en $; wholesale y wholesaleDiscount en Bs
        const totalSellAmountSumDollarSaved = valueDollar > 0
            ? (totalSellAmountSum < valueDollar ? totalSellAmountSum : totalSellAmountSum / valueDollar)
            : 0;
        const totalAllDifferentialsDollarSaved = valueDollar > 0
            ? ((totalWholesaleDifferentialSum + totalWholesaleDiscountDifferentialSum) / valueDollar) + totalComboDifferentialSum + totalCouponDifferentialSum
            : totalComboDifferentialSum + totalCouponDifferentialSum;
        const ventasRealesDollarSaved = Math.max(0, Math.round((totalSellAmountSumDollarSaved - totalAllDifferentialsDollarSaved) * 100) / 100);
        DataBalance.push({name:"Ventas reales", value: ventasRealesDollarSaved });//31
        //  Valor de la tasa BCV del dia
        DataBalance.push({name:"Tasa BCV", value: valueDollar });//32
        //  Diferencial total por venta de combos
        DataBalance.push({name:"Dif. por venta de combos", value: totalComboDifferentialSum });//33
        //  Diferencial por descuento en ventas al mayor
        DataBalance.push({name:"Dif. por descuento en ventas al mayor", value: totalWholesaleDiscountDifferentialSum });//34
        //  Diferencial por cupón (detal/detal fiscal) - ya está en dólares
        DataBalance.push({name:"Dif. por cupón", value: totalCouponDifferentialSum });//35
        DataBalance.push({name:"Traslado a fabrica", value: totalTransferToFattSum });//36
        DataBalance.push({name:"Total de diferenciales", value: totalAllDifferentialsDollarSaved });//37
        DataBalance.push({name:"Total de clientes", value: totalClientsSumSaved });//38
        
        return {
            results: DataBalance,
            metadata: noResults
        }
    },

     /**
     * Reporte de inventarios diario
     */
    dataTableInventoryReportDaily: async (inventoryParam) => {

        const startDate =  moment().startOf('day');
        const endDate =  moment().endOf('day');

        let dataResult = [];
        const products = await Product.find().sort({ createdDate: -1 })

        let stages = [
            { $sort : { createdDate : -1 } }
        ];

        if(inventoryParam.user.role == role.rol.Manager || inventoryParam.user.role == role.rol.Cashier || inventoryParam.user.role == role.rol.Telesales || inventoryParam.user.role == role.rol.Auditor){
            stages.unshift(
                { $match : { _id: ObjectId(inventoryParam.user.agency) } },
            );
        }

        const agencies = await Agency.aggregate(stages);

        for (let agency of agencies) {

            for (let product of products) {
                
                await InventoryRecord.aggregate([
                    { $match: { createdDate: {$gte: new Date(startDate), $lt: new Date(endDate)},  product: { $eq: product._id }, agency: { $eq: agency._id } } }, 
                    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
                    { $unwind: '$product' },
                    { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
                    { $unwind: '$agency' },
                    { $group : {
                            _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                            totalOutAmount: { $sum: "$out" },
                            totalSell: {
                                $sum: { $cond: [{ $eq: ["$type", enumOut.out.sale] }, "$out", 0] }
                            },
                            //total entradas sin el inicial
                            totalIn: {$sum: { $cond: [ {$and : [ { $eq: [ "$type", 0] },//solo compras 
                                { $eq: [ "$isInit",false] }//sin inicial
                            ]},"$in", 0 ]}},
                            //total salidas de mermas
                            totalDecrease: {
                                $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh, enumOut.out.decrease, enumOut.out.mincemeat ]] }, "$out", 0] }
                            },
                            //total salidas por  degustación, empaques, donación, vales, correcciones, traslados y recortes
                            totalOut: {
                                $sum: { $cond: [{ $in: ["$type", [ enumOut.out.packaging,  enumOut.out.tasting, enumOut.out.donation
                                    , enumOut.out.coupon, enumOut.out.correction, enumOut.out.transfer, enumOut.out.transferToFatt ]] }, "$out", 0] }
                            },
                            //Total de recorte
                            totalCut: { $sum: "$cut" },
                            product: { $first: '$product' },
                            date: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                            agency: { $first: '$agency' }
                        }
                    },
                    { $sort : { date : -1 }}
                ], function(err, result) {

                    if(result.length > 0){
                        dataResult.push(result[0]);
                    }else{

                        let empty = {
                            "_id": {
                                "createdDate": moment(startDate).format('YYYY-MM-DD')
                            },
                            "totalOutAmount": 0,
                            "totalSell": 0,
                            "totalIn": 0,
                            "totalOut": 0,
                            "product": product,
                            "date": moment(startDate).format('YYYY-MM-DD'),
                            "agency": agency,
                            "initial": 0,
                            "totalCut": 0,
                            "totalDecrease":0,
                            "physicalQuantity":0,
                            "TotalQuantity": 0
                        }
                        dataResult.push(empty);
                    }
                  
                });

            }
        }
                
        //Buscar inventario inicial por producto 
        await Promise.all(dataResult.map(async (inventory) => {

            try {

                const endDate =  moment(inventory.date).subtract(1, 'days').endOf('day');

                //Consultar ultima operacion del dia anterior
                const dataDayBefore = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $lt: new Date(endDate)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                //Fecha del registro: inicio y fin del dia
                const dayStart = moment(inventory.date).utc().startOf('day');
                const dayEnd = moment(inventory.date).utc().endOf('day');

                //TotalQuantity: Consultar ultima operacion registrada para obtener el total
                //Y que no sea inventario fisico : 7
                let totalArithmetic = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id,
                    type: { $ne: enumOut.out.adjustment },//sin ajuste
                    createdDate:{ $gte: new Date(dayStart), $lte: new Date(dayEnd)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                //Si no hay total aritmetico el dia actual tomo el del dia anterior no importa si es de tipo ajuste  
                if(!totalArithmetic){
                    totalArithmetic = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id,
                        createdDate:{ $lt: new Date(endDate)} 
                    }).sort({ createdDate: -1 });
                }

                //Consultar ultima operacion registrada para obtener el total
                const physicalTotal = await AdjustmentRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $gte: new Date(dayStart), $lte: new Date(dayEnd) } 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                //inventario fisico ingresado y ajuste
                let physical = 0;
                let totalAdjustment = 0;

                if(physicalTotal){
                    physical = physicalTotal.kg;
                    totalAdjustment = physicalTotal.kg - (totalArithmetic ? totalArithmetic.total:0);
                }
                
                //1. Aritmetico del dia anterior
                if(dataDayBefore){
                    return Object.assign(inventory, { initial: dataDayBefore.total, totalAdjustment, physicalQuantity: physical, TotalQuantity: totalArithmetic ? totalArithmetic.total:0 });
                }

                //2. Si no hay operaciones el dia anterior 
                if(!dataDayBefore){
                    
                    const actualDate = moment(inventory.date).format('YYYY-MM-DD');
                    //2.1. Se consulta primer registro del dia actual
                    //Esto quiere decir que es la primera subida de inventario en la bd
                    const currentData = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id, 
                        createdDate:{ $gte: new Date(actualDate)} 
                    }).sort({ createdDate: 1 });//ordenado fecha asc y tomar ese documento

                    //2.2. Si hay operaciones el dia actual
                    if(currentData){
                        return Object.assign(inventory, { initial: currentData.total, totalAdjustment, physicalQuantity: physical, TotalQuantity: totalArithmetic? totalArithmetic.total:0 });
                    }else{
                        //2.3. Si no hay operaciones el dia actual todo en 0
                        return Object.assign(inventory, { initial: 0, totalAdjustment, physicalQuantity: physical, TotalQuantity:0 });
                    }
                }

            } catch(err) {
                throw err;
            }

        }));

       
        return {
            results: dataResult, 
        }

    },

    /**
     * Reporte de inventarios sin salidas 
     * 
     * Inventario bruto
     */
    dataTableInventoryReportPlus: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex; 

        //orden por defecto
        var sortBy = { "_id.createdDate" : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1

            if(inventoryParam.sortBy.id == "date"){
                sortBy = { "_id.createdDate" : direction } 
            }else{
                sortBy = { [inventoryParam.sortBy.id] : direction } 
            }
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        //agrupar por fecha, producto, agencia
        let stages = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'},},
            { $unwind: '$agency'},
            { $group : {
                    _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                    totalOutAmount: { $sum: "$out" },
                    totalSell: {
                        $sum: { $cond: [{ $eq: ["$type", enumOut.out.sale] }, "$out", 0] }
                    },
                    //total entradas sin el inicial
                    totalIn: {$sum: { $cond: [ {$and : [ { $eq: [ "$type", 0] },//solo compras 
                                               { $eq: [ "$isInit",false] }//sin inicial
                                    ]},"$in", 0 ]}},
                    /**
                     * total salidas por merma, repesaje, degustación, empaques
                     * No se muestra en el reporte 
                     */
                    totalOut: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh, enumOut.out.decrease, enumOut.out.packaging, enumOut.out.tasting, enumOut.out.donation  ]] }, "$out", 0] }
                    },
                    //Total de recorte
                    totalCut: { $sum: "$cut" },
                    product: { $first: '$product' },
                    date: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                    agency: { $first: '$agency' }
                }
            },
            
            { $sort : sortBy }
        ];

       //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (inventoryParam.filters) {

             //Si hay filtro de sucursal
             if(inventoryParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const inventories = await InventoryRecord.aggregate(stages);

        let DataResult = inventories;

        if(!inventoryParam.isExcel){
            DataResult = inventories[0].data;
        }

        //Buscar inventario inicial por producto 
        await Promise.all(DataResult.map(async (inventory) => {

            try {

                const endDate = moment(inventory.date).format('YYYY-MM-DD');

                //Buscar ultimo documento registrado el dia anterior
                const dataDayBefore = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $lt: new Date(endDate)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento

                 /**
                 * TotalQuantity el total se toma del ultimo registro 
                 */
                const day =  moment(inventory.date).utc().endOf('day');
                //Buscar ultimo documento para obtener el total
                const totalProduct = await InventoryRecord.findOne({ 
                    product:inventory.product._id, 
                    agency:inventory.agency._id, 
                    createdDate:{ $lte: new Date(day)} 
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                //Cantidad total es el total + salida (duh)
                let totalQ = totalProduct.total;

                totalQ = parseFloat(totalQ)+parseFloat(inventory.totalOut);

                //Si hay data asigno initial con el valor total de la mercancia
                if(dataDayBefore){
                    return Object.assign(inventory, { initial: dataDayBefore.total, TotalQuantity: parseFloat(totalQ.toFixed(3))});
                }else{

                    const startDate = moment(inventory.date).format('YYYY-MM-DD');

                    //Si no hay data se consulta primer registro del dia actual
                    //Esto quiere decir que es la primera subida de inventario en la bd
                    const currentData = await InventoryRecord.findOne({ 
                        product:inventory.product._id, 
                        agency:inventory.agency._id, 
                        createdDate:{ $gte: new Date(startDate)} 
                    }).sort({ createdDate: 1 });//ordenado fecha asc y tomar ese documento

                    if(currentData){
                        let initTotal = currentData.total;
                        return Object.assign(inventory, { initial: initTotal, TotalQuantity: parseFloat(totalQ.toFixed(3))});
                    }else{
                        return Object.assign(inventory, { initial: 0, TotalQuantity:0 });
                    }
                }

            } catch(err) {
                throw err;
            }

        }));

        return {
            results: DataResult, 
            metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
        }
    },

    /**
     * Detalle de salidas del reporte de inventarios
     * 
     * Consulta de salidas de inventario
     * 
     */
    detailDepartures: async (inventoryParam) => {

        //Fecha de la fila del reporte de inventario
        const startDate =  moment(inventoryParam.date).utc().startOf('day');
        const endDate =  moment(inventoryParam.date).utc().endOf('day');

        //parametros del query
        //fecha 
        const query = {
            createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)}
        }

        query.product = ObjectId(inventoryParam.product);
        query.agency = ObjectId(inventoryParam.agency);

        //Lista de Salidas por empaques, degustación, donación, vales, corrección o traslado
        var listDepartures = [ enumOut.out.packaging, enumOut.out.tasting, enumOut.out.donation, 
            enumOut.out.coupon, enumOut.out.correction, enumOut.out.transfer, enumOut.out.transferToFatt];

        query.type = { $in: listDepartures };

        //Consultar y hacer lean para devolver array de objetos javascript 
        const inventories = await InventoryRecord.find(query).sort({ createdDate: -1 }).lean();

        //Calcular total y subtotal por cada registro en caso de monedas
        let totalOut = 0;
        inventories.map((inventory) => {
            totalOut += inventory.out;
            return Object.assign(inventory, { description: enumOut.description[parseInt(inventory.type)] });
        });

        return {
            results: inventories,
            totalOut
        }
    },

    /**
     * Detalle de mermas del reporte de inventarios
     * 
     * Consulta de salidas de inventario
     * 
     */
    detailDecreases: async (inventoryParam) => {

        //Fecha de la fila del reporte de inventario
        const startDate =  moment(inventoryParam.date).utc().startOf('day');
        const endDate =  moment(inventoryParam.date).utc().endOf('day');

        const product = inventoryParam.product;
        const agency = inventoryParam.agency;
        //parametros del query

        const inventories = await InventoryRecord.aggregate([
            //Buscar por fecha, producto y sucursal
            {
                $match: {
                    createdDate: {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate)
                    },
                    product: ObjectId(product),
                    agency: ObjectId(agency),
                }
            },
            {
                $group : {
                    _id: { createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                    //Merma por empaque
                    totalDecrease: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.decrease ]] }, "$out", 0] }
                    },
                    //Merma por humedad
                    totalReweigh: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.reweigh ]] }, "$out", 0] }
                    },
                    //Merma por picadillo
                    totalMincemeat: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.mincemeat ]] }, "$out", 0] }
                    },
                    total: {
                        $sum: { $cond: [{ $in: ["$type", [ enumOut.out.decrease,  enumOut.out.reweigh, enumOut.out.mincemeat ]] }, "$out", 0] }
                    },
                    date: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                }
            },
            {
                $sort: {
                    date: -1
                }
            }
        ]);

        return {
            results: inventories
        }
    },


     /**
     * Detalle de recortes del reporte de inventarios
     * 
     * Consulta de salidas de inventario
     * 
     */
    detailCut: async (inventoryParam) => {

        //Fecha de la fila del reporte de inventario
        const startDate =  moment(inventoryParam.date).utc().startOf('day');
        const endDate =  moment(inventoryParam.date).utc().endOf('day');
        
        //parametros del query
        const code = inventoryParam.code;
        const agency = inventoryParam.agency;

        //Verificar el código de producto
        //Y obtener el array adecuado de productos a filtrar
        //Si por recortes de jamón o ahumados
        let arrayCodes = [];
        if(code==31){
            arrayCodes = cutOut.cutOutHam;
        }else{
            arrayCodes = cutOut.cutOutAhm;
        }
    
        const inventories = await InventoryRecord.aggregate([
            //Buscar por fecha, sucursal y tipo recorte de salida
            {
                $match: {
                    createdDate: {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate)
                    },
                    agency: ObjectId(agency),
                    type: enumOut.out.cutout
                }
            },
            //Join con productos
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'product'
                },
            },
            {
                $unwind: '$product',
            },
            //Match por tipo de recorte
            { $match: {'product.code': { $in: arrayCodes }}},
            {
                $sort: {
                    date: -1
                }
            }
        ]);

        //Calcular total de todos los recortes
        let totalCut = 0;
        inventories.map((inventory) => {
            totalCut += inventory.cut;
        });

        return {
            results: inventories,
            totalCut
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
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){
            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id] : direction } 
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        let stages = []
        
        // Si únicamente se piden los ajustes finales
        if (inventoryParam.filters.finalAdjustments){
            stages = [
                { $match :  {$expr: { $and: [   { $ne: [  { $hour: "$createdDate" }, 23] },
                                                { $ne: [  { $minute: "$createdDate" }, 59] },
                                                { $ne: [  { $second: "$createdDate" }, 59] },  ]
                                    }
                            }
                },
                { $group : {
                    _id: { agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                    user: { $last: '$user' },
                    product: { $last: '$product' },
                    agency: { $last: '$agency' },
                    kg: { $last: '$kg' },
                    createdDate: { $last: '$createdDate' } }
                },
                { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
                { $unwind: '$product' },
                { $match : { "product.code": productCode }},
                { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
                { $unwind: '$agency'},
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                { $unwind: '$user'},
                { $unset: [ "user.hash", "user.createdDate" ] },//Remover pass user y createdDate
                { $sort : sortBy },
            ];
        }
        else{
            stages = [
                { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
                { $unwind: '$product' },
                { $match : { "product.code": productCode }},
                { $match :  {$expr: { $and: [   { $ne: [  { $hour: "$createdDate" }, 23] },
                                                { $ne: [  { $minute: "$createdDate" }, 59] },
                                                { $ne: [  { $second: "$createdDate" }, 59] },  ]
                                    }
                            }
                },
                { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
                { $unwind: '$agency'},
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                { $unwind: '$user'},
                { $unset: [ "user.hash", "user.createdDate" ] },//Remover pass user y createdDate
                { $sort : sortBy },
            ];
        }
        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){ 
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            //Si hay filtro de usuario
            if(inventoryParam.filters.idUser){ 
                stages.unshift(
                    { $match : { user: ObjectId(inventoryParam.filters.idUser) } },
                );
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const inventories = await AdjustmentRecord.aggregate(stages);

        return {
            results: !inventoryParam.isExcel ? inventories[0].data: inventories, 
            metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
        }
    },


    /**
     * Reporte de ofertas
     */
    reportOffers: async (inventoryParam) => {

        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){

            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id] : direction } 
            
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(inventoryParam.filters.code){
            productCode =  { $eq: inventoryParam.filters.code }
        }

        //agrupar por fecha, producto, agencia y donde existan salidas "out" y sea de tipo sale o venta
        let stages = [ 
            { $match : { isOffer: true }},//solo ofertas
            { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale } } },
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product'} },
            { $unwind: '$product' },
            { $group : {
                    _id: { product: '$product._id', agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" }}},
                    totalOutAmount: { $sum: "$out" },
                    totalCash : { $sum : {  $multiply : ["$price", "$out"] } },
                    totalCashRegular : { $sum : {  $multiply : ["$regularPrice", "$out"] } },
                    differential: { $sum: "$differential" },
                    product: { $first: '$product' },
                    createdDate: { $first: {$dateToString: {format: "%G-%m-%d", date: "$createdDate"}} },
                    agency: { $first: '$agency' }
                }
            },
            { $match : { "product.code": productCode }},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'}},
            { $unwind: '$agency'},
            { $sort : sortBy }
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //stage del total 
        let stageTotal = [ 
            { $match : { isOffer: true }},//solo ofertas
            { $match : { "out": { $gt: 0 }, "type": { $eq:enumOut.out.sale } } },
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product'} },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $group : { _id: null, totalAmount: { $sum: {  $multiply : ["$price", "$out"] } } } } 
        ];

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
            stageTotal.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (inventoryParam.filters) {

            //Si hay filtro de sucursal
            if(inventoryParam.filters.agency){
               
               stages.unshift(
                   { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
               );
               stageTotal.unshift(
                   { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
               );
           }

           //Si hay filtro de tipo de salida
           if(inventoryParam.filters.type){
               
               stages.unshift(
                   { $match : { type: parseInt(inventoryParam.filters.type) } },
               );
               stageTotal.unshift(
                   { $match : { type: parseInt(inventoryParam.filters.type) } },
               );
           }

           //filtro por nombres
           if(inventoryParam.filters.names){
               let regex = new RegExp(inventoryParam.filters.names,'gi');
               stages.unshift(
                   { $match: { names: { $regex: regex } } },
               );
               stageTotal.unshift(
                   { $match: { names: { $regex: regex } } },
               );
           }

           //filtro por teléfono
           if(inventoryParam.filters.phone){
               let regex = new RegExp(inventoryParam.filters.phone,'gi');
               stages.unshift(
                   { $match: { phone: { $regex: regex } } },
               );
               stageTotal.unshift(
                   { $match: { phone: { $regex: regex } } },
               );
           }

           //filtro por comentario
           if(inventoryParam.filters.comment){
               let regex = new RegExp(inventoryParam.filters.comment,'gi');
               stages.unshift(
                   { $match: { comment: { $regex: regex } } },
               );
               stageTotal.unshift(
                   { $match: { comment: { $regex: regex } } },
               );
           }

           if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
               const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
               stages.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate) } } },
               );
               stageTotal.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate) } } },
               );
           }

           if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
               const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
               stages.unshift(
                   { $match: { createdDate: { $lte: new Date(endDate) } } },
               );
               stageTotal.unshift(
                   { $match: { createdDate: { $lte: new Date(endDate) } } },
               );
           }

           if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
               const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
               const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
               stages.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
               );
               stageTotal.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
               );
           }

       }

       //Si todos los filtros son vacios se consulta la fecha actual
       if(!inventoryParam.filters.code && !inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
           const startDate =  moment().startOf('day');
           const endDate =  moment().endOf('day');
           stages.unshift(
               { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
           );
           stageTotal.unshift(
               { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
           );
       }

       const inventories = await InventoryRecord.aggregate(stages);

       let total = [];
       
       if(!inventoryParam.isExcel){

           //Sumar total si las fechas se definieron o si es el día actual
           if((inventoryParam.filters.startDate && inventoryParam.filters.endDate) || (!inventoryParam.filters.startDate && !inventoryParam.filters.endDate)){
               //Total del resultado
               total = await InventoryRecord.aggregate(stageTotal);
           }
           
       }

       return {
           results: !inventoryParam.isExcel ? inventories[0].data: inventories, 
           metadata: !inventoryParam.isExcel ? inventories[0].metadata: [], 
           total
       }

    },

    dataTableEntryHistory: async (inventoryParam) => {


        // resultados por página
        const pageSize = inventoryParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = inventoryParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(inventoryParam.sortBy){
            let direction = inventoryParam.sortBy.desc == true ? -1 : 1
            sortBy = { [inventoryParam.sortBy.id] : direction } 
        }

        let stages = [
            { $match : { "type": { $eq: 0 } } },
            { $match :  {$expr: { $and: [   { $ne: [  { $hour: "$createdDate" }, 0o0] },
                                                { $ne: [  { $minute: "$createdDate" }, 30] },  ]
                                    }
                            }
            },
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product'} },
            { $unwind: '$product'},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            // Nuevo: exponer company como campo de primer nivel para el front
            { $addFields: { company: '$agency.company' } },
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!inventoryParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(inventoryParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(inventoryParam.user.agency) } },
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
            if(inventoryParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(inventoryParam.filters.agency) } },
                );
            }

            if(inventoryParam.filters.startDate && !inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.startDate && inventoryParam.filters.endDate){
                const startDate =  moment(inventoryParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(inventoryParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

            if(inventoryParam.filters.searchType){

                if (inventoryParam.filters.searchType === "dispatch"){
                    stages.unshift(
                        { $match : { "typeIn": { $eq: enumIn.in.dispatch } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "externProvider"){
                    stages.unshift(
                        { $match : { "typeIn": { $eq: enumIn.in.externProvider } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "storeRelocation"){
                    stages.unshift(
                        { $match : { "typeIn": { $eq: enumIn.in.storeRelocation } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "correction"){
                    stages.unshift(
                        { $match : { "typeIn": { $eq: enumIn.in.correction } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "return"){
                    stages.unshift(
                        { $match : { "typeIn": { $eq: enumIn.in.return } } },
                    );
                }
                else if (inventoryParam.filters.searchType === "wholesaleReturn"){
                    stages.unshift(
                        { $match : { "typeIn": { $eq: enumIn.in.wholesaleReturn } } },
                    );
                }
            }
        }

        if(!inventoryParam.filters.startDate && !inventoryParam.filters.endDate && !inventoryParam.filters.company){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const inventory = await InventoryRecord.aggregate(stages);

        return {
            results: !inventoryParam.isExcel ? inventory[0].data: inventory, 
            metadata: !inventoryParam.isExcel ? inventory[0].metadata: [], 
        }
    },

}

module.exports = inventoryService;