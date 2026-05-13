const db = require('../_helpers/db');
const AuthorizationCode = db.AuthorizationCode;
const rolesEnum = require('../enums/roles.enum');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

let authorizationCodeService = {

    /**
     * Función para generar un nuevo código aleatorio
     * 
     * @param {params} codeParam 
     */
    createCode: async (codeParam) => {

        // Únicamente los administradores pueden generar estos códigos
        // if(codeParam.user.role !== rolesEnum.rol.Admin){
        //     throw('Esta transacción solo la pueden realizar los administradores')
        // }

        // Se busca que no haya ya un código activo para este usuario
        let existingCode = await AuthorizationCode.findOne({authorizedUser: codeParam.authorizedUser, status: false})

        if (existingCode){
            await AuthorizationCode.findOneAndDelete({authorizedUser: codeParam.authorizedUser, status: false})
        }

        // Se crea el usuario que autorizó para finalizar con el registro
        codeParam.authorizerUser = codeParam.user.id;

        let newAuthorizationCode = new AuthorizationCode(codeParam)

        let newAuthorizationCodeSaved = await newAuthorizationCode.save();

        // Ahora se busca de nuevo lo que ha sido creado para reenviarlo
        return await AuthorizationCode.findById(newAuthorizationCodeSaved._id).populate('agency').populate('authorizedUser').populate('authorizerUser').sort({createdDate: -1});
    },

    
    /**
     * Función para generar un nuevo código que va a ser utilizado para retiro de caja
     * 
     * @param {params} codeParam 
     */
    createBoxWithdrawalCode: async (codeParam) => {

        // Únicamente los administradores pueden generar estos códigos
        // if(codeParam.user.role !== rolesEnum.rol.Admin){
        //     throw('Esta transacción solo la pueden realizar los administradores')
        // }

        // Se crea el usuario que autorizó para finalizar con el registro
        codeParam.authorizerUser = codeParam.user.id;

        // Se crea el objeto correspondiente al retiro de caja y deja claro que se trata de un codigo para retiro de caja

        let boxWithdrawalData = {
            authorization: codeParam.authorization,
            amount: codeParam.amount, 
            coin: codeParam.coin,
            type: codeParam.type,
        }

        codeParam.isBoxWithdrawal = true;
        codeParam.boxWithdrawalData = boxWithdrawalData;


        // Finalmente se guarda el nuevo código en la base de datos 
        let newAuthorizationCode = new AuthorizationCode(codeParam)

        let newAuthorizationCodeSaved = await newAuthorizationCode.save();

        // Ahora se busca de nuevo lo que ha sido creado para reenviarlo
        return await AuthorizationCode.findById(newAuthorizationCodeSaved._id).populate('agency').populate('authorizedUser').populate('authorizerUser').sort({createdDate: -1});
    },

    /** Función para eliminar un código de autorizacion mediante su id
     * 
     * @param {id} id - El id del código que se va a eliminar
     */
    deleteCode: async (id) => {
        
        return await AuthorizationCode.findOneAndDelete({ _id: ObjectId(id), status: false});
    },

    /** Función para verificar un código de autorizacion
     * 
     * @param {(string | ObjectId)} userId - El id del usuario al cual le pertenece el código
     * @param {string} code   - El código que se va a verificar  
     * @returns 
     */
    verifyCode: async (userId, code) => {
       
        return await AuthorizationCode.findOne({authorizedUser: ObjectId(userId), code: code, status: false}).lean();
    },
    
    /** Función para eliminar un código de autorizacion mediante su id
     * 
     * @param {id} id - El id del código que se va a confirmar
     */
    confirmCode: async (id) => {
        
        return await AuthorizationCode.findByIdAndUpdate(id, { status: true,
            updateDate: moment().subtract(4, 'hours').toDate()
        },{
            new: true
        });
    },
    
    /** Función para verificar un código de autorizacion
     * 
     * 
     * 
     */
    getCodes: async (codeParam) => {
        
        // // Únicamente los administradores pueden generar estos códigos
        // if(codeParam.user.role !== rolesEnum.rol.Admin){
        //     throw('Esta transacción solo la pueden realizar los administradores')
        // }

        // resultados por página
        const pageSize = codeParam.pageSize;
        // Página: el page index de react-table-component
        const pageIndex = codeParam.pageIndex; 
 
        //orden por defecto
        var sortBy = { createdDate : -1 };

        //Si esta el parametro se crea el objeto para ordenar adecuadamente
        if(codeParam.sortBy){
            let direction = codeParam.sortBy.desc == true ? -1 : 1
            sortBy = { [codeParam.sortBy.id] : direction } 
        }

        let stages = [
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency'} },
            { $unwind: '$agency'},
            { $lookup: { from: 'users',  localField: 'authorizedUser', foreignField: '_id', as: 'authorizedUser' } },
            { $unwind: '$authorizedUser' },
            { $lookup: { from: 'users',  localField: 'authorizerUser', foreignField: '_id', as: 'authorizerUser' } },
            { $unwind: '$authorizerUser' },
            { $sort : sortBy },
        ];

        //Si no es excel paginar normalmente
        //Añade facet al final del array
        if(!codeParam.isExcel){
            stages.push(
                { $facet : { metadata: [ { $count: "total" } ], data: [ { $skip: (pageSize * pageIndex) - pageSize }, { $limit: pageSize } ] } },
            );
        }

        //Si el rol es Gerente, solo su sucursal
        if(codeParam.user.role == rolesEnum.rol.Manager){
            stages.unshift(
                { $match : { agency: ObjectId(codeParam.user.agency) } },
            );
        }

        //Filtros para la consulta normal como para el total
        if (codeParam.filters) {

            //Si hay filtro de sucursal
            if(codeParam.filters.agency){
                
                stages.unshift(
                    { $match : { agency: ObjectId(codeParam.filters.agency) } },
                );
            }

            if(codeParam.filters.startDate && !codeParam.filters.endDate){
                const startDate =  moment(codeParam.filters.startDate).utc().startOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate) } } },
                );
            }

            if(!codeParam.filters.startDate && codeParam.filters.endDate){
                const endDate =  moment(codeParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $lte: new Date(endDate) } } },
                );
            }

            if(codeParam.filters.startDate && codeParam.filters.endDate){
                const startDate =  moment(codeParam.filters.startDate).utc().startOf('day');
                const endDate =  moment(codeParam.filters.endDate).utc().endOf('day');
                stages.unshift(
                    { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                );
            }
            
            //Si hay filtro por nombre
            if(codeParam.filters.code){
                let regex = new RegExp(codeParam.filters.code,'gi');
                stages.unshift(
                    { $match: { code: { $regex: regex } } },
                );
            }
        }


        if(!codeParam.filters.startDate && !codeParam.filters.endDate && !codeParam.filters.code){
            const startDate =  moment().utc().startOf('day');
            const endDate =  moment().utc().endOf('day');
            stages.unshift(
                { $match: { createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
            );
        }
       
        const data = await AuthorizationCode.aggregate(stages);

        
        return {
            results: !codeParam.isExcel ? data[0].data: data, 
            metadata: !codeParam.isExcel ? data[0].metadata: [], 
        }
    },

    getCode: async (codeParam) => {

        let code = await authorizationCodeService.verifyCode( codeParam.user.id, codeParam.data.code);

        if (code) {
            return code;
        } 
        else throw('ERROR: El código es incorrecto, o no le pertenece a usted');
    }
}

module.exports = authorizationCodeService;