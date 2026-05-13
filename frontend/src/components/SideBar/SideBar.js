/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { salesActions } from '../../actions';
// reactstrap components
import {
	Collapse,
} from "reactstrap";
import { useLocation, NavLink, useHistory } from "react-router-dom";
import { useIdleTimer } from 'react-idle-timer';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos


/**
 * Iconos
 */
import balanceScale from '@iconify/icons-fa-solid/balance-scale';
import storeIcon from '@iconify/icons-fa-solid/store';
import listAlt from '@iconify/icons-fa-solid/list-alt';
import creditCard from '@iconify/icons-fa-solid/credit-card';
import userFriends from '@iconify/icons-fa-solid/user-friends';
import donateIcon from '@iconify/icons-fa-solid/donate';
import listUl from '@iconify/icons-fa-solid/list-ul';
import dollyIcon from '@iconify/icons-fa-solid/dolly';
import cashRegister from '@iconify/icons-fa-solid/cash-register';
import boxesIcon from '@iconify/icons-fa-solid/boxes';
import clipboardIcon from '@iconify/icons-fa-solid/clipboard';
import clipboardList from '@iconify/icons-fa-solid/clipboard-list';
import undoAlt from '@iconify/icons-fa-solid/undo-alt';
import moneyBillWave from '@iconify/icons-fa-solid/money-bill-wave';
import clipboardCheck from '@iconify/icons-fa-solid/clipboard-check';
import bookIcon from '@iconify/icons-fa-solid/book';
import bookMedical from '@iconify/icons-fa-solid/book-medical';
import bookDead from '@iconify/icons-fa-solid/book-dead';
import cartPlus from '@iconify/icons-fa-solid/cart-plus';
import doorOpen from '@iconify/icons-fa-solid/door-open';
import chartLine from '@iconify/icons-fa-solid/chart-line';
import fileAlt from '@iconify/icons-fa-solid/file-alt';
import plusCircle from '@iconify/icons-fa-solid/plus-circle';
import editIcon from '@iconify/icons-fa-solid/edit';
import angleUp from '@iconify/icons-fa-solid/angle-up';
import angleDown from '@iconify/icons-fa-solid/angle-down';
import bullhornIcon from '@iconify/icons-fa-solid/bullhorn';
import boxIcon from '@iconify/icons-fa-solid/box';
import briefcaseIcon from '@iconify/icons-fa-solid/briefcase';
import folderPlus from '@iconify/icons-fa-solid/folder-plus';
import folderMinus from '@iconify/icons-fa-solid/folder-minus';
import tasksIcon from '@iconify/icons-fa-solid/tasks';
import tableIcon from '@iconify/icons-fa-solid/table';
import pencilAlt from '@iconify/icons-fa-solid/pencil-alt';
import maleIcon from '@iconify/icons-fa-solid/male';
import trashIcon from '@iconify/icons-fa-solid/trash';
import ticketAlt from '@iconify/icons-fa-solid/ticket-alt';
import receiptIcon from '@iconify/icons-fa-solid/receipt';
import { keyboardShortcuts } from './keyboardShortcuts';
import { getCollapseIdForRoute } from './routeCollapseMap';
import MenuSection from './MenuSection';
import MenuItem from './MenuItem';
import Icon from '@iconify/react';



