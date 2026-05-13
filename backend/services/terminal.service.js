const { Logger } = require('mongodb');
const db = require('../_helpers/db');
const Terminal = db.Terminal;
const TerminalRecord = db.TerminalRecord;
const role = require('../enums/roles.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

let terminalService = {

    /**
     * Función para registrar terminales
     * 
     * @param {params} terminalParam 
     */
    create: async (terminalParam) => {

        // Buscar codigo de terminal
        if (await Terminal.findOne({ code: terminalParam.code })) {
            throw 'Código de terminal "' + terminalParam.code + '" ya usado';
        }

        const terminal = new Terminal(terminalParam);

        const terminalSaved = await terminal.save();

        if(!terminalSaved){
            throw 'Error registrando terminal';  
        }

    },

    /**
     * Función para actualizar terminales
     * 
     * @param {id} id de terminal 
     * @param {params} terminalParam
     */
    update: async (id, terminalParam) => {

        const terminal = await Terminal.findById(id);

        // Validar
        if (!terminal) throw 'terminal no encontrada';

        //fecha de actualización
        terminal.updatedDate = Date.now();

        // copiar propiedades de terminalParam a terminal
        Object.assign(terminal, terminalParam);
        
        try {
            await terminal.save();
        } catch (error) {
            if(error.code == 11000){
                throw 'Código de terminal "' + terminalParam.code + '" ya usado';
            }else{
                throw 'Error registrando terminal';  
            }   
        }

    },

    /**
     * Función para obtener
     * 
     * @param {id} id de terminal 
     */
    getTerminal: async (id) => {
        const terminal = await Terminal.findById(id);

        // Validar
        if (!terminal) throw 'terminal no encontrada';

        return terminal;
    },

    //Funcion para obtener todos las terminales
    getAll: async () => {
        return await Terminal.find().sort({name: 'asc'});
    },

    //Obtener terminales que no estan ocupados
    getUnused: async () => {
        return await Terminal.find({used:false}).sort({name: 'asc'});
    },

    /**
     * Funcion para obtener las terminales con paginación y filtros
     */
    getTerminalRecords: async (terminalParam) => {

        // resultados por página
        const pageSize = terminalParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = terminalParam.pageIndex; 

        //orden por defecto
        var sortBy = { createdDate: -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(terminalParam.sortBy){
            let direction = terminalParam.sortBy.desc == true ? -1 : 1
            sortBy = { [terminalParam.sortBy.id] : direction } 
        }

        //stage o query principal
        const stages = [
            { $lookup: { from: "agencies", localField: "agency", foreignField: "_id", as: "agency", } },
            { $unwind: { path: "$agency", } },
            { $lookup: { from: "terminals", localField: "applyStack.terminal", foreignField: "_id", as: "terminalsThatApply", } },
            {
              $set: {
                applyStack: {
                  $map: {
                    input: "$applyStack",
                    in: {
                      $mergeObjects: [
                        "$$this",
                        {
                          terminal: {
                            $arrayElemAt: [
                              "$terminalsThatApply",
                              {
                                $indexOfArray: [
                                  "$terminalsThatApply._id",
                                  "$$this.terminal",
                                ],
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
            { $lookup: { from: "terminals", localField: "notApplyStack.terminal", foreignField: "_id", as: "terminalsThatNotApply", } },
            {
              $set: {
                notApplyStack: {
                  $map: {
                    input: "$notApplyStack",
                    in: {
                      $mergeObjects: [
                        "$$this",
                        {
                          terminal: {
                            $arrayElemAt: [
                              "$terminalsThatNotApply",
                              {
                                $indexOfArray: [
                                  "$terminalsThatNotApply._id",
                                  "$$this.terminal",
                                ],
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
            { $sort : sortBy },
            { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } }
        ]
      
        //stage del total 
        let stageTotal = [ 
            {   $group : { _id: null, 
                    totalApplyAmmount: { $sum: "$totalApplyAmmount" },
                    totalNotApplyAmmount: { $sum: "$totalNotApplyAmmount" },
                    total: { $sum: "$total" },
                } 
            } 
        ];

        //Si es admin o supervisor ve todos las sucursales y usuarios

        //Si el rol es Cajero o Gerente, solo su sucursal y los usuarios de la sucursal

        if((terminalParam.user.role == role.rol.Cashier) || (terminalParam.user.role == role.rol.Manager)){
            stages.unshift(
                { $match : { agency: ObjectId(terminalParam.user.agency) } },
            );
            stageTotal.unshift(
                { $match : { agency: ObjectId(terminalParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (terminalParam.filters) {

             //Si hay filtro de sucursal
             if(terminalParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(terminalParam.filters.agency) } },
                );
                stageTotal.unshift(
                    { $match : { agency: ObjectId(terminalParam.filters.agency) } },
                );
            }


            if(terminalParam.filters.startDate && !terminalParam.filters.endDate){
                const startDate =  moment(terminalParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!terminalParam.filters.startDate && terminalParam.filters.endDate){
                const endDate =  moment(terminalParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(terminalParam.filters.startDate && terminalParam.filters.endDate){
                const startDate =  moment(terminalParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(terminalParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
                stageTotal.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
        }

         //Si todos los filtros son vacios se consulta la fecha actual
        if( !terminalParam.filters.startDate && !terminalParam.filters.endDate){
            
            const startDate = moment().utc().subtract(4, 'hours').startOf('day');
            const endDate = moment().utc().subtract(4, 'hours').endOf('day');

            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
            stageTotal.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }

        const terminalRecords = await TerminalRecord.aggregate(stages);

        let total = []

        //Sumar total si las fechas se definieron o si es el día actual
        if(terminalRecords){
            //Total del resultado
            total = await TerminalRecord.aggregate(stageTotal);
        }

        return {
            results: terminalRecords[0].data, 
            metadata: terminalRecords[0].metadata,
            total: total[0]
        }
    },

    /**
     * Funcion para obtener las terminales con paginación y filtros
     */
    dataTable: async () => {

        let stages = [
            { $lookup: { from: 'agencies', localField: '_id', foreignField: 'terminal', as: 'agency' }}, 
            { $unwind: { path: '$agency', preserveNullAndEmptyArrays: true }}
        ]

        const terminals = await Terminal.aggregate(stages);
        return {
            results: terminals, 
        }
    },


}

module.exports = terminalService;