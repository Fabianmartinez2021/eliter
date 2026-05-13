const db = require("../_helpers/db");
const Sales = db.Sales;
const Agency = db.Agency;
const userService = require('./user.service');
const moment = require("moment");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

let weeklyReportService = {
  /**
   * Función para obtener el total semanal en tiempo real desde el lunes hasta hoy
   * Metas al detal: preferencia por campos de la sucursal (Agency); si no, Seller.
   * 
   * @param {Object} salesParam - Parámetros de la consulta
   * @returns {Object} Resultado con totales y cálculos de metas
   */
  getWeeklyTotalRealtime: async (salesParam) => {

    // TOTAL SEMANAL EN TIEMPO REAL DESDE EL LUNES HASTA HOY
    // Calcula directamente desde las ventas (Sales) sin depender de PaymentMethodsRecord

    // Calcular el lunes de la semana actual usando hora de Venezuela (UTC-4)
    // Primero obtenemos el momento actual en hora de Venezuela
    const nowVenezuela = moment().utc().subtract(4, "hours");
    const currentDayOfTheWeek = nowVenezuela.day(); // 0 = domingo, 1 = lunes, etc.
    
    // Calcular cuántos días restar para llegar al lunes
    const daysToSubtract = currentDayOfTheWeek === 0 ? 6 : currentDayOfTheWeek - 1;
    
    // Calcular el lunes de la semana actual (inicio del día en hora de Venezuela)
    const startDate = nowVenezuela.clone()
      .subtract(daysToSubtract, "days")
      .startOf("day");
    
    // Fecha final: día actual (hasta el final del día en hora de Venezuela)
    const endDate = nowVenezuela.clone().endOf("day");

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

    // Agregación para calcular los totales semanales desde Sales
    let stages = [
      {
        $match: {
          createdDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          // Excluir tipos de vales: 10 (vale al mayor), 11 (Abono Vale), 12 (Credito Vale), 13 (Salvado Vale)
          type: { $nin: [2, 6, 10, 11, 12, 13] },
        },
      },
      {
        $group: {
          _id: {
            agency: "$agency",
          },
          // Total de ingresos en bs (excluyendo créditos)
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
          // Total de ventas (excluyendo créditos y abonos)
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
          // Totales por forma de pago
          totalVes: { $sum: "$ves" },
          totalDollar: { $sum: "$dollar" },
          totalEur: { $sum: "$eur" },
          totalCop: { $sum: "$cop" },
          totalTransfer: { $sum: "$tAmmount" },
          totalPos: {
            $sum: {
              $add: [
                { $ifNull: ["$pAmmount", 0] },
                { $ifNull: ["$pAmmountExtra", 0] },
              ],
            },
          },
          // Totales en bolivares
          totalDollarVes: { $sum: { $multiply: ["$dollar", "$valueDollar"] } },
          totalEurVes: { $sum: { $multiply: ["$eur", "$valueEur"] } },
          totalCopVes: { $sum: { $divide: ["$cop", "$valueCop"] } },
          // Total en créditos
          totalCredit: {
            $sum: { $cond: [{ $eq: ["$isCredit", true] }, "$total", 0] },
          },
          // Total en abonos
          totalSumation: {
            $sum: { $cond: [{ $eq: ["$isSumation", true] }, "$total", 0] },
          },
          // Tipos de cambio (último valor registrado)
          valueDollar: { $last: "$valueDollar" },
          valueEur: { $last: "$valueEur" },
          valueCop: { $last: "$valueCop" },
          // Total de clientes atendidos
          totalClients: { $sum: 1 },
          // Información de la agencia
          agency: { $first: "$agency" },
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
      { $sort: { totalAmount: -1 } },
    ];

    // Siempre filtrar por la agencia solicitada, priorizando:
    // 1) salesParam.agency (la que envías explícitamente)
    // 2) salesParam.user.agency
    // 3) salesParam.filters.agency
    let agencyId = null;
    if (salesParam && salesParam.agency) {
      agencyId = ObjectId(salesParam.agency);
      stages.unshift({
        $match: { agency: agencyId },
      });
    } else if (salesParam && salesParam.user && salesParam.user.agency) {
      agencyId = ObjectId(salesParam.user.agency);
      stages.unshift({
        $match: { agency: agencyId },
      });
    } else if (salesParam && salesParam.filters && salesParam.filters.agency) {
      agencyId = ObjectId(salesParam.filters.agency);
      stages.unshift({
        $match: { agency: agencyId },
      });
    }

    const results = await Sales.aggregate(stages);

    // Crear un resultado base aunque no haya ventas, para que los cálculos
    // de metas semanales se hagan siempre tomando 0 como base en lugar de null
    let result;
    if (!results || results.length === 0) {
      result = {
        totalAmount: 0,
        totalSell: 0,
        totalVes: 0,
        totalDollar: 0,
        totalEur: 0,
        totalCop: 0,
        totalTransfer: 0,
        totalPos: 0,
        totalDollarVes: 0,
        totalEurVes: 0,
        totalCopVes: 0,
        totalCredit: 0,
        totalSumation: 0,
        totalClients: 0,
        agency: agencyId ? { _id: agencyId } : null,
      };
    } else {
      // Obtener solo el primer resultado (solo habrá uno porque se filtra por agencia)
      result = results[0];
    }

    // Calcular totalAmountBox (total en caja en bolivares)
    result.totalAmountBox =
      (result.totalVes || 0) +
      (result.totalTransfer || 0) +
      (result.totalPos || 0) +
      (result.totalDollarVes || 0) +
      (result.totalEurVes || 0) +
      (result.totalCopVes || 0);

    // Obtener el Seller asociado a la agencia para calcular las metas semanales
    let weeklyGoalCalculation = null;
    
    // Si no se estableció agencyId antes, usar el del resultado
    if (!agencyId && result && result.agency && result.agency._id) {
      agencyId = ObjectId(result.agency._id);
    }
    
    if (agencyId) {
      try {
        const agencyDoc = await Agency.findById(agencyId).lean();
        const useAgencyWeekly =
          agencyDoc &&
          (agencyDoc.applyForWeeklyGoal === true ||
            (agencyDoc.weeklyGoal != null && Number(agencyDoc.weeklyGoal) > 0));

        const totalAmountValue = parseFloat(result.totalAmount) || 0;

        if (useAgencyWeekly) {
          const weeklyGoalValue =
            Number(agencyDoc.weeklyGoal) > 0
              ? Number(agencyDoc.weeklyGoal)
              : 100000;
          const minimumPercentage =
            agencyDoc.weeklyGoalMinimumPercentageOfSales != null
              ? Number(agencyDoc.weeklyGoalMinimumPercentageOfSales)
              : 80;
          const weeklyGoalPercentage =
            weeklyGoalValue > 0
              ? (totalAmountValue / weeklyGoalValue) * 100
              : 0;
          const weeklyGoalReached = weeklyGoalPercentage >= minimumPercentage;

          weeklyGoalCalculation = {
            weeklyGoal: weeklyGoalValue,
            weeklyGoalMinimumPercentageOfSales: minimumPercentage,
            totalAmount: totalAmountValue,
            weeklyGoalPercentage: parseFloat(weeklyGoalPercentage.toFixed(2)),
            weeklyGoalReached,
            calculation: `${totalAmountValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ ${weeklyGoalValue.toLocaleString("es-ES")} × 100 = ${weeklyGoalPercentage.toFixed(2)}%`,
            goalUsed: "agency",
            goalDate: null,
            debug: {
              totalAmountRaw: result.totalAmount,
              totalAmountParsed: totalAmountValue,
              weeklyGoalRaw: agencyDoc.weeklyGoal,
              weeklyGoalUsed: weeklyGoalValue,
              calculationStep: `${totalAmountValue} / ${weeklyGoalValue} * 100`,
            },
          };
        } else {
          const seller = await userService.getSellerById(agencyId.toString());

          if (seller) {
            const reportDate = new Date();
            let historicalGoal;

            try {
              historicalGoal = await userService.getSellerWeeklyGoalForDate(
                seller._id,
                reportDate
              );
            } catch (error) {
              historicalGoal = {
                weeklyGoal: seller.weeklyGoal || 100000,
                weeklyGoalMinimumPercentageOfSales:
                  seller.weeklyGoalMinimumPercentageOfSales || 80,
                goalDate: null,
              };
            }

            const weeklyGoalValue =
              historicalGoal.weeklyGoal || seller.weeklyGoal || 100000;
            const weeklyGoalPercentage =
              weeklyGoalValue > 0
                ? (totalAmountValue / weeklyGoalValue) * 100
                : 0;
            const minimumPercentage =
              historicalGoal.weeklyGoalMinimumPercentageOfSales ||
              seller.weeklyGoalMinimumPercentageOfSales ||
              80;
            const weeklyGoalReached = weeklyGoalPercentage >= minimumPercentage;

            weeklyGoalCalculation = {
              weeklyGoal: weeklyGoalValue,
              weeklyGoalMinimumPercentageOfSales: minimumPercentage,
              totalAmount: totalAmountValue,
              weeklyGoalPercentage: parseFloat(weeklyGoalPercentage.toFixed(2)),
              weeklyGoalReached: weeklyGoalReached,
              calculation: `${totalAmountValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ ${weeklyGoalValue.toLocaleString("es-ES")} × 100 = ${weeklyGoalPercentage.toFixed(2)}%`,
              goalUsed: historicalGoal.goalDate ? "historical" : "current",
              goalDate: historicalGoal.goalDate || null,
              debug: {
                totalAmountRaw: result.totalAmount,
                totalAmountParsed: totalAmountValue,
                weeklyGoalRaw: historicalGoal.weeklyGoal || seller.weeklyGoal,
                weeklyGoalUsed: weeklyGoalValue,
                calculationStep: `${totalAmountValue} / ${weeklyGoalValue} * 100`,
              },
            };
          }
        }
      } catch (error) {
        console.error("Error al obtener Seller o calcular metas:", error);
      }
    }

    return {
      result,
      weekInfo,
      isRealTime: true,
      weeklyGoalCalculation,
    };
  },

  /**
   * Función para obtener la meta de mayoreo semanal en tiempo real desde el lunes hasta hoy
   * Suma solo las ventas de type 2 y 6; meta en USD desde Agency si está definida, si no desde Seller
   * 
   * @param {Object} salesParam - Parámetros de la consulta
   * @returns {Object} Resultado con totales y cálculos de meta de mayoreo
   */
  getWeeklyWholesalesGoalRealtime: async (salesParam) => {


    // META DE MAYOREO SEMANAL EN TIEMPO REAL DESDE EL LUNES HASTA HOY
    // Calcula solo las ventas de type 2 y 6

    // Calcular el lunes de la semana actual usando hora de Venezuela (UTC-4)
    // Primero obtenemos el momento actual en hora de Venezuela
    const nowVenezuela = moment().utc().subtract(4, "hours");
    const currentDayOfTheWeek = nowVenezuela.day(); // 0 = domingo, 1 = lunes, etc.
    
    // Calcular cuántos días restar para llegar al lunes
    const daysToSubtract = currentDayOfTheWeek === 0 ? 6 : currentDayOfTheWeek - 1;
    
    // Calcular el lunes de la semana actual (inicio del día en hora de Venezuela)
    const startDate = nowVenezuela.clone()
      .subtract(daysToSubtract, "days")
      .startOf("day");
    
    // Fecha final: día actual (hasta el final del día en hora de Venezuela)
    const endDate = nowVenezuela.clone().endOf("day");

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

    // Agregación para calcular los totales semanales de mayoreo (solo type 2 y 6)
    let stages = [
      {
        $match: {
          createdDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          // Incluir solo tipos de mayoreo: 2 y 6
          type: { $in: [2, 6] },
        },
      },
      {
        $group: {
          _id: {
            agency: "$agency",
          },
          // Total de ingresos en bs (excluyendo créditos)
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
          // Total de ventas (excluyendo créditos y abonos)
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
          // Totales por forma de pago
          totalVes: { $sum: "$ves" },
          totalDollar: { $sum: "$dollar" },
          totalEur: { $sum: "$eur" },
          totalCop: { $sum: "$cop" },
          totalTransfer: { $sum: "$tAmmount" },
          totalPos: {
            $sum: {
              $add: [
                { $ifNull: ["$pAmmount", 0] },
                { $ifNull: ["$pAmmountExtra", 0] },
              ],
            },
          },
          // Totales en bolivares
          totalDollarVes: { $sum: { $multiply: ["$dollar", "$valueDollar"] } },
          totalEurVes: { $sum: { $multiply: ["$eur", "$valueEur"] } },
          totalCopVes: { $sum: { $divide: ["$cop", "$valueCop"] } },
          // Total en créditos
          totalCredit: {
            $sum: { $cond: [{ $eq: ["$isCredit", true] }, "$total", 0] },
          },
          // Total en abonos
          totalSumation: {
            $sum: { $cond: [{ $eq: ["$isSumation", true] }, "$total", 0] },
          },
          // Total en dólares por concepto de ventas al mayor (excluyendo créditos y abonos)
          // Suma el total de cada venta dividido por su valueDollar correspondiente
          totalWholesales: {
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
                    {
                      $gt: [{ $ifNull: ["$valueDollar", 0] }, 0],
                    },
                  ],
                },
                {
                  $divide: [
                    "$total",
                    { $ifNull: ["$valueDollar", 1] },
                  ],
                },
                0,
              ],
            },
          },
          // Tipos de cambio (último valor registrado)
          valueDollar: { $last: "$valueDollar" },
          valueEur: { $last: "$valueEur" },
          valueCop: { $last: "$valueCop" },
          // Total de clientes atendidos
          totalClients: { $sum: 1 },
          // Información de la agencia
          agency: { $first: "$agency" },
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
      { $sort: { totalAmount: -1 } },
    ];

    // Siempre filtrar por la agencia solicitada, priorizando:
    // 1) salesParam.agency (la que envías explícitamente)
    // 2) salesParam.user.agency
    // 3) salesParam.filters.agency
    let agencyId = null;
    if (salesParam && salesParam.agency) {
      agencyId = ObjectId(salesParam.agency);
      stages.unshift({
        $match: { agency: agencyId },
      });
    } else if (salesParam && salesParam.user && salesParam.user.agency) {
      agencyId = ObjectId(salesParam.user.agency);
      stages.unshift({
        $match: { agency: agencyId },
      });
    } else if (salesParam && salesParam.filters && salesParam.filters.agency) {
      agencyId = ObjectId(salesParam.filters.agency);
      stages.unshift({
        $match: { agency: agencyId },
      });
    }

    const results = await Sales.aggregate(stages);

    // Crear un resultado base aunque no haya ventas, para que los cálculos
    // de meta de mayoreo se hagan siempre tomando 0 como base en lugar de null
    let result;
    if (!results || results.length === 0) {
      result = {
        totalAmount: 0,
        totalSell: 0,
        totalVes: 0,
        totalDollar: 0,
        totalEur: 0,
        totalCop: 0,
        totalTransfer: 0,
        totalPos: 0,
        totalDollarVes: 0,
        totalEurVes: 0,
        totalCopVes: 0,
        totalCredit: 0,
        totalSumation: 0,
        totalWholesales: 0,
        totalClients: 0,
        agency: agencyId ? { _id: agencyId } : null,
      };
    } else {
      // Obtener solo el primer resultado (solo habrá uno porque se filtra por agencia)
      result = results[0];
    }

    // Calcular totalAmountBox (total en caja en bolivares)
    result.totalAmountBox =
      (result.totalVes || 0) +
      (result.totalTransfer || 0) +
      (result.totalPos || 0) +
      (result.totalDollarVes || 0) +
      (result.totalEurVes || 0) +
      (result.totalCopVes || 0);

    // Obtener el Seller asociado a la agencia para calcular la meta de mayoreo
    let wholesalesGoalCalculation = null;
    
    // Si no se estableció agencyId antes, usar el del resultado
    if (!agencyId && result && result.agency && result.agency._id) {
      agencyId = ObjectId(result.agency._id);
    }
    
    if (agencyId) {
      try {
        const agencyDoc = await Agency.findById(agencyId).lean();
        const seller = await userService.getSellerById(agencyId.toString());

        let wholesalesGoalValue = null;
        if (agencyDoc && Number(agencyDoc.wholesalesGoal) > 0) {
          wholesalesGoalValue = Number(agencyDoc.wholesalesGoal);
        } else if (seller) {
          wholesalesGoalValue = seller.wholesalesGoal || 1000;
        }

        if (wholesalesGoalValue != null && wholesalesGoalValue > 0) {
          const totalWholesalesValue = parseFloat(result.totalWholesales) || 0;
          const wholesalesGoalPercentage =
            wholesalesGoalValue > 0
              ? (totalWholesalesValue / wholesalesGoalValue) * 100
              : 0;
          const wholesalesGoalReached = wholesalesGoalPercentage >= 100;

          wholesalesGoalCalculation = {
            wholesalesGoal: wholesalesGoalValue,
            totalWholesales: totalWholesalesValue,
            wholesalesGoalPercentage: parseFloat(
              wholesalesGoalPercentage.toFixed(2)
            ),
            wholesalesGoalReached: wholesalesGoalReached,
            calculation: `${totalWholesalesValue.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ÷ ${wholesalesGoalValue.toLocaleString("es-ES")} × 100 = ${wholesalesGoalPercentage.toFixed(2)}%`,
          };
        }
      } catch (error) {
        console.error(
          "Error al obtener Seller o calcular meta de mayoreo:",
          error
        );
      }
    }

    return {
      result,
      weekInfo,
      isRealTime: true,
      wholesalesGoalCalculation,
    };
  },
};

module.exports = weeklyReportService;