//Menu lateral en admin 
function SideBar() {

	const history = useHistory();

	/**
   * Antes de cerrar la ventana o tab si hay ventas por procesar enviar un alerta
   */
	window.addEventListener("beforeunload", (ev) => {
		let inProcess = localStorage.getItem('SALEPROCESS');
		if (inProcess) {
		  ev.preventDefault();
		  return ev.returnValue = '¡Tiene ventas por procesar pendientes!';
		}
	});

	// Manejo de eventos de teclado simplificado
	useEffect(() => {
		const handleKeyDown = (event) => {
		  if (event.ctrlKey) {
			const key = event.key.toLowerCase();
			const route = keyboardShortcuts[key];
	
			if (route) {
			  event.preventDefault();
			  history.push(route);
			}
		  }
		};
	
		window.addEventListener('keydown', handleKeyDown);
	
		return () => {
		  window.removeEventListener('keydown', handleKeyDown);
		};
	  }, [history]);


	const dispatch = useDispatch();
	const location = useLocation();
	const user = useSelector(state => state.authentication.user);

	// collapse states and functions
	const [collapses, setCollapses] = useState([]);

	const changeCollapse = collapse => {

		if (collapses.includes(collapse)) {
			setCollapses(collapses.filter(prop => prop !== collapse));
		} else {
			setCollapses([...collapses, collapse]);
		}
	};

	/**
	 * En momentos de inactividad realizar consulta de monedas productos y terminales
	 * - Ejecuta la funcion salesDataFormOffline cada 10 segundos
	 */
	const handleOnIdle = () => {
		dispatch(salesActions.salesDataFormOffline(user.agency.id));
		reset();
	}
	const { reset } = useIdleTimer({
		timeout: 10000,//10 segundos
		onIdle: handleOnIdle,
		debounce: 500
	})

	 // Auto-expandir secciones según la ruta actual
	 useEffect(() => {
		const collapseId = getCollapseIdForRoute(location.pathname);
		if (collapseId) {
		  // Asegurar que el collapse esté abierto, incluso si ya estaba abierto
		  // Esto previene que se cierre si el usuario navega entre rutas del mismo collapse
		  setCollapses(prevCollapses => {
			if (!prevCollapses.includes(collapseId)) {
			  return [...prevCollapses, collapseId];
			}
			return prevCollapses;
		  });
		}
	}, [location.pathname]);

	//ventas offline pendientes
	const pending = useSelector(state => state.pending);

	const [pendingSales, setPendingSales] = useState('');

	//Colocar cantidad de pendientes en el menú
	const getPendings = () => {
		if (pending.sales && pending.sales.length > 0) {
			setPendingSales(`(${pending.sales.length})`);
		} else {
			setPendingSales('')
		}
	};
	useEffect(() => {
		getPendings();
	}, [pending.sales]);
	const { darkMode } = useDarkMode();

	const closeSidebarMobile = () => {
		const wrapper = document.getElementById('wrapper');
		if (wrapper) {
			wrapper.classList.remove('toggled');
			document.body.classList.remove('sidebar-open-mobile');
		}
	};

	return (
		<>
			<div
				className="sidebar-backdrop d-md-none"
				onClick={closeSidebarMobile}
				onKeyDown={(e) => e.key === 'Escape' && closeSidebarMobile()}
				role="button"
				tabIndex={0}
				aria-label="Cerrar menú"
			/>
			<div className={` ${darkMode ? "dark-mode" : ""}`} id="sidebar-wrapper">
				<div className="sidebar-heading">
					<NavLink to="/home" className="sidebar-brand-link">
						<span className="sidebar-brand-text">
							Orquesta <span className="sidebar-brand-accent">Cafè</span>
						</span>
					</NavLink>
				</div>

				<div className="list-group list-group-flush" >
					<div aria-multiselectable={true} id="accordion" role="tablist">
						<>
						  <MenuSection
						    collapseId={2}
							title="Sucursales"
							icon={storeIcon}
							collapses={collapses}
							changeCollapse={changeCollapse}
							darkMode={darkMode}
							roles={[1, 2, 7, 10]}
							userRole={user.role}
							>
								<MenuItem
									to="/agency"
									icon={listAlt}
									text="Lista"
									darkMode={darkMode}
									roles={[1, 2, 7, 10]}
									userRole={user.role}
								/>
								{/*<MenuItem
									to="/agency-close-history"
									icon={bullhornIcon}
									text="Historial de cierre"
									darkMode={darkMode}
									roles={[1, 2, 10]}
									userRole={user.role}
								/>*/}
							</MenuSection>
							<MenuSection
								collapseId={13}
								title="Registrar Ventas"
								icon={cashRegister}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,4,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/credit-payment"
									icon={bookMedical}
									text="Pagar crédito pendiente"
									darkMode={darkMode}
									roles={[1,3,4,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/pending-payments"
									icon={bookMedical}
									text="Cuentas por cobrar"
									darkMode={darkMode}
									roles={[1,2,3,4,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-wholesale"
									icon={cartPlus}
									text="Registrar venta al Mayor"
									darkMode={darkMode}
									roles={[]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-sale"
									icon={cartPlus}
									text="Registrar venta al Detal"
									darkMode={darkMode}
									roles={[1,3,4,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/offline-sales"
									icon={bookDead}
									text="Ventas Offline al Detal"
									darkMode={darkMode}
									roles={[1,3,4,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/historial-cupones"
									icon={receiptIcon}
									text="Historial de cupones"
									darkMode={darkMode}
									roles={[1,3,4,7,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={24}
								title="Registrar Ventas Especiales"
								icon={cashRegister}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[]}
								userRole={user.role}
							>
								<MenuItem
									to="/credit-special-payment"
									icon={bookMedical}
									text="Pagar crédito especial pendiente"
									darkMode={darkMode}
									roles={[1,3,4]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-wholesale-special"
									icon={cartPlus}
									text="Registrar venta especial al mayor"
									darkMode={darkMode}
									roles={[1,3,4]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-sale-special"
									icon={cartPlus}
									text="Registrar venta especial al Detal"
									darkMode={darkMode}
									roles={[1,3,4]}
									userRole={user.role}
								/>
								<MenuItem
									to="/offline-sales-special"
									icon={bookDead}
									text="Ventas especiales Offline al Detal"
									darkMode={darkMode}
									roles={[1,3,4]}
									userRole={user.role}
								/>
								
							</MenuSection>
							<MenuSection
								collapseId={11}
								title="Caja de tienda"
								icon={briefcaseIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/box-opening"
									icon={folderPlus}
									text="Apertura"
									darkMode={darkMode}
									roles={[1]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-withdrawal"
									icon={folderMinus}
									text="Retiro"
									darkMode={darkMode}
									roles={[1,3,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/resguard-add"
									icon={folderMinus}
									text="Retiro a Resguardo"
									darkMode={darkMode}
									roles={[1,3,4,5]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-add"
									icon={folderMinus}
									text="Ingreso"
									darkMode={darkMode}
									roles={[1,3,5,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-close"
									icon={tasksIcon}
									text="Cierre"
									darkMode={darkMode}
									roles={[1,2,3,6,7,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-correction"
									icon={pencilAlt}
									text="Corrección"
									darkMode={darkMode}
									roles={[1,5]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-report"
									icon={tableIcon}
									text="Reporte de caja de tienda"
									darkMode={darkMode}
									roles={[1,2,5,6,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-close-report"
									icon={tableIcon}
									text="Reporte de cierres de caja de tienda"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/box-history"
									icon={tableIcon}
									text="Historial de caja de tienda"
									darkMode={darkMode}
									roles={[1,2,5,6,9,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={12}
								title="Caja Fuerte"
								icon={briefcaseIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/resguard-report"
									icon={folderPlus}
									text="Dinero actual en caja fuerte"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/resguard-withdrawal"
									icon={folderMinus}
									text="Retiro de caja fuerte"
									darkMode={darkMode}
									roles={[1,2,3,5,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/withdrawal-report"
									icon={folderMinus}
									text="Retiros de la caja fuerte por confirmar"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/resguard-history"
									icon={tasksIcon}
									text="Historial de caja fuerte"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={7}
								title="Puntos de venta"
								icon={creditCard}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,7,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/terminal"
									icon={listAlt}
									text="Lista"
									darkMode={darkMode}
									roles={[1,7,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/terminal-reports"
									icon={plusCircle}
									text="Reporte de puntos"
									darkMode={darkMode}
									roles={[1,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={1}
								title="Usuarios"
								icon={userFriends}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,10]}
								userRole={user.role}
							>
							<MenuItem
								to="/users"
								icon={listAlt}
								text="Lista"
								darkMode={darkMode}
								roles={[1,2]}
								userRole={user.role}
							/>
							<MenuItem
								to="/sellers"
								icon={listAlt}
								text="Vendedores"
								darkMode={darkMode}
								roles={[1,10]}
								userRole={user.role}
							/>
							</MenuSection>
							<MenuSection
								collapseId={21}
								title="Activos"
								icon={userFriends}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2, 3,6,7,9]}
								userRole={user.role}
							>
								<MenuItem
									to="/assets"
									icon={listAlt}
									text="Lista"
									darkMode={darkMode}
									roles={[1,2,3,6,7,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/assets-record"
									icon={listAlt}
									text="Movimientos"
									darkMode={darkMode}
									roles={[1,2,3,6,7,9]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={14}
								title="Trabajadores"
								icon={userFriends}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,7,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/operators"
									icon={listAlt}
									text="Operadores"
									darkMode={darkMode}
									roles={[1,2,3,7,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={6}
								title="Tipo de cambio"
								icon={donateIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,7,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/coin"
									icon={listAlt}
									text="Lista"
									darkMode={darkMode}
									roles={[1,7,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={3}
								title="Catálogo de productos"
								icon={listUl}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1, 2, 3,4,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/product"
									icon={listAlt}
									text="Lista"
									darkMode={darkMode}
									roles={[1, 2, 3,4,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/product-history"
									icon={undoAlt}
									text="Historial"
									darkMode={darkMode}
									roles={[1, 2]}
									userRole={user.role}
								/>
								<MenuItem
									to="/combos"
									icon={undoAlt}
									text="Lista de Combos"
									darkMode={darkMode}
									roles={[1, 2, 5,6,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/record-combo"
									icon={undoAlt}
									text="Historial de combos"
									darkMode={darkMode}
									roles={[1, 2]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={23}
								title="Suministros"
								icon={listUl}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,7,8,9]}
								userRole={user.role}
							>
								<MenuItem
									to="/miscellaneous"
									icon={listAlt}
									text="Lista"
									darkMode={darkMode}
									roles={[1,2,3,7,8,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-miscellaneous-inventory"
									icon={doorOpen}
									text="Ingresar Suministro"
									darkMode={darkMode}
									roles={[1,2,3,7,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/order-history-miscellaneous"
									icon={bookMedical}
									text="Pedidos"
									darkMode={darkMode}
									roles={[1,2,3,8,9]}
									userRole={user.role}
								/>
								{/* <MenuItem
									to="/miscellaneous-pending"
									icon={listAlt}
									text="Historial de pedidos"
									darkMode={darkMode}
									roles={[1,2,3,8,9]}
									userRole={user.role}
								/>  */}
								<MenuItem
									to="/readjustment-miscellaneous"
									icon={doorOpen}
									text="Inventario Físico"
									darkMode={darkMode}
									roles={[1,2,3,7,8,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/departure-miscellaneous-list"
									icon={doorOpen}
									text="Registro de Salidas"
									darkMode={darkMode}
									roles={[1,2,3,7,8,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-miscellaneous-history"
									icon={doorOpen}
									text="Historial de inventario"
									darkMode={darkMode}
									roles={[1,2,3,8,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-miscellaneous-report"
									icon={doorOpen}
									text="Reporte de inventario"
									darkMode={darkMode}
									roles={[1,2,3,8,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/supply-notes"
									icon={fileAlt}
									text="Notas de entrega de suministros"
									darkMode={darkMode}
									roles={[1,2,3,7,8,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-weekly-kpi"
									icon={chartLine}
									text="Consumo semanal de suministros"
									darkMode={darkMode}
									roles={[1,2,3,7,8,9]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={4}
								title="Inventarios"
								icon={dollyIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,4,5,6,7]}
								userRole={user.role}
							>
								<MenuItem
									to="/register-inventory"
									icon={doorOpen}
									text="Inicial/Entrada"
									darkMode={darkMode}
									roles={[1,2,3,6,7]}
									userRole={user.role}
								/>

								<MenuItem
									to="/readjustment"
									icon={editIcon}
									text="Inventario físico"
									darkMode={darkMode}
									roles={[1,2,3,6,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/order-history"
									icon={bookMedical}
									text="Pedidos"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7]}
									userRole={user.role}
								/>
								<MenuItem
									to="/order-helper"
									icon={bookMedical}
									text="Ayuda a pedidos"
									darkMode={darkMode}
									roles={[1,2]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-entry-history"
									icon={editIcon}
									text="Historial de entradas"
									darkMode={darkMode}
									roles={[1,2,3,6]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory"
									icon={boxesIcon}
									text="Repesaje Diario"
									darkMode={darkMode}
									roles={[1,2,3,4,5,6,7]}
									userRole={user.role}	
								/>
								<MenuItem
								   to='/sales-notes'
								   icon={fileAlt}
								   text="Notas de entrega"
								   darkMode={darkMode}
								   roles={[1,2,3,5]}
								   userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={26}
								title="Registrar Vales"
								icon={cashRegister}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,9]}
								userRole={user.role}
							>
								<MenuItem
									to="/vale-payments"
									icon={bookMedical}
									text="Pagar vale pendiente"
									darkMode={darkMode}
									roles={[1,2,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-vale"
									icon={cartPlus}
									text="Registrar venta al Detal"
									darkMode={darkMode}
									roles={[1,2,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/pending-vales"
									icon={bookMedical}
									text="Vales pendientes"
									darkMode={darkMode}
									roles={[1,2,9,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection 
								collapseId={25}
								title="Inventario especial"
								icon={dollyIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,4,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/tickets-list-special"
									icon={listAlt}
									text="Historial de compras especial"
									darkMode={darkMode}
									roles={[1,2,3,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-inventory-special"
									icon={doorOpen}
									text="Inicial/Entrada"
									darkMode={darkMode}
									roles={[1]}
									userRole={user.role}
								/>
								<MenuItem
									to="/readjustment-special"
									icon={editIcon}
									text="Inventario especial"
									darkMode={darkMode}
									roles={[1,2,3,4,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-history-special"
									icon={undoAlt}
									text="Historial de inventario especial"
									darkMode={darkMode}
									roles={[1,2,3,4]}
									userRole={user.role}
								/>
								<MenuItem
								   to="/kpis-monitoreo-especial"
								   icon={chartLine}
								   text="KPIs Monitoreo Especial"
								   darkMode={darkMode}
								   roles={[]}
								   userRole={user.role}
								/>
								<MenuItem
								   to="/inventory-special-sell"
								   icon={cashRegister}
								   text="Ventas especiales por Kg"
								   darkMode={darkMode}
								   roles={[]}
								   userRole={user.role}
								/>
								<MenuItem
								   to="/payment-special-methods-report"
								   icon={moneyBillWave}
								   text="Cierre especial"
								   darkMode={darkMode}
								   roles={[]}
								   userRole={user.role}
								/>
								<MenuItem
								   to="/payment-special-methods-history"
								   icon={moneyBillWave}
								   text="Historial de cierre Z"
								   darkMode={darkMode}
								   roles={[]}
								   userRole={user.role}
								/>
								<MenuItem
								   to="/sales-special"
								   icon={chartLine}
								   text="Tickets Fiscales Registrados"
								   darkMode={darkMode}
								   roles={[]}
								   userRole={user.role}
								/>
								<MenuItem 
									to="/purchase-and-sales-history"
									icon={listAlt}
									text="Monitoreo especial"
									darkMode={darkMode}
									roles={[]}
									userRole={user.role}
								/>								 
							</MenuSection>
							<MenuSection
								collapseId={10}
								title="Ofertas"
								icon={bullhornIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[]}
								userRole={user.role}
							>
								<MenuItem
									to="/offer"
									icon={bookMedical}
									text="Ofertas"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-offer"
									icon={bullhornIcon}
									text="Reporte de Ofertas"
									darkMode={darkMode}
									roles={[1,2,3,7,10]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={15}
								title="Reportes de inventario"
								icon={clipboardCheck}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/inventory-report"
									icon={clipboardIcon}
									text="Reporte de Inventarios"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-report-resume"
									icon={clipboardIcon}
									text="Reporte de Inventario Totalizado"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/balance-report"
									icon={balanceScale}
									text="Balance de inventario"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-history"
									icon={undoAlt}
									text="Historial de Inventario"
									darkMode={darkMode}
									roles={[1,2,3,6,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-sell"
									icon={cashRegister}
									text="Ventas por Kg"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/departures"
									icon={boxIcon}
									text="Registro de Salidas"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/inventory-adjustment-history"
									icon={undoAlt}
									text="Historial de Ajustes"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={16}
								title="Reportes de clientes"
								icon={clipboardCheck}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,4,5,6,7,9]}
								userRole={user.role}
							>
								<MenuItem
									to="/client-list"
									icon={maleIcon}
									text="Clientes al detal"
									darkMode={darkMode}
									roles={[1,2,3,4,5,6,7,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/wholesale-client-list"
									icon={maleIcon}
									text="Clientes al mayor"
									darkMode={darkMode}
									roles={[]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={17}
								title="Reportes de ventas"
								icon={clipboardCheck}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,4,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/sales"
									icon={clipboardCheck}
									text="Tickets registrados"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/sales-user"
									icon={clipboardCheck}
									text="Ventas"
									darkMode={darkMode}
									roles={[4]}
									userRole={user.role}
								/>
								<MenuItem
									to="/sales-chart"
									icon={chartLine}
									text="Indicadores de ventas"
									darkMode={darkMode}
									roles={[1,2,3,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/real-time-goals"
									icon={chartLine}
									text="Metas en tiempo real"
									darkMode={darkMode}
									roles={[1,2,3,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/pending-payments-special"
									icon={bookMedical}
									text="Cuentas especiales por cobrar"
									darkMode={darkMode}
									roles={[]}
									userRole={user.role}
								/>
								<MenuItem
									to="/sales-combos-chart"
									icon={chartLine}
									text="Gráfico de combos"
									darkMode={darkMode}
									roles={[1,2,10]}
									userRole={user.role}
								/>
								
							</MenuSection>
							<MenuSection
								collapseId={28}
								title="Cuentas por pagar"
								icon={moneyBillWave}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,4,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/accounts-payable"
									icon={listAlt}
									text="Listado"
									darkMode={darkMode}
									roles={[1,2,3,4,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/register-accounts-payable"
									icon={receiptIcon}
									text="Registrar compra"
									darkMode={darkMode}
									roles={[1,2,3,6,7]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={18}
								title="Reportes financieros"
								icon={clipboardCheck}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,5,6,7,9,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/commissions-report"
									icon={chartLine}
									text="Reporte de comisiones"
									darkMode={darkMode}
									roles={[1,2,6,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/payment-methods-report"
									icon={moneyBillWave}
									text="Formas de pago"
									darkMode={darkMode}
									roles={[1,2,3,5,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/payment-methods-history"
									icon={moneyBillWave}
									text="Historial de formas de pago"
									darkMode={darkMode}
									roles={[1,2,3,6,7,9,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/payment-methods-chart"
									icon={moneyBillWave}
									text="Gráfico de formas de pago"
									darkMode={darkMode}
									roles={[1,2,9]}
									userRole={user.role}
								/>
								<MenuItem
									to="/payment-methods-general-report"
									icon={moneyBillWave}
									text="Reporte general de formas de pago"
									darkMode={darkMode}
									roles={[1,2,9,10]}
									userRole={user.role}
								/>
							</MenuSection>
							{/* Oculto: Reportes de televentas (todos los usuarios)
							<MenuSection
								collapseId={19}
								title="Reportes de televentas"
								icon={clipboardCheck}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2]}
								userRole={user.role}
							>
								<MenuItem
									to="/telesales"
									icon={moneyBillWave}
									text="Tickets registrados"
									darkMode={darkMode}
									roles={[1,2]}
									userRole={user.role}
								/>
								<MenuItem
									to="/telesales-pending-payments"
									icon={bookMedical}
									text="Cuentas por cobrar"
									darkMode={darkMode}
									roles={[1,2]}
									userRole={user.role}
								/>
							</MenuSection>
							*/}
							<MenuSection
								collapseId={20}
								title="Otros reportes"
								icon={clipboardCheck}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2]}
								userRole={user.role}
							>
								<MenuItem
									to="/cron-history"
									icon={undoAlt}
									text="Historial de Cron"
									darkMode={darkMode}
									roles={[1,2]}
									userRole={user.role}
								/>
							</MenuSection>
							<MenuSection
								collapseId={27}
								title="Soporte técnico"
								icon={bullhornIcon}
								collapses={collapses}
								changeCollapse={changeCollapse}
								darkMode={darkMode}
								roles={[1,2,3,10]}
								userRole={user.role}
							>
								<MenuItem
									to="/support-list"
									icon={listAlt}
									text="Tickets"
									darkMode={darkMode}
									roles={[1,2,3,10]}
									userRole={user.role}
								/>
								<MenuItem
									to="/support-create"
									icon={plusCircle}
									text="Crear ticket"
									darkMode={darkMode}
									roles={[1,2,3,10]}
									userRole={user.role}
								/>
							</MenuSection>
						</>
					</div>
				</div>
			</div>
		</>
	);
}

export default SideBar;
