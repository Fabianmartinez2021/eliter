const db = require('../_helpers/db');
const { Agency } = require('../_helpers/db');
const Sales = db.Sales;
const Inventory = db.Inventory;
const InventoryRecord = db.InventoryRecord;
const Coin = db.Coin;
const Product = db.Product;
const Offer = db.Offer;
const Ticket = db.Ticket;
const Box = db.Box;
const WholesaleClient = db.WholesaleClient;
const Wholesales = db.Wholesales;
const PendingPayments = db.PendingPayments;
const enumBox = require('../enums/box.enum'); 
const enumSales = require('../enums/sales.enum'); 
const enumOut = require('../enums/typeOut.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const role = require('../enums/roles.enum');
const Client = db.Client;

let salesService = {

    /**
     * Función para registrar ventas
     * 
     * @param {params} salesParam 
     */
    create: async (salesParam) => {

        // Comprobacion de errores y existencia de datos fundamentales
        if (!salesParam.isWholesale){
            throw('Error en el registro. Recargue la página y registre la venta de nuevo')
        }
        if (!(salesParam.valueDollar) || !(salesParam.valueCop) || !(salesParam.valueEur)){
            throw('Error en el registro. Recargue la página y registre la venta de nuevo')
        }

        //Verificar si el cambio en caja es posible el egreso
        if(salesParam.changeData){

            let coin = salesParam.changeData.typeChange;
            let value = salesParam.changeData.changeAmmount;
            let ammount = parseFloat(value.toString().replace(/,/g, ''));

            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await Box.findOne({ agency: salesParam.agency, coin:coin }).sort({ createdDate: -1 });

            if(lastRecord){
                //Registrar egreso en caja
                let totalOut = parseFloat(lastRecord.total) - ammount;
                if(Math.sign(totalOut) == -1){
                    throw 'El monto ingresado de cambio supera el total en caja, verifique e intente nuevamente';
                }
            }
        }

        //Si no es de tipo credito
        if(salesParam.type !== 1){
            //data metodos de pago
            if(salesParam.ves !== ""){
                salesParam.ves = parseFloat(salesParam.ves.toString().replace(/,/g, ''));
            }
            if(salesParam.dollar !== ""){
                salesParam.dollar = parseFloat(salesParam.dollar.toString().replace(/,/g, ''));
            }
            if(salesParam.eur !== ""){
                salesParam.eur = parseFloat(salesParam.eur.toString().replace(/,/g, ''));
            }
            if(salesParam.cop !== ""){
                salesParam.cop = parseFloat(salesParam.cop.toString().replace(/,/g, ''));
            }
            if(salesParam.tAmmount !== ""){
                salesParam.tAmmount = parseFloat(salesParam.tAmmount.toString().replace(/,/g, ''));
            }
            if(salesParam.pAmmount !== ""){
                salesParam.pAmmount = parseFloat(salesParam.pAmmount.toString().replace(/,/g, ''));
            }
            if(salesParam.pAmmountExtra !== ""){
                salesParam.pAmmountExtra = parseFloat(salesParam.pAmmountExtra.toString().replace(/,/g, ''));
            }
        }

        let totalDifferential = 0;

        let products = []
       //Crear array de productos vendidos
        for (let item of salesParam.items) {
            
            // Comprobacion de errores con ventas al mayor
            if ((!(item.isWholesale) || (item.isWholesale === false) || !(item.regularPrice) || !(item.price))){
                throw('Error en el registro. Recargue la página y registre la venta de nuevo')
            }
           
            
            //sacar diferencial si es oferta o es una venta al mayor
            let differential = (parseFloat(item.kg) * item.regularPrice) - (parseFloat(item.kg) * item.price);

            //  Se acumula el diferencial total
            totalDifferential += differential;

            let poductParam = {
                name: item.name,
                price: item.price,                      //  Precio del producto en la venta
                regularPrice: item.regularPrice,        //  Precio normal del producto al detal
                differential: differential.toFixed(3),  //  Diferencial de la venta (si lo hay)
                kg:item.kg,
                isOffer: false,          //  Si fue una oferta         
                isWholesale: true,  //  Si fue una venta al mayor
                total:item.total
            }
            products.push(poductParam);
          
            //Registrar salida de cada producto en inventario
            let inventory = await Inventory.findOne({ product:item.id, agency:salesParam.agency }).populate('product');

            if(inventory){
                //Registrar en historial de inventario
                let total = parseFloat(inventory.kg) - parseFloat(item.kg);
               
                let inventoryParam = {};
                inventoryParam.product = item.id;
                inventoryParam.agency = salesParam.agency;
                inventoryParam.kg = inventory.kg.toFixed(3);//arrastrar kg anterior;
                inventoryParam.in = 0;//entrada 0
                inventoryParam.out = item.kg.toFixed(3); //Salida
                inventoryParam.total = total.toFixed(3);
                inventoryParam.note = ' ';
                inventoryParam.price = item.price;                      //  Precio de venta
                inventoryParam.regularPrice = item.regularPrice;        //  Precio regular o normal al detal   
                inventoryParam.differential = differential.toFixed(3);  //  Diferencial
                inventoryParam.isOffer = false;                  //  Si fue una oferta
                inventoryParam.isWholesale = true;  //  Si fue una venta al mayor (el condicional es provisional)
                inventoryParam.type = enumOut.out.sale;

                const record = new InventoryRecord(inventoryParam);
                await record.save();

                //Actualizar total en inventario
                await Inventory.findOneAndUpdate({ product:item.id, agency:salesParam.agency }, { kg:total });

                try{
                    //si es merma por empaque o picadillo
                    if(inventory.product && (inventory.product.decrease || inventory.product.mincemeat)){

                        let average = 0.012;
                        let typeOut = enumOut.out.decrease;
                        // prodmedio si es picadillo
                        if(inventory.product.mincemeat){
                            average = 0.010;
                            typeOut = enumOut.out.mincemeat;
                        }

                        //Marcar salida de inventario en historial por merma
                        let totalDecrease = total - average*parseFloat(item.kg);//.012
                        let decrease = average*parseFloat(item.kg);

                        let decreaseParam = {};
                        decreaseParam.product = item.id;
                        decreaseParam.agency = salesParam.agency;
                        decreaseParam.kg = total;//arrastrar kg anterior;
                        decreaseParam.in = 0;//entrada 0
                        decreaseParam.out = decrease.toFixed(3); //Salida
                        decreaseParam.total = totalDecrease.toFixed(3);
                        decreaseParam.note = ' ';
                        decreaseParam.comment = '';
                        decreaseParam.type = typeOut;

                        const recordDecrease = new InventoryRecord(decreaseParam);
                        await recordDecrease.save();

                        //Actualizar total en inventario
                        await Inventory.findOneAndUpdate({ product:item.id, agency:salesParam.agency }, { kg:totalDecrease });
                    }
                }catch(e){
                    console.log('error en merma o picadillo',e);
                }
                

            }else{
                //Inicializar inventario en 0 y hacer las operaciones
                //llegado a este punto se realizó una venta sin inventario

                //Registrar en historial de inventario
                let total = 0 - parseFloat(item.kg);
                
                let newProd = {};

                newProd.product = item.id;
                newProd.agency = salesParam.agency;
                newProd.kg = total;
                const inventory = new Inventory(newProd);
                await inventory.save();

                //registrar salida en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = salesParam.agency;
                inventoryRecordParam.kg = 0;//
                inventoryRecordParam.in = 0;//kgs entrantes
                inventoryRecordParam.out = item.kg.toFixed(3); //Salida
                inventoryRecordParam.total = total.toFixed(3);
                inventoryRecordParam.note = ' ';
                inventoryRecordParam.price = item.price;//precio de venta
                inventoryRecordParam.regularPrice = item.regularPrice;//precio regular si es oferta
                inventoryRecordParam.differential = differential.toFixed(3);
                inventoryRecordParam.isOffer = false;
                inventoryParam.isWholesale = true;  //  Si fue una venta al mayor (el condicional es provisional)
                inventoryRecordParam.type = enumOut.out.sale;
                
                const record = new InventoryRecord(inventoryRecordParam);
                await record.save();

                //Obtener producto para saber si tiene merma por empaque
                let product = await Product.findOne({ _id:item.id });
                try{
                    //si es merma por empaque
                    if(product.decrease || product.mincemeat){

                        let average = 0.012;
                        let typeOut = enumOut.out.decrease;
                        // prodmedio si es picadillo
                        if(product.mincemeat){
                            average = 0.010;
                            typeOut = enumOut.out.mincemeat;
                        }

                        //Marcar salida de inventario en historial por merma
                        let totalDecrease = total - average*parseFloat(item.kg);//.012
                        let decrease = average*parseFloat(item.kg);

                        let decreaseParam = {};
                        decreaseParam.product = item.id;
                        decreaseParam.agency = salesParam.agency;
                        decreaseParam.kg = total;//arrastrar kg anterior;
                        decreaseParam.in = 0;//entrada 0
                        decreaseParam.out = decrease.toFixed(3); //Salida
                        decreaseParam.total = totalDecrease.toFixed(3);
                        decreaseParam.note = ' ';
                        decreaseParam.type = typeOut;

                        const recordDecrease = new InventoryRecord(decreaseParam);
                        await recordDecrease.save();

                        //Actualizar total en inventario
                        await Inventory.findOneAndUpdate({ product:item.id, agency:salesParam.agency }, { kg:totalDecrease });
                    }
                }catch(e){
                    console.log('error en merma o picadillo',e);
                }
            }
        }
 
        //si no cobra por punto de venta
        if(salesParam.terminal === ""){
            delete salesParam.terminal;
        }
        //si no cobra por punto de venta extra
        if(salesParam.terminalExtra === ""){
            delete salesParam.terminalExtra;
        }

        //crear array de productos
        salesParam.products = products;

        //  Se almacena el diferencial total
        salesParam.differential = totalDifferential;
        
        const sale = new Sales(salesParam);

        const saleSaved = await sale.save();

        //  Se almacena también en su base de datos respectiva

        if(!saleSaved){
            throw 'Error registrando la venta';  
        }

        //  Se relacionan las bases de datos mediante el numero de orden
        salesParam.order = saleSaved.order

        const wholesale = new Wholesales(salesParam);

        const wholesaleSaved = await wholesale.save();

        if(!wholesaleSaved){
            throw 'Error registrando la venta al mayor';  
        }else{
            console.log('Se registró la venta al mayor con exito');  
        }
        

        if(!saleSaved){
            throw 'Error registrando la venta';  
        }else{

            /** 0. Guardar cliente en su respectiva tabla */
            if(salesParam.document){

                const client = await WholesaleClient.findOne({document:salesParam.document});

                //si el cliente no esta registrado se guarda
                if(!client){
                    const storeClient = new WholesaleClient(salesParam);
                    await storeClient.save();
                }
            }

            //1. Registrar entrada en caja por monedas

            //BsS
            if(salesParam.ves !== "" && salesParam.ves > 0){
                let coin = 1;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await Box.findOne({ agency: salesParam.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalVes = parseFloat(lastRecord.total) + parseFloat(salesParam.ves);

                    let boxData = {
                        agency: salesParam.agency,
                        user: salesParam.user,
                        totalBefore: lastRecord.total,
                        in: salesParam.ves.toFixed(2),
                        out: 0,
                        total: totalVes.toFixed(2),
                        coin: coin,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    await saleBox.save();
                }
               
            }
             //Dolares
            if(salesParam.dollar !== "" && salesParam.dollar > 0){
                let coin = 2;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await Box.findOne({ agency: salesParam.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalDollar = parseFloat(lastRecord.total) + parseFloat(salesParam.dollar);

                    let boxData = {
                        agency: salesParam.agency,
                        user: salesParam.user,
                        totalBefore: lastRecord.total,
                        in: salesParam.dollar.toFixed(2),
                        out: 0,
                        total: totalDollar.toFixed(2),
                        coin: coin,
                        valueDollar: salesParam.valueDollar,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    await saleBox.save();
                }
            }
            //Euros
            if(salesParam.eur !== "" && salesParam.eur > 0){
                let coin = 3;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await Box.findOne({ agency: salesParam.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalEur = parseFloat(lastRecord.total) + parseFloat(salesParam.eur);

                    let boxData = {
                        agency: salesParam.agency,
                        user: salesParam.user,
                        totalBefore: lastRecord.total,
                        in: salesParam.eur.toFixed(2),
                        out: 0,
                        total: totalEur.toFixed(2),
                        coin: coin,
                        valueEur: salesParam.valueEur,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    await saleBox.save();
                }
            }
            //Pesos
            if(salesParam.cop !== "" && salesParam.cop > 0){
                let coin = 4;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await Box.findOne({ agency: salesParam.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalCop = parseFloat(lastRecord.total) + parseFloat(salesParam.cop);

                    let boxData = {
                        agency: salesParam.agency,
                        user: salesParam.user,
                        totalBefore: lastRecord.total,
                        in: salesParam.cop.toFixed(2),
                        out: 0,
                        total: totalCop.toFixed(2),
                        coin: coin,
                        valueCop: salesParam.valueCop,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    await saleBox.save();
                }
            }

            //2. Registrar cambio en caja
            if(salesParam.changeData){

                let coin = salesParam.changeData.typeChange;
                let value = salesParam.changeData.changeAmmount;
                let amount = parseFloat(value.toString().replace(/,/g, ''));

                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await Box.findOne({ agency: salesParam.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Registrar egreso en caja
                    let totalOut = parseFloat(lastRecord.total) - amount;

                    let boxData = {
                        agency: salesParam.agency,
                        user: salesParam.user,
                        totalBefore: lastRecord.total,
                        in: 0,
                        out: amount,
                        total: totalOut.toFixed(2),
                        coin: coin,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.change,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.change],
                    }

                    if (coin === 1)
                        boxData.valueDollar = salesParam.valueDollar
                    
                    if (coin === 2)
                        boxData.valueEur = salesParam.valueEur
                    
                    if (coin === 3)
                        boxData.valueCop = salesParam.valueCop
                    
                    const saleBox = new Box(boxData);
                    await saleBox.save();
                }
            }

            //Eliminar ticket si es el caso
            if(salesParam.idTicket){
                await Ticket.deleteOne({ _id: salesParam.idTicket });
            }
        }

        return saleSaved;

    },

    /**
     * Función para actualizar ventas
     * 
     * @param {id} id de venta 
     * @param {params} salesParam
     
    update: async (id, salesParam) => {
        const sale = await Sales.findById(id);

        // Validar
        if (!sale) throw 'venta no encontrada';

        //fecha de actualización
        sale.updatedDate = Date.now();

        // copiar propiedades de salesParam a sale
        Object.assign(sale, salesParam);
        
        await sale.save();
    },

    /**
     * Función para obtener
     * 
     * @param {id} id de venta 
     
    getSale: async (id) => {
        const sale = await Sales.findById(id);

        // Validar
        if (!sale) throw 'venta no encontrada';

        return sale;
    },

    /**
     * Funcion para obtener todos las ventas
     
    getAll: async () => {
        return await Sales.find().sort({name: 'asc'});
    },

    /**
     * Funcion para obtener las ventas con paginación y filtros
     * 
     * Ventas generales
     
    dataTable: async () => {
        //const sales = await Sales.find().populate('agency','name').sort({createdDate: -1});
        const sales = await Sales.aggregate([
            {
                $lookup: {
                    from: 'agencies',
                    localField: 'agency',
                    foreignField: '_id',
                    as: 'agency'
                }, 
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }, 
            },
            //total de punto de venta
            { $addFields: { totalTerminal:  { $add : [ { $ifNull: [ "$pAmmount", 0 ] }, { $ifNull: [ "$pAmmountExtra", 0 ] } ] } } },
            {
                $unwind: '$agency',
            },
            {
                $unwind: '$user',
            },
            { $sort : { createdDate : -1} }
        ]);
        return {
            results: sales, 
        }
    },

    /**
     * Funcion para obtener las ventas con paginación y filtros
     * 
     * Filtra por rol de usuario y sucursal 
     
    salesTable: async (salesParam) => {

        // resultados por página
        const pageSize = salesParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = salesParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(salesParam.sortBy){
            let direction = salesParam.sortBy.desc == true ? -1 : 1
            sortBy = { [salesParam.sortBy.id] : direction } 
        }

        //stage o query principal
        const stages = [ 
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $lookup: { from: 'users',  localField: 'user', foreignField: '_id', as: 'user' } },
            //total de punto de venta
            { $addFields: { totalTerminal:  { $add : [ { $ifNull: [ "$pAmmount", 0 ] }, { $ifNull: [ "$pAmmountExtra", 0 ] } ] } } },
            { $unwind: '$agency' },
            { $unwind: '$user' },
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } }
        ];
      
        //stage del total 
        let stageTotal = [ {  $group : { _id: null, totalAmount: { $sum: "$total" } } } ];

        //Si es admin o supervisor ve todos las sucursales y usuarios

        //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
        if((salesParam.user.role == role.rol.Cashier) || (salesParam.user.role == role.rol.Manager)){
            stages.unshift(
                { $match : { agency: ObjectId(salesParam.user.agency) } },
            );
            stageTotal.unshift(
                { $match : { agency: ObjectId(salesParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (salesParam.filters) {

            //Si hay filtro de cajero
            if(salesParam.filters.cashier){
                
                stages.unshift(
                    { $match : { user: ObjectId(salesParam.filters.cashier) } },
                );
                stageTotal.unshift(
                    { $match : { user: ObjectId(salesParam.filters.cashier) } },
                );
            }

             //Si hay filtro de sucursal
             if(salesParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(salesParam.filters.agency) } },
                );
                stageTotal.unshift(
                    { $match : { agency: ObjectId(salesParam.filters.agency) } },
                );
            }

            //Si hay filtro por numero de ticket
            if(salesParam.filters.ticket){
                stages.unshift(
                    { $match: { order: { $eq: parseInt(salesParam.filters.ticket) } } },
                );
                stageTotal.unshift(
                    { $match: { order: { $eq: parseInt(salesParam.filters.ticket) } } },
                );
            }

            //Si hay filtro por nombre
            if(salesParam.filters.names){
                let regex = new RegExp(salesParam.filters.names,'gi');
                stages.unshift(
                    { $match: { names: { $regex: regex } } },
                );
                stageTotal.unshift(
                    { $match: { names: { $regex: regex } } },
                );
            }

            //Si hay filtro por referencia
            if(salesParam.filters.reference){
                let regex = new RegExp(salesParam.filters.reference,'gi');
                stages.unshift(
                    { $match: { $or: [ { pReference: { $regex: regex } }, { tReference: { $regex: regex } }, { pReferenceExtra: { $regex: regex } }] } },
                );
                stageTotal.unshift(
                    { $match: { $or: [ { pReference: { $regex: regex } }, { tReference: { $regex: regex } }, { pReferenceExtra: { $regex: regex } }] } },
                );
            }

            //Si hay filtro por Código del producto
            if(salesParam.filters.productCode){

                // Se busca el nombre del producto por su código
                let product = await Product.findOne({code: salesParam.filters.productCode})

                if (!product){
                    return {
                        results: [], 
                        metadata: [],
                        total: 0
                    }
                    //throw('No existe un producto con ese código. Intente de nuevo')
                }

                stages.unshift(
                    { $match: { products: { $elemMatch: { name: product.name } } }, },
                );
                stageTotal.unshift(
                    { $match: { products: { $elemMatch: { name: product.name } } }, },
                );
            }

            const stagesType = []

            //Si hay filtro por DETAL
            if(salesParam.filters.retail){
                stagesType.unshift( 
                    { type: { $eq: 1 } }, 
                );
            }

            //Si hay filtro por MAYOR
            if(salesParam.filters.wholesale){
                stagesType.unshift(
                    { type: { $eq: 2 } } ,
                );
            }

            //Si hay filtro por ABONO
            if(salesParam.filters.sumation){
                stagesType.unshift(
                    { type: { $eq: 3 } },
                );
            }

            //Si hay filtro por CRÉDITO
            if(salesParam.filters.credit){
                stagesType.unshift(
                    { type: { $eq: 4 } },
                );
            }

            if(salesParam.filters.retail || salesParam.filters.wholesale || salesParam.filters.sumation || salesParam.filters.credit){
                stages.unshift(
                    { $match: { $or: stagesType } },
                );
                stageTotal.unshift(
                    { $match: { $or: stagesType } },
                );
            }

            //Si hay filtro por DETAL
            if(salesParam.filters.retail){
                stages.unshift(
                    { $match: { type: { $eq: 1 } } },
                );
                stageTotal.unshift(
                    { $match: { type: { $eq: 1 } } },
                );
            }
            //Si hay filtro por MAYOR
            if(salesParam.filters.wholesale){
                stages.unshift(
                    { $match: { type: { $eq: 2 } } },
                );
                stageTotal.unshift(
                    { $match: { type: { $eq: 2 } } },
                );
            }

            //Si hay filtro por ABONO
            if(salesParam.filters.sumation){
                stages.unshift(
                    { $match: { type: { $eq: 3 } } },
                );
                stageTotal.unshift(
                    { $match: { type: { $eq: 3 } } },
                );
            }

            //Si hay filtro por CRÉDITO
            if(salesParam.filters.credit){
                stages.unshift(
                    { $match: { type: { $eq: 4 } } },
                );
                stageTotal.unshift(
                    { $match: { type: { $eq: 4 } } },
                );
            }*/

/*            if(salesParam.filters.startDate && !salesParam.filters.endDate){
                const startDate =  moment(salesParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!salesParam.filters.startDate && salesParam.filters.endDate){
                const endDate =  moment(salesParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(salesParam.filters.startDate && salesParam.filters.endDate){
                const startDate =  moment(salesParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(salesParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }

        }

         //Si todos los filtros son vacios se consulta la fecha actual
        if( !salesParam.filters.cashier && !salesParam.filters.ticket &&  !salesParam.filters.reference && !salesParam.filters.names &&
            !salesParam.filters.startDate && !salesParam.filters.endDate){
            const startDate =  moment().startOf('day');
            const endDate =  moment().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
            stageTotal.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const sales = await Sales.aggregate(stages);

        let total = []

        //Sumar total si las fechas se definieron o si es el día actual
        if((salesParam.filters.startDate && salesParam.filters.endDate) || (!salesParam.filters.startDate && !salesParam.filters.endDate)){
            //Total del resultado
            total = await Sales.aggregate(stageTotal);
        }
       
        return {
            results: sales[0].data, 
            metadata: sales[0].metadata,
            total 
        }
    },

    //Obtener data necesaria para ventas 
    dataFormSale: async (idAgency) => {
        const coins = await Coin.find()
        const products = await Product.find().sort({name: 'asc'});
        const agency = await Agency.findById(idAgency).populate('terminal');
        const offers = await Offer.find({agency: idAgency}).populate('product')

        return {
            coins,
            products,
            agency,
            offers
        }
    },*/

}


module.exports = salesService;