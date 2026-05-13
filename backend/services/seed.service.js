const db = require('../_helpers/db');
const Agency = db.Agency;
const Terminal = db.Terminal;
const User = db.User;
const Coin = db.Coin;
const bcrypt = require('bcryptjs');

const AdjustmentRecord = db.AdjustmentRecord;
const Departure = db.Departure;
const Inventory = db.Inventory;
const InventoryRecord = db.InventoryRecord;
const Sales = db.Sales;
const Ticket = db.Ticket;
const Offer = db.Offer;
const OfferRecord = db.OfferRecord;
const CronRecord = db.CronRecord;
const Box = db.Box;
const BoxClose = db.BoxClose;

let seedService = {

    seed: async (id) => {

        if(id == "Sn4ZUVOJI6BCBcf4Xe08Qvqei"){

            const terminal = new Terminal(
                {
                    "description": "Propio",
                    "used": true,
                    "code": "1PC",
                    "serial": "55078",
                    "bank": "provincial",
                    "brand": "Intelipunto ingenico",
                    "model": "Ict 220",
                }
            );
    
            const terminalSaved = await terminal.save();
    
            if(!terminalSaved){
                throw 'Error registrando la terminal';  
            }
           
            const agency = new Agency(
                {
                    address: "Mérida Centro",
                    terminal: [terminalSaved._id],
                    name: "Fattoria Centro",
                    attendant: "Encargado",
                }
            );
    
            const agencySaved = await agency.save();
    
            if(!agencySaved){
                throw 'Error registrando la sucursal';  
            }
    
            const user = new User({
                agency: agencySaved._id,
                username: "admin",
                firstName: "Admin",
                lastName: "Admin",
                hash: bcrypt.hashSync("admin", 10),
                role: 1,
                status: 1,
            });
    
            const userSaved = await user.save();
    
            if(!userSaved){
                throw 'Error registrando usuario';  
            }

            const userAdmin = new User({
                agency: agencySaved._id,
                username: "adminDev",
                firstName: "AdminDevelopment",
                lastName: "AdminDevelopment",
                hash: bcrypt.hashSync("adminDev2020", 10),
                role: 1,
                status: 1,
            });
    
            const userAdminSaved = await userAdmin.save();
    
            if(!userAdminSaved){
                throw 'Error registrando usuario';  
            }

            //Añadir monedas
            const coinDollar = new Coin({
                name: "Dólar",
                value: 230472,
            });
            await coinDollar.save();

            const coinEur = new Coin({
                name: "Euro",
                value: 235341.71,
            });
            await coinEur.save();

            const coinCop = new Coin({
                name: "Pesos",
                value: 57.51,
            });
            await coinCop.save();
    
    
        }else{
            throw 'Sin autorización';  
        }
        
    },

    //Agregar usuario admin de uso interno y no modificable en front
    //Ya se registra en el seed inicial (No ejecutar)
    seedAdminUser: async (id) => {

        if(id == "Sn4ZUVOJI6BCBcf4Xe08Qvqei4d3in"){

            //Buscar primera sede para asignar al usuario
            const agency = await Agency.findOne().sort({ createdDate: 1 });//ordenado fecha asc y tomar ese documento
    
            if(agency){
                const user = new User({
                    agency: agency.id,
                    username: "adminDev",
                    firstName: "AdminDevelopment",
                    lastName: "AdminDevelopment",
                    hash: bcrypt.hashSync("adminDev2020", 10),
                    role: 1,
                    status: 1,
                });
        
                const userSaved = await user.save();
        
                if(!userSaved){
                    throw 'Error registrando usuario';  
                }
            }else{
                throw 'No hay sucursales';  
            }
            
        }else{
            throw 'Sin autorización';  
        }
        
    },

    /**
     * Metodo para limpiar base de datos
     * 
     * Limpia solo Ajustes, Salidas, Inventario, Historial de inventario, Ventas, tickets, ofertas, historial de ofertas
     * Caja, Cierres
     * Historial de cron
     */
    cleanDB:  async (id) => {

        if(id == "Sn4ZUVOJI6BCBcf4Xe08Qvqei4d3in58785411857xaw"){
           
            await AdjustmentRecord.deleteMany({}, function (err) {});
            await Departure.deleteMany({}, function (err) {});
            await Inventory.deleteMany({}, function (err) {});
            await InventoryRecord.deleteMany({ }, function (err) {});
            await Sales.deleteMany({}, function (err) {});
            await Ticket.deleteMany({}, function (err) {});
            await Offer.deleteMany({}, function (err) {});
            await OfferRecord.deleteMany({}, function (err) {});
            await CronRecord.deleteMany({}, function (err) {});
            await Box.deleteMany({}, function (err) {});
            await BoxClose.deleteMany({}, function (err) {});

            Sales.counterReset('order_seq', function(err) {
                // Now the counter is 0
            });

            Ticket.counterReset('order_ticket', function(err) {
                // Now the counter is 0
            });
             
            
        }else{
            throw 'Sin autorización de limpiar';  
        }
        
    },

    /**
     * Metodo para limpiar base de datos
     * 
     * Limpia solo ofertas
     */
    cleanOffers:  async (id) => {

        if(id == "Sn4ZUVOJI6BCBcf4Xe08Qvqei4d3in58785411857xaw"){
           
            await Offer.deleteMany({}, function (err) {});
            await OfferRecord.deleteMany({}, function (err) {});
            
        }else{
            throw 'Sin autorización de limpiar';  
        }
        
    },


}

module.exports = seedService;