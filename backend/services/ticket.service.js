const db = require('../_helpers/db');
const Ticket = db.Ticket;
const Client = db.Client;
const WholesaleClient = db.WholesaleClient;
const moment = require('moment');
const role = require('../enums/roles.enum');

let ticketService = {

    /**
     * Función para registrar salidas
     * 
     * @param {params} ticketParam 
     */
    create: async (ticketParam) => {

        // Si es ticket por venta al mayor, se verifica si el cliente existe, si no se crea
        if (ticketParam.isWholesale){
            const client = await WholesaleClient.findOne({document:ticketParam.document});

            //si el cliente no esta registrado se guarda
            if(!client){
                const storeClient = new WholesaleClient(ticketParam);
                await storeClient.save();
             }

             ticketParam.isSolvent = true;
        } else {
            // Venta al detal: registrar cliente en base de datos si no existe (para que al editar/cobrar el ticket no pida "añadir")
            const client = await Client.findOne({ document: ticketParam.document });

            if (!client) {
                const storeClient = new Client({
                    agency: ticketParam.agency,
                    document: ticketParam.document,
                    names: ticketParam.names || '',
                    phone: ticketParam.phone || ''
                });
                await storeClient.save();
            }
        }

        let products = [];

        //Crear array de productos
        for (let item of ticketParam.items) {
           
            let poductParam = {
                id: item.id,
                code: item.code,
                decrease: item.decrease,
                reweigh: item.reweigh,
                name: item.name,
                price: item.price,
                regularPrice: item.regularPrice,
                differential: item.differential,
                wholesalePrice: item.wholesalePrice,
                wholesalePriceBs: (item.wholesalePriceBs ? item.wholesalePriceBs : null),
                wholesaleDiscountPrice: (item.wholesaleDiscountPrice ? item.wholesaleDiscountPrice : null),
                wholesaleDiscountPriceBs: (item.wholesaleDiscountPriceBs ? item.wholesaleDiscountPriceBs : null),
                isWholesale: item.isWholesale,
                isOffer: item.isOffer,   
                kg:item.kg,
                total:item.total,
                totalDollars: (item.totalDollars ? item.totalDollars : null),
                applyWholesaleDiscount: (item.applyWholesaleDiscount ? item.applyWholesaleDiscount : null)
            }
            products.push(poductParam);
            
        }

        //crear array de productos
        ticketParam.products = products;

        const ticket = new Ticket(ticketParam);

        const ticketSaved = await ticket.save();

        if(!ticketSaved){
            throw 'Error registrando venta en espera';  
        }

        return ticketSaved;

    },

    /**
     * Función para actualizar tickets
     * 
     * @param {params} ticketParam 
     */
    update: async (id, ticketParam) => {
        
        const ticket = await Ticket.findById(id);

        // Validar que exista el ticket
        if (!ticket) throw 'El ticket no se encuentra o fué eliminado';

        let products = [];

        //Crear array de productos
        for (let item of ticketParam.items) {
           
            let poductParam = {
                id: item.id,
                code: item.code,
                decrease: item.decrease,
                reweigh: item.reweigh,
                name: item.name,
                price: item.price,
                regularPrice: item.regularPrice,
                differential: item.differential,
                wholesalePrice: item.wholesalePrice,
                isWholesale: item.isWholesale,
                isOffer: item.isOffer,   
                kg:item.kg,
                total:item.total,
                totalDollars: (item.totalDollars ? item.totalDollars : null),
                applyWholesaleDiscount: (item.applyWholesaleDiscount ? item.applyWholesaleDiscount : null)
            }
            products.push(poductParam);
            
        }
        ticketParam.products = products;

        Object.assign(ticket, ticketParam);

        await ticket.save();

    },

    /**
     * Eliminar ticket. Solo se permite eliminar tickets del mismo día; el administrador puede de cualquier día;
     * Telesales (rol 7) puede eliminar sus propios tickets de cualquier día.
     */
    removeTicket: async (id, ticketParam) => {
        const ticketToDelete = await Ticket.findOne({ _id: id });
        if (!ticketToDelete) throw 'Ticket no encontrado';

        const startOfToday = moment().utc().subtract(4, 'hours').startOf('day');
        const ticketDate = moment(ticketToDelete.createdDate).utc().subtract(4, 'hours').startOf('day');
        const isFromPreviousDay = ticketDate.isBefore(startOfToday);
        const isAdmin = ticketParam.user && Number(ticketParam.user.role) === role.rol.Admin;
        const isTelesalesDeletingOwn = ticketParam.user && Number(ticketParam.user.role) === role.rol.Telesales &&
            ticketToDelete.user && String(ticketToDelete.user) === String(ticketParam.user._id);
        if (isFromPreviousDay && !isAdmin && !isTelesalesDeletingOwn) {
            throw 'Solo se pueden eliminar tickets del mismo día. Los tickets del día anterior deben procesarse (registrar la venta).';
        }

        await Ticket.deleteOne({ _id: id });

        //Obtener nuevamente todos los tickets
        let idAgency = ticketParam.id;
        const ticket = await Ticket.find({agency:idAgency, isWholesale: ticketToDelete.isWholesale}).populate('agency','name').sort({createdDate: -1});
        return {
            results: ticket, 
        }
    },

    /**
     * Funcion para obtener las ventas con paginación y filtros y por sucursal
     */
    dataTable: async (ticketParam) => {

        //Eliminar tickets anteriories
        // const date = moment().subtract(1, "days").endOf('day');
        // await Ticket.deleteMany({ createdDate: { $lte: new Date(date) } });

        let idAgency = ticketParam.id;
        
        const ticket = await Ticket.find({agency:idAgency, isWholesale: false}).populate('agency','name').sort({createdDate: -1});
        return {
            results: ticket, 
        }
    },

    dataTableWholesale: async (ticketParam) => {

        let idAgency = ticketParam.id;
        
        const ticket = await Ticket.find({agency:idAgency, isWholesale: true}).populate('agency','name').sort({createdDate: -1});

        let DataResult = ticket

        await Promise.all(DataResult.map(async (inventory) => {

            try {

                const dataDayBefore = await WholesaleClient.findOne({ 
                    clientCode: inventory.clientCode, 
                    documentType:inventory.documentType, 
                    document: inventory.document
                }).sort({ createdDate: -1 });//ordenado fecha desc y tomar ese documento
                
                if(dataDayBefore){

                    return Object.assign(inventory, { 
                        isSolvent: dataDayBefore.isSolvent,
                    });
                }
            } catch(err) {
                throw err;
            }

        }));
        
        return {
            results: DataResult, 
        }
    },
}

//Funcion para probar espera de internet 
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = ticketService;