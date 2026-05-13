const db = require("../_helpers/db");
const NoteMarket = db.NoteMarket;
const Product = db.Product;
const moment = require("moment");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const inventoryService = require("../services/inventory.service");
const webhook = require("../_helpers/webhook");

let noteMarketService = {
  /**
   * Función para crear una nota de mercado (versión simplificada para tiendas)
   * Nota: Las notas normalmente vienen del backend de fábrica vía webhook
   *
   * @param {params} noteMarketParam
   */
  create: async (noteMarketParam) => {
    // Convertir valores de tipo de cambio de string a número si vienen como strings
    if (noteMarketParam.valueDollar && typeof noteMarketParam.valueDollar === 'string') {
      noteMarketParam.valueDollar = parseFloat(noteMarketParam.valueDollar.replace(/,/g, ""));
    }
    if (noteMarketParam.valueEur && typeof noteMarketParam.valueEur === 'string') {
      noteMarketParam.valueEur = parseFloat(noteMarketParam.valueEur.replace(/,/g, ""));
    }
    if (noteMarketParam.valueCop && typeof noteMarketParam.valueCop === 'string') {
      noteMarketParam.valueCop = parseFloat(noteMarketParam.valueCop.replace(/,/g, ""));
    }
    if (noteMarketParam.totalDollar && typeof noteMarketParam.totalDollar === 'string') {
      noteMarketParam.totalDollar = parseFloat(noteMarketParam.totalDollar.replace(/,/g, ""));
    }

    // Asegurar que el status sea "pending" por defecto si no se especifica
    if (!noteMarketParam.status) {
      noteMarketParam.status = 'pending';
    }

    const noteMarket = new NoteMarket(noteMarketParam);
    const noteMarketSaved = await noteMarket.save();

    if (!noteMarketSaved) {
      throw "Error registrando la nota de mercado";
    }

    return noteMarketSaved;
  },

  /**
   * Funcion para obtener todas las notas de mercado
   */
  getAll: async () => {
    return await NoteMarket.find().sort({ createdDate: -1 });
  },

  /**
   * Funcion para obtener una nota de mercado por ID
   */
  getNoteMarket: async (id) => {
    const noteMarket = await NoteMarket.findById(id)
      .populate('agency')
      .populate('user')
      .populate('seller')
      .populate('operator');

    // Validar
    if (!noteMarket) throw "Nota de mercado no encontrada";

    return noteMarket;
  },

  /**
   * Función para actualizar una nota de mercado
   * Solo permite actualizar campos editables sin afectar inventario
   * 
   * @param {string} id - ID de la nota de mercado
   * @param {object} noteMarketParam - Datos a actualizar
   */
  update: async (id, noteMarketParam) => {

    // Mostrar explícitamente el contenido de modifiedProducts
    if (noteMarketParam.modifiedProducts && Array.isArray(noteMarketParam.modifiedProducts)) {
      noteMarketParam.modifiedProducts.forEach((entry, index) => {
      });
    }
    
    const noteMarket = await NoteMarket.findById(id);

    if (!noteMarket) {
      throw "Nota de mercado no encontrada";
    }

    // Guardar los productos originales ANTES de cualquier modificación (para modifiedProducts)
    const originalProductsBeforeEdit = Array.isArray(noteMarket.products) 
      ? JSON.parse(JSON.stringify(noteMarket.products)) 
      : [];

    const productsParam = Array.isArray(noteMarketParam.products)
      ? noteMarketParam.products
      : [];

    const toObjectIdSafe = (value) => {
      if (!value) return undefined;
      if (value instanceof mongoose.Types.ObjectId) return value;
      if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      return undefined;
    };

    const parseNumber = (value, fallback = 0) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }
      const num = parseFloat(value);
      return Number.isNaN(num) ? fallback : num;
    };

    const parseBoolean = (value, fallback = false) => {
      if (value === undefined || value === null) {
        return fallback;
      }
      return Boolean(value);
    };

    // Productos que tenía la nota ANTES de la edición (para calcular diferencias)
    const previousProducts = Array.isArray(noteMarket.products)
      ? noteMarket.products.map((p) => ({
          id: String(p.id || p._id),
          kg: parseNumber(p.kg, 0),
        }))
      : [];

    let noteProducts = noteMarket.products;

    if (productsParam.length > 0) {
      const productsPopulated = await Promise.all(
        productsParam.map(async (item) => {
          if (!item || !item.id) {
            return null;
          }

          const productDoc = await Product.findById(item.id).lean();

          const productId = toObjectIdSafe(item.id) || productDoc?._id || undefined;

          return {
            id: productId,
            code: item.code ?? productDoc?.code ?? '',
            name: item.name ?? productDoc?.name ?? '',
            presentation: item.presentation ?? productDoc?.presentation ?? '',
            price: parseNumber(item.price, productDoc?.price ?? 0),
            regularPrice: parseNumber(item.regularPrice, productDoc?.regularPrice ?? productDoc?.price ?? 0),
            lastPrice: parseNumber(item.lastPrice, productDoc?.lastPrice ?? 0),
            wholesalePrice: parseNumber(item.wholesalePrice, productDoc?.wholesalePrice ?? 0),
            lastWholesalePrice: parseNumber(item.lastWholesalePrice, productDoc?.lastWholesalePrice ?? 0),
            minWeight: parseNumber(item.minWeight, productDoc?.minWeight ?? 0),
            wholesaleDiscountPrice: parseNumber(item.wholesaleDiscountPrice, productDoc?.wholesaleDiscountPrice ?? 0),
            applyWholesaleDiscount: parseBoolean(item.applyWholesaleDiscount, productDoc?.applyWholesaleDiscount ?? false),
            minWeightWholesaleDiscount: parseNumber(item.minWeightWholesaleDiscount, productDoc?.minWeightWholesaleDiscount ?? 0),
            differential: parseNumber(item.differential, 0),
            isOffer: parseBoolean(item.isOffer, false),
            isWholesale: parseBoolean(item.isWholesale, false),
            appliedWholesaleDiscount: parseBoolean(item.appliedWholesaleDiscount, false),
            wholesaleDiscountDifferential: parseNumber(item.wholesaleDiscountDifferential, 0),
            totalDifferential: parseNumber(item.totalDifferential, 0),
            kg: parseNumber(item.kg, 0),
            units: parseNumber(item.units, 0),
            total: parseNumber(item.total, 0),
            decrease: parseBoolean(item.decrease, productDoc?.decrease ?? false),
            reweigh: parseBoolean(item.reweigh, productDoc?.reweigh ?? false),
            mincemeat: parseBoolean(item.mincemeat, productDoc?.mincemeat ?? false),
            exempt: parseBoolean(item.exempt, productDoc?.exempt ?? false),
            taxed: parseBoolean(item.taxed, productDoc?.taxed ?? false),
            pz: parseNumber(item.pz, productDoc?.pz ?? 0),
            image: item.image ?? productDoc?.image ?? null,
            updateDate: item.updateDate ? new Date(item.updateDate) : productDoc?.updateDate ?? null,
          };
        })
      );

      noteProducts = productsPopulated.filter(Boolean);
      noteMarket.products = noteProducts;
    }

    // Construir movimientos de inventario (sin restricción de fecha)
    if (noteProducts.length > 0) {
      const InventoryRecord = db.InventoryRecord;
      const Inventory = db.Inventory;
      const enumIn = require('../enums/typeIn.enum');
      
      // Identificador único para esta nota (usando el order)
      const noteIdentifier = `NOTA_${noteMarket.order || noteMarket._id}`;
      const noteNumber = noteMarket.order || noteMarket._id;
      const noteLabel = `Nota n° ${noteNumber}`;
      const baseComment = noteMarketParam.comment || noteMarket.comment || '';
      const noteComment = baseComment 
        ? `${baseComment} [${noteIdentifier}]`.trim()
        : `[${noteIdentifier}]`.trim();
      
      // Buscar registros de inventario anteriores relacionados con esta nota
      const existingRecords = await InventoryRecord.find({
        agency: noteMarket.agency,
        note: noteLabel,
        comment: { $regex: noteIdentifier, $options: 'i' },
        typeIn: enumIn.in.dispatch
      }).sort({ createdDate: -1 });

      // Revertir el efecto de los registros anteriores
      if (existingRecords.length > 0) {
        for (const record of existingRecords) {
          // Buscar el producto en inventario
          const inventoryProduct = await Inventory.findOne({
            product: record.product,
            agency: record.agency
          });

          if (inventoryProduct) {
            // Revertir: restar los kg que se agregaron anteriormente
            const newTotal = parseFloat(inventoryProduct.kg) - parseFloat(record.in);
            inventoryProduct.kg = Math.max(0, newTotal); // No permitir valores negativos
            await inventoryProduct.save();
          }

          // Eliminar el registro anterior
          await InventoryRecord.findByIdAndDelete(record._id);
        }
      }

      // Crear nuevos registros con los valores finales correctos
      // Usar los valores finales de los productos, no la diferencia
      const productsForInventory = noteProducts
        .map((item) => {
          if (!item || !item.id) return null;
          const finalKg = parseNumber(item.kg, 0);
          if (finalKg <= 0) return null;

          return {
            id: item.id,
            kg: finalKg, // Valor final, no la diferencia
          };
        })
        .filter(Boolean);

      if (productsForInventory.length > 0) {
        await inventoryService.create({
          agency: noteMarket.agency,
          products: productsForInventory,
          note: noteLabel,
          comment: noteComment,
          typeIn: 'dispatch',
        });
      }
    }

    if (noteMarketParam.total !== undefined) {
      noteMarket.total = parseNumber(noteMarketParam.total, noteMarket.total);
    }

    if (noteMarketParam.totalWeight !== undefined) {
      noteMarket.totalWeight = parseNumber(noteMarketParam.totalWeight, noteMarket.totalWeight);
    }

    if (noteMarketParam.valueDollar !== undefined) {
      noteMarket.valueDollar = parseNumber(noteMarketParam.valueDollar, noteMarket.valueDollar ?? 0);
    }

    if (noteMarketParam.valueEur !== undefined) {
      noteMarket.valueEur = parseNumber(noteMarketParam.valueEur, noteMarket.valueEur ?? 0);
    }

    if (noteMarketParam.valueCop !== undefined) {
      noteMarket.valueCop = parseNumber(noteMarketParam.valueCop, noteMarket.valueCop ?? 0);
    }

    if (noteMarketParam.totalDollar !== undefined) {
      noteMarket.totalDollar = parseNumber(noteMarketParam.totalDollar, noteMarket.totalDollar ?? 0);
    }

    if (noteMarketParam.comment !== undefined) {
      noteMarket.comment = noteMarketParam.comment;
    }

    if (Array.isArray(noteMarketParam.modifiedProducts)) {
      /**
       * Queremos que el "original" (before) NO se modifique nunca.
       * - Si ya existe un registro de modifiedProducts para ese producto+tipo,
       *   reutilizamos su "before" y solo actualizamos el "after".
       * - Si no existe, creamos ambos (before y after) por primera vez.
       */

      const existingModified = Array.isArray(noteMarket.modifiedProducts)
        ? noteMarket.modifiedProducts
        : [];

      // Mapa para encontrar rápidamente si ya se modificó antes el mismo producto
      const existingMap = new Map();
      existingModified.forEach((entry) => {
        const productId =
          (entry.before && entry.before.id) ||
          (entry.after && entry.after.id) ||
          "";
        const productCode =
          (entry.before && entry.before.code) ||
          (entry.after && entry.after.code) ||
          "";
        const key = `${entry.type || ""}|${String(productId)}|${productCode}`;
        existingMap.set(key, entry);
      });

      const mapProductSnapshot = (data) => ({
        id: data.id ? toObjectIdSafe(data.id) : undefined,
        code: data.code ?? "",
        name: data.name ?? "",
        presentation: data.presentation ?? "",
        price: parseNumber(data.price, 0),
        regularPrice: parseNumber(data.regularPrice, 0),
        lastPrice: parseNumber(data.lastPrice, 0),
        wholesalePrice: parseNumber(data.wholesalePrice, 0),
        lastWholesalePrice: parseNumber(data.lastWholesalePrice, 0),
        minWeight: parseNumber(data.minWeight, 0),
        wholesaleDiscountPrice: parseNumber(
          data.wholesaleDiscountPrice,
          0
        ),
        applyWholesaleDiscount: parseBoolean(
          data.applyWholesaleDiscount,
          false
        ),
        minWeightWholesaleDiscount: parseNumber(
          data.minWeightWholesaleDiscount,
          0
        ),
        differential: parseNumber(data.differential, 0),
        isOffer: parseBoolean(data.isOffer, false),
        isWholesale: parseBoolean(data.isWholesale, false),
        appliedWholesaleDiscount: parseBoolean(
          data.appliedWholesaleDiscount,
          false
        ),
        wholesaleDiscountDifferential: parseNumber(
          data.wholesaleDiscountDifferential,
          0
        ),
        totalDifferential: parseNumber(data.totalDifferential, 0),
        kg: parseNumber(data.kg, 0),
        units: parseNumber(data.units, 0),
        total: parseNumber(data.total, 0),
        decrease: parseBoolean(data.decrease, false),
        reweigh: parseBoolean(data.reweigh, false),
        mincemeat: parseBoolean(data.mincemeat, false),
        exempt: parseBoolean(data.exempt, false),
        taxed: parseBoolean(data.taxed, false),
        pz: parseNumber(data.pz, 0),
        image: data.image ?? null,
        updateDate: data.updateDate ? new Date(data.updateDate) : null,
      });

      const updatedMap = new Map(existingMap);

      noteMarketParam.modifiedProducts.forEach((entry) => {
        const beforeData = entry.before || {};
        const afterData = entry.after || entry.product || {};

        const productId = beforeData.id || afterData.id || "";
        const productCode = beforeData.code || afterData.code || "";
        const key = `${entry.type || ""}|${String(productId)}|${productCode}`;

        const existingEntry = existingMap.get(key);

        let beforeSnapshot;

        if (existingEntry) {
          // Si ya existe, conservamos su "before" original
          beforeSnapshot = existingEntry.before;
        } else {
          // Si no existe y el before está vacío o es un producto eliminado
          if (entry.type === 'removed' && (!beforeData.id && !beforeData.code)) {
            // Buscar el producto original en los productos de la nota ANTES de la edición
            const originalProduct = originalProductsBeforeEdit.find(p => {
              const pId = String(p.id || p._id || '');
              const pCode = String(p.code || '');
              const aId = String(afterData.id || '');
              const aCode = String(afterData.code || '');
              return (pId && aId && pId === aId) || (pCode && aCode && pCode === aCode);
            });

            if (originalProduct) {
              // Usar el producto original encontrado
              beforeSnapshot = mapProductSnapshot({
                id: originalProduct.id || originalProduct._id,
                code: originalProduct.code,
                name: originalProduct.name,
                presentation: originalProduct.presentation,
                price: originalProduct.price,
                regularPrice: originalProduct.regularPrice,
                lastPrice: originalProduct.lastPrice,
                wholesalePrice: originalProduct.wholesalePrice,
                lastWholesalePrice: originalProduct.lastWholesalePrice,
                minWeight: originalProduct.minWeight,
                wholesaleDiscountPrice: originalProduct.wholesaleDiscountPrice,
                applyWholesaleDiscount: originalProduct.applyWholesaleDiscount,
                minWeightWholesaleDiscount: originalProduct.minWeightWholesaleDiscount,
                differential: originalProduct.differential,
                isOffer: originalProduct.isOffer,
                isWholesale: originalProduct.isWholesale,
                appliedWholesaleDiscount: originalProduct.appliedWholesaleDiscount,
                wholesaleDiscountDifferential: originalProduct.wholesaleDiscountDifferential,
                totalDifferential: originalProduct.totalDifferential,
                kg: originalProduct.kg,
                units: originalProduct.units,
                total: originalProduct.total,
                decrease: originalProduct.decrease,
                reweigh: originalProduct.reweigh,
                mincemeat: originalProduct.mincemeat,
                exempt: originalProduct.exempt,
                taxed: originalProduct.taxed,
                pz: originalProduct.pz,
                image: originalProduct.image,
                updateDate: originalProduct.updateDate,
              });
            } else {
              // Si no se encuentra, usar el after como before (producto eliminado)
              beforeSnapshot = mapProductSnapshot(afterData);
            }
          } else {
            // Caso normal: usar beforeData
            beforeSnapshot = mapProductSnapshot(beforeData);
          }
        }

        const afterSnapshot = mapProductSnapshot(afterData);

        updatedMap.set(key, {
          type: entry.type || "",
          before: beforeSnapshot,
          after: afterSnapshot,
        });
      });

      noteMarket.modifiedProducts = Array.from(updatedMap.values());
    }

    if (noteMarketParam.marketId) {
      const marketObjectId = toObjectIdSafe(noteMarketParam.marketId);
      if (marketObjectId) {
        noteMarket.marketId = marketObjectId;
        noteMarket.agency = marketObjectId;
      }
    }

    if (noteMarketParam.marketName !== undefined) {
      noteMarket.marketName = noteMarketParam.marketName;
    }

    if (noteMarketParam.marketCompany !== undefined) {
      noteMarket.marketCompany = noteMarketParam.marketCompany;
    }

    if (noteMarketParam.marketAttendant !== undefined) {
      noteMarket.marketAttendant = noteMarketParam.marketAttendant;
    }

    if (noteMarketParam.marketAddress !== undefined) {
      noteMarket.marketAddress = noteMarketParam.marketAddress;
    }

    if (noteMarketParam.driverId) {
      const driverObjectId = toObjectIdSafe(noteMarketParam.driverId);
      if (driverObjectId) {
        noteMarket.driverId = driverObjectId;
      }
    }

    if (noteMarketParam.driverName !== undefined) {
      noteMarket.driverName = noteMarketParam.driverName;
    }

    if (noteMarketParam.seller) {
      const sellerObjectId = toObjectIdSafe(noteMarketParam.seller);
      if (sellerObjectId) {
        noteMarket.seller = sellerObjectId;
      }
    }

    if (noteMarketParam.operator) {
      const operatorObjectId = toObjectIdSafe(noteMarketParam.operator);
      if (operatorObjectId) {
        noteMarket.operator = operatorObjectId;
      }
    }

    if (noteMarketParam.userName !== undefined) {
      noteMarket.userName = noteMarketParam.userName;
    }

    noteMarket.status = noteMarketParam.status || 'acept';

    const noteMarketUpdated = await noteMarket.save();

    if (!noteMarketUpdated) {
      throw "Error actualizando la nota de mercado";
    }

    try {
      const noteData = noteMarketUpdated.toObject({ virtuals: true });
      await webhook.sendNoteMarketUpdate({
        id: noteData.id,
        order: noteData.order,
        status: noteData.status,
        products: noteData.products,
        modifiedProducts: noteData.modifiedProducts || [],
        totalWeight: noteData.totalWeight,
        marketId: noteData.marketId,
        marketName: noteData.marketName,
        marketCompany: noteData.marketCompany,
        marketAttendant: noteData.marketAttendant,
        marketAddress: noteData.marketAddress,
        driverId: noteData.driverId,
        driverName: noteData.driverName,
        agency: noteData.agency,
        updatedDate: new Date()
      });
    } catch (err) {
      console.error(err?.stack || err?.message || err);
    }

    return noteMarketUpdated;
  },

  /**
   * Funcion para obtener las notas de mercado con paginación y filtros
   */
  dataTable: async (noteMarketParam) => {

    // resultados por página
    const pageSize = noteMarketParam.pageSize || 10;
    // Página: el page index de react-table-component
    const pageIndex = noteMarketParam.pageIndex || 1;

    //orden por defecto
    var sortBy = { createdDate: -1 };

    //Si esta el parametro se crea el objeto para ordenar adecuadamente
    if (noteMarketParam.sortBy) {
      let direction = noteMarketParam.sortBy.desc == true ? -1 : 1;
      sortBy = { [noteMarketParam.sortBy.id]: direction };
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
      {
        $lookup: {
          from: "markets",
          localField: "marketId",
          foreignField: "_id",
          as: "market",
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      {
        $lookup: {
          from: "operators",
          localField: "operator",
          foreignField: "_id",
          as: "operator",
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "driverId",
          foreignField: "_id",
          as: "driver",
        },
      },
      { $unwind: { path: "$agency", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$market", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$operator", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
      { $sort: sortBy },
    ];

    // Filtros para la consulta
    if (noteMarketParam.filters) {
      //Si hay filtro de sucursal
      if (noteMarketParam.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(noteMarketParam.filters.agency) },
        });
      }

      //Si hay filtro de usuario/cajero
      if (noteMarketParam.filters.user) {
        stages.unshift({
          $match: { user: ObjectId(noteMarketParam.filters.user) },
        });
      }

      //Si hay filtro de mercado
      if (noteMarketParam.filters.marketId) {
        stages.unshift({
          $match: { marketId: ObjectId(noteMarketParam.filters.marketId) },
        });
      }

      //Si hay filtro de conductor
      if (noteMarketParam.filters.driverId) {
        stages.unshift({
          $match: { driverId: ObjectId(noteMarketParam.filters.driverId) },
        });
      }

      //Si hay filtro por numero de orden
      if (noteMarketParam.filters.order) {
        stages.unshift({
          $match: { order: { $eq: parseInt(noteMarketParam.filters.order) } },
        });
      }

      //Si hay filtro por nombre de mercado
      if (noteMarketParam.filters.marketName) {
        let regex = new RegExp(noteMarketParam.filters.marketName, "gi");
        stages.unshift({
          $match: { marketName: { $regex: regex } },
        });
      }

      //Si hay filtro por compañía de mercado
      if (noteMarketParam.filters.marketCompany) {
        let regex = new RegExp(noteMarketParam.filters.marketCompany, "gi");
        stages.unshift({
          $match: { marketCompany: { $regex: regex } },
        });
      }

      //Si hay filtro por status
      if (noteMarketParam.filters.status) {
        stages.unshift({
          $match: { status: noteMarketParam.filters.status },
        });
      }

      //Si hay filtro por fechas
      if (noteMarketParam.filters.startDate && !noteMarketParam.filters.endDate) {
        const startDate = moment(noteMarketParam.filters.startDate)
          .startOf("day")
          .toDate();
        stages.unshift({
          $match: { createdDate: { $gte: startDate } },
        });
      }

      if (!noteMarketParam.filters.startDate && noteMarketParam.filters.endDate) {
        const endDate = moment(noteMarketParam.filters.endDate)
          .endOf("day")
          .toDate();
        stages.unshift({
          $match: { createdDate: { $lte: endDate } },
        });
      }

      if (
        noteMarketParam.filters.startDate &&
        noteMarketParam.filters.endDate
      ) {
        const startDate = moment(noteMarketParam.filters.startDate)
          .startOf("day")
          .toDate();
        const endDate = moment(noteMarketParam.filters.endDate)
          .endOf("day")
          .toDate();
        stages.unshift({
          $match: {
            createdDate: { $gte: startDate, $lte: endDate },
          },
        });
      }
    }

    //Si todos los filtros son vacios se consulta la fecha actual
    if (
      !noteMarketParam.filters ||
      (!noteMarketParam.filters.agency &&
        !noteMarketParam.filters.user &&
        !noteMarketParam.filters.marketId &&
        !noteMarketParam.filters.driverId &&
        !noteMarketParam.filters.order &&
        !noteMarketParam.filters.marketName &&
        !noteMarketParam.filters.marketCompany &&
        !noteMarketParam.filters.status &&
        !noteMarketParam.filters.startDate &&
        !noteMarketParam.filters.endDate)
    ) {
      const startDate = moment().startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();
      stages.unshift({
        $match: {
          createdDate: { $gte: startDate, $lte: endDate },
        },
      });
    }

    // Agregar paginación
    stages.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: pageSize * pageIndex - pageSize },
          { $limit: pageSize },
        ],
      },
    });

    //stage del total
    let stageTotal = [
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          totalWeight: { $sum: "$totalWeight" },
          totalDifferential: { $sum: "$totalDifferential" },
        },
      },
    ];

    // Aplicar mismos filtros al stageTotal (excepto fechas por defecto)
    if (noteMarketParam.filters) {
      if (noteMarketParam.filters.agency) {
        stageTotal.unshift({
          $match: { agency: ObjectId(noteMarketParam.filters.agency) },
        });
      }
      if (noteMarketParam.filters.user) {
        stageTotal.unshift({
          $match: { user: ObjectId(noteMarketParam.filters.user) },
        });
      }
      if (noteMarketParam.filters.marketId) {
        stageTotal.unshift({
          $match: { marketId: ObjectId(noteMarketParam.filters.marketId) },
        });
      }
      if (noteMarketParam.filters.driverId) {
        stageTotal.unshift({
          $match: { driverId: ObjectId(noteMarketParam.filters.driverId) },
        });
      }
      if (noteMarketParam.filters.order) {
        stageTotal.unshift({
          $match: { order: { $eq: parseInt(noteMarketParam.filters.order) } },
        });
      }
      if (noteMarketParam.filters.marketName) {
        let regex = new RegExp(noteMarketParam.filters.marketName, "gi");
        stageTotal.unshift({
          $match: { marketName: { $regex: regex } },
        });
      }
      if (noteMarketParam.filters.marketCompany) {
        let regex = new RegExp(noteMarketParam.filters.marketCompany, "gi");
        stageTotal.unshift({
          $match: { marketCompany: { $regex: regex } },
        });
      }
      if (noteMarketParam.filters.status) {
        stageTotal.unshift({
          $match: { status: noteMarketParam.filters.status },
        });
      }
      if (
        noteMarketParam.filters.startDate &&
        !noteMarketParam.filters.endDate
      ) {
        const startDate = moment(noteMarketParam.filters.startDate)
          .startOf("day")
          .toDate();
        stageTotal.unshift({
          $match: { createdDate: { $gte: startDate } },
        });
      }
      if (
        !noteMarketParam.filters.startDate &&
        noteMarketParam.filters.endDate
      ) {
        const endDate = moment(noteMarketParam.filters.endDate)
          .endOf("day")
          .toDate();
        stageTotal.unshift({
          $match: { createdDate: { $lte: endDate } },
        });
      }
      if (
        noteMarketParam.filters.startDate &&
        noteMarketParam.filters.endDate
      ) {
        const startDate = moment(noteMarketParam.filters.startDate)
          .startOf("day")
          .toDate();
        const endDate = moment(noteMarketParam.filters.endDate)
          .endOf("day")
          .toDate();
        stageTotal.unshift({
          $match: {
            createdDate: { $gte: startDate, $lte: endDate },
          },
        });
      }
    }

    const noteMarkets = await NoteMarket.aggregate(stages);

    let total = [];
    // Calcular totales si hay resultados
    if (
      (noteMarketParam.filters &&
        noteMarketParam.filters.startDate &&
        noteMarketParam.filters.endDate) ||
      (!noteMarketParam.filters ||
        (!noteMarketParam.filters.startDate &&
          !noteMarketParam.filters.endDate))
    ) {
      total = await NoteMarket.aggregate(stageTotal);
    }

    return {
      results: noteMarkets[0].data || [],
      metadata: noteMarkets[0].metadata || [{ total: 0 }],
      total: total[0] || { totalAmount: 0, totalWeight: 0, totalDifferential: 0 },
    };
  },
};

module.exports = noteMarketService;

