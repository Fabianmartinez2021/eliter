const db = require('../_helpers/db');
const WholesaleClient = db.WholesaleClient;
const moment = require('moment');

let WholesaleClientService = {

    getAll: async () => {
        return await WholesaleClient.find();
    },

    /**
     * Función para obtener usuario por id
     *  
     * @param {string} id 
     */
    getById: async (id) => {
        return await WholesaleClient.findById(id);
    },

    
    /**
     * Función para actualizar usuario
     * 
     * @param {id} id de usuario 
     * @param {params} clientParam
     */
    create: async (clientParam) => {
        
        const client = await WholesaleClient.findOne({ document: clientParam.document })

        // Validar
        if (client) throw 'El usuario ya existe';

        // copiar propiedades de clientParam a newWholesaleClient
        const newWholesaleClient = new WholesaleClient(clientParam);

        //  Crear el nuevo cliente al mayor
        await newWholesaleClient.save();
    },

    /**
     * Función para actualizar usuario
     * 
     * @param {id} id de usuario 
     * @param {params} clientParam
     */
    update: async (id, clientParam) => {
        const client = await WholesaleClient.findById(id);

        // Validar
        if (!client) throw 'Usuario no encontrado';
        if (client.document !== clientParam.document && await WholesaleClient.findOne({ document: clientParam.document })) {
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

        try {
            // resultados por página
            const pageSize = clientParam.pageSize;
            const pageIndex = clientParam.pageIndex;
    
            var sortBy = { createdDate : -1 };
            if(clientParam.sortBy){
                let direction = clientParam.sortBy.desc == true ? -1 : 1;
                sortBy = { [clientParam.sortBy.id] : direction }; 
            }
    
            let stages = [
                { $sort : sortBy },
                { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
                { $unwind: { path: "$agency", preserveNullAndEmptyArrays: true } }
            ];
    
            if(!clientParam.isExcel){
                stages.push(
                    { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
                );
            }
    
            // Aplicar filtros
            if (clientParam.filters) {
                if(clientParam.filters.names){
                    let regex = new RegExp(clientParam.filters.names,'gi');
                    stages.unshift({ $match: { names: { $regex: regex } } });
                }
                if(clientParam.filters.document){
                    let regex = new RegExp(clientParam.filters.document,'gi');
                    stages.unshift({ $match: { document: { $regex: regex } } });
                }
                // Otros filtros...
                if(clientParam.filters.agency){
                    const ObjectId = require('mongoose').Types.ObjectId;  // Asegúrate de usar ObjectId de Mongoose
                    stages.unshift({ $match : { agency: ObjectId(clientParam.filters.agency) } });
                }
            }
    
            const clients = await WholesaleClient.aggregate(stages);
    
            return {
                results: !clientParam.isExcel ? clients[0].data: clients, 
                metadata: !clientParam.isExcel ? clients[0].metadata: [], 
            };
        } catch (error) {
            console.error("Error en dataTable:", error);
            throw new Error("Error procesando la solicitud en el servidor");
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
        
        const clients = await WholesaleClient.aggregate(stages);/********* */
        
        
        return {
            results: clients[0].data, 
        }
    },

    // /**
    //  * Función para buscar cliente por código del cliente
    //  * 
    //  * autocompletado de typeahead
    //  * 
    //  * @param {id} id de usuario 
    //  * @param {params} clientParam
    //  */
    //  searchByCode: async (clientParam) => {

    //     // resultados por página
    //     const pageSize = 15;
    
    //     //orden por defecto
    //     var sortBy = { clientCode : 1 };

    //     let stages = [
    //         { $sort : sortBy },
    //     ];
        
    //     stages.push(
    //         { $facet : { metadata: [ { $count: "total" } ], data: [ { $limit: pageSize } ] } },
    //     );
        
    //     let regex = new RegExp(clientParam.clientCode,'gi');
    //     stages.unshift(
    //         { $match: { clientCode: { $regex: regex } } },
    //     );
        
    //     const clients = await WholesaleClient.aggregate(stages);/********* */
        
        
    //     return {
    //         results: clients[0].data, 
    //     }
    // },

    
}

//Funcion para probar espera de internet 
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = WholesaleClientService;