const db = require("../_helpers/db");
const { Agency } = require("../_helpers/db");
const SalesFiscal = db.SalesFiscal;
const WholesalesFiscal = db.WholesalesFiscal;
const Inventory= db.Inventory;
const InventoryFiscal = db.InventoryFiscal;
const InventoryRecordFiscal = db.InventoryRecordFiscal;
const Coin = db.Coin;
const Product = db.Product;
const Offer = db.Offer;
const Ticket = db.Ticket;
const TicketFiscal= db.TicketFiscal;
const Box = db.Box;
const BoxFiscal = db.BoxFiscal;
const WholesaleFiscalClient = db.WholesaleFiscalClient;
const PendingPaymentsFiscal = db.PendingPaymentsFiscal;
const Combos = db.Combos;
const Seller = db.Seller;
const Operator = db.Operator;
const BoxClose = db.BoxClose;
const BoxCloseFiscal = db.BoxCloseFiscal;
const Terminal = db.Terminal;
const TerminalRecord = db.TerminalRecord;
const CommissionsReport = db.CommissionsReport;
const enumBox = require("../enums/box.enum");
const enumSales = require("../enums/sales.enum");
const enumOut = require("../enums/typeOut.enum");
const bankEnum = require("../enums/bank.enum");
const moment = require("moment");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const role = require("../enums/roles.enum");
const Client = db.Client;
const ClosingFiscal = db.ClosingFiscal;
const PaymentMethodsRecord = db.PaymentMethodsRecord;
const PaymentFiscalMethodsRecord = db.PaymentFiscalMethodsRecord;
const PaymentMethodsGeneralReportRecord = db.PaymentMethodsGeneralReportRecord;
const PromoCoupon = db.PromoCoupon;
const PromoCouponUse = db.PromoCouponUse;
const { normalizeCouponCode } = require("../_helpers/promoCoupon.helper");

const inventoryService = require("../services/inventory.service");

