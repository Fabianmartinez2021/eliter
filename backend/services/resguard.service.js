const db = require('../_helpers/db');
const Resguard = db.Resguard;
const Box = db.Box;
const BoxClose = db.BoxClose;
const enumBox = require('../enums/box.enum'); 
const role = require('../enums/roles.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const User = db.User;


const boxService = require('../services/box.service');

let resguardService = {

    // Ingreso de dinero a caja fuerte o resguardo
    addition: async (user, resguardParam) => {

        // El ingreso de dinero a resguardo unicamente lo pueden hacer los gerentes de las tiendas
       

        // Únicamente se puede realizar resguardo antes de realizar cierre de caja en el día

        const startDate =  moment().utc().subtract(4, 'hours').startOf('day');
        const endDate =  moment().utc().subtract(4, 'hours').endOf('day');

        const query = {
            agency: user.agency,
            createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)},
        }

        const boxIsClosed = await BoxClose.find(query);

        if(boxIsClosed.length > 0){
            throw('Ya se realizó cierre de caja. Espere hasta mañana para realizar el resguardo')
        }

        // Dado que se va a pasar el dinero de la caja al resguardo, se tiene entonces que retirar de uno y adicionar en el otro
        let lastBoxBsRecord = await Box.findOne({ agency: resguardParam.agency, coin: 1 }).sort({ createdDate: -1 });
        let lastBoxDollarRecord = await Box.findOne({ agency: resguardParam.agency, coin: 2 }).sort({ createdDate: -1 });
        let lastBoxEurRecord = await Box.findOne({ agency: resguardParam.agency, coin: 3 }).sort({ createdDate: -1 });
        let lastBoxCopRecord = await Box.findOne({ agency: resguardParam.agency, coin: 4 }).sort({ createdDate: -1 });

        // Se obtienen los valores que se van pasar de la caja al resguardo
        let amountBs = parseFloat(resguardParam.amountBs.toString().replace(/,/g, ''));
        let amountDollar = parseFloat(resguardParam.amountDollar.toString().replace(/,/g, ''));
        let amountEur = parseFloat(resguardParam.amountEur.toString().replace(/,/g, ''));
        let amountCop = parseFloat(resguardParam.amountCop.toString().replace(/,/g, ''));

        // Obviamente no se puede procesar si el valor a retirar de la caja, es mayor a lo que hay
        if((amountBs > lastBoxBsRecord.total) || (amountDollar > lastBoxDollarRecord.total) ||(amountEur > lastBoxEurRecord.total) ||(amountCop > lastBoxCopRecord.total)){
            throw('Ninguno de los montos a retirar, puede ser mayor al monto total en caja de dicha moneda');
        }


        //Obtener ultimo registro de resguardo para la sucursal y moneda seleccionada
        let lastRecord = await Resguard.findOne({ agency: resguardParam.agency }).sort({ createdDate: -1 });

        if(!lastRecord){

            // En caso de que no haya un ultimo record, se va a crear entonces el primero en la base de datos

            resguardParam.in = true;
            resguardParam.out = false;
            
            resguardParam.amountBs = 0;
            resguardParam.amountBsBefore = 0;
            resguardParam.amountBsTotal = 0;
            resguardParam.amountDollar = 0;
            resguardParam.amountDollarBefore = 0;
            resguardParam.amountDollarTotal = 0;
            resguardParam.amountEur = 0;
            resguardParam.amountEurBefore = 0;
            resguardParam.amountEurTotal = 0;
            resguardParam.amountCop = 0;
            resguardParam.amountCopBefore = 0;
            resguardParam.amountCopTotal = 0;

            resguardParam.confirmationStatus = true;   // Unicamente util en los retiros, pero de igual es un valor requerido
                    
            resguardParam.comment = "Primer registro de resguardo" + resguardParam.comment;
            
            
            const addition = new Resguard(resguardParam);

            const additionSaved = await addition.save();

            if(!additionSaved){
                throw 'Error registrando el ingreso';  
            }
            else{
                throw 'Error este fue el primer registro. Vuelva a partir de ahora podrá realizar ingresos';
            }

        }else{

            //Registrar entrada de dinero al resguardo

            resguardParam.in = true;
            resguardParam.out = false;
            
            resguardParam.amountBs = amountBs;
            resguardParam.amountBsBefore = lastRecord.amountBsTotal;
            resguardParam.amountBsTotal = lastRecord.amountBsTotal + amountBs;
            resguardParam.amountDollar = amountDollar;
            resguardParam.amountDollarBefore = lastRecord.amountDollarTotal;
            resguardParam.amountDollarTotal = lastRecord.amountDollarTotal + amountDollar;
            resguardParam.amountEur = amountEur;
            resguardParam.amountEurBefore = lastRecord.amountEurTotal;
            resguardParam.amountEurTotal = lastRecord.amountEurTotal + amountEur;
            resguardParam.amountCop = amountCop;
            resguardParam.amountCopBefore = lastRecord.amountCopTotal;
            resguardParam.amountCopTotal = lastRecord.amountCopTotal + amountCop;
            
            resguardParam.confirmationStatus = true;   // Unicamente util en los retiros, pero de igual es un valor requerido

            // Ahora se debe realizar el retiro de caja de cada una de las monedas
            
            // Se crea un registro generico para luego unicamente cambiar la moneda
            let boxData = {
                agency: resguardParam.agency,
                user: resguardParam.user,
                in: 0,
                type: '8',
                comment: 'Retiro a resguardo',
            }
            
            // Retiro de Bolivares
            boxData.coin = 1;
            boxData.out = amountBs;
            boxData.amount = amountBs;
            await boxService.withdrawal(boxData) 

            // Retiro de Dolares
            boxData.coin = 2;
            boxData.out = amountDollar;
            boxData.amount = amountDollar;
            await boxService.withdrawal(boxData)
            
            // Retiro de Euros
            boxData.coin = 3;
            boxData.out = amountEur;
            boxData.amount = amountEur;
            await boxService.withdrawal(boxData)
            
            // Retiro de Pesos
            boxData.coin = 4;
            boxData.out = amountCop;
            boxData.amount = amountCop;
            await boxService.withdrawal(boxData)
            
            
            const addition = new Resguard(resguardParam);

            const additionSaved = await addition.save();

            if(!additionSaved){
                throw 'Error registrando el ingreso';  
            }
        }
        
    },

    // Retiro de dinero
    withdrawal: async (user, resguardParam) => {


             
     
        // El retiro de dinero a resguardo unicamente lo pueden hacer los gerentes de las tiendas
      

        // Inicialmente se debe corroborar que no se tenga otro retiro por confirmar
        let lastWithdrawal = await Resguard.findOne({ agency: resguardParam.agency, out: true}).sort({ createdDate: -1 });
       
     
         
        // Se obtienen los valores que se van pasar de la caja al resguardo
        let amountBs = parseFloat(resguardParam.amountBs.toString().replace(/,/g, ''));
        let amountDollar = parseFloat(resguardParam.amountDollar.toString().replace(/,/g, ''));
        let amountEur = parseFloat(resguardParam.amountEur.toString().replace(/,/g, ''));
        let amountCop = parseFloat(resguardParam.amountCop.toString().replace(/,/g, ''));

        


        //Obtener ultimo registro de resguardo para la sucursal y moneda seleccionada
        let lastRecord = await Resguard.findOne({ agency: resguardParam.agency }).sort({ createdDate: -1 });

        if(!lastRecord){
            throw 'ERROR: Aún no se ha registrado nada en el resguardo';  
        }else{

      
           // Obviamente no se puede procesar si el valor a retirar de la caja, es mayor a lo que hay
         if((amountBs >  lastRecord.amountBsTotal) || (amountDollar > lastRecord.amountDollarTotal ) ||(amountEur > lastRecord.amountEurTotal) ||(amountCop >lastRecord.amountCopTotal)){
            throw('Ninguno de los montos a retirar, puede ser mayor al monto total en caja de dicha moneda');
        }


            //Registrar salida de dinero del resguardo

            resguardParam.in = false;
            resguardParam.out = true;
            
            resguardParam.amountBs = amountBs;
            resguardParam.amountBsBefore = lastRecord.amountBsTotal;
            resguardParam.amountBsTotal = lastRecord.amountBsTotal - amountBs;
            resguardParam.amountDollar = amountDollar;
            resguardParam.amountDollarBefore = lastRecord.amountDollarTotal;
            resguardParam.amountDollarTotal = lastRecord.amountDollarTotal - amountDollar;
            resguardParam.amountEur = amountEur;
            resguardParam.amountEurBefore = lastRecord.amountEurTotal;
            resguardParam.amountEurTotal = lastRecord.amountEurTotal - amountEur;
            resguardParam.amountCop = amountCop;
            resguardParam.amountCopBefore = lastRecord.amountCopTotal;
            resguardParam.amountCopTotal = lastRecord.amountCopTotal - amountCop;
            
            resguardParam.confirmationStatus = false;   // Unicamente util en los retiros, pero de igual es un valor requerido
            

            const withdrawal = new Resguard(resguardParam);

            const withdrawalSaved = await withdrawal.save();
    
            if(!withdrawalSaved){
                throw 'Error registrando el ingreso';  
            }
        }
    },

    // Funcion para obtener una transaccion por su id
    confirmWithdrawal: async (user, id) => {

        // Estas confirmaciones unicamente las puede hacer un administrador
        // if(user.role !== role.rol.Admin ){
        //     throw('Unicamente los Administradores pueden realizar confirmaciones')
        // }

        let update = {
            confirmationDate: moment().utc().subtract(4, 'hours'),
            confirmationStatus: true,
            confirmationUser: ObjectId(user.id)
        }

        return await Resguard.findOneAndUpdate({ _id: id }, update);
    },
    // confirmaciones multiples
    confirmMultipleWithdrawals: async (user, ids) => {
        // if (user.user.role !== role.rol.Admin) {
        //     throw new Error('Unicamente los Administradores pueden realizar confirmaciones');
        // }
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Debe proporcionar una lista de IDs válida');
        }

        let update = {
            confirmationDate: moment().utc().subtract(4, 'hours'),
            confirmationStatus: true,
            confirmationUser: ObjectId(user.id)
        };

    
        // Ejecutar todas las actualizaciones en paralelo con Promise.all
        const updatePromises = ids.map(id => 
            Resguard.findOneAndUpdate({ _id: id }, update)
        );

        const results = await Promise.all(updatePromises);

        return results;
    },
    

    // Reporte de resguardo (Para ver cuanto hay actualmente)
    resguardReport: async (resguardParam) => {


        // Se consulta el ultimo valor agregado en el resguardo
        let stagesConsult = [
            { $group : {
                _id: { agency: '$agency' },
                id: { $last: "$_id" } 
              } 
            },
            { $lookup: { from: "resguards", localField: "id", foreignField: "_id", as: "cosa" }, },
            { $unwind: { path: "$cosa" } },
            { $replaceRoot: { newRoot: "$cosa" } },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'users',  localField: 'confirmationUser', foreignField: '_id', as: 'confirmationUser' } },
            { $unwind: { path: "$confirmationUser", preserveNullAndEmptyArrays: true } },
        ]

        // Tambien se buscan los ultimos retiros para ser mostrados junto al saldo actual
        let stagesWithdrawal = [
            { $match : { out: true } },
            { $group : {
                _id: { agency: '$agency' },
                id: { $last: "$_id" } 
              } 
            },
            { $lookup: { from: "resguards", localField: "id", foreignField: "_id", as: "cosa" }, },
            { $unwind: { path: "$cosa" } },
            { $replaceRoot: { newRoot: "$cosa" } },
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'users',  localField: 'confirmationUser', foreignField: '_id', as: 'confirmationUser' } },
            { $unwind: { path: "$confirmationUser", preserveNullAndEmptyArrays: true } },
        ];

        //Si es admin o supervisor ve todos las sucursales

        //Si el rol es Gerente, solo su sucursal
        if(resguardParam.user.role == role.rol.Manager){
            stagesConsult.unshift(
                { $match : { agency: ObjectId(resguardParam.user.agency) } },
            );
            stagesWithdrawal.unshift(
                { $match : { agency: ObjectId(resguardParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (resguardParam.filters && resguardParam.filters.agency) {
            stagesConsult.unshift(
                { $match : { agency: ObjectId(resguardParam.filters.agency) } },
            );
            stagesWithdrawal.unshift(
                { $match : { agency: ObjectId(resguardParam.filters.agency) } },
            );
        }
        
        if( resguardParam.filters && resguardParam.filters.startDate ){
            const startDate =  moment(resguardParam.filters.startDate).utc().startOf('day');
            stagesConsult.unshift(
                { $match: { createdDate: { $lte: new Date(startDate) } } },
            );
            stagesWithdrawal.unshift(
                { $match: { createdDate: { $lte: new Date(startDate) } } },
            );
        }

        // Ultimo registro (ingreso o retiro)
        const results1 = await Resguard.aggregate(stagesConsult);
        // Ultimo retiro
        const results2 = await Resguard.aggregate(stagesWithdrawal);

        // Se agrupan por agencia
        const results = results1.map((item) => {
            
            let result = {
                lastOperation: null,
                lastWithdrawal: null
            }

            let correspondigData = results2.find((item2) => item2.agency._id.toString() === item.agency._id.toString());

            result.lastOperation = item;
            result.lastWithdrawal = correspondigData ? correspondigData : {};

            return result
        })

        const response = {
            results: results,
            metadata: [],
        }

        return response;
    },

    // Historial de todos los reportes de resguardo
    resguardHistory: async (resguardParam) => {

        // resultados por página
        const pageSize = resguardParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = resguardParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(resguardParam.sortBy){
            let direction = resguardParam.sortBy.desc == true ? -1 : 1
            sortBy = { [resguardParam.sortBy.id] : direction } 
        }

        let stages = [
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'users',  localField: 'confirmationUser', foreignField: '_id', as: 'confirmationUser' } },
            { $unwind: { path: "$confirmationUser", preserveNullAndEmptyArrays: true } },
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!resguardParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(resguardParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(resguardParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (resguardParam.filters) {

            //Si hay filtro de sucursal
            if(resguardParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(resguardParam.filters.agency) } },
                );
            }

            if(resguardParam.filters.startDate && !resguardParam.filters.endDate){
                const startDate =  moment(resguardParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!resguardParam.filters.startDate && resguardParam.filters.endDate){
                const endDate =  moment(resguardParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(resguardParam.filters.startDate && resguardParam.filters.endDate){
                const startDate =  moment(resguardParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(resguardParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!resguardParam.filters.startDate && !resguardParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const resguard = await Resguard.aggregate(stages);

        return {
            results: !resguardParam.isExcel ? resguard[0].data: resguard, 
            metadata: !resguardParam.isExcel ? resguard[0].metadata: [], 
        }
    },

    // Historial de todos los retiros de resguardo
    resguardWithdrawalsHistory: async (resguardParam) => {

        // resultados por página
        const pageSize = resguardParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = resguardParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(resguardParam.sortBy){
            let direction = resguardParam.sortBy.desc == true ? -1 : 1
            sortBy = { [resguardParam.sortBy.id] : direction } 
        }

        let stages = [
            { $match: {out: true}},  // Unicamente las salidas
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'users',  localField: 'confirmationUser', foreignField: '_id', as: 'confirmationUser' } },
            { $unwind: { path: "$confirmationUser", preserveNullAndEmptyArrays: true } },
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!resguardParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(resguardParam.user.role == role.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(resguardParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (resguardParam.filters) {

            //Si hay filtro de sucursal
            if(resguardParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(resguardParam.filters.agency) } },
                );
            }

            if(resguardParam.filters.startDate && !resguardParam.filters.endDate){
                const startDate =  moment(resguardParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!resguardParam.filters.startDate && resguardParam.filters.endDate){
                const endDate =  moment(resguardParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(resguardParam.filters.startDate && resguardParam.filters.endDate){
                const startDate =  moment(resguardParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(resguardParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        if(!resguardParam.filters.showAll && !resguardParam.filters.startDate && !resguardParam.filters.endDate){
            stages.unshift(
                { $match: { confirmationStatus: false } },
            );
        }
       
        const resguard = await Resguard.aggregate(stages);

        return {
            results: !resguardParam.isExcel ? resguard[0].data: resguard, 
            metadata: !resguardParam.isExcel ? resguard[0].metadata: [], 
        }
    },
    
    // Funcion para obtener una transaccion por su id
    getResguardOperation: async (user, id) => {

        return await Resguard.findById(id).populate('agency','name').populate('user');
    },

}

module.exports = resguardService;