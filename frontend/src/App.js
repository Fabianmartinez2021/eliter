/* eslint-disable */
import './assets/css/eliter-brand.css';
import './assets/css/styles.css';
import './assets/css/responsive.css';
import './assets/css/headerAdmin.css';
import React, { useEffect, useState } from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button } from 'reactstrap';

import { history, Role } from './helpers';
import { alertActions } from './actions';
import { NotificationProvider } from './helpers/internalNotification';
import AppNotifications from './components/Notifications/AppNotifications';
import { PrivateRoute } from './components';
import HomePage from './views/HomePage';
import LoginPage from './views/LoginPage';
import LandingPage from './views/LandingPage'

import ProfilePage from './views/profile/ProfilePage'
import UsersListPage from './views/users/UsersListPage'
import UserCreatePage from './views/users/UserCreatePage';
import UserUpdatePage from './views/users/UserUpdatePage';
import ClientUpdatePage from './views/users/ClientUpdatePage';
import SellersListPage from './views/users/SellersListPage'
import SellerCreatePage from './views/users/SellerCreatePage';
import SellerUpdatePage from './views/users/SellerUpdatePage';

// Trabajadores 
import OperatorCreatePage from './views/workers/OperatorCreatePage';
import OperatorUpdatePage from './views/workers/OperatorUpdatePage';
import OperatorListPage from './views/workers/OperatorListPage';

//Sucursal
import AgencyListPage from './views/agency/AgencyList';
import AgencyCreatePage from './views/agency/AgencyCreate';
import AgencyUpdatePage from './views/agency/AgencyUpdate';
import AgencyCloseHistoryPage from './views/agency/agencyCloseHistory';

//Catalogo
import ProductListPage from './views/product/ProductList';
import ProductCreatePage from './views/product/ProductCreate';
import ProductUpdatePage from './views/product/ProductUpdate';
import ProductListHistoryPage from './views/product/ProductHistory';
import CombosListPage from './views/product/CombosList';
import CombosCreatePage from './views/product/CombosCreate';
import CombosUpdatePage from './views/product/CombosUpdate';
import CombosRecordPage from './views/product/CombosRecord';

//Inventario
import InventoryCreatePage from './views/inventory/InventoryCreate';
import InventoryReweighPage from './views/inventory/InventoryReweigh';
import InventoryReadjustmentPage from './views/inventory/inventoryReadjustment';
import InventoryResetPage from './views/inventory/inventoryReset';
import InventoryEntryHistoryPage from './views/reports/InventoryEntryHistory';

//Inventario Fiscal

import InventoryFiscalCreatePage from './views/inventoryFiscal/InventoryFiscalCreate';
import InventoryFiscalReadjustmentPage from './views/inventoryFiscal/InvetoryFiscalReadjustment';
import InventoryFiscalHistoryPage from './views/inventoryFiscal/inventoryFiscalHistory';
import TicketsListFiscalPage from './views/inventoryFiscal/TicketsListFiscal';
import InventoryFiscalSellPage from './views/inventoryFiscal/inventoryFiscalSell';
import PaymentFiscalMethodsHistory from './views/inventoryFiscal/PaymentFiscalMethodsHistory';
import KPIsMonitoreoEspecialPage from './views/inventoryFiscal/KPIsMonitoreoEspecial';
import RealTimeGoalsPage from './views/inventoryFiscal/MetasTiempoReal';

//Ventas
import SalesListUserPage from './views/sales/SalesListUser';
import SalesListManagerPage from './views/sales/SalesListManager';
import SalesListDailyPage from './views/sales/SalesListDaily';
import SalesCreatePage from './views/sales/SalesCreate';
import SalesCreateOfflinePage from './views/sales/SalesCreateOffline';
import SalesCombosChartPage from './views/sales/SalesCombosChart';
import SalesNotesListPage from './views/sales/SalesNotesListPage';
import SalesUpdatedPage from './views/sales/SalesUpdatedPage';
import CouponHistoryPage from './views/sales/CouponHistoryPage';

// Ventas Fiscal
import SalesFiscalListManagerPage from './views/salesFiscal/SalesListFiscalManager';
import SalesFiscalCreatePage from './views/salesFiscal/SalesFiscalCreate';
import WholesaleFiscalCreatePage from './views/salesFiscal/WholesaleFiscalCreate';
import SalesFiscalCreateOfflinePage from './views/salesFiscal/SalesFiscalCreateOffline';
import CreditFiscalPaymentPage from './views/salesFiscal/CreditFiscalPayment';