let salesFiscalService = {
  /**
   * Función para registrar ventas
   *
   * @param {params} salesParam
   */
  create: async (salesParam) => {

    // Si ya hubo cierre de forma de pago hoy en esta sucursal, no se pueden registrar más ventas (sí se puede colocar en espera vía Ticket)
    const startToday = moment().utc().subtract(4, "hours").startOf("day");
    const endToday = moment().utc().subtract(4, "hours").endOf("day");
    const closureExists = await PaymentMethodsRecord.findOne({
      agency: ObjectId(salesParam.agency),
      date: { $gte: new Date(startToday), $lte: new Date(endToday) },
    });
    if (closureExists) {
      throw "No se pueden registrar ventas: ya se realizó el cierre de forma de pago para hoy en esta sucursal. Solo puede colocar tickets en espera para procesarlos mañana.";
    }

    //Verificar si el cambio en caja es posible el egreso
    if (salesParam.changeData) {
      let coin = salesParam.changeData.typeChange;
      let value = salesParam.changeData.changeAmmount;
      let ammount = parseFloat(value.toString().replace(/,/g, ""));

      //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
      let lastRecord = await BoxFiscal.findOne({
        agency: salesParam.agency,
        coin: coin,
      }).sort({ createdDate: -1 });

      if (lastRecord) {
        //Registrar egreso en caja
        let totalOut = parseFloat(lastRecord.total) - ammount;
        if (Math.sign(totalOut) == -1) {
          throw "El monto ingresado de cambio supera el total en caja, verifique e intente nuevamente";
        }
      }
    }

    //Si no es de tipo credito
    if (salesParam.type !== 1) {
      //data metodos de pago
      if (salesParam.ves !== "") {
        salesParam.ves = parseFloat(
          salesParam.ves.toString().replace(/,/g, "")
        );
      }
      if (salesParam.dollar !== "") {
        salesParam.dollar = parseFloat(
          salesParam.dollar.toString().replace(/,/g, "")
        );
      }
      if (salesParam.eur !== "") {
        salesParam.eur = parseFloat(
          salesParam.eur.toString().replace(/,/g, "")
        );
      }
      if (salesParam.cop !== "") {
        salesParam.cop = parseFloat(
          salesParam.cop.toString().replace(/,/g, "")
        );
      }
      if (salesParam.tAmmount !== "") {
        salesParam.tAmmount = parseFloat(
          salesParam.tAmmount.toString().replace(/,/g, "")
        );
      }
      if (salesParam.pAmmount !== "") {
        salesParam.pAmmount = parseFloat(
          salesParam.pAmmount.toString().replace(/,/g, "")
        );
      }
      if (salesParam.pAmmountExtra !== "") {
        salesParam.pAmmountExtra = parseFloat(
          salesParam.pAmmountExtra.toString().replace(/,/g, "")
        );
      }
    }

    let differentialSum = 0; // Diferencial total por ventas al mayor u ofertas
    let wholesaleDiscountDifferentialSum = 0; // Diferencial total por venta de algún producto al mayor
    let combosDifferentialSum = 0; // Diferencial total por venta de algún producto al mayor
    let totalDifferentialSum = 0; // Diferencial total

    let products = [];

    // Se crea un arreglo de los _id agregados para eliminarlos en caso de que ocurra algun problema
    let dataToDelete = {
      InventoryRecord: [],
      Sales: null,
      Wholesales: null,
      BoxFiscal: [],
      WholesaleFiscalClient: null,
      Box: [],
    };

    try {
      // Datos para historial de cupón (si se usó cupón)
      let couponUseDataFiscal = null;

      //Crear array de productos vendidos
      for (let item of salesParam.items) {
        // Comprobacion de posibles errores con ventas al mayor

        if (salesParam.isWholesale === true) {
          if (
            !item.isWholesale ||
            item.isWholesale === false ||
            !item.regularPrice
          ) {
            throw "Error en el registro. Registre la venta de nuevo";
          }
        }

        let wholesaleTotalBs = item.isWholesale
          ? parseFloat(item.kg) * parseFloat(item.wholesalePriceBs)
          : parseFloat(item.kg) * parseFloat(item.price);

        //sacar diferencial si es oferta o es una venta al mayor y se acumula
        let differential =
          item.isOffer || item.isWholesale
            ? parseFloat(item.kg) * item.regularPrice - wholesaleTotalBs
            : 0;

        // En caso de que sea un delivery, el diferencial es cero
        if (item.code[0] === "D" || item.code[0] === "d") {
          differential = 0;
        }

        differentialSum += differential;

        // Se obtiene el diferencial por descuento al mayor (si aplica) sacando la diferencia entre el precio al mayor y el con descuento
        let wholesaleDiscountDifferential =
          item.isWholesale && item.applyWholesaleDiscount
            ? wholesaleTotalBs - item.total
            : 0;
        wholesaleDiscountDifferentialSum += wholesaleDiscountDifferential;

        //  Se acumula el diferencial total
        let totalDifferential = differential + wholesaleDiscountDifferential;
        totalDifferentialSum += totalDifferential;

        let poductParam = {
          id:item.id,
          name: item.name,
          lastPrice: item.lastPrice,
          price: item.price, //  Precio del producto en la venta
          regularPrice: item.regularPrice, //  Precio normal del producto al detal
          differential: differential, //  Diferencial de la venta (si lo hay)
          wholesaleDiscountDifferential: wholesaleDiscountDifferential,
          totalDifferential: totalDifferential,
          kg: item.kg,
          isOffer: item.isOffer, //  Si fue una oferta
          isWholesale: item.isWholesale,//  Si fue una venta al mayor
          total: item.total,
        };

        //  Si es una venta al mayor, aplica los descuentos y el otro diferencial
        if (salesParam.isWholesale) {
          poductParam.appliedWholesaleDiscount = item.applyWholesaleDiscount; // Si aplicó el descuento por venta al mayor de algún producto
          poductParam.wholesaleDiscountDifferential =
            wholesaleDiscountDifferential; // El diferemcial por descuento de venta al mayor de algun producto
        }

        products.push(poductParam);

        // Procesar como combo solo si existe en el catálogo de combos (no por prefijo C/c)
        // Si no es un combo, processCombos lanzará un error y seguimos con el producto normal.
        if (item.code[0] !== "D" && item.code[0] !== "d") {
          try {
            let combosDifferential = await processCombos(
              salesParam,
              item,
              dataToDelete
            );

            combosDifferentialSum += combosDifferential;
            totalDifferentialSum += combosDifferential;
            continue;
          } catch (err) {
            const msg = (err && err.message) ? err.message : String(err);
            if (!msg.includes('No se encontró el combo')) {
              throw err;
            }
          }
        }

        // En caso de que sea un delivery, es decir que el código comienza por la letra "D", no se va a incluir en el inventario sino que unicamente se verá en el ticket
        if (item.code[0] === "D" || item.code[0] === "d") {
          continue;
        }

        //Registrar salida de cada producto en inventario (permite saldo negativo o fila nueva)
        let inventory = await InventoryFiscal.findOne({
          product: item.id,
          agency: salesParam.agency,
        }).populate("product");

        if (inventory) {

          //Registrar en historial de inventario
          let inv = inventory.kg.toFixed(3)
          let total = parseFloat(inv) - parseFloat(item.kg);
          
          let inventoryParam = {};
          inventoryParam.product = item.id;
          inventoryParam.agency = salesParam.agency;
          inventoryParam.kg = inventory.kg; //arrastrar kg anterior;
          inventoryParam.in = 0; //entrada 0
          inventoryParam.out = item.kg; //Salida
          inventoryParam.total = total;
          inventoryParam.note = " ";
          inventoryParam.lastPrice = item.lastPrice;
          inventoryParam.price = item.price; //  Precio de venta
          inventoryParam.regularPrice = item.regularPrice; //  Precio regular o normal al detal
          inventoryParam.differential = differential; //  Diferencial
          inventoryParam.appliedWholesaleDiscount =
            item.appliedWholesaleDiscount;
          inventoryParam.wholesaleDiscountDifferential =
            wholesaleDiscountDifferential; //  Diferencial
          inventoryParam.totalDifferential = totalDifferential; //  Diferencial
          inventoryParam.isOffer = item.isOffer; //  Si fue una oferta
          inventoryParam.isWholesale = item.isWholesale ? true : false; //  Si fue una venta al mayor (el condicional es provisional)
          inventoryParam.type = enumOut.out.sale;

          const record = new InventoryRecordFiscal(inventoryParam);
          const recordSaved = await record.save();
          dataToDelete.InventoryRecord.push(recordSaved._id);

          //Actualizar total en inventario
          await InventoryFiscal.findOneAndUpdate(
            { product: item.id, agency: salesParam.agency },
            { kg: total }
          );

          try {
            //si es merma por empaque o picadillo
            if (
              inventory.product &&
              !salesParam.isWholesale &&
              (inventory.product.decrease || inventory.product.mincemeat)
            ) {
              let average = 0.012;
              let typeOut = enumOut.out.decrease;
              // prodmedio si es picadillo
              if (inventory.product.mincemeat) {
                average = 0.01;
                typeOut = enumOut.out.mincemeat;
              }

              //Marcar salida de inventario en historial por merma
              let totalDecrease = total - average * parseFloat(item.kg); //.012
              let decrease = average * parseFloat(item.kg);

              let decreaseParam = {};
              decreaseParam.product = item.id;
              decreaseParam.agency = salesParam.agency;
              decreaseParam.kg = total; //arrastrar kg anterior;
              decreaseParam.in = 0; //entrada 0
              decreaseParam.out = decrease; //Salida
              decreaseParam.total = totalDecrease;
              decreaseParam.note = " ";
              decreaseParam.comment = "";
              decreaseParam.type = typeOut;

              const recordDecrease = new InventoryRecordFiscal(decreaseParam);
              const recordDecreaseSaved = await recordDecrease.save();
              dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

              //Actualizar total en inventario
              await InventoryFiscal.findOneAndUpdate(
                { product: item.id, agency: salesParam.agency },
                { kg: totalDecrease }
              );
            }
          } catch (e) {
            console.log("error en merma o picadillo", e);
          }
        } else {
          //Inicializar inventario en 0 y hacer las operaciones
          //llegado a este punto se realizó una venta sin inventario

          //Registrar en historial de inventario
          let total = 0 - parseFloat(item.kg);

          let newProd = {};

          newProd.product = item.id;
          newProd.agency = salesParam.agency;
          newProd.kg = total;
          const inventory = new InventoryFiscal(newProd);
          await inventory.save();

          //registrar salida en historial
          let inventoryRecordParam = {};
          inventoryRecordParam.product = item.id;
          inventoryRecordParam.agency = salesParam.agency;
          inventoryRecordParam.kg = 0; //
          inventoryRecordParam.in = 0; //kgs entrantes
          inventoryRecordParam.out = item.kg; //Salida
          inventoryRecordParam.total = total;
          inventoryRecordParam.note = " ";
          inventoryParam.lastPrice = item.lastPrice;
          inventoryRecordParam.price = item.price; //precio de venta
          inventoryRecordParam.regularPrice = item.regularPrice; //precio regular si es oferta
          inventoryRecordParam.differential = differential;
          inventoryRecordParam.appliedWholesaleDiscount =
            item.appliedWholesaleDiscount;
          inventoryRecordParam.wholesaleDiscountDifferential =
            wholesaleDiscountDifferential; //  Diferencial por descuento al mayor
          inventoryRecordParam.totalDifferential = totalDifferential; //  Diferencial total
          inventoryRecordParam.isOffer = item.isOffer;
          inventoryRecordParam.isWholesale = item.isWholesale ? true : false; //  Si fue una venta al mayor (el condicional es provisional)
          inventoryRecordParam.type = enumOut.out.sale;

          const record = new InventoryRecordFiscal(inventoryRecordParam);
          const recordSaved = await record.save();
          dataToDelete.InventoryRecord.push(recordSaved._id);

          //Obtener producto para saber si tiene merma por empaque
          let product = await Product.findOne({ _id: item.id });
          try {
            //si es merma por empaque
            if (product.decrease || product.mincemeat) {
              let average = 0.012;
              let typeOut = enumOut.out.decrease;
              // prodmedio si es picadillo
              if (product.mincemeat) {
                average = 0.01;
                typeOut = enumOut.out.mincemeat;
              }

              //Marcar salida de inventario en historial por merma
              let totalDecrease = total - average * parseFloat(item.kg); //.012
              let decrease = average * parseFloat(item.kg);

              let decreaseParam = {};
              decreaseParam.product = item.id;
              decreaseParam.agency = salesParam.agency;
              decreaseParam.kg = total; //arrastrar kg anterior;
              decreaseParam.in = 0; //entrada 0
              decreaseParam.out = decrease; //Salida
              decreaseParam.total = totalDecrease;
              decreaseParam.note = " ";
              decreaseParam.type = typeOut;

              const recordDecrease = new InventoryRecordFiscal(decreaseParam);
              const recordDecreaseSaved = await recordDecrease.save();
              dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

              //Actualizar total en inventario
              await InventoryFiscal.findOneAndUpdate(
                { product: item.id, agency: salesParam.agency },
                { kg: totalDecrease }
              );
            }
          } catch (e) {
            console.log("error en merma o picadillo", e);
          }
        }
      }

      //si no cobra por punto de venta
      if (salesParam.terminal === "") {
        delete salesParam.terminal;
      }
      //si no cobra por punto de venta extra
      if (salesParam.terminalExtra === "") {
        delete salesParam.terminalExtra;
      }

      //crear array de productos
      salesParam.products = products;

      //  Se almacena el diferencial total por venta al mayor u oferta
      salesParam.differential = differentialSum;
      //  Se almacena el diferencial total si hubo la venta de un producto en específico al mayor
      salesParam.wholesaleDiscountDifferential =
        wholesaleDiscountDifferentialSum;
      //  Se almacena el diferencial por combos
      salesParam.combosDifferential = combosDifferentialSum;
      //  Se almacena el diferencial total
      salesParam.totalDifferential = totalDifferentialSum;

      // Promo cupón: solo ventas al detal contado (no mayorista, no crédito)
      const hasCouponCodeFiscal = salesParam.couponCode != null && String(salesParam.couponCode).trim() !== '';
      if (hasCouponCodeFiscal && !salesParam.isWholesale && !salesParam.isCredit) {
        const normalizedFiscal = normalizeCouponCode(salesParam.couponCode);
        if (!normalizedFiscal) {
          throw "Cupón no válido";
        }
        const totalBeforeDiscountFiscal = parseFloat(salesParam.total);
        const updatedFiscal = await PromoCoupon.findOneAndUpdate(
          { code: normalizedFiscal, used: false },
          { $set: { used: true, usedAt: new Date() } }
        );
        if (!updatedFiscal) {
          throw "Cupón ya utilizado o no válido";
        }
        salesParam.total = Math.round(totalBeforeDiscountFiscal * 0.9 * 100) / 100;
        salesParam.couponCode = normalizedFiscal;
        salesParam.couponDiscount = Math.round(totalBeforeDiscountFiscal * 0.1 * 100) / 100;
        couponUseDataFiscal = {
          couponCode: normalizedFiscal,
          totalBeforeDiscount: totalBeforeDiscountFiscal,
          totalAfterDiscount: salesParam.total,
          clientNames: salesParam.names || '',
          document: salesParam.document || '',
          phone: salesParam.phone || '',
          agency: salesParam.agency,
          user: salesParam.user
        };
      } else if (hasCouponCodeFiscal && (salesParam.isWholesale || salesParam.isCredit)) {
        salesParam.couponCode = '';
        salesParam.couponDiscount = 0;
      }

      const sale = new SalesFiscal(salesParam);

      const saleSaved = await sale.save();



      dataToDelete.Sales = saleSaved._id;

      // Si se usó cupón, registrar en historial con order de la venta fiscal
      if (couponUseDataFiscal) {
        await PromoCouponUse.create({
          couponCode: couponUseDataFiscal.couponCode,
          saleOrder: null,
          saleFiscalOrder: saleSaved.order,
          clientNames: couponUseDataFiscal.clientNames,
          document: couponUseDataFiscal.document,
          phone: couponUseDataFiscal.phone,
          totalBeforeDiscount: couponUseDataFiscal.totalBeforeDiscount,
          discountPercent: 10,
          totalAfterDiscount: couponUseDataFiscal.totalAfterDiscount,
          agency: couponUseDataFiscal.agency,
          user: couponUseDataFiscal.user
        });
      }

      //  Si es una venta al mayor, se almacena también en su base de datos respectiva
      if (salesParam.isWholesale) {
        if (!saleSaved) {
          throw "Error registrando la venta";
        }

        //  Se relacionan las bases de datos mediante el numero de orden
        salesParam.order = saleSaved.order;

        const wholesale = new WholesalesFiscal(salesParam);

        const wholesaleSaved = await wholesale.save();
        dataToDelete.Wholesales = wholesaleSaved._id;

        if (!wholesaleSaved) {
          throw "Error registrando la venta al mayor";
        }
      }

      if (!saleSaved) {
        throw "Error registrando la venta";
      } else {
        /** 0. Guardar cliente en su respectiva tabla */
        if (salesParam.document) {
          if (salesParam.isWholesale) {
            const client = await WholesaleFiscalClient.findOne({
              document: salesParam.document,
            });

            //si el cliente no esta registrado se guarda
            if (!client) {
              // Se inicializa el total gastado ajustado a dolares
              salesParam.totalSpent = salesParam.total / salesParam.valueDollar;
              const storeClient = new WholesaleFiscalClient(salesParam);
              const clientSaved = await storeClient.save();
              dataToDelete.WholesaleFiscalClient = clientSaved._id;
            } else {
              // Se modifica el total gastado ajustado a dolares
              client.totalSpent += salesParam.total / salesParam.valueDollar;
              const clientSaved = await client.save();
              dataToDelete.WholesaleFiscalClient = clientSaved._id;
            }
          } else {
            const client = await Client.findOne({
              document: salesParam.document,
            });

            //si el cliente no esta registrado se guarda
            if (!client) {
              const storeClient = new Client(salesParam);
              await storeClient.save();
            }
          }
        }

        //1. Registrar entrada en caja por monedas

        //BsS
        if (salesParam.ves !== "" && salesParam.ves > 0) {
          let coin = 1;
          //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
          let lastRecord = await BoxFiscal.findOne({
            agency: salesParam.agency,
            coin: coin,
          }).sort({ createdDate: -1 });

          if (lastRecord) {
            //Sumar monto anterior y el entrante para sacar total
            let totalVes =
              parseFloat(lastRecord.total) + parseFloat(salesParam.ves);

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
            };

            const saleBox = new BoxFiscal(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.BoxFiscal.push(saleBoxSaved._id);
          }
        }
        //Dolares
        if (salesParam.dollar !== "" && salesParam.dollar > 0) {
          let coin = 2;
          //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
          let lastRecord = await BoxFiscal.findOne({
            agency: salesParam.agency,
            coin: coin,
          }).sort({ createdDate: -1 });

          if (lastRecord) {
            //Sumar monto anterior y el entrante para sacar total
            let totalDollar =
              parseFloat(lastRecord.total) + parseFloat(salesParam.dollar);

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
            };

            const saleBox = new BoxFiscal(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.BoxFiscal.push(saleBoxSaved._id);
          }
        }
        //Euros
        if (salesParam.eur !== "" && salesParam.eur > 0) {
          let coin = 3;
          //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
          let lastRecord = await BoxFiscal.findOne({
            agency: salesParam.agency,
            coin: coin,
          }).sort({ createdDate: -1 });

          if (lastRecord) {
            //Sumar monto anterior y el entrante para sacar total
            let totalEur =
              parseFloat(lastRecord.total) + parseFloat(salesParam.eur);

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
            };

            const saleBox = new BoxFiscal(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.BoxFiscal.push(saleBoxSaved._id);
          }
        }
        //Pesos
        if (salesParam.cop !== "" && salesParam.cop > 0) {
          let coin = 4;
          //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
          let lastRecord = await BoxFiscal.findOne({
            agency: salesParam.agency,
            coin: coin,
          }).sort({ createdDate: -1 });

          if (lastRecord) {
            //Sumar monto anterior y el entrante para sacar total
            let totalCop =
              parseFloat(lastRecord.total) + parseFloat(salesParam.cop);

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
            };

            const saleBox = new BoxFiscal(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.BoxFiscal.push(saleBoxSaved._id);
          }
        }

        //2. Registrar cambio en caja
        if (salesParam.changeData) {
          let coin = salesParam.changeData.typeChange;
          let value = salesParam.changeData.changeAmmount;
          let amount = parseFloat(value.toString().replace(/,/g, ""));

          //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
          let lastRecord = await BoxFiscal.findOne({
            agency: salesParam.agency,
            coin: coin,
          }).sort({ createdDate: -1 });

          if (lastRecord) {
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
            };

            if (coin === 1) boxData.valueDollar = salesParam.valueDollar;

            if (coin === 2) boxData.valueEur = salesParam.valueEur;

            if (coin === 3) boxData.valueCop = salesParam.valueCop;

            const saleBox = new BoxFiscal(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.BoxFiscal.push(saleBoxSaved._id);
          }
        }

        //Eliminar ticket si es el caso
        if (salesParam.idTicket) {
          await TicketFiscal.deleteOne({ _id: salesParam.idTicket });
        }
      }

      return saleSaved;
    } catch (error) {
      // Se eliminan todos los registros de inventario que se hayan creado, para de esta manera no descontrolar balance
      for (let recordID of dataToDelete.InventoryRecord) {
        // Se busca el record almacenado
        let item = await InventoryRecordFiscal.findByIdAndDelete(recordID);

        // Se obtiene el inventario modificado
        let inventory = await InventoryFiscal.findOne({
          product: item.product,
          agency: item.agency,
        }).populate("product");

        if (inventory) {
          // Se vuelve a sumar lo restado por los kg del producto
          let total = parseFloat(inventory.kg) + parseFloat(item.out);

          //Actualizar total en inventario
          await InventoryFiscal.findOneAndUpdate(
            { product: item.product, agency: item.agency },
            { kg: total }
          );
        }
      }

      // Se elimina el ticket que se haya registrado
      if (dataToDelete.Sales) {
        await SalesFiscal.findByIdAndDelete(dataToDelete.Sales);
      }

      // Se elimina el ticket al mayor que se haya registrado
      if (dataToDelete.Wholesales) {
        await WholesalesFiscal.findByIdAndDelete(dataToDelete.Wholesales);
      }

      // Se vuelve a eliminar el monto gastado por el usuario
      if (dataToDelete.WholesaleFiscalClient) {
        const client = await WholesaleFiscalClient.findOne({
          document: salesParam.document,
        });

        // Se devuelve el total gastado ajustado a dolares
        client.totalSpent -= salesParam.total / salesParam.valueDollar;
        await client.save();
      }

      // Se eliminan todos los registros de caja, como lo son los cambios y las entradas mismas de dinero
      for (let recordID of dataToDelete.Box) {
        await Box.findByIdAndDelete(recordID);
      }

      // Ya que se procesó el error, se vuelve a lanzar
      throw error;
    }
  },

  /**
   * Función para actualizar ventas
   *
   * @param {id} id de venta
   * @param {params} salesParam
   */
  update: async (id, salesParam) => {
    const sale = await SalesFiscal.findById(id);

    // Validar
    if (!sale) throw "venta no encontrada";

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
   */
  getSale: async (id) => {
    const sale = await SalesFiscal.findById(id);

    // Validar
    if (!sale) throw "venta no encontrada";

    return sale;
  },

  /**
   * Funcion para obtener todos las ventas
   */
  getAll: async () => {
    return await SalesFiscal.find().sort({ name: "asc" });
  },

  /**
   * Funcion para obtener las ventas con paginación y filtros
   *
   * Ventas generales
   */
  dataTable: async () => {
    //const sales = await Sales.find().populate('agency','name').sort({createdDate: -1});
    const sales = await SalesFiscal.aggregate([
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      //total de punto de venta
      {
        $addFields: {
          totalTerminal: {
            $add: [
              { $ifNull: ["$pAmmount", 0] },
              { $ifNull: ["$pAmmountExtra", 0] },
            ],
          },
        },
      },
      {
        $unwind: "$agency",
      },
      {
        $unwind: "$user",
      },
      { $sort: { createdDate: -1 } },
    ]);

    return {
      results: sales,
    };
  },

  /**
   * Funcion para obtener las ventas con paginación y filtros
   *
   * Filtra por rol de usuario y sucursal
   */
  salesFiscalTable: async (salesParam) => {
    // resultados por página
    const pageSize = salesParam.pageSize;
    // Página: el page index de react-table-component
    const pageIndex = salesParam.pageIndex;

    //orden por defecto
    var sortBy = { createdDate: -1 };

    //Si esta el parametro se crea el objeto para ordenar adecuadamente
    if (salesParam.sortBy) {
      let direction = salesParam.sortBy.desc == true ? -1 : 1;
      sortBy = { [salesParam.sortBy.id]: direction };
    }

    //stage o query principal
    const stages = [
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      //total de punto de venta
      {
        $addFields: {
          totalTerminal: {
            $add: [
              { $ifNull: ["$pAmmount", 0] },
              { $ifNull: ["$pAmmountExtra", 0] },
            ],
          },
        },
      },
      { $unwind: "$agency" },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "sellers",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "operators",
          localField: "operator",
          foreignField: "_id",
          as: "operator",
        },
      },
      { $unwind: { path: "$operator", preserveNullAndEmptyArrays: true } },
      { $sort: sortBy },
    ];

    if (!salesParam.isExcel) {
      stages.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: pageSize * pageIndex - pageSize },
            { $limit: pageSize },
          ],
        },
      });
    }

    //stage del total
    let stageTotal = [
      {
        $facet: {
          totalAmmounts: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$total" },
                wholesaleDifferential: { $sum: "$differential" },
                discountDifferential: {
                  $sum: "$wholesaleDiscountDifferential",
                },
                totalAmountDifferential: { $sum: "$totalDifferential" },
                couponDifferential: { $sum: "$couponDiscount" },
              },
            },
            { $project: { _id: 0 } },
          ],
          totalDeliverys: [
            {
              $match: {
                products: { $elemMatch: { name: "SERVICIO DELIVERY" } },
              },
            },
            { $unwind: { path: "$products" } },
            { $set: { productName: { $substrCP: ["$products.name", 0, 17] } } },
            { $match: { productName: "SERVICIO DELIVERY" } },
            {
              $group: {
                _id: null,
                totalDeliverys: { $sum: "$products.kg" },
                totalAmmountDeliverys: {
                  $sum: { $multiply: ["$products.kg", "$products.price"] },
                },
              },
            },
            { $project: { _id: 0 } },
          ],
        },
      },
      { $unwind: { path: "$totalAmmounts", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$totalDeliverys", preserveNullAndEmptyArrays: true },
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$totalAmmounts", "$totalDeliverys"] },
        },
      },
    ];

    //Si es admin o supervisor ve todos las sucursales y usuarios

    //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
    if (
      salesParam.user.role == role.rol.Cashier ||
      salesParam.user.role == role.rol.Manager
    ) {
      stages.unshift({ $match: { agency: ObjectId(salesParam.user.agency) } });
      stageTotal.unshift({
        $match: { agency: ObjectId(salesParam.user.agency) },
      });
    }

    // Variables para el filtro de las horas (si lo hay)
    let initialHour = [];
    let finalHour = [];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de cajero
      if (salesParam.filters.cashier) {
        stages.unshift({
          $match: { user: ObjectId(salesParam.filters.cashier) },
        });
        stageTotal.unshift({
          $match: { user: ObjectId(salesParam.filters.cashier) },
        });
      }

      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
        stageTotal.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      //Si hay filtro por numero de ticket
      if (salesParam.filters.ticket) {
        stages.unshift({
          $match: { order: { $eq: parseInt(salesParam.filters.ticket) } },
        });
        stageTotal.unshift({
          $match: { order: { $eq: parseInt(salesParam.filters.ticket) } },
        });
      }

      //Si hay filtro por nombre
      if (salesParam.filters.names) {
        let regex = new RegExp(salesParam.filters.names, "gi");
        stages.unshift({ $match: { names: { $regex: regex } } });
        stageTotal.unshift({ $match: { names: { $regex: regex } } });
      }

      //Si hay filtro por referencia
      if (salesParam.filters.reference) {
        let regex = new RegExp(salesParam.filters.reference, "gi");
        stages.unshift({
          $match: {
            $or: [
              { pReference: { $regex: regex } },
              { tReference: { $regex: regex } },
              { pReferenceExtra: { $regex: regex } },
            ],
          },
        });
        stageTotal.unshift({
          $match: {
            $or: [
              { pReference: { $regex: regex } },
              { tReference: { $regex: regex } },
              { pReferenceExtra: { $regex: regex } },
            ],
          },
        });
      }

      //Si hay filtro por Código del producto
      if (salesParam.filters.productCode) {
        // Se busca el nombre del producto por su código
        let product = await Product.findOne({
          code: salesParam.filters.productCode,
        });

        if (!product) {
          return {
            results: [],
            metadata: [],
            total: 0,
          };
          //throw('No existe un producto con ese código. Intente de nuevo')
        }

        stages.unshift({
          $match: { products: { $elemMatch: { name: product.name } } },
        });
        stageTotal.unshift({
          $match: { products: { $elemMatch: { name: product.name } } },
        });
      }

      const stagesType = [];

      //Si hay filtro por DETAL
      if (salesParam.filters.retail) {
        stagesType.push({ type: { $eq: 5 } });
      }

      //Si hay filtro por MAYOR
      if (salesParam.filters.wholesale) {
        stagesType.push({ type: { $eq: 6 } });
      }

      //Si hay filtro por ABONO
      if (salesParam.filters.sumation) {
        stagesType.push({ type: { $eq: 7 } });
      }

      //Si hay filtro por CRÉDITO
      if (salesParam.filters.credit) {
        stagesType.push({ type: { $eq: 8 } });
      }

      if (
        salesParam.filters.retail ||
        salesParam.filters.wholesale ||
        salesParam.filters.sumation ||
        salesParam.filters.credit
      ) {
        stages.unshift({ $match: { $or: stagesType } });
        stageTotal.unshift({ $match: { $or: stagesType } });
      }

      //Si hay filtro por DETAL
      if (salesParam.filters.telesale) {
        stages.unshift({ $match: { isTelesale: { $eq: true } } });
        stageTotal.unshift({ $match: { isTelesale: { $eq: true } } });
      }

      /*//Si hay filtro por DETAL
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

      // Si hay filtro de horas

      if (salesParam.filters.initialHour || salesParam.filters.finalHour) {
        if (salesParam.filters.initialHour) {
          initialHour = salesParam.filters.initialHour
            .split(":")
            .map((item) => {
              return item.trim();
            });

          // Si no hay minutos
          if (!initialHour[1]) {
            initialHour.push("0");
          }
        }

        if (salesParam.filters.finalHour) {
          finalHour = salesParam.filters.finalHour.split(":").map((item) => {
            return item.trim();
          });

          // Si no hay minutos
          if (!finalHour[1]) {
            finalHour.push("0");
          }
        }
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stages.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
        stageTotal.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
        stageTotal.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
      }

      /*if(salesParam.filters.startDate && salesParam.filters.endDate){
                const startDate =  moment(salesParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(salesParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }*/

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = salesParam.filters.initialHour
          ? moment(salesParam.filters.startDate)
              .utc()
              .set("hour", initialHour[0])
              .set("minute", initialHour[1])
          : moment(salesParam.filters.startDate).utc().startOf("day");

        const endDate = salesParam.filters.finalHour
          ? moment(salesParam.filters.endDate)
              .utc()
              .set("hour", finalHour[0])
              .set("minute", finalHour[1])
          : moment(salesParam.filters.endDate).utc().endOf("day");

        stages.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
        stageTotal.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
        stageTotal.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    //Si todos los filtros son vacios se consulta la fecha actual
    if (
      !salesParam.filters.cashier &&
      !salesParam.filters.ticket &&
      !salesParam.filters.reference &&
      !salesParam.filters.names &&
      !salesParam.filters.startDate &&
      !salesParam.filters.endDate
    ) {
      const startDate = salesParam.filters.initialHour
        ? moment()
            .utc()
            .set("hour", initialHour[0])
            .set("minute", initialHour[1])
        : moment().utc().subtract(4, "hours").startOf("day");

      const endDate = salesParam.filters.finalHour
        ? moment().utc().set("hour", finalHour[0]).set("minute", finalHour[1])
        : moment().utc().subtract(4, "hours").endOf("day");

      stages.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
      stageTotal.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const sales = await SalesFiscal.aggregate(stages);


    let total = [];

    //Sumar total si las fechas se definieron o si es el día actual
    if (
      (salesParam.filters.startDate && salesParam.filters.endDate) ||
      (!salesParam.filters.startDate && !salesParam.filters.endDate)
    ) {
      //Total del resultado
      total = await SalesFiscal.aggregate(stageTotal);
    }

    return {
      results: !salesParam.isExcel ? sales[0].data : sales,
      metadata: !salesParam.isExcel ? sales[0].metadata : [],
      total: !salesParam.isExcel ? total : 0,
    };
  },

  /**
   * Funcion para obtener las ventas con paginación y filtros
   *
   * Ventas del día
   */
  dataTableDaily: async (salesParam) => {
    const startDate = moment().utc().startOf("day");
    const endDate = moment().utc().endOf("day");

    const sales = await SalesFiscal.aggregate([
      {
        //filtrado por fecha actual, id de usuario y sucursal
        $match: {
          createdDate: { $gte: new Date(startDate), $lt: new Date(endDate) },
          user: ObjectId(salesParam.user.id),
          agency: ObjectId(salesParam.user.agency),
        },
      },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      //total de punto de venta
      {
        $addFields: {
          totalTerminal: {
            $add: [
              { $ifNull: ["$pAmmount", 0] },
              { $ifNull: ["$pAmmountExtra", 0] },
            ],
          },
        },
      },
      {
        $unwind: "$agency",
      },
      {
        $unwind: "$user",
      },
      { $sort: { createdDate: -1 } },
    ]);
    return {
      results: sales,
    };
  },

  //Obtener data necesaria para ventas
  dataFormSale: async (idAgency) => {
    const coins = await Coin.find();
    const products = await Product.find().sort({ name: "asc" });
    const sellers = await Seller.find({ agency: idAgency, status: 1 });
    const operators = await Operator.find({ agency: idAgency, status: 1 });
    const agency = await Agency.findById(idAgency).populate("terminal");
    const offers = await Offer.find({ agency: idAgency }).populate("product");

    // Se corrobora que se haya cerrado caja el día anterior
    const date = new Date();

    let daysToSubstract = 1;

    const yesterday = moment()
      .utc()
      .subtract(4, "hours")
      .subtract(daysToSubstract, "days");

    // Si ayer fué domingo se resta otro día
    if (yesterday.day() === 0) {
      daysToSubstract += 1;
    }

    const startDate = moment()
      .utc()
      .subtract(4, "hours")
      .subtract(daysToSubstract, "days")
      .startOf("day");
    const endDate = moment()
      .utc()
      .subtract(4, "hours")
      .subtract(daysToSubstract, "days")
      .endOf("day");

    const box = await BoxCloseFiscal.find({
      agency: idAgency,
      createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    const boxWasClosed = box.length > 0;

    return {
      coins,
      products,
      sellers,
      operators,
      agency,
      offers,
      boxWasClosed,
    };
  }, 
  reportPaymentMethods: async (salesParam) => {

    const dateMatch = {};

    if(salesParam.filters.agency){
      dateMatch.agency = new mongoose.Types.ObjectId(salesParam.filters.agency);
    }

    if (salesParam.filters.startDate && salesParam.filters.endDate) {
      dateMatch.createdDate = {
        $gte: new Date(`${salesParam.filters.startDate}T00:00:00Z`),
        $lte: new Date(`${salesParam.filters.endDate}T23:59:59Z`)
      };
    } else {
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0));
      const end = new Date(today.setHours(23, 59, 59, 999));
      dateMatch.createdDate = { $gte: start, $lte: end };
    }

      
    const pagosType8Pipeline = [
      {
        $match: {
          ...dateMatch,
          type: 8
        }
      },
      {
        $lookup: {
          from: 'salesfiscals',
          let: {
            doc: '$document',
            userId: '$user',
            agencyId: '$agency',
            type8Date: '$createdDate'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$type', 7] },
                    { $eq: ['$isPayment', true] },
                    { $eq: ['$isSumation', true] },
                    { $eq: ['$document', '$$doc'] },
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$agency', '$$agencyId'] },
                    { $gt: ['$createdDate', '$$type8Date'] }
                  ]
                }
              }
            }
          ],
          as: 'relatedPayment'
        }
      },
      {
        $match: {
          $expr: {
            $gt: [{ $size: '$relatedPayment' }, 0]
          }
        }
      }
    ];
  
    const otherTypesPipeline = [
      {
        $match: {
          ...dateMatch,
          type: { $nin: [7, 8] }
        }
      }
    ];
  
    const stages = [
      {
        $facet: {
          pagosType8: pagosType8Pipeline,
          otrosTipos: otherTypesPipeline
        }
      },
      {
        $project: {
          allDocs: { $concatArrays: ['$pagosType8', '$otrosTipos'] }
        }
      },
      { $unwind: '$allDocs' },
      { $replaceRoot: { newRoot: '$allDocs' } },
  
      // Join con agencias para traer info completa
      {
        $lookup: {
          from: 'agencies',
          localField: 'agency',
          foreignField: '_id',
          as: 'agencyInfo'
        }
      },
      { $unwind: { path: '$agencyInfo', preserveNullAndEmptyArrays: true } },
  
      {
        $group: {
          _id: {
            agency: '$agency',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdDate'
              }
            },
            pos: '$isPosPayment'
          },
          pAmmount: { $sum: '$pAmmount' },
          tAmount: { $sum: '$tAmmount' },
          totalAmount: { $sum: '$total' },
          totalBaseImponible: { $sum: '$baseImponible' },
          totalIVA: { $sum: '$iva' },
          totalExento: { $sum: '$exento' },
          totalVes: { $sum: '$ves' },
          totalDollar: { $sum: '$dollar' },
          totalEur: { $sum: '$eur' },
          totalCop: { $sum: '$cop' },
          count: { $sum: 1 },
          agencyData: { $first: '$agencyInfo' },
          payments: {
            $push: {
              type: '$type',
              pos: '$terminalApply',
              amount: '$total',
              currency: '$currency',
              createdDate: '$createdDate'
            }
          }
        }
      },
  
      {
        $project: {
          _id: 0,
          agencyId: '$_id.agency',
          agency: '$agencyData',
          date: '$_id.date',
          pAmmount: 1,
          totalAmount: 1,
          totalBaseImponible: 1,
          totalIVA: 1,
          totalExento: 1,
          totalVes: 1,
          totalDollar: 1,
          totalEur: 1,
          totalCop: 1,
          tAmount: 1,
          count: 1,
          payments: 1
        }
      }
    ];

    if (salesParam.user.role == role.rol.Manager) {
      stages.unshift({
        $match: { agency: new mongoose.Types.ObjectId(salesParam.user.agency) }
      });
    }
  
    try {
      const result = await SalesFiscal.aggregate(stages);
      return result;
    } catch (error) {
      console.error('Error en reportPaymentMethods:', error.message);
      throw error;
    }
  },
  reportPaymentMethodsClose: async (salesParam) => {  
    try {
      const existentClosingRecord = await PaymentFiscalMethodsRecord.findOne({
        "virtualValues.agency._id": new ObjectId(salesParam.agency), //Buscar dentro del objeto agency
        date: { 
            $gte: moment(salesParam.date).startOf("day").toDate(), 
            $lte: moment(salesParam.date).endOf("day").toDate() 
        },
    });

      if (existentClosingRecord) {
          let actualDate = moment().utc().subtract(4, "hours");
          let reportDay = moment(salesParam.date).utc();

          if (!moment(actualDate).isSame(reportDay, "day")) {
              throw new Error("Ya hay un registro de ese día y no puede ser modificado.");
          }
      }

      // Convertir valores de string a número (eliminar comas)
      const parseNumber = (value) => {
          return value !== undefined && value !== "" ? parseFloat(String(value).replace(/,/g, "")) : 0;
      };

      salesParam.baseImponible = parseNumber(salesParam.baseImponible);
      salesParam.exento = parseNumber(salesParam.exento);
      salesParam.IVA = parseNumber(salesParam.IVA);
      salesParam.total = parseNumber(salesParam.total);

      // Verificar que salesParam.virtualValues exista
      salesParam.virtualValues = salesParam.virtualValues || {};

      salesParam.virtualValues={
        ...salesParam.virtualValues,
        agency : {
        _id: salesParam.virtualValues.agency._id,
        name: salesParam.virtualValues.agency.name,
        company: salesParam.virtualValues.agency.company,
        address: salesParam.virtualValues.agency.address,
        attendant: salesParam.virtualValues.agency.attendant,
        terminal: salesParam.virtualValues.agency.terminal || [],
        createdDate: moment(salesParam.virtualValues.agency.createdDate).toDate(),
    }};

      // Obtener el total de clientes del día
      const startDate = moment(salesParam.date).utc().startOf("day");
      const endDate = moment(salesParam.date).utc().endOf("day");

      const sales = await SalesFiscal.aggregate([
          { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) }, agency: ObjectId(salesParam.agency) } },
          { $count: "totalClients" },
      ]);

      salesParam.totalClients = sales.length > 0 ? sales[0].totalClients : 0;
      // Guardar el registro en PaymentFiscalMethodsRecord
      const closingRecord = new PaymentFiscalMethodsRecord({
          user: salesParam.user,
          baseImponible: salesParam.baseImponible,
          IVA: salesParam.IVA,
          exento: salesParam.exento,
          total: salesParam.total,
          comment: salesParam.comment || "",
          date: moment(salesParam.date).toDate(),
          createdDate: moment().utc().subtract(4, "hours").toDate(),
          virtualValues: salesParam.virtualValues,
      });

      const savedClosingRecord = await closingRecord.save();
      if (!savedClosingRecord) throw new Error("Error al guardar el cierre fiscal.");

      dataToPrint = savedClosingRecord;


      return { message: "Registro guardado correctamente en ClosingFiscal", record: savedClosingRecord };

    } catch (error) {
      console.error("Error en reportPaymentMethodsClose:", error.message);
      throw new Error("Error al procesar los datos: " + error.message);
    }

  },
  reportPaymentMethodsHistory: async (salesParam) => {


    // resultados por página
    const pageSize = salesParam.pageSize;
    // Página: el page index de react-table-component
    const pageIndex = salesParam.pageIndex;

    //orden por defecto
    var sortBy = { date: -1 };

    //Si esta el parametro se crea el objeto para ordenar adecuadamente
    if (salesParam.sortBy) {
      let direction = salesParam.sortBy.desc == true ? -1 : 1;
      sortBy = { [salesParam.sortBy.id]: direction };
    }

    let stagesStoreReport =  [
      {
        $lookup: {
          from: "agencies", // Nombre de la colección de agencias
          localField: "virtualValues.agency._id", // Ruta exacta donde está el _id dentro de virtualValues
          foreignField: "_id",
          as: "agencyInfo"
        }
      },
      { $unwind: { path: "$agencyInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users", // Nombre de la colección de usuarios
          localField: "user", // Campo en la colección actual que referencia al usuario
          foreignField: "_id", // Campo en la colección de usuarios que coincide
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      { $sort: sortBy },
    ]

    // // //Si el rol es Gerente, solo su sucursal
    if (salesParam.user.role == role.rol.Manager) {
      stagesStoreReport.unshift({
        $match: { "virtualValues.agency._id": new ObjectId(salesParam.user.agency) }
      });
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stagesStoreReport.unshift({
          $match: { "virtualValues.agency._id": new ObjectId(salesParam.filters.agency) }
        });
      }
      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment.utc(salesParam.filters.startDate)
          .startOf("day").toDate();
        stagesStoreReport.unshift({
          $match: { date: { $gte:startDate} },
        });
      }   
      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment.utc(salesParam.filters.endDate).endOf("day").toDate();
        stagesStoreReport.unshift({
          $match: { date: { $lte: endDate} },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment.utc(salesParam.filters.startDate)
          .startOf("day").toDate();
        const endDate = moment.utc(salesParam.filters.endDate)
          .endOf("day").toDate ();
        stagesStoreReport.unshift({
          $match: {
            date: { $gte: startDate, $lte: endDate},
          },
        });
      }
    }

    

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stagesStoreReport.unshift({
        $match: {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }
    stagesStoreReport.push({ $sort: { createdDate: -1 } });

    stagesStoreReport.push(
      {
        $group: {
          _id: {
            agency: "$virtualValues.agency._id",
            dateOnly: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            }
          },
          latestRecord: { $first: "$$ROOT" },
          createdDate: { $first: "$createdDate" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestRecord" }
      }
    );

    const newPaymentMethodsRecordStoreReport =
      await PaymentFiscalMethodsRecord.aggregate(stagesStoreReport);


      return {
        resultsStores: salesParam.isExcel
          ? newPaymentMethodsRecordStoreReport // Si es Excel, devuelve toda la data
          : newPaymentMethodsRecordStoreReport, // Aquí no accedas a `[0].data` si `$facet` no está activo
        metadata: salesParam.isExcel ? [] : [],
      };
  },

  reportPaymentMethodsChart: async (salesParam) => {
    let stages = [{ $sort: { date: 1 } }];

    //Si el rol es Gerente, solo su sucursal
    if (salesParam.user.role == role.rol.Manager) {
      stages.unshift({ $match: { agency: ObjectId(salesParam.user.agency) } });
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stages.unshift({ $match: { date: { $gte: new Date(startDate) } } });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({ $match: { date: { $lte: new Date(endDate) } } });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stages.unshift({
        $match: {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    let results = {
      labels: [],
      data: [],
    };

    // Dependiendo de lo que se quiera, se busca en la base de datos correspondiente

    //Si hay filtro de sucursal
    if (salesParam.filters.agency) {
      switch (salesParam.filters.type) {
        case "totalAmmount": {
          //  Si se pide el total generado por la agencia

          const chartData = await PaymentMethodsRecord.aggregate(stages);

          results.labels = chartData.map((item) => {
            return moment(item.date).utc().format("L");
          });
          results.data = chartData.map((item) => {
            return (item.total / item.virtualValues.valueDollar).toFixed(2);
          });
          break;
        }
        case "totalStock": {
          //  Si se pide el Stock de cada tienda
          throw "ERROR: Información disponible para todas las tiendas juntas";
        }
        case "totalPendingPayments": {
          //  Si se piden las cuentas pendientes de cada tienda
          throw "ERROR: Información disponible para todas las tiendas juntas";
        }
      }
    } else {
      const chartData = await PaymentMethodsGeneralReportRecord.aggregate(
        stages
      );

      switch (salesParam.filters.type) {
        case "totalAmmount": {
          //  Si se pide el total generado por la agencia

          results.labels = chartData.map((item) => {
            return moment(item.date).utc().format("L");
          });
          results.data = chartData.map((item) => {
            return (item.total / item.valueDollar).toFixed(2);
          });
          break;
        }
        case "totalStock": {
          //  Si se pide el Stock de cada tienda

          results.labels = chartData.map((item) => {
            return moment(item.date).utc().format("L");
          });
          results.data = chartData.map((item) => {
            return (item.mustBe / item.valueDollar).toFixed(2);
          });
          break;
        }
        case "totalPendingPayments": {
          //  Si se piden las cuentas pendientes de cada tienda

          results.labels = chartData.map((item) => {
            return moment(item.date).utc().format("L");
          });
          results.data = chartData.map((item) => {
            return item.totalPending.toFixed(2);
          });
          break;
        }
      }
    }

    return {
      results,
    };
  },

  createPaymentMethodsGeneralReport: async () => {
    /* HISTORIAL DE CIERRE GENERAL POR DIA  */

    const startDate = moment().utc().subtract(1, "days").startOf("day");
    const endDate = moment().utc().subtract(1, "days").endOf("day");

    let stagesGeneralReport = [
      {
        $match: {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: {
            createdDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdDate" },
            },
          },

          ves: { $sum: "$ves" },
          dollar: { $sum: "$dollar" },
          eur: { $sum: "$eur" },
          cop: { $sum: "$cop" },
          tAmmount: { $sum: "$tAmmount" },
          pAmmount: { $sum: "$pAmmount" },
          pAmmountReal: { $sum: 0 },
          totalCommissions: { $sum: 0 },
          valueDollar: { $last: "$valueDollar" },
          valueEur: { $last: "$valueEur" },
          valueCop: { $last: "$valueCop" },
          totalClients: { $sum: "$totalClients" },
          total: { $sum: "$total" },
          differential: { $sum: "$differential" },
          date: { $last: "$date" },
          terminalAmmounts: { $push: "$terminalAmmounts" },
          transferAmmounts: { $push: "$transferAmmounts" },
          operatorsAmmount: { $push: "$operatorsAmmount" },
          cashiersAmmount: { $push: "$cashiersAmmount" },

          // Valores virtuales obtenidos de las formas de pago para obtener las diferencias
          virtualValues_totalPos: { $sum: "$virtualValues.totalPos" },
          virtualValues_totalAmountBox: {
            $sum: "$virtualValues.totalAmountBox",
          },

          // Posteriormente se le agrega un valor
          agency: { $sum: 0 },
        },
      },
      // Se unen todos los arreglos de los montos de las transferencias por cada banco
      {
        $addFields: {
          transferAmmounts: {
            $reduce: {
              input: "$transferAmmounts",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      // Se unen todos los arreglos de los montos de los puntos de venta de cada tienda
      {
        $addFields: {
          terminalAmmounts: {
            $reduce: {
              input: "$terminalAmmounts",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      // Se modifican los códigos de los terminales por su respectivo objeto
      {
        $lookup: {
          from: "terminals",
          localField: "terminalAmmounts.terminal",
          foreignField: "_id",
          as: "terminals",
        },
      },
      {
        $set: {
          terminalAmmounts: {
            $map: {
              input: "$terminalAmmounts",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    terminal: {
                      $arrayElemAt: [
                        "$terminals",
                        {
                          $indexOfArray: ["$terminals._id", "$$this.terminal"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      // Se unen todos los arreglos montos de los operadores
      {
        $addFields: {
          operatorsAmmount: {
            $reduce: {
              input: "$operatorsAmmount",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      // Se unen todos los arreglos montos de los cajeros
      {
        $addFields: {
          cashiersAmmount: {
            $reduce: {
              input: "$cashiersAmmount",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      // Se crea un objeto para que quede acorde con el frontend
      {
        $addFields: {
          virtualValues: {
            totalPos: "$virtualValues_totalPos",
            totalAmountBox: "$virtualValues_totalAmountBox",
          },
        },
      },
      { $sort: { date: -1 } },
    ];

    const newGeneralReportRecord = await PaymentMethodsRecord.aggregate(
      stagesGeneralReport
    );

    // Se crean todas las posibles cuentas que pueden existir mezclando el banco y el nombre de la cuenta
    const posibleBankAccounts = [];

    for (let bank in bankEnum.bank) {
      for (let account in bankEnum.account) {
        let bankName = bankEnum.bank[bank];
        let accountName = bankEnum.account[account];

        let code = bankName + " " + accountName;

        posibleBankAccounts.push({
          code: code,
          bank: bankName,
          account: accountName,

          debit: 0,
          debitCommission: 0,
          credit: 0,
          creditCommission: 0,
          totalPDV: 0,
          totalRealPDV: 0,
          transfer: 0,
          total: 0,
        });
      }
    }

    newGeneralReportRecord.forEach((report) => {
      // Se modifica el nombre de la agencia
      report.title = "Reporte general";

      // Se cambian los terminales por las cuentas bancarias para que aparezcan en el reporte

      // Primero se procesa el monto general por cuenta, ingresado por los puntos de venta
      let bankAccounts = posibleBankAccounts.slice();

      report.terminalAmmounts.forEach((terminalReport) => {
        if (terminalReport.total === 0) {
          return;
        }

        // Se busca en la lista de las posibles cuentas la cuenta bancaria que corresponda con el punto de venta
        let bankAccountToModify = bankAccounts.find(
          (bankAccount) =>
            bankAccount.bank === terminalReport.terminal.bank &&
            bankAccount.account === terminalReport.terminal.description
        );

        if (bankAccountToModify) {
          bankAccountToModify.debit += terminalReport.debit;
          bankAccountToModify.credit += terminalReport.credit;

          // Se calculan las comisiones depediendo del banco
          let debitCommissionRate = 0;
          let creditCommissionRate = 0;

          switch (bankAccountToModify.bank) {
            case "PROVINCIAL":
              debitCommissionRate = 0.0075;
              creditCommissionRate = 0.025;
              break;
            case "BICENTENARIO":
              debitCommissionRate = 0.0075;
              creditCommissionRate = 0.025;
              break;
            case "BANESCO":
              debitCommissionRate = 0.0075;
              creditCommissionRate = 0.025;
              break;
            default:
              debitCommissionRate = 0.0075;
              creditCommissionRate = 0.025;
              break;
          }

          let debitCommission = terminalReport.debit * debitCommissionRate;
          let creditCommission = terminalReport.credit * creditCommissionRate;

          bankAccountToModify.debitCommission += debitCommission;
          bankAccountToModify.creditCommission += creditCommission;

          // Total por punto, con comisiones
          bankAccountToModify.totalPDV += terminalReport.total;
          // Total por punto, sin comisiones
          bankAccountToModify.totalRealPDV +=
            terminalReport.total - debitCommission - creditCommission;
          // Se acumula el total sin comisiones, en el total final de la cuenta.
          bankAccountToModify.total +=
            terminalReport.total - debitCommission - creditCommission;

          // Se restan las comisiones a los totales generales para obtener el nuevo total de puntos de venta y el total general de las tiendas
          report.pAmmountReal +=
            terminalReport.total - debitCommission - creditCommission;

          report.totalCommissions += debitCommission + creditCommission;

          report.total -= debitCommission + creditCommission;
        }
      });

      // Ahora se procesa el monto general por cuenta, ingresado por medio de las transferencias

      report.transferAmmounts.forEach((transferReport) => {
        if (transferReport.total === 0) {
          return;
        }

        let bankAccountToModify = bankAccounts.find(
          (bankAccount) =>
            bankAccount.bank === transferReport.bank &&
            bankAccount.account === transferReport.account
        );

        if (bankAccountToModify) {
          bankAccountToModify.transfer += transferReport.total;
          bankAccountToModify.total += transferReport.total;
        }
      });

      // Finalmente se sustituye "bankAmmounts" por las cuentas que hayan tenido modificaciones
      report.bankAmmounts = bankAccounts.filter(
        (bankAccount) => bankAccount.total !== 0
      );
    });
    /*** AHORA SE LE AGREGA EL TOTAL DE CUENTAS POR COBRAR  */

    let stagesPendingPayments = [
      { $match: { status: false } },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$pending" },
        },
      },
    ];

    const pendingPayments = await PendingPayments.aggregate(
      stagesPendingPayments
    );

    newGeneralReportRecord[0].totalPending = pendingPayments[0].totalPending;

    /*** FINALMENTE SE LE AGREGA EL BALANCE TOTAL DE TODAS LAS TIENDAS SUMADAS  */

    const filters = {
      user: {
        role: 1,
      },
      filters: {
        agency: "",
        startDate: moment().utc().subtract(4, "hours").subtract(1, "days"),
      },
    };

    const balanceData = await inventoryService.dataTableBalanceReport(filters);

    newGeneralReportRecord[0].mustBe = balanceData.results[8].value; //	Debe haber
    newGeneralReportRecord[0].finalInventory = balanceData.results[9].value; //	Inventario Final
    newGeneralReportRecord[0].inventoryDifferential =
      balanceData.results[10].value; //	Diferencial

    delete newGeneralReportRecord[0]._id;
    const record = new PaymentMethodsGeneralReportRecord(
      newGeneralReportRecord[0]
    );

    const recordSaved = await record.save();

    if (recordSaved) {
      console.log("El reporte general se realizó de manera exitosa");
    } else {
      console.log("Hubo un error en la creación del reporte general");
    }
  },

  reportPaymentMethodsGeneralReportHistory: async (salesParam) => {
    // resultados por página
    const pageSize = salesParam.pageSize;
    // Página: el page index de react-table-component
    const pageIndex = salesParam.pageIndex;

    var sortBy = { date: -1 };

    let stages = [];

    // Si se pide la data mezclada
    if (salesParam.filters.mixData) {
      stages = [
        {
          $group: {
            _id: null,

            title: { $last: "$title" },

            ves: { $sum: "$ves" },
            dollar: { $sum: "$dollar" },
            eur: { $sum: "$eur" },
            cop: { $sum: "$cop" },
            tAmmount: { $sum: "$tAmmount" },
            pAmmount: { $sum: "$pAmmount" },
            pAmmountReal: { $sum: "$pAmmountReal" },
            totalCommissions: { $sum: "$totalCommissions" },
            bankAmmounts: { $push: "$bankAmmounts" },

            valueDollar: { $last: "$valueDollar" },
            valueEur: { $last: "$valueEur" },
            valueCop: { $last: "$valueCop" },

            totalClients: { $sum: "$totalClients" },
            operatorsAmmount: { $push: "$operatorsAmmount" },
            cashiersAmmount: { $push: "$cashiersAmmount" },

            //virtualValues: virtualValuesSchema,                 // Valores virtuales obtenidos en formas de pago

            total: { $sum: "$total" },
            differential: { $sum: "$differential" },

            mustBe: { $last: "$mustBe" },
            finalInventory: { $last: "$finalInventory" },
            inventoryDifferential: { $sum: "$inventoryDifferential" },

            totalPending: { $last: "$totalPending" },

            date: { $last: "$date" },
          },
        },
        // Se unen todos los arreglos de los montos de los bancos
        {
          $addFields: {
            bankAmmounts: {
              $reduce: {
                input: "$bankAmmounts",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] },
              },
            },
          },
        },
        // Se unen todos los arreglos de los montos de los operadores
        {
          $addFields: {
            operatorsAmmount: {
              $reduce: {
                input: "$operatorsAmmount",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] },
              },
            },
          },
        },
        // Se modifican los códigos de los operadores por su respectivo objeto
        {
          $lookup: {
            from: "operators",
            localField: "operatorsAmmount.operator",
            foreignField: "_id",
            as: "operator",
          },
        },
        {
          $set: {
            operatorsAmmount: {
              $map: {
                input: "$operatorsAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      operator: {
                        $arrayElemAt: [
                          "$operator",
                          {
                            $indexOfArray: ["$operator._id", "$$this.operator"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Se modifican los códigos de las agencias de los operadores por su respectivo objeto
        {
          $lookup: {
            from: "agencies",
            localField: "operatorsAmmount.agency",
            foreignField: "_id",
            as: "agency",
          },
        },
        {
          $set: {
            operatorsAmmount: {
              $map: {
                input: "$operatorsAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      agency: {
                        $arrayElemAt: [
                          "$agency",
                          {
                            $indexOfArray: ["$agency._id", "$$this.agency"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Se unen todos los arreglos de los logros de los cajeros
        {
          $addFields: {
            cashiersAmmount: {
              $reduce: {
                input: "$cashiersAmmount",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] },
              },
            },
          },
        },
        // Se modifican los códigos de los cajeros por su respectivo objeto
        {
          $lookup: {
            from: "users",
            localField: "cashiersAmmount.user",
            foreignField: "_id",
            as: "cashier",
          },
        },
        {
          $set: {
            cashiersAmmount: {
              $map: {
                input: "$cashiersAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      user: {
                        $arrayElemAt: [
                          "$cashier",
                          {
                            $indexOfArray: ["$cashier._id", "$$this.user"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Se modifican los códigos de las agencias de los cajeros por su respectivo objeto
        {
          $set: {
            cashiersAmmount: {
              $map: {
                input: "$cashiersAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      agency: {
                        $arrayElemAt: [
                          "$agency",
                          {
                            $indexOfArray: ["$agency._id", "$$this.agency"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $sort: sortBy },
      ];
    } else {
      stages = [
        // Se modifican los códigos de las agencias de los operadores por su respectivo objeto
        {
          $lookup: {
            from: "operators",
            localField: "operatorsAmmount.operator",
            foreignField: "_id",
            as: "operator",
          },
        },
        {
          $set: {
            operatorsAmmount: {
              $map: {
                input: "$operatorsAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      operator: {
                        $arrayElemAt: [
                          "$operator",
                          {
                            $indexOfArray: ["$operator._id", "$$this.operator"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Se modifican los códigos de las agencias de los operadores por su respectivo objeto
        {
          $lookup: {
            from: "agencies",
            localField: "operatorsAmmount.agency",
            foreignField: "_id",
            as: "agency",
          },
        },
        {
          $set: {
            operatorsAmmount: {
              $map: {
                input: "$operatorsAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      agency: {
                        $arrayElemAt: [
                          "$agency",
                          {
                            $indexOfArray: ["$agency._id", "$$this.agency"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Se modifican los códigos de los cajeros por su respectivo objeto
        {
          $lookup: {
            from: "users",
            localField: "cashiersAmmount.user",
            foreignField: "_id",
            as: "cashier",
          },
        },
        {
          $set: {
            cashiersAmmount: {
              $map: {
                input: "$cashiersAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      user: {
                        $arrayElemAt: [
                          "$cashier",
                          {
                            $indexOfArray: ["$cashier._id", "$$this.user"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Se modifican los códigos de las agencias de los cajeros por su respectivo objeto
        {
          $set: {
            cashiersAmmount: {
              $map: {
                input: "$cashiersAmmount",
                in: {
                  $mergeObjects: [
                    "$$this",
                    {
                      agency: {
                        $arrayElemAt: [
                          "$agency",
                          {
                            $indexOfArray: ["$agency._id", "$$this.agency"],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $skip: pageSize * pageIndex - pageSize },
              { $limit: pageSize },
            ],
          },
        },
      ];
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stages.unshift({ $match: { date: { $gte: new Date(startDate) } } });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({ $match: { date: { $lte: new Date(endDate) } } });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stages.unshift({
        $match: {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const reports = await PaymentMethodsGeneralReportRecord.aggregate(stages);

    // Si se pide la data mexclada, se deben sumar todos los valores por cuenta
    if (salesParam.filters.mixData) {
      // Inicialmente se suman todos los valores de las cuentas bancarias
      let auxArrayBanks = [];

      reports[0].bankAmmounts.forEach((bankReport) => {
        let bank = auxArrayBanks.find(
          (bankToFind) => bankToFind.code == bankReport.code
        );

        if (!bank) {
          let newBankSum = {
            code: bankReport.code,
            bank: bankReport.bank,
            account: bankReport.account,
            debit: 0,
            debitCommission: 0,
            credit: 0,
            creditCommission: 0,
            totalPDV: 0,
            totalRealPDV: 0,
            transfer: 0,
            total: 0,
          };

          reports[0].bankAmmounts.forEach((bank) => {
            if (newBankSum.code === bank.code) {
              newBankSum.debit += bank.debit;
              newBankSum.debitCommission += bank.debitCommission;
              newBankSum.credit += bank.credit;
              newBankSum.creditCommission += bank.creditCommission;
              newBankSum.totalPDV += bank.totalPDV;
              newBankSum.totalRealPDV += bank.totalRealPDV;
              newBankSum.transfer += bank.transfer;
              newBankSum.total += bank.total;
            }
          });

          auxArrayBanks.push(newBankSum);
        }
      });

      // Se sustituye el arreglo de los bancos, por el nuevo arreglo con toda la data mezclada
      reports[0].bankAmmounts = auxArrayBanks;

      // Posteriormente se suman todos los valores correspondientes a los operadores
      let auxArrayOperators = [];

      reports[0].operatorsAmmount.forEach((operatorReport) => {
        let operator = auxArrayOperators.find(
          (operatorToFind) =>
            operatorToFind.operator._id.toString() ==
            operatorReport.operator._id.toString()
        );

        if (!operator) {
          let newOperatorSum = {
            agency: operatorReport.agency,
            operator: operatorReport.operator,
            totalWholesales: 0,
            totalWholesaleFiscalClients: 0,
            totalRetail: 0,
            totalRetailClients: 0,
            total: 0,
            totalClients: 0,
          };

          reports[0].operatorsAmmount.forEach((operatorReport2) => {
            if (
              newOperatorSum.operator._id.toString() ==
              operatorReport2.operator._id.toString()
            ) {
              newOperatorSum.totalWholesales += operatorReport2.totalWholesales;
              newOperatorSum.totalWholesaleFiscalClients +=
                operatorReport2.totalWholesaleFiscalClients;
              newOperatorSum.totalRetail += operatorReport2.totalRetail;
              newOperatorSum.totalRetailClients +=
                operatorReport2.totalRetailClients;
              newOperatorSum.total += operatorReport2.total;
              newOperatorSum.totalClients += operatorReport2.totalClients;
            }
          });

          auxArrayOperators.push(newOperatorSum);
        }
      });

      // Se sustituye el arreglo de los bancos, por el nuevo arreglo con toda la data mezclada
      reports[0].operatorsAmmount = auxArrayOperators;
    }

    if (!salesParam.isExcel) {
      stages.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: pageSize * pageIndex - pageSize },
            { $limit: pageSize },
          ],
        },
      });
    }
  
    return {
      resultsStores: !salesParam.filters.mixData ? reports[0].data : reports,
      resultsGeneral: !salesParam.filters.mixData ? reports[0].data : reports,
    };
  },

  /**
   * reporte de formas de pago detalle de pagos
   *
   * Devuelve una lista de pagos por diferentes monedas y un dia en específico
   *
   */
  detailPaymentMethods: async (salesParam) => {
    //agrupar por fecha, agencia y monedas

    // Si se buscan los detalles de una data mezclada o separada por fechas
    const startDate = salesParam.dataIsMixed
      ? moment(salesParam.startDate).utc().startOf("day")
      : moment(salesParam.date).utc().startOf("day");
    const endDate = salesParam.dataIsMixed
      ? moment(salesParam.endDate).utc().endOf("day")
      : moment(salesParam.date).utc().endOf("day");

    //parametros del query

    //fecha
    const query = {
      createdDate: { $gte: new Date(startDate), $lt: new Date(endDate) },
    };

    if (salesParam.agency) {
      query.agency = ObjectId(salesParam.agency);
    }

    //tipo de moneda
    let type = salesParam.coin;
    switch (type) {
      case 1: //dolar
        query.dollar = { $gt: 0 };
        break;
      case 2: //euros
        query.eur = { $gt: 0 };
        break;
      case 3: //Pesos
        query.cop = { $gt: 0 };
        break;
      case 4: //Transferencias
        query.tAmmount = { $gt: 0 };
        break;
      case 5: //Puntos de venta
        query.$or = [{ pAmmount: { $gt: 0 } }, { pAmmountExtra: { $gt: 0 } }];
        break;
      case 5.1: //Puntos de venta que aplican
        query.$or = [
          { pAmmount: { $gt: 0 }, terminalApply: true },
          { pAmmountExtra: { $gt: 0 }, terminalExtraApply: true },
        ];
        break;
      case 5.2: //Puntos de venta que NO aplican
        query.$or = [
          { pAmmount: { $gt: 0 }, terminalApply: false },
          { pAmmountExtra: { $gt: 0 }, terminalExtraApply: false },
        ];

        //query.$or = [{ $and : [ { pAmmount: { $gt:0 }}, { $eq: ["$terminalApply", false] } ]}, { $and : [ { pAmmountExtra: { $gt:0 } }, { $eq: ["$terminalExtraApply", false] } ]}]
        break;
      case 6: //Creditos
        query.isCredit = { $eq: true };
        break;
      case 7: //Bolivares
        query.ves = { $gt: 0 };
        break;
      default:
        query.dollar = { $gt: 0 };
        break;
    }

    //Consultar y hacer lean para devolver array de objetos javascript
    const sales = await Sales.find(query)
      .populate("agency", "name company")
      .populate("terminal", "code")
      .populate("terminalExtra", "code")
      .sort({ createdDate: -1 })
      .lean();

    //  Si son los detalles de los créditos, se devuelve de una vez
    if (type === 6) {
      let total = 0;

      sales.forEach((sale) => {
        total += sale.total;
      });

      return {
        results: sales,
        total,
      };
    }
    /********************************** */

    //  Se realiza la busqueda de las salidas de caja mediante vuelto (solo para monedas/efectivo, no para transferencias ni PDV)
    let boxes = [];
    if (type !== 4 && type !== 5 && type !== 5.1 && type !== 5.2 && salesParam.agency) {
      const queryBox = {
        createdDate: { $gte: new Date(startDate), $lt: new Date(endDate) },
        agency: ObjectId(salesParam.agency),
        coin: type === 7 ? 1 : type + 1,
        out: { $gt: 0 },
        typeDescription: "Cambio",
      };
      boxes = await Box.find(queryBox)
        .populate("agency", "name")
        .populate("user", "username")
        .sort({ createdDate: -1 });
    }

    //  Dado en la caja no se encuentran almacenados los tipos de cambio del dia, se deberán tomar de la variable de ventas del día

    let valueDollar = 0;
    let valueEur = 0;
    let valueCop = 0;

    /********************************** */

    //Calcular total y subtotal por cada registro en caso de monedas
    let total = 0;
    sales.map((sale) => {
      /*********** */

      //  Se actualizan los tipos de cambio que se utilizarán para la caja

      valueDollar = sale.valueDollar;
      valueEur = sale.valueEur;
      valueCop = sale.valueCop;

      /*********** */

      let subTotal = 0;
      //Si es monedas extranjeras
      if (type == 1 || type == 2 || type == 3 || type == 7) {
        if (salesParam.coin == 1) {
          subTotal = sale.dollar * sale.valueDollar;
        } else if (salesParam.coin == 2) {
          subTotal = sale.eur * sale.valueEur;
        } else if (salesParam.coin == 3) {
          subTotal = sale.cop / sale.valueCop;
        } else if (salesParam.coin == 7) {
          subTotal = sale.ves * 1; //  Ya que el bolivar no tiene tipo de cambio
        }
        total += Number(subTotal.toFixed(2));
      }

      //Si es transferencia solo sumar transferencias
      if (type == 4) {
        total += sale.tAmmount;
      }

      //Si es punto de venta sumar punto de venta y el extra si existe
      if (type == 5) {
        let totalTerminal = sale.pAmmount ? sale.pAmmount : 0;
        let totalTerminalExtra = sale.pAmmountExtra ? sale.pAmmountExtra : 0;
        subTotal = parseFloat(totalTerminal) + parseFloat(totalTerminalExtra);
        total += subTotal;
      }
      //Si es punto de venta y aplica, sumar punto de venta y el extra si existe
      if (type == 5.1) {
        let totalTerminal = sale.pAmmount ? sale.pAmmount : 0;
        let totalTerminalExtra = sale.pAmmountExtra ? sale.pAmmountExtra : 0;
        subTotal = parseFloat(totalTerminal) + parseFloat(totalTerminalExtra);
        total += subTotal;
      }
      //Si es punto de venta y NO aplica, sumar punto de venta y el extra si existe
      if (type == 5.2) {
        let totalTerminal = sale.pAmmount ? sale.pAmmount : 0;
        let totalTerminalExtra = sale.pAmmountExtra ? sale.pAmmountExtra : 0;
        subTotal = parseFloat(totalTerminal) + parseFloat(totalTerminalExtra);
        total += subTotal;
      }
      //Asignar subtotal
      return Object.assign(sale, { subTotal: subTotal });
    });

    /********************************** */

    const changes = [];

    /*  Se crean objetos parecidos a las ventas pero con valores de los vueltos dados en caja para finalmente enviarlos 
            junto con las ventas del dia y que no haya conflicto en el FRONTEND dado que los formatos de caja y venta son distintos */

    boxes.map((item) => {
      let newChange = {
        _id: item._id,
        ves: item.coin === 1 ? item.out * -1 : null,
        dollar: item.coin === 2 ? item.out * -1 : null,
        eur: item.coin === 3 ? item.out * -1 : null,
        cop: item.coin === 4 ? item.out * -1 : null,
        valueDollar: valueDollar,
        valueEur: valueEur,
        valueCop: valueCop,
        agency: salesParam.agency,
        createdDate: item.createdDate,
        order: item.order,
        __v: 0,
        subTotal: 0,
      };

      switch (item.coin) {
        case 1: //Bs
          newChange.subTotal = newChange.ves;
          break;
        case 2: //Dolares
          newChange.subTotal = newChange.dollar * valueDollar;
          break;
        case 3: //euros
          newChange.subTotal = newChange.eur * valueEur;
          break;
        case 4: //Pesos
          newChange.subTotal = newChange.cop / valueCop;
          break;
      }

      total += Number(newChange.subTotal.toFixed(2)); //  Se modifica el total

      changes.push(newChange);
    });

    //  Se unen las entradas de dinero junto con las salidas, y se ordenan por fecha

    const salesAndChanges = [...sales, ...changes].sort((a, b) => {
      return b.createdDate - a.createdDate;
    });

    return {
      results: salesAndChanges,
      total,
    };

    /********************************** */
    /*********************************** */

    /*        //agrupar por fecha, agencia y monedas
        const startDate =  moment(salesParam.date).utc().startOf('day');
        const endDate =  moment(salesParam.date).utc().endOf('day');

        //parametros del query

        //fecha 
        const query = {
            createdDate: { $gte: new Date(startDate), $lt: new Date(endDate)},
            agency: ObjectId(salesParam.agency)
        }

        //tipo de moneda
        let type = salesParam.coin


        //Si se solicitan los detalles de los créditos
        if (type === 6){

            query.isCredit = { $eq: true }
            
            const sales = await Sales.find(query).populate('agency','name')
            .populate('terminal','code')
            .populate('terminalExtra','code').sort({ createdDate: -1 }).lean();

            let total = 0;

            // Se acumula el total de los créditos
            sales.forEach((sale) => {
                total += sale.total;
            })

            return {
                results: sales, 
                total
            }
        }


        // Si se solicitan detalles de transferencias u operaciones con punto
        if ((type === 4)||(type === 5)){

            switch(type) {
                case 4://Transferencias
                    query.tAmmount = { $gt:0 }
                    break;
                case 5://Puntos de venta
                    query.$or = [{ pAmmount: { $gt:0 }}, { pAmmountExtra: { $gt:0 } }]
                    break;
            }

            const sales = await Sales.find(query).populate('agency','name')
                .populate('terminal','code')
                .populate('terminalExtra','code').sort({ createdDate: -1 }).lean();


            //Calcular total y subtotal por cada registro en caso de monedas
            let total = 0;

            sales.map((sale) => {

                let subTotal = 0;
                
                //Si es transferencia solo sumar transferencias
                if(type == 4){
                    total += sale.tAmmount;
                }
            
                //Si es punto de venta sumar punto de venta y el extra si existe
                if(type == 5){
                    let totalTerminal = sale.pAmmount ? sale.pAmmount : 0;
                    let totalTerminalExtra = sale.pAmmountExtra ? sale.pAmmountExtra : 0;
                    subTotal = parseFloat(totalTerminal)+parseFloat(totalTerminalExtra);
                    total += subTotal;
                }
                //Asignar subtotal
                return Object.assign(sale, { subTotal: subTotal });
            
            });

            return {
                results: sales, 
                total
            }
            
        }


        // Si se solicitan detalles de alguna moneda en efectivo
        if ((type == 1) || (type == 2) || (type == 3) || (type == 7)){

            switch(type) {
                case 1://dolar
                    query.coin = { $eq: 2 }
                    break;
                case 2://euros
                    query.coin = { $eq: 3 }
                    break;
                case 3://Pesos
                    query.coin = { $eq: 4 }
                    break;
                case 7://Bolivares
                    query.coin = { $eq: 1 }
                    break;
            }

            //Consultar y hacer lean para devolver array de objetos javascript 
            const box = await Box.find(query).populate('agency','name')
                .populate('user','username').sort({ createdDate: -1 }).lean();

            //Calcular total y subtotal por cada registro en caso de monedas
            let total = 0;
            
            box.map((sale) => {

                let subTotalIn = 0;
                let subTotalOut = 0;
                let subTotal = 0;
                let amount = 0;

                //Se suman las salidas
                if(type == 1){
                    subTotalIn = sale.in * sale.valueDollar;
                    subTotalOut = sale.out * sale.valueDollar * (-1);
                }else if(type == 2){
                    subTotalIn = sale.in * sale.valueEur;
                    subTotalOut = sale.out * sale.valueEur * (-1);
                }else if(type == 3){
                    subTotalIn = sale.in * sale.valueCop;
                    subTotalOut = sale.out * sale.valueCop * (-1);
                }else if(type == 7){
                    subTotalIn = sale.in;    //  Ya que el bolivar no tiene tipo de cambio
                    subTotalOut = sale.out * (-1);
                }
                total += Number(subTotalIn.toFixed(2));
                total -= Number(subTotalOut.toFixed(2));

                subTotal += Number(subTotalIn.toFixed(2));
                subTotal += Number(subTotalOut.toFixed(2));

                amount = sale.in - sale.out;
                let finalAmount = Number(amount.toFixed(2));

                //Asignar subtotal
                return Object.assign(sale, { subTotal: subTotal, amount: finalAmount });

            });

            const changes = []

            box.map((item) => {

                let newChange = {
            
                    _id: item._id,
                    ves: (item.coin === 1 ? item.amount : null),
                    dollar: (item.coin === 2 ? item.amount : null),
                    eur: (item.coin === 3 ? item.amount : null),
                    cop: (item.coin === 4 ? item.amount : null),
                    valueDollar: (item.valueDollar === 1 ? item.valueDollar : null),
                    valueEur: (item.valueEur === 1 ? item.valueEur : null),
                    valueCop: (item.valueCop === 1 ? item.valueCop : null),
                    agency: salesParam.agency,
                    createdDate: item.createdDate,
                    order: item.order,
                    __v: 0,
                    subTotal: item.subTotal,
                }
                            
                changes.push(newChange)
            })

            return {
                results: changes, 
                total
            }
        }

        throw('Hubo un problema y no se reconoció ninguna variable')
*/
  },

  getCommissionReports: async (salesParam) => {
    if (
      !salesParam.filters ||
      (!salesParam.filters.startDate && !salesParam.filters.endDate)
    ) {
      return await salesFiscalService.commissionReports(salesParam);
    }

    // Inicialmente se busca si hay data guardada (aplicaría unicamente para semanas anteriores), de lo contrario se calcula
    const results = await salesFiscalService.commissionReportSaved(salesParam);

    if (results) return results;
    else return await salesFiscalService.commissionReports(salesParam);
  },

  commissionReports: async (salesParam) => {
    // INICIALMENTE SE OBTIENE EL REPORTE DE LAS COMISIONES AL MAYOR //

    let stagesWholesale = [
      { $match: { isCredit: false } },
      {
        $group: {
          _id: "$seller",

          // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },

          // Total de ingresos por ventas al mayor en $
          totalDollars: {
            $sum: {
              $divide: [
                { $cond: [{ $eq: ["$isWholesale", true] }, "$total", 0] },
                "$valueDollar",
              ],
            },
          },
          // Total en dolares por concepto de ventas al mayor de contado
          totalWholesales: {
            $sum: {
              $divide: [
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isWholesale", true] },
                        { $eq: ["$isSumation", false] },
                      ],
                    },
                    "$total",
                    0,
                  ],
                },
                "$valueDollar",
              ],
            },
          },
          // Total en dólares por concepto de abonos
          totalSumations: {
            $sum: {
              $divide: [
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isWholesale", true] },
                        { $eq: ["$isSumation", true] },
                      ],
                    },
                    "$total",
                    0,
                  ],
                },
                "$valueDollar",
              ],
            },
          },
          valueDollar: { $last: "$valueDollar" },
          agency: { $last: "$agency" },

          // Datos para ser llenados posteriormente
          // Porcentaje alcanzado de la meta semanal
          weeklyGoalPercentage: { $sum: 0 },
          // Si la meta semanal fue alcanzada
          weeklyGoalReached: { $sum: 0 },
          // Porcentaje alcanzado de la meta por ventas al mayor
          wholesalesGoalPercentage: { $sum: 0 },
          // Si la meta por ventas al mayor fue alcanzada
          wholesalesGoalReached: { $sum: 0 },
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      { $sort: { createdDate: -1 } },
    ];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stagesWholesale.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesWholesale.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (
      !salesParam.filters ||
      (salesParam.filters && !salesParam.filters.startDate)
    ) {
      // A partir del día actual se obtiene el lunes anterior, y el siguiente domingo
      const currentDayOfTheWeek = moment().utc().subtract(4, "hours").day();

      const startDate = moment(salesParam.filters.startDate)
        .utc()
        .subtract(4, "hours")
        .subtract(currentDayOfTheWeek - 1, "days")
        .endOf("day");

      const endDate = moment(salesParam.filters.startDate)
        .utc()
        .subtract(4, "hours")
        .add(7 - currentDayOfTheWeek, "days")
        .endOf("day");

      stagesWholesale.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const commissionResultsWholesaleGoal = await Sales.aggregate(
      stagesWholesale
    );

    commissionResultsWholesaleGoal.map((item) => {
      item.weeklyGoalPercentage = (item.total / item.seller.weeklyGoal) * 100;
      item.weeklyGoalReached =
        item.weeklyGoalPercentage >
        item.seller.weeklyGoalMinimumPercentageOfSales;

      item.wholesalesGoalPercentage =
        (item.totalWholesales / item.seller.wholesalesGoal) * 100;
      item.wholesalesGoalReached = item.wholesalesGoalPercentage > 100;
    });

    // AHORA SE OBTIENE EL REPORTE DE LAS COMISIONES POR META SEMANAL DE LA TIENDA  //

    let stages = [
      {
        $group: {
          _id: "$agency",

          // Total de ingresos reales en bs (DETAL, MAYOR y ABONOS) que fueron ingresados en los cierres de formas de pago
          total: { $sum: "$total" },
          valueDollar: { $last: "$valueDollar" },
          agency: { $last: "$agency" },

          // Datos para ser llenados posteriormente
          // Porcentaje alcanzado de la meta semanal
          weeklyGoalPercentage: { $sum: 0 },
          // Si la meta semanal fue alcanzada
          weeklyGoalReached: { $sum: 0 },
        },
      },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      { $sort: { createdDate: -1 } },
    ];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (
      !salesParam.filters ||
      (salesParam.filters && !salesParam.filters.startDate)
    ) {
      // A partir del día actual se obtiene el lunes anterior, y el siguiente domingo
      const currentDayOfTheWeek = moment().utc().subtract(4, "hours").day();

      const startDate = moment(salesParam.filters.startDate)
        .utc()
        .subtract(4, "hours")
        .subtract(currentDayOfTheWeek - 1, "days")
        .endOf("day");

      const endDate = moment(salesParam.filters.startDate)
        .utc()
        .subtract(4, "hours")
        .add(7 - currentDayOfTheWeek, "days")
        .endOf("day");

      stages.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const commissionResultsWeeklyGoal = await PaymentMethodsRecord.aggregate(
      stages
    );

    // NOTA: forEach, no funciona bien cuando la callback es async, por lo que se utiliza este método
    await Promise.all(
      commissionResultsWeeklyGoal.map(async (item) => {
        const seller = await Seller.findOne({ agency: item.agency._id })
          .sort({ createdDate: "asc" })
          .lean();

        item.seller = seller;
        item.weeklyGoalPercentage = (item.total / seller.weeklyGoal) * 100;
        item.weeklyGoalReached =
          item.weeklyGoalPercentage > seller.weeklyGoalMinimumPercentageOfSales;
      })
    );

    return {
      commissionResultsWholesaleGoal,
      commissionResultsWeeklyGoal,
    };
  },

  commissionReportSaved: async (salesParam) => {
    // INICIALMENTE SE OBTIENE EL REPORTE DE LAS COMISIONES AL MAYOR //

    const startDate = moment(salesParam.filters.startDate).startOf("day");
    //const endDate =  moment(salesParam.filters.endDate).endOf('day');

    let stages = [
      { $match: { startDate: { $eq: new Date(startDate) } } },
      //{ $match: {'endDate': { $eq: new Date(endDate) }}},
      {
        $lookup: {
          from: "agencies",
          localField: "commissionResultsWeeklyGoal.agency",
          foreignField: "_id",
          as: "agencies",
        },
      },
      {
        $set: {
          commissionResultsWeeklyGoal: {
            $map: {
              input: "$commissionResultsWeeklyGoal",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    agency: {
                      $arrayElemAt: [
                        "$agencies",
                        {
                          $indexOfArray: ["$agencies._id", "$$this.agency"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "commissionResultsWeeklyGoal.seller",
          foreignField: "_id",
          as: "sellers",
        },
      },
      {
        $set: {
          commissionResultsWeeklyGoal: {
            $map: {
              input: "$commissionResultsWeeklyGoal",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    seller: {
                      $arrayElemAt: [
                        "$sellers",
                        {
                          $indexOfArray: ["$sellers._id", "$$this.seller"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "agencies",
          localField: "commissionResultsWholesaleGoal.agency",
          foreignField: "_id",
          as: "agencies",
        },
      },
      {
        $set: {
          commissionResultsWholesaleGoal: {
            $map: {
              input: "$commissionResultsWholesaleGoal",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    agency: {
                      $arrayElemAt: [
                        "$agencies",
                        {
                          $indexOfArray: ["$agencies._id", "$$this.agency"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "commissionResultsWholesaleGoal.seller",
          foreignField: "_id",
          as: "sellers",
        },
      },
      {
        $set: {
          commissionResultsWholesaleGoal: {
            $map: {
              input: "$commissionResultsWholesaleGoal",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    seller: {
                      $arrayElemAt: [
                        "$sellers",
                        {
                          $indexOfArray: ["$sellers._id", "$$this.seller"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ];

    let results = await CommissionsReport.aggregate(stages);

    if (results.length === 0) return null;

    //Si hay filtro de sucursal
    if (salesParam.filters && salesParam.filters.agency) {
      const agency = salesParam.filters.agency;

      results[0].commissionResultsWeeklyGoal =
        results[0].commissionResultsWeeklyGoal.filter(
          (report) => agency.toString() === report.agency._id.toString()
        );

      results[0].commissionResultsWholesaleGoal =
        results[0].commissionResultsWholesaleGoal.filter(
          (report) => agency.toString() === report.agency._id.toString()
        );
    }

    return {
      ...results[0],
    };
  },

  // Reporte de comisiones para televentas

  telesalesCommissionReports: async (salesParam) => {
    // INICIALMENTE SE OBTIENE EL REPORTE DE LAS COMISIONES AL MAYOR //

    let stagesWholesale = [
      { $match: { isCredit: false } },
      { $match: { isTelesale: true } },
      {
        $group: {
          _id: null,

          // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },

          // Total de ingresos por ventas al mayor en $
          totalDollars: {
            $sum: {
              $divide: [
                { $cond: [{ $eq: ["$isWholesale", true] }, "$total", 0] },
                "$valueDollar",
              ],
            },
          },
          // Total en dolares por concepto de ventas al mayor de contado
          totalWholesales: {
            $sum: {
              $divide: [
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isWholesale", true] },
                        { $eq: ["$isSumation", false] },
                      ],
                    },
                    "$total",
                    0,
                  ],
                },
                "$valueDollar",
              ],
            },
          },
          // Total en dólares por concepto de abonos
          totalSumations: {
            $sum: {
              $divide: [
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isWholesale", true] },
                        { $eq: ["$isSumation", true] },
                      ],
                    },
                    "$total",
                    0,
                  ],
                },
                "$valueDollar",
              ],
            },
          },
          totalClients: { $sum: 1 },
          totalWeight: { $sum: "$totalWeight" },
          valueDollar: { $last: "$valueDollar" },

          // Datos para ser llenados posteriormente
          // Porcentaje alcanzado de la meta semanal
          weeklyGoalPercentage: { $sum: 0 },
          // Si la meta semanal fue alcanzada
          weeklyGoalReached: { $sum: 0 },
          // Porcentaje alcanzado de la meta por ventas al mayor
          wholesalesGoalPercentage: { $sum: 0 },
          // Si la meta por ventas al mayor fue alcanzada
          wholesalesGoalReached: { $sum: 0 },
        },
      },
      { $sort: { createdDate: -1 } },
    ];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stagesWholesale.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesWholesale.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesWholesale.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stagesWholesale.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const commissionResultsWholesaleGoal = await Sales.aggregate(
      stagesWholesale
    );

    let wholesalesGoal = 1000;
    let wholesalesGoalCommissionPercentage = 5;

    commissionResultsWholesaleGoal.map((item) => {
      item.wholesalesGoal = wholesalesGoal;
      item.wholesalesGoalCommissionPercentage =
        wholesalesGoalCommissionPercentage;

      item.wholesalesGoalPercentage =
        (item.totalWholesales / wholesalesGoal) * 100;
      item.wholesalesGoalReached = item.wholesalesGoalPercentage > 100;
    });

    // INICIALMENTE SE OBTIENEN LOS TOTALES DETALLADOS POR TIENDA

    stagesWholesale = [
      { $match: { isCredit: false } },
      { $match: { isTelesale: true } },
      {
        $group: {
          _id: "$agency",

          // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },

          // Total de ingresos por ventas al mayor en $
          totalDollars: {
            $sum: {
              $divide: [
                { $cond: [{ $eq: ["$isWholesale", true] }, "$total", 0] },
                "$valueDollar",
              ],
            },
          },
          // Total en dolares por concepto de ventas al mayor de contado
          totalWholesales: {
            $sum: {
              $divide: [
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isWholesale", true] },
                        { $eq: ["$isSumation", false] },
                      ],
                    },
                    "$total",
                    0,
                  ],
                },
                "$valueDollar",
              ],
            },
          },
          // Total en dólares por concepto de abonos
          totalSumations: {
            $sum: {
              $divide: [
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isWholesale", true] },
                        { $eq: ["$isSumation", true] },
                      ],
                    },
                    "$total",
                    0,
                  ],
                },
                "$valueDollar",
              ],
            },
          },
          totalClients: { $sum: 1 },
          totalWeight: { $sum: "$totalWeight" },
          valueDollar: { $last: "$valueDollar" },
          agency: { $last: "$agency" },

          // Datos para ser llenados posteriormente
          wholesalesGoalReached: { $sum: 0 },
        },
      },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      { $sort: { createdDate: -1 } },
    ];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stagesWholesale.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesWholesale.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesWholesale.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stagesWholesale.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const commissionResultsWholesaleGoalPerAgency = await Sales.aggregate(
      stagesWholesale
    );

    // Se observa si se llegó a la meta para que se vea reflejado en cada uno de los valores de cada tienda para saber si se muestran o no todos los valores
    let wholesalesGoalReached =
      commissionResultsWholesaleGoal[0].wholesalesGoalReached;

    commissionResultsWholesaleGoalPerAgency.map((item) => {
      // Se le asigna a cada uno si el total de televentas llegó o no
      item.wholesalesGoalReached = wholesalesGoalReached;
    });

    // AHORA SE OBTIENE EL REPORTE DE LAS COMISIONES POR META SEMANAL DE LA TIENDA  //

    // Valores por agencia
    let stages = [
      { $match: { isTelesale: true } },
      {
        $group: {
          _id: "$agency",
          // Total de ingresos reales en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },
          // Total de ingresos en dolares
          totalDollars: { $sum: { $divide: ["$total", "$valueDollar"] } },
          totalClients: { $sum: 1 },
          totalWeight: { $sum: "$totalWeight" },
          agency: { $last: "$agency" },
        },
      },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      { $sort: { createdDate: -1 } },
    ];

    // Sumatoria total de todas las tiendas
    let stagesTotal = [
      { $match: { isTelesale: true } },
      {
        $group: {
          _id: null,
          // Total de ingresos reales en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },
          // Total de ingresos en dolares
          totalDollars: { $sum: { $divide: ["$total", "$valueDollar"] } },
          totalClients: { $sum: 1 },
          totalWeight: { $sum: "$totalWeight" },
          agency: { $last: "$agency" },
        },
      },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      { $sort: { createdDate: -1 } },
    ];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stages.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
        stagesTotal.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
        stagesTotal.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
        stagesTotal.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stages.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
      stagesTotal.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }
    const commissionResultsWeeklyGoal = await Sales.aggregate(stages);
    const commissionResultsWeeklyGoalTotal = await Sales.aggregate(stagesTotal);

    /*let weeklyGoal = 100;

        // NOTA: forEach, no funciona bien cuando la callback es async, por lo que se utiliza este método
        await Promise.all(
            commissionResultsWeeklyGoal.map( async (item) => {

                item.weeklyGoal = weeklyGoal;

                item.weeklyGoalPercentage = item.total / weeklyGoal * 100;
                item.weeklyGoalReached = (item.weeklyGoalPercentage > 100);
            })
        ); */

    return {
      commissionResultsWholesaleGoal,
      commissionResultsWholesaleGoalPerAgency,
      commissionResultsWeeklyGoal,
      commissionResultsWeeklyGoalTotal: commissionResultsWeeklyGoalTotal[0],
    };
  },

  /**
   * Función para registrar ventas
   *
   * @param {params} salesParam
   */
  processDataOffline: async (offlineParam) => {
    // Se crea un arreglo de los _id agregados para eliminarlos en caso de que ocurra algun problema
    let dataToDelete = {
      InventoryRecordFiscal: [],
      SalesFiscal: [],
      WholesalesFiscal: null,
      WholesaleFiscalClient: null,
      Box: [],
    };

    try {
      //Recorrer ventas
      for (let salesParam of offlineParam.items) {
        // Debido al problema de recarga de página, se verifica que no haya una venta con la misma agencia y fecha, ya que de lo contrario no se procesa
        const registeredSale = await SalesFiscal.findOne({
          agency: ObjectId(salesParam.agency),
          createdDate: salesParam.createdDate,
        });

        if (registeredSale) continue;

        //data metodos de pago
        if (salesParam.ves !== "") {
          salesParam.ves = parseFloat(
            salesParam.ves.toString().replace(/,/g, "")
          );
        }
        if (salesParam.dollar !== "") {
          salesParam.dollar = parseFloat(
            salesParam.dollar.toString().replace(/,/g, "")
          );
        }
        if (salesParam.eur !== "") {
          salesParam.eur = parseFloat(
            salesParam.eur.toString().replace(/,/g, "")
          );
        }
        if (salesParam.cop !== "") {
          salesParam.cop = parseFloat(
            salesParam.cop.toString().replace(/,/g, "")
          );
        }
        if (salesParam.tAmmount !== "") {
          salesParam.tAmmount = parseFloat(
            salesParam.tAmmount.toString().replace(/,/g, "")
          );
        }
        if (salesParam.pAmmount !== "") {
          salesParam.pAmmount = parseFloat(
            salesParam.pAmmount.toString().replace(/,/g, "")
          );
        }
        if (salesParam.pAmmountExtra !== "") {
          salesParam.pAmmountExtra = parseFloat(
            salesParam.pAmmountExtra.toString().replace(/,/g, "")
          );
        }

        let combosDifferentialSum = 0; // Diferencial total por venta de algún producto al mayor
        let totalDifferentialSum = 0; // Diferencial total

        let products = [];
        //Crear array de productos vendidos
        for (let item of salesParam.items) {
          //sacar diferencial si es oferta
          let differential = item.isOffer
            ? parseFloat(item.kg) * item.regularPrice -
              parseFloat(item.kg) * item.price
            : 0;

          // En caso de que sea un delivery, el diferencial es cero
          if (item.code[0] === "D" || item.code[0] === "d") {
            differential = 0;
          }

          let poductParam = {
            name: item.name,
            price: item.price,
            regularPrice: item.regularPrice, //precio regular si es oferta
            differential: differential,
            kg: item.kg,
            isOffer: item.isOffer,
            total: item.total,
          };
          products.push(poductParam);

          // Procesar como combo solo si existe en el catálogo de combos (no por prefijo C/c)
          // Si no existe como combo, processCombos lanza y seguimos con el producto normal.
          if (item.code[0] !== "D" && item.code[0] !== "d") {
            try {
              let combosDifferential = await processCombos(
                salesParam,
                item,
                dataToDelete
              );

              combosDifferentialSum += combosDifferential;
              totalDifferentialSum += combosDifferential;
              continue;
            } catch (err) {
              const msg = (err && err.message) ? err.message : String(err);
              if (!msg.includes('No se encontró el combo')) {
                throw err;
              }
            }
          }

          // En caso de que sea un delivery, no se toma en cuenta en el inventario
          if (item.code[0] === "D" || item.code[0] === "d") {
            continue;
          }

          //Registrar salida de cada producto en inventario
          let inventory = await InventoryFiscal.findOne({
            product: item.id,
            agency: salesParam.agency,
          }).populate("product");

          // if (!inventory) {
          //   console.error(`El producto ${item.name} no existe en el inventario.`);
          //   return;
          // }

          if (inventory) {

            // // Verificar si el stock disponible es suficiente
            // let availableStock = parseFloat(inventory.kg); // Convertir kg a número
            // let requestedKg = parseFloat(item.kg); // Convertir cantidad solicitada a número

            // // Verificar si hay suficiente stock
            // if (availableStock < 0) {
            //   throw (`El producto ${item.name} no tiene stock disponible.`);
            // }

            // if (availableStock < requestedKg) {
            //   throw (
            //     `No hay suficiente stock de ${item.name}. Disponible: ${availableStock} kg, Requerido: ${requestedKg} kg.`
            //   );
            // }

            //Registrar en historial de inventario
            let inv = inventory.kg.toFixed(3)
            let total = parseFloat(inv) - parseFloat(item.kg);
            
            let inventoryParam = {};
            inventoryParam.product = item.id;
            inventoryParam.agency = salesParam.agency;
            inventoryParam.kg = inventory.kg; //arrastrar kg anterior;
            inventoryParam.in = 0; //entrada 0
            inventoryParam.out = item.kg; //Salida
            inventoryParam.total = total;
            inventoryParam.note = " ";
            inventoryParam.price = item.price; //precio de venta
            inventoryParam.regularPrice = item.regularPrice; //precio regular si es oferta
            inventoryParam.differential = differential;
            inventoryParam.isOffer = item.isOffer;
            inventoryParam.type = enumOut.out.sale;

            const record = new InventoryRecordFiscal(inventoryParam);
            const recordSaved = await record.save();
            dataToDelete.InventoryRecordFiscal.push(recordSaved._id);

            //Actualizar total en inventario
            await InventoryFiscal.findOneAndUpdate(
              { product: item.id, agency: salesParam.agency },
              { kg: total }
            );

            try {
              //si es merma por empaque o merma por picadillo
              if (
                inventory.product &&
                !salesParam.isWholesale &&
                (inventory.product.decrease || inventory.product.mincemeat)
              ) {
                let average = 0.012;
                let typeOut = enumOut.out.decrease;
                // prodmedio si es picadillo
                if (inventory.product.mincemeat) {
                  average = 0.01;
                  typeOut = enumOut.out.mincemeat;
                }

                //Marcar salida de inventario en historial por merma
                let totalDecrease = total - average * parseFloat(item.kg); //.012
                let decrease = average * parseFloat(item.kg);

                let decreaseParam = {};
                decreaseParam.product = item.id;
                decreaseParam.agency = salesParam.agency;
                decreaseParam.kg = total; //arrastrar kg anterior;
                decreaseParam.in = 0; //entrada 0
                decreaseParam.out = decrease; //Salida
                decreaseParam.total = totalDecrease;
                decreaseParam.note = " ";
                decreaseParam.comment = "";
                decreaseParam.type = typeOut;

                const recordDecrease = new InventoryRecordFiscal(decreaseParam);
                const recordDecreaseSaved = await recordDecrease.save();
                dataToDelete.InventoryRecordFiscal.push(recordDecreaseSaved._id);

                //Actualizar total en inventario
                await InventoryFiscal.findOneAndUpdate(
                  { product: item.id, agency: salesParam.agency },
                  { kg: totalDecrease }
                );
              }
            } catch (e) {
              console.log("error en merma o picadillo", e);
            }
          } else {
            //Inicializar inventario en 0 y hacer las operaciones
            //llegado a este punto se realizó una venta sin inventario

            //Registrar en historial de inventario
            let total = 0 - parseFloat(item.kg);

            let newProd = {};

            newProd.product = item.id;
            newProd.agency = salesParam.agency;
            newProd.kg = total;
            const inventory = new InventoryFiscal(newProd);
            await inventory.save();

            //registrar salida en historial
            let inventoryRecordParam = {};
            inventoryRecordParam.product = item.id;
            inventoryRecordParam.agency = salesParam.agency;
            inventoryRecordParam.kg = 0; //
            inventoryRecordParam.in = 0; //kgs entrantes
            inventoryRecordParam.out = item.kg; //Salida
            inventoryRecordParam.total = total;
            inventoryRecordParam.note = " ";
            inventoryRecordParam.price = item.price; //precio de venta
            inventoryRecordParam.regularPrice = item.regularPrice; //precio regular si es oferta
            inventoryRecordParam.differential = differential;
            inventoryRecordParam.isOffer = item.isOffer;
            inventoryRecordParam.type = enumOut.out.sale;
            const record = new InventoryRecordFiscal(inventoryRecordParam);
            const recordSaved = await record.save();
            dataToDelete.InventoryRecordFiscal.push(recordSaved._id);

            //Obtener producto para saber si tiene merma por empaque o picadillo
            let product = await Product.findOne({ _id: item.id });
            try {
              //si es merma por empaque
              if (product.decrease || product.mincemeat) {
                let average = 0.012;
                let typeOut = enumOut.out.decrease;
                // promedio si es picadillo
                if (product.mincemeat) {
                  average = 0.01;
                  typeOut = enumOut.out.mincemeat;
                }

                //Marcar salida de inventario en historial por merma
                let totalDecrease = total - average * parseFloat(item.kg); //.012
                let decrease = average * parseFloat(item.kg);

                let decreaseParam = {};
                decreaseParam.product = item.id;
                decreaseParam.agency = salesParam.agency;
                decreaseParam.kg = total; //arrastrar kg anterior;
                decreaseParam.in = 0; //entrada 0
                decreaseParam.out = decrease; //Salida
                decreaseParam.total = totalDecrease;
                decreaseParam.note = " ";
                decreaseParam.type = typeOut;

                const recordDecrease = new InventoryRecordFiscal(decreaseParam);
                const recordDecreaseSaved = await recordDecrease.save();
                dataToDelete.InventoryRecordFiscal.push(recordDecreaseSaved._id);

                //Actualizar total en inventario
                await InventoryFiscal.findOneAndUpdate(
                  { product: item.id, agency: salesParam.agency },
                  { kg: totalDecrease }
                );
              }
            } catch (e) {
              console.log("error en merma o picadillo", e);
            }
          }
        }

        //si no cobra por punto de venta
        if (salesParam.terminal === "") {
          delete salesParam.terminal;
        }
        //si no cobra por punto de venta extra
        if (salesParam.terminalExtra === "") {
          delete salesParam.terminalExtra;
        }

        //crear array de productos
        salesParam.products = products;

        //  Se almacena el diferencial por combos
        salesParam.combosDifferential = combosDifferentialSum;
        //  Se almacena el diferencial total
        salesParam.totalDifferential = totalDifferentialSum;

        // Promo cupón (fiscal offline): solo ventas al detal contado
        let couponUseDataFiscalOffline = null;
        const hasCouponCodeFiscalOffline = salesParam.couponCode != null && String(salesParam.couponCode).trim() !== '';
        if (hasCouponCodeFiscalOffline && !salesParam.isWholesale && !salesParam.isCredit) {
          const normalizedFiscalOffline = normalizeCouponCode(salesParam.couponCode);
          if (!normalizedFiscalOffline) {
            throw "Cupón no válido";
          }
          const totalBeforeDiscountFiscalOffline = parseFloat(salesParam.total);
          const updatedFiscalOffline = await PromoCoupon.findOneAndUpdate(
            { code: normalizedFiscalOffline, used: false },
            { $set: { used: true, usedAt: new Date() } }
          );
          if (!updatedFiscalOffline) {
            throw "Cupón ya utilizado o no válido";
          }
          salesParam.total = Math.round(totalBeforeDiscountFiscalOffline * 0.9 * 100) / 100;
          salesParam.couponCode = normalizedFiscalOffline;
          salesParam.couponDiscount = Math.round(totalBeforeDiscountFiscalOffline * 0.1 * 100) / 100;
          couponUseDataFiscalOffline = {
            couponCode: normalizedFiscalOffline,
            totalBeforeDiscount: totalBeforeDiscountFiscalOffline,
            totalAfterDiscount: salesParam.total,
            clientNames: salesParam.names || '',
            document: salesParam.document || '',
            phone: salesParam.phone || '',
            agency: salesParam.agency,
            user: salesParam.user
          };
        } else if (hasCouponCodeFiscalOffline && (salesParam.isWholesale || salesParam.isCredit)) {
          salesParam.couponCode = '';
          salesParam.couponDiscount = 0;
        }

        const sale = new SalesFiscal(salesParam);

        const saleSaved = await sale.save();
        dataToDelete.SalesFiscal.push(saleSaved._id);

        if (couponUseDataFiscalOffline) {
          await PromoCouponUse.create({
            couponCode: couponUseDataFiscalOffline.couponCode,
            saleOrder: null,
            saleFiscalOrder: saleSaved.order,
            clientNames: couponUseDataFiscalOffline.clientNames,
            document: couponUseDataFiscalOffline.document,
            phone: couponUseDataFiscalOffline.phone,
            totalBeforeDiscount: couponUseDataFiscalOffline.totalBeforeDiscount,
            discountPercent: 10,
            totalAfterDiscount: couponUseDataFiscalOffline.totalAfterDiscount,
            agency: couponUseDataFiscalOffline.agency,
            user: couponUseDataFiscalOffline.user
          });
        }

        if (saleSaved) {
          /** 0. Guardar cliente en su tabla */
          if (salesParam.document) {
            const client = await Client.findOne({
              document: salesParam.document,
            });

            //si el cliente no esta registrado se guarda
            if (!client) {
              const storeClient = new Client(salesParam);
              await storeClient.save();
            }
          }

          //1. Registrar entrada en caja por monedas

          //BsS
          if (salesParam.ves !== "" && salesParam.ves > 0) {
            let coin = 1;
            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await Box.findOne({
              agency: salesParam.agency,
              coin: coin,
            }).sort({ createdDate: -1 });

            if (lastRecord) {
              //Registrar en historial de inventario
              let totalVes =
                parseFloat(lastRecord.total) + parseFloat(salesParam.ves);

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
              };

              const saleBox = new BoxFiscal(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.BoxFiscal.push(saleBoxSaved._id);
            }
          }
          //Dolares
          if (salesParam.dollar !== "" && salesParam.dollar > 0) {
            let coin = 2;
            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await Box.findOne({
              agency: salesParam.agency,
              coin: coin,
            }).sort({ createdDate: -1 });

            if (lastRecord) {
              //Registrar en historial de inventario
              let totalDollar =
                parseFloat(lastRecord.total) + parseFloat(salesParam.dollar);

              let boxData = {
                agency: salesParam.agency,
                user: salesParam.user,
                totalBefore: lastRecord.total,
                in: salesParam.dollar.toFixed(2),
                out: 0,
                total: totalDollar.toFixed(2),
                coin: coin,
                coinDescription: enumBox.descriptionCoin[coin],
                type: enumBox.types.sale,
                order: saleSaved.order,
                typeDescription: enumBox.descriptionType[enumBox.types.sale],
              };

              const saleBox = new BoxFiscal(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.BoxFiscal.push(saleBoxSaved._id);
            }
          }
          //Euros
          if (salesParam.eur !== "" && salesParam.eur > 0) {
            let coin = 3;
            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await Box.findOne({
              agency: salesParam.agency,
              coin: coin,
            }).sort({ createdDate: -1 });

            if (lastRecord) {
              //Registrar en historial de inventario
              let totalEur =
                parseFloat(lastRecord.total) + parseFloat(salesParam.eur);

              let boxData = {
                agency: salesParam.agency,
                user: salesParam.user,
                totalBefore: lastRecord.total,
                in: salesParam.eur.toFixed(2),
                out: 0,
                total: totalEur.toFixed(2),
                coin: coin,
                coinDescription: enumBox.descriptionCoin[coin],
                type: enumBox.types.sale,
                order: saleSaved.order,
                typeDescription: enumBox.descriptionType[enumBox.types.sale],
              };

              const saleBox = new BoxFiscal(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.BoxFiscal.push(saleBoxSaved._id);
            }
          }
          //Pesos
          if (salesParam.cop !== "" && salesParam.cop > 0) {
            let coin = 4;
            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await Box.findOne({
              agency: salesParam.agency,
              coin: coin,
            }).sort({ createdDate: -1 });

            if (lastRecord) {
              //Registrar en historial de inventario
              let totalCop =
                parseFloat(lastRecord.total) + parseFloat(salesParam.cop);

              let boxData = {
                agency: salesParam.agency,
                user: salesParam.user,
                totalBefore: lastRecord.total,
                in: salesParam.cop.toFixed(2),
                out: 0,
                total: totalCop.toFixed(2),
                coin: coin,
                coinDescription: enumBox.descriptionCoin[coin],
                type: enumBox.types.sale,
                order: saleSaved.order,
                typeDescription: enumBox.descriptionType[enumBox.types.sale],
              };

              const saleBox = new BoxFiscal(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.BoxFiscal.push(saleBoxSaved._id);
            }
          }

          //2. Registrar cambio en caja
          if (salesParam.changeData) {
            let coin = salesParam.changeData.typeChange;
            let value = salesParam.changeData.changeAmmount;
            let amount = parseFloat(value.toString().replace(/,/g, ""));

            //Obtener ultimo registro de caja para la sucursal y moneda seleccionada
            let lastRecord = await Box.findOne({
              agency: salesParam.agency,
              coin: coin,
            }).sort({ createdDate: -1 });

            if (lastRecord) {
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
              };

              const saleBox = new BoxFiscal(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.BoxFiscal.push(saleBoxSaved._id);
            }
          }
        }
      }
    } catch (error) {
      // Se eliminan todos los registros de inventario que se hayan creado, para de esta manera no descontrolar balance
      for (let recordID of dataToDelete.InventoryRecordFiscal) {
        // Se busca el record almacenado
        let item = await InventoryRecordFiscal.findByIdAndDelete(recordID);

        // Se obtiene el inventario modificado
        let inventory = await InventoryFiscal.findOne({
          product: item.product,
          agency: item.agency,
        }).populate("product");

        if (inventory) {
          // Se vuelve a sumar lo restado por los kg del producto
          let total = parseFloat(inventory.kg) + parseFloat(item.out);

          //Actualizar total en inventario
          await InventoryFiscal.findOneAndUpdate(
            { product: item.product, agency: item.agency },
            { kg: total }
          );
        }
      }

      // Se eliminan todos los tickets registrados
      for (let recordID of dataToDelete.SalesFiscal) {
        // Se busca el ticket almacenado y se elimina
        await SalesFiscal.findByIdAndDelete(recordID);
      }

      // Se eliminan todos los registros de caja, como lo son los cambios y las entradas mismas de dinero
      for (let recordID of dataToDelete.Box) {
        // Se busca el record de caja almacenado y se elimina
        await Box.findByIdAndDelete(recordID);
      }

      // Ya que se procesó el error, se vuelve a lanzar
      throw error;
    }
  },

  /**
   * Funcion para obtener las ventas con paginación y filtros
   *
   * Filtra por rol de usuario y sucursal
   */
  salesCombosChart: async (salesParam) => {
    // resultados por página
    const pageSize = salesParam.pageSize;
    // Página: el page index de react-table-component
    const pageIndex = salesParam.pageIndex;

    //Si esta el parametro se crea el objeto para ordenar adecuadamente
    if (salesParam.sortBy) {
      let direction = salesParam.sortBy.desc == true ? -1 : 1;
      sortBy = { [salesParam.sortBy.id]: direction };
    }

    // Se busca el nombre del producto por su código
    let product = await Product.findOne({
      code: salesParam.filters.productCode,
    });

    if (!product) {
      return {
        results: [],
        metadata: [],
        total: 0,
      };
      //throw('No existe un producto con ese código. Intente de nuevo')
    }

    //stage o query principal
    const stages = [
      {
        $group: {
          _id: {
            createdDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdDate" },
            },
          },
          products: { $push: "$products" },
          createdDate: { $last: "$createdDate" },
        },
      },
      {
        $addFields: {
          products: {
            $reduce: {
              input: "$products",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      {
        $project: {
          createdDate: 1,
          items: {
            $filter: {
              input: "$products",
              as: "product",
              cond: { $eq: ["$$product.name", product.name] },
            },
          },
        },
      },
      {
        $project: {
          _id: {
            createdDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdDate",
              },
            },
          },
          total: {
            $sum: "$items.kg",
          },
          createdDate: 1,
        },
      },
      { $sort: { createdDate: 1 } },
      //total de punto de venta
      { $facet: { metadata: [{ $count: "total" }], data: [] } },
    ];

    //Si es admin o supervisor ve todos las sucursales y usuarios

    //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal
    if (
      salesParam.user.role == role.rol.Cashier ||
      salesParam.user.role == role.rol.Manager
    ) {
      stages.unshift({ $match: { agency: ObjectId(salesParam.user.agency) } });
    }

    // Variables para el filtro de las horas (si lo hay)
    let initialHour = [];
    let finalHour = [];

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de cajero
      if (salesParam.filters.cashier) {
        stages.unshift({
          $match: { user: ObjectId(salesParam.filters.cashier) },
        });
      }

      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      //Si hay filtro por nombre
      if (salesParam.filters.names) {
        let regex = new RegExp(salesParam.filters.names, "gi");
        stages.unshift({ $match: { names: { $regex: regex } } });
      }

      //Si hay filtro por Código del producto
      if (salesParam.filters.productCode) {
        stages.unshift({
          $match: { products: { $elemMatch: { name: product.name } } },
        });
      }

      const stagesType = [];

      //Si hay filtro por DETAL
      if (salesParam.filters.retail) {
        stagesType.unshift({ type: { $eq: 1 } });
      }

      //Si hay filtro por MAYOR
      if (salesParam.filters.wholesale) {
        stagesType.unshift({ type: { $eq: 2 } });
      }

      //Si hay filtro por ABONO
      if (salesParam.filters.sumation) {
        stagesType.unshift({ type: { $eq: 3 } });
      }

      //Si hay filtro por CRÉDITO
      if (salesParam.filters.credit) {
        stagesType.unshift({ type: { $eq: 4 } });
      }

      if (
        salesParam.filters.retail ||
        salesParam.filters.wholesale ||
        salesParam.filters.sumation ||
        salesParam.filters.credit
      ) {
        stages.unshift({ $match: { $or: stagesType } });
      }

      //Si hay filtro por DETAL
      if (salesParam.filters.telesale) {
        stages.unshift({ $match: { isTelesale: { $eq: true } } });
      }

      // Si hay filtro de horas

      if (salesParam.filters.initialHour || salesParam.filters.finalHour) {
        if (salesParam.filters.initialHour) {
          initialHour = salesParam.filters.initialHour
            .split(":")
            .map((item) => {
              return item.trim();
            });

          // Si no hay minutos
          if (!initialHour[1]) {
            initialHour.push("0");
          }
        }

        if (salesParam.filters.finalHour) {
          finalHour = salesParam.filters.finalHour.split(":").map((item) => {
            return item.trim();
          });

          // Si no hay minutos
          if (!finalHour[1]) {
            finalHour.push("0");
          }
        }
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stages.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = salesParam.filters.initialHour
          ? moment(salesParam.filters.startDate)
              .utc()
              .set("hour", initialHour[0])
              .set("minute", initialHour[1])
          : moment(salesParam.filters.startDate).utc().startOf("day");

        const endDate = salesParam.filters.finalHour
          ? moment(salesParam.filters.endDate)
              .utc()
              .set("hour", finalHour[0])
              .set("minute", finalHour[1])
          : moment(salesParam.filters.endDate).utc().endOf("day");

        stages.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    //Si todos los filtros son vacios se consulta la fecha actual
    if (
      !salesParam.filters.cashier &&
      !salesParam.filters.ticket &&
      !salesParam.filters.reference &&
      !salesParam.filters.names &&
      !salesParam.filters.startDate &&
      !salesParam.filters.endDate
    ) {
      const startDate = salesParam.filters.initialHour
        ? moment()
            .utc()
            .set("hour", initialHour[0])
            .set("minute", initialHour[1])
        : moment().utc().subtract(4, "hours").startOf("day");

      const endDate = salesParam.filters.finalHour
        ? moment().utc().set("hour", finalHour[0]).set("minute", finalHour[1])
        : moment().utc().subtract(4, "hours").endOf("day");

      stages.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const sales = await SalesFiscal.aggregate(stages);

    return {
      results: sales[0].data,
      metadata: sales[0].metadata,
    };
  },
  // invoiceTotalsByCompany: async (invoiceParam) => {
  //   const filters = invoiceParam.filters || {};
  
  //   const dateMatch = {};
  //   if (filters.startDate && filters.endDate) {
  //     dateMatch.createdDate = {
  //       $gte: new Date(`${filters.startDate}T00:00:00Z`),
  //       $lte: new Date(`${filters.endDate}T23:59:59Z`)
  //     };
  //   }
  
  //   const companyMatch = filters.company
  //     ? {
  //         'agencyDetails.company': {
  //           $regex: filters.company,
  //           $options: 'i'
  //         }
  //       }
  //     : {};
  
  //   const pagosType8Pipeline = [
  //     {
  //       $match: {
  //         ...dateMatch,
  //         type: 8
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'salesfiscals',
  //         let: {
  //           doc: '$document',
  //           userId: '$user',
  //           agencyId: '$agency',
  //           type8Date: '$createdDate'
  //         },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ['$type', 7] },
  //                   { $eq: ['$isPayment', true] },
  //                   { $eq: ['$isSumation', true] },
  //                   { $eq: ['$document', '$$doc'] },
  //                   { $eq: ['$user', '$$userId'] },
  //                   { $eq: ['$agency', '$$agencyId'] },
  //                   { $gt: ['$createdDate', '$$type8Date'] } 
  //                 ]
  //               }
  //             }
  //           }
  //         ],
  //         as: 'relatedPayment'
  //       }
  //     },
  //     {
  //       $match: {
  //         $expr: {
  //           $gt: [{ $size: '$relatedPayment' }, 0]
  //         }
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'agencies',
  //         localField: 'agency',
  //         foreignField: '_id',
  //         as: 'agencyDetails'
  //       }
  //     },
  //     { $unwind: { path: '$agencyDetails', preserveNullAndEmptyArrays: true } },
  //     { $match: companyMatch }
  //   ];
  
  //   const otherTypesPipeline = [
  //     {
  //       $match: {
  //         ...dateMatch,
  //         type: { $nin: [7, 8] }
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'agencies',
  //         localField: 'agency',
  //         foreignField: '_id',
  //         as: 'agencyDetails'
  //       }
  //     },
  //     { $unwind: { path: '$agencyDetails', preserveNullAndEmptyArrays: true } },
  //     { $match: companyMatch }
  //   ];
  
  //   const stages = [
  //     {
  //       $facet: {
  //         pagosType8: pagosType8Pipeline,
  //         otrosTipos: otherTypesPipeline
  //       }
  //     },
  //     {
  //       $project: {
  //         allDocs: { $concatArrays: ['$pagosType8', '$otrosTipos'] }
  //       }
  //     },
  //     { $unwind: '$allDocs' },
  //     { $replaceRoot: { newRoot: '$allDocs' } },
  //     {
  //       $group: {
  //         _id: '$agencyDetails.company',
  //         companyName: { $first: '$agencyDetails.company' },
  //         totalAmount: { $sum: '$total' },
  //         taxableBase: { $sum: '$baseImponible' },
  //         iva: { $sum: '$iva' },
  //         exempt: { $sum: '$exento' },
  //         count: { $sum: 1 },
  //         invoices: {
  //           $push: {
  //             _id: '$_id',
  //             date: '$createdDate',
  //             document: '$document',
  //             names: '$names',
  //             baseImponible: '$baseImponible',
  //             iva: '$iva',
  //             exento: '$exento',
  //             total: '$total',
  //             agencyName: '$agencyDetails.name',
  //             type: '$type'
  //           }
  //         }
  //       }
  //     },
  //     {
  //       $project: {
  //         companyId: '$_id',
  //         companyName: 1,
  //         totalAmount: 1,
  //         taxableBase: 1,
  //         iva: 1,
  //         exempt: 1,
  //         count: 1,
  //         invoices: 1,
  //         _id: 0
  //       }
  //     }
  //   ];
  
  //   try {
  //     const results = await SalesFiscal.aggregate(stages);
  //     return { results };
  //   } catch (error) {
  //     console.error('Error en invoiceTotalsByCompany:', error.message);
  //     throw error;
  //   }
  // }
  invoiceTotalsByCompany: async (invoiceParam) => {

    const filters = invoiceParam.filters || {};
    const stages = [];

    // Restricción por rol de usuario:
    // - Si role === 3, solo puede ver facturas de su propia agencia
    if (invoiceParam.user && invoiceParam.user.role === 3 && invoiceParam.user.agency) {
      stages.push({
        $match: { agency: ObjectId(invoiceParam.user.agency) },
      });
    }

    // Filtro por fechas
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(`${filters.startDate}T00:00:00Z`);
      const endDate = new Date(`${filters.endDate}T23:59:59Z`);
      stages.push({
        $match: {
          createdDate: { $gte: startDate, $lte: endDate }
        }
      });
    }

    // Lookup para obtener los detalles de la agencia (incluyendo company)
    stages.push({
      $lookup: {
        from: 'agencies',
        localField: 'agency',
        foreignField: '_id',
        as: 'agencyDetails'
      }
    });

    // Unwind de los detalles de la agencia
    stages.push({
      $unwind: {
        path: '$agencyDetails',
        preserveNullAndEmptyArrays: false // Solo documentos que tengan agencia
      }
    });

    // Filtro por nombre de empresa (company) - buscar en agencyDetails.company
    if (filters.company) {
      stages.push({
        $match: {
          'agencyDetails.company': { $regex: filters.company, $options: 'i' }
        }
      });
    }

    // Agrupar por company (usando agencyDetails.company)
    stages.push({
      $group: {
        _id: '$agencyDetails.company',
        companyName: { $first: '$agencyDetails.company' },
        agencyName: { $first: '$agencyDetails.name' },
        totalAmount: { $sum: '$total' },
        taxableBase: { $sum: { $ifNull: ['$baseImponible', 0] } },
        iva: { $sum: { $ifNull: ['$iva', 0] } },
        exempt: { $sum: { $ifNull: ['$exento', 0] } },
        count: { $sum: 1 },
        invoices: {
          $push: {
            _id: '$_id',
            date: '$createdDate',
            document: '$document',
            names: '$names',
            baseImponible: { $ifNull: ['$baseImponible', 0] },
            iva: { $ifNull: ['$iva', 0] },
            exento: { $ifNull: ['$exento', 0] },
            total: '$total',
            agencyName: '$agencyDetails.name'
          }
        }
      }
    });

    // Proyección final
    stages.push({
      $project: {
        companyId: '$_id',
        companyName: 1,
        totalAmount: 1,
        taxableBase: 1,
        iva: 1,
        exempt: 1,
        count: 1,
        invoices: 1,
        _id: 0
      }
    });
  
    try {
      const results = await SalesFiscal.aggregate(stages);
      return { results };
    } catch (error) {
      console.error('Error en invoiceTotalsByCompany:', error.message);
      throw error;
    }
  },
  /**
   * Calcula estadísticas de cierres Z agrupados por compañía y sucursal
   * @param {Object} salesParam - Parámetros de filtro (filters, user, etc.)
   * @returns {Promise<Object>} - Estadísticas por compañía y sucursal
   */
  paymentFiscalMethodsStatsByCompanyAndBranch: async (salesParam) => {
    console.log('salesParam', salesParam);
    
    const filters = salesParam.filters || {};
    const stages = [];

    // Restricción por rol de usuario:
    // - Si role === 3 (Manager), solo puede ver cierres de su propia agencia
    if (salesParam.user && salesParam.user.role === role.rol.Manager && salesParam.user.agency) {
      stages.push({
        $match: { 'virtualValues.agency._id': ObjectId(salesParam.user.agency) },
      });
    }

    // Filtro por fechas
    if (filters.startDate && filters.endDate) {
      const startDate = moment.utc(filters.startDate).startOf("day").toDate();
      const endDate = moment.utc(filters.endDate).endOf("day").toDate();
      stages.push({
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      });
    }

    // Filtro por nombre de empresa (company)
    if (filters.company) {
      stages.push({
        $match: {
          'virtualValues.agency.company': { $regex: filters.company, $options: 'i' }
        }
      });
    }

    // Filtro por agencia/sucursal
    if (filters.agency) {
      stages.push({
        $match: { 'virtualValues.agency._id': ObjectId(filters.agency) },
      });
    }

    // Ordenar por fecha de creación descendente para tomar el último cierre
    stages.push({
      $sort: { createdDate: -1 }
    });

    // Agrupar por agencia y fecha para tomar solo el último cierre del día
    stages.push({
      $group: {
        _id: {
          agency: '$virtualValues.agency._id',
          dateOnly: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          }
        },
        latestRecord: { $first: '$$ROOT' },
        createdDate: { $first: '$createdDate' }
      }
    });

    // Reemplazar el root con el último registro del día
    stages.push({
      $replaceRoot: { newRoot: '$latestRecord' }
    });

    // Determinar si se debe agrupar solo por compañía o por compañía y sucursal
    // Si hay filtro de company pero NO hay filtro de agency, agrupar solo por compañía
    const groupByCompanyOnly = filters.company && !filters.agency;

    // Agrupar según el caso
    if (groupByCompanyOnly) {
      // Agrupar solo por compañía (sumar todas las sucursales)
      stages.push({
        $group: {
          _id: {
            company: '$virtualValues.agency.company'
          },
          companyName: { $first: '$virtualValues.agency.company' },
          totalExempt: { $sum: { $ifNull: ['$exento', 0] } },
          totalTaxableBase: { $sum: { $ifNull: ['$baseImponible', 0] } },
          totalIva: { $sum: { $ifNull: ['$IVA', 0] } },
          totalAmount: { $sum: { $ifNull: ['$total', 0] } },
          closingCount: { $sum: 1 }
        }
      });
    } else {
      // Agrupar por compañía y sucursal
      stages.push({
        $group: {
          _id: {
            company: '$virtualValues.agency.company',
            branchName: '$virtualValues.agency.name',
            agencyId: '$virtualValues.agency._id'
          },
          companyName: { $first: '$virtualValues.agency.company' },
          branchName: { $first: '$virtualValues.agency.name' },
          agencyId: { $first: '$virtualValues.agency._id' },
          totalExempt: { $sum: { $ifNull: ['$exento', 0] } },
          totalTaxableBase: { $sum: { $ifNull: ['$baseImponible', 0] } },
          totalIva: { $sum: { $ifNull: ['$IVA', 0] } },
          totalAmount: { $sum: { $ifNull: ['$total', 0] } },
          closingCount: { $sum: 1 }
        }
      });
    }

    // Calcular promedio por cierre Z
    stages.push({
      $addFields: {
        averagePerClosing: {
          $cond: [
            { $gt: ['$closingCount', 0] },
            { $divide: ['$totalAmount', '$closingCount'] },
            0
          ]
        }
      }
    });

    // Proyección final
    if (groupByCompanyOnly) {
      stages.push({
        $project: {
          companyName: 1,
          totalExempt: 1,
          totalTaxableBase: 1,
          totalIva: 1,
          totalAmount: 1,
          closingCount: 1,
          averagePerClosing: { $round: ['$averagePerClosing', 2] },
          _id: 0
        }
      });
    } else {
      stages.push({
        $project: {
          companyName: 1,
          branchName: 1,
          agencyId: 1,
          totalExempt: 1,
          totalTaxableBase: 1,
          totalIva: 1,
          totalAmount: 1,
          closingCount: 1,
          averagePerClosing: { $round: ['$averagePerClosing', 2] },
          _id: 0
        }
      });
    }

    try {
      const results = await PaymentFiscalMethodsRecord.aggregate(stages);
      
      return { 
        results
      };
    } catch (error) {
      console.error('Error en paymentFiscalMethodsStatsByCompanyAndBranch:', error.message, error.stack);
      throw error;
    }
  }
  
  
};

async function processCombos(salesParam, comboToProcess, dataToDelete) {
  //  Se busca un combo habilitado para todas las agencias
  let combo = await Combos.findOne({
    name: comboToProcess.name,
    toAllAgencies: true,
  });

  // Si no se busca un combo unicamente para esta agencia
  if (!combo) {
    combo = await Combos.findOne({
      name: comboToProcess.name,
      toAllAgencies: false,
      agency: ObjectId(salesParam.agency),
    });
  }

  if (!combo) {
    throw (
      `No se encontró el combo "${comboToProcess.name}" en el catálogo (global o para esta sucursal). ` +
      `Si este producto no es un combo, cambie su código: no debe comenzar con "C" o "c", porque el sistema interpreta esos códigos como venta de combo.`
    );
  }

  let quantity = comboToProcess.kg;

  let totalDifferential = 0;

  for (let item of combo.toObject().items) {
    // Se multiplica la cantidad de combos llevados por las diferentes cantidades
    Object.assign(item, { kg: item.kg * quantity });

    //sacar diferencial si es oferta o es una venta al mayor
    let differential =
      parseFloat(item.kg) * item.regularPrice -
      parseFloat(item.kg) * item.price;

    totalDifferential += differential;

    //Registrar salida de cada producto en inventario
    let inventory = await InventoryFiscal.findOne({
      product: item.id,
      agency: salesParam.agency,
    }).populate("product");

    // if (!inventory) {
    //   throw (`El producto ${item.name} no existe en el inventario.`);
     
    // }

    if (inventory) {
      // Verificar si el stock disponible es suficiente
      // let availableStock = parseFloat(inventory.kg); // Convertir kg a número
      // let requestedKg = parseFloat(item.kg); // Convertir cantidad solicitada a número

      // // Verificar si hay suficiente stock
      // if (availableStock < 0) {
      //    throw (`El producto ${item.name} no tiene stock disponible.`);
      // }

      // if (availableStock < requestedKg) {
      //   throw (
      //     `No hay suficiente stock de ${item.name}. Disponible: ${availableStock} kg, Requerido: ${requestedKg} kg.`
      //   );
      // }

      //Registrar en historial de inventario
      let inv = inventory.kg.toFixed(3)
      let total = parseFloat(inv) - parseFloat(item.kg);

      let inventoryParam = {};
      inventoryParam.product = item.id;
      inventoryParam.agency = salesParam.agency;
      inventoryParam.kg = inventory.kg; //arrastrar kg anterior;
      inventoryParam.in = 0; //entrada 0
      inventoryParam.out = item.kg; //Salida
      inventoryParam.total = total;
      inventoryParam.note = " ";
      inventoryParam.price = item.price; //  Precio de venta
      inventoryParam.regularPrice = item.regularPrice; //  Precio regular o normal al detal
      inventoryParam.differential = differential; //  Diferencial
      inventoryParam.isOffer = item.isOffer; //  Si fue una oferta
      inventoryParam.isWholesale = false; //  Solo hay combos al mayor, solo al detal
      inventoryParam.isCombo = true; //  Si fue una salida por medio de un combo
      inventoryParam.type = enumOut.out.sale;
      if (salesParam.isCredit) {
        inventoryParam.isCredit = true;
      }

      const record = new InventoryRecordFiscal(inventoryParam);
      const recordSaved = await record.save();
      dataToDelete.InventoryRecord.push(recordSaved._id);

      //Actualizar total en inventario
      await InventoryFiscal.findOneAndUpdate(
        { product: item.id, agency: salesParam.agency },
        { kg: total }
      );

      try {
        //si es merma por empaque o picadillo
        if (
          inventory.product &&
          !salesParam.isWholesale &&
          (inventory.product.decrease || inventory.product.mincemeat)
        ) {
          let average = 0.012;
          let typeOut = enumOut.out.decrease;
          // prodmedio si es picadillo
          if (inventory.product.mincemeat) {
            average = 0.01;
            typeOut = enumOut.out.mincemeat;
          }

          //Marcar salida de inventario en historial por merma
          let totalDecrease = total - average * parseFloat(item.kg); //.012
          let decrease = average * parseFloat(item.kg);

          let decreaseParam = {};
          decreaseParam.product = item.id;
          decreaseParam.agency = salesParam.agency;
          decreaseParam.kg = total; //arrastrar kg anterior;
          decreaseParam.in = 0; //entrada 0
          decreaseParam.out = decrease; //Salida
          decreaseParam.total = totalDecrease;
          decreaseParam.note = " ";
          decreaseParam.comment = "";
          decreaseParam.type = typeOut;

          const recordDecrease = new InventoryRecordFiscal(decreaseParam);
          const recordDecreaseSaved = await recordDecrease.save();
          dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

          //Actualizar total en inventario
          await InventoryFiscal.findOneAndUpdate(
            { product: item.id, agency: salesParam.agency },
            { kg: totalDecrease }
          );
        }
      } catch (e) {
        console.log("error en merma o picadillo", e);
      }
    } else {
      //Inicializar inventario en 0 y hacer las operaciones
      //llegado a este punto se realizó una venta sin inventario

      //Registrar en historial de inventario
      let total = 0 - parseFloat(item.kg);

      let newProd = {};

      newProd.product = item.id;
      newProd.agency = salesParam.agency;
      newProd.kg = total;
      const inventory = new InventoryFiscal(newProd);
      await inventory.save();

      //registrar salida en historial
      let inventoryRecordParam = {};
      inventoryRecordParam.product = item.id;
      inventoryRecordParam.agency = salesParam.agency;
      inventoryRecordParam.kg = 0; //
      inventoryRecordParam.in = 0; //kgs entrantes
      inventoryRecordParam.out = item.kg; //Salida
      inventoryRecordParam.total = total;
      inventoryRecordParam.note = " ";
      inventoryRecordParam.price = item.price; //precio de venta
      inventoryRecordParam.regularPrice = item.regularPrice; //precio regular si es oferta
      inventoryRecordParam.differential = differential;
      inventoryRecordParam.isOffer = item.isOffer;
      inventoryRecordParam.isWholesale = false;
      inventoryRecordParam.isCombo = true;
      inventoryRecordParam.type = enumOut.out.sale;
      if (salesParam.isCredit) {
        inventoryRecordParam.isCredit = true;
      }

      const record = new InventoryRecordFiscal(inventoryRecordParam);
      const recordSaved = await record.save();
      dataToDelete.InventoryRecord.push(recordSaved._id);

      //Obtener producto para saber si tiene merma por empaque
      let product = await Product.findOne({ _id: item.id });
      try {
        //si es merma por empaque
        if (product.decrease || product.mincemeat) {
          let average = 0.012;
          let typeOut = enumOut.out.decrease;
          // prodmedio si es picadillo
          if (product.mincemeat) {
            average = 0.01;
            typeOut = enumOut.out.mincemeat;
          }

          //Marcar salida de inventario en historial por merma
          let totalDecrease = total - average * parseFloat(item.kg); //.012
          let decrease = average * parseFloat(item.kg);

          let decreaseParam = {};
          decreaseParam.product = item.id;
          decreaseParam.agency = salesParam.agency;
          decreaseParam.kg = total; //arrastrar kg anterior;
          decreaseParam.in = 0; //entrada 0
          decreaseParam.out = decrease; //Salida
          decreaseParam.total = totalDecrease;
          decreaseParam.note = " ";
          decreaseParam.type = typeOut;

          const recordDecrease = new InventoryRecordFiscal(decreaseParam);
          const recordDecreaseSaved = await recordDecrease.save();
          dataToDelete.InventoryRecordFiscal.push(recordDecreaseSaved._id);

          //Actualizar total en inventario
          await InventoryFiscal.findOneAndUpdate(
            { product: item.id, agency: salesParam.agency },
            { kg: totalDecrease }
          );
        }
      } catch (e) {
        console.log("error en merma o picadillo", e);
      }
    }
  }

  return totalDifferential;
}

salesFiscalService.processCombos = processCombos;

module.exports = salesFiscalService;
