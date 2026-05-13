const db = require('../_helpers/db');
const { Agency } = require('../_helpers/db');
const SalesFiscal = db.SalesFiscal;
const InventoryFiscal = db.InventoryFiscal;
const InventoryRecordFiscal = db.InventoryRecordFiscal;
const Coin = db.Coin;
const Product = db.Product;
const Offer = db.Offer;
const Ticket = db.Ticket;
const Box = db.Box;
const BoxFiscal = db.BoxFiscal;
const WholesaleFiscalClient = db.WholesaleFiscalClient;
const WholesalesFiscal = db.WholesalesFiscal;
const PendingPaymentsFiscal = db.PendingPaymentsFiscal;
const enumBox = require('../enums/box.enum'); 
const enumOut = require('../enums/typeOut.enum');
const role = require('../enums/roles.enum');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
const salesFiscalService = require('./salesFiscal.service');

let pendingPaymentsFiscalService = {

    /**
     * Función para crear un crédito o pago pendiente
     * 
     * @param {params} dataParams 
     */

    create: async (dataParams) => { 

        let totalDifferential = 0;
    
        let products = []
        
        // Se crea un arreglo de los _id agregados para eliminarlos en caso de que ocurra algun problema
        let dataToDelete = {
            InventoryRecord: [],
            Sales: null,
            Wholesales: null,
            WholesaleFiscalClient: null,
            PendingPayments: null
        }
        
        try {     

        //Crear array de productos vendidos
        for (let item of dataParams.items) {

            //sacar diferencial si es oferta o es una venta al mayor
            let differential = ((item.isOffer) || (item.isWholesale)) ? ((parseFloat(item.kg) * item.regularPrice) - (parseFloat(item.kg) * item.wholesalePriceBs)) : 0;
            
            // En caso de que sea un delivery, el diferencial es cero
            if ((item.code[0] === "D") || (item.code[0] === "d")){
                differential = 0;
            }

            //  Se acumula el diferencial total
            totalDifferential += differential;
            
            let poductParam = {
                name: item.name,
                price: item.wholesalePriceBs,                      //  Precio del producto en la venta 
                wholesalePrice: item.wholesalePrice,    //  Precio normal del producto al Mayor
                regularPrice: item.regularPrice,        //  Precio normal del producto al Detal
                differential: differential,  //  Diferencial de la venta (si lo hay)
                kg:item.kg,
                isOffer: item.isOffer,          //  Si fue una oferta         
                isWholesale: item.isWholesale,  //  Si fue una venta al mayor
                total:item.total,                       //  Total en bolivares
                totalDollars: item.totalDollars,         //  Total en dolares
                taxed: item.taxed,      // ← Nuevo
                exempt: item.exempt
            }

            products.push(poductParam);

            if (item.code && item.code[0] !== 'D' && item.code[0] !== 'd') {
                try {
                    const combosDifferential = await salesFiscalService.processCombos(
                        { agency: dataParams.agency, isWholesale: false, isCredit: true },
                        item,
                        dataToDelete
                    );
                    totalDifferential += combosDifferential;
                    continue;
                } catch (err) {
                    const msg = err && err.message ? err.message : String(err);
                    if (!msg.includes('No se encontró el combo')) {
                        throw err;
                    }
                }
            }

            // En caso de que sea un delivery, es decir que el código comienza por la letra "D", no se va a incluir en el inventario sino que unicamente se verá en el ticket
            if ((item.code[0] === "D") || (item.code[0] === "d")){
                continue;
            }

            
            //Registrar salida de cada producto en inventario
            let inventory = await InventoryFiscal.findOne({ product:item.id, agency:dataParams.agency }).populate('product');

            if(inventory){
                //Registrar en historial de inventario
                let total = parseFloat(inventory.kg) - parseFloat(item.kg);
                
                let inventoryParam = {};
                inventoryParam.product = item.id;
                inventoryParam.agency = dataParams.agency;
                inventoryParam.kg = inventory.kg;//arrastrar kg anterior;
                inventoryParam.in = 0;//entrada 0
                inventoryParam.out = item.kg; //Salida
                inventoryParam.total = total;
                inventoryParam.note = ' ';
                inventoryParam.price = item.price;                      //  Precio de venta
                inventoryParam.regularPrice = item.regularPrice;        //  Precio regular o normal al detal   
                inventoryParam.differential = differential;  //  Diferencial
                inventoryParam.isOffer = item.isOffer;                  //  Si fue una oferta
                inventoryParam.isWholesale = item.isWholesale ? true : false;  //  Si fue una venta al mayor (el condicional es provisional)
                inventoryParam.isCredit = dataParams.isCredit ? true : false; //  Si fue una venta a crédito
                inventoryParam.type = enumOut.out.sale;

                const record = new InventoryRecordFiscal(inventoryParam);
                const recordSaved = await record.save();
                dataToDelete.InventoryRecord.push(recordSaved._id)

                //Actualizar total en inventario
                await InventoryFiscal.findOneAndUpdate({ product:item.id, agency:dataParams.agency }, { kg:total });

                try{
                    //si es merma por empaque o picadillo
                    if(inventory.product && 
                        !dataParams.isWholesale &&
                        (inventory.product.decrease || inventory.product.mincemeat)){

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
                        decreaseParam.agency = dataParams.agency;
                        decreaseParam.kg = total;//arrastrar kg anterior;
                        decreaseParam.in = 0;//entrada 0
                        decreaseParam.out = decrease.toFixed(3); //Salida
                        decreaseParam.total = totalDecrease.toFixed(3);
                        decreaseParam.note = ' ';
                        decreaseParam.comment = '';
                        decreaseParam.type = typeOut;

                        const recordDecrease = new InventoryRecordFiscal(decreaseParam);
                        const recordDecreaseSaved = await recordDecrease.save();
                        dataToDelete.InventoryRecord.push(recordDecreaseSaved._id)

                        //Actualizar total en inventario
                        await InventoryFiscal.findOneAndUpdate({ product:item.id, agency:dataParams.agency }, { kg:totalDecrease });
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
                newProd.agency = dataParams.agency;
                newProd.kg = total;
                const inventory = new InventoryFiscal(newProd);
                await inventory.save();

                //registrar salida en historial
                let inventoryRecordParam = {}
                inventoryRecordParam.product = item.id;
                inventoryRecordParam.agency = dataParams.agency;
                inventoryRecordParam.kg = 0;//
                inventoryRecordParam.in = 0;//kgs entrantes
                inventoryRecordParam.out = item.kg; //Salida
                inventoryRecordParam.total = total;
                inventoryRecordParam.note = ' ';
                inventoryRecordParam.price = item.price;//precio de venta
                inventoryRecordParam.regularPrice = item.regularPrice;//precio regular si es oferta
                inventoryRecordParam.differential = differential;
                inventoryRecordParam.isOffer = item.isOffer;
                inventoryParam.isWholesale = item.isWholesale ? true : false;  //  Si fue una venta al mayor (el condicional es provisional)
                inventoryParam.isCredit = dataParams.isCredit ? true : false; //  Si fue una venta a crédito
                inventoryRecordParam.type = enumOut.out.sale;
                
                const record = new InventoryRecordFiscal(inventoryRecordParam);
                const recordSaved = await record.save();
                dataToDelete.InventoryRecord.push(recordSaved._id)

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
                        decreaseParam.agency = dataParams.agency;
                        decreaseParam.kg = total;//arrastrar kg anterior;
                        decreaseParam.in = 0;//entrada 0
                        decreaseParam.out = decrease.toFixed(3); //Salida
                        decreaseParam.total = totalDecrease.toFixed(3);
                        decreaseParam.note = ' ';
                        decreaseParam.type = typeOut;

                        const recordDecrease = new InventoryRecordFiscal(decreaseParam);
                        const recordDecreaseSaved = await recordDecrease.save();
                        dataToDelete.InventoryRecord.push(recordDecreaseSaved._id)
        
                        //Actualizar total en inventario
                        await InventoryFiscal.findOneAndUpdate({ product:item.id, agency:dataParams.agency }, { kg:totalDecrease });
                    }
                }catch(e){
                    console.log('error en merma o picadillo',e);
                }
            }
        }
     
        //si no cobra por punto de venta
        if(dataParams.terminal === ""){
            delete dataParams.terminal;
        }
        //si no cobra por punto de venta extra
        if(dataParams.terminalExtra === ""){
            delete dataParams.terminalExtra;
        }
    
        //  Crear array de productos
        dataParams.products = products;

         //  Se almacena el diferencial total por ventas al mayor
         dataParams.differential = totalDifferential;
         //  Se almacena el diferencial total
         dataParams.totalDifferential = totalDifferential;

        //  Se guarda como una venta normal en bolivares, ya luego se obtiene el diferencial total
        const sale = new SalesFiscal(dataParams);

        const saleSaved = await sale.save();
        dataToDelete.Sales = saleSaved._id;

         if(!saleSaved){
            throw 'Error registrando la venta';  
        }

        // Ahora se relacionan todas las bases de datos mediante el numero de orden 
        dataParams.order = saleSaved.order;
        //  Posteriormente se almacena en la base de datos de ventas al mayor  
        const wholesale = new WholesalesFiscal(dataParams);

        const wholesaleSaved = await wholesale.save();
        dataToDelete.Wholesales = wholesaleSaved._id;

        if(!wholesaleSaved){
            throw 'Error registrando la venta al mayor';  
        }

        //  Finalmente se registra la deuda pendiente
        //  Inicialmente la deuda pendiente es igual a la total PERO hay que dejarla en dolares
        dataParams.pending = dataParams.totalDollar;
        dataParams.total = dataParams.totalDollar;
        const pendingPayment = new PendingPaymentsFiscal(dataParams);

        const pendingPaymentSaved = await pendingPayment.save();
        dataToDelete.PendingPayments = pendingPaymentSaved._id;

        if((!saleSaved) || (!wholesaleSaved) || (!pendingPaymentSaved)){
            throw 'Error registrando la venta';  
        }else{

            /** 0. Guardar cliente en su respectiva tabla */

            const client = await WholesaleFiscalClient.findOne({document:dataParams.document});

            //si el cliente no esta registrado se guarda
            if(!client){
                const storeClient = new WholesaleFiscalClient(dataParams);

                storeClient.pendingPayment = pendingPayment;

                const storeClientSaved = await storeClient.save();
                dataToDelete.WholesaleFiscalClient = storeClientSaved._id;
            }
            else{   
                //  De lo contrario se modifica el status de del cliente
                client.isSolvent = false;

                client.pendingPayment = pendingPayment;

                const clientSaved = await client.save();
                dataToDelete.WholesaleFiscalClient = clientSaved._id;
            }   


            //Eliminar ticket si es el caso
            if(dataParams.idTicket){
                await Ticket.deleteOne({ _id: dataParams.idTicket });
            }
        }

        return pendingPaymentSaved;

        } 
        catch (error) {

            // Se eliminan todos los registros de inventario que se hayan creado, para de esta manera no descontrolar balance
            for (let recordID of dataToDelete.InventoryRecord) {

                // Se busca el record almacenado
                let item = await InventoryRecordFiscal.findByIdAndDelete(recordID)
                
                // Se obtiene el inventario modificado
                let inventory = await InventoryFiscal.findOne({ product:item.product, agency:dataParams.agency }).populate('product');

                if(inventory){
                    // Se vuelve a sumar lo restado por los kg del producto
                    let total = parseFloat(inventory.kg) + parseFloat(item.out);
                                
                    //Actualizar total en inventario
                    await InventoryFiscal.findOneAndUpdate({ product:item.product, agency:dataParams.agency }, { kg:total });
                }
            }

            // Se elimina el ticket que se haya registrado
            if (dataToDelete.Sales){
                await SalesFiscal.findByIdAndDelete(dataToDelete.Sales)
            }

            // Se elimina el ticket al mayor que se haya registrado
            if (dataToDelete.Wholesales){
                await WholesalesFiscal.findByIdAndDelete(dataToDelete.Wholesales)
            }
            
            // Se elimina la cuenta pendiente que se haya registrado
            if (dataToDelete.PendingPayments){
                await PendingPaymentsFiscal.findByIdAndDelete(dataToDelete.PendingPayments)
            }

            // Se elimina la cuenta pendiente colocada en el cliente y este sigue estando solvente
            if (dataToDelete.WholesaleFiscalClient){
                await WholesaleFiscalClient.findOneAndUpdate({_id: dataToDelete.WholesaleFiscalClient}, {pendingPayment: {}, isSolvent: true});
            }

            // Ya que se procesó el error, se vuelve a lanzar
            throw(error)
        }    

    
    },

    /**
     * Función para actualizar un pago pendiente, ya sea con un abono o por un pago total
     * 
     * @param {params} dataParams 
     */
    update: async (id, dataParams) => {


        /*  PARCHE COMPLETAMENTE BORRABLE */

        if (dataParams.isTelesale === ""){
            dataParams.isTelesale = false;
        }

        /* FIN DEL PARCHE COMPLETAMENTE BORRABLE  */


    /*  Los pagos pendientes se van a manejar como una venta pero sin la modificacion de inventario, ya que esta 
        fué realizado en el momento que se generó el crédito */

        
        //Verificar si el cambio en caja es posible el egreso
        if(dataParams.changeDataPayment){

            let coin = dataParams.changeDataPayment.typeChangePayment;
            let value = dataParams.changeDataPayment.changeAmmountPayment;
            let ammount = parseFloat(value.toString().replace(/,/g, ''));

            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await BoxFiscal.findOne({ agency: dataParams.agency, coin:coin }).sort({ createdDate: -1 });

            if(lastRecord){
                //Registrar egreso en caja
                let totalOut = parseFloat(lastRecord.total) - ammount;
                if(Math.sign(totalOut) == -1){
                    throw 'El monto ingresado de cambio supera el total en caja, verifique e intente nuevamente';
                }
            }
        }


        const idPendingPayment = parseInt(id)

        //  Se obtiene el pago pendiente a actualizar
        const pendingPayment = await PendingPaymentsFiscal.findOne({ order: idPendingPayment})

        // Se guardan los datos del mismo pago pendiente, en caso de que surja algun problema, entonces se deja como estaba 
        const pendingPaymentBackup = await PendingPaymentsFiscal.findOne({ order: idPendingPayment}).lean();
        delete pendingPaymentBackup._id;
        delete pendingPaymentBackup.__v
        

        //Blindaje para la duplicacion de los datos
        
        //Imposible modificar un pago pendiente que ya fué pagado
        if (pendingPayment.status){
            throw 'El abono ya fué pagado';
        }
        // Mínimo 10 s entre abonos (evitar duplicados por doble envío)
        if (pendingPayment.payments.length !== 0){

            let lastPayment = pendingPayment.payments[0];

            let msSinceLastPayment = moment().diff(moment(lastPayment.createdDate));

            if(msSinceLastPayment < 10000){
                throw 'Está intentando un abono consecutivo en la misma cuenta, por favor espere 10 segundos e intente nuevamente';
            }
        }


        //  Se proceden a actualizar los valores del pago pendiente con los nuevos valores 
        //data metodos de pago
        if(dataParams.ves !== ""){
            dataParams.ves = parseFloat(dataParams.ves.toString().replace(/,/g, ''));
            pendingPayment.ves += dataParams.ves;
        }
        if(dataParams.dollar !== ""){
            dataParams.dollar = parseFloat(dataParams.dollar.toString().replace(/,/g, ''));
            pendingPayment.dollar += dataParams.dollar;
        }
        if(dataParams.eur !== ""){
            dataParams.eur = parseFloat(dataParams.eur.toString().replace(/,/g, ''));
            pendingPayment.eur += dataParams.eur;
        }
        if(dataParams.cop !== ""){
            dataParams.cop = parseFloat(dataParams.cop.toString().replace(/,/g, ''));
            pendingPayment.cop += dataParams.cop;
        }
        if(dataParams.tAmmount !== ""){
            dataParams.tAmmount = parseFloat(dataParams.tAmmount.toString().replace(/,/g, ''));
            pendingPayment.tAmmount += dataParams.tAmmount;
        }
        if(dataParams.pAmmount !== ""){
            dataParams.pAmmount = parseFloat(dataParams.pAmmount.toString().replace(/,/g, ''));
            pendingPayment.pAmmount += dataParams.pAmmount;
        }
        if(dataParams.pAmmountExtra !== ""){
            dataParams.pAmmountExtra = parseFloat(dataParams.pAmmountExtra.toString().replace(/,/g, ''));
            pendingPayment.pAmmount += dataParams.pAmmount;
        }
    
        
        //  Si hay cambio, se registra y se le resta al valor pendiente 
        if(dataParams.changeDataPayment){

            //  Se realiza la actualizacion del pago pendiente 
            let typeChange = parseInt(dataParams.changeDataPayment.typeChangePayment);
            let changeAmmount = dataParams.changeDataPayment.changeAmmountPayment;

            let totalChangeInDollars = 0;


            //  Se llevan todos los cambios a dolares para adicionarlo al total
            switch (typeChange){

                case 1:{    //  Si el cambio es en bolivares

                    totalChangeInDollars += parseFloat(changeAmmount) / parseFloat(dataParams.valueDollar);
                    dataParams.vesChange = changeAmmount;
                    pendingPayment.ves -= changeAmmount;
                    break;
                }
                case 2:{     //  Si el cambio es en dolares
                    
                    totalChangeInDollars +=  parseFloat(changeAmmount)
                    dataParams.dollarChange = changeAmmount;
                    pendingPayment.dollar -= changeAmmount;
                    break;
                }
                case 3:{    //  Si el cambio es en euros 
                    
                    totalChangeInDollars += parseFloat(changeAmmount) * parseFloat(dataParams.valueEur) / parseFloat(dataParams.valueDollar);
                    dataParams.eurChange = changeAmmount
                    pendingPayment.eur -= changeAmmount;
                    break;
                }
                case 4:{    //  Si el cambio es en pesos 
                    
                    totalChangeInDollars += parseFloat(changeAmmount) / parseFloat(dataParams.valueCop) / parseFloat(dataParams.valueDollar);
                    dataParams.copChange = changeAmmount;
                    pendingPayment.cop -= changeAmmount;
                    break;
                }
            }

            //  Si el pago no es un pago total sino un abono se verifica lo mencionado anteriormente referente al cambio
            if (!dataParams.isPayment){

                if ( totalChangeInDollars > dataParams.total)
                    throw('ERROR: El cambio no puede ser mayor a lo abonando')

                else{
                    //  Se actualiza el total del presente pago
                    dataParams.total -= totalChangeInDollars;

                    //  Se actualiza el total el pendiente
                    dataParams.pending += totalChangeInDollars;
                }
            }
        }

        //  Si el pago fué realizado en su totalidad
        if (dataParams.isPayment){

            pendingPayment.pending = 0;
            pendingPayment.status = true;
            pendingPayment.comment = dataParams.comment;
            pendingPayment.paymentDate = moment().subtract(4, 'hours');;

        }else{

            pendingPayment.pending = dataParams.pending;
        }


        //si no cobra por punto de venta
        if(dataParams.terminal === ""){
            delete dataParams.terminal;
        }
        //si no cobra por punto de venta extra
        if(dataParams.terminalExtra === ""){
            delete dataParams.terminalExtra;
        }
        
        // Se crea un arreglo de los _id agregados para eliminarlos en caso de que ocurra algun problema
        let dataToDelete = {
            InventoryRecord: [],
            Sales: null,
            Wholesales: null,
            WholesaleFiscalClient: null,
            PendingPayments: null,
            Box: []
        }
        
        try {

        //  Se almacena como una venta, aunque estará marcado como abono (isSumation = true) para luego utilizarlo
        
        //  Se lleva el total a Bs para poder almacenarlo en sales
        let dataSale  = {} ;
        Object.assign(dataSale, dataParams);

        dataSale.total = dataParams.total * dataParams.valueDollar;

        //  Se almacena el numero de orden del pago pendiente al que pertenece
        dataSale.comment = pendingPayment.order.toString();
        
        const sale = new SalesFiscal(dataSale);
        const saleSaved = await sale.save();
        dataToDelete.SalesFiscal = saleSaved._id;

        if(!saleSaved){
            throw 'Error registrando la venta';  
        }

        //  Se relacionan las bases de datos mediante el numero de orden
        dataParams.order = saleSaved.order;

        const wholesale = new WholesalesFiscal(dataParams);

        const wholesaleSaved = await wholesale.save();
        dataToDelete.WholesalesFiscal = wholesaleSaved._id;

        if(!wholesaleSaved){
            throw 'Error registrando la venta al mayor';  
        }

        //  Se almacena el pago realizado en el arreglo de los pagos de pendingPayments
        let payments = pendingPayment.payments;
        payments.unshift(dataParams)
        pendingPayment.payments = payments;
        
        const pendingPaymentSaved = await pendingPayment.save()

        if(!pendingPaymentSaved){
            throw 'Error actualizando el pago pendiente';  
        }

        //  Ahora se actualiza el pago pendiente del cliente al igual que el estatus
        const client = await WholesaleFiscalClient.findOne({document: dataParams.document})

        //  Si es un pago completo, se actualiza el pago pendiente y el estatus del cliente
        if (dataParams.isPayment){
            client.pendingPayment = {};
            client.isSolvent = true;
        }   
        //  Si es un pago unicamente se actualiza el pago pendiente
        else{
            client.pendingPayment = pendingPaymentSaved;
        }

        // En cualquier caso se aumenta el total gastado
        client.totalSpent += dataParams.total;
        
        const clientSaved = await client.save();
        dataToDelete.WholesaleFiscalClient = clientSaved._id;
        
        if(!clientSaved){
            throw 'Error actualizando el pago pendiente';  
        }else{

            //1. Registrar entrada en caja por monedas

            //BsS
            if(dataParams.ves !== "" && dataParams.ves > 0){
                let coin = 1;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await BoxFiscal.findOne({ agency: dataParams.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalVes = parseFloat(lastRecord.total) + parseFloat(dataParams.ves);

                    let boxData = {
                        agency: dataParams.agency,
                        user: dataParams.user,
                        totalBefore: lastRecord.total,
                        in: dataParams.ves.toFixed(2),
                        out: 0,
                        total: totalVes.toFixed(2),
                        coin: coin,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    const saleBoxSaved = await saleBox.save();
                    dataToDelete.Box.push(saleBoxSaved._id);
                }
                
            }
                //Dolares
            if(dataParams.dollar !== "" && dataParams.dollar > 0){
                let coin = 2;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await BoxFiscal.findOne({ agency: dataParams.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalDollar = parseFloat(lastRecord.total) + parseFloat(dataParams.dollar);

                    let boxData = {
                        agency: dataParams.agency,
                        user: dataParams.user,
                        totalBefore: lastRecord.total,
                        in: dataParams.dollar.toFixed(2),
                        out: 0,
                        total: totalDollar.toFixed(2),
                        coin: coin,
                        valueDollar: dataParams.valueDollar,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    const saleBoxSaved = await saleBox.save();
                    dataToDelete.Box.push(saleBoxSaved._id);
                }
            }
            //Euros
            if(dataParams.eur !== "" && dataParams.eur > 0){
                let coin = 3;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await BoxFiscal.findOne({ agency: dataParams.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalEur = parseFloat(lastRecord.total) + parseFloat(dataParams.eur);

                    let boxData = {
                        agency: dataParams.agency,
                        user: dataParams.user,
                        totalBefore: lastRecord.total,
                        in: dataParams.eur.toFixed(2),
                        out: 0,
                        total: totalEur.toFixed(2),
                        coin: coin,
                        valueEur: dataParams.valueEur,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    const saleBoxSaved = await saleBox.save();
                    dataToDelete.Box.push(saleBoxSaved._id);
                }
            }
            //Pesos
            if(dataParams.cop !== "" && dataParams.cop > 0){
                let coin = 4;
                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await BoxFiscal.findOne({ agency: dataParams.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Sumar monto anterior y el entrante para sacar total
                    let totalCop = parseFloat(lastRecord.total) + parseFloat(dataParams.cop);

                    let boxData = {
                        agency: dataParams.agency,
                        user: dataParams.user,
                        totalBefore: lastRecord.total,
                        in: dataParams.cop.toFixed(2),
                        out: 0,
                        total: totalCop.toFixed(2),
                        coin: coin,
                        valueCop: dataParams.valueCop,
                        coinDescription: enumBox.descriptionCoin[coin],
                        type: enumBox.types.sale,
                        order: saleSaved.order,
                        typeDescription: enumBox.descriptionType[enumBox.types.sale],
                    }
    
                    const saleBox = new Box(boxData);
                    const saleBoxSaved = await saleBox.save();
                    dataToDelete.Box.push(saleBoxSaved._id);
                }
            }

            //2. Registrar cambio en caja
            if(dataParams.changeDataPayment){

                let coin = dataParams.changeDataPayment.typeChangePayment;
                let value = dataParams.changeDataPayment.changeAmmountPayment;
                let amount = parseFloat(value.toString().replace(/,/g, ''));

                //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
                let lastRecord = await BoxFiscal.findOne({ agency: dataParams.agency, coin:coin }).sort({ createdDate: -1 });

                if(lastRecord){
                    //Registrar egreso en caja
                    let totalOut = parseFloat(lastRecord.total) - amount;

                    let boxData = {
                        agency: dataParams.agency,
                        user: dataParams.user,
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
                    
                    //Se registra el tipo de moneda
                    if (coin === 2)
                        boxData.valueDollar = dataParams.valueDollar
                    
                    if (coin === 3)
                        boxData.valueEur = dataParams.valueEur
                    
                    if (coin === 4)
                        boxData.valueCop = dataParams.valueCop
    
                    const saleBox = new Box(boxData);
                    const saleBoxSaved = await saleBox.save();
                    dataToDelete.Box.push(saleBoxSaved._id);
                }
            }

            //Eliminar ticket si es el caso
            if(dataParams.idTicket){
                await Ticket.deleteOne({ _id: dataParams.idTicket });
            }
        }

        return saleSaved;

        }
        catch (error){
            
            // Se elimina el ticket que se haya registrado
            if (dataToDelete.Sales){
                await Sales.findByIdAndDelete(dataToDelete.Sales)
            }

            // Se elimina el ticket al mayor que se haya registrado
            if (dataToDelete.Wholesales){
                await Wholesales.findByIdAndDelete(dataToDelete.Wholesales)
            }

            // Se vuelve a eliminar el monto gastado por el usuario
            if (dataToDelete.WholesaleFiscalClient){
                
                const client = await WholesaleFiscalClient.findOne({document:dataParams.document});
                
                // Se deja el pago pendiente como estaba antes
                Object.assign(client.pendingPayment, pendingPaymentBackup);
                // El cliente vuelve a estar insolvente
                client.isSolvent = false;
                // Se vuelve a restar el total gastado
                client.totalSpent -= dataParams.total;

                await client.save();
            }

            // Se eliminan todos los registros de caja, como lo son los cambios y las entradas mismas de dinero
            for (let recordID of dataToDelete.Box) {
                await BoxFiscal.findByIdAndDelete(recordID)
            } 
            
            // Se deja el pago pendiente como estaba antes
            const pendingPayment = await PendingPaymentsFiscal.findOne({ order: idPendingPayment})

            Object.assign(pendingPayment, pendingPaymentBackup);

            await pendingPayment.save();

            
            // Ya que se procesó el error, se vuelve a lanzar
            throw(error)
        }
    },


    /**
     * Funcion para obtener los pagos pendientes con paginación y filtros y por sucursal
     */
    dataTable: async (dataParams) => {

        // Resultados por página
        const pageSize = dataParams.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = dataParams.pageIndex; 

        //  Orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(dataParams.sortBy){
            let direction = dataParams.sortBy.desc == true ? -1 : 1
            sortBy = { [dataParams.sortBy.id] : direction } 
        }

        //  Filtros de busqueda

        const stages = [ 
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency'},
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' },  },
            { $unwind: '$user'},
            { $lookup: {
                from: "terminals",
                localField: "payments.terminal",
                foreignField: "_id",
                as: "terminals",
                },
            },
            {   $set: {
                  'payments': {
                    $map: {
                      'input': '$payments', 
                      'in': {
                        $mergeObjects: [
                          '$$this', {
                            'terminal': {
                              $arrayElemAt: [
                                '$terminals', {
                                  $indexOfArray: [
                                    '$terminals._id', '$$this.terminal'
                                  ]
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  }
                }
            },
            { $sort : sortBy },
        ];
        
        if(!dataParams.isExcel){
            stages.push(
                { $facet : {   
                    metadata: [ 
                        { $count: "total" } 
                    ], 
                    data: [ 
                        { $skip: (pageSize * pageIndex) - pageSize }, 
                        { $limit: pageSize } 
                    ],
                    totalPending: [
                        { $group: {
                            _id: null,
                            total: { $sum: "$pending" }
                          }},
                    ]
                } }
            )
        }

                   
        //  Filtros para la consulta normal como para el total
        if (dataParams.filters) {

           //   Filtro por agencia
            if (dataParams.filters.agency){
                stages.unshift(
                    { $match : { agency: ObjectId(dataParams.filters.agency) } },
                );
            }

            //  Filtro por numero de orden 
            if(dataParams.filters.order){
                stages.unshift(
                    { $match: { order: { $eq: parseInt(dataParams.filters.order) } } },
                );
            }

            //  Filtro por numero de documento

            if(dataParams.filters.documentClient){
                let regex = new RegExp(dataParams.filters.documentClient,'gi');
                stages.unshift(
                    { $match: { document: { $regex: regex } } },
                );
            }

            //  Filtro por cuentas sin pagar

            if(dataParams.filters.unpaid){
                stages.unshift(
                    { $match: { status: false } },
                );
            }

            //  Filtro por cuentas ya pagadas

            if(dataParams.filters.paid){
                stages.unshift(
                    { $match: { status: true } },
                );
            }

            //  Filtro por numero de código del cliente

            // if(dataParams.filters.clientCode){
            //     let regex = new RegExp(dataParams.filters.clientCode,'gi');
            //     stages.unshift(
            //         { $match: { clientCode: { $regex: regex } } },
            //     );
            // }
            
            //  Filtro por televentas

            if(dataParams.filters.telesales){
                stages.unshift(
                    { $match: { isTelesale: true } },
                );
            }
            

            if(dataParams.filters.startDate && !dataParams.filters.endDate){
                const startDate =  moment(dataParams.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!dataParams.filters.startDate && dataParams.filters.endDate){
                const endDate =  moment(dataParams.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(dataParams.filters.startDate && dataParams.filters.endDate){
                const startDate =  moment(dataParams.filters.startDate).utc().startOf('day');
                const endDate =  moment(dataParams.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

       const pendingPayments = await PendingPaymentsFiscal.aggregate(stages);

        return {
            results: !dataParams.isExcel ? pendingPayments[0].data : pendingPayments,
            metadata: !dataParams.isExcel ? pendingPayments[0].metadata : [],
            totalPending: !dataParams.isExcel ? pendingPayments[0].totalPending[0].total : 0
        }
    },

    
    /**
     * Función para buscar pago pendiente por documento de identificacion
     * 
     * autocompletado de typeahead
     * 
     * @param {id} id de usuario 
     * @param {params} dataParams
     */
    searchTypeahead: async (dataParams) => {

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
        
        let regex = new RegExp(dataParams.document,'gi');
        stages.unshift(
            { $match: { status: { $eq: false } } },
            { $match: { document: { $regex: regex } } },
        );
        
        const pendingPayments = await PendingPaymentsFiscal.aggregate(stages);
                
        return {
            results: pendingPayments[0].data, 
        }
    },
}

//Funcion para probar espera de internet 
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = pendingPaymentsFiscalService;