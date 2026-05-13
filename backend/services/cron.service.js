const db = require('../_helpers/db');
const moment = require('moment');
const nodemailer = require('nodemailer');
const Inventory = db.Inventory;
const User = db.User;
const CronRecord = db.CronRecord;
const InventoryRecord = db.InventoryRecord;
const InventoryReport = db.InventoryReport;
const AdjustmentRecord = db.AdjustmentRecord;
const Miscellaneous = db.Miscellaneous;
const MiscellaneousInventory = db.MiscellaneousInventory;
const MiscellaneousInventoryRecord = db.MiscellaneousInventoryRecord;
const MiscellaneousAdjustmentRecord = db.MiscellaneousAdjustmentRecord;
const PendingPayments = db.PendingPayments;
const AccountsPayable = db.AccountsPayable;
const Product = db.Product;
const CommissionsReport = db.CommissionsReport;
/* Código para borrar */
const Assets = db.Assets;
const AuthorizationCode = db.AuthorizationCode;
/* FIN del Código para borrar */
const enumOut = require('../enums/typeOut.enum'); 
const enumTypesSupply = require('../enums/typeSupply.enum'); 

const salesService = require('../services/sales.service');
const inventoryService = require('../services/inventory.service');

let cronService = {

    /**
     * Cron para actualizar inventario y actualizar totales 
     * 
     * @param {params} agencyParam 
     */
    cronInventory: async (id) => {

        if(id=="UdWTcFo65if3EGDzwOFG"){
            
            //fecha para actualizar dependiendo de la hora a la que se ejecuta el cron
            const updateDate =  moment().subtract(1, 'days').endOf('day');//Ayer
            //const updateDate =  moment().endOf('day');//Hoy
            console.log('cron ejecutado al:', moment());
            //1. Consultar todo el inventario
            const inventories = await Inventory.find();

            const products = await Product.find();

            try {
                for (let inventory of inventories) {

                    let actualDate = moment(updateDate).subtract(4, 'hours');
                    var totalKg = 0;
                    let kg = inventory.kg.toFixed(3);
                   
                    //Por default el valor fisico es el kg pero se valida si existe el campo physical y se asigna en dado caso
                    let physical = inventory.kg.toFixed(3);

                    //Si existe el campo physical se toma ese valor de lo contrario kg por precaucion
                    if('physical' in inventory){
                        if(inventory.physical >= 0){
                            physical = inventory.physical.toFixed(3);
                        }
                    }

                    if(inventory.updatedDate){

                        //Verificar si la ultima modificacion del valor fisico fue realizada el dia anterior 
                        let updateInventory = moment(updateDate).isSame(inventory.updatedDate, 'day');
    
                        //2. Actualizar inventario: igualar total aritmetico al fisico
                        if(updateInventory){
    
                            //registrar la entrada en historial
                            let inventoryRecordParam = {}
                            inventoryRecordParam.product = inventory.product;
                            inventoryRecordParam.agency = inventory.agency;
                            inventoryRecordParam.kg = kg;//arrastrar kg anterior
                            inventoryRecordParam.in = 0;
                            inventoryRecordParam.adjustment = physical;
                            inventoryRecordParam.total = physical;
                            inventoryRecordParam.note = ' ';
                            inventoryRecordParam.comment = 'cron update';
                            inventoryRecordParam.type = enumOut.out.adjustment;
                            inventoryRecordParam.createdDate = actualDate; //ultimo registro del dia
                            const record = new InventoryRecord(inventoryRecordParam);
                            const recordSaved = await record.save();
                
                            if(!recordSaved){
                                throw 'Error registrando el inventario';  
                            }
    
                            totalKg = physical;
    
                        //3. Si no se registro inventario fisico: igualar fisico al total aritmetico 
                        }else{
                            const user = await User.findOne({username: "adminDev"})
                            //registrar en historial de ajustes el mismo total aritmetico
                            let adjustmentRecordParam = {}
                            adjustmentRecordParam.user = user.id;//usuario desarrollo 
                            adjustmentRecordParam.product = inventory.product;//producto
                            adjustmentRecordParam.agency = inventory.agency;//sucursal
                            adjustmentRecordParam.kg = kg;// inventario fisico es el aritmetico
                            adjustmentRecordParam.createdDate = actualDate; //ultimo registro del dia
                            const record = new AdjustmentRecord(adjustmentRecordParam);
                            const recordSaved = await record.save();
    
                            if(!recordSaved){
                                throw 'Error registrando el ajuste';  
                            }
    
                            //el total queda igual 
                            totalKg = kg;
                        }
    
                        
                    }else{
                        const user = await User.findOne({username: "adminDev"})
                        //registrar en historial de ajustes el mismo total aritmetico
                        let adjustmentRecordParam = {}
                        adjustmentRecordParam.user = user.id;//usuario desarrollo 
                        adjustmentRecordParam.product = inventory.product;//producto
                        adjustmentRecordParam.agency = inventory.agency;//sucursal
                        adjustmentRecordParam.kg = kg;// inventario fisico es el aritmetico
                        adjustmentRecordParam.createdDate = actualDate; //ultimo registro del dia
                        const record = new AdjustmentRecord(adjustmentRecordParam);
                        const recordSaved = await record.save();
    
                        if(!recordSaved){
                            throw 'Error registrando el ajuste';  
                        }
    
                        //el total queda igual 
                        totalKg = kg;
                    }

                    //  Si el producto está activo
                    if (totalKg != 0){

                        //registrar una entrada ficticia en historial para el dia de hoy
                        let inventoryRecordParam = {}
                        inventoryRecordParam.product = inventory.product;
                        inventoryRecordParam.agency = inventory.agency;
                        inventoryRecordParam.kg = kg;//arrastrar kg anterior
                        inventoryRecordParam.in = 0//kgs entrantes
                        inventoryRecordParam.total = totalKg;
                        inventoryRecordParam.note = ' ';
                        inventoryRecordParam.comment = 'cron: Reporte ficticio';
                        const record = new InventoryRecord(inventoryRecordParam);
                        const recordSaved = await record.save();
            
                        if(!recordSaved){
                            throw 'Error registrando el inventario';  
                        }
                    }
                    
                    //4. Actualizar inventario
                    await Inventory.findOneAndUpdate({ _id: inventory.id }, { kg: totalKg, physical: 0 });
                }

                //5. Guardar ejecucion del cron
                let cronData = {}
                cronData.name = 'Inventario físico';
                cronData.result = 'Exitoso';
                cronData.finish = true;
                const cronRecord = new CronRecord(cronData);
                await cronRecord.save();

            } catch (error) {
                //5. Guardar ejecucion del cron fallo
                let cronData = {}
                cronData.name = 'Inventario físico';
                cronData.result = error;
                cronData.finish = false;
                const cronRecord = new CronRecord(cronData);
                await cronRecord.save();
            }

            
        }else{
            throw 'Sin autorización de ejecutar cron';  
        }

    },

     /**
     * Funcion para obtener historial de ejecución del cron
     */
    dataTableHistoryCron: async (cronParam) => {

        // resultados por página
        const pageSize = cronParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = cronParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(cronParam.sortBy){
            let direction = cronParam.sortBy.desc == true ? -1 : 1
            sortBy = { [cronParam.sortBy.id] : direction } 
        }

        let stages = [
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
        ];

        //Filtros para la consulta normal como para el total
        if (cronParam.filters) {


            if(cronParam.filters.startDate && !cronParam.filters.endDate){
                const startDate =  moment(cronParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!cronParam.filters.startDate && cronParam.filters.endDate){
                const endDate =  moment(cronParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(cronParam.filters.startDate && cronParam.filters.endDate){
                const startDate =  moment(cronParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(cronParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

        if(!cronParam.filters.startDate && !cronParam.filters.endDate){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const cron = await CronRecord.aggregate(stages);

        return {
            results:  cron[0].data, 
            metadata: cron[0].metadata, 
        }
    },

    /**
     * Funcion para incrementar en una unidad los dias acumulados en que el crédito no ha sido pagado
     */
    cronPendingPayments: async (id) => {
        
        if(id=="UdWTcFo65if3EGDzwOFG"){

            // Se incrementa en uno el tiempo de los dias pendientes de todas las cuentas pendientes
            try{
                await PendingPayments.updateMany({ status: false  }, { $inc: { "daysCounter": 1 }});
                await AccountsPayable.updateMany({ status: false }, { $inc: { daysCounter: 1 } });
                console.log('La actualizacion de los dias pendientes se realizó correctamente');
            }
            catch(e){
                console.log('ERROR ', e)
            }

            // Se genera el reporte general de formas de pago
            try {
                await salesService.createPaymentMethodsGeneralReport();
                console.log('El reporte general de formas de pago se realizó correctamente');
            }
            
            catch(e){
                console.log('ERROR ', e)
            }
        
            // Se modifica los dias en reparacion de los activos aumentando uno si el activo está en reparación 
            try{
                await Assets.updateMany({ status: 'EN REPARACIÓN' }, { $inc: { "daysUnderRepair": 1 }});
                await Assets.updateMany({ status: { $ne:'EN REPARACIÓN'} }, { "daysUnderRepair": 0 });
                console.log('Se modificaron los dias de los activos en reparación, correctamente')
            }
            catch(e){
                console.log('ERROR ', e)
            }

            // Se almacena el Reporte de Inventario en su respectiva base de datos 
            try{

                // Se ingresan los parámetros tal que se consiga todos los reportes de inventario de todas las tiendas
                let inventoryParam = {
                    user: {
                        role: 1,
                    },
                    sortBy: { id: 'date', desc: true },
                    filters: {
                        agency: '',
                        code: '',
                        startDate: moment().utc().subtract(1, 'days').startOf('day'),
                        endDate: moment().utc().subtract(1, 'days').endOf('day'),
                    },
                    isExcel: true
                }

                console.log('Buscando el reporte de inventario...');

                // Se obtiene el reporte de invetario de cada producto, de cada tienda, del dia anterior
                let dataTable = await inventoryService.dataTableInventoryReport(inventoryParam);

                console.log('Creando todos los reportes de inventario por producto...');

                // Se realiza un Reporte para cada uno de los productos

                dataTable.results.forEach( async (item) => {

                    delete item._id

                    item.product = item.product._id;
                    item.agency = item.agency._id;

                    let newInventoryReport = new InventoryReport(item);

                    await newInventoryReport.save();
                })

                console.log('Todos los reportes de inventario se realizaron satisfactoriamente');

            }
            catch(e){
                console.log('ERROR ', e)
            }

            // Se eliminan todos los códigos que se generaron durante el dia y no se utilizaron
            // try{
            //     await AuthorizationCode.deleteMany({status: false});
            // }
            // catch(e){
            //     console.log('ERROR ', e)
            // }

            // Se almacena el reporte de comision únicamente si es lunes 
            try{

                const actualWeekDay = moment().utc().subtract(4, 'hours').weekday();
                
                if (actualWeekDay === 1){

                    const startDate = moment().subtract(7, 'days').startOf('day'); // Lunes
                    const endDate = moment().subtract(1, 'days').endOf('day'); // Domingo

                    const salesParam = {
                        filters: {
                            startDate, 
                            endDate
                        }
                    }
                    let data = await salesService.commissionReports(salesParam);

                    
                    // Se modifica la agencia y el vendedor para ser almacenado en la Base de datos
                    for (let report of data.commissionResultsWeeklyGoal){

                        report.agency = report.agency._id;
                        report.seller = report.seller._id;
                    }
                    for (let report of data.commissionResultsWholesaleGoal){
                        
                        report.agency = report.agency._id;
                        report.seller = report.seller._id;
                    }

                    const commissionReport = new CommissionsReport({...data, startDate, endDate})
                    
                    await commissionReport.save();
                    
                    console.log('Se guardo el reporte de comision correctamente')
                }
            }
            catch(e){
                console.log('ERROR ', e)
            }
        }
    },

    cronMiscellaneous: async (id) => {
        
        if(id=="UdWTcFo65if3EGDzwOFG"){
            
            //fecha para actualizar dependiendo de la hora a la que se ejecuta el cron
            const updateDate =  moment().subtract(1, 'days').endOf('day');//Ayer
            //const updateDate =  moment().endOf('day');//Hoy
            console.log('cron ejecutado al:', moment());
            //1. Consultar todo el inventario
            const inventories = await MiscellaneousInventory.find();

            const products = await Miscellaneous.find();

            try {
                for (let inventory of inventories) {

                    let actualDate = moment(updateDate).subtract(4, 'hours');
                    var totalKg = 0;
                    let kg = inventory.kg.toFixed(3);
                   
                    //Por default el valor fisico es el kg pero se valida si existe el campo physical y se asigna en dado caso
                    let physical = inventory.kg.toFixed(3);

                    //Si existe el campo physical se toma ese valor de lo contrario kg por precaucion
                    if('physical' in inventory){
                        if(inventory.physical >= 0){
                            physical = inventory.physical.toFixed(3);
                        }
                    }

                    if(inventory.updatedDate){

                        //Verificar si la ultima modificacion del valor fisico fue realizada el dia anterior 
                        let updateInventory = moment(updateDate).isSame(inventory.updatedDate, 'day');
    
                        //2. Actualizar inventario: igualar total aritmetico al fisico
                        if(updateInventory){
    
                            //registrar la entrada en historial
                            let inventoryRecordParam = {}
                            inventoryRecordParam.product = inventory.product;
                            inventoryRecordParam.agency = inventory.agency;
                            inventoryRecordParam.kg = kg;//arrastrar kg anterior
                            inventoryRecordParam.in = 0;
                            inventoryRecordParam.adjustment = physical;
                            inventoryRecordParam.total = physical;
                            inventoryRecordParam.note = ' ';
                            inventoryRecordParam.comment = 'cron update';
                            inventoryRecordParam.type = enumOut.out.adjustment;
                            inventoryRecordParam.createdDate = actualDate; //ultimo registro del dia
                            inventoryRecordParam.amountBefore = parseFloat(kg);
                            inventoryRecordParam.amountAfter = parseFloat(physical);
                            
                            const record = new MiscellaneousInventoryRecord(inventoryRecordParam);
                            const recordSaved = await record.save();
                
                            if(!recordSaved){
                                throw 'Error registrando el inventario';  
                            }
    
                            totalKg = physical;
    
                        //3. Si no se registro inventario fisico: igualar fisico al total aritmetico 
                        }else{
                            const user = await User.findOne({username: "adminDev"})
                            //registrar en historial de ajustes el mismo total aritmetico
                            let adjustmentRecordParam = {}
                            adjustmentRecordParam.user = user.id;//usuario desarrollo 
                            adjustmentRecordParam.product = inventory.product;//producto
                            adjustmentRecordParam.agency = inventory.agency;//sucursal
                            adjustmentRecordParam.kg = kg;// inventario fisico es el aritmetico
                            adjustmentRecordParam.createdDate = actualDate; //ultimo registro del dia
                            const record = new MiscellaneousAdjustmentRecord(adjustmentRecordParam);
                            const recordSaved = await record.save();
    
                            if(!recordSaved){
                                throw 'Error registrando el ajuste';  
                            }
    
                            //el total queda igual 
                            totalKg = kg;
                        }
    
                        
                    }else{
                        const user = await User.findOne({username: "adminDev"})
                        //registrar en historial de ajustes el mismo total aritmetico
                        let adjustmentRecordParam = {}
                        adjustmentRecordParam.user = user.id;//usuario desarrollo 
                        adjustmentRecordParam.product = inventory.product;//producto
                        adjustmentRecordParam.agency = inventory.agency;//sucursal
                        adjustmentRecordParam.kg = kg;// inventario fisico es el aritmetico
                        adjustmentRecordParam.createdDate = actualDate; //ultimo registro del dia
                        const record = new MiscellaneousAdjustmentRecord(adjustmentRecordParam);
                        const recordSaved = await record.save();
    
                        if(!recordSaved){
                            throw 'Error registrando el ajuste';  
                        }
    
                        //el total queda igual 
                        totalKg = kg;
                    }

                    //  Si el producto está activo
                    if (totalKg != 0){

                        //registrar una entrada ficticia en historial para el dia de hoy
                        let inventoryRecordParam = {}
                        inventoryRecordParam.product = inventory.product;
                        inventoryRecordParam.agency = inventory.agency;
                        inventoryRecordParam.kg = kg;//arrastrar kg anterior
                        inventoryRecordParam.in = 0//kgs entrantes
                        inventoryRecordParam.total = totalKg;
                        inventoryRecordParam.note = ' ';
                        inventoryRecordParam.comment = 'cron: Reporte ficticio';
                        inventoryRecordParam.amountBefore = parseFloat(kg);
                        inventoryRecordParam.amountAfter = parseFloat(totalKg);
                        
                        const record = new MiscellaneousInventoryRecord(inventoryRecordParam);
                        const recordSaved = await record.save();
            
                        if(!recordSaved){
                            throw 'Error registrando el inventario';  
                        }
                    }
                    
                    //4. Actualizar inventario
                    await MiscellaneousInventory.findOneAndUpdate({ _id: inventory.id }, { kg: totalKg, physical: 0 });
                }

                //5. Guardar ejecucion del cron
                let cronData = {}
                cronData.name = 'Inventario físico de suministros';
                cronData.result = 'Exitoso';
                cronData.finish = true;
                const cronRecord = new CronRecord(cronData);
                await cronRecord.save();

            } catch (error) {
                //5. Guardar ejecucion del cron fallo
                let cronData = {}
                cronData.name = 'Inventario físico de suministros';
                cronData.result = error;
                cronData.finish = false;
                const cronRecord = new CronRecord(cronData);
                await cronRecord.save();
            }

            
        }else{
            throw 'Sin autorización de ejecutar cron';  
        }
    },
    
    /**
     * Funcion modificar los valores relacionados a los pedidos, que están en el inventario
     */
    cronOrders: async (id) => {
        
        if(id=="UdWTcFo65if3EGDzwOFG"){

            // Se incrementa en uno el tiempo de los dias pendientes de todas las cuentas pendientes
            try{

                let change =  {
                    order: 0,
                    orderWasConfirmed: false,
                    modification: 0,
                    modificationWasConfirmed: false
                }

                await Inventory.updateMany( change );
                console.log('Ya se pueden realizar nuevos pedidos')
            }
            catch(e){
                console.log('ERROR ', e)
            }
        }
    },

}

module.exports = cronService;