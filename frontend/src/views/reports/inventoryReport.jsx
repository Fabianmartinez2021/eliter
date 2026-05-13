/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Modal, Form, FormGroup, Table } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import '../../assets/css/options.css';

import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { Role } from '../../helpers';
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


function InventoryReportPage() {

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
	  
	//Verificar data de redux
	useEffect(() => {
		if(dataInventories && dataInventories.results){
			setData(dataInventories.results);
			setTotalAdjustment(dataInventories.totalAdjustmentAmountSum);
		}
		if(dataInventories && dataInventories.metadata && dataInventories.metadata[0]){
			setRowCount(dataInventories.metadata[0].total);
		}
  	},[dataInventories]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [totalAdjustment, setTotalAdjustment] = useState(0);	
	const [rowCount, setRowCount] = useState(0);

	//Columnas Data table
	const columns = [
        {
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
		},
		{
			name: 'R. Social',
			selector: 'agency.company',
			sortable: true,
			wrap:true,
			//omit: user.role !== 1,
		},
		{
			name: 'Cod. Producto',
			selector: 'product.code',
			sortable: true,
		},
		{
			name: 'Producto',
			selector: 'product.name',
			sortable: true,
			wrap:true,
		},
		{
			name: 'Cantidad Inicial',
			selector: 'initial',
            sortable: false,
            cell : (row)=>{
				return  <NumberFormat value={row.initial?row.initial.toFixed(3):row.initial} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
        {
			name: 'Compras',
			selector: 'totalIn',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalIn?row.totalIn.toFixed(3):row.totalIn} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
        {
			name: 'Ventas',
			selector: 'totalSell',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalSell?row.totalSell.toFixed(3):row.totalSell} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Recorte',
			selector: 'totalCut',
			sortable: true,
			cell : (row)=>{
				if(row.product.code == 31 || row.product.code == 32){
					if(row.totalCut && row.totalCut >0){
						return  <><i className="fa fa-arrow-up text-success"></i>&nbsp;<Button style={{padding:0 , fontSize:12}} className="btn-link" color="primary" onClick={()=>{getDetailsCut(row.date, row.product.code, row.agency._id)}} >
							<NumberFormat value={row.totalCut?row.totalCut.toFixed(3):row.totalCut} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
						</Button></>
					}else{
						return <NumberFormat value={0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
					}
					
				}else{
					if(row.totalCut && row.totalCut >0){
						return <><i className="fa fa-arrow-down text-danger"></i>&nbsp;
								<NumberFormat value={row.totalCut?row.totalCut.toFixed(3):row.totalCut} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
						</>
					}else{
						return <NumberFormat value={0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
					}
				}
			},
		},
		{
			name: '%Recorte',
			selector: 'totalCut',
			selector: 'totalsell',
			sortable: true,
			omit: true,
			cell : (row)=>{

				const  result =  row.totalSell*row.totalCut/100;

				if(result>1){
					return <>
					<i className="fa fa-arrow-down text-danger"></i>&nbsp;
					<NumberFormat value={result.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix="%"  /></>
				
					 //<NumberFormat value={row.physical?row.physical.toFixed(3)-row.kg.toFixed(3):row.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></>
				
				}else {
					return <>
						<i className="fa fa-arrow-up text-success"></i>&nbsp;	
	
					<NumberFormat value={result.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix="%"  /></>
		
			}},				
			},
		{
			name: 'Mermas',
			selector: 'totalDecrease',
			sortable: true,
			cell : (row)=>{
				if(row.totalDecrease && row.totalDecrease>0){
					return  <Button className="btn-link" color="primary" onClick={()=>{getDetailsDecrease(row.date, row.product._id, row.agency._id)}} >
						<NumberFormat style={{fontSize:12}} value={row.totalDecrease?row.totalDecrease.toFixed(3):row.totalDecrease} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
						{'  '}<i className="fa fa-info-circle" aria-hidden="true" style={{fontSize:13}}></i>
					</Button>
				}else{
					return  <NumberFormat value={row.totalDecrease?row.totalDecrease.toFixed(3):row.totalDecrease} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
				}
			},
        },
        {
			name: 'Salidas',
			selector: 'totalOut',
			sortable: true,
			cell : (row)=>{
				if(row.totalOut && row.totalOut>0){
					return  <Button className="btn-link" color="primary" onClick={()=>{getDetailsDepartures(row.date, row.product._id, row.agency._id)}} >
						<NumberFormat style={{fontSize:12}} value={row.totalOut?row.totalOut.toFixed(3):row.totalOut} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
						{'  '}<i className="fa fa-info-circle" aria-hidden="true" style={{fontSize:13}}></i>
					</Button>
				}else{
					return  <NumberFormat value={row.totalOut?row.totalOut.toFixed(3):row.totalOut} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
				}
			},
		},
		{
			name: 'Total Arit',
			sortable: false,
			selector: 'TotalQuantity',
			cell : (row)=>{
				return  <NumberFormat value={row.TotalQuantity?row.TotalQuantity.toFixed(3):row.TotalQuantity} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Inv. físico',
			sortable: false,
			selector: 'physicalQuantity',
			cell : (row)=>{
				return  <NumberFormat value={row.physicalQuantity?row.physicalQuantity.toFixed(3):row.physicalQuantity} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
        },
		{
			name: 'Ajustes',
			selector: 'totalAdjustment',
			id: 'totalAdjustment',
			sortable: true,
			cell : (row)=>{
				
				let adjustment = Math.sign(row.totalAdjustment);

				if(adjustment == -1){
					return <>
						<i className="fa fa-arrow-down text-danger"></i>&nbsp;
						<NumberFormat value={row.totalAdjustment ? Math.abs(row.totalAdjustment).toFixed(3): row.totalAdjustment} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
					</>
				}else if(adjustment == 1){
					return <>
						<i className="fa fa-arrow-up text-success"></i>&nbsp;
						<NumberFormat value={row.totalAdjustment ? Math.abs(row.totalAdjustment).toFixed(3): row.totalAdjustment } displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
					</>
				}
				return <NumberFormat value={row.totalAdjustment ? Math.abs(row.totalAdjustment).toFixed(3): 0 } displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			
			},
        },
		{
			name: 'Fecha',
			selector: 'date',
			sortable: true,
			cell : (row)=>{
				return moment(row.date).utc().format("YYYY-MM-DD")
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
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Razòn Social", key: "agency.company" },
		{ label: "Código Producto", key: "product.code" },
		{ label: "Producto", key: "product.name" },
		{ label: "Cantidad Inicial", key: "initial" },
		{ label: "Cantidad Inicial Monto", key: "initialAmount" },
		{ label: "Compras", key: "totalIn" },
		{ label: "Compras Monto", key: "totalInAmount" },
		{ label: "Ventas", key: "totalSell" },
		{ label: "Ventas Monto", key: "totalSellAmount" },
		{ label: "Recortes", key: "totalCut" },
		{ label: "Recortes Monto", key: "totalCutAmount" },
		{ label: "Repesaje", key: "totalReweigh" },
		{ label: "Repesaje monto", key: "totalReweighAmount" },
		{ label: "Empaques/aserrin", key: "totalPacking" },
		{ label: "Empaques/aserrin Monto", key: "totalPackingAmount" },
		{ label: "Degustaciones/Donaciones", key: "totalDonation" },
		{ label: "Degustaciones/Donaciones Monto", key: "totalDonationAmount" },
		{ label: "Desechos", key: "totalTasting" },
		{ label: "Desechos Monto", key: "totalTastingAmount" },
		{ label: "Vales", key: "totalCoupon" },
		{ label: "Vales Monto", key: "totalCouponAmount" },
		{ label: "Correcciones", key: "totalCorrection" },
		{ label: "Correcciones Monto", key: "totalCorrectionAmount" },
		{ label: "Traslado", key: "totalTransfer" },
		{ label: "Traslado", key: "totalTransferAmount" },
		{ label: "Total Arit.", key: "TotalQuantity" },
		{ label: "Total Arit. Monto", key: "TotalAmount" },
		{ label: "Inv. físico", key: "physicalQuantity" },
		{ label: "Inv. físico Monto", key: "physicalAmount" },
		{ label: "Ajustes", key: "totalAdjustment" },
		{ label: "Ajustes Monto", key: "totalAdjustmentAmount" },
		{ label: "Precio Producto Monto", key: "priceAt" },
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

	/**
	 * Obtener detalle de mermas
	 * 
	 * @param {fecha} date 
	 * @param {producto} product 
	 */
	const getDetailsDecrease = (date, product, agency) => {
		let data = {
			date,
			product,
			agency,
		}

		dispatch(inventoryActions.inventoryDetailDecrease(data));

		//abrir modal
		setModalVisible(true);
		
	}

	/**
	 * Obtener detalle de salidas
	 * 
	 * @param {fecha} date 
	 * @param {producto} product 
	 */
	const getDetailsDepartures = (date, product, agency) => {
		let data = {
			date,
			product,
			agency,
		}

		dispatch(inventoryActions.inventoryDetailDepartures(data));

		//abrir modal
		setModalDepartureVisible(true);
		
	}

	/**
	 * Obtener detalle de recortes
	 * 
	 * @param {fecha} date 
	 * @param {codigo de producto} code 
	 * @param {agency} product 
	 */
	const getDetailsCut = (date, code, agency) => {
		let data = {
			date,
			code,
			agency,
		}

		dispatch(inventoryActions.inventoryDetailCut(data));

		//abrir modal recortes
		setModalCutVisible(true);
		
	}

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
		dispatch(inventoryActions.dataTableReportInventories(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(inventoryActions.dataTableReportInventories(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		const sortField = column.id || column.selector;
		let sort = {"id": sortField, "desc": (sortDirection == "asc" ? false : true)};
		setDirection(sort);
		dispatch(inventoryActions.dataTableReportInventories(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(inventoryActions.dataTableReportInventories(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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
	// 	dispatch(inventoryActions.dataTableReportInventories(
	// 		getUserData(),
	// 		1,
	// 		perPageSelect === 0 ? perPage : perPageSelect,
	// 		direction,
	// 		data,
	// 		false
	// 	));
	// };

	const onFilterData = (data, e) => {

		const today = moment().startOf('day'); // Obtén la fecha actual sin hora
	
		// Validar fecha inicial
		const validStartDate = moment(data.startDate).isValid();
		if (data.startDate !== "" && !validStartDate) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}
	
		// Validar fecha final
		const validEndDate = moment(data.endDate).isValid();
		if (data.endDate !== "" && !validEndDate) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}
	
		// Verificar que la fecha inicial no sea mayor que la final
		const isAfter = moment(data.startDate).isAfter(data.endDate);
		if (isAfter) {
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}
	
		const a = moment(data.startDate);
		const b = moment(data.endDate);
	
		// Verificar si las fechas incluyen 30-12-2024, 31-12-2024, 29-12-2025, 30-12-2025 o 31-12-2025
		const targetDates = ["2024-12-30", "2024-12-31", "2025-12-29", "2025-12-30", "2025-12-31"];
		const isTargetDate =
			targetDates.includes(moment(data.startDate).format("YYYY-MM-DD")) ||
			targetDates.includes(moment(data.endDate).format("YYYY-MM-DD"));
	
		if (isTargetDate) {
			// Mostrar mensaje "No hay registros para mostrar"
			setData([]); // Actualizar el estado de data a un arreglo vacío
			return;
		}
	
		// Verificar si el rango de fechas incluye el día de hoy
		const includesToday = a.isSameOrBefore(today) && b.isSameOrAfter(today);
	
		// Actualizar el estado del botón de exportar
		setIsExportDisabled(includesToday);
	
		// Establecer los filtros y realizar la acción correspondiente
		setFilters(data);
		dispatch(inventoryActions.dataTableReportInventories(
			getUserData(),
			1,
			perPageSelect === 0 ? perPage : perPageSelect,
			direction,
			data,
			false
		));
	};
	
	

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(inventoryActions.dataTableReportInventories(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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

	
	const exportToExcel = (data, filename = 'reporteInventario.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
	
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Inventario');
	
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

				item.initial = item.initial.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.initialAmount = item.initialAmount.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.totalIn = item.totalIn.toString().replace(/\,/g, '').replace(".", ',');
				item.totalInAmount = item.totalInAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalSell = item.totalSell.toString().replace(/\,/g, '').replace(".", ',');
				item.totalSellAmount = item.totalSellAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalCut = item.totalCut.toString().replace(/\,/g, '').replace(".", ',');
				item.totalCutAmount = item.totalCutAmount.toString().replace(/\,/g, '').replace(".", ',');
				//item.result = item.result.toString().replace(/\,/g, '').replace(".", ',');
				item.totalDecrease = item.totalDecrease.toString().replace(/\,/g, '').replace(".", ',');


				item.totalReweigh = item.totalReweigh.toString().replace(/\,/g, '').replace(".", ',');
				item.totalReweighAmount = item.totalReweighAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalPacking = item.totalPacking.toString().replace(/\,/g, '').replace(".", ',');
				item.totalPackingAmount = item.totalPackingAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalDonation = item.totalDonation.toString().replace(/\,/g, '').replace(".", ',');
				item.totalDonationAmount = item.totalDonationAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalTasting = item.totalTasting.toString().replace(/\,/g, '').replace(".", ',');
				item.totalTastingAmount = item.totalTastingAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalCoupon = item.totalCoupon.toString().replace(/\,/g, '').replace(".", ',');
				item.totalCouponAmount = item.totalCouponAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalCorrection = item.totalCorrection.toString().replace(/\,/g, '').replace(".", ',');
				item.totalCorrectionAmount = item.totalCorrectionAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalTransfer = item.totalTransfer.toString().replace(/\,/g, '').replace(".", ',');
				item.totalTransferAmount = item.totalTransferAmount.toString().replace(/\,/g, '').replace(".", ',');
			

				item.totalDecreaseAmount = item.totalDecreaseAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalOut = item.totalOut.toString().replace(/\,/g, '').replace(".", ',');
				item.totalOutAmount = item.totalOutAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.TotalQuantity = item.TotalQuantity.toString().replace(/\,/g, '').replace(".", ',');
				item.TotalAmount = item.TotalAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.physicalQuantity = item.physicalQuantity.toString().replace(/\,/g, '').replace(".", ',');
				item.physicalAmount = item.physicalAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.totalAdjustment = item.totalAdjustment.toString().replace(/\,/g, '').replace(".", ',');
				item.totalAdjustmentAmount = item.totalAdjustmentAmount.toString().replace(/\,/g, '').replace(".", ',');
				item.priceAt = item.priceAt.toString().replace(/\,/g, '').replace(".", ',');
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de inventarios</h3>
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
										<input
										style={{minWidth:"181px"}}
											className="form-control"
											placeholder="Cod. producto"
											type="text"
											name="code"
											maxLength={50}
											autoComplete="off"
											ref={register}
										></input>
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
													placeholder: "Fecha inicial",
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

									<FormGroup className="mr-3">
										<div>
											<Datetime
												timeFormat={false}
												dateFormat={'YYYY-MM-DD'}
												closeOnSelect
												onChange={handleChangeEndDate}
												value={endDate}
												inputProps={{
													name: 'endDate',
													ref: register({ required: "La fecha es obligatoria" }),
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
									</FormGroup>

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
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
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

export default InventoryReportPage;