const mongoose = require('mongoose');
const moment = require('moment');
const config = require('../config.json');
const Seller = require('../models/seller.model');

// Script simple para poblar con datos REALES de metas
async function populateRealGoals() {
    try {
        await mongoose.connect(config.connectionString);


        // Datos REALES de metas por tienda (OBJETIVO 100%)
        const realGoalsData = {
            'Av4-Merida-Centro': {
                '2025-09-29': 3348000,
                '2025-10-06': 3528000,
                '2025-10-13': 3780000
            },
            'AV-universidad-Centro': {
                '2025-09-29': 1097400,
                '2025-10-06': 1156400,
                '2025-10-13': 1239000
            },
            'Merida-SanRafael-Tab': {
                '2025-09-29': 930000,
                '2025-10-06': 980000,
                '2025-10-13': 1050000
            },
            'Av5-Merida-Centro': {
                '2025-09-29': 1209000,
                '2025-10-06': 1274000,
                '2025-10-13': 1365000
            },
            'Merida-SotoRosa': {
                '2025-09-29': 1767000,
                '2025-10-06': 1862000,
                '2025-10-13': 1995000
            },
            'Merida-LaParroquia': {
                '2025-09-29': 1581000,
                '2025-10-06': 1666000,
                '2025-10-13': 1785000
            },
            'Merida-Parroquia-2': {
                '2025-09-29': 1023000,
                '2025-10-06': 1078000,
                '2025-10-13': 1155000
            },
            'Merida-Chaguaramos': {
                '2025-09-29': 2659800,
                '2025-10-06': 2802800,
                '2025-10-13': 3003000
            },
            'Merida-El Vigia': {
                '2025-09-29': 2232000,
                '2025-10-06': 2352000,
                '2025-10-13': 2520000
            },
            'Merida-Ejido': {
                '2025-09-29': 2232000,
                '2025-10-06': 2352000,
                '2025-10-13': 2520000
            },
            'Ejido-Trapiche': {
                '2025-09-29': 1320600,
                '2025-10-06': 1391600,
                '2025-10-13': 1491000
            },
            'Barinas-AltoBarinas': {
                '2025-09-29': 1506600,
                '2025-10-06': 1587600,
                '2025-10-13': 1701000
            },
            'Barinas-Centro': {
                '2025-09-29': 1860000,
                '2025-10-06': 1960000,
                '2025-10-13': 2100000
            },
            'Merida-PlazaBelen': {
                '2025-09-29': 1209000,
                '2025-10-06': 1274000,
                '2025-10-13': 1365000
            },
            'Merida-CampoClaro': {
                '2025-09-29': 930000,
                '2025-10-06': 980000,
                '2025-10-13': 1050000
            }
        };

        const sellers = await Seller.find();

        for (const seller of sellers) {
            const sellerGoals = realGoalsData[seller.firstName];
            
            if (sellerGoals) {
                
                // Limpiar historial existente
                seller.weeklyGoalHistory = [];
                
                // Agregar las metas reales
                Object.entries(sellerGoals).forEach(([dateStr, goal]) => {
                    const goalDate = moment(dateStr).startOf('week').add(1, 'day'); // Lunes
                    
                    seller.weeklyGoalHistory.push({
                        date: goalDate.toDate(),
                        weeklyGoal: goal,
                        weeklyGoalMinimumPercentageOfSales: 85
                    });
                });
                
                // Ordenar por fecha (más reciente primero)
                seller.weeklyGoalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Actualizar meta actual
                const latestGoal = seller.weeklyGoalHistory[0];
                seller.weeklyGoal = latestGoal.weeklyGoal;
                seller.weeklyGoalMinimumPercentageOfSales = latestGoal.weeklyGoalMinimumPercentageOfSales;
                
                await seller.save();
            }
        }


    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Ejecutar
populateRealGoals();

module.exports = { populateRealGoals };