//Televentas
import TelesalesCommissionsReportPage from './views/telesales/TelesalesCommissionsReport';
import TelesalesListPage from './views/telesales/TelesalesList';
import TelesalesPendingPaymentsPage from './views/telesales/TelesalesPendingPayments';

//Monedas
import CoinListPage from './views/coin/CoinList';
import CoinCreatePage from './views/coin/CoinCreate';
import CoinHistoryPage from './views/coin/CoinHistoryM';
import CoinUpdatePage from './views/coin/CoinUpdate';

//Terminales
import TerminalListPage from './views/terminal/TerminalList';
import TerminalCreatePage from './views/terminal/TerminalCreate';
import TerminalUpdatePage from './views/terminal/TerminalUpdate';
import TerminalReportPage from './views/terminal/TerminalReport';

//reportes
import InventorySellPage from './views/reports/inventorySell';
import InventoryOfferPage from './views/reports/inventoryOffers';
import InventoryHistoryPage from './views/reports/inventoryHistory';
import InventoryListPage from './views/reports/InventoryList';
import InventoryReportPage from './views/reports/inventoryReport';
import BalanceReportPage from './views/reports/balanceReport';
import InventoryReportDailyPage from './views/reports/inventoryReportDaily';
import CommissionsReportPage from './views/reports/commissionsReport';
import PaymentMethodsPage from './views/reports/PaymentMethods';
import PaymentMethodsHistoryPage from './views/reports/PaymentMethodsHistory';
import PaymentMethodsGeneralReportPage from './views/reports/PaymentMethodsGeneralReport';
import DepartureListPage from './views/reports/departureList';
import InventoryReportPlusPage from './views/reports/inventoryReportPlus';
import InventoryAdjustmentHistoryPage from './views/reports/inventoryAdjustmentHistory';
import CronHistoryPage from './views/reports/cronHistory';
import OperatorsPerformancePage from './views/reports/operatorsPerformance';
import CashiersPerformancePage from './views/reports/cashiersPerformance';

//reportes Fiscales
import ReportFiscalPage from './views/reportsFiscal/ReportsFiscal';

//Salidas por degustación, autoconsumo o donación
import DeparturePage from './views/departures/departureCreate';

//ofertas
import OfferListPage from './views/offer/OfferList';
import OfferCreatePage from './views/offer/OfferCreate';
//Reporte de ofertas historial
import OfferReportPage from './views/reports/offerReport';

//Caja
import BoxCreatePage from './views/box/BoxCreate';
import BoxWithdrawalPage from './views/box/BoxWithdrawal';
import BoxClosePage from './views/box/BoxClose';
import BoxCorrectionPage from './views/box/boxCorrection';
import BoxHistoryPage from './views/box/boxHistory';
import BoxAddPage from './views/box/BoxAdd';

//Resguardo
import ResguardAddPage from './views/resguard/ResguardAdd';
import ResguardReportPage from './views/resguard/ResguardReport';
import ResguardWithdrawalPage from './views/resguard/ResguardWithdrawal';
import ResguardHistoryPage from './views/resguard/resguardHistory';
import WithdrawalConfirmPage from './views/resguard/WithdrawalConfirm';
import WithdrawalReportPage from './views/resguard/WithdrawalReport';


//Reporte de caja
import BoxReportPage from './views/reports/BoxReport';
import BoxCloseReportPage from './views/reports/boxCloseReport';

//clientes
import ClientListPage from './views/reports/clientList';


//  Ventas al mayor 
import WholesaleCreatePage from './views/wholesales/WholesaleCreate';
import CreditPaymentPage from './views/wholesales/CreditPayment';
import PendingPaymentsPage from './views/wholesales/PendingPayments';
import AccountsPayableListPage from './views/accountsPayable/AccountsPayableList';
import AccountsPayableCreatePage from './views/accountsPayable/AccountsPayableCreate';
import WholesaleClientListPage from './views/reports/wholesaleClientList';
import WholesaleClientUpdatePage from './views/users/WholesaleClientUpdatePage';
import WholesaleClientRegisterPage from './views/users/WholesaleClientRegisterPage';
import PaymentMethodsChartPage from './views/reports/PaymentMethodsChart';

