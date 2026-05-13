const db = require('../_helpers/db');
const Product = db.Product;
const Combos = db.Combos;
const CombosRecord = db.CombosRecord;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment');

let CombosService = {

    create: async (combosParam) => {

        // Se busca que el combo no coincida con un producto
        const product = await Product.findOne({code: combosParam.code})
        if (product){
            throw(`El código ${product.code} ya pertenece al producto ${product.name}`)
        }

        // Se busca que el combo no coincida con otro combo
        const comboExist = await Combos.findOne({code: combosParam.code})
        if (comboExist){
            throw(`El código ${comboExist.code} ya pertenece al combo ${comboExist.name}`)
        }
        
        for (let item of combosParam.items) {
       
            item.regularPrice = item.price;

            // Se obtienen los nuevos precios relativos en relacion a su total
            item.price = item.price * combosParam.price / combosParam.regularPrice;
        }

        //  Se registra el combo como producto
        const newProduct = new Product(combosParam)
        const newProductSaved = await newProduct.save();
        if(!newProductSaved){  throw 'Error registrando el producto' }

        
        //  Se registra el combo en su respectiva base de datos
        const combo = new Combos(combosParam)
        const comboSaved = await combo.save();
        if(!comboSaved){  throw 'Error registrando el combo' }

        const comboRecord = new CombosRecord(combosParam)
        const comboRecordSaved = await comboRecord.save();
        if(!comboRecordSaved){  throw 'Error haciendo el registro'  }


        return comboSaved;

    },
    
    update: async (id, combosParam) => {
        
        const combo = await Combos.findById(id);
        if (!combo) throw 'Combo no encontrado';
        // Se crea una variable auxiliar en caso de que se cambie el código o el nombre
        let comboAux = Object.assign( {}, combo.toObject() );
        // copiar propiedades de combosParam al respectivo combo
        Object.assign(combo, combosParam);
        // Se obtienen los nuevos precios relativos en relacion a su total
        for (let item of combo.items) {
            Object.assign(item, { price: item.regularPrice * combo.price / combo.regularPrice });
        }
        const comboSaved = await combo.save();
        if(!comboSaved){ throw 'Error registrando la venta' }

        const product = await Product.findOne({code: comboAux.code, name: comboAux.name})
        if (!product) throw 'Producto no encontrado';
        // copiar propiedades de combosParam al respectivo producto
        Object.assign(product, combosParam);
        const productSaved = await product.save();
        if(!productSaved){ throw 'Error registrando la venta' }

        // Se define el tipo de registro
        combosParam.recordType = 3;

        const comboRecord = new CombosRecord(combosParam)
        const comboRecordSaved = await comboRecord.save();
        if(!comboRecordSaved){ throw 'Error haciendo el registro' }
    },

    /**
     * Función para obtener usuario por id
     *  
     * @param {ObjectId} id 
     */
    getCombo: async (id) => {
        return await Combos.findById(id);
    },


    /**
     * Función para eliminar 
     * 
     * @param {String} id de usuario 
     * @param {String} code del combo a eliminar
     */


    delete: async (id) => {
        
         // Se busca que el combo no coincida con otro combo
         const combo = await Combos.findOne({_id: id})

         if (combo){

            await Combos.deleteOne({_id: id})
            
            // Se crea el reporte de eliminacion
            const record = Object.assign( { recordType: 2 }, combo.toObject())
            const comboRecord = new CombosRecord(record)
            const comboRecordSaved = await comboRecord.save();
            if(!comboRecordSaved){  throw 'Error haciendo el registro'  }

        }else{
            throw(`El código ${code} no pertenece a ningún combo`)
        }

        // Se busca que el combo no coincida con un producto
        const product = await Product.findOne({code: combo.code, name: combo.name})
        
        if (product){
            await Product.deleteOne({code: combo.code, name: combo.name})
        }else{
            throw(`El código ${code} no pertenece a ningún producto`)
        }   

        return combo
    },

    getAll: async () => {

        return await Combos.find().populate('agency')//.populate('userAgency');
    },

    /**
     * Función para buscar cliente por código del cliente
     * 
     * autocompletado de typeahead
     * 
     * @param {id} id de usuario 
     * @param {params} combosParam
     */
     getTable: async (combosParam) => {


        // resultados por página
/*        const pageSize = 15;
    
        //orden por defecto
        var sortBy = { clientCode : 1 };

        let stages = [
            { $sort : sortBy },
        ];
        
        stages.push(
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $limit: pageSize } ] } },
        );
        
        let regex = new RegExp(combosParam.clientCode,'gi');
        stages.unshift(
            { $match: { clientCode: { $regex: regex } } },
        );
        
        const combos = await Combos.aggregate(stages);
        
        
        return {
            results: combos[0].data, 
        }*/
    },

    
    getHistoryCombo: async (combosParam) => {

        // Resultados por página
        const pageSize = combosParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = combosParam.pageIndex; 

        //  Orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(combosParam.sortBy){
            let direction = combosParam.sortBy.desc == true ? -1 : 1
            sortBy = { [combosParam.sortBy.id] : direction } 
        }

        //  Filtros de busqueda

        const stages = [ 
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency'},
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' },  },
            { $unwind: '$user'},
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } }
        ];
                   
        //  Filtros para la consulta normal como para el total
        if (combosParam.filters) {

           //   Filtro por agencia
            if (combosParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(combosParam.filters.agency) } },
                );
            }

            if(combosParam.filters.startDate && !combosParam.filters.endDate){
                const startDate =  moment(combosParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!combosParam.filters.startDate && combosParam.filters.endDate){
                const endDate =  moment(combosParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(combosParam.filters.startDate && combosParam.filters.endDate){
                const startDate =  moment(combosParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(combosParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }
        
        if(!combosParam.filters.startDate && !combosParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

       const combosRecords = await CombosRecord.aggregate(stages);

        return {
            results: combosRecords[0].data,
            metadata: combosRecords[0].metadata,
        }
    },
}

//Funcion para probar espera de internet 
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = CombosService;