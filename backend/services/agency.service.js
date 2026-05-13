const db = require('../_helpers/db');
const Agency = db.Agency;
const Terminal = db.Terminal;
const Inventory = db.Inventory;
const PaymentMethodsRecord = db.PaymentMethodsRecord;
const BoxClose = db.BoxClose;
const AgencyCloseRecord = db.AgencyCloseRecord;
const role = require('../enums/roles.enum');
const webhook = require('../_helpers/webhook');


const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

let agencyService = {

    /**
     * Función para registrar sucursales
     * 
     * @param {params} agencyParam 
     */
    create: async (agencyParam) => {
        let terminal = []
        for (let item of agencyParam.terminal) {
            terminal.push(item.id)
        }
        agencyParam.terminal = terminal;

        // Calcular goalRatio (billingWeeklyGoal / invoiceWeeklyGoal)
        if (agencyParam.invoiceWeeklyGoal && agencyParam.invoiceWeeklyGoal !== 0) {
            agencyParam.goalRatio = agencyParam.billingWeeklyGoal / agencyParam.invoiceWeeklyGoal;
        } else {
            agencyParam.goalRatio = 0;
        }

        const agency = new Agency(agencyParam);

        const agencySaved = await agency.save();

        if(!agencySaved){
            throw 'Error registrando la sucursal';  
        }

        //Colocar como inactivas las terminales para otras sucursales
        for (let id of terminal) {
            const filter = { _id: id };
            const update = { used: true };
            await Terminal.findOneAndUpdate(filter, update);
        }

        // Enviar webhook a fábrica (market upsert)
        try {
            const agencyWithTerminals = await Agency.findById(agencySaved._id).populate('terminal');
            const terminalsData = (agencyWithTerminals.terminal || []).map(t => ({
                id: t.id,
                code: t.code,
                serial: t.serial,
                bank: t.bank,
                brand: t.brand,
                model: t.model,
                description: t.description
            }));
            await webhook.sendAgencyUpdate({
                agencyId: agencySaved.id,
                name: agencySaved.name,
                address: agencySaved.address,
                phone: agencySaved.phone,
                rif: agencySaved.rif,
                company: agencySaved.company,
                attendant: agencySaved.attendant,
                terminals: terminalsData,
                orderHelper: agencySaved.orderHelper ? agencySaved.orderHelper.toString() : null,
                createdDate: agencySaved.createdDate,
                updatedDate: agencySaved.updatedDate,
                action: 'created',
                billingWeeklyGoal: agencySaved.billingWeeklyGoal,
                invoiceWeeklyGoal: agencySaved.invoiceWeeklyGoal,
                goalRatio: agencySaved.goalRatio,
                billingWeeklyHistory: agencySaved.billingWeeklyHistory,
                invoiceWeeklyHistory: agencySaved.invoiceWeeklyHistory,
                lastUpdated: agencySaved.lastUpdated,
                updatedBy: agencySaved.updatedBy
            });
        } catch (e) {}
    },

    /**
     * Función para actualizar sucursales
     * 
     * @param {id} id de sucursal 
     * @param {params} agencyParam
     */
    update: async (id, agencyParam) => {


        const agency = await Agency.findById(id).populate('terminal');

        // Validar
        if (!agency) throw 'sucursal no encontrada';

        //definir terminales para asignar
        let terminal = []
        for (let item of agencyParam.terminal) {
            terminal.push(item.id)
        }
        //Terminales entrantes
        let enterTerminal = agencyParam.terminal;
        agencyParam.terminal = terminal;
        //fecha de actualización
        agencyParam.updatedDate = Date.now();

        // Calcular goalRatio (billingWeeklyGoal / invoiceWeeklyGoal)
        const invoiceGoal = agencyParam.invoiceWeeklyGoal !== undefined ? agencyParam.invoiceWeeklyGoal : agency.invoiceWeeklyGoal;
        const billingGoal = agencyParam.billingWeeklyGoal !== undefined ? agencyParam.billingWeeklyGoal : agency.billingWeeklyGoal;
        if (invoiceGoal && invoiceGoal !== 0) {
            agencyParam.goalRatio = billingGoal / invoiceGoal;
        } else {
            agencyParam.goalRatio = 0;
        }

        //Actualizar todo en la sucursal
        await Agency.findOneAndUpdate({_id:id}, agencyParam);

        //Colocar como inactivas las terminales para otras sucursales
        for (let id of terminal) {
            const filter = { _id: id };
            const update = { used: true };
            await Terminal.findOneAndUpdate(filter, update);
        }

        //definir terminales para colocar como seleccionabe "used:false"
        const remove = agency.terminal.filter((elem) => !enterTerminal.find(({ id }) => elem.id === id));

        //Colocar como activas las terminales para otras sucursales
        for (let item of remove) {
            const filter = { _id: item.id };
            const update = { used: false };
            await Terminal.findOneAndUpdate(filter, update);
        }

        // Enviar webhook a fábrica (market upsert)
        try {
            const updatedAgency = await Agency.findById(id).populate('terminal');
            const terminalsData = (updatedAgency.terminal || []).map(t => ({
                id: t.id,
                code: t.code,
                serial: t.serial,
                bank: t.bank,
                brand: t.brand,
                model: t.model,
                description: t.description
            }));
            await webhook.sendAgencyUpdate({
                agencyId: updatedAgency.id,
                name: updatedAgency.name,
                address: updatedAgency.address,
                phone: updatedAgency.phone,
                rif: updatedAgency.rif,
                company: updatedAgency.company,
                attendant: updatedAgency.attendant,
                terminals: terminalsData,
                orderHelper: updatedAgency.orderHelper ? updatedAgency.orderHelper.toString() : null,
                createdDate: updatedAgency.createdDate,
                updatedDate: updatedAgency.updatedDate,
                action: 'updated',
                billingWeeklyGoal: updatedAgency.billingWeeklyGoal,
                invoiceWeeklyGoal: updatedAgency.invoiceWeeklyGoal,
                goalRatio: updatedAgency.goalRatio,
                billingWeeklyHistory: updatedAgency.billingWeeklyHistory,
                invoiceWeeklyHistory: updatedAgency.invoiceWeeklyHistory,
                lastUpdated: updatedAgency.lastUpdated,
                updatedBy: updatedAgency.updatedBy
            });
        } catch (e) {}
    },

    /**
     * Función para obtener
     * 
     * @param {id} id de sucursal 
     */
    getAgency: async (id) => {
        const agency = await Agency.findById(id).populate('terminal');

        // Validar
        if (!agency) throw 'sucursal no encontrada';

        return agency;
    },

    /**
     * Funcion para obtener todos las sucursales
     */
    getAll: async () => {
        return await Agency.find().sort({name: 'asc'});
    },

    /**
     * Funcion para obtener las sucursales con paginación y filtros
     */
    dataTable: async () => {
        const agencies = await Agency.find().populate('terminal','code')
        return {
            results: agencies, 
        }
    },


    /**
     * Funcion para verificar el cierre de toda la tienda
     */

    closeAgency: async (agencyParams) => {

        //** Primero se verifica que todos los productos hayan sido pesados en el inventario físico

        let stages = [ 
            { $match : { agency: ObjectId(agencyParams.user.agency) } },
            { $project: {
                id:"$_id", 
                _id:0,//excluir 0 _id
                // 1 incluir
                agency: 1,
                product: 1,
                physical: 1,
                kg: { $round: [ "$kg", 3 ] },//Round valor de kg para excel
                createdDate: 1,
                updatedDate: 1
            }}
        ]

        const inventories = await Inventory.aggregate(stages);
     
		let result = inventories.every((item) => {
			
			return !(item.kg && !moment(item.updatedDate).isSame(moment().utc(), 'day'))
		})

        if (!result){
            throw('Aun faltan articulos por pesar en el inventario físico')
        }
        

        //** Se verifica que se haya cerrado formas de pago
        
        const startDate =  moment().utc().subtract(4, 'hours').startOf('day');
        const endDate =  moment().utc().subtract(4, 'hours').endOf('day');

        let stagesPMReport = [
            { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            { $match : { agency: ObjectId(agencyParams.user.agency) } }
        ];
        
        const paymentMethodsReport = await PaymentMethodsRecord.aggregate(stagesPMReport);

        if (paymentMethodsReport.length === 0){
            throw('Aún falta realizar el cierre de formas de pago')
        }


        //** Se verifica que se haya realizado cierre de caja

        
        let stagesCloseReport = [
            { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            { $match : { agency: ObjectId(agencyParams.user.agency) } }
        ];

        const boxCloseReport = await BoxClose.aggregate(stagesCloseReport);

        if (boxCloseReport.length === 0){
            throw('Aún falta realizar el cierre de caja')
        }

        // Si no es para comprobar sino para directamente cerrar la tienda se realiza el reporte de cierre

        if (!agencyParams.isTest){
        
            let stagesCloseAgency = { 
                createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
                agency: ObjectId(agencyParams.user.agency) 
            }

            const template = {
                user: agencyParams.user.id,
                agency: agencyParams.user.agency,
                comment: agencyParams.comment
            }

            // Se busca si ya se realizó un registro
            const existentReport = await AgencyCloseRecord.findOne(stagesCloseAgency);

            if (existentReport){                
                await AgencyCloseRecord.findOneAndUpdate({_id: existentReport._id}, template);
            }
            else{
                const newRecord = new AgencyCloseRecord(template);
                await newRecord.save()
            }  
        }
    },


    agencyCloseHistory: async (agencyParam) => {

        // resultados por página
        const pageSize = agencyParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = agencyParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(agencyParam.sortBy){
            let direction = agencyParam.sortBy.desc == true ? -1 : 1
            sortBy = { [agencyParam.sortBy.id] : direction } 
        }

        let stages = [
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!agencyParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(agencyParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(agencyParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (agencyParam.filters) {

            //Si hay filtro de sucursal
            if(agencyParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(agencyParam.filters.agency) } },
                );
            }

            if(agencyParam.filters.startDate && !agencyParam.filters.endDate){
                const startDate =  moment(agencyParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!agencyParam.filters.startDate && agencyParam.filters.endDate){
                const endDate =  moment(agencyParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(agencyParam.filters.startDate && agencyParam.filters.endDate){
                const startDate =  moment(agencyParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(agencyParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!agencyParam.filters.startDate && !agencyParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const results = await AgencyCloseRecord.aggregate(stages);
        
        return {
            results: !agencyParam.isExcel ? results[0].data: results, 
            metadata: !agencyParam.isExcel ? results[0].metadata: [], 
        }
    },

    /**
         * Funcion para obtener todos las sucursales
         */
    getInventoryCloseHistory: async (agencyParams) => {

        // resultados por página
        const pageSize = agencyParams.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = agencyParams.pageIndex; 

        //orden por defecto
        var sortBy = { "_id.createdDate" : -1};

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(agencyParams.sortBy){

            let direction = agencyParams.sortBy.desc == true ? -1 : 1

            if(agencyParams.sortBy.id == "date"){
                sortBy = { "_id.createdDate" : direction } 
            }else{
                sortBy = { [agencyParams.sortBy.id] : direction } 
            }
        }

        let stages = [ 
            { $group : {
                _id: { agency: '$agency', createdDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdDate" } }},
                lastUser: { $last: '$user' },
                lastProduct: { $last: '$product' },
                lastKg: { $last: '$kg' },
                date: { $last: '$createdDate' },
                agency: { $last: '$agency' } }
            },
            { $sort: sortBy },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' }, },
            { $unwind: '$agency', },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!agencyParams.isExcel){
            if (agencyParams.filters.mixData){
                stages.push(
                    { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: 0 } ] } },
                );
            }
            else{
                stages.push(
                    { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
                );
            }
        }

        //stage del total 
        let stageTotal = [ {  $group : { _id: null, totalAmount: { $sum: { $cond: [ { $eq: ["$isSumation", false] }, "$total", 0] } }, } } ];

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(agencyParams.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(agencyParams.user.agency) } },
            );
            stageTotal.unshift(
                { $match : { agency: ObjectId(agencyParams.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (agencyParams.filters) {

             //Si hay filtro de sucursal
             if(agencyParams.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(agencyParams.filters.agency) } },
                );
                stageTotal.unshift(
                    { $match : { agency: ObjectId(agencyParams.filters.agency) } },
                );
            }

            if(agencyParams.filters.startDate && !agencyParams.filters.endDate){
                const startDate =  moment(agencyParams.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!agencyParams.filters.startDate && agencyParams.filters.endDate){
                const endDate =  moment(agencyParams.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(agencyParams.filters.startDate && agencyParams.filters.endDate){
                const startDate =  moment(agencyParams.filters.startDate).utc().startOf('day');
                const endDate =  moment(agencyParams.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!agencyParams.filters.startDate && !agencyParams.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
            stageTotal.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const history = await AdjustmentRecord.aggregate(stages);


        return



        let total = []

        if(!agencyParams.isExcel){

            //Sumar total si las fechas se definieron o si es el día actual
            if((agencyParams.filters.startDate && agencyParams.filters.endDate) || (!agencyParams.filters.startDate && !agencyParams.filters.endDate)){
                //Total del resultado
                total = await AdjustmentRecord.aggregate(stageTotal);
            }
        }
        
        return {
            results: !salesParam.isExcel ? history[0].data: history, 
            metadata: !salesParam.isExcel ? history[0].metadata: [], 
            total
        }
    },
}

module.exports = agencyService;