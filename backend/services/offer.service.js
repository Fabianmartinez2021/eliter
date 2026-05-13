const db = require('../_helpers/db');
const Offer = db.Offer;
const OfferRecord = db.OfferRecord;
const role = require('../enums/roles.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

let offerService = {

    /**
     * Función para registrar oferta
     * 
     * @param {params} offerParam 
     */
    create: async (offerParam) => {

        //Buscar si oferta ya ha sido ingresada
        const isInDb = await Offer.findOne( { $and: [ { agency: offerParam.agency }, { product: offerParam.product } ] } )
        
        if(isInDb){
            throw 'Ya existe una oferta para la sucursal y producto seleccionado'; 
        }

        const offer = new Offer(offerParam);
        const offerSaved = await offer.save();

        //Guardar en una tabla de historial
        const offerRecord = new OfferRecord(offerParam);
        await offerRecord.save();

        if(!offerSaved ){
            throw 'Error registrando la oferta';  
        }

        return offerSaved;

    },

    /**
     * Funcion para obtener todas las ofertas
     */
    dataTable: async (offerParam) => {

        let filter = {}

        //Si el usuario es gerente solo ofertas de su sucursal
        if(offerParam.user.role == 3){
            filter = { agency: offerParam.user.agency }
        }

        const offers = await Offer.find(filter)
        .populate('agency','name')
        .populate('user')
        .populate('product').sort({createdDate: -1});

        return {
            results: offers, 
        }
    },


    /**
     * Eliminar oferta y obtener los resultados nuevamente
     */
    removeOffer: async (id, offerParam) => {

        //Obtener datos de la oferta
        const offerToDelete = await Offer.findById(id);

        if(offerToDelete){

            let actualDate = moment().subtract(4, 'hours');
            let update = {endDate: actualDate};

            //Buscar la oferta para insertar la fecha de finalizacion de la oferta en el historial
            await OfferRecord.findOneAndUpdate( { $and: [ { agency: offerToDelete.agency }, { product: offerToDelete.product } ] }, update, {
                sort: { createdDate: -1 },
            });

            //Eliminar la oferta 
            await Offer.deleteOne({ _id: id });
    
            let filter = {}
    
            //Si el usuario es gerente solo ofertas de su sucursal
            if(offerParam.user.role == 3){
                filter = { agency: offerParam.user.agency }
            }
    
            const offers = await Offer.find(filter)
            .populate('agency','name')
            .populate('user')
            .populate('product').sort({createdDate: -1});
    
            return {
                results: offers, 
            }
        }else{
            throw 'Error eliminando la oferta o ya no existe';  
        }

    },

    /**
     * Funcion para obtener las ventas con paginación y filtros
     */
    reportOffers: async (offerParam) => {

        // resultados por página
        const pageSize = offerParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = offerParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(offerParam.sortBy){

            let direction = offerParam.sortBy.desc == true ? -1 : 1
            sortBy = { [offerParam.sortBy.id] : direction }
            
        }

        let productCode = { $exists: true, $ne: null }

        //Si filtra por código de producto
        if(offerParam.filters.code){
            productCode =  { $eq: offerParam.filters.code }
        }

        let stages = [ 
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $match : { "product.code": productCode }},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'},},
            { $unwind: '$agency'},
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
        ]

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(offerParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(offerParam.user.agency) } },
            );
        }

        //Filtros para la consulta
        if (offerParam.filters) {

            //Si hay filtro de sucursal
            if(offerParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(offerParam.filters.agency) } },
                );
            }
            
            //Si hay filtro de usuario
            if(offerParam.filters.idUser){
                stages.unshift(
                    { $match : { user: ObjectId(offerParam.filters.idUser) } },
                );
            }

            //filtro por comentario
            if(offerParam.filters.comment){
                let regex = new RegExp(offerParam.filters.comment,'gi');
                stages.unshift(
                    { $match: { comment: { $regex: regex } } },
                );
            }

            if(offerParam.filters.startDate && !offerParam.filters.endDate){
                const startDate = moment(offerParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!offerParam.filters.startDate && offerParam.filters.endDate){
                const endDate =  moment(offerParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(offerParam.filters.startDate && offerParam.filters.endDate){
                const startDate = moment(offerParam.filters.startDate).utc().startOf('day');
                const endDate = moment(offerParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        //Si todos los filtros son vacios se consulta la fecha actual
        if(!offerParam.filters.code && !offerParam.filters.comment && !offerParam.filters.startDate && !offerParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const offers = await OfferRecord.aggregate(stages);

        return {
            results: offers[0].data, 
            metadata: offers[0].metadata, 
        }

    },


}

module.exports = offerService;