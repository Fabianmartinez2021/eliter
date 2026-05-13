// const config = require('config.json');
// const mongoose = require('mongoose');
// const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
// mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions);
// mongoose.Promise = global.Promise;

module.exports = {
    User: require('../models/user.model'),
    Support: require('../models/support.model'),
    Notification: require('../models/notification.model'),
    Agency: require('../models/agency.model'),
    Product: require('../models/product.model'),
    ProductRecord: require('../models/productRecord.model'),
    Miscellaneous: require('../models/miscellaneous.model'),
    MiscellaneousRecord: require('../models/miscellaneousRecord.model'),
    MiscellaneousInventory: require('../models/miscellaneousInventory.model'),
    MiscellaneousInventoryPending: require('../models/miscellaneousInventoryPending.model'),
    MiscellaneousInventoryPendingFull: require('../models/miscellaneousInventoryPendingFull.model'),
    MiscellaneousInventoryRecord: require('../models/miscellaneousInventoryRecord.model'),
    MiscellaneousAdjustmentRecord: require('../models/miscellaneousAdjustmentRecord.model'),
    Inventory: require('../models/inventory.model'),
    InventoryRecord: require('../models/inventoryRecord.model'),
    InventoryReport: require('../models/inventoryReport.model'),
    InventoryFiscal: require('../models/inventoryFiscal.model'),
    InventoryRecordFiscal: require('../models/inventoryRecordFiscal.model'),
    Sales: require('../models/sales.model'),
    SalesFiscal: require('../models/salesFiscal.model'),
    Coin: require('../models/coin.model'),
    CoinRecord: require('../models/coinRecord.model'),
    Terminal: require('../models/terminal.model'),
    TerminalRecord: require('../models/terminalRecord.model'),
    Departure: require('../models/departure.model'),
    DepartureMiscellaneous: require('../models/departureMiscellaneous.model'),
    Ticket: require('../models/ticket.model'),
    TicketFiscal: require('../models/ticketFiscal.model'),
    AdjustmentRecord: require('../models/adjustmentRecord.model'),
    CronRecord: require('../models/cronRecord.model'),
    Offer: require('../models/offer.model'),
    OfferRecord: require('../models/offerRecord.model'),
    Box: require('../models/box.model'),
    BoxFiscal: require('../models/boxFiscal.model'),
    BoxCloseFiscal: require('../models/boxCloseFiscal.model'),
    Resguard: require('../models/resguard.model'),
    BoxClose: require('../models/boxClose.model'),
    Client: require('../models/client.model'),
    Seller: require('../models/seller.model'),
    Operator: require('../models/operator.model'),
    Order: require('../models/order.model'),
    OrderMiscellaneous: require('../models/orderMiscellaneous.model'),
    OrderHelper: require('../models/orderHelper.model'),
    OrderMiscellaneousHelper: require('../models/orderMiscellaneousHelper.model'),
    OrderMarketMiscellaneous: require('../models/orderMarketMiscellaneous.model'),
    Assets: require('../models/assets.model'),
    AssetsRecord: require('../models/assetsRecord.model'),

    AuthorizationCode: require('../models/authorizationCode.model'),

    WholesaleClient: require('../models/wholesaleClient.model'),
    WholesaleFiscalClient: require('../models/wholesaleFiscalClient.model'),
    ValeClient: require('../models/valeClient.model'),
    PendingPayments: require('../models/pendingPayments.model'),
    PendingVales: require('../models/pendingVales.model'),
    Wholesales: require('../models/wholesales.model'),
    WholesalesFiscal: require('../models/wholesalesFiscal.model'),

    Combos: require('../models/combos.model'),
    CombosRecord: require('../models/combosRecord.model'),

    PaymentMethodsRecord: require('../models/paymentMethodsRecord.model'),
    PaymentFiscalMethodsRecord: require('../models/paymentFiscalMethodsRecord.model'),
    PaymentMethodsGeneralReportRecord: require('../models/paymentMethodsGeneralReportRecord.model'),

    AgencyCloseRecord: require('../models/agencyCloseRecord.model'),

    CommissionsReport: require('../models/commissionsReport.model'),

    Currency: require('../models/currency.model'),
    CurrencyHistory: require('../models/currencyHistory.model'),

    Invoice: require('../models/invoice.model'),

    PromoCoupon: require('../models/promoCoupon.model'),
    PromoCouponUse: require('../models/promoCouponUse.model'),

    ClosingFiscal: require('../models/closingFiscal.model'),
    PendingPaymentsFiscal: require('../models/pendingPaymentsFiscal.model'),
    NoteMarket: require('../models/noteMarket.model'),
    ProductNextDayPrice: require('../models/productNextDayPrice.model'),
    AccountsPayable: require('../models/accountsPayable.model')
};