const db = require('../_helpers/db');
const Departure = db.Departure;
const Inventory = db.Inventory;
const InventoryRecord = db.InventoryRecord;
const Product = db.Product;
const Agency = db.Agency;
const enumOut = require('../enums/typeOut.enum');
const cutOut = require('../enums/cutout.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const role = require('../enums/roles.enum');

let departureService = {

    /**
     * Función para registrar salidas
     * 
     * @param {params} depParam 
     */
    create: async (depParam) => {

        
        let products = [];
        let type = depParam.type;

        //Obtener descripcion del tipo de salida
        let typeDescription = enumOut.description[parseInt(depParam.type)];
        depParam.typeDescription = typeDescription;

        /**
         * Recorrer cada producto y crear un array de productos para las salidas
         */
        for (let item of depParam.items) {
           
            //sacar diferencial si es oferta
            let differential = item.isOffer ? ((parseFloat(item.kg) * item.regularPrice) - (parseFloat(item.kg) * item.price)) : 0;

            let poductParam = {
                name: item.name,
                price: item.price,
                regularPrice: item.regularPrice,//precio regular si es oferta
                differential: differential.toFixed(3), 
                kg:item.kg,
                isOffer: item.isOffer,
                total:item.total
            }
            products.push(poductParam);
            
            //Verificar que el producto exista
            let product = await Product.findById(item.id);
            if (!product) {
                throw (`El producto ${item.name} no existe.`);
            }
            
            //Registrar salida de cada producto en inventario
            let inventory = await Inventory.findOne({ product:item.id, agency:depParam.agency }).populate('product');

            //Si se encuetra en el inventario se editan los valores para un nuevo historial
            if(inventory){

                // Verificar que el producto exista en el inventario
                if (!inventory.product) {
                    throw (`El producto ${item.name} no existe en el inventario.`);
                }

                // Verificar stock suficiente - No se permite stock negativo
                let availableStock = parseFloat(inventory.kg.toFixed(2)); // Convertir kg a número
                let requestedKg = parseFloat(item.kg); // Convertir cantidad solicitada a número

                // Verificar si hay suficiente stock
                if (availableStock < 0) {
                    throw (`El producto ${item.name} no tiene stock disponible.`);
                }

                if (availableStock < requestedKg) {
                    throw (
                        `No hay suficiente stock de ${item.name}. Disponible: ${availableStock} kg, Requerido: ${requestedKg} kg.`
                    );
                }

                    //Registrar en historial de inventario

                    //lo que hay actualmente menos lo que 
                    let inv = inventory.kg.toFixed(3)
                    let total = parseFloat(inv) - parseFloat(item.kg);
                    
                    // Validación adicional: asegurar que el total no sea negativo
                    if (total < 0) {
                        throw (
                            `No hay suficiente stock de ${item.name}. Disponible: ${availableStock} kg, Requerido: ${requestedKg} kg.`
                        );
                    }
                    let inventoryParam = {};
                    inventoryParam.product = item.id;
                    inventoryParam.agency = depParam.agency;
                    inventoryParam.kg = inventory.kg.toFixed(3);//arrastrar kg anterior;
                    inventoryParam.in = 0;//entrada 0
                    inventoryParam.out = type == enumOut.out.cutout ? 0 : item.kg.toFixed(3); //Salida
                    inventoryParam.total = total.toFixed(3);
                    inventoryParam.note = ' ';
                    inventoryParam.cut = type == enumOut.out.cutout ? item.kg.toFixed(3) : 0; //Salida por recorte
                    inventoryParam.comment = depParam.comment ? depParam.comment : '';
                    inventoryParam.type = type;
    
                    const record = new InventoryRecord(inventoryParam);
                    await record.save();
    
                    //Actualizar total en inventario
                    await Inventory.findOneAndUpdate({ product:item.id, agency:depParam.agency }, { kg:total });
    
                    /**
                     * Descontar mermas si no es de tipo corrección, traslado ó recorte
                     * de lo contrario si aplica la merma por empaque ó picadillo
                     */
                    if(type != enumOut.out.correction && type != enumOut.out.transfer && type != enumOut.out.cutout && type != enumOut.out.transferToFatt){
    
                        try{
                            //Si es merma por empaque o picadillo
                            if(inventory.product && (inventory.product.decrease || inventory.product.mincemeat)){
    
                                //Por defecto es 0.012 a merma de empaque
                                let average = 0.012;
                                let typeOut = enumOut.out.decrease;
                                // promedio si es picadillo
                                if(inventory.product.mincemeat){
                                    average = 0.010;
                                    typeOut = enumOut.out.mincemeat;
                                }
    
                                //Marcar salida de inventario en historial por merma o picadillo
                                let totalDecrease = total - average * parseFloat(item.kg);//.012
                                let decrease = average * parseFloat(item.kg);
    
                                let decreaseParam = {};
                                decreaseParam.product = item.id;
                                decreaseParam.agency = depParam.agency;
                                decreaseParam.kg = total;//arrastrar kg anterior;
                                decreaseParam.in = 0;//entrada 0
                                decreaseParam.out = decrease.toFixed(3); //Salida
                                decreaseParam.total = totalDecrease.toFixed(3);
                                decreaseParam.note = ' ';
                                decreaseParam.comment = '';
                                decreaseParam.type = typeOut;
    
                                const recordDecrease = new InventoryRecord(decreaseParam);
                                await recordDecrease.save();
    
                                //Actualizar total en inventario
                                await Inventory.findOneAndUpdate({ product:item.id, agency:depParam.agency }, { kg:totalDecrease });
                            }
                        }catch(e){
                            console.log('error en merma o picadillo',e);
                        }

                    /**
                     * Recortes:
                     * Si es recorte registrar salida por recorte y sumar al producto adecuadamente
                     */
                    }else if(type == enumOut.out.cutout){

                        //Obtener codigo de producto a donde va a ir la entrada 31 ó 32 
                        let productCode = cutOut.cutOutCode[parseInt(item.code)];

                        if(productCode){

                            //Obtener producto para sumar el recorte
                            let product = await Product.findOne({ code:productCode });

                            if(product){
                                let inventoryIn = await Inventory.findOne({ product:product._id, agency:depParam.agency }).populate('product');
        
                                /**
                                 * Registrar entrada por recorte en el campo cutin
                                 */

                                if(inventoryIn){
                                   
                                    let total = parseFloat(inventoryIn.kg) + parseFloat(item.kg);
                                
                                    let inventoryParam = {};
                                    inventoryParam.product = product._id;
                                    inventoryParam.agency = depParam.agency;
                                    inventoryParam.kg = inventoryIn.kg.toFixed(3);//arrastrar kg anterior;
                                    inventoryParam.in = 0;//entrada 0
                                    inventoryParam.out = 0; //Salida
                                    inventoryParam.cut = item.kg.toFixed(3); //Entrada por recorte
                                    inventoryParam.total = total.toFixed(3);
                                    inventoryParam.note = ' ';
                                    inventoryParam.comment = depParam.comment ? depParam.comment : '';
                                    inventoryParam.type = enumOut.out.cutin;
                    
                                    const record = new InventoryRecord(inventoryParam);
                                    await record.save();
                    
                                    //Actualizar total en inventario
                                    await Inventory.findOneAndUpdate({ product:product._id, agency:depParam.agency }, { kg:total });

                                //Si no hay inventario de 31 ó  32
                                }else{
                                    //Registrar en inventario
                                    let total = parseFloat(item.kg);
                                    
                                    let newProd = {};

                                    newProd.product = product._id;
                                    newProd.agency = depParam.agency;
                                    newProd.kg = total;
                                    const inventory = new Inventory(newProd);
                                    await inventory.save();

                                    /**
                                     * Registrar entrada de recorte del producto nuevo en el inventario
                                     * Registrar en historial de inventario
                                     * 
                                     */
                                
                                    let inventoryParam = {};
                                    inventoryParam.product = product._id;
                                    inventoryParam.agency = depParam.agency;
                                    inventoryParam.kg = 0;//arrastrar kg anterior;
                                    inventoryParam.in = 0;//entrada 0
                                    inventoryParam.out = 0; //Salida
                                    inventoryParam.cut = item.kg.toFixed(3); //Salida por recorte
                                    inventoryParam.total = total.toFixed(3);
                                    inventoryParam.note = ' ';
                                    inventoryParam.comment = depParam.comment ? depParam.comment : '';
                                    inventoryParam.type = enumOut.out.cutin;
                    
                                    const record = new InventoryRecord(inventoryParam);
                                    await record.save();
                                    
                                }

                            }
                            
                        }

                    }

            }else{

                /**
                 * No se permite crear inventario negativo
                 * Si no existe inventario, se lanza un error
                 */
                throw (`El producto ${item.name} no existe en el inventario.`);
                
            }

        }

        /**
         * Asignar el array de productos para departures
         */
        depParam.products = products;
        const departure = new Departure(depParam);

        const departureSaved = await departure.save();

        if(!departureSaved){
            throw 'Error registrando la salida';  
        }

        return departureSaved;

    },


    /**
     * Función para obtener salida
     * 
     * @param {id} id de salida 
     */
    getDeparture: async (id) => {
        const departure = await Departure.findById(id);

        // Validar
        if (!departure) throw 'venta no encontrada';

        return departure;
    },

    /**
     * Funcion para obtener todas las salidas
     */
    getAll: async () => {
        return await Departure.find().sort({name: 'asc'});
    },

    /**
     * Funcion para obtener las ventas con paginación y filtros
     */
    dataTable: async (depParam) => {

        
        // resultados por página
        const pageSize = depParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = depParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(depParam.sortBy){

            let direction = depParam.sortBy.desc == true ? -1 : 1
            sortBy = { [depParam.sortBy.id] : direction } 
            
        }

        let stages = [ 
            {
                $lookup: {
                    from: 'agencies',
                    localField: 'agency',
                    foreignField: '_id',
                    as: 'agency'
                }, 
            },
            { $unwind: '$agency' },
            // Agregar campo company a nivel raíz para usarlo fácilmente en el front
            { $addFields: { company: '$agency.company' } },
            { $sort : sortBy }
        ]

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!depParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //stage del total 
        let stageTotal = [ {  $group : { _id: null, totalAmount: { $sum: "$total" } } } ];

         //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(depParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(depParam.user.agency) } },
            );
            stageTotal.unshift(
                { $match : { agency: ObjectId(depParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (depParam.filters) {

            // Filtro por compañía (company) usando la colección de agencias
            if (depParam.filters.company) {
                let regex = new RegExp(depParam.filters.company, 'gi');

                let agencies = await Agency.find({
                    company: { $regex: regex }
                }).select('_id');

                let agencyIds = agencies.map(agency => agency._id);

                if (agencyIds.length > 0) {
                    stages.unshift({
                        $match: { agency: { $in: agencyIds.map(id => ObjectId(id)) } }
                    });
                    stageTotal.unshift({
                        $match: { agency: { $in: agencyIds.map(id => ObjectId(id)) } }
                    });
                } else {
                    // Si no hay agencias que coincidan, retornar resultados vacíos
                    return {
                        results: [],
                        metadata: [],
                        total: 0,
                    };
                }
            }

            //Si hay filtro de sucursal
            if(depParam.filters.agency){
               
                stages.unshift(
                    { $match : { agency: ObjectId(depParam.filters.agency) } },
                );
                stageTotal.unshift(
                    { $match : { agency: ObjectId(depParam.filters.agency) } },
                );
            }

            //Si hay filtro de tipo de salida
            if(depParam.filters.type){
                
                stages.unshift(
                    { $match : { type: parseInt(depParam.filters.type) } },
                );
                stageTotal.unshift(
                    { $match : { type: parseInt(depParam.filters.type) } },
                );
            }

            //filtro por nombres
            if(depParam.filters.names){
                let regex = new RegExp(depParam.filters.names,'gi');
                stages.unshift(
                    { $match: { names: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { names: { $regex: regex } } },
                );
            }

            //filtro por teléfono
            if(depParam.filters.phone){
                let regex = new RegExp(depParam.filters.phone,'gi');
                stages.unshift(
                    { $match: { phone: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { phone: { $regex: regex } } },
                );
            }

            //filtro por comentario
            if(depParam.filters.comment){
                let regex = new RegExp(depParam.filters.comment,'gi');
                stages.unshift(
                    { $match: { comment: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { comment: { $regex: regex } } },
                );
            }

            if(depParam.filters.startDate && !depParam.filters.endDate){
                const startDate =  moment(depParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!depParam.filters.startDate && depParam.filters.endDate){
                const endDate =  moment(depParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(depParam.filters.startDate && depParam.filters.endDate){
                const startDate =  moment(depParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(depParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        //Si todos los filtros son vacios se consulta la fecha actual
        if(!depParam.filters.comment && !depParam.filters.names && !depParam.filters.phone && !depParam.filters.type  && 
            !depParam.filters.startDate && !depParam.filters.endDate && !depParam.filters.company){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
            stageTotal.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const departure = await Departure.aggregate(stages);

        let total = [];
        
        if(!depParam.isExcel){

            //Sumar total si las fechas se definieron o si es el día actual
            if((depParam.filters.startDate && depParam.filters.endDate) || (!depParam.filters.startDate && !depParam.filters.endDate)){
                //Total del resultado
                total = await Departure.aggregate(stageTotal);
            }
            
        }

        return {
            results: !depParam.isExcel ? departure[0].data: departure, 
            metadata: !depParam.isExcel ? departure[0].metadata: [], 
            total
        }

    },

}

module.exports = departureService;