const db = require("../_helpers/db");
const { Agency } = require("../_helpers/db");
const Sales = db.Sales;
const SalesFiscal = db.SalesFiscal;
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
const Combos = db.Combos;
const Seller = db.Seller;
const Operator = db.Operator;
const BoxClose = db.BoxClose;
const Terminal = db.Terminal;
const TerminalRecord = db.TerminalRecord;
const CommissionsReport = db.CommissionsReport;
const userService = require('./user.service');
const enumBox = require("../enums/box.enum");
const enumSales = require("../enums/sales.enum");
const enumOut = require("../enums/typeOut.enum");
const bankEnum = require("../enums/bank.enum");
const moment = require("moment");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const role = require("../enums/roles.enum");
const Client = db.Client;
const PaymentMethodsRecord = db.PaymentMethodsRecord;
const PaymentMethodsGeneralReportRecord = db.PaymentMethodsGeneralReportRecord;
const PromoCoupon = db.PromoCoupon;
const PromoCouponUse = db.PromoCouponUse;
const { normalizeCouponCode } = require("../_helpers/promoCoupon.helper");

const inventoryService = require("../services/inventory.service");

let salesService = {
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
      let lastRecord = await Box.findOne({
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
      WholesaleClient: null,
      Box: [],
    };

    try {
      // Datos para historial de cupón (si se usó cupón)
      let couponUseData = null;

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
          name: item.name,
          price: item.price, //  Precio del producto en la venta
          regularPrice: item.regularPrice, //  Precio normal del producto al detal
          differential: differential, //  Diferencial de la venta (si lo hay)
          wholesaleDiscountDifferential: wholesaleDiscountDifferential,
          totalDifferential: totalDifferential,
          kg: item.kg,
          isOffer: item.isOffer, //  Si fue una oferta
          isWholesale: item.isWholesale, //  Si fue una venta al mayor
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
        // Si no existe como combo, processCombos lanza y continuamos con el flujo normal del producto.
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

        //Registrar salida de cada producto en inventario
        let inventory = await Inventory.findOne({
          product: item.id,
          agency: salesParam.agency,
        }).populate("product");

        // Venta permitida sin stock previo o con saldo negativo tras la salida
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

          const record = new InventoryRecord(inventoryParam);
          const recordSaved = await record.save();
          dataToDelete.InventoryRecord.push(recordSaved._id);

          //Actualizar total en inventario
          await Inventory.findOneAndUpdate(
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

              const recordDecrease = new InventoryRecord(decreaseParam);
              const recordDecreaseSaved = await recordDecrease.save();
              dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

              //Actualizar total en inventario
              await Inventory.findOneAndUpdate(
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
          const inventory = new Inventory(newProd);
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
          inventoryRecordParam.appliedWholesaleDiscount =
            item.appliedWholesaleDiscount;
          inventoryRecordParam.wholesaleDiscountDifferential =
            wholesaleDiscountDifferential; //  Diferencial por descuento al mayor
          inventoryRecordParam.totalDifferential = totalDifferential; //  Diferencial total
          inventoryRecordParam.isOffer = item.isOffer;
          inventoryRecordParam.isWholesale = item.isWholesale ? true : false; //  Si fue una venta al mayor (el condicional es provisional)
          inventoryRecordParam.type = enumOut.out.sale;

          const record = new InventoryRecord(inventoryRecordParam);
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

              const recordDecrease = new InventoryRecord(decreaseParam);
              const recordDecreaseSaved = await recordDecrease.save();
              dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

              //Actualizar total en inventario
              await Inventory.findOneAndUpdate(
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
      const hasCouponCode = salesParam.couponCode != null && String(salesParam.couponCode).trim() !== '';
      if (hasCouponCode && !salesParam.isWholesale && !salesParam.isCredit) {
        const normalized = normalizeCouponCode(salesParam.couponCode);
        if (!normalized) {
          throw "Cupón no válido";
        }
        const totalBeforeDiscount = parseFloat(salesParam.total);
        const updated = await PromoCoupon.findOneAndUpdate(
          { code: normalized, used: false },
          { $set: { used: true, usedAt: new Date() } }
        );
        if (!updated) {
          throw "Cupón ya utilizado o no válido";
        }
        salesParam.total = Math.round(totalBeforeDiscount * 0.9 * 100) / 100;
        salesParam.couponCode = normalized;
        salesParam.couponDiscount = Math.round(totalBeforeDiscount * 0.1 * 100) / 100;
        couponUseData = {
          couponCode: normalized,
          totalBeforeDiscount,
          totalAfterDiscount: salesParam.total,
          clientNames: salesParam.names || '',
          document: salesParam.document || '',
          phone: salesParam.phone || '',
          agency: salesParam.agency,
          user: salesParam.user
        };
      } else if (hasCouponCode && (salesParam.isWholesale || salesParam.isCredit)) {
        // Cupón no aplica a mayorista/crédito: ignorar el código y no aplicar descuento
        salesParam.couponCode = '';
        salesParam.couponDiscount = 0;
      }

      const sale = new Sales(salesParam);

      const saleSaved = await sale.save();

      dataToDelete.Sales = saleSaved._id;

      // Si se usó cupón, registrar en historial con order de la venta
      if (couponUseData) {
        await PromoCouponUse.create({
          couponCode: couponUseData.couponCode,
          saleOrder: saleSaved.order,
          saleFiscalOrder: null,
          clientNames: couponUseData.clientNames,
          document: couponUseData.document,
          phone: couponUseData.phone,
          totalBeforeDiscount: couponUseData.totalBeforeDiscount,
          discountPercent: 10,
          totalAfterDiscount: couponUseData.totalAfterDiscount,
          agency: couponUseData.agency,
          user: couponUseData.user
        });
      }

      //  Si es una venta al mayor, se almacena también en su base de datos respectiva
      if (salesParam.isWholesale) {
        if (!saleSaved) {
          throw "Error registrando la venta";
        }

        //  Se relacionan las bases de datos mediante el numero de orden
        salesParam.order = saleSaved.order;

        const wholesale = new Wholesales(salesParam);

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
            const client = await WholesaleClient.findOne({
              document: salesParam.document,
            });

            //si el cliente no esta registrado se guarda
            if (!client) {
              // Se inicializa el total gastado ajustado a dolares
              salesParam.totalSpent = salesParam.total / salesParam.valueDollar;
              const storeClient = new WholesaleClient(salesParam);
              const clientSaved = await storeClient.save();
              dataToDelete.WholesaleClient = clientSaved._id;
            } else {
              // Se modifica el total gastado ajustado a dolares
              client.totalSpent += salesParam.total / salesParam.valueDollar;
              const clientSaved = await client.save();
              dataToDelete.WholesaleClient = clientSaved._id;
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
          let lastRecord = await Box.findOne({
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

            const saleBox = new Box(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.Box.push(saleBoxSaved._id);
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

            const saleBox = new Box(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.Box.push(saleBoxSaved._id);
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

            const saleBox = new Box(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.Box.push(saleBoxSaved._id);
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

            const saleBox = new Box(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.Box.push(saleBoxSaved._id);
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

            if (coin === 1) boxData.valueDollar = salesParam.valueDollar;

            if (coin === 2) boxData.valueEur = salesParam.valueEur;

            if (coin === 3) boxData.valueCop = salesParam.valueCop;

            const saleBox = new Box(boxData);
            const saleBoxSaved = await saleBox.save();
            dataToDelete.Box.push(saleBoxSaved._id);
          }
        }

        //Eliminar ticket si es el caso
        if (salesParam.idTicket) {
          await Ticket.deleteOne({ _id: salesParam.idTicket });
        }
      }

      return saleSaved;
    } catch (error) {
      // Se eliminan todos los registros de inventario que se hayan creado, para de esta manera no descontrolar balance
      for (let recordID of dataToDelete.InventoryRecord) {
        // Se busca el record almacenado
        let item = await InventoryRecord.findByIdAndDelete(recordID);

        // Se obtiene el inventario modificado
        let inventory = await Inventory.findOne({
          product: item.product,
          agency: item.agency,
        }).populate("product");

        if (inventory) {
          // Se vuelve a sumar lo restado por los kg del producto
          let total = parseFloat(inventory.kg) + parseFloat(item.out);

          //Actualizar total en inventario
          await Inventory.findOneAndUpdate(
            { product: item.product, agency: item.agency },
            { kg: total }
          );
        }
      }

      // Se elimina el ticket que se haya registrado
      if (dataToDelete.Sales) {
        await Sales.findByIdAndDelete(dataToDelete.Sales);
      }

      // Se elimina el ticket al mayor que se haya registrado
      if (dataToDelete.Wholesales) {
        await Wholesales.findByIdAndDelete(dataToDelete.Wholesales);
      }

      // Se vuelve a eliminar el monto gastado por el usuario
      if (dataToDelete.WholesaleClient) {
        const client = await WholesaleClient.findOne({
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

    const sale = await Sales.findById(id);

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
    const sale = await Sales.findById(id);

    // Validar
    if (!sale) throw "venta no encontrada";

    return sale;
  },

  /**
   * Funcion para obtener todos las ventas
   */
  getAll: async () => {
    return await Sales.find().sort({ name: "asc" });
  },

  /**
   * Funcion para obtener las ventas con paginación y filtros
   *
   * Ventas generales
   */
  dataTable: async () => {
    //const sales = await Sales.find().populate('agency','name').sort({createdDate: -1});
    const sales = await Sales.aggregate([
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
  salesTable: async (salesParam) => {


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
                totalAmountDollar: {
                  $sum: {
                    $cond: [
                      { $gt: ["$valueDollar", 0] },
                      { $divide: ["$total", "$valueDollar"] },
                      0,
                    ],
                  },
                },
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
      if (salesParam.filters.company) {
        let regex = new RegExp(salesParam.filters.company, "gi");

        // Primero buscamos las agencias que coincidan con la compañía
        let agencies = await Agency.find({
          company: { $regex: regex }
        }).select('_id');

        // Extraemos los IDs de las agencias
        let agencyIds = agencies.map(agency => agency._id);

        if (agencyIds.length > 0) {
          stages.unshift({
            $match: { agency: { $in: agencyIds.map(id => ObjectId(id)) } }
          });
          stageTotal.unshift({
            $match: { agency: { $in: agencyIds.map(id => ObjectId(id)) } }
          });
        } else {
          // Si no hay agencias que coincidan, retornar resultados vacíos
          return {
            results: [],
            metadata: [],
            total: 0,
          };
        }
      }

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

      if (salesParam.filters.onlyProductCode) {

        let product = await Product.findOne({
          code: salesParam.filters.onlyProductCode,
        });

        if (!product) {
          return {
            results: [],
            metadata: [],
            total: 0,
          };
        }

        stages.unshift({
          $match: {
            products: {
              $size: 1,
            },
            "products.0.name": product.name,
          },
        });

        stageTotal.unshift({
          $match: {
            products: {
              $size: 1,
            },
            "products.0.name": product.name,
          },
        });
      }

      const stagesType = [];

      //Si hay filtro por DETAL
      if (salesParam.filters.retail) {
        stagesType.unshift({ type: { $eq: 1 } });
      }

      //Si hay filtro por DETAL con cupón (DETAL C)
      if (salesParam.filters.retailC) {
        stagesType.unshift({
          $and: [
            { type: { $eq: 1 } },
            { couponCode: { $exists: true, $nin: [null, ''] } },
          ],
        });
      }

      //Si hay filtro por DETAL FISCAL
      if (salesParam.filters.retailF) {
        stagesType.unshift({ type: { $eq: 5 } });
      }

      //Si hay filtro por DETAL FISCAL con cupón (DETAL F C)
      if (salesParam.filters.retailFC) {
        stagesType.unshift({
          $and: [
            { type: { $eq: 5 } },
            { couponCode: { $exists: true, $nin: [null, ''] } },
          ],
        });
      }

      //Si hay filtro por MAYOR
      if (salesParam.filters.wholesale) {
        stagesType.unshift({ type: { $eq: 2 } });
      }

      //Si hay filtro por MAYOR FISCAL
      if (salesParam.filters.wholesaleF) {
        stagesType.unshift({ type: { $eq: 6 } });
      }

      //Si hay filtro por ABONO
      if (salesParam.filters.sumation) {
        stagesType.unshift({ type: { $eq: 3 } });
      }

      //Si hay filtro por ABONO
      if (salesParam.filters.sumationF) {
        stagesType.unshift({ type: { $eq: 7 } });
      }

      //Si hay filtro por CRÉDITO
      if (salesParam.filters.credit) {
        stagesType.unshift({ type: { $eq: 4 } });
      }

      //Si hay filtro por CRÉDITO FISCAL
      if (salesParam.filters.creditF) {
        stagesType.unshift({ type: { $eq: 8 } });
      }

      if(salesParam.filters.valePend) {
        stagesType.unshift({ type: { $eq: 12 } });
      }

      if(salesParam.filters.valePag) {
        stagesType.unshift({ type: { $eq: 10 } });
      }

      if(salesParam.filters.abonVale) {
        stagesType.unshift({ type: { $eq: 11 } });
      }

      if (
        salesParam.filters.retail ||
        salesParam.filters.wholesale ||
        salesParam.filters.sumation ||
        salesParam.filters.credit ||
        salesParam.filters.retailF ||
        salesParam.filters.wholesaleF ||
        salesParam.filters.creditF ||
        salesParam.filters.sumationF ||
        salesParam.filters.valePend ||
        salesParam.filters.valePag ||
        salesParam.filters.abonVale ||
        salesParam.filters.retailC ||
        salesParam.filters.retailFC
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

    const sales = await Sales.aggregate(stages);

    let total = [];

    //Sumar total si las fechas se definieron o si es el día actual
    if (
      (salesParam.filters.startDate && salesParam.filters.endDate) ||
      (!salesParam.filters.startDate && !salesParam.filters.endDate)
    ) {
      //Total del resultado
      total = await Sales.aggregate(stageTotal);
    }

    return {
      results: !salesParam.isExcel ? sales[0].data : sales,
      metadata: !salesParam.isExcel ? sales[0].metadata : [],
      total: !salesParam.isExcel ? total : 0,
    };
  },

  /**
   * Funcion para obtener estadísticas de tickets por tipo para gráficas
   * 
   * Excluye ventas fiscales (tipos 5, 6, 7, 8)
   * Retorna cantidad, porcentaje y total en BS por tipo de ticket
   */
  salesTicketsChart: async (salesParam) => {
    console.log('salesParam', salesParam);
    // Construir los stages de filtros (reutilizando lógica de salesTable)
    const stages = [];

    // Excluir solo tipo 10 y tipo 12 desde el inicio
    // Los tipos fiscales (5, 6, 7, 8) se agruparán con sus equivalentes (1, 2, 3, 4)
    stages.push({
      $match: {
        type: { $nin: [10, 12] } // Excluir vale al mayor, credito vale
      }
    });

    //Si el rol es Cajero o Gerente, solo su sucursal
    if (
      salesParam.user.role == role.rol.Cashier ||
      salesParam.user.role == role.rol.Manager
    ) {
      stages.push({ $match: { agency: ObjectId(salesParam.user.agency) } });
    }

    // Variables para el filtro de las horas (si lo hay)
    let initialHour = [];
    let finalHour = [];

    //Filtros para la consulta
    if (salesParam.filters) {
      if (salesParam.filters.company) {
        let regex = new RegExp(salesParam.filters.company, "gi");

        // Primero buscamos las agencias que coincidan con la compañía
        let agencies = await Agency.find({
          company: { $regex: regex }
        }).select('_id');

        // Extraemos los IDs de las agencias
        let agencyIds = agencies.map(agency => agency._id);

        if (agencyIds.length > 0) {
          stages.push({
            $match: { agency: { $in: agencyIds.map(id => ObjectId(id)) } }
          });
        } else {
          // Si no hay agencias que coincidan, retornar resultados vacíos
          return [];
        }
      }

      //Si hay filtro de cajero
      if (salesParam.filters.cashier) {
        stages.push({
          $match: { user: ObjectId(salesParam.filters.cashier) },
        });
      }

      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.push({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      //Si hay filtro por numero de ticket
      if (salesParam.filters.ticket) {
        stages.push({
          $match: { order: { $eq: parseInt(salesParam.filters.ticket) } },
        });
      }

      //Si hay filtro por nombre
      if (salesParam.filters.names) {
        let regex = new RegExp(salesParam.filters.names, "gi");
        stages.push({ $match: { names: { $regex: regex } } });
      }

      //Si hay filtro por referencia
      if (salesParam.filters.reference) {
        let regex = new RegExp(salesParam.filters.reference, "gi");
        stages.push({
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
        let product = await Product.findOne({
          code: salesParam.filters.productCode,
        });

        if (!product) {
          return [];
        }

        stages.push({
          $match: { products: { $elemMatch: { name: product.name } } },
        });
      }

      if (salesParam.filters.onlyProductCode) {
        let product = await Product.findOne({
          code: salesParam.filters.onlyProductCode,
        });

        if (!product) {
          return [];
        }

        stages.push({
          $match: {
            products: {
              $size: 1,
            },
            "products.0.name": product.name,
          },
        });
      }

      const stagesType = [];

      //Si hay filtro por DETAL
      if (salesParam.filters.retail) {
        stagesType.push({ type: { $eq: 1 } });
      }

      //Si hay filtro por DETAL con cupón (DETAL C)
      if (salesParam.filters.retailC) {
        stagesType.push({
          $and: [
            { type: { $eq: 1 } },
            { couponCode: { $exists: true, $nin: [null, ''] } },
          ],
        });
      }

      //Si hay filtro por MAYOR
      if (salesParam.filters.wholesale) {
        stagesType.push({ type: { $eq: 2 } });
      }

      //Si hay filtro por ABONO
      if (salesParam.filters.sumation) {
        stagesType.push({ type: { $eq: 3 } });
      }

      //Si hay filtro por CRÉDITO
      if (salesParam.filters.credit) {
        stagesType.push({ type: { $eq: 4 } });
      }

      // Aplicar filtro de tipos solo si hay alguno seleccionado
      // Nota: No incluimos los fiscales porque ya los excluimos arriba
      if (stagesType.length > 0) {
        stages.push({ $match: { $or: stagesType } });
      }

      //Si hay filtro por telesale
      if (salesParam.filters.telesale) {
        stages.push({ $match: { isTelesale: { $eq: true } } });
      }

      // Si hay filtro de horas
      if (salesParam.filters.initialHour || salesParam.filters.finalHour) {
        if (salesParam.filters.initialHour) {
          initialHour = salesParam.filters.initialHour
            .split(":")
            .map((item) => {
              return item.trim();
            });

          if (!initialHour[1]) {
            initialHour.push("0");
          }
        }

        if (salesParam.filters.finalHour) {
          finalHour = salesParam.filters.finalHour.split(":").map((item) => {
            return item.trim();
          });

          if (!finalHour[1]) {
            finalHour.push("0");
          }
        }
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stages.push({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.push({
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

        stages.push({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }

      // Duplicado de fecha - mantener por compatibilidad
      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stages.push({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    //Si todos los filtros son vacios se consulta la fecha actual
    if (
      !salesParam.filters ||
      (!salesParam.filters.cashier &&
        !salesParam.filters.ticket &&
        !salesParam.filters.reference &&
        !salesParam.filters.names &&
        !salesParam.filters.startDate &&
        !salesParam.filters.endDate)
    ) {
      const startDate = salesParam.filters?.initialHour
        ? moment()
          .utc()
          .set("hour", initialHour[0])
          .set("minute", initialHour[1])
        : moment().utc().subtract(4, "hours").startOf("day");

      const endDate = salesParam.filters?.finalHour
        ? moment().utc().set("hour", finalHour[0]).set("minute", finalHour[1])
        : moment().utc().subtract(4, "hours").endOf("day");

      stages.push({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    // Stages para obtener tipos (sin agencias dentro)
    const stagesTypes = [...stages];
    stagesTypes.push(
      {
        // Mapear tipos fiscales a sus equivalentes no fiscales antes de agrupar
        // Y convertir cada venta a dólares usando su propia tasa
        $addFields: {
          normalizedType: {
            $switch: {
              branches: [
                { case: { $eq: ["$type", 5] }, then: 1 },  // retailF -> retail
                { case: { $eq: ["$type", 6] }, then: 2 },  // wholesaleF -> wholesale
                { case: { $eq: ["$type", 7] }, then: 3 },  // sumationF -> sumation
                { case: { $eq: ["$type", 8] }, then: 4 }   // creditF -> credit
              ],
              default: "$type" // Mantener el tipo original si no es fiscal
            }
          },
          // Convertir cada venta a dólares usando su propia tasa valueDollar
          totalDollar: {
            $cond: [
              { $and: [{ $gt: ["$valueDollar", 0] }, { $gt: ["$total", 0] }] },
              { $divide: ["$total", "$valueDollar"] },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: "$normalizedType",
          count: { $sum: 1 },
          totalBs: { $sum: "$total" }, // Suma del total en bolívares por tipo
          totalDollar: { $sum: "$totalDollar" } // Suma directa de dólares (venta por venta)
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: "$count" },
          types: {
            $push: {
              type: "$_id",
              count: "$count",
              totalBs: "$totalBs",
              totalDollar: "$totalDollar"
            }
          }
        }
      },
      {
        $unwind: "$types"
      },
      {
        $project: {
          _id: 0,
          type: "$types.type",
          count: "$types.count",
          totalBs: "$types.totalBs",
          totalDollar: "$types.totalDollar",
          averagePerTicket: {
            $cond: [
              { $gt: ["$types.count", 0] },
              { $divide: ["$types.totalBs", "$types.count"] },
              0
            ]
          },
          averagePerTicketDollar: {
            $cond: [
              { $gt: ["$types.count", 0] },
              { $divide: ["$types.totalDollar", "$types.count"] },
              0
            ]
          },
          percentage: {
            $multiply: [
              { $divide: ["$types.count", "$totalTickets"] },
              100
            ]
          }
        }
      },
      {
        $sort: { type: 1 }
      }
    );

    // Stages para obtener conteo de tickets por intervalos horarios y tipo
    // Intervalos: 7-12, 12-17, 17-22
    // IMPORTANTE: aquí usamos la misma referencia horaria que los filtros por hora
    // en otras funciones, es decir, la hora directa de createdDate (UTC en tu BD),
    // para que si filtras 7-12 en "tickets registrados" veas los mismos conteos.
    const stagesIntervals = [...stages];
    stagesIntervals.push(
      {
        $addFields: {
          normalizedType: {
            $switch: {
              branches: [
                { case: { $eq: ["$type", 5] }, then: 1 },
                { case: { $eq: ["$type", 6] }, then: 2 },
                { case: { $eq: ["$type", 7] }, then: 3 },
                { case: { $eq: ["$type", 8] }, then: 4 }
              ],
              default: "$type"
            }
          },
          // Hora "cruda" de createdDate (misma base que usan los filtros por hora)
          hourLocal: { $hour: "$createdDate" }
        }
      },
      {
        $addFields: {
          timeRange: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gte: ["$hourLocal", 7] },
                      { $lt: ["$hourLocal", 12] }
                    ]
                  },
                  then: "7-12"
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$hourLocal", 12] },
                      { $lt: ["$hourLocal", 17] }
                    ]
                  },
                  then: "12-17"
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$hourLocal", 17] },
                      { $lt: ["$hourLocal", 22] }
                    ]
                  },
                  then: "17-22"
                }
              ],
              // Ventas fuera de estos rangos no se consideran
              default: null
            }
          }
        }
      },
      {
        $match: {
          timeRange: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            type: "$normalizedType",
            timeRange: "$timeRange"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.type",
          intervals: {
            $push: {
              timeRange: "$_id.timeRange",
              count: "$count"
            }
          },
          totalByType: { $sum: "$count" }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          intervals: 1,
          totalByType: 1
        }
      },
      {
        $sort: { type: 1 }
      }
    );

    // Stages para obtener totales por día y tipo de venta
    const stagesDaily = [...stages];
    stagesDaily.push(
      {
        $addFields: {
          normalizedType: {
            $switch: {
              branches: [
                { case: { $eq: ["$type", 5] }, then: 1 },  // retailF -> retail
                { case: { $eq: ["$type", 6] }, then: 2 },  // wholesaleF -> wholesale
                { case: { $eq: ["$type", 7] }, then: 3 },  // sumationF -> sumation
                { case: { $eq: ["$type", 8] }, then: 4 }   // creditF -> credit
              ],
              default: "$type"
            }
          },
          totalDollar: {
            $cond: [
              { $and: [{ $gt: ["$valueDollar", 0] }, { $gt: ["$total", 0] }] },
              { $divide: ["$total", "$valueDollar"] },
              0
            ]
          },
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdDate"
            }
          }
        }
      },
      {
        $group: {
          _id: {
            day: "$day",
            type: "$normalizedType"
          },
          count: { $sum: 1 },
          totalBs: { $sum: "$total" },
          totalDollar: { $sum: "$totalDollar" }
        }
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          type: "$_id.type",
          count: 1,
          totalBs: 1,
          totalDollar: 1
        }
      },
      {
        $sort: { day: 1, type: 1 }
      }
    );

    // Ya no necesitamos calcular tasa promedio porque convertimos venta por venta

    // Stages para obtener agencia (una sola porque se filtra por una)
    const stagesAgency = [...stages];
    stagesAgency.push(
      {
        // Convertir cada venta a dólares usando su propia tasa
        $addFields: {
          totalDollar: {
            $cond: [
              { $and: [{ $gt: ["$valueDollar", 0] }, { $gt: ["$total", 0] }] },
              { $divide: ["$total", "$valueDollar"] },
              0
            ]
          }
        }
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
        $unwind: "$agency"
      },
      {
        $group: {
          _id: "$agency._id",
          agencyName: { $first: "$agency.name" },
          company: { $first: "$agency.company" },
          count: { $sum: 1 },
          totalBs: { $sum: "$total" },
          totalDollar: { $sum: "$totalDollar" } // Suma directa de dólares (venta por venta)
        }
      },
      {
        $project: {
          _id: 0,
          agencyId: "$_id",
          agencyName: 1,
          company: 1,
          count: 1,
          totalBs: 1,
          totalDollar: 1,
          averagePerTicket: {
            $cond: [
              { $gt: ["$count", 0] },
              { $divide: ["$totalBs", "$count"] },
              0
            ]
          },
          averagePerTicketDollar: {
            $cond: [
              { $gt: ["$count", 0] },
              { $divide: ["$totalDollar", "$count"] },
              0
            ]
          }
        }
      },
      {
        $limit: 1
      }
    );

    // Obtener la fecha de consulta para buscar weeklyTicketGoal histórico
    let queryDate = moment().utc().subtract(4, "hours").toDate();
    if (salesParam.filters && salesParam.filters.startDate) {
      queryDate = moment(salesParam.filters.startDate).utc().toDate();
    } else if (salesParam.filters && salesParam.filters.endDate) {
      queryDate = moment(salesParam.filters.endDate).utc().toDate();
    }

    // Stages para obtener sellers únicos con sus weeklyTicketGoal según la fecha
    const stagesSellers = [...stages];
    stagesSellers.push(
      {
        $lookup: {
          from: "sellers",
          localField: "seller",
          foreignField: "_id",
          as: "sellerInfo",
        },
      },
      {
        $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $match: {
          sellerInfo: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$sellerInfo._id",
          sellerId: { $first: "$sellerInfo._id" },
          sellerName: { $first: { $concat: ["$sellerInfo.firstName", " ", { $ifNull: ["$sellerInfo.lastName", ""] }] } }
        }
      }
    );

    // Ejecutar agregaciones en paralelo
    const [typesResults, agencyResults, intervalsResults, dailyResults, sellersResults] = await Promise.all([
      Sales.aggregate(stagesTypes),
      Sales.aggregate(stagesAgency),
      Sales.aggregate(stagesIntervals),
      Sales.aggregate(stagesDaily),
      Sales.aggregate(stagesSellers)
    ]);

    // Obtener weeklyTicketGoal para cada seller según la fecha
    let sellersWithGoals = await Promise.all(
      (sellersResults || []).map(async (sellerItem) => {
        try {
          const goalData = await userService.getSellerWeeklyGoalForDate(
            sellerItem.sellerId.toString(),
            queryDate
          );
          return {
            sellerId: sellerItem.sellerId,
            sellerName: sellerItem.sellerName,
            weeklyTicketGoal: goalData.weeklyTicketGoal || 0,
            weeklyGoal: goalData.weeklyGoal || 0,
            weeklyGoalMinimumPercentageOfSales: goalData.weeklyGoalMinimumPercentageOfSales || 0
          };
        } catch (error) {
          console.error(`Error obteniendo meta para seller ${sellerItem.sellerId}:`, error);
          return {
            sellerId: sellerItem.sellerId,
            sellerName: sellerItem.sellerName,
            weeklyTicketGoal: 0,
            weeklyGoal: 0,
            weeklyGoalMinimumPercentageOfSales: 0
          };
        }
      })
    );

    try {
      const agChartId =
        salesParam.filters?.agency || salesParam.user?.agency;
      if (agChartId) {
        const agDoc = await Agency.findById(ObjectId(agChartId))
          .select("weeklyTicketGoal")
          .lean();
        const agTicket = Number(agDoc?.weeklyTicketGoal) || 0;
        if (agTicket > 0 && sellersWithGoals.length > 0) {
          sellersWithGoals = sellersWithGoals.map((s) => ({
            ...s,
            weeklyTicketGoal: agTicket,
          }));
        }
      }
    } catch (e) {
      /* ignorar */
    }

    // Si no hay resultados, retornar estructura vacía
    if (typesResults.length === 0) {
      return {
        types: [],
        agency: null,
        sellers: sellersWithGoals
      };
    }

    // Mapear los tipos a sus descripciones
    // Los totales en dólares ya están calculados venta por venta
    const salesEnum = require('../enums/sales.enum');
    const intervalsByType = (intervalsResults || []).reduce((acc, item) => {
      acc[item.type] = item.intervals || [];
      return acc;
    }, {});

    const types = typesResults.map(item => {
      const totalBs = item.totalBs || 0;
      const totalDollar = item.totalDollar || 0;
      const averagePerTicket = item.averagePerTicket || 0;
      const averagePerTicketDollar = item.averagePerTicketDollar || 0;

      const intervalsRaw = intervalsByType[item.type] || [];
      const getIntervalCount = (range) => {
        const found = intervalsRaw.find(i => i.timeRange === range);
        return found ? found.count : 0;
      };

      return {
        type: item.type,
        typeName: salesEnum.descriptionType[item.type] || `Tipo ${item.type}`,
        count: item.count,
        totalBs: parseFloat(totalBs.toFixed(2)),
        averagePerTicket: parseFloat(averagePerTicket.toFixed(2)),
        totalDollar: parseFloat(totalDollar.toFixed(2)),
        averagePerTicketDollar: parseFloat(averagePerTicketDollar.toFixed(2)),
        percentage: parseFloat(item.percentage.toFixed(2)),
        // Nuevos datos: intervalos horarios por tipo como keys planas para el frontend
        count7_12: getIntervalCount("7-12"),
        count12_17: getIntervalCount("12-17"),
        count17_22: getIntervalCount("17-22"),
      };
    });

    // Mapear data diaria por tipo
    const dailyByType = (dailyResults || []).map(item => {
      const totalBs = item.totalBs || 0;
      const totalDollar = item.totalDollar || 0;
      const count = item.count || 0;

      const averagePerTicket = count > 0 ? totalBs / count : 0;
      const averagePerTicketDollar = count > 0 ? totalDollar / count : 0;

      return {
        day: item.day,
        type: item.type,
        typeName: salesEnum.descriptionType[item.type] || `Tipo ${item.type}`,
        count: count,
        totalBs: parseFloat(totalBs.toFixed(2)),
        totalDollar: parseFloat(totalDollar.toFixed(2)),
        averagePerTicket: parseFloat(averagePerTicket.toFixed(2)),
        averagePerTicketDollar: parseFloat(averagePerTicketDollar.toFixed(2)),
      };
    });

    // Mapear la agencia (solo una)
    // Los totales en dólares ya están calculados venta por venta
    const agency = agencyResults.length > 0 ? (() => {
      const totalBs = agencyResults[0].totalBs || 0;
      const totalDollar = agencyResults[0].totalDollar || 0;
      const averagePerTicket = agencyResults[0].averagePerTicket || 0;
      const averagePerTicketDollar = agencyResults[0].averagePerTicketDollar || 0;

      return {
        agencyId: agencyResults[0].agencyId,
        agencyName: agencyResults[0].agencyName,
        company: agencyResults[0].company,
        count: agencyResults[0].count,
        totalBs: parseFloat(totalBs.toFixed(2)),
        averagePerTicket: parseFloat(averagePerTicket.toFixed(2)),
        totalDollar: parseFloat(totalDollar.toFixed(2)),
        averagePerTicketDollar: parseFloat(averagePerTicketDollar.toFixed(2))
      };
    })() : null;

    return {
      types: types,
      agency: agency,
      dailyByType: dailyByType,
      sellers: sellersWithGoals
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

    const sales = await Sales.aggregate([
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

    const box = await BoxClose.find({
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

  //reporte de formas de pago
  reportPaymentMethods: async (salesParam) => {

    // resultados por página
    const pageSize = salesParam.pageSize;
    // Página: el page index de react-table-component
    const pageIndex = salesParam.pageIndex;

    //orden por defecto
    var sortBy = { "_id.createdDate": -1 };

    //Si esta el parametro se crea el objeto para ordenar adecuadamente
    if (salesParam.sortBy) {
      let direction = salesParam.sortBy.desc == true ? -1 : 1;

      if (salesParam.sortBy.id == "date") {
        sortBy = { "_id.createdDate": direction };
      } else {
        sortBy = { [salesParam.sortBy.id]: direction };
      }
    }

    let stages = [
      {
        $group: {
          _id: {
            agency: "$agency",
            createdDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdDate" },
            },
          },
          totalAmount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $type: "$isCredit" }, "missing"] },
                    { $eq: ["$isCredit", false] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },
          totalSell: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $eq: [{ $type: "$isCredit" }, "missing"] },
                        { $eq: ["$isCredit", false] },
                      ],
                    },
                    {
                      $or: [
                        { $eq: [{ $type: "$isSumation" }, "missing"] },
                        { $eq: ["$isSumation", false] },
                      ],
                    },
                  ],
                },
                "$total",
                0,
              ],
            },
          },
          //totalSell: { $sum: { $cond: [{ $eq: ["$type", enumOut.out.sale] }, "$out", 0] } },
          //totalAmountNoSumation: { $sum: { $cond: [ {$and: [{ $eq : ["$isCredit", false]}, { $eq : ["$isSumation", false]} ]}, "$total" , 0] }},
          totalVes: { $sum: "$ves" },
          totalDollar: { $sum: "$dollar" },
          totalEur: { $sum: "$eur" },
          totalCop: { $sum: "$cop" },
          totalTransfer: { $sum: "$tAmmount" },
          totalTransferMohan2025: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$tBank", "MOHAN 2025"] },
                        { $eq: ["$tBank", "Principal"] },
                      ],
                    },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferMohan2025B: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$tBank", "MOHAN 2025 B"] },
                        { $eq: ["$tBank", "Principal B"] },
                      ],
                    },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferEmbutidosMohan: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "EMBUTIDOS MOHAN"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferEmbutidosMohanB: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "EMBUTIDOS MOHAN B"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferDanielPersonal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "DANIEL PERSONAL"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferDelicatesesMomoy: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "DELICATESES MOMOY"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferDelicatesesEnmanuel: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "DELICATESES ENMANUEL"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferMercantilPersonal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "MERCANTIL PERSONAL"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            },
          },
          totalTransferEmbutidosFattoria: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tBank", "FATTORIA BICENTENARIO"] },
                    { $gt: ["$tAmmount", 0] },
                  ],
                },
                "$tAmmount",
                0,
              ],
            }
          },

          //Suma de punto extra y punto normal
          totalPos: {
            $sum: {
              $add: [
                { $ifNull: ["$pAmmount", 0] },
                { $ifNull: ["$pAmmountExtra", 0] },
              ],
            },
          },
          totalPosApply: {
            $sum: {
              $add: [
                {
                  $cond: [
                    { $eq: ["$terminalApply", true] },
                    { $ifNull: ["$pAmmount", 0] },
                    0,
                  ],
                },
                {
                  $cond: [
                    { $eq: ["$terminalExtraApply", true] },
                    { $ifNull: ["$pAmmountExtra", 0] },
                    0,
                  ],
                },
              ],
            },
          },
          totalPosNotApply: {
            $sum: {
              $add: [
                {
                  $cond: [
                    { $eq: ["$terminalApply", false] },
                    { $ifNull: ["$pAmmount", 0] },
                    0,
                  ],
                },
                {
                  $cond: [
                    { $eq: ["$terminalExtraApply", false] },
                    { $ifNull: ["$pAmmountExtra", 0] },
                    0,
                  ],
                },
              ],
            },
          },

          //totalPosApply: { $sum: { $cond: [ { $and : [ { $eq : ["$terminalApply", true] }, { $gt : ["$pAmmount", 0] } ]}, "$pAmmount" , 0] } },
          //totalPosExtraApply: { $sum: { $cond: [ { $and : [ { $eq : ["$terminalApply", true] }, { $gt : ["$pAmmountExtra", 0] } ]}, "$pAmmountExtra" , 0] } },
          //Totales en bolivares
          totalDollarVes: { $sum: { $multiply: ["$dollar", "$valueDollar"] } },
          totalEurVes: { $sum: { $multiply: ["$eur", "$valueEur"] } },
          totalCopVes: { $sum: { $divide: ["$cop", "$valueCop"] } },
          //total en creditos
          totalCredit: {
            $sum: { $cond: [{ $eq: ["$isCredit", true] }, "$total", 0] },
          },
          totalSumation: {
            $sum: { $cond: [{ $eq: ["$isSumation", true] }, "$total", 0] },
          },
          totalCouponDiscount: { $sum: { $ifNull: ["$couponDiscount", 0] } },
          valueDollar: { $last: "$valueDollar" },
          valueEur: { $last: "$valueEur" },
          valueCop: { $last: "$valueCop" },
          date: { $first: "$createdDate" },
          agency: { $first: "$agency" },
        },
      },
      { $sort: sortBy },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
    ];

    //Si no es excel paginar normalmente
    //Añade facet al final del array
    if (!salesParam.isExcel) {
      if (salesParam.filters.mixData) {
        stages.push({
          $facet: { metadata: [{ $count: "total" }], data: [{ $skip: 0 }] },
        });
      } else {
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
    }

    //stage del total
    let stageTotal = [
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: { $cond: [{ $eq: ["$isSumation", false] }, "$total", 0] },
          },
        },
      },
    ];

    //Si es admin o supervisor ve todos las sucursales

    //Si el rol es Gerente, solo su sucursal
    if (salesParam.user.role == role.rol.Manager) {
      stages.unshift({ $match: { agency: ObjectId(salesParam.user.agency) } });
      stageTotal.unshift({
        $match: { agency: ObjectId(salesParam.user.agency) },
      });
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
        stageTotal.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
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

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
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

    const sales = await Sales.aggregate(stages);

    let total = [];

    if (!salesParam.isExcel) {
      //Sumar total si las fechas se definieron o si es el día actual
      if (
        (salesParam.filters.startDate && salesParam.filters.endDate) ||
        (!salesParam.filters.startDate && !salesParam.filters.endDate)
      ) {
        //Total del resultado
        total = await Sales.aggregate(stageTotal);
      }
    }

    /****************************************** */

    //  Dado que se hizo la sumatoria de las ventas diarias, se debe restar las salidas de caja debidas a los vueltos que se dieron

    //  Se realiza la busqueda de los Cambios dados
    //  Esta informacion está en la base de datos de la caja

    let stagesBox = [
      { $sort: { createdDate: 1 } },
      {
        $group: {
          _id: {
            agency: "$agency",
            createdDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdDate" },
            },
          },
          totalOutBs: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$coin", 1] },
                    { $eq: ["$typeDescription", "Cambio"] },
                  ],
                },
                "$out",
                0,
              ],
            },
          },
          totalOutDollar: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$coin", 2] },
                    { $eq: ["$typeDescription", "Cambio"] },
                  ],
                },
                "$out",
                0,
              ],
            },
          },
          totalOutEur: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$coin", 3] },
                    { $eq: ["$typeDescription", "Cambio"] },
                  ],
                },
                "$out",
                0,
              ],
            },
          },
          totalOutCop: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$coin", 4] },
                    { $eq: ["$typeDescription", "Cambio"] },
                  ],
                },
                "$out",
                0,
              ],
            },
          },
          date: { $last: "$createdDate" },
          agency: { $last: "$agency" },
        },
      },
      { $sort: sortBy },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
    ];

    /*  En la busqueda de los cambios, no se va a tomar en cuenta la paginacion para evitar errores de discrepancia entre los 10 datos buscados en las 
            ventas con los 10 datos que se busquen en la caja */

    if (!salesParam.isExcel) {
      stagesBox.push({
        $facet: { metadata: [{ $count: "total" }], data: [{ $skip: 0 }] },
      });
    }

    //Si es admin o supervisor ve todos las sucursales

    //Si el rol es Gerente, solo su sucursal
    if (salesParam.user.role == role.rol.Manager) {
      stagesBox.unshift({
        $match: { agency: ObjectId(salesParam.user.agency) },
      });
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stagesBox.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stagesBox.unshift({
          $match: { createdDate: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesBox.unshift({
          $match: { createdDate: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesBox.unshift({
          $match: {
            createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().startOf("day");
      const endDate = moment().endOf("day");
      stagesBox.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const box = await Box.aggregate(stagesBox); //  Resultado de las salidas de caja

    // El arreglo final va a cambiar dependiendo si se va a exportar a excel
    let salesArray = [];
    let boxArray = [];

    if (salesParam.isExcel) {
      salesArray = sales;
      boxArray = box;
    } else {
      salesArray = sales[0].data;
      boxArray = box[0].data;
    }

    //  Se actualiza el valor de las monedas, restando el valor de las salidas mediante vuelto
    if (JSON.stringify(boxArray) !== "[]") {
      //    Si ha habido algun vuelto de caja

      salesArray.map((sale) => {
        let correspondingData = boxArray.find(
          (
            item //  Se busca el dato de caja que corresponda con el dia y la agencia
          ) =>
            item.agency._id.toString() == sale.agency._id.toString() &&
            item.date.toDateString() == sale.date.toDateString()
        );

        //  Se obtiene el total de bolivares en caja

        sale.totalAmountBox =
          sale.totalVes +
          sale.totalTransfer +
          sale.totalPos +
          sale.totalDollarVes +
          sale.totalEurVes +
          sale.totalCopVes;

        //  Se actualizan los valores teniendo en cuenta el dia y la agencia

        if (correspondingData) {
          //  Para mostrar en las formas de pago
          sale.totalVes -= correspondingData.totalOutBs;
          sale.totalDollar -= correspondingData.totalOutDollar;
          sale.totalEur -= correspondingData.totalOutEur;
          sale.totalCop -= correspondingData.totalOutCop;

          //  Para actualizar el total de bolivares en caja
          sale.totalAmountBox -= correspondingData.totalOutBs;
          sale.totalAmountBox -=
            correspondingData.totalOutDollar * sale.valueDollar;
          sale.totalAmountBox -= correspondingData.totalOutEur * sale.valueEur;
          sale.totalAmountBox -= correspondingData.totalOutCop / sale.valueCop;
        }
      });
    } else {
      salesArray.map((sale) => {
        //  Se obtiene el total de bolivares en caja
        sale.totalAmountBox =
          sale.totalVes +
          sale.totalTransfer +
          sale.totalPos +
          sale.totalDollarVes +
          sale.totalEurVes +
          sale.totalCopVes;
      });
    }

    //Si en un dia ha habido pagos de créditos creados ese mismo dia, se resta al total en caja por créditos
    let creditStages = {};

    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        creditStages.agency = new ObjectId(salesParam.filters.agency);
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");

        creditStages.createdDate = { $gte: new Date(startDate) };
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");

        creditStages.createdDate = { $lte: new Date(endDate) };
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");

        creditStages.createdDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");

      creditStages.createdDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const result = await PendingPayments.find(creditStages);

    // Si hubo pagos pendientes en las fechas fijadas en el filtro
    if (JSON.stringify(result) !== "[]") {
      //

      salesArray.map((sale) => {
        let correspondingData = result.filter(
          (
            item //  Se busca los pagos pendientes que correspondan con el dia y la agencia
          ) =>
            item.agency.toString() == sale.agency._id.toString() &&
            item.createdDate.toDateString() == sale.date.toDateString()
        );

        if (JSON.stringify(correspondingData) !== "[]") {
          correspondingData.forEach((pendingPayment) => {
            //Si hay pagos
            if (pendingPayment.payments.length !== 0) {
              pendingPayment.payments.forEach((payment) => {
                if (
                  moment(payment.createdDate).dayOfYear() ==
                  moment(sale.date).dayOfYear()
                ) {
                  sale.totalCredit -= payment.total * sale.valueDollar;
                }
              });
            }
          });
        }
      });
    }

    // Si se piden los datos mezclados
    let array = salesArray;

    if (salesParam.filters.mixData) {
      for (let item of array) {
        let agency = item.agency._id.toString();
        let flag = false;
        let index = 0;

        for (let item1 of array) {
          // Se almacenan todos los acumulados en el primer elemento y el resto se elimina
          if (item1.agency._id.toString() === agency && flag == false) {
            flag = true;
            index = array.indexOf(item1);
          } else if (item1.agency._id.toString() === agency) {
            array[index].totalAmount += item1.totalAmount;
            array[index].totalSell += item1.totalSell;
            array[index].totalVes += item1.totalVes;
            array[index].totalDollar += item1.totalDollar;
            array[index].totalEur += item1.totalEur;
            array[index].totalCop += item1.totalCop;
            array[index].totalTransfer += item1.totalTransfer;
            array[index].totalPos += item1.totalPos;
            array[index].totalCredit += item1.totalCredit;
            array[index].totalSumation += item1.totalSumation;
            array[index].totalAmountBox += item1.totalAmountBox;

            // Valores no utilizados pero que se incluyen igual por si acaao
            array[index].totalDollarVes += item1.totalDollarVes;
            array[index].totalEurVes += item1.totalEurVes;
            array[index].totalCopVes += item1.totalCopVes;

            // Se eliminan los extras para que solo quede uno por tienda
            let indexToDelete = array.indexOf(item1);
            array.splice(indexToDelete, 1);
          }
        }
      }
      // NOTA: El código se repite para solucionar algunos problemas ocasionados (Se recomienda refactorizar el código)
      for (let item of array) {
        let agency = item.agency._id.toString();
        let flag = false;
        let index = 0;

        for (let item1 of array) {
          // Se almacenan todos los acumulados en el primer elemento y el resto se elimina
          if (item1.agency._id.toString() === agency && flag == false) {
            flag = true;
            index = array.indexOf(item1);
          } else if (item1.agency._id.toString() === agency) {
            array[index].totalAmount += item1.totalAmount;
            array[index].totalSell += item1.totalSell;
            array[index].totalVes += item1.totalVes;
            array[index].totalDollar += item1.totalDollar;
            array[index].totalEur += item1.totalEur;
            array[index].totalCop += item1.totalCop;
            array[index].totalTransfer += item1.totalTransfer;
            array[index].totalPos += item1.totalPos;
            array[index].totalCredit += item1.totalCredit;
            array[index].totalSumation += item1.totalSumation;
            array[index].totalAmountBox += item1.totalAmountBox;

            // Valores no utilizados pero que se incluyen igual por si acaao
            array[index].totalDollarVes += item1.totalDollarVes;
            array[index].totalEurVes += item1.totalEurVes;
            array[index].totalCopVes += item1.totalCopVes;

            // Se eliminan los extras para que solo quede uno por tienda
            let indexToDelete = array.indexOf(item1);
            array.splice(indexToDelete, 1);
          }
        }
      }
    }

    if (!salesParam.isExcel && salesParam.filters.mixData) {
      sales[0].metadata[0].total = salesArray.length;
    }

    return {
      results: !salesParam.isExcel ? sales[0].data : sales,
      metadata: !salesParam.isExcel ? sales[0].metadata : [],
      total,
    };
  },

  reportPaymentMethodsClose: async (salesParam) => {
    // Inicialmente se busca si ya hubo un reporte de esa tienda para ese dia

    const startDay = moment(salesParam.date).startOf("day");
    const endDay = moment(salesParam.date).endOf("day");

    const existentPaymentMethodsRecord = await PaymentMethodsRecord.findOne({
      agency: ObjectId(salesParam.agency),
      date: { $gte: new Date(startDay), $lte: new Date(endDay) },
    });

    if (existentPaymentMethodsRecord) {
      // No se pueden modificar reportes dias después de haberlo subido

      let actualDate = moment().utc().subtract(4, "hours");

      let reportDay = moment(salesParam.date).utc();

      if (!moment(actualDate).isSame(reportDay, "day")) {
        throw "Ya hay un registro de ese día";
      }
    }

    // Se eliminan las comas
    if (salesParam.ves !== "") {
      salesParam.ves = parseFloat(salesParam.ves.toString().replace(/,/g, ""));
    }
    if (salesParam.dollar !== "") {
      salesParam.dollar = parseFloat(
        salesParam.dollar.toString().replace(/,/g, "")
      );
    }
    if (salesParam.eur !== "") {
      salesParam.eur = parseFloat(salesParam.eur.toString().replace(/,/g, ""));
    }
    if (salesParam.cop !== "") {
      salesParam.cop = parseFloat(salesParam.cop.toString().replace(/,/g, ""));
    }

    salesParam.terminalAmmounts.forEach((item) => {
      item.debit = parseFloat(item.debit.toString().replace(/,/g, ""));
      item.credit = parseFloat(item.credit.toString().replace(/,/g, ""));
    });

    // Se procede a rellenar todos los datos pertinentes para hacer el cierre del dia

    //*** Se obtiene el valor de cada moneda
    salesParam.valueDollar = salesParam.virtualValues.valueDollar;
    salesParam.valueEur = salesParam.virtualValues.valueEur;
    salesParam.valueCop = salesParam.virtualValues.valueCop;

    //*** Se obtiene el total de clientes del dia

    const startDate = moment(salesParam.date).utc().startOf("day");
    const endDate = moment(salesParam.date).utc().endOf("day");

    const stages = [
      {
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $match: { agency: ObjectId(salesParam.agency) } },
      { $count: "totalClients" },
    ];

    const sales = await Sales.aggregate(stages);

    salesParam.totalClients = sales[0].totalClients; // Total de tickets del dia

    //*** Se obtiene el total por operador

    let stagesOperators = [
      {
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $match: { isSumation: false } },
      { $match: { agency: ObjectId(salesParam.agency) } },
      {
        $group: {
          _id: "$operator",

          // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },
          // Total de clientes atendidos
          totalClients: { $sum: 1 },

          // Total de ventas al mayor
          totalWholesales: {
            $sum: { $cond: [{ $eq: ["$isWholesale", true] }, "$total", 0] },
          },
          // Total de clientes al mayor
          totalWholesaleClients: {
            $sum: { $cond: [{ $eq: ["$isWholesale", true] }, 1, 0] },
          },

          // Total de ventas al detal
          totalRetail: {
            $sum: { $cond: [{ $eq: ["$isWholesale", false] }, "$total", 0] },
          },
          // Total de clientes al detal
          totalRetailClients: {
            $sum: { $cond: [{ $eq: ["$isWholesale", false] }, 1, 0] },
          },

          agency: { $last: "$agency" },
          operator: { $last: "$operator" },
        },
      },

      { $sort: { createdDate: -1 } },
    ];

    salesParam.operatorsAmmount = await Sales.aggregate(stagesOperators);

    //*** Se obtiene el total por cajero

    let stagesCashier = [
      {
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $match: { agency: ObjectId(salesParam.agency) } },
      {
        $group: {
          _id: "$user",

          // Total de ingresos en bs (DETAL, MAYOR y ABONOS)
          total: { $sum: "$total" },
          // Total de clientes atendidos
          totalClients: { $sum: 1 },

          // Total de ventas al mayor
          totalWholesales: {
            $sum: { $cond: [{ $eq: ["$isWholesale", true] }, "$total", 0] },
          },
          // Total de clientes al mayor
          totalWholesaleClients: {
            $sum: { $cond: [{ $eq: ["$isWholesale", true] }, 1, 0] },
          },

          // Total de ventas al detal
          totalRetail: {
            $sum: { $cond: [{ $eq: ["$isWholesale", false] }, "$total", 0] },
          },
          // Total de clientes al detal
          totalRetailClients: {
            $sum: { $cond: [{ $eq: ["$isWholesale", false] }, 1, 0] },
          },

          firstSale: { $first: "$createdDate" }, // Primera venta del cajero
          lastSale: { $last: "$createdDate" }, // Última venta del cajero

          agency: { $last: "$agency" },
          user: { $last: "$user" },
        },
      },

      { $sort: { createdDate: -1 } },
    ];

    salesParam.cashiersAmmount = await Sales.aggregate(stagesCashier);

    // Se obtiene el tiempo que tarda cada cajero en atender a un nuevo cliente
    salesParam.cashiersAmmount.forEach((item) => {
      item.clientTime =
        (item.lastSale - item.firstSale) / 1000 / 60 / item.totalClients;
    });

    //*** Se calcula el total de cada punto, el completo de todos los puntos y el total por transferencia

    salesParam.pAmmount = 0;

    salesParam.terminalAmmounts.forEach((item) => {
      item.total = item.debit + item.credit;
      salesParam.pAmmount += item.total;
    });

    salesParam.tAmmount = salesParam.virtualValues.totalTransfer; // Monto total por transferencias obtenido de las virtuales

    //*** Se realiza el reporte de los puntos de venta que aplican y los que no

    // Si ya hay un reporte previo, se elimina para crear uno nuevo
    await TerminalRecord.findOneAndDelete({
      agency: ObjectId(salesParam.agency),
      date: { $gte: new Date(startDay), $lte: new Date(endDay) },
    });

    let applyStack = [];
    let notApplyStack = [];
    let totalApplyAmmount = 0;
    let totalNotApplyAmmount = 0;
    let total = 0;

    for (let terminalAmmount of salesParam.terminalAmmounts) {
      // Se modifica el string por el ObjectID
      terminalAmmount.terminal = ObjectId(terminalAmmount.terminal);

      //  Se busca el terminal para saber si este aplica o no, e ir ordenando todo para realizar el reporte
      let terminal = await Terminal.findById(terminalAmmount.terminal);

      //  Si el terminal aplica o no, se modifican los respectivos valores
      if (terminal.apply) {
        applyStack.push(terminalAmmount);
        totalApplyAmmount += terminalAmmount.total;
      } else {
        notApplyStack.push(terminalAmmount);
        totalNotApplyAmmount += terminalAmmount.total;
      }

      total += terminalAmmount.total;
    }

    const record = {
      agency: salesParam.agency, //  Agencia
      applyStack, //  Montos de los terminales que aplican
      notApplyStack, //  Montos de los terminales que NO aplican
      totalApplyAmmount, //  Monto total de los terminales que aplican
      totalNotApplyAmmount, //  Monto total de los terminales que NO aplican
      total, //  Monto total de todos los terminales

      date: moment(salesParam.date),
    };

    const newTerminalRecord = new TerminalRecord(record);

    await newTerminalRecord.save();

    //*** Se obtiene el total ingresado de la tienda y el diferencial

    salesParam.total = 0;
    salesParam.total += salesParam.pAmmount + salesParam.tAmmount;
    salesParam.total += salesParam.ves;
    salesParam.total += salesParam.dollar * salesParam.valueDollar;
    salesParam.total += salesParam.eur * salesParam.valueEur;
    salesParam.total += salesParam.cop / salesParam.valueCop;

    salesParam.differential =
      salesParam.total - salesParam.virtualValues.totalAmountBox;

    // Si ya hay un reporte, se actualiza, mientras que de lo contrario se crea uno nuevo y luego se envia el resultado

    // Parámetros para buscar el nuevo reporte almacenado, para posteriormente imprimirlo
    const params = {
      user: {
        role: 1,
      },
      pageSize: 1,
      pageIndex: 1,
      filters: {
        agency: salesParam.agency,
        startDate: salesParam.date,
        endDate: salesParam.date,
      },
    };

    // Si ya hay un registro existente del dia y se quiere modificar
    if (existentPaymentMethodsRecord) {
      // No se pueden modificar reportes dias después de haberlo subido

      let actualDate = moment().utc().subtract(4, "hours");
      let reportDay = moment(salesParam.date).utc();

      if (moment(actualDate).isSame(reportDay, "day")) {
        let result = await PaymentMethodsRecord.updateOne(
          { _id: existentPaymentMethodsRecord._id },
          salesParam
        );
        if (result) {
          // Ahora se busca el nuevo registro guardado, para imprimirlo
          const dataToPrint = await salesService.reportPaymentMethodsHistory(
            params
          );
          return {
            result: dataToPrint.resultsStores[0],
          };
        } else {
          throw "Hubo un problema al momento del registro";
        }
      }
    } else {
      const newPaymentMethodsRecord = new PaymentMethodsRecord(salesParam);
      let result = await newPaymentMethodsRecord.save();
      if (result) {
        // Ahora se busca el nuevo registro guardado, para imprimirlo
        const dataToPrint = await salesService.reportPaymentMethodsHistory(
          params
        );
        return {
          result: dataToPrint.resultsStores[0],
        };
      } else {
        throw "Hubo un problema al momento del registro";
      }
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

    let stagesStoreReport = [
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
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
      {
        $set: {
          operatorsAmmount: {
            $map: {
              input: "$operatorsAmmount",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    agency: "$agency",
                  },
                ],
              },
            },
          },
        },
      },
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
      {
        $set: {
          cashiersAmmount: {
            $map: {
              input: "$cashiersAmmount",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    agency: "$agency",
                  },
                ],
              },
            },
          },
        },
      },
      { $sort: sortBy },
    ];

    //Si no es excel paginar normalmente
    //Añade facet al final del array
    if (!salesParam.isExcel) {
      stagesStoreReport.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: pageSize * pageIndex - pageSize },
            { $limit: pageSize },
          ],
        },
      });
    }

    //Si el rol es Gerente, solo su sucursal
    if (salesParam.user.role == role.rol.Manager) {
      stagesStoreReport.unshift({
        $match: { agency: ObjectId(salesParam.user.agency) },
      });
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stagesStoreReport.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stagesStoreReport.unshift({
          $match: { date: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesStoreReport.unshift({
          $match: { date: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesStoreReport.unshift({
          $match: {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
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

    const newPaymentMethodsRecordStoreReport =
      await PaymentMethodsRecord.aggregate(stagesStoreReport);

    /* HISTORIAL DE CIERRE GENERAL POR DIA  */

    let stagesGeneralReport = [
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
      // Se unen todos los arreglos de los logros de los operadores
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
      {
        $lookup: {
          from: "agencies",
          localField: "operatorsAmmount.agency",
          foreignField: "_id",
          as: "agencies",
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
      // Se crea un objeto para que quede acorde con el frontend
      {
        $addFields: {
          virtualValues: {
            totalPos: "$virtualValues_totalPos",
            totalAmountBox: "$virtualValues_totalAmountBox",
          },
        },
      },
      { $sort: sortBy },
    ];

    //Si el rol es Gerente, solo su sucursal
    if (salesParam.user.role == role.rol.Manager) {
      stagesGeneralReport.unshift({
        $match: { agency: ObjectId(salesParam.user.agency) },
      });
    }

    //Filtros para la consulta normal como para el total
    if (salesParam.filters) {
      //Si hay filtro de sucursal
      if (salesParam.filters.agency) {
        stagesGeneralReport.unshift({
          $match: { agency: ObjectId(salesParam.filters.agency) },
        });
      }

      if (salesParam.filters.startDate && !salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        stagesGeneralReport.unshift({
          $match: { date: { $gte: new Date(startDate) } },
        });
      }

      if (!salesParam.filters.startDate && salesParam.filters.endDate) {
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesGeneralReport.unshift({
          $match: { date: { $lte: new Date(endDate) } },
        });
      }

      if (salesParam.filters.startDate && salesParam.filters.endDate) {
        const startDate = moment(salesParam.filters.startDate)
          .utc()
          .startOf("day");
        const endDate = moment(salesParam.filters.endDate).utc().endOf("day");
        stagesGeneralReport.unshift({
          $match: {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        });
      }
    }

    if (!salesParam.filters.startDate && !salesParam.filters.endDate) {
      const startDate = moment().utc().startOf("day");
      const endDate = moment().utc().endOf("day");
      stagesGeneralReport.unshift({
        $match: {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });
    }

    const newPaymentMethodsRecordGeneralReport =
      await PaymentMethodsRecord.aggregate(stagesGeneralReport);

    // Se crean todas las posibles cuentas que pueden existir mezclando el banco y el nombre de la cuenta
    const posibleBankAccounts = [];

    for (let bank in bankEnum.bank) {
      for (let account in bankEnum.account) {
        let bankName = bankEnum.bank[bank];
        let accountName = bankEnum.account[account];

        let code = bankName + " " + accountName;

        posibleBankAccounts.push({
          terminal: {
            code: code,
            bank: bankName,
            account: accountName,
          },
          debit: 0,
          credit: 0,
          totalPDV: 0,
          transfer: 0,
          total: 0,
        });
      }
    }

    newPaymentMethodsRecordGeneralReport.forEach((report) => {
      // Se modifica el nombre de la agencia
      report.agency = {
        name: "Reporte general",
      };

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
            bankAccount.terminal.bank === terminalReport.terminal.bank &&
            bankAccount.terminal.account === terminalReport.terminal.description
        );

        if (bankAccountToModify) {
          bankAccountToModify.debit += terminalReport.debit;
          bankAccountToModify.credit += terminalReport.credit;
          bankAccountToModify.totalPDV += terminalReport.total;
          bankAccountToModify.descriptione = terminalReport.terminal.description;
          bankAccountToModify.terminale = terminalReport.terminal.code;
          bankAccountToModify.banka = terminalReport.terminal.bank;

          bankAccountToModify.total += terminalReport.total;
        }
      });

      // Ahora se procesa el monto general por cuenta, ingresado por medio de las transferencias

      report.transferAmmounts.forEach((transferReport) => {
        if (transferReport.total === 0) {
          return;
        }

        let bankAccountToModify = bankAccounts.find(
          (bankAccount) =>
            bankAccount.terminal.bank === transferReport.bank &&
            bankAccount.terminal.account === transferReport.account
        );

        if (bankAccountToModify) {
          bankAccountToModify.transfer += transferReport.total;
          bankAccountToModify.total += transferReport.total;
        }
      });

      // Finalmente se sustituye "terminalAmmounts" por las cuentas que hayan tenido modificaciones
      report.terminalAmmounts = bankAccounts.filter(
        (bankAccount) => bankAccount.total !== 0
      );
    });

    return {
      resultsStores: !salesParam.isExcel
        ? newPaymentMethodsRecordStoreReport[0].data
        : newPaymentMethodsRecordStoreReport,
      metadata: !salesParam.isExcel
        ? newPaymentMethodsRecordStoreReport[0].metadata
        : [],
      resultsGeneral: newPaymentMethodsRecordGeneralReport,
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
            totalWholesaleClients: 0,
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
              newOperatorSum.totalWholesaleClients +=
                operatorReport2.totalWholesaleClients;
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
      .populate("terminal", "code bank description")
      .populate("terminalExtra", "code bank description")
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
  },

  getCommissionReports: async (salesParam) => {

    // Función auxiliar para calcular la sumatoria de vales ingresados
    // Solo calcula si existen AMBOS filtros: startDate y endDate
    const calculateValesIngresados = async (filters) => {
      // Si no existen ambos filtros de fecha, no calcular
      if (!filters || !filters.startDate || !filters.endDate) {
        return null;
      }

      let stages = [
        {
          $match: {
            type: { $in: [10, 11, 12, 13] }, // Tipos de vales
            isSumation: true, // Que sumen en caja
          },
        },
      ];

      // Filtro por agencia si existe en filters
      if (filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(filters.agency) },
        });
      }

      // Aplicar filtro de fechas (ambos deben existir)
      const startDate = moment(filters.startDate).utc().startOf("day");
      const endDate = moment(filters.endDate).utc().endOf("day");
      stages.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });

      // Agregar stage para sumar los totales
      stages.push({
        $group: {
          _id: null,
          totalValesIngresados: { $sum: "$total" },
        },
      });

      const result = await Sales.aggregate(stages);
      return result.length > 0 ? result[0].totalValesIngresados : 0;
    };

    // Función auxiliar para calcular vales ingresados por agencia
    // Retorna un Map con agencyId -> totalValesIngresados
    const calculateValesIngresadosByAgency = async (filters) => {
      // Si no existen ambos filtros de fecha, no calcular
      if (!filters || !filters.startDate || !filters.endDate) {
        return null;
      }

      let stages = [
        {
          $match: {
            type: { $in: [10, 11, 12, 13] }, // Tipos de vales
            isSumation: true, // Que sumen en caja
          },
        },
      ];

      // Aplicar filtro de fechas (ambos deben existir)
      const startDate = moment(filters.startDate).utc().startOf("day");
      const endDate = moment(filters.endDate).utc().endOf("day");
      stages.unshift({
        $match: {
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      });

      // Agregar stage para agrupar por agencia y sumar los totales
      stages.push({
        $group: {
          _id: "$agency",
          totalValesIngresados: { $sum: "$total" },
        },
      });

      const results = await Sales.aggregate(stages);
      
      // Convertir a un Map para acceso rápido por agencyId
      const valesByAgency = new Map();
      results.forEach(item => {
        const agencyId = item._id ? item._id.toString() : null;
        if (agencyId) {
          valesByAgency.set(agencyId, item.totalValesIngresados || 0);
        }
      });
      
      return valesByAgency;
    };

    // Función auxiliar para procesar reportes guardados y agregar totalSinVales
    const processSavedReports = async (results, valesByAgencyMap) => {
      if (!results) {
        return results;
      }

      const reportDate = salesParam.filters?.endDate || salesParam.filters?.startDate || new Date();

      // Procesar commissionResultsWholesaleGoal
      if (results.commissionResultsWholesaleGoal && Array.isArray(results.commissionResultsWholesaleGoal)) {
        await Promise.all(
          results.commissionResultsWholesaleGoal.map(async (item) => {
            // Obtener el ID de la agencia del item
            const agencyId = item.agency?._id ? item.agency._id.toString() : 
                           (item.agency ? item.agency.toString() : null);
            
            // Obtener vales ingresados específicos de esta agencia
            const valesIngresados = valesByAgencyMap && agencyId 
              ? (valesByAgencyMap.get(agencyId) || 0) 
              : 0;
            
            item.totalValesIngresados = valesIngresados;
            item.totalSinVales = Math.max(0, item.total - valesIngresados);

            // Nuevos campos en dólares usando valueDollar
            item.totalDollars = item.valueDollar ? item.total / item.valueDollar : 0;
            item.totalSinValesDollars = item.valueDollar ? item.totalSinVales / item.valueDollar : 0;
            item.totalValesIngresadosDollars = item.valueDollar ? item.totalValesIngresados / item.valueDollar : 0;

            const sellerId = item.seller?._id || item.seller;
            if (sellerId) {
              try {
                const historicalGoal = await userService.getSellerWeeklyGoalForDate(
                  sellerId,
                  reportDate
                );

                item.weeklyGoalPercentage = (item.totalSinVales / historicalGoal.weeklyGoal) * 100;
                item.weeklyGoalReached = item.weeklyGoalPercentage > historicalGoal.weeklyGoalMinimumPercentageOfSales;

                const sellerWeeklyGoal = item.seller?.weeklyGoal || historicalGoal.weeklyGoal;
                const sellerMinimumPercentage = item.seller?.weeklyGoalMinimumPercentageOfSales || historicalGoal.weeklyGoalMinimumPercentageOfSales;

                item.calculationDetails = {
                  reportDate: reportDate,
                  historicalGoal: historicalGoal.weeklyGoal,
                  historicalMinimumPercentage: historicalGoal.weeklyGoalMinimumPercentageOfSales,
                  currentGoal: sellerWeeklyGoal,
                  totalSales: item.total,
                  totalSinVales: item.totalSinVales,
                  totalValesIngresados: item.totalValesIngresados,
                  calculation: `${item.totalSinVales.toLocaleString()} ÷ ${historicalGoal.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
                  goalUsed: 'historical',
                  goalDate: historicalGoal.goalDate || null
                };
              } catch (error) {
                const sellerWeeklyGoal = item.seller?.weeklyGoal || 0;
                const sellerMinimumPercentage = item.seller?.weeklyGoalMinimumPercentageOfSales || 0;
                
                if (sellerWeeklyGoal > 0) {
                  item.weeklyGoalPercentage = (item.totalSinVales / sellerWeeklyGoal) * 100;
                  item.weeklyGoalReached = item.weeklyGoalPercentage > sellerMinimumPercentage;
                }

                item.calculationDetails = {
                  reportDate: reportDate,
                  historicalGoal: sellerWeeklyGoal,
                  historicalMinimumPercentage: sellerMinimumPercentage,
                  currentGoal: sellerWeeklyGoal,
                  totalSales: item.total,
                  totalSinVales: item.totalSinVales,
                  totalValesIngresados: item.totalValesIngresados,
                  calculation: sellerWeeklyGoal > 0 
                    ? `${item.totalSinVales.toLocaleString()} ÷ ${sellerWeeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`
                    : 'No se pudo calcular',
                  goalUsed: 'current',
                  goalDate: null,
                  error: error.message
                };
              }
            }
          })
        );
      }

      // Procesar commissionResultsWeeklyGoal
      if (results.commissionResultsWeeklyGoal && Array.isArray(results.commissionResultsWeeklyGoal)) {
        await Promise.all(
          results.commissionResultsWeeklyGoal.map(async (item) => {
            // Obtener el ID de la agencia del item
            const agencyId = item.agency?._id ? item.agency._id.toString() : 
                           (item.agency ? item.agency.toString() : null);
            
            // Obtener vales ingresados específicos de esta agencia
            const valesIngresados = valesByAgencyMap && agencyId 
              ? (valesByAgencyMap.get(agencyId) || 0) 
              : 0;
            
            item.totalValesIngresados = valesIngresados;
            item.totalSinVales = Math.max(0, item.total - valesIngresados);

            // Nuevos campos en dólares usando valueDollar
            item.totalDollars = item.valueDollar ? item.total / item.valueDollar : 0;
            item.totalSinValesDollars = item.valueDollar ? item.totalSinVales / item.valueDollar : 0;
            item.totalValesIngresadosDollars = item.valueDollar ? item.totalValesIngresados / item.valueDollar : 0;

            const sellerId = item.seller?._id || item.seller;
            if (sellerId) {
              try {
                const historicalGoal = await userService.getSellerWeeklyGoalForDate(
                  sellerId,
                  reportDate
                );

                item.weeklyGoalPercentage = (item.totalSinVales / historicalGoal.weeklyGoal) * 100;
                item.weeklyGoalReached = item.weeklyGoalPercentage > historicalGoal.weeklyGoalMinimumPercentageOfSales;

                const sellerWeeklyGoal = item.seller?.weeklyGoal || historicalGoal.weeklyGoal;
                const sellerMinimumPercentage = item.seller?.weeklyGoalMinimumPercentageOfSales || historicalGoal.weeklyGoalMinimumPercentageOfSales;

                item.calculationDetails = {
                  reportDate: reportDate,
                  historicalGoal: historicalGoal.weeklyGoal,
                  historicalMinimumPercentage: historicalGoal.weeklyGoalMinimumPercentageOfSales,
                  currentGoal: sellerWeeklyGoal,
                  totalSales: item.total,
                  totalSinVales: item.totalSinVales,
                  totalValesIngresados: item.totalValesIngresados,
                  calculation: `${item.totalSinVales.toLocaleString()} ÷ ${historicalGoal.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
                  goalUsed: 'historical',
                  goalDate: historicalGoal.goalDate || null
                };
              } catch (error) {
                const sellerWeeklyGoal = item.seller?.weeklyGoal || 0;
                const sellerMinimumPercentage = item.seller?.weeklyGoalMinimumPercentageOfSales || 0;
                
                if (sellerWeeklyGoal > 0) {
                  item.weeklyGoalPercentage = (item.totalSinVales / sellerWeeklyGoal) * 100;
                  item.weeklyGoalReached = item.weeklyGoalPercentage > sellerMinimumPercentage;
                }

                item.calculationDetails = {
                  reportDate: reportDate,
                  historicalGoal: sellerWeeklyGoal,
                  historicalMinimumPercentage: sellerMinimumPercentage,
                  currentGoal: sellerWeeklyGoal,
                  totalSales: item.total,
                  totalSinVales: item.totalSinVales,
                  totalValesIngresados: item.totalValesIngresados,
                  calculation: sellerWeeklyGoal > 0 
                    ? `${item.totalSinVales.toLocaleString()} ÷ ${sellerWeeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`
                    : 'No se pudo calcular',
                  goalUsed: 'current',
                  goalDate: null,
                  error: error.message
                };
              }
            }
          })
        );
      }

      return results;
    };

    // Calcular vales ingresados por agencia (solo si existen ambos filtros de fecha)
    const valesByAgencyMap = await calculateValesIngresadosByAgency(salesParam.filters);
    // Mantener el cálculo total para compatibilidad
    const totalValesIngresados = await calculateValesIngresados(salesParam.filters);

    if (
      !salesParam.filters ||
      (!salesParam.filters.startDate && !salesParam.filters.endDate)
    ) {
      const results = await salesService.commissionReports(salesParam, valesByAgencyMap);
      // Solo incluir totalValesIngresados si no es null
      return totalValesIngresados !== null
        ? { ...results, totalValesIngresados }
        : results;
    }

    // Inicialmente se busca si hay data guardada (aplicaría unicamente para semanas anteriores), de lo contrario se calcula
    const results = await salesService.commissionReportSaved(salesParam);

    if (results) {
      // Procesar reportes guardados para agregar totalSinVales y recalcular porcentajes
      const processedResults = await processSavedReports(results, valesByAgencyMap);
      // Solo incluir totalValesIngresados si no es null
      return totalValesIngresados !== null
        ? { ...processedResults, totalValesIngresados }
        : processedResults;
    } else {
      const commissionResults = await salesService.commissionReports(salesParam, valesByAgencyMap);
      // Solo incluir totalValesIngresados si no es null
      return totalValesIngresados !== null
        ? { ...commissionResults, totalValesIngresados }
        : commissionResults;
    }
  },

  commissionReports: async (salesParam, valesByAgencyMap = null) => {
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

    // Calcular metas usando historial de metas para cada vendedor
    await Promise.all(
      commissionResultsWholesaleGoal.map(async (item) => {
        // Obtener el ID de la agencia del item
        const agencyId = item.agency?._id ? item.agency._id.toString() : 
                       (item.agency ? item.agency.toString() : null);
        
        // Obtener vales ingresados específicos de esta agencia
        const valesIngresados = valesByAgencyMap && agencyId 
          ? (valesByAgencyMap.get(agencyId) || 0) 
          : 0;
        
        item.totalValesIngresados = valesIngresados;
        item.totalSinVales = Math.max(0, item.total - valesIngresados);

        // Nuevos campos en dólares usando valueDollar
        item.totalDollars = item.valueDollar ? item.total / item.valueDollar : 0;
        item.totalSinValesDollars = item.valueDollar ? item.totalSinVales / item.valueDollar : 0;
        item.totalValesIngresadosDollars = item.valueDollar ? item.totalValesIngresados / item.valueDollar : 0;
        
        // Obtener la meta histórica para la fecha del reporte
        const reportDate = salesParam.filters?.endDate || salesParam.filters?.startDate || new Date();

        try {
          const historicalGoal = await userService.getSellerWeeklyGoalForDate(
            item._id,
            reportDate
          );

          // Cálculos explícitos para el frontend usando totalSinVales
          item.weeklyGoalPercentage = (item.totalSinVales / historicalGoal.weeklyGoal) * 100;
          item.weeklyGoalReached = item.weeklyGoalPercentage > historicalGoal.weeklyGoalMinimumPercentageOfSales;

          // Agregar datos explícitos para el frontend
          item.calculationDetails = {
            reportDate: reportDate,
            historicalGoal: historicalGoal.weeklyGoal,
            historicalMinimumPercentage: historicalGoal.weeklyGoalMinimumPercentageOfSales,
            currentGoal: item.seller.weeklyGoal,
            totalSales: item.total,
            totalSinVales: item.totalSinVales,
            totalValesIngresados: item.totalValesIngresados,
            calculation: `${item.totalSinVales.toLocaleString()} ÷ ${historicalGoal.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: 'historical',
            goalDate: historicalGoal.goalDate || null
          };
        } catch (error) {
          // Fallback a valores actuales si hay error
          item.weeklyGoalPercentage = (item.totalSinVales / item.seller.weeklyGoal) * 100;
          item.weeklyGoalReached = item.weeklyGoalPercentage > item.seller.weeklyGoalMinimumPercentageOfSales;

          // Datos explícitos para fallback
          item.calculationDetails = {
            reportDate: reportDate,
            historicalGoal: item.seller.weeklyGoal,
            historicalMinimumPercentage: item.seller.weeklyGoalMinimumPercentageOfSales,
            currentGoal: item.seller.weeklyGoal,
            totalSales: item.total,
            totalSinVales: item.totalSinVales,
            totalValesIngresados: item.totalValesIngresados,
            calculation: `${item.totalSinVales.toLocaleString()} ÷ ${item.seller.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: 'current',
            goalDate: null,
            error: error.message
          };
        }

        item.wholesalesGoalPercentage = (item.totalWholesales / item.seller.wholesalesGoal) * 100;
        item.wholesalesGoalReached = item.wholesalesGoalPercentage > 100;
      })
    );

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

        // Obtener el ID de la agencia del item
        const agencyId = item.agency?._id ? item.agency._id.toString() : 
                       (item.agency ? item.agency.toString() : null);
        
        // Obtener vales ingresados específicos de esta agencia
        const valesIngresados = valesByAgencyMap && agencyId 
          ? (valesByAgencyMap.get(agencyId) || 0) 
          : 0;
        
        item.totalValesIngresados = valesIngresados;
        item.totalSinVales = Math.max(0, item.total - valesIngresados);

        // Nuevos campos en dólares usando valueDollar
        item.totalDollars = item.valueDollar ? item.total / item.valueDollar : 0;
        item.totalSinValesDollars = item.valueDollar ? item.totalSinVales / item.valueDollar : 0;
        item.totalValesIngresadosDollars = item.valueDollar ? item.totalValesIngresados / item.valueDollar : 0;

        // Obtener la meta histórica para la fecha del reporte
        const reportDate = salesParam.filters?.startDate || new Date();

        try {
          const historicalGoal = await userService.getSellerWeeklyGoalForDate(
            seller._id,
            reportDate
          );

          // Cálculos explícitos para el frontend usando totalSinVales
          item.weeklyGoalPercentage = (item.totalSinVales / historicalGoal.weeklyGoal) * 100;
          item.weeklyGoalReached = item.weeklyGoalPercentage > historicalGoal.weeklyGoalMinimumPercentageOfSales;

          // Agregar datos explícitos para el frontend
          item.calculationDetails = {
            reportDate: reportDate,
            historicalGoal: historicalGoal.weeklyGoal,
            historicalMinimumPercentage: historicalGoal.weeklyGoalMinimumPercentageOfSales,
            currentGoal: seller.weeklyGoal,
            totalSales: item.total,
            totalSinVales: item.totalSinVales,
            totalValesIngresados: item.totalValesIngresados,
            calculation: `${item.totalSinVales.toLocaleString()} ÷ ${historicalGoal.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: 'historical',
            goalDate: historicalGoal.goalDate || null
          };
        } catch (error) {
          // Fallback a valores actuales si hay error
          item.weeklyGoalPercentage = (item.totalSinVales / seller.weeklyGoal) * 100;
          item.weeklyGoalReached = item.weeklyGoalPercentage > seller.weeklyGoalMinimumPercentageOfSales;

          // Datos explícitos para fallback
          item.calculationDetails = {
            reportDate: reportDate,
            historicalGoal: seller.weeklyGoal,
            historicalMinimumPercentage: seller.weeklyGoalMinimumPercentageOfSales,
            currentGoal: seller.weeklyGoal,
            totalSales: item.total,
            totalSinVales: item.totalSinVales,
            totalValesIngresados: item.totalValesIngresados,
            calculation: `${item.totalSinVales.toLocaleString()} ÷ ${seller.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: 'current',
            goalDate: null,
            error: error.message
          };
        }
      })
    );

    return {
      commissionResultsWholesaleGoal,
      commissionResultsWeeklyGoal,
    };
  },

  commissionReportsCurrentWeek: async (salesParam) => {
    // REPORTE DE COMISIONES EN TIEMPO REAL DE LA SEMANA ACTUAL //
    // Calcula desde el lunes de la semana actual hasta el día actual

    console.log('salesParam', salesParam);

    // Calcular el lunes de la semana actual
    const currentDayOfTheWeek = moment().utc().subtract(4, "hours").day(); // 0 = domingo, 1 = lunes, etc.
    const startDate = moment()
      .utc()
      .subtract(4, "hours")
      .subtract(currentDayOfTheWeek === 0 ? 6 : currentDayOfTheWeek - 1, "days")
      .startOf("day");
    
    // Fecha final: día actual (hasta el final del día)
    const endDate = moment().utc().subtract(4, "hours").endOf("day");

    // Agregar información de la semana calculada
    const normalizedDay = currentDayOfTheWeek === 0 ? 7 : currentDayOfTheWeek; // Convertir domingo de 0 a 7
    const weekInfo = {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      currentDay: normalizedDay,
      daysElapsed: normalizedDay, // Días transcurridos desde el lunes (1 = lunes, 7 = domingo)
      totalDaysInWeek: 7,
      isWeekend: currentDayOfTheWeek === 0 || currentDayOfTheWeek === 6,
      progressPercentage: ((normalizedDay / 7) * 100).toFixed(2), // Porcentaje de progreso de la semana
    };

    let stages = [
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: "$agency",

          // Total de ingresos reales en bs (DETAL, MAYOR y ABONOS) que fueron ingresados en los cierres de formas de pago
          total: { $sum: "$total" },
          valueDollar: { $last: "$valueDollar" },
          agency: { $last: "$agency" },

          // Contar días con registros
          daysWithRecords: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } },

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
      { $sort: { total: -1 } },
    ];

    // Si hay filtro de sucursal
    if (salesParam && salesParam.filters && salesParam.filters.agency) {
      stages.unshift({
        $match: { agency: ObjectId(salesParam.filters.agency) },
      });
    }

    const commissionResultsWeeklyGoal = await PaymentMethodsRecord.aggregate(
      stages
    );

    // Calcular días con registros
    commissionResultsWeeklyGoal.forEach((item) => {
      item.daysWithRecords = item.daysWithRecords ? item.daysWithRecords.length : 0;
    });

    // NOTA: forEach, no funciona bien cuando la callback es async, por lo que se utiliza este método
    await Promise.all(
      commissionResultsWeeklyGoal.map(async (item) => {
        const seller = await Seller.findOne({ agency: item.agency._id })
          .sort({ createdDate: "asc" })
          .lean();

        item.seller = seller;

        // Obtener la meta histórica para la fecha del reporte (usar fecha actual)
        const reportDate = new Date();

        try {
          const historicalGoal = await userService.getSellerWeeklyGoalForDate(
            seller._id,
            reportDate
          );

          // Cálculos explícitos para el frontend
          item.weeklyGoalPercentage = (item.total / historicalGoal.weeklyGoal) * 100;
          item.weeklyGoalReached =
            item.weeklyGoalPercentage > historicalGoal.weeklyGoalMinimumPercentageOfSales;

          // Agregar datos explícitos para el frontend
          item.calculationDetails = {
            reportDate: reportDate,
            historicalGoal: historicalGoal.weeklyGoal,
            historicalMinimumPercentage:
              historicalGoal.weeklyGoalMinimumPercentageOfSales,
            currentGoal: seller.weeklyGoal,
            totalSales: item.total,
            calculation: `${item.total.toLocaleString()} ÷ ${historicalGoal.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: "historical",
            goalDate: historicalGoal.goalDate || null,
          };
        } catch (error) {
          // Fallback a valores actuales si hay error
          item.weeklyGoalPercentage = (item.total / seller.weeklyGoal) * 100;
          item.weeklyGoalReached =
            item.weeklyGoalPercentage > seller.weeklyGoalMinimumPercentageOfSales;

          // Datos explícitos para fallback
          item.calculationDetails = {
            reportDate: reportDate,
            historicalGoal: seller.weeklyGoal,
            historicalMinimumPercentage: seller.weeklyGoalMinimumPercentageOfSales,
            currentGoal: seller.weeklyGoal,
            totalSales: item.total,
            calculation: `${item.total.toLocaleString()} ÷ ${seller.weeklyGoal.toLocaleString()} × 100 = ${item.weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: "current",
            goalDate: null,
            error: error.message,
          };
        }
      })
    );

    return {
      commissionResultsWeeklyGoal,
      weekInfo,
      isRealTime: true,
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
      InventoryRecord: [],
      Sales: [],
      Wholesales: null,
      WholesaleClient: null,
      Box: [],
    };

    try {
      //Recorrer ventas
      for (let salesParam of offlineParam.items) {
        // Debido al problema de recarga de página, se verifica que no haya una venta con la misma agencia y fecha, ya que de lo contrario no se procesa
        const registeredSale = await Sales.findOne({
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
          // Si no existe como combo, processCombos lanza y continuamos con el flujo normal del producto.
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
          let inventory = await Inventory.findOne({
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
            inventoryParam.price = item.price; //precio de venta
            inventoryParam.regularPrice = item.regularPrice; //precio regular si es oferta
            inventoryParam.differential = differential;
            inventoryParam.isOffer = item.isOffer;
            inventoryParam.type = enumOut.out.sale;

            const record = new InventoryRecord(inventoryParam);
            const recordSaved = await record.save();
            dataToDelete.InventoryRecord.push(recordSaved._id);

            //Actualizar total en inventario
            await Inventory.findOneAndUpdate(
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

                const recordDecrease = new InventoryRecord(decreaseParam);
                const recordDecreaseSaved = await recordDecrease.save();
                dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

                //Actualizar total en inventario
                await Inventory.findOneAndUpdate(
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
            const inventory = new Inventory(newProd);
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
            const record = new InventoryRecord(inventoryRecordParam);
            const recordSaved = await record.save();
            dataToDelete.InventoryRecord.push(recordSaved._id);

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

                const recordDecrease = new InventoryRecord(decreaseParam);
                const recordDecreaseSaved = await recordDecrease.save();
                dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

                //Actualizar total en inventario
                await Inventory.findOneAndUpdate(
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

        // Promo cupón (offline): solo ventas al detal contado
        let couponUseDataOffline = null;
        const hasCouponCodeOffline = salesParam.couponCode != null && String(salesParam.couponCode).trim() !== '';
        if (hasCouponCodeOffline && !salesParam.isWholesale && !salesParam.isCredit) {
          const normalizedOffline = normalizeCouponCode(salesParam.couponCode);
          if (!normalizedOffline) {
            throw "Cupón no válido";
          }
          const totalBeforeDiscountOffline = parseFloat(salesParam.total);
          const updatedOffline = await PromoCoupon.findOneAndUpdate(
            { code: normalizedOffline, used: false },
            { $set: { used: true, usedAt: new Date() } }
          );
          if (!updatedOffline) {
            throw "Cupón ya utilizado o no válido";
          }
          salesParam.total = Math.round(totalBeforeDiscountOffline * 0.9 * 100) / 100;
          salesParam.couponCode = normalizedOffline;
          salesParam.couponDiscount = Math.round(totalBeforeDiscountOffline * 0.1 * 100) / 100;
          couponUseDataOffline = {
            couponCode: normalizedOffline,
            totalBeforeDiscount: totalBeforeDiscountOffline,
            totalAfterDiscount: salesParam.total,
            clientNames: salesParam.names || '',
            document: salesParam.document || '',
            phone: salesParam.phone || '',
            agency: salesParam.agency,
            user: salesParam.user
          };
        } else if (hasCouponCodeOffline && (salesParam.isWholesale || salesParam.isCredit)) {
          salesParam.couponCode = '';
          salesParam.couponDiscount = 0;
        }

        const sale = new Sales(salesParam);

        const saleSaved = await sale.save();
        dataToDelete.Sales.push(saleSaved._id);

        if (couponUseDataOffline) {
          await PromoCouponUse.create({
            couponCode: couponUseDataOffline.couponCode,
            saleOrder: saleSaved.order,
            saleFiscalOrder: null,
            clientNames: couponUseDataOffline.clientNames,
            document: couponUseDataOffline.document,
            phone: couponUseDataOffline.phone,
            totalBeforeDiscount: couponUseDataOffline.totalBeforeDiscount,
            discountPercent: 10,
            totalAfterDiscount: couponUseDataOffline.totalAfterDiscount,
            agency: couponUseDataOffline.agency,
            user: couponUseDataOffline.user
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

              const saleBox = new Box(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.Box.push(saleBoxSaved._id);
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

              const saleBox = new Box(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.Box.push(saleBoxSaved._id);
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

              const saleBox = new Box(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.Box.push(saleBoxSaved._id);
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

              const saleBox = new Box(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.Box.push(saleBoxSaved._id);
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

              const saleBox = new Box(boxData);
              const saleBoxSaved = await saleBox.save();
              dataToDelete.Box.push(saleBoxSaved._id);
            }
          }
        }
      }
    } catch (error) {
      // Se eliminan todos los registros de inventario que se hayan creado, para de esta manera no descontrolar balance
      for (let recordID of dataToDelete.InventoryRecord) {
        // Se busca el record almacenado
        let item = await InventoryRecord.findByIdAndDelete(recordID);

        // Se obtiene el inventario modificado
        let inventory = await Inventory.findOne({
          product: item.product,
          agency: item.agency,
        }).populate("product");

        if (inventory) {
          // Se vuelve a sumar lo restado por los kg del producto
          let total = parseFloat(inventory.kg) + parseFloat(item.out);

          //Actualizar total en inventario
          await Inventory.findOneAndUpdate(
            { product: item.product, agency: item.agency },
            { kg: total }
          );
        }
      }

      // Se eliminan todos los tickets registrados
      for (let recordID of dataToDelete.Sales) {
        // Se busca el ticket almacenado y se elimina
        await Sales.findByIdAndDelete(recordID);
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

      //Si hay filtro por DETAL con cupón (DETAL C)
      if (salesParam.filters.retailC) {
        stagesType.unshift({
          $and: [
            { type: { $eq: 1 } },
            { couponCode: { $exists: true, $nin: [null, ''] } },
          ],
        });
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
        salesParam.filters.credit ||
        salesParam.filters.retailC
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

    const sales = await Sales.aggregate(stages);

    return {
      results: sales[0].data,
      metadata: sales[0].metadata,
    };
  },

  validateCoupon: async (params) => {
    const normalized = normalizeCouponCode(params?.couponCode);
    if (!normalized) {
      return { valid: false, message: "Cupón no válido" };
    }
    let coupon = await PromoCoupon.findOne({ code: normalized });
    if (!coupon) {
      const count = await PromoCoupon.countDocuments();
      if (count < 3001) {
        const operations = [];
        for (let i = 0; i <= 3000; i++) {
          const code = i <= 9 ? '0' + i : String(i);
          operations.push({
            updateOne: {
              filter: { code },
              update: { $setOnInsert: { code, used: false, usedAt: null } },
              upsert: true
            }
          });
        }
        if (operations.length > 0) await PromoCoupon.bulkWrite(operations);
        coupon = await PromoCoupon.findOne({ code: normalized });
      }
    }
    if (!coupon) {
      return { valid: false, message: "Cupón no encontrado. Ejecute el seed de cupones si es la primera vez." };
    }
    if (coupon.used) {
      return { valid: false, message: "Cupón ya utilizado" };
    }
    const result = { valid: true };
    const totalBeforeDiscount = parseFloat(params?.total);
    if (typeof totalBeforeDiscount === 'number' && !isNaN(totalBeforeDiscount) && totalBeforeDiscount > 0) {
      result.totalBeforeDiscount = totalBeforeDiscount;
      result.couponDiscount = Math.round(totalBeforeDiscount * 0.1 * 100) / 100;
      result.totalAfterDiscount = Math.round(totalBeforeDiscount * 0.9 * 100) / 100;
    }
    return result;
  },

  /**
   * Historial de cupones usados con datos del cliente (nombre, teléfono, dirección).
   * Devuelve ventas de Sales y SalesFiscal que tienen couponCode.
   * @param {string} [date] - Fecha opcional YYYY-MM-DD para filtrar solo ese día.
   * @param {string} [dateFrom] - Inicio rango YYYY-MM-DD (opcional).
   * @param {string} [dateTo] - Fin rango YYYY-MM-DD (opcional). Si dateFrom/dateTo están presentes se usa rango en lugar de date.
   */
  getCouponHistory: async (date, dateFrom, dateTo) => {
    const limit = 500;
    const couponMatch = { couponCode: { $exists: true, $nin: [null, ''] } };
    if (dateFrom && dateTo && moment(dateFrom, 'YYYY-MM-DD', true).isValid() && moment(dateTo, 'YYYY-MM-DD', true).isValid()) {
      const start = moment(dateFrom).utc().startOf('day');
      const end = moment(dateTo).utc().endOf('day');
      couponMatch.createdDate = { $gte: new Date(start), $lte: new Date(end) };
    } else if (date && moment(date, 'YYYY-MM-DD', true).isValid()) {
      const startDay = moment(date).utc().startOf('day');
      const endDay = moment(date).utc().endOf('day');
      couponMatch.createdDate = { $gte: new Date(startDay), $lte: new Date(endDay) };
    }
    const [salesRows, salesFiscalRows] = await Promise.all([
      Sales.find(couponMatch)
        .select('couponCode createdDate names phone agency user order total couponDiscount _id')
        .populate('user', 'firstName lastName')
        .populate('agency', 'name')
        .sort({ createdDate: -1 })
        .limit(limit)
        .lean(),
      SalesFiscal.find(couponMatch)
        .select('couponCode createdDate names phone agency user order total couponDiscount _id')
        .populate('user', 'firstName lastName')
        .populate('agency', 'name')
        .sort({ createdDate: -1 })
        .limit(limit)
        .lean()
    ]);
    const mapRow = (row, saleId) => {
      const registeredBy = row.user
        ? `${(row.user.firstName || '').trim()} ${(row.user.lastName || '').trim()}`.trim() || '—'
        : '—';
      const agencyName = (row.agency && row.agency.name) ? row.agency.name : '—';
      return {
        code: row.couponCode,
        couponCode: row.couponCode,
        usedAt: row.createdDate,
        clientName: row.names || '',
        clientPhone: row.phone || '',
        clientAddress: '',
        saleId: saleId ? saleId.toString() : (row._id && row._id.toString()),
        registeredBy,
        agencyName,
        orderNumber: row.order != null ? row.order : '—',
        totalAmount: row.total != null ? row.total : 0,
        discountAmount: row.couponDiscount != null ? row.couponDiscount : 0
      };
    };
    const fromSales = salesRows.map((r) => mapRow(r, r._id));
    const fromFiscal = salesFiscalRows.map((r) => mapRow(r, r._id));
    const merged = [...fromSales, ...fromFiscal].sort(
      (a, b) => new Date(b.usedAt) - new Date(a.usedAt)
    );
    return merged.slice(0, limit);
  },

  seedPromoCoupons: async () => {
    const operations = [];
    for (let i = 0; i <= 3000; i++) {
      const code = i <= 9 ? '0' + i : String(i);
      operations.push({
        updateOne: {
          filter: { code },
          update: { $setOnInsert: { code, used: false, usedAt: null } },
          upsert: true
        }
      });
    }
    if (operations.length > 0) {
      await PromoCoupon.bulkWrite(operations);
    }
    return { message: "Seed de cupones completado", count: operations.length };
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

  // Sin documento en Combos: antes se llamaba combo.toObject() sobre null → error poco claro
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
    let inventory = await Inventory.findOne({
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

      const record = new InventoryRecord(inventoryParam);
      const recordSaved = await record.save();
      dataToDelete.InventoryRecord.push(recordSaved._id);

      //Actualizar total en inventario
      await Inventory.findOneAndUpdate(
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

          const recordDecrease = new InventoryRecord(decreaseParam);
          const recordDecreaseSaved = await recordDecrease.save();
          dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

          //Actualizar total en inventario
          await Inventory.findOneAndUpdate(
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
      const inventory = new Inventory(newProd);
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

      const record = new InventoryRecord(inventoryRecordParam);
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

          const recordDecrease = new InventoryRecord(decreaseParam);
          const recordDecreaseSaved = await recordDecrease.save();
          dataToDelete.InventoryRecord.push(recordDecreaseSaved._id);

          //Actualizar total en inventario
          await Inventory.findOneAndUpdate(
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

salesService.processCombos = processCombos;

module.exports = salesService;