// Pedidos
import OrderHistoryPage from './views/order/OrderHistory';
import OrderHelperPage from './views/order/OrderHelper';

// Activos
import AssetsListPage from './views/assets/AssetsListPage';
import AssetsCreatePage from './views/assets/AssetsCreatePage';
import AssetsUpdatePage from './views/assets/AssetsUpdatePage';
import AssetsRecordPage from './views/assets/AssetsRecordPage';
import AssetsDumpListPage from './views/assets/AssetsDumpListPage';

// Codigos de autorizacion 
import AuthorizationCodeCreatePage from './views/authorizationCode/AuthorizationCodeCreatePage';
import AuthorizationCodesPage from './views/authorizationCode/AuthorizationCodesPage';

// Lista de Suministros
import MiscellaneousListPage from './views/miscellaneous/MiscellaneousList';
import MiscellaneousToConfirmPage from './views/miscellaneous/MiscellaneousConfirmation';
import MiscellaneousCreatePage from './views/miscellaneous/MiscellaneousCreate';
import MiscellaneousUpdatePage from './views/miscellaneous/MiscellaneousUpdate';
import MiscellaneousListHistoryPage from './views/miscellaneous/MiscellaneousHistory';
import MiscellaneousInventoryCreatePage from './views/miscellaneous/MiscellaneousInventoryCreate';
import InventoryMiscellaneousReadjustment from './views/miscellaneous/InventoryMiscellaneousReadjustment';
import DepartureMiscellaneousPage from './views/miscellaneous/MiscellaneouDeparturesCreate';
import InventoryMiscellaneousHistoryPage from './views/miscellaneous/inventoryHistory';
import InventoryMiscellaneousReportPage from './views/miscellaneous/inventoryReport';
import Currency from './views/currency/Currency';
import InvoiceD from './views/auxi/invoicesD';
import PaymentFiscalMethodsPagee from './views/inventoryFiscal/PaymentFiscalMethodss';
import PurchaseAndSalesHistory from './views/inventoryFiscal/PurchaseAndSalesHistory';
import InventoryFiscalUpdate from './views/inventoryFiscal/InventoryFiscalUpdate';
import PendingPaymentsFiscalPage from './views/inventoryFiscal/PendingPaymentsFiscal';

//Vales

import ValePaymentPage from './views/vales/ValePayment';
import ValesCreatePage from './views/vales/ValeCreate';
import WholevaleCreatePage from './views/vales/WholesaleValeCreate';
import PendingValesPage from './views/vales/ValesPayments';

// Suministros

import OrderMiscellaneousHistoryPage from './views/orderMiscellaneous/OrderMiscellaneousHistory';
import DepartureMiscellaneousListPage from './views/reports/departureMiscellaneousList';
import MiscellaneousInventoryUpdatePage from './views/miscellaneous/MiscellaneousInventoryUpdated';
import SupplyNotesListPage from './views/miscellaneous/SupplyNotesListPage';
import SupplyUpdatedPage from './views/miscellaneous/SupplyUpdatedPage';
import InventoryWeeklyKpiPage from './views/miscellaneous/InventoryWeeklyKpiPage';
import SalesChartPage from './views/sales/SalesChart';

// soporte tecnico

import SupportListPage from './views/support/SupportListPage';
import SupportCreatePage from './views/support/SupportCreatePage';
import SupportDetailPage from './views/support/SupportDetailPage';
import InventoryReportResumePage from './views/reports/inventoryReportResume';

//import InventoryMiscellaneousReportPage from './views/miscellaneous/MiscellaneousInventoryReport';

