const db = require('../_helpers/db');
const Box = db.Box;
const BoxClose = db.BoxClose;
const enumBox = require('../enums/box.enum'); 
const role = require('../enums/roles.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const User = db.User;

const authorizationCodeService = require('./authorizationCode.service');

let boxService = {

    /**
     * Función para apertura de caja
     * 
     * @param {params} boxParam 
     */
    create: async (boxParam) => {

        //verificar si hay data previa sino ya esta aperturada la caja
        let prevData = await Box.find({ agency: boxParam.agency });

         //Si hay data ya hay apertura
         if(prevData.length > 0){
            throw 'Ya existe una apertura para la sucursal seleccionada';
        }else{

            for (let item of boxParam.values) {

                let boxData = {
                    agency: boxParam.agency,
                    user: boxParam.user,
                    totalBefore: 0,
                    in: parseFloat(item.amount.toString().replace(/,/g, '')),
                    out: 0,
                    total: parseFloat(item.amount.toString().replace(/,/g, '')),
                    coin: item.coin,
                    coinDescription: enumBox.descriptionCoin[item.coin],
                    type: enumBox.types.opening,
                    typeDescription: enumBox.descriptionType[enumBox.types.opening],
                }

                const opening = new Box(boxData);

                const openingSaved = await opening.save();
        
                if(!openingSaved){
                    throw 'Error registrando la apertura';  
                }

            }  
        }

    },

    /**  Función para realizar un retiro de caja 
     * 
     * @param {Object} boxParam 
     * @param {String} boxParam.authorization - 'Nombre de la persona que autoriza
     * @param {String} boxParam.coin - Tipo de moneda (ver box.enum.coin)
     * @param {String} boxParam.type - Tipo de transacción (ver box.enum.type)
     * @param {String} boxParam.amount - Monto del retiro. En formato de separacion con coma para centenas
     * @param {String} boxParam.agencyName - Nombre de la agencia
     * @param {String} boxParam.agency - Código del objeto de la agencia en la base de datos
     * @param {String} boxParam.user - Código del objeto del usuario en la base de datos
     * @param {String} [boxParam.comment] - Comentario (Opcional)
     * @param {(String | Number)} [boxParam.code] - Código generado por el usuario administrador que le permite realizar un Getiro o Gasto
     * 
     */

    
    withdrawal: async (boxParam) => {

        // Si es un retiro o un gasto se debe verificar si hay
        if((boxParam.type == enumBox.types.withdrawal) || (boxParam.type == enumBox.types.spending)){

            let existingCode = await authorizationCodeService.verifyCode(boxParam.user, boxParam.code)

            if (!existingCode) {
                throw('El código es erróneo o no le pertenece a su usuario')
            }
            else {
                Object.assign(boxParam, existingCode.boxWithdrawalData)
                boxParam.authorizationCode = existingCode._id;
            }
        }

        //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
        let lastRecord = await Box.findOne({ agency: boxParam.agency, coin:boxParam.coin }).sort({ createdDate: -1 });

        if(!lastRecord){
            throw 'No hay registros de caja o no ha sido aperturada en tu sucursal';
        }else{
            //Registrar salida de caja
            let total = parseFloat(lastRecord.total) - parseFloat(boxParam.amount.toString().replace(/,/g, ''));

            if(Math.sign(total) == -1){
                throw 'El monto supera el total en caja';
            }else{

                let boxData = {
                    agency: boxParam.agency,
                    user: boxParam.user,
                    totalBefore: lastRecord.total,
                    in: 0,
                    out: parseFloat(boxParam.amount.toString().replace(/,/g, '')),
                    total: total,
                    coin: boxParam.coin,
                    coinDescription: enumBox.descriptionCoin[boxParam.coin],
                    type: boxParam.type,
                    typeDescription: enumBox.descriptionType[boxParam.type],
                    comment: boxParam.comment,
                    authorization: boxParam.authorization,
                    authorizationCode: boxParam.authorizationCode,
                }

                const opening = new Box(boxData);

                const openingSaved = await opening.save();
        
                if(!openingSaved){
                    throw 'Error registrando el retiro';  
                }
            }

            // Si es un retiro o un gasto se verifica el código una vez la transacción se ha realizado
            if((boxParam.type == enumBox.types.withdrawal) || (boxParam.type == enumBox.types.spending)){
                let existingCode = await authorizationCodeService.verifyCode(boxParam.user, boxParam.code)
                authorizationCodeService.confirmCode(existingCode._id);
            }
        }
    },

    //reporte de caja
    boxReport: async (boxParam) => {

        // resultados por página
        const pageSize = boxParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = boxParam.pageIndex; 

        //orden por defecto
        var sortBy = { "_id.createdDate" : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(boxParam.sortBy){

            let direction = boxParam.sortBy.desc == true ? -1 : 1

            if(boxParam.sortBy.id == "date"){
                sortBy = { "_id.createdDate" : direction } 
            }else{
                sortBy = { [boxParam.sortBy.id] : direction } 
            }
        }

        let stages = [
            { $sort: {createdDate: 1} },
            { $group : {
                _id: { agency: '$agency', coin:'$coin', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }, },
                total:  { $last: '$total' },
                coin:{ $last: '$coin' },
                coinDescription: { $last: '$coinDescription' },
                date: { $last: '$createdDate' },
                agency: { $last: '$agency' } }
            },
            { $sort: sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' }, },
            { $unwind: '$agency', },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!boxParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(boxParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(boxParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (boxParam.filters) {

             //Si hay filtro de sucursal
             if(boxParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(boxParam.filters.agency) } },
                );
            }

            if(boxParam.filters.startDate && !boxParam.filters.endDate){
                const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!boxParam.filters.startDate && boxParam.filters.endDate){
                const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(boxParam.filters.startDate && boxParam.filters.endDate){
                const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!boxParam.filters.startDate && !boxParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const box = await Box.aggregate(stages);

        return {
            results: !boxParam.isExcel ? box[0].data: box, 
            metadata: !boxParam.isExcel ? box[0].metadata: [], 
        }
    },

    /**
     * reporte de caja detalle de caja
     * 
     * Devuelve la lista de movimientos de la caja por dia
     * 
     */
    boxDetails: async (boxParam) => {

        //agrupar por fecha, agencia y monedas
        const startDate =  moment(boxParam.date).utc().startOf('day');
        const endDate =  moment(boxParam.date).utc().endOf('day');

        //parametros del query
        
        //tipo de moneda
        let type = boxParam.coin;

        //fecha 
        const query = {
            createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)},
            agency: ObjectId(boxParam.agency),
            coin: type
        }

        //Consultar 
        const boxes = await Box.find(query).populate('agency','name')
            .populate('user','username')
            .sort({ createdDate: -1 });

        return {
            results: boxes, 
        }
    },

    getTableHistory: async (boxParam) => {

        // resultados por página
        const pageSize = boxParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = boxParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(boxParam.sortBy){
            let direction = boxParam.sortBy.desc == true ? -1 : 1
            sortBy = { [boxParam.sortBy.id] : direction } 
        }

        let stages = [
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'authorizationcodes',  localField: 'authorizationCode', foreignField: '_id', as: 'authorizationCode' } },
            { $unwind: { path: "$authorizationCode", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users',  localField: 'authorizationCode.authorizerUser', foreignField: '_id', as: 'authorizationCode.authorizerUser' } },
            { $unwind: { path: "$authorizationCode.authorizerUser", preserveNullAndEmptyArrays: true } },
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!boxParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(boxParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(boxParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (boxParam.filters) {

            //Si hay filtro de sucursal
            if(boxParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(boxParam.filters.agency) } },
                );
            }

            if(boxParam.filters.startDate && !boxParam.filters.endDate){
                const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!boxParam.filters.startDate && boxParam.filters.endDate){
                const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(boxParam.filters.startDate && boxParam.filters.endDate){
                const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

            if(boxParam.filters.searchType){

                if (boxParam.filters.searchType === "sale"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.sale } } },
                    );
                }
                else if (boxParam.filters.searchType === "change"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.change } } },
                    );
                }
                else if (boxParam.filters.searchType === "withdrawal"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.withdrawal } } },
                    );
                }
                else if (boxParam.filters.searchType === "addition"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.addition } } },
                    );
                }
                else if (boxParam.filters.searchType === "spending"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.spending } } },
                    );
                }
                else if (boxParam.filters.searchType === "correction"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.correction } } },
                    );
                }
                else if (boxParam.filters.searchType === "Apertura"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.opening } } },
                    );
                }
                else if (boxParam.filters.searchType === "resguard"){
                    stages.unshift(
                        { $match : { "type": { $eq:enumBox.types.resguard } } },
                    );
                }
                else{  
                    throw('Ha ocurrido un error en la búsqueda')
                }
            }

            if(boxParam.filters.searchCoin){

                if (boxParam.filters.searchCoin === "bs"){
                    stages.unshift(
                        { $match : { "coin": { $eq: 1 } } },
                    );
                }
                else if (boxParam.filters.searchCoin === "dollar"){
                    stages.unshift(
                        { $match : { "coin": { $eq: 2 } } },
                    );
                }
                else if (boxParam.filters.searchCoin === "eur"){
                    stages.unshift(
                        { $match : { "coin": { $eq: 3 } } },
                    );
                }
                else if (boxParam.filters.searchCoin === "cop"){
                    stages.unshift(
                        { $match : { "coin": { $eq: 4 } } },
                    );
                }
                else{  
                    throw('Ha ocurrido un error en la búsqueda')
                }
            }
        }

        if(!boxParam.filters.startDate && !boxParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const box = await Box.aggregate(stages);

        return {
            results: !boxParam.isExcel ? box[0].data: box, 
            metadata: !boxParam.isExcel ? box[0].metadata: [], 
        }
    },

    //reporte de formas de pago
    boxToCloseReport: async (boxParam) => {

        // resultados por página
        const pageSize = boxParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = boxParam.pageIndex; 

        //orden por defecto
        var sortBy = { "_id.createdDate" : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(boxParam.sortBy){

            let direction = boxParam.sortBy.desc == true ? -1 : 1

            if(boxParam.sortBy.id == "date"){
                sortBy = { "_id.createdDate" : direction } 
            }else{
                sortBy = { [boxParam.sortBy.id] : direction } 
            }
        }

        let stages = [
            { $sort: {createdDate: 1} },
            { $group : {
                _id: { agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }, },
                totalInBs: {
                    $sum: { $cond: [{ $eq: ["$coin", 1] }, "$in", 0] }
                },
                totalOutBs: {
                    $sum: { $cond: [{ $eq: ["$coin", 1] }, "$out", 0] }
                },
                totalInDollar: {
                    $sum: { $cond: [{ $eq: ["$coin", 2] }, "$in", 0] }
                },
                totalOutDollar: {
                    $sum: { $cond: [{ $eq: ["$coin", 2] }, "$out", 0] }
                },
                totalInEur: {
                    $sum: { $cond: [{ $eq: ["$coin", 3] }, "$in", 0] }
                },
                totalOutEur: {
                    $sum: { $cond: [{ $eq: ["$coin", 3] }, "$out", 0] }
                },
                totalInCop: {
                    $sum: { $cond: [{ $eq: ["$coin", 4] }, "$in", 0] }
                },
                totalOutCop: {
                    $sum: { $cond: [{ $eq: ["$coin", 4] }, "$out", 0] }
                },
                date: { $last: '$createdDate' },
                agency: { $last: '$agency' } }
            },
            { $sort: sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' }, },
            { $unwind: '$agency', },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!boxParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(boxParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(boxParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (boxParam.filters) {

             //Si hay filtro de sucursal
             if(boxParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(boxParam.filters.agency) } },
                );
            }

            if(boxParam.filters.startDate && !boxParam.filters.endDate){
                const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!boxParam.filters.startDate && boxParam.filters.endDate){
                const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(boxParam.filters.startDate && boxParam.filters.endDate){
                const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!boxParam.filters.startDate && !boxParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const box = await Box.aggregate(stages);

        //Inicial y totales
        await Promise.all(box.map(async (item) => {
            await Promise.all(item.data.map(async (row)=>{
                const startDate =  moment(row.date).startOf('day');
                const endDate =  moment(row.date).endOf('day');
                const lastDate =  moment(row.date).subtract(1, 'days').endOf('day');

                const bsTotal = await Box.findOne({ 
                    coin: 1, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                const bsInitial = await Box.findOne({ 
                    coin: 1, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(lastDate)} 
                }).sort({ createdDate: -1 });

                let bsTotalFinal = bsTotal ? bsTotal.total : 0;
                let bsTotalInitial = bsInitial ? bsInitial.total : 0; 

                const dollarTotal = await Box.findOne({ 
                    coin: 2, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                const dollarInitial = await Box.findOne({ 
                    coin: 2, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(lastDate)} 
                }).sort({ createdDate: -1 });

                let dollarTotalFinal = dollarTotal ? dollarTotal.total : 0;
                let dollarTotalInitial = dollarInitial ? dollarInitial.total : 0; 

                const eurTotal = await Box.findOne({ 
                    coin: 3, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                const eurInitial = await Box.findOne({ 
                    coin: 3, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(lastDate)} 
                }).sort({ createdDate: -1 });

                let eurTotalFinal = eurTotal ? eurTotal.total : 0;
                let eurTotalInitial = eurInitial ? eurInitial.total : 0; 

                const copTotal = await Box.findOne({ 
                    coin: 4, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                const copInitial = await Box.findOne({ 
                    coin: 4, 
                    agency: row.agency._id, 
                    createdDate: { $lt: new Date(lastDate)} 
                }).sort({ createdDate: -1 });

                let copTotalFinal = copTotal ? copTotal.total : 0;
                let copTotalInitial = copInitial ? copInitial.total : 0; 

                //Verificar si hubo cierre por moneda
                /***** */
                const closedBs = await BoxClose.findOne({ 
                    coin: 1, 
                    agency: row.agency._id, 
                    createdDate: { $gte: new Date(startDate), $lte: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                let validBs = false;
                let isClosed = false;

                let inUserBs = 0;
                let inUserDollar = 0;
                let inUserEur = 0;
                let inUserCop = 0;
                let userClose = null;
                //Diferencia entre saldo final y confirmacion de saldo
                let differenceBs = 0;
                let differenceDollar = 0;
                let differenceEur = 0;
                let differenceCop = 0;

                if(closedBs){
                    validBs = closedBs.checked;
                    inUserBs = closedBs.inUser;
                    //Con que exista un registro si se hizo el cierre
                    isClosed = true;
                   
                    const user = await User.findById(closedBs.user);
                    if(user){
                        userClose = user.username;
                    }

                    differenceBs = Math.abs(bsTotalFinal - inUserBs);
                }

                //Dolar
                const closedDollar = await BoxClose.findOne({ 
                    coin: 2, 
                    agency: row.agency._id, 
                    createdDate: { $gte: new Date(startDate), $lte: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                let validDollar = false;
                if(closedDollar){
                    validDollar = closedDollar.checked;
                    inUserDollar = closedDollar.inUser;

                    differenceDollar = Math.abs(dollarTotalFinal - inUserDollar);
                }

                //Euros
                const closedEur = await BoxClose.findOne({ 
                    coin: 3, 
                    agency: row.agency._id, 
                    createdDate: { $gte: new Date(startDate), $lte: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                let validEur = false;
                if(closedEur){
                    validEur = closedEur.checked;
                    inUserEur = closedEur.inUser;

                    differenceEur = Math.abs(eurTotalFinal - inUserEur);
                }

                //Euros
                const closedCop = await BoxClose.findOne({ 
                    coin: 4, 
                    agency: row.agency._id, 
                    createdDate: { $gte: new Date(startDate), $lte: new Date(endDate)} 
                }).sort({ createdDate: -1 });

                let validCop = false;
                if(closedCop){
                    validCop = closedCop.checked;
                    inUserCop = closedCop.inUser;

                    differenceCop = Math.abs(copTotalFinal - inUserCop);
                }

                return Object.assign(row, 
                    { bsTotalInitial, bsTotalFinal, dollarTotalInitial, dollarTotalFinal, eurTotalInitial, eurTotalFinal, copTotalInitial, copTotalFinal,
                        //Datos de cierre
                        isClosed, validBs, validDollar, validEur, validCop, 
                        inUserBs, inUserDollar, inUserEur, inUserCop,
                        userClose,
                        differenceBs, differenceDollar, differenceEur, differenceCop
                    }
                );

            }))
        }));
        

        return {
            results: !boxParam.isExcel ? box[0].data: box, 
            metadata: !boxParam.isExcel ? box[0].metadata: [], 
        }
    },

    /**
     * Función para cierre de caja
     * 
     * @param {params} boxParam 
     */
    boxClose: async (boxParam) => {

        //verificar si hay data previa sino no hay apertura de caja
        let prevData = await Box.find({ agency: boxParam.agency });

         //Si hay data
         if(prevData.length > 0){

            let dataRow = boxParam.rowBox;

            for (let item of boxParam.values) {

                let initialValue = 0;
                let inValue = 0;
                let outValue = 0;
                let inUserValue = 0;
                let totalValue = 0;
                let checked = false;

                if(item.coin == 1){
                    initialValue = dataRow.bsTotalInitial;
                    inValue =  dataRow.totalInBs;
                    outValue =  dataRow.totalOutBs;
                    inUserValue = parseFloat(item.amount.toString().replace(/,/g, '')),
                    totalValue =  dataRow.bsTotalFinal;

                    //Si ingresos menos egresos es igual al valor ingresado por el gerente es valido el registro
                    if(totalValue === inUserValue){
                        checked = true;
                    }
                }else if(item.coin == 2){
                    initialValue = dataRow.dollarTotalInitial;
                    inValue =  dataRow.totalInDollar;
                    outValue =  dataRow.totalOutDollar;
                    inUserValue = parseFloat(item.amount.toString().replace(/,/g, '')),
                    totalValue =  dataRow.dollarTotalFinal;

                    //Si ingresos menos egresos es igual al valor ingresado por el gerente es valido el registro
                    if(totalValue === inUserValue){
                        checked = true;
                    }
                }else if(item.coin == 3){
                    initialValue = dataRow.eurTotalInitial;
                    inValue =  dataRow.totalInEur;
                    outValue =  dataRow.totalOutEur;
                    inUserValue = parseFloat(item.amount.toString().replace(/,/g, '')),
                    totalValue =  dataRow.eurTotalFinal;

                    //Si ingresos menos egresos es igual al valor ingresado por el gerente es valido el registro
                    if(totalValue === inUserValue){
                        checked = true;
                    }
                }else if(item.coin == 4){
                    initialValue = dataRow.copTotalInitial;
                    inValue =  dataRow.totalInCop;
                    outValue =  dataRow.totalOutCop;
                    inUserValue = parseFloat(item.amount.toString().replace(/,/g, '')),
                    totalValue =  dataRow.copTotalFinal;

                    //Si ingresos menos egresos es igual al valor ingresado por el gerente es valido el registro
                    if(totalValue === inUserValue){
                        checked = true;
                    }
                }

                //crear objeto para guardar
                let boxData = {
                    agency: boxParam.agency,
                    user: boxParam.user,
                    initial: initialValue,
                    in: inValue,
                    out: outValue,
                    inUser: inUserValue,
                    total: totalValue,
                    checked: checked,
                    coin: item.coin,
                    coinDescription: enumBox.descriptionCoin[item.coin],
                    //createdDate: moment(boxParam.date),
                }

                const closing = new BoxClose(boxData);

                const closingSaved = await closing.save();
        
                if(!closingSaved){
                    throw 'Error registrando la apertura';  
                }

            } 
           
        }else{
            throw 'No hay información para la sucursal seleccionada';
        }

    },


    /**
     * Reporte de cierres por usuario
     */
    boxCloseReport: async (boxParam) => {
 
        // resultados por página
        const pageSize = boxParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = boxParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(boxParam.sortBy){

            let direction = boxParam.sortBy.desc == true ? -1 : 1
            sortBy = { [boxParam.sortBy.id] : direction } 
            
        }

        let stages = [ 
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$agency' },
            { $unwind: '$user' },
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!boxParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(boxParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(boxParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (boxParam.filters) {

            //Si hay filtro de sucursal
            if(boxParam.filters.agency){
               stages.unshift(
                   { $match : { agency: ObjectId(boxParam.filters.agency) } },
               );
           }

           //Si hay filtro de usuario
           if(boxParam.filters.idUser){ 
                stages.unshift(
                    { $match : { user: ObjectId(boxParam.filters.idUser) } },
                );
            }

           if(boxParam.filters.startDate && !boxParam.filters.endDate){
               const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
               stages.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate) } } },
               );
           }

           if(!boxParam.filters.startDate && boxParam.filters.endDate){
               const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
               stages.unshift(
                   { $match: { createdDate: { $lte: new Date(endDate) } } },
               );
           }

           if(boxParam.filters.startDate && boxParam.filters.endDate){
               const startDate =  moment(boxParam.filters.startDate).utc().startOf('day');
               const endDate =  moment(boxParam.filters.endDate).utc().endOf('day');
               stages.unshift(
                   { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
               );
           }

       }

       if(!boxParam.filters.startDate && !boxParam.filters.endDate){
           const startDate =  moment().startOf('day');
           const endDate =  moment().endOf('day');
           stages.unshift(
               { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
           );
       }

       const boxes = await BoxClose.aggregate(stages);

       return {
           results: !boxParam.isExcel ? boxes[0].data: boxes, 
           metadata: !boxParam.isExcel ? boxes[0].metadata: [], 
       }

    },

    /**
     * Realizar correcciones de caja
     */
    boxCorrection: async (boxParam) => {

        //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
        let lastRecord = await Box.findOne({ agency: boxParam.agency, coin:boxParam.coin }).sort({ createdDate: -1 });

        if(!lastRecord){
            throw 'No hay registros de caja o no ha sido aperturada en la sucursal';
        }else{
            
            let total = parseFloat(lastRecord.total) - parseFloat(boxParam.amount.toString().replace(/,/g, ''));

            let outValue = 0;
            let inValue = 0;

            //Verificar si hay entrada o salida con la correccion
            if(Math.sign(total) == -1){
                inValue = Math.abs(total);
            }else{
                outValue = total;
            }

            let boxData = {
                agency: boxParam.agency,
                user: boxParam.user,
                totalBefore: lastRecord.total,
                in: inValue,
                out: outValue,
                total: parseFloat(boxParam.amount.toString().replace(/,/g, '')),
                coin: boxParam.coin,
                coinDescription: enumBox.descriptionCoin[boxParam.coin],
                type: enumBox.types.correction,
                typeDescription: enumBox.descriptionType[enumBox.types.correction],
                comment: boxParam.comment,
            }

            const correction = new Box(boxData);

            const correctionSaved = await correction.save();
    
            if(!correctionSaved){
                throw 'Error registrando la corrección';  
            }
        }
        
    },

    addition: async (boxParam) => {

        //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
        let lastRecord = await Box.findOne({ agency: boxParam.agency, coin:boxParam.coin }).sort({ createdDate: -1 });

        if(!lastRecord){
            throw 'No hay registros de caja o no ha sido aperturada en tu sucursal';
        }else{
            //Registrar salida de caja
            let total = parseFloat(lastRecord.total) + parseFloat(boxParam.amount.toString().replace(/,/g, ''));

            let boxData = {
                agency: boxParam.agency,
                user: boxParam.user,
                totalBefore: lastRecord.total,
                in: parseFloat(boxParam.amount.toString().replace(/,/g, '')),
                out: 0,
                total: total,
                coin: boxParam.coin,
                coinDescription: enumBox.descriptionCoin[boxParam.coin],
                type: enumBox.types.addition,
                typeDescription: "Ingreso",
                comment: boxParam.comment,
            }

            const addition = new Box(boxData);

            const additionSaved = await addition.save();
    
            if(!additionSaved){
                throw 'Error registrando el retiro';  
            }
        }
    },
}

module.exports = boxService;