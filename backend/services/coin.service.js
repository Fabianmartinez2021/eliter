const db = require('../_helpers/db');
const Coin = db.Coin;
const CoinRecord = db.CoinRecord;
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const webhook = require('../_helpers/webhook');


let coinService = {

    /**
     * Función para registrar valor de moneda ó actualiza
     * 
     * @param {params} coinParam 
     * @param {String} coinParam.user 
     */
    create: async (coinParam) => {

        for (let item of coinParam.values) {

            let coin = await Coin.findOne({ name: item.name });

            if (coin) {
                Object.assign(coin, { value: parseFloat(item.value.toString().replace(/,/g, '')), updatedDate: Date.now() });
                await coin.save();
            } else {
                coinData = { name: item.name, value: parseFloat(item.value.toString().replace(/,/g, '')) }
                const coinStore = new Coin(coinData);
                const coinSaved = await coinStore.save();
                if (!coinSaved) {
                    throw 'Error registrando la moneda';
                }
            }
        }

    },
    /**
     * Función para actualizar valor de moneda
     * 
     * @param {id} id de moneda 
     * @param {Object} coinParam Los parámetros que contienen los datos de la moneda
     * @param {String} coinParam.user El ID del usuario que actualiza
     * @param {Number} coinParam.value El valor actualizado de la moneda
     * @param {String} coinParam.name El nombre de la moneda
     */
    update: async (id, coinParam) => {
        try {
            // Buscar la moneda por ID
            const coin = await Coin.findById(id);

            // Validar si la moneda existe
            if (!coin) {
                throw new Error('Moneda no encontrada');
            }

            // Actualizar la fecha de actualización
            coin.updatedDate = Date.now();

            // Copiar propiedades de coinParam a coin
            Object.assign(coin, coinParam);

            // Guardar los cambios en la moneda
            await coin.save();

            // Verificar si `value` y `name` existen en `coinParam`
            if (!coinParam.value) {
                throw new Error('El valor de la moneda no está definido');
            }
            if (!coinParam.name) {
                throw new Error('El nombre de la moneda no está definido');
            }


            // Crear un nuevo registro de historial con todos los campos requeridos
            const historyCoin = new CoinRecord({
                name: coinParam.name, // Asegurarse de que `name` esté presente
                value: coinParam.value,
                createdDate: Date.now(),
                user: ObjectId(coinParam.user),
                username: coinParam.username,
            });

            // Guardar el historial
            const save = await historyCoin.save();

            if (!save) {
                throw new Error('Error registrando en historial');
            }

            // Enviar webhook a fábrica para actualizar la moneda y agregar al historial
            try {
                const coinData = coin.toObject({ virtuals: true });
                await webhook.sendCoinUpdate({
                    coinId: coinData.id || coin._id.toString(),
                    name: coinParam.name,
                    value: coinParam.value,
                    user: coinParam.user,
                    username: coinParam.username,
                    createdDate: save.createdDate,
                    updatedDate: coin.updatedDate,
                    action: 'updated'
                });
            } catch (err) {
                console.error('[COIN] Error enviando actualización de moneda a fábrica:');
                console.error(err?.stack || err?.message || err);
                // No lanzamos el error para no interrumpir el flujo, solo lo registramos
            }

            // Devolver un éxito si todo fue bien
            return { success: true, message: 'Moneda actualizada con éxito' };

        } catch (error) {
            console.error('Error actualizando la moneda:', error);
            throw new Error('Error en la actualización de la moneda: ' + error.message);
        }
    },




    /**
     * Función para obtener
     * 
     * @param {id} id de moneda 
     */
    getCoin: async (id) => {
        const coin = await Coin.findById(id);

        // Validar
        if (!coin) throw 'moneda no encontrada';

        return coin;
    },

    /**
     * Funcion para obtener todos las valor de moneda
     */
    getAll: async () => {
        return await Coin.find().sort({ name: 'asc' });
    },

    /**
     * Funcion para obtener las valor de moneda con paginación y filtros
     */
    dataTable: async () => {
        const coins = await Coin.find()
        return {
            results: coins,
        }
    },

    /**
     * Función para obtener el historial de monedas con filtros y paginación
     * 
    */
    dataTableHistoryCoin: async (coinParam) => {

        // resultados por página
        const pageSize = coinParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = coinParam.pageIndex;

        //orden por defecto
        var sortBy = { createdDate: -1 };

        if (coinParam.sortBy) {

            let direction = coinParam.sortBy.desc == true ? -1 : 1
            sortBy = { [coinParam.sortBy.id]: direction }

        }

        //Stage inicial de la consulta
        let stages = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: sortBy },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize }]
                }
            },
        ];

        //Filtros para la consulta
        if (coinParam.filters) {

            //Si hay filtro de tipo de salida
            if (coinParam.filters.presentation) {
                stages.unshift(
                    { $match: { presentation: coinParam.filters.presentation } },
                );
            }

            //Si hay filtro de usuario
            if (coinParam.filters.idUser) {
                stages.unshift(
                    { $match: { user: ObjectId(coinParam.filters.idUser) } },
                );
            }

            //filtro por nombres
            if (coinParam.filters.name) {
                let regex = new RegExp(coinParam.filters.name, 'gi');
                stages.unshift(
                    { $match: { name: { $regex: regex } } },
                );
            }

            if (coinParam.filters.startDate && !coinParam.filters.endDate) {
                const startDate = moment(coinParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if (!coinParam.filters.startDate && coinParam.filters.endDate) {
                const endDate = moment(coinParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if (coinParam.filters.startDate && coinParam.filters.endDate) {
                const startDate = moment(coinParam.filters.startDate).utc().startOf('day');
                const endDate = moment(coinParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

        //Si todos los filtros son vacios se consulta la fecha actual
        if (!coinParam.filters.code && !coinParam.filters.startDate && !coinParam.filters.endDate) {
            const startDate = moment().utc().startOf('day');
            const endDate = moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const coins = await CoinRecord.aggregate(stages);

        return {
            results: coins[0].data,
            metadata: coins[0].metadata,
        }

    }


}



module.exports = coinService;