function App() {
    const alert = useSelector(state => state.alert);
    const dispatch = useDispatch();
    const [closureModalMessage, setClosureModalMessage] = useState(null);

    useEffect(() => {
        const unlisten = history.listen((location, action) => {
            // limpiar alertas en cambio de ruta
            dispatch(alertActions.clear());
            setClosureModalMessage(null);
            // forzar scroll al inicio en cada cambio de pantalla
            if (typeof window !== 'undefined') {
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
            }
        });
        return () => {
            if (unlisten) unlisten();
        };
    }, [dispatch]);

    // Mensaje de cierre de forma de pago: ventana emergente con Aceptar (no banner que desaparece)
    useEffect(() => {
        if (alert.message && typeof alert.message === 'string' && alert.message.includes('cierre de forma de pago')) {
            setClosureModalMessage(alert.message);
            dispatch(alertActions.clear());
        }
    }, [alert.message, dispatch]);

    return (
        <Router history={history}>
        <NotificationProvider>
        <AppNotifications />
        <Modal isOpen={!!closureModalMessage} toggle={() => setClosureModalMessage(null)} backdrop="static" size="md" centered>
            <div className="modal-header">
                <h5 className="modal-title">Aviso</h5>
                <button type="button" className="close" aria-label="Close" onClick={() => setClosureModalMessage(null)}>
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div className="modal-body">
                <p className="mb-0">{closureModalMessage}</p>
            </div>
            <div className="modal-footer">
                <Button color="primary" onClick={() => setClosureModalMessage(null)}>Aceptar</Button>
            </div>
        </Modal>
            <Switch>
                <Route exact path="/" component={LandingPage} />
                <Route path="/login" component={LoginPage} />
                <PrivateRoute path="/profile" component={ProfilePage} />
                <PrivateRoute path="/home" component={HomePage} />

                {/* Usuarios */}
                <PrivateRoute path="/users" roles={[Role.Admin, Role.Supervisor]} component={UsersListPage} />
                <PrivateRoute path="/register-user" roles={[Role.Admin, Role.Supervisor]} component={UserCreatePage} />
                <PrivateRoute path="/update-user" roles={[Role.Admin, Role.Supervisor]} component={UserUpdatePage} />
                <PrivateRoute path="/update-client" roles={[Role.Admin, Role.Manager, Role.Collector]} component={ClientUpdatePage} />
                <PrivateRoute path="/update-wholesale-client" roles={[Role.Admin, Role.Manager, Role.Collector]} component={WholesaleClientUpdatePage} />
                <PrivateRoute path="/register-wholesale-client" roles={[Role.Admin, Role.Manager, Role.Collector]} component={WholesaleClientRegisterPage} />
                <PrivateRoute path="/sellers" roles={[Role.Admin, Role.AuditorGeneral]} component={SellersListPage} />
                <PrivateRoute path="/register-seller" roles={[Role.Admin]} component={SellerCreatePage} />
                <PrivateRoute path="/update-seller" roles={[Role.Admin, Role.AuditorGeneral]} component={SellerUpdatePage} />

                {/* Trabajadores */}
                <PrivateRoute path="/operators" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales, Role.AuditorGeneral]} component={OperatorListPage} />
                <PrivateRoute path="/register-operator" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales]} component={OperatorCreatePage} />
                <PrivateRoute path="/update-operator" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales]} component={OperatorUpdatePage} />

                {/* Sucursales */}
                <PrivateRoute path="/agency" roles={[Role.Admin, Role.Supervisor, Role.Telesales, Role.AuditorGeneral]} component={AgencyListPage} />
                <PrivateRoute path="/register-agency" roles={[Role.Admin]} component={AgencyCreatePage} />
                <PrivateRoute path="/update-agency" roles={[Role.Admin, Role.Telesales, Role.AuditorGeneral]} component={AgencyUpdatePage} />
                <PrivateRoute path="/agency-close-history" roles={[Role.Admin, Role.Supervisor, Role.AuditorGeneral]} component={AgencyCloseHistoryPage} />

                {/* Productos */}
                <PrivateRoute path="/product" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Cashier, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={ProductListPage} />
                <PrivateRoute path="/register-product" roles={[Role.Admin]} component={ProductCreatePage} />
                <PrivateRoute path="/update-product" roles={[Role.Admin]} component={ProductUpdatePage} />
                <PrivateRoute path="/product-history" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales]} component={ProductListHistoryPage} />
                <PrivateRoute path="/combos" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Cashier, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinanciero]} component={CombosListPage} />
                <PrivateRoute path="/create-combo" roles={[Role.Admin]} component={CombosCreatePage} />
                <PrivateRoute path="/update-combo" roles={[Role.Admin]} component={CombosUpdatePage} />
                <PrivateRoute path="/record-combo" roles={[Role.Admin, Role.Supervisor]} component={CombosRecordPage} />

                {/* Inventario */}
                <PrivateRoute path="/inventory" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Cashier, Role.Collector, Role.Auditor, Role.Telesales]} component={InventoryListPage} />
                <PrivateRoute path="/register-inventory" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Telesales]} component={InventoryCreatePage} />
                <PrivateRoute path="/inventory-reweigh" roles={[Role.Admin, Role.Supervisor, Role.Manager]} component={InventoryReweighPage} />
                <PrivateRoute path="/readjustment" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales]} component={InventoryReadjustmentPage} />
                <PrivateRoute path="/inventory-reset" roles={[Role.Admin, Role.Supervisor, Role.Manager]} component={InventoryResetPage} />
                <PrivateRoute path="/inventory-entry-history" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Telesales]} component={InventoryEntryHistoryPage} />
                <PrivateRoute path="/sales-notes" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales]} component={SalesNotesListPage} />
                <PrivateRoute path="/sales-updated" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales]} component={SalesUpdatedPage} />

                {/* Inventario Fiscal */}
                <PrivateRoute path="/register-inventory-special" roles={[Role.Admin, Role.AuditorFinanciero, Role.Supervisor]} component={InventoryFiscalCreatePage} />
                <PrivateRoute path="/update-inventory-special" roles={[Role.Admin, Role.AuditorFinanciero, Role.Supervisor]} component={InventoryFiscalUpdate} />
                <PrivateRoute path="/readjustment-special" roles={[Role.Admin, Role.Manager, Role.Cashier, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={InventoryFiscalReadjustmentPage} />
                <PrivateRoute path="/tickets-list-special" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={TicketsListFiscalPage} />
                <PrivateRoute path="/inventory-special-sell" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.AuditorFinanciero]} component={InventoryFiscalSellPage} />
                <PrivateRoute path="/inventory-history-special" roles={[Role.Admin, Role.Manager, Role.Cashier, Role.AuditorFinanciero]} component={InventoryFiscalHistoryPage} />
                <PrivateRoute path="/kpis-monitoreo-especial" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={KPIsMonitoreoEspecialPage} />
                <PrivateRoute path="/payment-special-methods-report" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.Supervisor, Role.AuditorGeneral]} component={PaymentFiscalMethodsPagee} />
                <PrivateRoute path="/payment-special-methods-history" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.Supervisor, Role.AuditorGeneral]} component={PaymentFiscalMethodsHistory} />
                <PrivateRoute path="/purchase-and-sales-history" roles={[Role.Admin, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={PurchaseAndSalesHistory} />
                <PrivateRoute path="/inventory-special-sell" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Collector, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={InventorySellPage} />


                {/* Suministros */}
                <PrivateRoute path="/miscellaneous" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousListPage} />
                <PrivateRoute path="/order-history-miscellaneous" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={OrderMiscellaneousHistoryPage} />

                <PrivateRoute path="/register-miscellaneous" roles={[Role.Admin, Role.Supervisor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousCreatePage} />
                <PrivateRoute path="/update-miscellaneous" roles={[Role.Admin, Role.Supervisor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousUpdatePage} />
                <PrivateRoute path="/miscellaneous-history" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousListHistoryPage} />
                <PrivateRoute path="/miscellaneous-pending" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousToConfirmPage} />

                <PrivateRoute path="/register-miscellaneous-inventory" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Cashier, Role.Collector, Role.Auditor, Role.suply, Role, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousInventoryCreatePage} />

                <PrivateRoute path="/updated-miscellaneous-inventory" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Cashier, Role.Collector, Role.Auditor, Role.suply, Role, Role.Telesales, Role.AuditorFinanciero]} component={MiscellaneousInventoryUpdatePage} />
                <PrivateRoute path="/readjustment-miscellaneous" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={InventoryMiscellaneousReadjustment} />
                <PrivateRoute path="/departure-miscellaneous" roles={[Role.Admin, Role.Manager, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={DepartureMiscellaneousPage} />
                <PrivateRoute path="/departure-miscellaneous-list" roles={[Role.Admin, Role.Manager, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={DepartureMiscellaneousListPage} />

                <PrivateRoute path="/inventory-miscellaneous-history" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={InventoryMiscellaneousHistoryPage} />
                <PrivateRoute path="/inventory-miscellaneous-report" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={InventoryMiscellaneousReportPage} />
                <PrivateRoute path="/supply-notes" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={SupplyNotesListPage} />
                <PrivateRoute path="/supply-updated" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={SupplyUpdatedPage} />
                <PrivateRoute path="/inventory-weekly-kpi" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.suplyRole, Role.Telesales, Role.AuditorFinanciero]} component={InventoryWeeklyKpiPage} />

                {/* Ventas */}
                <PrivateRoute path="/sales" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={SalesListManagerPage} />
                <PrivateRoute path="/sales-chart" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.AuditorGeneral]} component={SalesChartPage} />
                <PrivateRoute path="/real-time-goals" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.AuditorGeneral]} component={RealTimeGoalsPage} />

                <PrivateRoute path="/offline-sales" roles={[Role.Admin, Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={SalesCreateOfflinePage} />
                <PrivateRoute path="/sales-daily" roles={[Role.Admin, Role.Cashier]} component={SalesListDailyPage} />
                <PrivateRoute path="/register-sale" roles={[Role.Admin, Role.Cashier, Role.Manager, Role.Telesales]} component={SalesCreatePage} />
                <PrivateRoute path="/sales-user" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={SalesListUserPage} />
                <PrivateRoute path="/sales-combos-chart" roles={[Role.Admin, Role.Manager, Role.Telesales, Role.AuditorGeneral]} component={SalesCombosChartPage} />
                <PrivateRoute path="/historial-cupones" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Cashier, Role.Telesales, Role.AuditorGeneral]} component={CouponHistoryPage} />

                {/* Ventas al mayor */}
                <PrivateRoute path="/register-wholesale" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={WholesaleCreatePage} />
                <PrivateRoute path="/credit-payment" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={CreditPaymentPage} />
                <PrivateRoute path="/pending-payments" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={PendingPaymentsPage} />
                <PrivateRoute path="/accounts-payable" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={AccountsPayableListPage} />
                <PrivateRoute path="/register-accounts-payable" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Telesales]} component={AccountsPayableCreatePage} />
                <PrivateRoute path="/pending-payments-special" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={PendingPaymentsFiscalPage} />


                {/* Ventas Fiscales */}
                <PrivateRoute path="/sales-special" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={SalesFiscalListManagerPage} />

                <PrivateRoute path="/register-sale-special" roles={[Role.Admin, Role.Cashier, Role.Manager, Role.Telesales]} component={SalesFiscalCreatePage} />
                <PrivateRoute path="/register-wholesale-special" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={WholesaleFiscalCreatePage} />
                <PrivateRoute path="/offline-sales-special" roles={[Role.Admin, Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={SalesFiscalCreateOfflinePage} />
                <PrivateRoute path="/credit-special-payment" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales]} component={CreditFiscalPaymentPage} />

                {/* Televentas */}
                <PrivateRoute path="/telesales" roles={[Role.Admin, Role.Supervisor, Role.Telesales]} component={TelesalesListPage} />
                <PrivateRoute path="/telesales-commissions-report" roles={[Role.Cashier, Role.Admin, Role.Telesales]} component={TelesalesCommissionsReportPage} />
                <PrivateRoute path="/telesales-pending-payments" roles={[Role.Admin, Role.Telesales]} component={TelesalesPendingPaymentsPage} />

                {/* Monedas */}
                <PrivateRoute path="/coin" roles={[Role.Admin, Role.Supervisor, Role.Telesales, Role.AuditorGeneral]} component={CoinListPage} />
                {/* <PrivateRoute path="/register-coin" roles={[Role.Admin, Role.Telesales]} component={CoinCreatePage} /> */}
                <PrivateRoute path="/update-coin" roles={[Role.Admin, Role.Telesales, Role.AuditorGeneral]} component={CoinUpdatePage} />
                <PrivateRoute path="/history-coin" roles={[Role.Admin]} component={CoinHistoryPage} />
                <PrivateRoute path="/currency" roles={[Role.Admin]} component={Currency} />


                {/* Terminales */}
                <PrivateRoute path="/terminal" roles={[Role.Admin, Role.Supervisor, Role.Collector, Role.Telesales, Role.AuditorGeneral]} component={TerminalListPage} />
                <PrivateRoute path="/register-terminal" roles={[Role.Admin, Role.Telesales, Role.AuditorGeneral]} component={TerminalCreatePage} />
                <PrivateRoute path="/update-terminal" roles={[Role.Admin, Role.Telesales, Role.AuditorGeneral]} component={TerminalUpdatePage} />
                <PrivateRoute path="/terminal-reports" roles={[Role.Admin, Role.AuditorGeneral]} component={TerminalReportPage} />

                {/* Salidas por degustación, autoconsumo o donación */}
                <PrivateRoute path="/departure" roles={[Role.Admin, Role.Manager, Role.Telesales]} component={DeparturePage} />

                {/* Ofertas */}
                <PrivateRoute path="/offer" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={OfferListPage} />
                <PrivateRoute path="/create-offer" roles={[Role.Admin]} component={OfferCreatePage} />

                {/* Caja */}
                <PrivateRoute path="/box-opening" roles={[Role.Admin]} component={BoxCreatePage} />
                <PrivateRoute path="/box-withdrawal" roles={[Role.Manager, Role.Admin, Role.Collector, Role.Telesales]} component={BoxWithdrawalPage} />
                <PrivateRoute path="/box-close" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.Auditor, Role.Telesales, Role.AuditorFinanciero]} component={BoxClosePage} />
                <PrivateRoute path="/box-correction" roles={[Role.Admin, Role.Collector, Role.Telesales]} component={BoxCorrectionPage} />
                <PrivateRoute path="/box-history" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={BoxHistoryPage} />
                <PrivateRoute path="/box-add" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Telesales]} component={BoxAddPage} />

                {/* Resguardo */}
                <PrivateRoute path="/resguard-add" roles={[Role.Manager, Role.Collector, Role.Admin, Role.Telesales]} component={ResguardAddPage} />
                <PrivateRoute path="/resguard-report" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={ResguardReportPage} />
                <PrivateRoute path="/resguard-withdrawal" roles={[Role.Manager, Role.Admin, Role.Supervisor, Role.Telesales, Role.Collector]} component={ResguardWithdrawalPage} />
                <PrivateRoute path="/resguard-confirm-withdrawal" roles={[Role.Admin, Role.AuditorGeneral]} component={WithdrawalConfirmPage} />
                <PrivateRoute path="/withdrawal-report" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={WithdrawalReportPage} />
                <PrivateRoute path="/resguard-history" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={ResguardHistoryPage} />


                {/* Ordenes */}
                <PrivateRoute path="/order-history" roles={[Role.Admin, Role.Auditor, Role.Manager, Role.Collector, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero]} component={OrderHistoryPage} />
                <PrivateRoute path="/order-helper" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.Telesales]} component={OrderHelperPage} />


                {/* Reportes */}
                <PrivateRoute path="/inventory-sell" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Collector, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={InventorySellPage} />
                <PrivateRoute path="/inventory-history" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.Auditor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={InventoryHistoryPage} />
                <PrivateRoute path="/inventory-report" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Collector, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={InventoryReportPage} />
                <PrivateRoute path="/inventory-report-resume" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Collector, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={InventoryReportResumePage} />
                <PrivateRoute path="/balance-report" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinancierom, Role.AuditorGeneral]} component={BalanceReportPage} />
                <PrivateRoute path="/inventory-report-daily" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales]} component={InventoryReportDailyPage} />
                <PrivateRoute path="/commissions-report" roles={[Role.Admin, Role.Auditor, Role.Supervisor, Role.AuditorFinanciero, Role.AuditorGeneral]} component={CommissionsReportPage} />
                <PrivateRoute path="/payment-methods-report" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.AuditorGeneral, Role.Telesales, Role.AuditorFinanciero]} component={PaymentMethodsPage} />
                <PrivateRoute path="/payment-methods-history" roles={[Role.Admin, Role.Manager, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={PaymentMethodsHistoryPage} />
                <PrivateRoute path="/payment-methods-chart" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.AuditorFinanciero]} component={PaymentMethodsChartPage} />
                <PrivateRoute path="/payment-methods-general-report" roles={[Role.Admin, Role.AuditorFinanciero, Role.AuditorGeneral]} component={PaymentMethodsGeneralReportPage} />
                <PrivateRoute path="/departures" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Collector, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={DepartureListPage} />
                <PrivateRoute path="/inventory-report-plus" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales]} component={InventoryReportPlusPage} />
                <PrivateRoute path="/inventory-adjustment-history" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Telesales, Role.AuditorFinanciero]} component={InventoryAdjustmentHistoryPage} />
                <PrivateRoute path="/offer-history" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales, Role.AuditorGeneral]} component={OfferReportPage} />
                <PrivateRoute path="/cron-history" roles={[Role.Admin, Role.Supervisor, Role.Telesales]} component={CronHistoryPage} />
                <PrivateRoute path="/inventory-offer" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Telesales, Role.AuditorGeneral]} component={InventoryOfferPage} />
                <PrivateRoute path="/box-report" roles={[Role.Admin, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={BoxReportPage} />
                <PrivateRoute path="/box-close-report" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={BoxCloseReportPage} />
                <PrivateRoute path="/client-list" roles={[Role.Admin, Role.Manager, Role.Cashier, Role.Collector, Role.Auditor, Role.Telesales, Role.Supervisor, Role.AuditorFinanciero]} component={ClientListPage} />
                <PrivateRoute path="/wholesale-client-list" roles={[Role.Admin, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.Supervisor, Role.AuditorFinanciero]} component={WholesaleClientListPage} />
                <PrivateRoute path="/operators-performance" roles={[Role.Admin, Role.Manager, Role.Auditor, Role.Supervisor, Role.AuditorFinanciero]} component={OperatorsPerformancePage} />
                <PrivateRoute path="/cashiers-performance" roles={[Role.Admin, Role.Manager, Role.Auditor, Role.Supervisor, Role.AuditorFinanciero]} component={CashiersPerformancePage} />

                {/* Reporte fiscal */}
                <PrivateRoute path="/monthly-report" roles={[Role.Admin, Role.AuditorFinanciero]} component={ReportFiscalPage} />


                {/* Activos */}
                <PrivateRoute path="/assets" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Telesales, Role.AuditorFinanciero]} component={AssetsListPage} />
                <PrivateRoute path="/register-assets" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero]} component={AssetsCreatePage} />
                <PrivateRoute path="/update-assets" roles={[Role.Admin, Role.Manager, Role.Supervisor, Role.Telesales, Role.AuditorFinanciero]} component={AssetsUpdatePage} />
                <PrivateRoute path="/assets-record" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Auditor, Role.Telesales, Role.AuditorFinanciero]} component={AssetsRecordPage} />
                <PrivateRoute path="/assets-dump" roles={[Role.Admin, Role.Supervisor, Role.Auditor, Role.Telesales, Role.AuditorFinanciero]} component={AssetsDumpListPage} />

                {/* Codigos de autorizacion */}
                <PrivateRoute path="/create-authorization-code" roles={[Role.Admin, Role.AuditorFinanciero]} component={AuthorizationCodeCreatePage} />
                <PrivateRoute path="/authorization-codes" roles={[Role.Admin, Role.AuditorFinanciero, Role.AuditorGeneral]} component={AuthorizationCodesPage} />
                <PrivateRoute path="/invoices-d" roles={[Role.AuditorFinanciero, Role.Admin]} component={InvoiceD} />

                {/* Vales */}
                <PrivateRoute path="/register-vale" roles={[Role.Admin, Role.Supervisor, Role.Manager, Role.Collector, Role.Auditor, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={ValesCreatePage} />
                <PrivateRoute path="/register-wholevale" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={WholevaleCreatePage} />
                <PrivateRoute path="/vale-payments" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={ValePaymentPage} />
                <PrivateRoute path="/pending-vales" roles={[Role.Cashier, Role.Admin, Role.Manager, Role.Telesales, Role.AuditorFinanciero, Role.AuditorGeneral]} component={PendingValesPage} />

                
                {/* soporte tecnico */}
              <PrivateRoute path="/support-list" roles={[Role.Admin, Role.Manager, Role.AuditorGeneral]} component={SupportListPage} />
              <PrivateRoute path="/support-create" roles={[Role.Admin, Role.Manager, Role.AuditorGeneral]} component={SupportCreatePage} />
              <PrivateRoute path="/support-detail/:id" roles={[Role.Admin, Role.Manager, Role.AuditorGeneral]} component={SupportDetailPage} />

            </Switch>
        </NotificationProvider>

        </Router>
    );
}

export default App