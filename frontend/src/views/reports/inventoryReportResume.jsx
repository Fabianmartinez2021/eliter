/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Row, Col, Modal, Form, FormGroup, Table } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import '../../assets/css/options.css';

import NumberFormat from 'react-number-format';
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

const disabledDates = ["2024-12-30", "2024-12-31", "2025-12-29", "2025-12-30", "2025-12-31"]; // Fechas desactivadas

const isValidDateR = (currentDate) => {
    const formattedDate = moment(currentDate).format("YYYY-MM-DD");
    return !disabledDates.includes(formattedDate);
};

const companies = [
    "Principal",
    "EMBUTIDOS MOHAN",
    "DELICATESES EMMANUEL",
    "DELICATESES MOMOY",
    "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];
  
function InventoryReportResumePage() {

  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
  	});

	// Modo oscuro 
    const { darkMode } = useDarkMode();
   
	//usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();
	const dataInventories = useSelector(state => state.inventories.data);
    const loadingPage = useSelector(state => state.inventories.loading);
	  
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [totalAdjustment, setTotalAdjustment] = useState(0);	
	const [rowCount, setRowCount] = useState(0);
	const [summaryTotals, setSummaryTotals] = useState(null);

	//Verificar data de redux
	useEffect(() => {
		if (dataInventories && dataInventories.results) {
			setData(dataInventories.results);
			setTotalAdjustment(dataInventories.totalAdjustmentAmountSum);
		}
		if (dataInventories && dataInventories.metadata && dataInventories.metadata[0]) {
			setRowCount(dataInventories.metadata[0].total);
		}

		// Totales generales del resumen
		if (dataInventories) {
			if (dataInventories.totals) {
				setSummaryTotals(dataInventories.totals);
			} else if (
				dataInventories.results &&
				dataInventories.results[0] &&
				dataInventories.results[0].totals
			) {
				setSummaryTotals(dataInventories.results[0].totals);
			} else {
				setSummaryTotals(null);
			}
		} else {
			setSummaryTotals(null);
		}
  	},[dataInventories]);

	//Columnas Data table
	const columns = [
        {
			name: 'Sucursal',
			selector: 'agencyName',
			sortable: true,
			wrap:true,
		},
		{
			name: 'R. Social',
			selector: 'company',
			sortable: true,
			wrap:true,
			//omit: user.role !== 1,
		},
		{
			name: 'Total kg',
			selector: 'totalKg',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalKg?row.totalKg.toFixed(3):row.totalKg} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='kg '  />
			},
		},
		{
			name: 'Total Arit. $',
			selector: 'totalAmount',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalAmount?row.totalAmount.toFixed(2):row.totalAmount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ '  />
			},
		},
        {
			name: 'Total Fisic. $',
			selector: 'totalPhysicalAmount',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalPhysicalAmount?row.totalPhysicalAmount.toFixed(2):row.totalPhysicalAmount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ '  />
			},
		},
        {
			name: 'Total Diff. $',
			selector: 'totalDifference',
			sortable: true,
			cell : (row)=>{
				let difference = Math.sign(row.totalDifference);
				if(difference == 1){
					return <>
						<i className="fa fa-arrow-down text-danger"></i>&nbsp;
						<NumberFormat value={row.totalDifference?row.totalDifference.toFixed(2):row.totalDifference} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ '  />
					</>
				}else if(difference == -1){
					return <>
						<i className="fa fa-arrow-up text-success"></i>&nbsp;
						<NumberFormat value={row.totalDifference?row.totalDifference.toFixed(2):row.totalDifference} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ '  />
					</>
				}
				return <NumberFormat value={row.totalDifference?row.totalDifference.toFixed(2):row.totalDifference} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ '  />
			},
		},

	];

	//Data al expandir una fila data financieraen Bs
	const ExpandedComponent = ({ data }) => (
		<>
			<Table striped responsive>
				<thead>
					<tr>
						<th>Cantidad Inicial</th>
						<th>Compras</th>
						<th>Ventas</th>
						<th>Recorte</th>
						<th>Mermas</th>
						<th>Salidas</th>
						<th>Total Arit.</th>
						<th>Inv. físico</th>
						<th>Ajustes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><NumberFormat value={data.initialAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalInAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalSellAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalCutAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalDecreaseAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalOutAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.TotalAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.physicalAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalAdjustmentAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					</tr>
				</tbody>
			</Table>
		</>
    );

	const headers = [
		{ label: "Fecha", key: "date" },
		{ label: "Sucursal", key: "agencyName" },
		{ label: "Razòn Social", key: "company" },
		{ label: "Total kg", key: "totalKg" },
		{ label: "Total Arit.$", key: "totalAmount" },
        { label: "Total Fisic.$", key: "totalPhysicalAmount" },
        { label: "Total Diff.$", key: "totalDifference" },

	];

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	/**
	 *  Consulta de salidas de inventario
	 *  por merma, repesaje, autoconsumo, degustación, 
	 * 	donación, vales, corrección, traslado y picadillo
	 */

	//Modal mermas
	const [modalVisible, setModalVisible] = useState(false);

	//Modal mermas
	const [modalDepartureVisible, setModalDepartureVisible] = useState(false);

	//Modal recortes
	const [modalCutVisible, setModalCutVisible] = useState(false);

	const [listDetail, setListDetail] = useState([]);
	const [totalDetail, setTotalDetail] = useState(0);

	//State de detalle de mermas o salidas
	const loadingDetail = useSelector(state => state.inventories.loadingDetail);
	const inventoryDetail = useSelector(state => state.inventories);

	//Actualizar estado de inventario al cambio de información
	useEffect(() => {
		if(inventoryDetail.successDetail){
			setListDetail(inventoryDetail.dataDetail.results);
			//Total salidas
			if(inventoryDetail.dataDetail.totalOut){
				setTotalDetail(inventoryDetail.dataDetail.totalOut)
				
			//Total recortes
			}else if(inventoryDetail.dataDetail.totalCut){
				setTotalDetail(inventoryDetail.dataDetail.totalCut)
			}else{
				setTotalDetail(0);
			}
		}
	},[inventoryDetail.successDetail]);

	/**** Mermas *****/

	const columnsDecrease = [
        {
			name: 'Merma por empaque',
			selector: 'totalDecrease',
			sortable: false,
			cell : (row)=>{
				return  <NumberFormat value={row.totalDecrease?row.totalDecrease.toFixed(3):row.totalDecrease} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
        },
		{
			name: 'Merma por humedad',
			selector: 'totalReweigh',
			sortable: false,
			cell : (row)=>{
				return  <NumberFormat value={row.totalReweigh?row.totalReweigh.toFixed(3):row.totalReweigh} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
        },
        {
			name: 'Merma por picadillo',
			selector: 'totalMincemeat',
			sortable: false,
			cell : (row)=>{
				return  <NumberFormat value={row.totalMincemeat?row.totalMincemeat.toFixed(3):row.totalMincemeat} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: false,
			cell : (row)=>{
				return  <NumberFormat value={row.total?row.total.toFixed(3):row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
	];
	
	/**** Mermas *****/
	
	/**** Salidas *****/

	const columnsDeparture = [
        {
			name: 'Tipo',
			selector: 'description',
			sortable: true,
        },
		{
			name: 'Cantidad',
			selector: 'out',
			sortable: false,
			cell : (row)=>{
				return  <NumberFormat value={row.out?row.out.toFixed(3):row.out} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
        },
        {
			name: 'Comentarios',
			selector: 'comment',
			sortable: true,
		},
	];
	/**** Salidas *****/

	/**** Recortes *****/

	const columnsCut = [
        {
			name: 'Código',
			selector: 'product.code',
			sortable: true,
        },
		{
			name: 'Producto',
			selector: 'product.name',
			sortable: false,
			wrap:true,
        },
		{
			name: 'Cantidad',
			selector: 'cut',
			sortable: false,
			cell : (row)=>{
				return  <NumberFormat value={row.cut?row.cut.toFixed(3):row.cut} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
        },
	];
	/**** Recortes *****/

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id":"date", "desc":true  });

	const getDataTable = (page) => {
		dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		const sortField = column.id || column.selector;
		let sort = {"id": sortField, "desc": (sortDirection == "asc" ? false : true)};
		setDirection(sort);
		dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, errors, setValue, watch } = useForm();

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

	const [filters, setFilters] = useState('');

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const clearFilters = () =>{
		setStartDate(''); 
		setEndDate(''); 
		reset({agency:'', startDate:'', endDate:'', code:''})
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [isExportDisabled, setIsExportDisabled] = useState(true);

	//Consultar por filtros
	// const onFilterData = (data, e) => {
	// 	const today = moment().startOf('day'); // Obtén la fecha actual sin hora
	
	// 	// Validar fecha inicial
	// 	const validStartDate = moment(data.startDate).isValid();
	// 	if (data.startDate !== "" && !validStartDate) {
	// 		setModalWarning(true);
	// 		setModalMsg('Ingrese una fecha válida');
	// 		return;
	// 	}
	
	// 	// Validar fecha final
	// 	const validEndDate = moment(data.endDate).isValid();
	// 	if (data.endDate !== "" && !validEndDate) {
	// 		setModalWarning(true);
	// 		setModalMsg('Ingrese una fecha válida');
	// 		return;
	// 	}
	
	// 	// Verificar que la fecha inicial no sea mayor que la final
	// 	const isAfter = moment(data.startDate).isAfter(data.endDate);
	// 	if (isAfter) {
	// 		setModalWarning(true);
	// 		setModalMsg('La fecha inicial no puede ser superior a la final');
	// 		return;
	// 	}
	
	// 	// Verificar la diferencia de fechas
	// 	const a = moment(data.startDate);
	// 	const b = moment(data.endDate);
	// 	const dateDiff = b.diff(a, 'days');
	
	// 	// Si el rango de fechas es superior a los 380 días, mostrar advertencia
	// 	if (dateDiff > 380) {
	// 		setModalWarning(true);
	// 		setModalMsg('Elije otro rango de fecha');
	// 		return;
	// 	}
	
	// 	// Verificar si el rango de fechas incluye el día de hoy
	// 	const includesToday = a.isSameOrBefore(today) && b.isSameOrAfter(today);
	
	// 	// Actualizar el estado del botón de exportar
	// 	setIsExportDisabled(includesToday);
	
	// 	// Establecer los filtros y realizar la acción correspondiente
	// 	setFilters(data);
	// 	dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(
	// 		getUserData(),
	// 		1,
	// 		perPageSelect === 0 ? perPage : perPageSelect,
	// 		direction,
	// 		data,
	// 		false
	// 	));
	// };

	// ... código existente ...
const onFilterData = (data, e) => {

    const formData = { ...data };

    // Si el usuario solo seleccionó la primera fecha, usamos la misma como fecha final
    if (formData.startDate && (!formData.endDate || formData.endDate === "")) {
        formData.endDate = formData.startDate;
    }

    const today = moment().startOf('day'); // Obtén la fecha actual sin hora

    // Validar fecha inicial
    const validStartDate = moment(formData.startDate).isValid();
    if (formData.startDate !== "" && !validStartDate) {
        setModalWarning(true);
        setModalMsg('Ingrese una fecha válida');
        return;
    }

    // Validar fecha final
    const validEndDate = moment(formData.endDate).isValid();
    if (formData.endDate !== "" && !validEndDate) {
        setModalWarning(true);
        setModalMsg('Ingrese una fecha válida');
        return;
    }

    // Verificar que la fecha inicial no sea mayor que la final
    const isAfter = moment(formData.startDate).isAfter(formData.endDate);
    if (isAfter) {
        setModalWarning(true);
        setModalMsg('La fecha inicial no puede ser superior a la final');
        return;
    }

    const a = moment(formData.startDate);
    const b = moment(formData.endDate);

    // Verificar si las fechas incluyen las fechas bloqueadas
    const targetDates = ["2024-12-30", "2024-12-31", "2025-12-29", "2025-12-30", "2025-12-31"];
    const isTargetDate =
        targetDates.includes(moment(formData.startDate).format("YYYY-MM-DD")) ||
        targetDates.includes(moment(formData.endDate).format("YYYY-MM-DD"));

    if (isTargetDate) {
        setData([]);
        return;
    }

    // Verificar si el rango de fechas incluye el día de hoy
    const includesToday = a.isSameOrBefore(today) && b.isSameOrAfter(today);

    setIsExportDisabled(includesToday);

    setFilters(formData);
    dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(
        getUserData(),
        1,
        perPageSelect === 0 ? perPage : perPageSelect,
        direction,
        formData,
        false
    ));
};
	

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(inventoryActions.dataTableReportInventoriesSummaryAgency(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	}

	const mapDataWithHeaders = (data, headers) => {
		return data.map((item) => {
			const mappedItem = {};
			headers.forEach(({ label, key }) => {
				let value = key.includes(".")
					? key.split(".").reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ""), item)
					: item[key];

				// Caso 1: Es un string con formato "123,456" o "-123,456" → Convertir a número y limitar a 3 decimales
				if (typeof value === "string" && value.match(/^-?\d+,\d+$/)) {
					value = parseFloat(value.replace(",", "."));
					value = parseFloat(value.toFixed(3)); // Máximo 3 decimales (sin convertirlo a string)
				}
				// Caso 2: Es un string numérico sin decimales (ejemplo: "100" o "-100") → Convertir a número
				else if (typeof value === "string" && /^-?\d+$/.test(value)) {
					value = parseFloat(value); // Usar parseFloat en lugar de parseInt para mantener consistencia
				}
				// Caso 3: Si el valor ya es un número pero tiene muchos decimales → Redondear a 3
				else if (typeof value === "number") {
					value = parseFloat(value.toFixed(3)); // Aseguramos 3 decimales máximo
				}

				mappedItem[label] = value;
			});
			return mappedItem;
		});
	};

	
	const exportToExcel = (data, filename = 'reporteInventarioResumen.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
	
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Inventario Resumen');
	
		const excelBuffer = XLSX.write(workbook, {
		bookType: 'xlsx',
		type: 'array'
		});
	
		const blob = new Blob([excelBuffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});
	
		saveAs(blob, filename);
	};
	

	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(excel && excel.results){

			// Se una copia de los detalles para que estos no sean los modificados
			let fixedData = excel.results.map((item) => {return Object.assign({}, item)})

			//Se modifican los datos antes de la descarga en excel
			fixedData.forEach((item) => {

				item.date = moment(item.date).utc().format("YYYY-MM-DD");

				item.totalKg = item.totalKg.toString().replace(/\,/g, '').replace(".", ',');
				item.totalPhysicalAmount = item.totalPhysicalAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalDifference = item.totalDifference.toString().replace(/\,/g, '').replace(".", ',');
				item.totalAmount = item.totalAmount.toString().replace(/\,/g, '').replace(".", ',');
			})

			setDataExcel(fixedData);
		}
	},[excel]);

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
		  const dataFormatted = mapDataWithHeaders(dataExcel, headers);
		  exportToExcel(dataFormatted);
		  setDataExcel([]);
		}
	  }, [dataExcel]);
	
	/*** Exportar ***/

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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de inventario Totalizado</h3>
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
							{isOpen && <>
								<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{marginTop:15}}>
                                    {(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 9) && <FormGroup className="mr-3">
                                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            <select className='form-control' name="agency"
                                                ref={register}>
                                                    <option key="" name="" value="">Seleccione sucursal</option>
                                                    {listAgencies && listAgencies.map(list => 
                                                        <option
                                                            key={list.id}
                                                            name={list.id}
                                                            value={list.id}>
                                                            {`${list.name}`}
                                                        </option>
                                                    )}
                                            </select>
                                        </FormGroup>
                                    }
                                    <FormGroup className="mr-3">
										<select
											name="company"
											ref={register}
											className="form-control"
										>
											<option value="">Seleccione empresa</option>
											{companies.map((company, index) => (
												<option key={index} value={company}>
													{company}
												</option>
											))}
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<div>
											<Datetime
												timeFormat={false}
												dateFormat={'YYYY-MM-DD'}
												closeOnSelect
												onChange={handleChangeStartDate}
												value={startDate}
												inputProps={{
													name: 'startDate',
													ref: register({ required: "La fecha es obligatoria" }),
													placeholder: "Fecha",
													autoComplete: "off"
												}}
												isValidDate={(currentDate) => {
													const formattedDate = moment(currentDate).format("YYYY-MM-DD");
													
													// Verificar si la fecha está desactivada
													if (disabledDates.includes(formattedDate)) {
														return false;
													}
													
													// Usar la validación de fechas no futuras
													return isValidDate(currentDate);
												}}
											/>
											{errors.startDate && (
												<span className="text-danger mt-1 small">{errors.startDate.message}</span>
											)}
										</div>
									</FormGroup>

									{/* <FormGroup className="mr-3">
										<div>
											<Datetime
												timeFormat={false}
												dateFormat={'YYYY-MM-DD'}
												closeOnSelect
												onChange={handleChangeEndDate}
												value={endDate}
												inputProps={{
													name: 'endDate',
													ref: register(),
													placeholder: "Fecha final",
													autoComplete: "off"
												}}
												isValidDate={(currentDate) => {
													const formattedDate = moment(currentDate).format("YYYY-MM-DD");
													
													// Verificar si la fecha está desactivada
													if (disabledDates.includes(formattedDate)) {
														return false;
													}
													
													// Usar la validación de fechas no futuras
													return isValidDate(currentDate);
												}}
											/>
											{errors.endDate && (
												<span className="text-danger mt-1 small">{errors.endDate.message}</span>
											)}
										</div>
									</FormGroup> */}

									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>

								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						<div className="align-self-right">
							<h4 style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right', marginRight: '100px'}}>
							{totalAdjustment < 0 && <>Ajuste: <i className="fa fa-arrow-up text-success"></i>&nbsp;<NumberFormat displayType={'text'} value={totalAdjustment ? totalAdjustment.toFixed(2) : 0} thousandSeparator={true} prefix="$. "/> </>}
							{totalAdjustment > 0 && <>Ajuste: <i className="fa fa-arrow-down text-danger"></i>&nbsp;<NumberFormat displayType={'text'} value={totalAdjustment ? totalAdjustment.toFixed(2) : 0} thousandSeparator={true} prefix="$. "/> </>}
							</h4>
						</div>
						<Row>
							<Col>
							<DataTable
								className="dataTables_wrapper"
								striped
								responsive
								highlightOnHover
								// expandableRows
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Reporte de inventarios"
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns}
								data={data}
								pagination
								paginationServer
								paginationTotalRows={rowCount}
								onSort={handleSort}
								sortServer
								onChangeRowsPerPage={handlePerRowsChange}
								onChangePage={handlePageChange}
								persistTableHead
								theme={darkMode ? "dark" : "default"}
							/>
							</Col>
						</Row>

						{summaryTotals && (
							<Row className="mt-3">
								<Col className="d-flex justify-content-end">
									<div style={{ textAlign: 'right' }}>
										<div>
											<b>Total Kg:&nbsp;</b>
											<NumberFormat
												value={summaryTotals.totalKg ? summaryTotals.totalKg.toFixed(3) : summaryTotals.totalKg}
												displayType={'text'}
												thousandSeparator={','}
												decimalSeparator={'.'}
											/>
										</div>
										<div>
											<b>Total Arit. $:&nbsp;</b>
											<NumberFormat
												value={summaryTotals.totalAmount ? summaryTotals.totalAmount.toFixed(2) : summaryTotals.totalAmount}
												displayType={'text'}
												thousandSeparator={','}
												decimalSeparator={'.'}
											/>
										</div>
										<div>
											<b>Total Fisic. $:&nbsp;</b>
											<NumberFormat
												value={summaryTotals.totalPhysicalAmount ? summaryTotals.totalPhysicalAmount.toFixed(2) : summaryTotals.totalPhysicalAmount}
												displayType={'text'}
												thousandSeparator={','}
												decimalSeparator={'.'}
											/>
										</div>
										<div>
											<b>Total Diff. $:&nbsp;</b>
											<NumberFormat
												value={summaryTotals.totalDifference ? summaryTotals.totalDifference.toFixed(2) : summaryTotals.totalDifference}
												displayType={'text'}
												thousandSeparator={','}
												decimalSeparator={'.'}
											/>
										</div>
									</div>
								</Col>
							</Row>
						)}

						{/* Los Auditores no pueden exportar el reporte de inventario */}
						{data && data.length > 0 && (
							<>
								<Button
									className="btn"
									color="primary"
									onClick={(e) => {
										e.preventDefault();
										exportExcel();
									}}
									disabled={loadingExcel || isExportDisabled}
								>
									<Icon icon={fileDownload} /> Exportar{" "}
									{loadingExcel && (
										<span className="spinner-border spinner-border-sm mr-1"></span>
									)}
								</Button>

								{isExportDisabled && (
									<p style={{ color: "red", fontSize: "0.9rem", marginTop: "5px" }}>
										Solo se puede exportar fechas anteriores a hoy.
									</p>
								)}
							</>
						)}
					</div>
					{/* Modal mermas */}
					<Modal toggle={() => {setModalVisible(false)}} isOpen={modalVisible} className={`modal-lg ${darkMode ? "dark-mode" : ""}`} backdrop="static">
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel"> Mermas </h5>
                            <button aria-label="Close" className="close" type="button" onClick={() =>  {setModalVisible(false)}}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								<Row>
                                    <Col>
                                    <DataTable
                                        className="dataTables_wrapper"
                                        responsive
                                        highlightOnHover
                                        sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
                                        title="Mermas"
                                        progressPending={loadingDetail}
                                        paginationComponentOptions={paginationOptions}
                                        progressComponent={<CustomLoader />}
                                        noDataComponent="No hay registros para mostrar"
                                        noHeader={true}
                                        columns={columnsDecrease}
                                        data={listDetail}
										theme={darkMode ? "dark" : "default"}
                                    />
                                    </Col>
                                </Row>
                            </div>
                            <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                            <Button color="secondary" type="button" onClick={() =>  {setModalVisible(false)}} >
                                Cerrar
                            </Button>
                            </div>
					</Modal>
					{/* Modal salidas */}
					<Modal toggle={() => {setModalDepartureVisible(false);setTotalDetail(0)}} isOpen={modalDepartureVisible} className={`modal-lg ${darkMode ? "dark-mode" : ""}`} backdrop="static">
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel"> Salidas </h5>
                            <button aria-label="Close" className="close" type="button" onClick={() =>  {setModalDepartureVisible(false);setTotalDetail(0)}}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								<Row>
                                    <Col>
                                    <DataTable
                                        className="dataTables_wrapper"
                                        responsive
                                        highlightOnHover
                                        sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
                                        title="Salidas"
                                        progressPending={loadingDetail}
                                        paginationComponentOptions={paginationOptions}
                                        progressComponent={<CustomLoader />}
                                        noDataComponent="No hay registros para mostrar"
                                        noHeader={true}
                                        columns={columnsDeparture}
                                        data={listDetail}
                                        persistTableHead
                                        expandOnRowClicked
										theme={darkMode ? "dark" : "default"}
                                    />
                                    </Col>
                                </Row>
								<Row xs="12">	
									<Col><div className="pull-right"><b>Total: <NumberFormat value={ totalDetail.toFixed(3) } displayType={'text'} thousandSeparator={true} /></b> </div></Col>
								</Row>
								
                            </div>
                            <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                            <Button color="secondary" type="button" onClick={() =>  {setModalDepartureVisible(false);setTotalDetail(0)}} >
                                Cerrar
                            </Button>
                            </div>
					</Modal>
					{/* Modal recortes */}
					<Modal toggle={() => {setModalCutVisible(false);setTotalDetail(0)}} isOpen={modalCutVisible} className={`modal-lg ${darkMode ? "dark-mode" : ""}`} backdrop="static">
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel"> Recortes </h5>
                            <button aria-label="Close" className="close" type="button" onClick={() =>  {setModalCutVisible(false);setTotalDetail(0)}}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								<Row>
                                    <Col>
                                    <DataTable
                                        className="dataTables_wrapper"
                                        responsive
                                        highlightOnHover
                                        sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
                                        title="Recortes"
                                        progressPending={loadingDetail}
                                        paginationComponentOptions={paginationOptions}
                                        progressComponent={<CustomLoader />}
                                        noDataComponent="No hay registros para mostrar"
                                        noHeader={true}
                                        columns={columnsCut}
                                        data={listDetail}
                                        persistTableHead
                                        expandOnRowClicked
                                    />
                                    </Col>
                                </Row>
								<Row xs="12">	
									<Col><div className="pull-right"><b>Total: <NumberFormat value={ totalDetail.toFixed(3) } displayType={'text'} thousandSeparator={true} /></b> </div></Col>
								</Row>
                            </div>
                            <div className="modal-footer">
                            <Button color="secondary" type="button" onClick={() =>  {setModalCutVisible(false);setTotalDetail(0)}} >
                                Cerrar
                            </Button>
                            </div>
					</Modal>
					{/* Modal de notificaciones */}
					<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning} className={`${darkMode ? "dark-mode" : ""}`}>
						<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
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
						<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
							<p>{modalMsg}</p>
						</div>
						<div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
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

export default InventoryReportResumePage;