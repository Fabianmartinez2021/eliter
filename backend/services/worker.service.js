const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const User = db.User;
const Operator = db.Operator;
const Coin = db.Coin;
const Product = db.Product;
const Agency = db.Agency;
const Offer = db.Offer;
const Sales = db.Sales;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const role = require('../enums/roles.enum');
const moment = require('moment');


let workerService = {

    registerOperator: async (workerParam) => {

        // Buscar usuario
        if (await Operator.findOne({ firstName: workerParam.firstName, lastName: workerParam.lastName })) {
            throw 'El vendedor ' + workerParam.firstName + ' ' + workerParam.lastName + ' ya está registrado';
        }

        const operator = new Operator(workerParam);

        const operatorSaved = await operator.save();

        if (!operatorSaved) {
            throw 'Hubo un error guardando el vendedor. Intentelo de nuevo';
        }
    }, 

    getOperators: async () => {

        const operators = await Operator.find().populate('agency','name')

        return {
            results: operators, 
        }
    },

    getOperatorById: async (id) => {

        return await Operator.findById(id);
    },

    updateOperator: async (id, workerParam) => {

        const operator = await Operator.findById(id);

        // Validar
        if (!operator) throw 'Usuario no encontrado';
        if ((operator.firstName !== workerParam.firstName) || (operator.lastName !== workerParam.lastName) ) {
            if (await Operator.findOne({ firstName: workerParam.firstName, lastName: workerParam.lastName })) {
                throw 'El vendedor ' + workerParam.firstName + ' ' + workerParam.lastName + ' ya está registrado';
            }
        }

        // copiar propiedades de workerParam a user
        Object.assign(operator, workerParam);

        // save user
        const operatorSaved = await operator.save();

        if (!operatorSaved) {
            throw 'Hubo un error guardando el vendedor. Intentelo de nuevo';
        }
    }, 

    operatorPerformanceReport: async (workerParam) => {

        // INICIALMENTE SE OBTIENE EL REPORTE DE LAS COMISIONES AL MAYOR //  

        let stages = [
            { $match: { isSumation: false}},
            { $group: {'_id': '$operator', 

                // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
                total: { $sum: '$total' },        
                // Total de clientes atendidos
                totalClients: { $sum: 1 },     

                // Total de ventas al mayor
                totalWholesales: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$total" , 0] } }, 
                // Total de clientes al mayor
                totalWholesaleClients: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, 1 , 0] } }, 

                // Total de ventas al detal
                totalRetail: { $sum: { $cond: [ { $eq: ["$isWholesale", false] }, "$total" , 0] } },
                // Total de clientes al detal
                totalRetailClients: { $sum: { $cond: [ { $eq: ["$isWholesale", false] }, 1 , 0] } },

                valueDollar: { $last: "$valueDollar" },
                agency: { $last: "$agency" },
            }
            }, 
            { $lookup: { from: 'operators', localField: '_id', foreignField: '_id', as: 'operator'}},
            { $unwind: '$operator' },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $sort : { createdDate : -1 } },
        ];

        //Filtros para la consulta normal como para el total
        if (workerParam.filters) {

            //Si hay filtro de sucursal
            if(workerParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(workerParam.filters.agency) } },
                );
            }

            if(workerParam.filters.startDate && !workerParam.filters.endDate){
                const startDate =  moment(workerParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!workerParam.filters.startDate && workerParam.filters.endDate){
                const endDate =  moment(workerParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(workerParam.filters.startDate && workerParam.filters.endDate){
                const startDate =  moment(workerParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(workerParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!workerParam.filters.startDate && !workerParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
        
        const operatorPerformanceReport = await Sales.aggregate(stages);

        return {
            operatorPerformanceReport
        }
    },

    cashierPerformanceReport: async (workerParam) => {

        let stages = [
            { $match: { isSumation: false}},
            { $group: {'_id': '$user', 

                // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
                total: { $sum: '$total' },        
                // Total de clientes atendidos
                totalClients: { $sum: 1 },     

                // Total de ventas al mayor
                totalWholesales: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, "$total" , 0] } }, 
                // Total de clientes al mayor
                totalWholesaleClients: { $sum: { $cond: [ { $eq: ["$isWholesale", true] }, 1 , 0] } }, 

                // Total de ventas al detal
                totalRetail: { $sum: { $cond: [ { $eq: ["$isWholesale", false] }, "$total" , 0] } },
                // Total de clientes al detal
                totalRetailClients: { $sum: { $cond: [ { $eq: ["$isWholesale", false] }, 1 , 0] } },

                firstSale: { $first: "$createdDate" },  // Primera venta del cajero
                lastSale: { $last: "$createdDate" },    // Última venta del cajero

                valueDollar: { $last: "$valueDollar" },
                agency: { $last: "$agency" },
            }
            }, 
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user'}},
            { $unwind: '$user' },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $sort : { createdDate : -1 } },
        ];

        //Filtros para la consulta normal como para el total
        if (workerParam.filters) {

            //Si hay filtro de sucursal
            if(workerParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(workerParam.filters.agency) } },
                );
            }

            if(workerParam.filters.startDate && !workerParam.filters.endDate){
                const startDate =  moment(workerParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!workerParam.filters.startDate && workerParam.filters.endDate){
                const endDate =  moment(workerParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(workerParam.filters.startDate && workerParam.filters.endDate){
                const startDate =  moment(workerParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(workerParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!workerParam.filters.startDate && !workerParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
        
        const cashierPerformanceReport = await Sales.aggregate(stages);

        // Se obtiene el tiempo que tarda cada cajero en atender a un nuevo cliente
        cashierPerformanceReport.forEach((item) => {
            item.clientTime = (((item.lastSale - item.firstSale) / 1000 / 60) / item.totalClients)
        })

        return {
            cashierPerformanceReport
        }
    },
}

module.exports = workerService;