/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Button, Row, Col, Modal, Form, FormGroup, Table } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { getUrlBalanceWhatsapp } from '../../helpers';
import { useDarkMode } from '../../helpers/darkModeContext';
import { saveAs } from 'file-saver';
import { inventoryService } from '../../services/inventory.service';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function balanceReportPage() {

  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
	  });
	  
	const formatter = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2
	})

	// Modo oscuro 
	const { darkMode } = useDarkMode();
	
	//usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();
	const dataInventories = useSelector(state => state.inventories.dataBalance);
    const loadingPage = useSelector(state => state.inventories.loadingBalance);
	  
	// Inicializar tabla sin data
	const [data, setData] = useState([])
	const [metaData, setMetaData] = useState(false);
	const [urlBalance, setUrlBalance] = useState(null);
	
	// //Verificar data de redux
	useEffect(() => {
		if(dataInventories && dataInventories.results){

			setData(dataInventories.results);
			setMetaData(dataInventories.metadata);

			//si hay resultados validos obtener url whatsapp
			if(dataInventories.metadata && dataInventories.results.length > 0){

				try {
					let createdDate = dataInventories.results[0].value;
					let agency = dataInventories.results[1].value;
					let initial = formatter.format(dataInventories.results[2].value.toFixed(2));	//	Inicial
					let buy  = formatter.format(dataInventories.results[3].value.toFixed(2));		//	Envios 
					
					let retail = formatter.format(dataInventories.results[28].value.toFixed(2));		//	Ventas
					let wholesales = formatter.format(dataInventories.results[27].value.toFixed(2));		//	Ventas
					let sell = formatter.format(dataInventories.results[4].value.toFixed(2));		//	Ventas
					let differential = formatter.format(dataInventories.results[30].value.toFixed(2));		//	Ventas
					let realSell = formatter.format(dataInventories.results[31].value.toFixed(2));		//	Ventas
					
					let cut = formatter.format(dataInventories.results[5].value.toFixed(2));		//	Recortes
					
					let decrease = formatter.format(dataInventories.results[6].value.toFixed(2));	//	Mermas
					let decreasePack = formatter.format(dataInventories.results[16].value.toFixed(2));	//	Empaque
					let decreaseHumidity = formatter.format(dataInventories.results[17].value.toFixed(2));	//	Humedad 
					let decreaseMincemeat = formatter.format(dataInventories.results[18].value.toFixed(2));	//	Picadillo

					let out = formatter.format(dataInventories.results[7].value.toFixed(2));			//	Salidas
					let outTastingDonation = formatter.format(dataInventories.results[19].value.toFixed(2));	//	Degustacion y donacion
					let outSawdust = formatter.format(dataInventories.results[20].value.toFixed(2));	//	Aserrin
					let outPackaging = formatter.format(dataInventories.results[21].value.toFixed(2));	//	Empaques
					let outVoucher = formatter.format(dataInventories.results[22].value.toFixed(2));	//	Vale
					let outCorrection = formatter.format(dataInventories.results[23].value.toFixed(2));	//	Corrección
					let outTransfer = formatter.format(dataInventories.results[24].value.toFixed(2));	//	Traslado entre tiendas
					
					let total = formatter.format(dataInventories.results[8].value.toFixed(2));			//	Debe haber
					let physical = formatter.format(dataInventories.results[9].value.toFixed(2));		//	Inventario Final
					let adjustment = formatter.format(dataInventories.results[10].value.toFixed(2));	//	Diferencial	
					let percent = dataInventories.results[11].value

					let urlbalance = getUrlBalanceWhatsapp(createdDate,agency,initial,buy,retail,wholesales,sell,differential,realSell,cut,decrease,decreasePack,decreaseHumidity,decreaseMincemeat,out,outTastingDonation,outSawdust,outPackaging,outVoucher,outCorrection,outTransfer,total,physical,adjustment,percent );
					setUrlBalance(urlbalance);
				} catch (error) {
					setModalWarning(true);
            		setModalMsg('Ocurrió un error, al formatear la información');
				}
				
			}else{
				setMetaData(false);
				setUrlBalance(null);
			}
		
		}
  	},[dataInventories]);

	//Consultar al entrar
	/*useEffect(() => {
		getDataTable();
	}, []);*/

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-custom"></div></>);

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

	const getDataTable = (page) => {
		dispatch(inventoryActions.dataTableReportBalance(getUserData(), {}));
	}


	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	},[]);

	const [listAgencies, setListAgencies] = useState(null);

	useEffect(() => {
		if(users.obtained){
			setListAgencies(users.list.agencies);
		}
	},[users.obtained]);


	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [selectedAgency, setSelectedAgency] = useState("");
	const [exportingMultiple, setExportingMultiple] = useState(false);
	const [summedData, setSummedData] = useState(null);
	const [loadingSumPeriod, setLoadingSumPeriod] = useState(false);

	const clearFilters = () =>{
		setSelectedAgency('');
		setStartDate('');
		setEndDate('');
		setSummedData(null);
		reset({agency:'', startDate:'', endDate:'', code:''})
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	// Validación de fechas permitidas (misma lógica que el Datetime)
	const isValidDateBalance = (currentDate) => {
		const today = moment().startOf('day');
		const formattedDate = moment(currentDate).format('YYYY-MM-DD');
		const disabledDates = ['2024-12-30', '2024-12-31', '2025-12-29', '2025-12-30', '2025-12-31'];
		if (disabledDates.includes(formattedDate)) return false;
		if (currentDate.isSame(today, 'day') && (user.role === 1 || user.role === 6)) return true;
		if (currentDate.isSame(today, 'day')) return false;
		return currentDate.isBefore(today, 'day');
	};

	//Consultar por filtros
	const onFilterData = (data, e) => {
		
		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		setSummedData(null);
		dispatch(inventoryActions.dataTableReportBalance(getUserData(), data));
	}

	// Exportar varios días: un archivo CSV por cada día del rango (máx. 31 días)
	const MAX_DAYS_EXPORT = 31;
	const exportMultipleDays = async () => {
		const agencyId = selectedAgency || (user.agency && user.agency.id);
		if (!agencyId) {
			setModalWarning(true);
			setModalMsg('Seleccione una sucursal para exportar varios días.');
			return;
		}
		const start = moment(startDate);
		const end = moment(endDate);
		if (!start.isValid() || !end.isValid()) {
			setModalWarning(true);
			setModalMsg('Seleccione fecha inicial y fecha final.');
			return;
		}
		if (end.isBefore(start, 'day')) {
			setModalWarning(true);
			setModalMsg('La fecha final debe ser igual o posterior a la fecha inicial.');
			return;
		}
		const days = end.diff(start, 'days') + 1;
		if (days > MAX_DAYS_EXPORT) {
			setModalWarning(true);
			setModalMsg(`El rango no puede superar ${MAX_DAYS_EXPORT} días.`);
			return;
		}
		const agencyName = (listAgencies && listAgencies.find(a => a.id === agencyId))?.name || (user.agency && user.agency.name) || 'sucursal';
		setExportingMultiple(true);
		try {
			const current = start.clone();
			while (current.isSameOrBefore(end, 'day')) {
				const dayStr = current.format('YYYY-MM-DD');
				const res = await inventoryService.balanceTableReport(getUserData(), { agency: agencyId, startDate: dayStr });
				const results = res && res.results;
				if (results && results.length > 0) {
					const exportData = transformExportData(results);
					const csvHeaders = headers.map(h => h.label).join(';');
					const csvRows = exportData.map(row => `"${String(row.name).replace(/"/g, '""')}";"${String(row.value).replace(/"/g, '""')}"`);
					const csv = '\uFEFF' + csvHeaders + '\n' + csvRows.join('\n');
					const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
					const nombreTienda = agencyName.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, '_').trim() || 'sucursal';
					saveAs(blob, `${dayStr}_${nombreTienda}_Balance.csv`);
				}
				current.add(1, 'day');
			}
			setModalWarning(false);
			setModalMsg('');
		} catch (err) {
			setModalWarning(true);
			setModalMsg(err?.message || 'Error al exportar. Intente de nuevo.');
		} finally {
			setExportingMultiple(false);
		}
	};

	// Sumar período: obtiene balance de cada día del rango y suma los valores (máx. 31 días, peticiones secuenciales)
	const sumPeriod = async () => {
		const agencyId = selectedAgency || (user.agency && user.agency.id);
		if (!agencyId) {
			setModalWarning(true);
			setModalMsg('Seleccione una sucursal para sumar el período.');
			return;
		}
		const start = moment(startDate);
		const end = moment(endDate);
		if (!start.isValid() || !end.isValid()) {
			setModalWarning(true);
			setModalMsg('Seleccione fecha inicial y fecha final.');
			return;
		}
		if (end.isBefore(start, 'day')) {
			setModalWarning(true);
			setModalMsg('La fecha final debe ser igual o posterior a la fecha inicial.');
			return;
		}
		const days = end.diff(start, 'days') + 1;
		if (days > MAX_DAYS_EXPORT) {
			setModalWarning(true);
			setModalMsg(`El rango no puede superar ${MAX_DAYS_EXPORT} días.`);
			return;
		}
		setLoadingSumPeriod(true);
		setModalWarning(false);
		setModalMsg('');
		try {
			const allResults = [];
			const current = start.clone();
			while (current.isSameOrBefore(end, 'day')) {
				const dayStr = current.format('YYYY-MM-DD');
				const res = await inventoryService.balanceTableReport(getUserData(), { agency: agencyId, startDate: dayStr });
				const results = res && res.results;
				if (results && results.length > 0) allResults.push(results);
				current.add(1, 'day');
			}
			if (allResults.length === 0) {
				setModalWarning(true);
				setModalMsg('No hay datos para el rango seleccionado.');
				setSummedData(null);
				return;
			}
			// Agregar: mismo orden que un día; índice 0 = rango de fechas, 1 = sucursal, resto = suma
			const first = allResults[0];
			const aggregated = first.map((item, idx) => {
				if (idx === 0) {
					return { name: item.name, value: `${start.format('YYYY-MM-DD')} a ${end.format('YYYY-MM-DD')}` };
				}
				if (idx === 1) {
					return { name: item.name, value: item.value };
				}
				const num = parseFloat(item.value);
				if (isNaN(num)) return { name: item.name, value: item.value };
				let sum = 0;
				for (let i = 0; i < allResults.length; i++) {
					const v = allResults[i][idx] && parseFloat(allResults[i][idx].value);
					sum += isNaN(v) ? 0 : v;
				}
				return { name: item.name, value: sum };
			});
			setSummedData(aggregated);
		} catch (err) {
			setModalWarning(true);
			setModalMsg(err?.message || 'Error al sumar el período. Intente de nuevo.');
			setSummedData(null);
		} finally {
			setLoadingSumPeriod(false);
		}
	};

	//Exportar balances
	const headers = [
		{ label: "Campo", key: "name" },
		{ label: "Valor", key: "value" },
	];

	const formatTotalAdjustment = (value, source) => {
		const src = source || data;
		if (src.length > 0 && src[8] && src[9]) {
			if (value > 0 && (src[8].value < src[9].value)) {
				return <><i className="fa fa-arrow-up text-success"></i>&nbsp;<NumberFormat displayType={'text'} value={value.toFixed(2)} thousandSeparator={true} prefix="$ "/> </>
			} else if (value > 0 && (src[8].value > src[9].value)) {
				return <><i className="fa fa-arrow-down text-danger"></i>&nbsp;<NumberFormat displayType={'text'} value={value.toFixed(2)} thousandSeparator={true} prefix="$ "/> </>
			}
		}
		return <NumberFormat displayType={'text'} value={(value != null ? value : 0).toFixed(2)} thousandSeparator={true} prefix="$ "/>
	}

	const desiredOrder = [
		"Fecha",
		"Sucursal",
		"Recorte",              // recortes
		"Inventario inicial",   // inventario inicial
		"Envios",               // recepción de tienda
		"Ventas al mayor",      // ventas al mayor
		"Dif. Ventas al mayor", // diferencia en Bs
		"Ventas al detal",      // ventas al detal
		"Traslado",
		"Traslado a fabrica",
		"Degustacion",          // degustaciones
		"Donacion",             // donaciones
		"Correccion",           // correcciones
		"Vale",                 // vales
		"Empaque",              // empaques
		"Tasa BCV",             // tasa BCV
		"Humedad",              // merma por ahumado
		"Dif. por venta de combos", // diferencia por promo al mayor
		"Dif. por cupón",
		"Total de clientes",
		"Inventario final",      // total físico
		"Salidas",              // despacho a tiendas
		"Ventas",
		"Mermas",
		"Debe haber",
		"Faltante",
		"%",
		"Inventario bruto",
		"INICIAL - VENTAS",
		"Porcentaje recortes",
		"Porcentaje mermas",
		"Picadillo",
		"Empaques",
		"Correccion",
		"Porcentaje salidas",
		"EGRESOS DIVERSOS",
		"Total en credito",
		"Ventas reales",
		"Dif. por descuento en ventas al mayor",
	];

	// const transformExportData = (data) => {
	// 	const reorderedData = desiredOrder.map((fieldName) => {
	// 	  const foundItem = data.find((item) => item.name === fieldName);
	// 	  if (foundItem) {
	// 		return {
	// 		  name: foundItem.name,
	// 		  value: 
	// 			foundItem.name === "Fecha" || foundItem.name === "Sucursal"
	// 			  ? foundItem.value
	// 			  : parseFloat(foundItem.value).toFixed(2).toString().replace(/\./g, ',')
	// 		};
	// 	  } else {
	// 		return { name: fieldName, value: "N/A" }; // Valor predeterminado si no se encuentra
	// 	  }
	// 	});
	// 	return reorderedData;
	//   };

	const transformExportData = (exportData) => {
		// Obtener la tasa BCV (valor del dólar) - buscar por nombre o por índice
		const tasaBCVItem = exportData.find((item) => item.name === "Tasa BCV");
		const tasaBCV = tasaBCVItem?.value || (exportData[32] && exportData[32].value) || 1;
		
		// Cambiar los nombres de los campos
		const renamedData = exportData.map((item) => {
			if (item.name === "Donacion") {
				return { ...item, name: "Degustacion" };
			} else if (item.name === "Degustacion") {
				return { ...item, name: "Donacion" };
			}
			return item; // Dejar el resto sin cambios
		});
	
		// Reordenar los datos según el orden deseado
		const reorderedData = desiredOrder.map((fieldName) => {
			const foundItem = renamedData.find((item) => item.name === fieldName);
			if (foundItem) {
				// Campos que deben estar en dólares (divididos por la tasa BCV)
				// Estos campos coinciden con los que se muestran divididos en el componente
				const fieldsInDollars = ["Dif. Ventas al mayor"];
				
				let valueToFormat = foundItem.value;
				
				// Si el campo debe estar en dólares, dividir por la tasa BCV
				if (fieldsInDollars.includes(foundItem.name)) {
					const numericValue = parseFloat(foundItem.value);
					if (!isNaN(numericValue) && tasaBCV > 0) {
						valueToFormat = numericValue / tasaBCV;
					}
				}
				
				return {
					name: foundItem.name,
					value:
						foundItem.name === "Fecha" || foundItem.name === "Sucursal"
							? foundItem.value
							: foundItem.name === "Total de clientes"
								? String(Math.round(Number(valueToFormat) || 0))
								: parseFloat(valueToFormat).toFixed(2).toString().replace(/\./g, ','),
				};
			} else {
				return { name: fieldName, value: "N/A" }; // Valor predeterminado si no se encuentra
			}
		});
	
		return reorderedData;
	};

	const displayData = summedData != null ? summedData : data;

    const _defaultAgencyWatch = watch('agency');

    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Balances</h3>
							</div>
						</div>
						{/* Filtros */}
						<div className="filter">
							<div className="d-flex justify-content-between">
								<a href="#" onClick={e => {e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault();  clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>
								}	
							</div>
							{isOpen && (
								<>
									<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
										{(user.role === 1 || user.role === 2 || user.role === 6 || user.role === 9 || user.role === 10) && (
											<FormGroup className="mr-3">
												{getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
												<select
													className="form-control"
													name="agency"
													ref={register}
													onChange={(e) => setSelectedAgency(e.target.value)} // Captura la sucursal seleccionada
													value={selectedAgency}
												>
													<option key="" name="" value="">
														Seleccione sucursal
													</option>
													{listAgencies &&
														listAgencies.map((list) => (
															<option key={list.id} name={list.id} value={list.id}>
																{`${list.name}`}
															</option>
														))}
												</select>
											</FormGroup>
										)}
							
										<FormGroup className="mr-3">
											<Datetime
												timeFormat={false}
												dateFormat={'YYYY-MM-DD'}
												closeOnSelect
												onChange={handleChangeStartDate}
												value={startDate}
												isValidDate={isValidDateBalance}
												inputProps={{
													name: 'startDate',
													ref: register,
													placeholder: "Fecha inicial",
													autoComplete: "off",
												}}
											/>
										</FormGroup>
										{user.role === 1 && (
											<FormGroup className="mr-3">
												<Datetime
													timeFormat={false}
													dateFormat={'YYYY-MM-DD'}
													closeOnSelect
													onChange={handleChangeEndDate}
													value={endDate}
													isValidDate={isValidDateBalance}
													inputProps={{
														name: 'endDate',
														ref: register,
														placeholder: "Fecha final (para exportar varios días)",
														autoComplete: "off",
													}}
												/>
											</FormGroup>
										)}
							
										<Button
											color="primary"
											type="submit"
											disabled={loadingPage}
										>
											{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
										</Button>
										{user.role === 1 && (
											<>
												<Button
													type="button"
													color="secondary"
													className="ml-2"
													disabled={loadingSumPeriod || loadingPage || !startDate || !endDate || !(selectedAgency || (user.agency && user.agency.id))}
													onClick={sumPeriod}
												>
													{loadingSumPeriod && <span className="spinner-border spinner-border-sm mr-1"></span>}
													Sumar período
												</Button>
												<Button
													type="button"
													color="primary"
													className="ml-2"
													disabled={exportingMultiple || loadingPage || !startDate || !endDate || !(selectedAgency || (user.agency && user.agency.id))}
													onClick={exportMultipleDays}
												>
													{exportingMultiple && <span className="spinner-border spinner-border-sm mr-1"></span>}
													<Icon icon={fileDownload} /> Exportar varios días
												</Button>
											</>
										)}
									</Form>
								</>
							)}
							
						</div>
						{/* Filtros */}
						<Row>
							<Col md="12" sm="12" lg="12">
							{(loadingPage || loadingSumPeriod) && <div className="justify-content-center"><CustomLoader/></div>}
							{(!loadingPage && !loadingSumPeriod && displayData.length > 0) && <>
								<Table striped responsive hover bordered size="sm">
									<caption style={{captionSide:'top', fontWeight:'bolder'}}>BALANCE DE RESULTADOS {displayData[1].value.toUpperCase()} {displayData[0].value} </caption>
                                    <thead>
                                        <tr>
                                            <th>CONCEPTO</th>
                                            <th>1</th>
											<th>2</th>
											<th>PORCENTAJE</th>
											<th>3</th>
											<th>Tasa BCV: Bs. { displayData[32].value ? displayData[32].value.toFixed(2) : 0 }</th>
                                        </tr>
                                    </thead>
                                    <tbody>
									<tr>
										<td>Inventario Inicial</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[2].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									{/* <tr>
										<td>Por despacho</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Proveedor externo</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Traslado de tienda</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Correcion</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Devolucion</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Devolucion de mayor</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr> */}
									<tr>
										<td>Total de ingresos</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[3].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>- Ventas al detal</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[28].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>- Ventas al mayor</b></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[27].value / displayData[32].value).toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[27].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>- Total Ventas</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[4].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>= INICIAL - VENTAS</b></td>
										<td></td>
										<td></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[13].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
									</tr>
									<tr>
										<td><b>- Dif por venta de combos</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[33].value.toFixed(2)} thousandSeparator={true} prefix="$ -"/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									{/*<tr>
										<td><b>Total dado en crédito</b></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[29].value / displayData[32].value).toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[29].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>*/}
									<tr>
										<td><b>- Dif por ventas al mayor</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[30].value / displayData[32].value).toFixed(2)} thousandSeparator={true} prefix="$ -"/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>- Dif por descuento al mayor</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[34].value / displayData[32].value).toFixed(2)} thousandSeparator={true} prefix="$ -"/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									{displayData[35] && (
									<tr>
										<td><b>- Dif por cupón</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[35].value || 0).toFixed(2)} thousandSeparator={true} prefix="$ -"/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									)}
									{displayData[37] != null && (
									<tr>
										<td><b>Total de diferenciales</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[37].value || 0).toFixed(2)} thousandSeparator={true} prefix="$ -"/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									)}
									<tr>
										<td><b>= Ventas reales</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={(displayData[31].value || 0).toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>Total de clientes</b></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={((displayData[38] && displayData[38].name === 'Total de clientes') ? displayData[38].value : (displayData.find(d => d.name === 'Total de clientes')?.value ?? 0))} thousandSeparator={true} /></b></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Recortes</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[5].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td><NumberFormat displayType={'text'} value={displayData[14].value.toFixed(2)} thousandSeparator={true} suffix="%"/></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Mermas</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[6].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td><NumberFormat displayType={'text'} value={displayData[15].value.toFixed(2)} thousandSeparator={true} suffix="%"/></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Empaque</td>
										<td><NumberFormat displayType={'text'} value={displayData[16].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Repesaje</td>
										<td><NumberFormat displayType={'text'} value={displayData[17].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Picadillo</td>
										<td><NumberFormat displayType={'text'} value={displayData[18].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td>Salidas</td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[7].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td><NumberFormat displayType={'text'} value={displayData[25].value.toFixed(2)} thousandSeparator={true} suffix="%"/></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Degustación</td>
										<td><NumberFormat displayType={'text'} value={displayData[19].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Desecho</td>
										<td><NumberFormat displayType={'text'} value={displayData[20].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Empaques/aserrin</td>
										<td><NumberFormat displayType={'text'} value={displayData[21].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Vale</td>
										<td><NumberFormat displayType={'text'} value={displayData[22].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Corrección</td>
										<td><NumberFormat displayType={'text'} value={displayData[23].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Traslado Entre Tiendas</td>
										<td><NumberFormat displayType={'text'} value={displayData[24].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td style={{textAlign:'right', fontStyle:'italic'}}>Traslado A Fabrica</td>
										<td><NumberFormat displayType={'text'} value={(displayData[36] && displayData[36].value != null ? displayData[36].value : 0).toFixed(2)} thousandSeparator={true} prefix="$ "/></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
									</tr>
									<tr>
										<td><b>- EGRESOS DIVERSOS</b></td>
										<td></td>
										<td></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[26].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
										<td></td>
									</tr>
									<tr>
										<td><b>= DEBE HABER</b></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[8].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
									</tr>
									<tr>
										<td><b>- INVENTARIO FÍSICO</b></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
										<td><b><NumberFormat displayType={'text'} value={displayData[9].value.toFixed(2)} thousandSeparator={true} prefix="$ "/></b></td>
									</tr>
									<tr>
										<td><b>= DIFERENCIAL</b></td>
										<td></td>
										<td></td>
										<td></td>
										<td></td>
										<td><b>{formatTotalAdjustment(displayData[10].value, displayData)}</b></td>
									</tr>
									<tr>
										<td><b>DIFERENCIAL %</b></td>
										<td></td>
										<td></td>
										<td><NumberFormat displayType={'text'} value={displayData[11].value.toFixed(2)} thousandSeparator={true} suffix="%"/></td>
										<td></td>
										<td></td>
									</tr>
                                    </tbody>
                                </Table>
							</>
							}
							{(data && data.length > 0 && !loadingPage) && (() => {
								const nombreTienda = (displayData[1] && displayData[1].value) ? String(displayData[1].value).replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, '_').trim() : 'sucursal';
								const diaRaw = (displayData[0] && displayData[0].value) ? String(displayData[0].value) : moment().format('YYYY-MM-DD');
								const dia = diaRaw.replace(/\//g, '-');
								return (
									<CSVLink data={transformExportData(data)} separator={";"} headers={headers} filename={`${dia}_${nombreTienda}_Balance.csv`} className="btn btn-primary">
										<Icon icon={fileDownload} /> Exportar
									</CSVLink>
								);
							})()}
							{(metaData && !loadingPage) && <>
								<a className="btn btn-primary" href={urlBalance} target="_blank">
									<i className="fa fa-comment" aria-hidden="true"></i> Enviar balances
								</a>
							</>
							}
							</Col>
						</Row>
						{/* Exportar */}
					</div>
					{/* Modal de notificaciones */}
					<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning}>
						<div className="modal-header">
						<h5 className="modal-title" id="examplemodalMsgLabel">
							Ventas
						</h5>
						<button
							aria-label="Close"
							className="close"
							type="button"
							onClick={() =>  {setModalWarning(false); setModalMsg('')}}
						>
							<span aria-hidden={true}>×</span>
						</button>
						</div>
						<div className="modal-body">
							<p>{modalMsg}</p>
						</div>
						<div className="modal-footer">
						<Button
							color="secondary"
							type="button"
							onClick={() =>  {setModalWarning(false); setModalMsg('')}}
						>
							Cerrar
						</Button>
						</div>
					</Modal>
				</div>
            </div>
        </>
    );
}

export default balanceReportPage;