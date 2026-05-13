require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('./_helpers/jwt');
const errorHandler = require('./_helpers/error-handler');
const mongoose = require('mongoose');
const config = require('./config.json');
const db = require('./_helpers/db');
const cronService = require('./services/cron.service');
const cronFiscalService = require('./services/cronFiscal.service');
const salesService = require('./services/sales.service');

app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.options('*', cors());

//usar la autenticación JWT para asegurar la API
app.use(jwt());

// api routes
app.use('/support', require('./controllers/support.controller')); 
app.use('/notifications', require('./controllers/notification.controller'));
app.use('/users', require('./controllers/users.controller'));
app.use('/agency', require('./controllers/agency.controller'));
app.use('/product', require('./controllers/product.controller'));
app.use('/miscellaneous', require('./controllers/miscellaneous.controller'));
app.use('/miscellaneous-inventory', require('./controllers/miscellaneousInventory.controller'));
app.use('/inventory', require('./controllers/inventory.controller'));
app.use('/inventory-special', require('./controllers/inventoryFiscal.controller'));
app.use('/sales', require('./controllers/sales.controller'));
app.use('/sales-special', require('./controllers/salesFiscal.controller'));
app.use('/coin', require('./controllers/coin.controller'));
app.use('/terminal', require('./controllers/terminal.controller'));
app.use('/seed', require('./controllers/seed.controller'));
app.use('/departure', require('./controllers/departure.controller'));
app.use('/departure-miscellaneous', require('./controllers/departureMiscellaneous.controller'));
app.use('/ticket', require('./controllers/ticket.controller'));
app.use('/ticket-special', require('./controllers/ticketFiscal.controller'));
app.use('/cron', require('./controllers/cron.controller'));
app.use('/offer', require('./controllers/offer.controller'));
app.use('/box', require('./controllers/box.controller'));
app.use('/resguard', require('./controllers/resguard.controller'));
app.use('/client', require('./controllers/client.controller'));
app.use('/order', require('./controllers/order.controller'));
app.use('/order-miscellaneous', require('./controllers/order-miscellaneous.controller'));
app.use('/assets', require('./controllers/assets.controller'));
app.use('/authorization-code', require('./controllers/authorization-code.controller'));


app.use('/wholesale-client', require('./controllers/wholesale-client.controller'));
app.use('/vale-client', require('./controllers/vale-client.controller'));
app.use('/pending-payments', require('./controllers/pending-payments.controller'));
app.use('/pending-vales', require('./controllers/pending-vales.controller'));
app.use('/combos', require('./controllers/combos.controller'));

app.use('/note-market', require('./controllers/noteMarket.controller'));
app.use('/order-market-miscellaneous', require('./controllers/orderMarketMiscellaneous.controller'));

app.use('/workers', require('./controllers/workers.controller'));

app.use('/api', require('./controllers/currencyHistory.controller'));

app.use('/api/webhook', require('./controllers/webhook.controller'));

app.use('/invoice', require('./controllers/invoice.controller'));
app.use('/reports', require('./controllers/reportMonthly.controller'));
app.use('/pending-payments-special', require('./controllers/pendingPaymentsFiscal.controller'));
app.use('/accounts-payable', require('./controllers/accountsPayable.controller'));


//controlador de error global
app.use(errorHandler);

var CronJob = require('cron').CronJob;

var job = new CronJob(
    /*
    * Todos los dias
    * a las 12:30:00 AM.
    */
    '0 30 0 * * *',
    //  '0 */2 * * * *',


    ()=>cronService.cronInventory("UdWTcFo65if3EGDzwOFG"),
	null,
	true,
    "America/Caracas"
);

job.start();

var jobPendingPayments = new CronJob(
    /*
    * Todos los dias
    * a las 12:35:00 AM.
    */
    '0 35 0 * * *',
    //  '0 */1 * * * *',

    ()=>cronService.cronPendingPayments("UdWTcFo65if3EGDzwOFG"),
	null,
	true,
    "America/Caracas"
);

jobPendingPayments.start();

var jobMiscellaneous = new CronJob(
    '0 50 0 * * *',
    // '0 */2 * * * *',
    () => cronService.cronMiscellaneous("UdWTcFo65if3EGDzwOFG"),
    null,
    true,
    "America/Caracas"
);

jobMiscellaneous.start();

var jobPendingPaymentsFiscal = new CronJob(
    /*
    * Todos los días
    * a las 12:40:00 AM.
    */
    '0 40 0 * * *',
    () => cronFiscalService.cronPendingPaymentsFiscal("FiscalPendingTrigger2025"),
    null,
    true,
    "America/Caracas"
);

jobPendingPaymentsFiscal.start();

var jobPendingVales = new CronJob(
    /*
    * Todos los días
    * a las 12:40:00 AM.
    */
    '0 45 0 * * *',
    //  '0 */2 * * * *',
    () => cronFiscalService.cronPendingVales("ValesPendingTrigger2025"),
    null,
    true,
    "America/Caracas"
);

jobPendingVales.start();


var jobOrders = new CronJob(
    /*
    * Todos los dias
    * a las 08:00:00 AM.
    */
    '0 0 8 * * *',
    ()=>cronService.cronOrders("UdWTcFo65if3EGDzwOFG"),
	null,
	true,
    "America/Caracas"
);

jobOrders.start();

// start server puerto original 
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
mongoose.Promise = global.Promise;
// Conexion a la base de datos
mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions).then(async () => {
    console.log('Connection to the database established successfully...');

    // Solo si el índice email no es sparse: eliminarlo para que syncIndexes lo recree como sparse (varios usuarios sin correo)
    try {
        const raw = await db.User.collection.listIndexes().toArray();
        const emailIdx = raw.find(idx => idx.name === 'email_1');
        if (emailIdx && emailIdx.unique && !emailIdx.sparse) {
            await db.User.collection.dropIndex('email_1');
        }
        await db.User.syncIndexes();
    } catch (e) {
        try { await db.User.syncIndexes(); } catch (_) {}
    }

    // Seed automático de cupones de promoción (solo si faltan)
    try {
        const couponCount = await db.PromoCoupon.countDocuments();
        if (couponCount < 3001) {
            await salesService.seedPromoCoupons();
        }
    } catch (err) {
        // Error en seed de cupones (no detiene el arranque del servidor)
    }

    // Creacion del servidor
    app.listen(port, () => {
        console.log(`Server running correctly in the url: ${port}`);
    });
}).catch( (error) => {
    console.log(error);
});
