const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const db = require('../_helpers/db');
const Assets = db.Assets;
const AssetsRecord = db.AssetsRecord;
const AssetsDump = db.AssetsDump;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const role = require('../enums/roles.enum');
const assetsEnum = require('../enums/assets.enum');

let assetsService = {
    
    /**
     * Función para registrar un nuevo activo
     */
    registerAssets: async (assetsParam) => {

        let user = assetsParam.user
        let data = assetsParam.assets

        if (user.role == role.rol.Auditor){
            if (user.role === role.rol.Manager){
                data.agency = user.agency;
            }
            else{
                throw('Unicamente los administradores o gerentes pueden crear nuevos activos');
            }
        }

        // Si el articulo no tiene serial, se inventa uno para no interferir con la base de datos
        if (!data.hasSerial){
            data.serial = bcrypt.hashSync(new Date().toString(), 10);
        }

        data.user = user.id;

        const newAssets = new Assets(data);
        const newAssetsSaved = await newAssets.save();

        // Se procede a registrar el respectivo registro
        data.recordType = assetsEnum.recordType.creation;
        data.code = newAssetsSaved.code;
        data.modificationUser = user.id;

        const newAssetsRecord = new AssetsRecord(data);
        await newAssetsRecord.save();

        return newAssetsSaved
    },


    /**
     * Función para eliminar un activo por su id
     * NOTA: Técnicamente no se elimina sino que se marca y "se envia" a la papelera de activos
     */
    deleteAssets: async (id, user) => {

        const assetToDelete = await Assets.findById(id);

        let changes = {
            wasDeleted: true,
            deletionUser: user.id,
            deletionDate: moment().subtract(4, 'hours')
        }

        Object.assign(assetToDelete, changes);

        await assetToDelete.save();

        
        // Se procede a registrar el respectivo registro

        const data = await Assets.findById(id).lean();
        delete data._id;
        delete data.createdDate;
        data.recordType = assetsEnum.recordType.elimination;
        data.modificationUser = user.id;

        const newAssetsRecord = new AssetsRecord(data);
        await newAssetsRecord.save();

        return;
    },


    /**
     * Función para restaurar un activo que habia sido enviado a la papelera
     */
    restoreAssets: async (id, user) => {

        if (user.role !== role.rol.Admin){
            throw('Únicamente los administradores pueden reataurar activos desde la papelera')
        }

        const assetToDelete = await Assets.findById(id);

        let changes = {
            wasDeleted: false,
            deletionUser: null,
            deletionDate: null
        }

        Object.assign(assetToDelete, changes);

        await assetToDelete.save();

        
        // Se procede a registrar el respectivo registro

        const data = await Assets.findById(id).lean();
        delete data._id;
        delete data.createdDate;
        data.recordType = assetsEnum.recordType.restauration;
        data.modificationUser = user.id;

        const newAssetsRecord = new AssetsRecord(data);
        await newAssetsRecord.save();

        return;
    },

    /**
     * Función para obtener un activo por su id
     */
    getAssetsById: async (id) => {
        return await Assets.findById(id);
    },


    /**
     * Función para actualizar activo
     */
    updateAssets: async (id, assetsParam) => {

        let user = assetsParam.user
        let data = assetsParam.data

        if (user.role !== role.rol.Admin){
            if (user.role === role.rol.Manager || role.rol.Supervisor){
                // Los gerentes unicamente pueden modificar el Estatus del activo 
                assetsParam.data = { 'status': assetsParam.data['status'] }
            }
            else{
                throw('Unicamente los administradores pueden crear nuevos activos')
            }
        }

        // Si el articulo no tiene serial, se inventa uno para no interferir con la base de datos
        if (!data.hasSerial){
            data.serial = bcrypt.hashSync(new Date().toString(), 10);
        }

        const oldAssets = await Assets.findById(id);

        // Se crea una copia antes de realizar la modificacion
        const oldAssetsCopy = await Assets.findById(id).lean();
        delete oldAssetsCopy._id;
        delete oldAssetsCopy.createdDate;

        Object.assign(oldAssets, data)
        const assetsSaved = await oldAssets.save();


        // SE CREA EL REPORTE POR CADA MODIFICACIÓN QUE SE HAGA

        // En caso de que cambie la agencia, sería un traslado
        if ((user.role === role.rol.Admin) && (oldAssetsCopy.agency.toString() !== data.agency.toString())){

            let newData = {
                agency: data.agency,
                recordType: assetsEnum.recordType.transfer,
                modificationUser: user.id
            }
            Object.assign(oldAssetsCopy, newData)
            
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }

        let newData = {
            recordType: assetsEnum.recordType.modification,
            modificationUser: user.id,
            modification: ''
        }

        // En caso de que cambie otro dato
        if (data.serial && (data.serial != oldAssetsCopy.serial)){
            newData.modification = assetsEnum.modification.serial
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.name && (data.name != oldAssetsCopy.name)){
            newData.modification = assetsEnum.modification.name
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.condition && (data.condition != oldAssetsCopy.condition)){
            newData.modification = assetsEnum.modification.condition
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.type && (data.type != oldAssetsCopy.type)){
            newData.modification = assetsEnum.modification.type
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.category && (data.category != oldAssetsCopy.category)){
            newData.modification = assetsEnum.modification.category
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.description && (data.description != oldAssetsCopy.description)){
            newData.modification = assetsEnum.modification.description
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.status && (data.status != oldAssetsCopy.status)){
            newData.modification = assetsEnum.modification.status
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }
        if (data.price && (data.price != oldAssetsCopy.price)){
            newData.modification = assetsEnum.modification.price
            Object.assign(oldAssetsCopy, newData)
            const newAssetsRecord = new AssetsRecord(oldAssetsCopy);
            await newAssetsRecord.save();
        }

        return assetsSaved

    },


    /**
     * Función para actualizar activo
     */
    getTableAssets: async (assetsParam) => {

        // resultados por página
        const pageSize = assetsParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = assetsParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(assetsParam.sortBy){
            let direction = assetsParam.sortBy.desc == true ? -1 : 1
            sortBy = { [assetsParam.sortBy.id] : direction } 
        }

        //stage o query principal
        const stages = [ 
            { $match: { $or: [ { wasDeleted: { $eq: null, }}, { wasDeleted: { $eq: false }}]}},
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$agency' },
            { $unwind: '$user' },
            { $sort : sortBy },
        ];
        
        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!assetsParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }
      
        //stage del total del valor de los activos
        let stagesTotal = [ 
            {   $group : { _id: null, 
                    totalAmount: { $sum: "$price" },
                }
            } 
        ];
      
        //Si es admin o supervisor ve todos las sucursales y usuarios

        //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
        if((assetsParam.user.role == role.rol.Cashier) || (assetsParam.user.role == role.rol.Manager)){
            stages.unshift(
                { $match : { agency: ObjectId(assetsParam.user.agency) } },
            );
            stagesTotal.unshift(
                { $match : { agency: ObjectId(assetsParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (assetsParam.filters) {

             //Si hay filtro de sucursal
             if(assetsParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(assetsParam.filters.agency) } },
                );               
                stagesTotal.unshift(
                    { $match : { agency: ObjectId(assetsParam.filters.agency) } },
                );
            }

            //Si hay filtro por nombre
            if(assetsParam.filters.name){
                let regex = new RegExp(assetsParam.filters.name,'gi');
                stages.unshift(
                    { $match: { name: { $regex: regex } } },
                );               
                stagesTotal.unshift(
                    { $match: { name: { $regex: regex } } },
                );
            }

            //Si hay filtro por serial
            if(assetsParam.filters.serial){
                let regex = new RegExp(assetsParam.filters.serial,'gi');
                stages.unshift(
                    { $match: { serial: { $regex: regex } } },
                ); 
                stagesTotal.unshift(         
                    { $match: { serial: { $regex: regex } } },           
                );
            }

            //Si hay filtro por condición
            if(assetsParam.filters.condition){
                let regex = new RegExp(assetsParam.filters.condition,'gi');
                stages.unshift(
                    { $match: { condition: { $regex: regex } } },
                );   
                stagesTotal.unshift(    
                    { $match: { condition: { $regex: regex } } },                
                );
            }

            //Si hay filtro por categoria
            if(assetsParam.filters.category){
                let regex = new RegExp(assetsParam.filters.category,'gi');
                stages.unshift(
                    { $match: { category: { $regex: regex } } },
                );  
                stagesTotal.unshift(  
                    { $match: { category: { $regex: regex } } },                  
                );
            }

            //Si hay filtro por tipo
            if(assetsParam.filters.type){
                let regex = new RegExp(assetsParam.filters.type,'gi');
                stages.unshift(
                    { $match: { type: { $regex: regex } } },
                );
                stagesTotal.unshift(    
                    { $match: { type: { $regex: regex } } },                
                );
            }

            //Si hay filtro por estatus
            if(assetsParam.filters.status){
                let regex = new RegExp(assetsParam.filters.status,'gi');
                stages.unshift(
                    { $match: { status: { $regex: regex } } },
                );
                stagesTotal.unshift(  
                    { $match: { status: { $regex: regex } } },                  
                );
            }
            
            //Si hay filtro por código
            if(assetsParam.filters.code){
                stages.unshift(
                    { $match: { code: { $eq: parseInt(assetsParam.filters.code) } } },
                );
                stagesTotal.unshift(   
                    { $match: { code: { $eq: parseInt(assetsParam.filters.code) } } },                 
                );
            }
        }

        const assets = await Assets.aggregate(stages);
        

        // Se obtiene el valor total de los activos
        const total = await Assets.aggregate(stagesTotal);

        let totalAmount = total.length > 0 ? total[0].totalAmount : 0 ;


        return {
            results: !assetsParam.isExcel ? assets[0].data: assets,
            metadata: !assetsParam.isExcel ? assets[0].metadata: [],
            totalAmount
        }
    },

    /**
     * Función para actualizar activo
     */
    getDumpTableAssets: async (assetsParam) => {

        // resultados por página
        const pageSize = assetsParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = assetsParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(assetsParam.sortBy){
            let direction = assetsParam.sortBy.desc == true ? -1 : 1
            sortBy = { [assetsParam.sortBy.id] : direction } 
        }

        //stage o query principal
        const stages = [ 
            { $match: { wasDeleted: true } },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $lookup: { from: 'users',  localField: 'deletionUser', foreignField: '_id', as: 'deletionUser' } },
            { $unwind: '$agency' },
            { $unwind: '$user' },
            { $unwind: '$deletionUser' },
            { $sort : sortBy },
        ];
        
        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!assetsParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }
      
        //Si es admin o supervisor ve todos las sucursales y usuarios

        //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
        if((assetsParam.user.role == role.rol.Cashier) || (assetsParam.user.role == role.rol.Manager)){
            stages.unshift(
                { $match : { agency: ObjectId(assetsParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (assetsParam.filters) {

             //Si hay filtro de sucursal
             if(assetsParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(assetsParam.filters.agency) } },
                );
            }

            //Si hay filtro por nombre
            if(assetsParam.filters.name){
                let regex = new RegExp(assetsParam.filters.name,'gi');
                stages.unshift(
                    { $match: { name: { $regex: regex } } },
                );
            }

            //Si hay filtro por serial
            if(assetsParam.filters.serial){
                let regex = new RegExp(assetsParam.filters.serial,'gi');
                stages.unshift(
                    { $match: { serial: { $regex: regex } } },
                );
            }

            //Si hay filtro por condición
            if(assetsParam.filters.condition){
                let regex = new RegExp(assetsParam.filters.condition,'gi');
                stages.unshift(
                    { $match: { condition: { $regex: regex } } },
                );
            }

            //Si hay filtro por categoria
            if(assetsParam.filters.category){
                let regex = new RegExp(assetsParam.filters.category,'gi');
                stages.unshift(
                    { $match: { category: { $regex: regex } } },
                );
            }

            //Si hay filtro por tipo
            if(assetsParam.filters.type){
                let regex = new RegExp(assetsParam.filters.type,'gi');
                stages.unshift(
                    { $match: { type: { $regex: regex } } },
                );
            }

            //Si hay filtro por estatus
            if(assetsParam.filters.status){
                let regex = new RegExp(assetsParam.filters.status,'gi');
                stages.unshift(
                    { $match: { status: { $regex: regex } } },
                );
            }
            
            //Si hay filtro por código
            if(assetsParam.filters.code){
                stages.unshift(
                    { $match: { code: { $eq: parseInt(assetsParam.filters.code) } } },
                );
            }
        }

        const assets = await Assets.aggregate(stages);
        
        return {
            results: !assetsParam.isExcel ? assets[0].data: assets,
            metadata: !assetsParam.isExcel ? assets[0].metadata: [],
        }
    },

    /**
     * Función para actualizar activo
     */
    getTableAssetsRecord: async (assetsParam) => {

        // resultados por página
        const pageSize = assetsParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = assetsParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(assetsParam.sortBy){
            let direction = assetsParam.sortBy.desc == true ? -1 : 1
            sortBy = { [assetsParam.sortBy.id] : direction } 
        }

        //stage o query principal
        const stages = [ 
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $lookup: { from: 'users',  localField: 'modificationUser', foreignField: '_id', as: 'modificationUser' } },
            { $unwind: '$agency' },
            { $unwind: '$user' },
            { $unwind: { path: "$modificationUser", preserveNullAndEmptyArrays: true } },
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } }
        ];
      
        //Si es admin o supervisor ve todos las sucursales y usuarios

        //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
        if((assetsParam.user.role == role.rol.Cashier) || (assetsParam.user.role == role.rol.Manager)){
            stages.unshift(
                { $match : { agency: ObjectId(assetsParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (assetsParam.filters) {

             //Si hay filtro de sucursal
             if(assetsParam.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(assetsParam.filters.agency) } },
                );
            }

            //Si hay filtro por nombre
            if(assetsParam.filters.name){
                let regex = new RegExp(assetsParam.filters.name,'gi');
                stages.unshift(
                    { $match: { name: { $regex: regex } } },
                );
            }

            //Si hay filtro por serial
            if(assetsParam.filters.serial){
                let regex = new RegExp(assetsParam.filters.serial,'gi');
                stages.unshift(
                    { $match: { serial: { $regex: regex } } },
                );
            }

            //Si hay filtro por condición
            if(assetsParam.filters.condition){
                let regex = new RegExp(assetsParam.filters.condition,'gi');
                stages.unshift(
                    { $match: { condition: { $regex: regex } } },
                );
            }

            //Si hay filtro por categoria
            if(assetsParam.filters.category){
                let regex = new RegExp(assetsParam.filters.category,'gi');
                stages.unshift(
                    { $match: { category: { $regex: regex } } },
                );
            }

            //Si hay filtro por tipo
            if(assetsParam.filters.type){
                let regex = new RegExp(assetsParam.filters.type,'gi');
                stages.unshift(
                    { $match: { type: { $regex: regex } } },
                );
            }

            //Si hay filtro por estatus
            if(assetsParam.filters.status){
                let regex = new RegExp(assetsParam.filters.status,'gi');
                stages.unshift(
                    { $match: { status: { $regex: regex } } },
                );
            }
            
            //Si hay filtro por código
            if(assetsParam.filters.code){
                stages.unshift(
                    { $match: { code: { $eq: parseInt(assetsParam.filters.code) } } },
                );
            }

            //Si hay filtro por tipo de registro
            if(assetsParam.filters.recordType){
                stages.unshift(
                    { $match: { recordType: assetsParam.filters.recordType } },
                );
            }
            //Si hay filtro por tipo de modificacion
            if(assetsParam.filters.modification){
                stages.unshift(
                    { $match: { modification: assetsParam.filters.modification } }
                );
            }

            // Si hay filtro por fecha
            if(assetsParam.filters.startDate && !assetsParam.filters.endDate){
                const startDate =  moment(assetsParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }
 
            if(!assetsParam.filters.startDate && assetsParam.filters.endDate){
                const endDate =  moment(assetsParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }
 
            if(assetsParam.filters.startDate && assetsParam.filters.endDate){
                const startDate =  moment(assetsParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(assetsParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!assetsParam.filters.startDate && !assetsParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const assets = await AssetsRecord.aggregate(stages);

        return {
            results: assets[0].data, 
            metadata: assets[0].metadata,
        }
    },
}

module.exports = assetsService;