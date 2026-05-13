const db = require('../_helpers/db');
const Invoice = db.Invoice;
const InventoryFiscal = db.InventoryFiscal;
const InventoryRecordFiscal = db.InventoryRecordFiscal;
const enumOut = require('../enums/typeOut.enum'); 
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

const { Agency } = require("../_helpers/db");

let invoiceService = {
  /**
   * Crea o actualiza una factura a partir del payload recibido por webhook
   * desde el backend de fábrica.
   *
   * - Usa externalId (data.id) y/o controlNumber como claves de búsqueda.
   * - Mapea los productos y totales al esquema local de Invoice.
   *
   * @param {Object} payload - Payload completo del webhook
   * @returns {Promise<Invoice>} - Factura creada/actualizada
   */
  syncInvoiceFromWebhook: async (payload) => {
    if (!payload || !payload.data) {
      throw new Error('Payload inválido: falta campo data');
    }

    const data = payload.data;

    // Helper para convertir a ObjectId de forma segura
    const toObjectId = (value) => {
      if (!value) return null;
      if (value instanceof ObjectId) return value;
      if (ObjectId.isValid(value)) {
        return new ObjectId(value);
      }
      return null;
    };

    // Resolver agencia: puede venir como agency (ObjectId), agencyId o dentro de market
    let agencyId = data.agency || data.agencyId || (data.market && (data.market.agencyId || data.market.id));
    const resolvedAgency = toObjectId(agencyId);

    // Resolver usuario si viene
    const resolvedUser = toObjectId(data.user);

    // Mapear productos al esquema local
    const products = Array.isArray(data.products) ? data.products.map(p => ({
      decrease: !!p.decrease,
      reweigh: !!p.reweigh,
      mincemeat: !!p.mincemeat,
      exempt: !!p.exempt,
      taxed: !!p.taxed,
      lastPrice: Number(p.lastPrice || 0),
      wholesalePrice: Number(p.wholesalePrice || 0),
      lastWholesalePrice: Number(p.lastWholesalePrice || 0),
      minWeight: Number(p.minWeight || 0),
      wholesaleDiscountPrice: Number(p.wholesaleDiscountPrice || 0),
      applyWholesaleDiscount: !!p.applyWholesaleDiscount,
      minWeightWholesaleDiscount: Number(p.minWeightWholesaleDiscount || 0),
      image: p.image || null,
      updateDate: p.updateDate ? new Date(p.updateDate) : null,
      code: p.code,
      name: p.name,
      presentation: p.presentation,
      price: Number(p.price || p.unitPrice || 0),
      createdDate: p.createdDate ? new Date(p.createdDate) : (data.createdDate ? new Date(data.createdDate) : new Date()),
      id: p.id,
      kg: Number(p.kg || 0),
      units: Number(p.units || 0),
      unitPrice: Number(p.unitPrice || 0),
      regularPrice: Number(p.regularPrice || 0),
      total: Number(p.total || 0),
      differential: Number(p.differential || 0),
      wholesaleDiscountDifferential: Number(p.wholesaleDiscountDifferential || 0),
      totalDifferential: Number(p.totalDifferential || 0),
      isOffer: !!p.isOffer,
    })) : [];

    const totals = data.totals || {};

    const invoiceData = {
      address: data.address || '',
      agency: resolvedAgency,
      order: data.order || null,
      externalId: data.id || null,
      controlNumber: data.controlNumber,
      date: data.date ? new Date(data.date) : new Date(),
      createdDate: data.createdDate ? new Date(data.createdDate) : (data.date ? new Date(data.date) : new Date()),
      document: data.document || '',
      documentType: data.documentType || '',
      names: data.names || '',
      products,
      totals: {
        taxableBase: Number(totals.taxableBase || 0),
        iva: Number(totals.iva || 0),
        exempt: Number(totals.exempt || 0),
        totalAmount: Number(totals.totalAmount || 0),
      },
      user: resolvedUser,
      isAnulated: !!data.isAnulated,
      percentage: data.percentage != null ? Number(data.percentage) : null,
      market: data.market || null,
      source: payload.source || null,
      webhookTimestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    };

    // Filtro de búsqueda: primero por externalId, luego por controlNumber
    const filter = {};
    if (invoiceData.externalId) {
      filter.externalId = invoiceData.externalId;
    } else if (invoiceData.controlNumber) {
      filter.controlNumber = invoiceData.controlNumber;
    } else {
      // Si no hay ningún identificador fiable, creamos siempre una nueva
      filter._id = new ObjectId();
      invoiceData._id = filter._id;
    }

    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    };

    const invoice = await Invoice.findOneAndUpdate(
      filter,
      { $set: invoiceData },
      options
    );

    return invoice;
  },
 /**
 * Genera una tabla de facturas basada en parámetros de filtro
 * @param {Object} invoiceParam
 */


  invoiceTable: async (invoiceParam) => {


  const pageSize = invoiceParam.pageSize || 10; // Número de resultados por página
  const pageIndex = invoiceParam.pageIndex || 1; // Página actual
  let sortBy = { createdDate: -1 }; // Orden por defecto

  // Si se pasa el parámetro de orden, se crea el objeto para ordenar adecuadamente
  if (invoiceParam.sortBy) {
    let direction = invoiceParam.sortBy.desc === true ? -1 : 1;
    sortBy = { [invoiceParam.sortBy.id]: direction };
  }

  // Construcción inicial del pipeline
  const stages = [];

  // Restricción por rol de usuario:
  // - Si role === 3, solo puede ver facturas de su propia agencia
  if (invoiceParam.user && invoiceParam.user.role === 3 && invoiceParam.user.agency) {
    stages.push({
      $match: { 'market.agencyId': invoiceParam.user.agency },
    });
  }

  // Filtros dinámicos
  if (invoiceParam.filters) {
    const filters = invoiceParam.filters;

    // Filtro por agencia:
    // El frontend envía el agencyId (string) y en la factura está dentro de market.agencyId
    if (filters.agency) {
      stages.push({
        $match: { 'market.agencyId': filters.agency },
      });
    }

    if (filters.ticket) {
      const ticket = filters.ticket;  // No lo conviertas a número
      stages.push({
        $match: { controlNumber: ticket },  // Comparar directamente como string
      });
    }

    // Filtro por fechas (startDate y endDate)
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(`${filters.startDate}T00:00:00Z`);
      const endDate = new Date(`${filters.endDate}T23:59:59Z`);
      stages.push({
        $match: { date: { $gte: startDate, $lte: endDate } },
      });
    }
  }

  

  // Agregar el lookup para obtener el nombre de la agencia
  stages.push({
    $lookup: {
      from: 'agencies', // Nombre de la colección de agencias
      localField: 'agency', // Campo en la factura que hace referencia a la agencia
      foreignField: '_id', // Campo en la agencia que corresponde al ObjectId
      as: 'agencyDetails', // Nombre del campo en el resultado donde se incluirán los detalles de la agencia
    },
  });

  // Desestructurar la información de la agencia (suponiendo que solo hay una agencia asociada)
  stages.push({
    $unwind: {
      path: '$agencyDetails',
      preserveNullAndEmptyArrays: true, // Si no hay agencia asociada, se mantiene el campo como null
    },
  });

  
  try {
    // Agregación con paginación
    const invoice = await Invoice.aggregate([
      ...stages,
      { $sort: sortBy },
      { $skip: (pageIndex - 1) * pageSize },
      { $limit: pageSize },
    ]);

    // Contar el total de documentos (sin paginación)
    const total = await Invoice.countDocuments(stages[0]?.$match || {});


    return {
      results: invoice.map((invoice) => ({
        ...invoice,
        agencyName: invoice.agencyDetails ? invoice.agencyDetails.name : null, // Nombre de la agencia
      })),
      metadata: {
        total,
        pageSize,
        pageIndex,
      },
    };
  } catch (error) {
    console.error('Error en invoiceTable:', error.message, error.stack);
    throw error;
  }
},
invoiceTotalsByAgencyMonthly: async (invoiceParam) => {



  const filters = invoiceParam.filters || {};
  const stages = [];

  // Restricción por rol de usuario:
  // - Si role === 3, solo puede ver facturas de su propia agencia
  if (invoiceParam.user && invoiceParam.user.role === 3 && invoiceParam.user.agency) {
    stages.push({
      $match: { 'market.agencyId': invoiceParam.user.agency },
    });
  }

  // Filtro por fechas
  if (filters.startDate && filters.endDate) {
    const startDate = new Date(`${filters.startDate}T00:00:00Z`);
    const endDate = new Date(`${filters.endDate}T23:59:59Z`);
    stages.push({
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    });
  }

  stages.push({
    $match: {
      isAnulated: { $ne: true }
    }
  });

  // Filtro por nombre de empresa (company) - buscar en market.company
  if (filters.company) {
    stages.push({
      $match: {
        'market.company': { $regex: filters.company, $options: 'i' } // Búsqueda insensible a mayúsculas
      }
    });
  }

   // Lookup para obtener los detalles de la agencia
   stages.push({
    $lookup: {
      from: 'agencies', // Colección de agencias
      localField: 'agency', // El campo de la agencia en la factura
      foreignField: '_id', // El campo correspondiente en la colección de agencias
      as: 'agencyDetails'
    }
  });

  // Unwind de los detalles de la agencia
  stages.push({
    $unwind: {
      path: '$agencyDetails',
      preserveNullAndEmptyArrays: true
    }
  });

 // Agrupar por company (usando market.company)
 stages.push({
  $group: {
    _id: '$market.company', 
    agencyName: { $first: '$market.name'},
    companyName: { $first: '$market.company' },
    totalAmount: { $sum: '$totals.totalAmount' },
    taxableBase: { $sum: '$totals.taxableBase' },
    iva: { $sum: '$totals.iva' },
    exempt: { $sum: '$totals.exempt' },
    invoices: {
      $push: {
        _id: '$_id',
        controlNumber: '$controlNumber',
        date: '$date',
        document: '$document',
        names: '$names',
        totals: '$totals',
        agencyName: '$market.name' 
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
    invoices: 1,
    _id: 0
  }
});

 

  try {
    const results = await Invoice.aggregate(stages);
    return { results };
  } catch (error) {
    console.error('Error en invoiceTotalsByAgencyMonthly:', error.message);
    throw error;
  }

},
/**
 * Calcula estadísticas de facturas agrupadas por compañía y sucursal
 * @param {Object} invoiceParam - Parámetros de filtro (filters, user, etc.)
 * @returns {Promise<Object>} - Estadísticas por compañía y sucursal
 */
invoiceStatsByCompanyAndBranch: async (invoiceParam) => {

  
  const filters = invoiceParam.filters || {};
  const stages = [];

  // Restricción por rol de usuario:
  // - Si role === 3, solo puede ver facturas de su propia agencia
  if (invoiceParam.user && invoiceParam.user.role === 3 && invoiceParam.user.agency) {
    stages.push({
      $match: { 'market.agencyId': invoiceParam.user.agency },
    });
  }

  // Filtro por fechas
  if (filters.startDate && filters.endDate) {
    const startDate = new Date(`${filters.startDate}T00:00:00Z`);
    const endDate = new Date(`${filters.endDate}T23:59:59Z`);
    stages.push({
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    });
  }

  // Excluir facturas anuladas
  stages.push({
    $match: {
      isAnulated: { $ne: true }
    }
  });

  // Filtro por nombre de empresa (company)
  if (filters.company) {
    stages.push({
      $match: {
        'market.company': { $regex: filters.company, $options: 'i' }
      }
    });
  }

  // Filtro por agencia/sucursal
  if (filters.agency) {
    stages.push({
      $match: { 'market.agencyId': filters.agency },
    });
  }

  // Lookup para obtener los detalles de la agencia
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
      preserveNullAndEmptyArrays: true
    }
  });

  // Primero calculamos el total general para calcular porcentajes después
  const totalGeneralStage = [
    ...stages,
    {
      $group: {
        _id: null,
        totalGeneralAmount: { $sum: '$totals.totalAmount' },
        totalGeneralCount: { $sum: 1 }
      }
    }
  ];

  // Determinar si se debe agrupar solo por compañía o por compañía y sucursal
  // Si hay filtro de company pero NO hay filtro de agency, agrupar solo por compañía
  const groupByCompanyOnly = filters.company && !filters.agency;

  // Agrupar según el caso
  if (groupByCompanyOnly) {
    // Agrupar solo por compañía (sumar todas las sucursales)
    stages.push({
      $group: {
        _id: {
          company: '$market.company'
        },
        companyName: { $first: '$market.company' },
        totalExempt: { $sum: '$totals.exempt' },
        totalTaxableBase: { $sum: '$totals.taxableBase' },
        totalIva: { $sum: '$totals.iva' },
        totalAmount: { $sum: '$totals.totalAmount' },
        invoiceCount: { $sum: 1 },
        // Calcular el promedio del campo percentage
        averagePercentage: {
          $avg: {
            $cond: [
              { $ne: ['$percentage', null] },
              '$percentage',
              null
            ]
          }
        }
      }
    });
  } else {
    // Agrupar por compañía y sucursal
    stages.push({
      $group: {
        _id: {
          company: '$market.company',
          branchName: '$market.name',
          agencyId: '$market.agencyId'
        },
        companyName: { $first: '$market.company' },
        branchName: { $first: '$market.name' },
        agencyId: { $first: '$market.agencyId' },
        totalExempt: { $sum: '$totals.exempt' },
        totalTaxableBase: { $sum: '$totals.taxableBase' },
        totalIva: { $sum: '$totals.iva' },
        totalAmount: { $sum: '$totals.totalAmount' },
        invoiceCount: { $sum: 1 },
        // Calcular el promedio del campo percentage
        averagePercentage: {
          $avg: {
            $cond: [
              { $ne: ['$percentage', null] },
              '$percentage',
              null
            ]
          }
        }
      }
    });
  }

  // Calcular promedio por factura
  stages.push({
    $addFields: {
      averagePerInvoice: {
        $cond: [
          { $gt: ['$invoiceCount', 0] },
          { $divide: ['$totalAmount', '$invoiceCount'] },
          0
        ]
      },
      // Formatear el promedio de percentage con 2 decimales
      averagePercentage: {
        $cond: [
          { $ne: ['$averagePercentage', null] },
          { $round: ['$averagePercentage', 2] },
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
        invoiceCount: 1,
        averagePerInvoice: 1,
        averagePercentage: 1,
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
        invoiceCount: 1,
        averagePerInvoice: 1,
        averagePercentage: 1,
        _id: 0
      }
    });
  }

  try {
    // Obtener el total general
    const totalGeneralResult = await Invoice.aggregate(totalGeneralStage);
    const totalGeneralAmount = totalGeneralResult[0]?.totalGeneralAmount || 0;
    const totalGeneralCount = totalGeneralResult[0]?.totalGeneralCount || 0;
    const averageGeneral = totalGeneralCount > 0 ? totalGeneralAmount / totalGeneralCount : 0;

    // Obtener los resultados agrupados
    const results = await Invoice.aggregate(stages);

    return { 
      results,
      metadata: {
        totalGeneralAmount,
        totalGeneralCount,
        averageGeneral
      }
    };
  } catch (error) {
    console.error('Error en invoiceStatsByCompanyAndBranch:', error.message, error.stack);
    throw error;
  }
},
updateInvoice: async (id, updateFields) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('ID de factura no válido');
  }

  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      throw new Error('Factura no encontrada');
    }

    return updatedInvoice;
  } catch (error) {
    console.error('Error al actualizar la factura:', error.message, error.stack);
    throw error;
  }
},
getInvoiceById: async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('ID de factura no válido');
  }

  try {
    const invoice = await Invoice.findById(id).populate('agency');
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    return invoice;
  } catch (error) {
    console.error('Error al obtener la factura:', error.message);
    throw error;
  }
},
anulateInvoice: async (id, comment) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('ID de factura no válido');
  }
  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
       if (invoice.isAnulated) {
      throw new Error('La factura ya ha sido anulada');
    }

    if (comment) {
      invoice.anulationComment = comment; 
    }

    invoice.isAnulated = true;
    await invoice.save();

    if (Array.isArray(invoice.products)) {
      for (const product of invoice.products) {
        if (!product.id || !product.kg) continue;

        const inventory = await InventoryFiscal.findOne({
          product: product.id,
          agency: invoice.agency,
        });

        if (!inventory) {
          console.warn(`Inventario no encontrado para el producto ${product.name}`);
          continue;
        }

        const previousKg = parseFloat(inventory.kg);
        const discountKg = parseFloat(product.kg);
        const newKg = (previousKg - discountKg).toFixed(3);
        inventory.kg = newKg;

        await inventory.save();

        const record = new InventoryRecordFiscal({
          product: inventory.product,
          agency: inventory.agency,
          kg: previousKg,
          in: 0,
          out: discountKg,
          total: newKg,
          note: `Descuento por anulación de factura ${invoice.controlNumber || invoice._id}`,
          type: enumOut.out.reweigh, 
        });

        const recordSaved = await record.save();
        if (!recordSaved) {
          throw new Error(`Error registrando el movimiento de inventario para ${product.name}`);
        }
      }
    }

    return invoice;
  } catch (error) {
    console.error('Error al anular la factura:', error.message);
    throw error;
  }
}
};

module.exports = invoiceService;
