import { combineReducers } from 'redux';

import authentication from './authentication.reducer';
import registration from './registration.reducer';
import users from './users.reducer';
import alert from './alert.reducer';
import agencies from './agencies.reducer';
import products from './product.reducer';
import inventories from './inventory.reducer';
import inventoriesFiscal from './invetoryFiscal.reducer';
import sales from './sales.reducer';
import coin from './coin.reducer';
import terminal from './terminal.reducer';
import departure from './departure.reducer';
import departureMiscellaneous from './departuresMiscellaneous.reducer';
import ticket from './ticket.reducer';
import ticketFiscal from './ticketFiscal.reducer'
import data from './data.reducer';
import offline from './offline.reducer';
import offlineFiscal from './offlineFiscal.reducer';
import pending from './pending.reducer';
import download from './download.reducer';
import cron from './cron.reducer';
import offer from './offer.reducer';
import box from './box.reducer';
import resguard from './resguard.reducer';
import pendingPayments from './pendingPayments.reducer';
import accountsPayable from './accountsPayable.reducer';
import order from './order.reducer';
import orderMiscellaneous from './orderMiscellaneous.reducer';
import assets from './assets.reducer';
import authorizationCode from './authorizationCode.reducer';
import miscellaneous from './miscellaneous.reducer';
import miscellaneousInventory from './miscellaneousInventory.reducer';
import miscellaneousInventoryWeekly from './miscellaneousInventoryWeekly.reducer';
// import currency from './currency.reducer';
import currencyDollar from './currencyDollar.reducer';
import invoice from './invoice.reducer';
import salesFiscal from './salesFiscal.reducer';
import reportsFiscal from './reportsFiscal.reducer';
import pendingFiscal from './pendingFiscal.reducer';
import dataFiscal from './dataFiscal.reducer';
import pendingPaymentsFiscal from './pendingPaymentsFiscal.reducer';
import pendingVales from './pendingVales.reducer';
import noteMarket from './noteMarket.reducer';
import orderMarketMiscellaneous from './orderMarketMiscellaneous.reducer';
import { support } from './support.reducer';



const rootReducer = combineReducers({
    authentication,
    registration,
    users,
    agencies,
    products,
    inventories,
    inventoriesFiscal,
    sales,
    salesFiscal,
    support,
    coin,
    terminal,
    departure,
    departureMiscellaneous,
    ticket,
    ticketFiscal,
    alert,
    data,
    dataFiscal,
    offline,
    offlineFiscal,
    pending,
    pendingFiscal,
    download,
    cron,
    offer,
    box,
    resguard,
    pendingPayments,
    accountsPayable,
    order,
    orderMiscellaneous,
    assets,
    authorizationCode,
    miscellaneous,
    miscellaneousInventory,
    miscellaneousInventoryWeekly,
    // currency,
    currencyDollar,
    invoice,
    reportsFiscal,
    pendingPaymentsFiscal,
    pendingVales,
    noteMarket,
    orderMarketMiscellaneous
});

export default rootReducer;