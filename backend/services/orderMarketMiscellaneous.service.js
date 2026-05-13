const db = require('../_helpers/db');
const OrderMarketMiscellaneous = db.OrderMarketMiscellaneous;
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const webhook = require('../_helpers/webhook');

let orderMarketMiscellaneousService = {
  /**
   * Obtener una orden de mercado misceláneos por ID
   * (para ver el detalle / updated en el front)
   *
   * @param {string} id
   */
  getOrderMarketMiscellaneous: async (id) => {
    const order = await OrderMarketMiscellaneous.findById(id)
      .populate('agency')
      .populate('user')
      .populate('seller')
      .populate('operator');

    if (!order) throw 'Orden de mercado misceláneos no encontrada';

    return order;
  },

  /**
   * Actualizar una orden de mercado misceláneos
   * (solo campos editables, sin tocar inventario)
   *
   * @param {string} id
   * @param {object} params
   */
  update: async (id, params) => {
    const order = await OrderMarketMiscellaneous.findById(id);

    if (!order) {
      throw 'Orden de mercado misceláneos no encontrada';
    }

    const toObjectIdSafe = (value) => {
      if (!value) return undefined;
      if (value instanceof mongoose.Types.ObjectId) return value;
      if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      return undefined;
    };

    const parseNumber = (value, fallback = 0) => {
      if (value === undefined || value === null || value === '') {
        return fallback;
      }
      const num = parseFloat(value);
      return Number.isNaN(num) ? fallback : num;
    };

    // Guardar productos originales ANTES de cualquier modificación (para revertir inventario)
    const originalProductsBeforeEdit = Array.isArray(order.products) 
      ? JSON.parse(JSON.stringify(order.products)) 
      : [];

    // Actualizar productos si vienen en params
    // Soportar tanto params.products como params.items (como en el front)
    const productsParam = Array.isArray(params.products)
      ? params.products
      : Array.isArray(params.items)
        ? params.items
        : [];

    let orderProducts = order.products;

    if (productsParam.length > 0) {
      // Normalizar productos (similar a noteMarket)
      const productsPopulated = await Promise.all(
        productsParam.map(async (item) => {
          if (!item || !item.id) {
            return null;
          }

          const productId = toObjectIdSafe(item.id);

          return {
            id: productId,
            code: item.code ?? '',
            name: item.name ?? '',
            presentation: item.presentation ?? '',
            price: parseNumber(item.price, 0),
            lastPrice: parseNumber(item.lastPrice, 0),
            kg: parseNumber(item.kg, 0),
            units: parseNumber(item.units, 0),
            total: parseNumber(item.total, 0),
            pz: parseNumber(item.pz, 0),
            image: item.image ?? null,
            updateDate: item.updateDate ? new Date(item.updateDate) : new Date(),
          };
        })
      );

      orderProducts = productsPopulated.filter(Boolean);
      order.products = orderProducts;
    }

    // Construir movimientos de inventario de misceláneos (similar a noteMarket)
    if (orderProducts.length > 0 && order.agency) {
      const InventoryRecord = db.MiscellaneousInventoryRecord;
      const Inventory = db.MiscellaneousInventory;
      const Miscellaneous = db.Miscellaneous;
      const enumIn = require('../enums/typeIn.enum');
      
      // Identificador único para esta orden (usando el order)
      const orderIdentifier = `ORDEN_MISC_${order.order || order._id}`;
      const orderNumber = order.order || order._id;
      const orderLabel = `Orden n° ${orderNumber}`;
      const baseComment = params.comment || order.comment || '';
      const orderComment = baseComment 
        ? `${baseComment} [${orderIdentifier}]`.trim()
        : `[${orderIdentifier}]`.trim();
      
      // Buscar registros de inventario anteriores relacionados con esta orden
      const existingRecords = await InventoryRecord.find({
        agency: order.agency,
        note: orderLabel,
        comment: { $regex: orderIdentifier, $options: 'i' },
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
            const newTotal = parseFloat(inventoryProduct.kg || 0) - parseFloat(record.in || 0);
            inventoryProduct.kg = Math.max(0, newTotal); // No permitir valores negativos
            await inventoryProduct.save();
          }

          // Eliminar el registro anterior
          await InventoryRecord.findByIdAndDelete(record._id);
        }
      }

      // Crear nuevos registros con los valores finales correctos
      // IMPORTANTE: Para inventario, basarnos en el CÓDIGO del producto,
      // no en el id que llegue desde el front (que puede variar según si se edita o no).
      // Buscamos el producto de misceláneos por código y usamos su _id real.
      const productsForInventoryRaw = await Promise.all(
        orderProducts.map(async (item) => {
          if (!item) return null;

          const finalKg = parseNumber(item.kg, 0);
          if (finalKg <= 0) return null;

          let productId = item.id;

          // Si viene código, intentamos resolver el producto real por código.
          if (item.code) {
            try {
              const miscProduct = await Miscellaneous.findOne({ code: item.code }).select('_id').lean();
              if (miscProduct && miscProduct._id) {
                productId = miscProduct._id;
              }
            } catch (e) {
              console.error('[ORDER_MARKET_MISC][UPDATE] Error buscando Miscellaneous por código para inventario:', e?.message || e);
            }
          }

          if (!productId) return null;

          return {
            id: productId,
            kg: finalKg, // Valor final, no la diferencia
            price: parseNumber(item.price, 0),
          };
        })
      );

      const productsForInventory = productsForInventoryRaw.filter(Boolean);

      // Procesar cada producto para actualizar inventario
      if (productsForInventory.length > 0) {
        for (const item of productsForInventory) {
          let inventoryProduct = await Inventory.findOne({
            product: item.id,
            agency: order.agency
          });

          // Si existe el producto en inventario se modifica
          if (inventoryProduct) {
            // Lo que está actualmente en kg más los kg entrantes
            const total = parseFloat(item.kg) + parseFloat(inventoryProduct.kg || 0);

            // Registrar la entrada en historial
            const inventoryRecordParam = {
              product: item.id,
              agency: order.agency,
              amountBefore: (inventoryProduct.kg || 0).toFixed(3), // Arrastrar kg anterior
              in: item.kg.toFixed(3), // Kgs entrantes
              out: 0,
              amountAfter: total.toFixed(3),
              note: orderLabel,
              comment: orderComment,
              price: item.price || 0,
              typeIn: enumIn.in.dispatch,
            };

            const record = new InventoryRecord(inventoryRecordParam);
            await record.save();

            // Actualizar kg en inventario
            inventoryProduct.kg = total;
            await inventoryProduct.save();
          } else {
            // Si no existe el producto en inventario se inserta
            const newProd = {
              product: item.id,
              agency: order.agency,
              kg: item.kg,
            };

            const inventory = new Inventory(newProd);
            await inventory.save();

            // Registrar la entrada inicial en historial
            const inventoryRecordParam = {
              product: item.id,
              agency: order.agency,
              amountBefore: 0,
              in: item.kg.toFixed(3), // Kgs entrantes
              out: 0,
              amountAfter: item.kg.toFixed(3), // Total el mismo
              note: orderLabel,
              comment: orderComment,
              price: item.price || 0,
              typeIn: enumIn.in.dispatch,
            };

            const record = new InventoryRecord(inventoryRecordParam);
            await record.save();
          }
        }
      }
    }

    // Totales y montos
    if (params.total !== undefined) {
      order.total = parseNumber(params.total, order.total);
    }

    if (params.totalWeight !== undefined) {
      order.totalWeight = parseNumber(params.totalWeight, order.totalWeight);
    }

    if (params.valueDollar !== undefined) {
      order.valueDollar = parseNumber(
        params.valueDollar,
        order.valueDollar ?? 0
      );
    }

    if (params.valueEur !== undefined) {
      order.valueEur = parseNumber(params.valueEur, order.valueEur ?? 0);
    }

    if (params.valueCop !== undefined) {
      order.valueCop = parseNumber(params.valueCop, order.valueCop ?? 0);
    }

    if (params.totalDollar !== undefined) {
      order.totalDollar = parseNumber(
        params.totalDollar,
        order.totalDollar ?? 0
      );
    }

    // Comentarios y estado
    if (params.comment !== undefined) {
      order.comment = params.comment;
    }

    if (params.status !== undefined) {
      order.status = params.status;
    }

    // Auditoría local
    if (params.audit !== undefined) {
      order.audit = Boolean(params.audit);
    }

    if (params.commentAudit !== undefined) {
      order.commentAudit = params.commentAudit;
    }

    // Historial de productos modificados (similar a noteMarket.update)
    if (Array.isArray(params.modifiedProducts)) {
      /**
       * Queremos que el "original" (before) NO se modifique nunca.
       * - Si ya existe un registro de modifiedProducts para ese producto+tipo,
       *   reutilizamos su "before" y solo actualizamos el "after".
       * - Si no existe, creamos ambos (before y after) por primera vez.
       */

      const existingModified = Array.isArray(order.modifiedProducts)
        ? order.modifiedProducts
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
        lastPrice: parseNumber(data.lastPrice, 0),
        kg: parseNumber(data.kg, 0),
        units: parseNumber(data.units, 0),
        total: parseNumber(data.total, 0),
        pz: parseNumber(data.pz, 0),
        image: data.image ?? null,
        updateDate: data.updateDate ? new Date(data.updateDate) : null,
      });

      const updatedMap = new Map(existingMap);

      params.modifiedProducts.forEach((entry) => {
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
            // Buscar el producto original en los productos de la orden ANTES de la edición
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
                lastPrice: originalProduct.lastPrice,
                kg: originalProduct.kg,
                units: originalProduct.units,
                total: originalProduct.total,
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

      order.modifiedProducts = Array.from(updatedMap.values());
    }
    
    // Market / agencia y relaciones
    if (params.marketId) {
      const marketObjectId = toObjectIdSafe(params.marketId);
      if (marketObjectId) {
        order.marketId = marketObjectId;
        order.agency = marketObjectId;
      }
    }

    if (params.marketName !== undefined) {
      order.marketName = params.marketName;
    }

    if (params.marketCompany !== undefined) {
      order.marketCompany = params.marketCompany;
    }

    if (params.marketAttendant !== undefined) {
      order.marketAttendant = params.marketAttendant;
    }

    if (params.marketAddress !== undefined) {
      order.marketAddress = params.marketAddress;
    }

    if (params.driverId) {
      const driverObjectId = toObjectIdSafe(params.driverId);
      if (driverObjectId) {
        order.driverId = driverObjectId;
      }
    }

    if (params.driverName !== undefined) {
      order.driverName = params.driverName;
    }

    if (params.seller) {
      const sellerObjectId = toObjectIdSafe(params.seller);
      if (sellerObjectId) {
        order.seller = sellerObjectId;
      }
    }

    if (params.operator) {
      const operatorObjectId = toObjectIdSafe(params.operator);
      if (operatorObjectId) {
        order.operator = operatorObjectId;
      }
    }

    if (params.userName !== undefined) {
      order.userName = params.userName;
    }

    const orderUpdated = await order.save();

    if (!orderUpdated) {
      throw 'Error actualizando la orden de mercado misceláneos';
    }

    // Enviar webhook al backend de fábrica
    try {
      const orderData = orderUpdated.toObject({ virtuals: true });
      await webhook.sendOrderMarketMiscellaneousUpdate({
        id: orderData.id || orderData._id,
        orderId: orderData.id || orderData._id,
        order: orderData.order,
        products: orderData.products || [],
        modifiedProducts: orderData.modifiedProducts || [],
        agency: orderData.agency,
        user: orderData.user,
        userName: orderData.userName || '',
        total: orderData.total || 0,
        totalWeight: orderData.totalWeight || 0,
        valueDollar: orderData.valueDollar || 0,
        valueEur: orderData.valueEur || 0,
        valueCop: orderData.valueCop || 0,
        totalDollar: orderData.totalDollar || 0,
        seller: orderData.seller,
        operator: orderData.operator,
        comment: orderData.comment || '',
        marketId: orderData.marketId,
        marketName: orderData.marketName || '',
        marketCompany: orderData.marketCompany || '',
        marketAttendant: orderData.marketAttendant || '',
        marketAddress: orderData.marketAddress || '',
        driverId: orderData.driverId,
        driverName: orderData.driverName || '',
        status: orderData.status || 'pending',
        invoice: orderData.invoice || false,
        audit: orderData.audit || false,
        commentAudit: orderData.commentAudit || '',
        updatedDate: new Date()
      });
    } catch (err) {
      console.error('[ORDER_MARKET_MISCELLANEOUS][WEBHOOK] Error enviando webhook:', err?.stack || err?.message || err);
    }

    return orderUpdated;
  },

  /**
   * Tabla de órdenes de mercado misceláneos con paginación y filtros
   * (basado en noteMarketService.dataTable)
   *
   * @param {object} params
   */
  dataTable: async (params) => {
    const pageSize = params.pageSize || 10;
    const pageIndex = params.pageIndex || 1;

    // Orden por defecto
    let sortBy = { createdDate: -1 };

    if (params.sortBy) {
      const direction = params.sortBy.desc === true ? -1 : 1;
      sortBy = { [params.sortBy.id]: direction };
    }

    const stages = [
      {
        $lookup: {
          from: 'agencies',
          localField: 'agency',
          foreignField: '_id',
          as: 'agency',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'markets',
          localField: 'marketId',
          foreignField: '_id',
          as: 'market',
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
        },
      },
      {
        $lookup: {
          from: 'operators',
          localField: 'operator',
          foreignField: '_id',
          as: 'operator',
        },
      },
      {
        $lookup: {
          from: 'drivers',
          localField: 'driverId',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: { path: '$agency', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$market', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$operator', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
      { $sort: sortBy },
    ];

    // Filtros
    if (params.filters) {
      if (params.filters.agency) {
        stages.unshift({
          $match: { agency: ObjectId(params.filters.agency) },
        });
      }

      if (params.filters.user) {
        stages.unshift({
          $match: { user: ObjectId(params.filters.user) },
        });
      }

      if (params.filters.marketId) {
        stages.unshift({
          $match: { marketId: ObjectId(params.filters.marketId) },
        });
      }

      if (params.filters.driverId) {
        stages.unshift({
          $match: { driverId: ObjectId(params.filters.driverId) },
        });
      }

      if (params.filters.order) {
        stages.unshift({
          $match: { order: { $eq: parseInt(params.filters.order) } },
        });
      }

      if (params.filters.marketName) {
        const regex = new RegExp(params.filters.marketName, 'gi');
        stages.unshift({
          $match: { marketName: { $regex: regex } },
        });
      }

      if (params.filters.marketCompany) {
        const regex = new RegExp(params.filters.marketCompany, 'gi');
        stages.unshift({
          $match: { marketCompany: { $regex: regex } },
        });
      }

      if (
        params.filters.status &&
        Array.isArray(params.filters.status) &&
        params.filters.status.length > 0
      ) {
        stages.unshift({
          $match: { status: { $in: params.filters.status } },
        });
      }

      // Filtro por fechas
      if (params.filters.startDate && !params.filters.endDate) {
        const startDate = moment(params.filters.startDate)
          .startOf('day')
          .toDate();
        stages.unshift({
          $match: { createdDate: { $gte: startDate } },
        });
      }

      if (!params.filters.startDate && params.filters.endDate) {
        const endDate = moment(params.filters.endDate).endOf('day').toDate();
        stages.unshift({
          $match: { createdDate: { $lte: endDate } },
        });
      }

      if (params.filters.startDate && params.filters.endDate) {
        const startDate = moment(params.filters.startDate)
          .startOf('day')
          .toDate();
        const endDate = moment(params.filters.endDate)
          .endOf('day')
          .toDate();
        stages.unshift({
          $match: {
            createdDate: { $gte: startDate, $lte: endDate },
          },
        });
      }
    }

    // Si no hay filtros, usar fecha actual por defecto
    if (
      !params.filters ||
      (!params.filters.agency &&
        !params.filters.user &&
        !params.filters.marketId &&
        !params.filters.driverId &&
        !params.filters.order &&
        !params.filters.marketName &&
        !params.filters.marketCompany &&
        (!params.filters.status ||
          (Array.isArray(params.filters.status) &&
            params.filters.status.length === 0)) &&
        !params.filters.startDate &&
        !params.filters.endDate)
    ) {
      const startDate = moment().startOf('day').toDate();
      const endDate = moment().endOf('day').toDate();
      stages.unshift({
        $match: {
          createdDate: { $gte: startDate, $lte: endDate },
        },
      });
    }

    // Paginación
    stages.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: pageSize * pageIndex - pageSize },
          { $limit: pageSize },
        ],
      },
    });

    // Pipeline para totales
    let stageTotal = [
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          totalWeight: { $sum: '$totalWeight' },
          totalDollar: { $sum: '$totalDollar' },
        },
      },
    ];

    if (params.filters) {
      if (params.filters.agency) {
        stageTotal.unshift({
          $match: { agency: ObjectId(params.filters.agency) },
        });
      }
      if (params.filters.user) {
        stageTotal.unshift({
          $match: { user: ObjectId(params.filters.user) },
        });
      }
      if (params.filters.marketId) {
        stageTotal.unshift({
          $match: { marketId: ObjectId(params.filters.marketId) },
        });
      }
      if (params.filters.driverId) {
        stageTotal.unshift({
          $match: { driverId: ObjectId(params.filters.driverId) },
        });
      }
      if (params.filters.order) {
        stageTotal.unshift({
          $match: { order: { $eq: parseInt(params.filters.order) } },
        });
      }
      if (params.filters.marketName) {
        const regex = new RegExp(params.filters.marketName, 'gi');
        stageTotal.unshift({
          $match: { marketName: { $regex: regex } },
        });
      }
      if (params.filters.marketCompany) {
        const regex = new RegExp(params.filters.marketCompany, 'gi');
        stageTotal.unshift({
          $match: { marketCompany: { $regex: regex } },
        });
      }
      if (
        params.filters.status &&
        Array.isArray(params.filters.status) &&
        params.filters.status.length > 0
      ) {
        stageTotal.unshift({
          $match: { status: { $in: params.filters.status } },
        });
      }
      if (params.filters.startDate && !params.filters.endDate) {
        const startDate = moment(params.filters.startDate)
          .startOf('day')
          .toDate();
        stageTotal.unshift({
          $match: { createdDate: { $gte: startDate } },
        });
      }
      if (!params.filters.startDate && params.filters.endDate) {
        const endDate = moment(params.filters.endDate).endOf('day').toDate();
        stageTotal.unshift({
          $match: { createdDate: { $lte: endDate } },
        });
      }
      if (params.filters.startDate && params.filters.endDate) {
        const startDate = moment(params.filters.startDate)
          .startOf('day')
          .toDate();
        const endDate = moment(params.filters.endDate)
          .endOf('day')
          .toDate();
        stageTotal.unshift({
          $match: {
            createdDate: { $gte: startDate, $lte: endDate },
          },
        });
      }
    }

    const orders = await OrderMarketMiscellaneous.aggregate(stages);

    let total = [];
    if (
      (params.filters &&
        params.filters.startDate &&
        params.filters.endDate) ||
      !params.filters ||
      (!params.filters.startDate && !params.filters.endDate)
    ) {
      total = await OrderMarketMiscellaneous.aggregate(stageTotal);
    }

    return {
      results: orders[0]?.data || [],
      metadata: orders[0]?.metadata || [{ total: 0 }],
      total:
        total[0] || { totalAmount: 0, totalWeight: 0, totalDollar: 0 },
    };
  },
};

module.exports = orderMarketMiscellaneousService;

