const db = require('../_helpers/db');
const Client = db.Client;
const moment = require('moment');

let clientService = {

    getAll: async () => {
        return await Client.find().populate('agency');
    },

    /**
     * Función para obtener usuario por id
     *  
     * @param {string} id 
     */
    getById: async (id) => {
        return await Client.findById(id).populate('agency');
    },


    /**
     * Función para actualizar usuario
     * 
     * @param {id} id de usuario 
     * @param {params} clientParam
     */
    update: async (id, clientParam) => {
        const client = await Client.findById(id);

        // Validar
        if (!client) throw 'Usuario no encontrado';
        if (client.document !== clientParam.document && await Client.findOne({ document: clientParam.document })) {
            throw 'Documento de identidad "' + clientParam.document + '" ya usado';
        }

        // copiar propiedades de clientParam a client
        Object.assign(client, clientParam);

        await client.save();
    },

    /**
     * Funcion para obtener los usuarios con paginación y filtros menos el usuario admin interno
     */
    dataTable: async (clientParam) => {

        // resultados por página
        const pageSize = clientParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = clientParam.pageIndex; 
    
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(clientParam.sortBy){
            let direction = clientParam.sortBy.desc == true ? -1 : 1
            sortBy = { [clientParam.sortBy.id] : direction } 
        }

        let stages = [
            { $sort : sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: { path: "$agency", preserveNullAndEmptyArrays: true } }

        ];


        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!clientParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (clientParam.filters) {

            if(clientParam.filters.names){
                let regex = new RegExp(clientParam.filters.names,'gi');
                stages.unshift(
                    { $match: { names: { $regex: regex } } },
                );
            }

            if(clientParam.filters.agency){
                const ObjectId = require('mongoose').Types.ObjectId;  // Asegúrate de usar ObjectId de Mongoose
                stages.unshift({ $match : { agency: ObjectId(clientParam.filters.agency) } });
            }
       
            if(clientParam.filters.document){
                let regex = new RegExp(clientParam.filters.document,'gi');
                stages.unshift(
                    { $match: { document: { $regex: regex } } },
                );
            }

            if(clientParam.filters.phone){
                let regex = new RegExp(clientParam.filters.phone,'gi');
                stages.unshift(
                    { $match: { phone: { $regex: regex } } },
                );
            }

            if(clientParam.filters.startDate && !clientParam.filters.endDate){
                const startDate =  moment(clientParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!clientParam.filters.startDate && clientParam.filters.endDate){
                const endDate =  moment(clientParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(clientParam.filters.startDate && clientParam.filters.endDate){
                const startDate =  moment(clientParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(clientParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        // if(!clientParam.filters.startDate && !clientParam.filters.endDate){
        //     const startDate =  moment().startOf('day');
        //     const endDate =  moment().endOf('day');
        //     stages.unshift(
        //         { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
        //     );
        // }
        
        const clients = await Client.aggregate(stages);


        return {
            results: !clientParam.isExcel ? clients[0].data: clients, 
            metadata: !clientParam.isExcel ? clients[0].metadata: [], 
        }
    },

    /**
     * Función para buscar cliente por documento de identificacion
     * 
     * autocompletado de typeahead
     * 
     * @param {id} id de usuario 
     * @param {params} clientParam
     */
    search: async (clientParam) => {

        // resultados por página
        const pageSize = 10;
    
        //orden por defecto
        var sortBy = { names : 1 };

        let stages = [
            { $sort : sortBy },
        ];
        
        stages.push(
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $limit: pageSize } ] } },
        );
        
        let regex = new RegExp(clientParam.document,'gi');
        stages.unshift(
            { $match: { document: { $regex: regex } } },
        );
        
        const clients = await Client.aggregate(stages);

        return {
            results: clients[0].data, 
        }
    },

    
}

//Funcion para probar espera de internet 
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = clientService;