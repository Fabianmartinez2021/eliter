/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, ButtonGroup, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup, Badge } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function CommissionsReportPage() {

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

	const dataTable = useSelector(state => state.sales.table);
    const loadingPage = useSelector(state => state.sales.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataTable && dataTable.commissionResultsWholesaleGoal && dataTable.commissionResultsWeeklyGoal){
			
			// Data para el reporte al mayor
			setData(dataTable.commissionResultsWholesaleGoal);

			// Data para el reporte de la meta semanal
			setData2(dataTable.commissionResultsWeeklyGoal)
		}
  	},[dataTable]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [data2, setData2] = useState([]);

	// Función para obtener la meta histórica usada en los cálculos (metas semanales)
	const getHistoricalGoalUsed = (seller, weeklyGoalPercentage, total) => {
		if (!weeklyGoalPercentage || !total) return null;
		
		// Calcular la meta que se usó para el cálculo
		const goalUsed = total / (weeklyGoalPercentage / 100);
		return goalUsed;
	};

	// Función para verificar si se usó meta histórica o actual (metas semanales)
	const isUsingHistoricalGoal = (seller, goalUsed) => {
		if (!goalUsed || !seller.weeklyGoal) return false;
		
		// Si la meta usada es diferente a la actual, se usó meta histórica
		return Math.abs(goalUsed - seller.weeklyGoal) > 0.01;
	};

	// Función para obtener la meta histórica según la fecha del filtro
	const getGoalForFilterDate = (seller, filterStartDate, goalType = 'weekly') => {
		if (!seller || !filterStartDate) return null;
		
		const filterDate = moment(filterStartDate).startOf('day');
		let historyArray = [];
		
		if (goalType === 'weekly') {
			historyArray = seller.weeklyGoalHistory || [];
		} else if (goalType === 'wholesales') {
			historyArray = seller.wholesalesGoalHistory || [];
		}
		
		// Buscar la meta más cercana a la fecha del filtro (antes o igual)
		const validGoals = historyArray.filter(entry => {
			const entryDate = moment(entry.date).startOf('day');
			return entryDate.isSameOrBefore(filterDate);
		});
		
		if (validGoals.length > 0) {
			// Ordenar por fecha descendente y tomar la más reciente
			const sortedGoals = validGoals.sort((a, b) => moment(b.date).diff(moment(a.date)));
			return sortedGoals[0];
		}
		
		// Si no hay historial válido, retornar la meta actual
		return {
			weeklyGoal: seller.weeklyGoal,
			weeklyGoalMinimumPercentageOfSales: seller.weeklyGoalMinimumPercentageOfSales,
			wholesalesGoal: seller.wholesalesGoal,
			wholesalesGoalCommissionPercentage: seller.wholesalesGoalCommissionPercentage,
			date: 'current'
		};
	};

	//Columnas Data table para las comisiones por mayoreo
	const columns = [
        {
			name: 'Agencia',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
        },
        {
			name: 'Vendedor',
			selector: 'seller.firstName',
			sortable: true,
			wrap:true,
			cell : (row)=>{
				return  row.seller ? (row.seller.firstName + ' ' + row.seller.lastName) : ''
			},
        },
		{
			name: 'Meta',
			selector: 'seller.wholesalesGoal',
			sortable: true,
			cell : (row)=>{
				const goalForDate = getGoalForFilterDate(row.seller, dataTable?.startDate, 'wholesales');
				const goalValue = goalForDate?.wholesalesGoal || row.seller.wholesalesGoal;
				return  <NumberFormat value={goalValue} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Mayor',
			selector: 'totalWholesales',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalWholesales ? row.totalWholesales.toFixed(2) : row.totalWholesales} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Alcanzado',
			selector: 'wholesalesGoalPercentage',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.wholesalesGoalPercentage ? row.wholesalesGoalPercentage.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} />
			},
		},
		{
			name: 'Logrado',
			selector: 'wholesalesGoalReached',
			sortable: true,
			cell : (row)=>{
				return  row.wholesalesGoalReached ? 'Si' : 'Debe superar los $1000'
			},
		},
		{
			name: 'Abonos',
			selector: 'totalSumations',
			sortable: true,
			cell : (row)=>{
				return row.wholesalesGoalReached ? <NumberFormat value={row.totalSumations ? row.totalSumations.toFixed(2) : row.totalSumations} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /> : '';
			},
		},
		{
			name: 'Total',
			selector: 'totalDollars',
			sortable: true,
			cell : (row)=>{
				return row.wholesalesGoalReached ? <NumberFormat value={row.totalDollars.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /> : '';
			},
		},
		{
			name: 'Porcentaje de Comisión',
			selector: 'seller.wholesalesGoalCommissionPercentage',
			sortable: true,
			cell : (row)=>{
				return  row.wholesalesGoalReached ? <NumberFormat value={row.seller.wholesalesGoalCommissionPercentage} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} /> : '';
			},
		},
		{
			name: 'Comisión a pagar',
			selector: 'totalDollars',
			sortable: true,
			cell : (row)=>{
				return  row.wholesalesGoalReached ? <NumberFormat value={(row.totalDollars * (row.seller.wholesalesGoalCommissionPercentage / 100)).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /> : '';
			},
		},
		{
			name: 'Comisión a pagar (Bs)',
			selector: 'totalDollars',
			sortable: true,
			omit: true,
			cell : (row)=>{
				return  row.wholesalesGoalReached ? <NumberFormat value={(row.totalDollars * (row.seller.wholesalesGoalCommissionPercentage / 100) * row.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /> : '';
			},
		},
	];

	//Columnas Data table para las comisiones por las metas semanales 
	const showDollarColumns = user && (user.role === 1 || user.role === 2);
	const columns2 = [
        {
			name: 'Vendedor',
			selector: 'seller.firstName',
			sortable: true,
			wrap:true,
        },
		{
			name: 'Meta',
			selector: 'seller.weeklyGoal',
			sortable: true,
			cell : (row)=>{
				const goalForDate = getGoalForFilterDate(row.seller, dataTable?.startDate, 'weekly');
				const goalValue = goalForDate?.weeklyGoal || row.seller.weeklyGoal;
				return  <NumberFormat value={goalValue} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Total Bs.',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.total ? row.total.toFixed(2) : row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Total $',
			selector: 'totalDollars',
			sortable: true,
			omit: !showDollarColumns,
			cell : (row)=>{
				return  <NumberFormat value={row.totalDollars ? row.totalDollars.toFixed(2) : row.totalDollars} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Total sin vales',
			selector: 'totalSinVales',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalSinVales ? row.totalSinVales.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Total sin vales $',
			selector: 'totalSinValesDollars',
			sortable: true,
			omit: !showDollarColumns,
			cell : (row)=>{
				return  <NumberFormat value={row.totalSinValesDollars ? row.totalSinValesDollars.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Diff. Bs.',
			selector:'totalValesIngresados',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalValesIngresados ? row.totalValesIngresados.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Diff. $',
			selector: 'totalValesIngresadosDollars',
			sortable: true,
			omit: !showDollarColumns,
			cell : (row)=>{
				return  <NumberFormat value={row.totalValesIngresadosDollars ? row.totalValesIngresadosDollars.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Alcanzado',
			selector: 'weeklyGoalPercentage',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.weeklyGoalPercentage ? row.weeklyGoalPercentage.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} />
			},
		},
		{
			name: 'Logrado',
			selector: 'weeklyGoalReached',
			sortable: true,
			cell : (row)=>{
				const goalUsed = getHistoricalGoalUsed(row.seller, row.weeklyGoalPercentage, row.total);
				const isHistorical = isUsingHistoricalGoal(row.seller, goalUsed);
				
				return (
					<div>
						{row.weeklyGoalReached ? 'Si' : 'Debe superar el ' + row.seller.weeklyGoalMinimumPercentageOfSales + '%'}
						{/* {isHistorical && (
							<Badge color="warning" className="ml-2" style={{fontSize: '0.7em'}}>
								Meta histórica
							</Badge>
						)} */}
					</div>
				);
			},
		},
	];

	// Función para mostrar información detallada del historial
	const showHistoricalInfo = (seller, reportType = 'weekly') => {
		const hasWeeklyHistory = seller.weeklyGoalHistory && seller.weeklyGoalHistory.length > 0;
		const hasWholesalesHistory = seller.wholesalesGoalHistory && seller.wholesalesGoalHistory.length > 0;
		
		if (!hasWeeklyHistory && !hasWholesalesHistory) {
			return 'Sin historial de metas';
		}
		
		return (
			<div>
				{/* Historial de Metas Semanales */}
				{hasWeeklyHistory && (
					<div className="mb-3">
						<h6>Historial de Metas Semanales:</h6>
						{seller.weeklyGoalHistory
							.sort((a, b) => new Date(b.date) - new Date(a.date))
							.slice(0, 5)
							.map((entry, index) => (
								<div key={`weekly-${index}`} className="mb-1">
						<small>
							{moment(entry.date).format('YYYY-MM-DD')}: 
							<NumberFormat 
								value={entry.weeklyGoal} 
								displayType={'text'} 
								thousandSeparator={','} 
								decimalSeparator={'.'} 
								prefix={' Bs '} 
							/>
							({entry.weeklyGoalMinimumPercentageOfSales}%)
										{entry.changedBy && (
											<span className="text-muted"> - {entry.changedBy}</span>
										)}
						</small>
					</div>
				))}
					</div>
				)}

				{/* Historial de Metas de Ventas al Mayor */}
				{hasWholesalesHistory && (
					<div className="mb-3">
						<h6>Historial de Metas de Ventas al Mayor:</h6>
						{seller.wholesalesGoalHistory
							.sort((a, b) => new Date(b.date) - new Date(a.date))
							.slice(0, 5)
							.map((entry, index) => (
								<div key={`wholesales-${index}`} className="mb-1">
									<small>
										{moment(entry.date).format('YYYY-MM-DD')}: 
										<NumberFormat 
											value={entry.wholesalesGoal} 
											displayType={'text'} 
											thousandSeparator={','} 
											decimalSeparator={'.'} 
											prefix={' $ '} 
										/>
										({entry.wholesalesGoalCommissionPercentage}%)
										{entry.changedBy && (
											<span className="text-muted"> - {entry.changedBy}</span>
										)}
									</small>
								</div>
							))}
					</div>
				)}
			</div>
		);
	};

	// Componente expandible mejorado para metas semanales
	const ExpandedComponent = ({ data }) => {
		const goalForDate = getGoalForFilterDate(data.seller, dataTable?.startDate, 'weekly');
		const goalValue = goalForDate?.weeklyGoal || data.seller.weeklyGoal;
		const isHistorical = goalForDate?.date !== 'current';
		
		return (
			<ListGroup>
				<ListGroupItem>
					<ListGroupItemHeading>
						<b>Información del Vendedor - Metas Semanales</b>
					</ListGroupItemHeading>
					<ListGroupItemText>
						<b>Nombre:</b> {data.seller.firstName} {data.seller.lastName}
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Meta Actual:</b> 
						<NumberFormat 
							value={data.seller.weeklyGoal} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' Bs '} 
						/>
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Meta para esta Fecha:</b> 
						<NumberFormat 
							value={goalValue} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' Bs '} 
						/>
						{isHistorical && (
							<Badge color="info" className="ml-2">Histórica</Badge>
						)}
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Total Vendido:</b> 
						<NumberFormat 
							value={data.total} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' Bs '} 
						/>
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Porcentaje Alcanzado:</b> {data.weeklyGoalPercentage?.toFixed(2)}%
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Meta Alcanzada:</b> {data.weeklyGoalReached ? '✅ Sí' : '❌ No'}
					</ListGroupItemText>
				</ListGroupItem>
				<ListGroupItem>
					<ListGroupItemHeading>
						<b>Historial de Metas</b>
					</ListGroupItemHeading>
					<ListGroupItemText>
						{showHistoricalInfo(data.seller, 'weekly')}
					</ListGroupItemText>
				</ListGroupItem>
			</ListGroup>
		);
	};

	// Componente expandible para metas de ventas al mayor
	const ExpandedComponentWholesales = ({ data }) => {
		const goalForDate = getGoalForFilterDate(data.seller, dataTable?.startDate, 'wholesales');
		const goalValue = goalForDate?.wholesalesGoal || data.seller.wholesalesGoal;
		const isHistorical = goalForDate?.date !== 'current';
		
		return (
			<ListGroup>
				<ListGroupItem>
					<ListGroupItemHeading>
						<b>Información del Vendedor - Ventas al Mayor</b>
					</ListGroupItemHeading>
					<ListGroupItemText>
						<b>Nombre:</b> {data.seller.firstName} {data.seller.lastName}
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Meta Actual:</b> 
						<NumberFormat 
							value={data.seller.wholesalesGoal} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' $ '} 
						/>
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Meta para esta Fecha:</b> 
						<NumberFormat 
							value={goalValue} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' $ '} 
						/>
						{isHistorical && (
							<Badge color="info" className="ml-2">Histórica</Badge>
						)}
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Total Vendido:</b> 
						<NumberFormat 
							value={data.totalWholesales} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' $ '} 
						/>
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Porcentaje Alcanzado:</b> {data.wholesalesGoalPercentage?.toFixed(2)}%
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Meta Alcanzada:</b> {data.wholesalesGoalReached ? '✅ Sí' : '❌ No'}
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Comisión a Pagar:</b> 
						<NumberFormat 
							value={data.wholesalesGoalReached ? (data.totalDollars * (data.seller.wholesalesGoalCommissionPercentage / 100)) : 0} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix={' $ '} 
						/>
					</ListGroupItemText>
				</ListGroupItem>
				<ListGroupItem>
					<ListGroupItemHeading>
						<b>Historial de Metas</b>
					</ListGroupItemHeading>
					<ListGroupItemText>
						{showHistoricalInfo(data.seller, 'wholesales')}
					</ListGroupItemText>
				</ListGroupItem>
			</ListGroup>
		);
	};

	const headers = [
		{ label: "Fecha inicial", key: "startDate" },
		{ label: "Fecha final", key: "endDate" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Vendedor", key: "seller.firstName" },
		{ label: "Meta", key: "seller.wholesalesGoal" },
		{ label: "Mayor", key: "totalWholesales" },
		{ label: "Alcanzado", key: "wholesalesGoalPercentage" },
		{ label: "Logrado", key: "wholesalesGoalReached" },
		{ label: "Abonos", key: "totalSumations" },
		{ label: "Total", key: "totalDollars" },
		{ label: "Porcentaje de Comisión", key: "seller.wholesalesGoalCommissionPercentage" },
		{ label: "Comisión a pagar", key: "commisionToPay" },
		{ label: "Comisión a pagar (Bs)", key: "commisionToPayBs" }
	];

	const headers2 = [
		{ label: "Fecha inicial", key: "startDate" },
		{ label: "Fecha final", key: "endDate" },
		{ label: "Vendedor", key: "seller.firstName" },
		{ label: "Meta", key: "seller.weeklyGoal" },
		{ label: "Total", key: "total" },
		{ label: "Total sin vales", key: "totalSinVales" },
		{ label: "Diff.", key:"totalValesIngresados"},
		{ label: "Alcanzado", key: "weeklyGoalPercentage" },
		{ label: "Logrado", key: "weeklyGoalReached" },
	];

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

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
	const [direction, setDirection] = useState({ "id":"createdDate", "desc":true  });
	
	// Estado para saber cuál reporte se va a buscar 
	const [reportToSearch, setReportToSearch] = useState(1);

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(true);
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

	const [startDate, setStartDate] = useState('');

	const clearFilters = () =>{
		setStartDate(''); 
		reset({agency:'', startDate:'', code:''})
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Consultar por filtros
	const onFilterData = (data, e) => {
		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		// A partir del dia lunes se obtiene el día domingo
		data.endDate = moment(data.startDate).utc().subtract(4, 'hours').add(7 , 'days').endOf('day').format();

		setFilters(data);
		dispatch(salesActions.salesCommissionReports(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);
	const loadingExcel = useSelector(state => state.download.loading);

	const mapDataWithHeaders = (data, headers) => {
		return data.map((item) => {
			const mappedItem = {};
			headers.forEach(({ label, key }) => {
				let value = key.includes(".")
					? key.split(".").reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ""), item)
					: item[key];

				// Caso 1: Es un string con formato "123,456" → Convertir a número y limitar a 3 decimales
				if (typeof value === "string" && value.match(/^\d+,\d+$/)) {
					value = parseFloat(value.replace(",", "."));
					value = parseFloat(value.toFixed(3)); // Máximo 3 decimales (sin convertirlo a string)
				}
				// Caso 2: Es un string numérico sin decimales (ejemplo: "100") → Convertir a número
				else if (typeof value === "string" && /^\d+$/.test(value)) {
					value = parseInt(value, 10); // o parseFloat(value) si puede haber números grandes
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

	const exportToExcel = (data, filename = 'ReporteComisiones.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes de comisiones');

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		saveAs(blob, filename);
	};

	//Verificar data de redux de la data de excel
	const exportExcel = () => {
		const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

		if((reportToSearch === 1 && data && data.length > 0) || (reportToSearch === 2 && data2 && data2.length > 0)){

			let fixedData = [];
			
			if (reportToSearch === 1){
				fixedData = dataTable.commissionResultsWholesaleGoal.map((item) => {return Object.assign({}, item)})
					
				fixedData.forEach((item) => {
					// Obtener la meta correcta según la fecha del filtro
					const goalForDate = getGoalForFilterDate(item.seller, dataTable?.startDate, 'wholesales');
					const goalValue = goalForDate?.wholesalesGoal || item.seller.wholesalesGoal;
					
					item.seller.wholesalesGoal = roundToTwoDecimals(goalValue).toString()
											.replace(/\,/g, '')  // se eliminan las comas
											.replace(".", ',');  // se cambia la coma por punto
					
					item.totalWholesales = roundToTwoDecimals(item.totalWholesales).toString()
											.replace(/\,/g, '')  // se eliminan las comas
											.replace(".", ',');  // se cambia la coma por punto
					
					item.wholesalesGoalPercentage = roundToTwoDecimals(item.wholesalesGoalPercentage).toString() + '%'
					
					// Si no se alcanzo la meta, no se muestran los abonos ni el total acumulado
					if (item.wholesalesGoalReached){
						item.totalSumations = roundToTwoDecimals(item.totalSumations).toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto
									
						item.commisionToPay = item.totalDollars * (item.seller.wholesalesGoalCommissionPercentage / 100) 
						item.commisionToPay = roundToTwoDecimals(item.commisionToPay).toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto
	
						item.commisionToPayBs = item.totalDollars * (item.seller.wholesalesGoalCommissionPercentage / 100) * item.valueDollar
						item.commisionToPayBs = roundToTwoDecimals(item.commisionToPayBs).toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto

						item.totalDollars = roundToTwoDecimals(item.totalDollars).toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto
					}
					else{
						item.totalSumations = ''
						item.commisionToPay = ''
						item.commisionToPayBs = ''
						item.seller.wholesalesGoalCommissionPercentage = ''
						item.totalDollars = ''
					}
					
					// Agregar el símbolo % al porcentaje de comisión si se alcanzó la meta
					if (item.wholesalesGoalReached && item.seller.wholesalesGoalCommissionPercentage) {
						item.seller.wholesalesGoalCommissionPercentage = item.seller.wholesalesGoalCommissionPercentage.toString() + '%'
					}
					item.startDate = moment(filters.startDate).utc().format("YYYY-MM-DD");
					item.endDate = moment(filters.startDate).utc().add(6 , 'days').format("YYYY-MM-DD");
				})
			}
			else if (reportToSearch === 2){
				fixedData = dataTable.commissionResultsWeeklyGoal.map((item) => {return Object.assign({}, item)})

				fixedData.forEach((item) => {
					// Obtener la meta correcta según la fecha del filtro
					const goalForDate = getGoalForFilterDate(item.seller, dataTable?.startDate, 'weekly');
					const goalValue = goalForDate?.weeklyGoal || item.seller.weeklyGoal;
					
					item.seller.weeklyGoal = roundToTwoDecimals(goalValue).toString()
								.replace(/\,/g, '')  // se eliminan las comas
								.replace(".", ',');  // se cambia la coma por punto

					item.total = roundToTwoDecimals(item.total).toString()
								.replace(/\,/g, '')  // se eliminan las comas
								.replace(".", ',');  // se cambia la coma por punto
								
					item.totalSinVales = roundToTwoDecimals(item.totalSinVales).toString()
								.replace(/\,/g, '')  // se eliminan las comas
								.replace(".", ',');  // se cambia la coma por punto
					
					item.weeklyGoalPercentage = roundToTwoDecimals(item.weeklyGoalPercentage).toString()
								+ '%'

					item.weeklyGoalReached = item.weeklyGoalReached ? 'Si' : 'No'
					
					item.startDate = moment(filters.startDate).utc().format("YYYY-MM-DD");
					item.endDate = moment(filters.startDate).utc().add(6 , 'days').format("YYYY-MM-DD");
				})
			}

			setDataExcel(fixedData);
		}
	}

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			// Usar headers diferentes según el tipo de reporte
			const headersToUse = reportToSearch === 1 ? headers : headers2;
			const dataFormatted = mapDataWithHeaders(dataExcel, headersToUse);
			exportToExcel(dataFormatted);
			setDataExcel([]);
		}
	}, [dataExcel]);
	
	/*** Exportar ***/

	const conditionalRowStyles = [
		{
		  when: row => row.wholesalesGoalReached,
		  	style: {
				backgroundColor: 'rgb(181 218 190)',
			},
		},
	  ];

	  const conditionalRowStyles2 = [
		{
		  when: row => row.weeklyGoalReached,
		  	style: {
				backgroundColor: 'rgb(181 218 190)',
				fontWeight: "bold"
			},
		},
	  ];

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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de comisiones</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 9 || user.role == 10 || user.role == 6) && <FormGroup className="mr-3">
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
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
											isValidDate={currentDate => currentDate.day() === 1}
											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" , required:true } } 
										/>
									</FormGroup>
									<ButtonGroup className="mr-5">
										<Button
											color="primary"
											outline={reportToSearch !== 1}
											onClick={() => setReportToSearch(1)}
											active={reportToSearch === 1}
											>
											Comisiones por mayoreo
										</Button>
										<Button
											color="primary"
											outline={reportToSearch !== 2}
											onClick={() =>  setReportToSearch(2)}
											active={reportToSearch === 2}
											>
											Comisiones por tienda
										</Button>
									</ButtonGroup>

									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						<Row>
							<Col style={reportToSearch === 1 ? {} : {display: "none"}}>
								<DataTable
									className="dataTables_wrapper"
									responsive
									striped
									highlightOnHover
									sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
									title="Reporte de comisiones por mayoreo"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="Ingrese un rango de fechas para obtener el reporte"
									noHeader={true}
									columns={columns}
									data={data}
									pagination
									persistTableHead
									conditionalRowStyles={conditionalRowStyles}
									theme={darkMode ? "dark" : "default"}
									/>
							</Col>
							<Col style={reportToSearch === 2 ? {} : {display: "none"}}>
								<DataTable
									className="dataTables_wrapper"
									responsive
									striped
									highlightOnHover
									sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
									title="Reporte de comisiones por meta semanal"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="Ingrese un rango de fechas para obtener el reporte"
									noHeader={true}
									columns={columns2}
									data={data2}
									pagination
									persistTableHead
									conditionalRowStyles={conditionalRowStyles2}
									theme={darkMode ? "dark" : "default"}
									/>
							</Col>
						</Row>
						{((reportToSearch === 1 && data && data.length > 0) || (reportToSearch === 2 && data2 && data2.length > 0)) && (
                            <Button
                                className="btn"
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    exportExcel();
                                }}
                                disabled={loadingExcel}
                            >
                                <Icon icon={fileDownload} /> Exportar{" "}
                                {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
                        )}
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
            </div>
        </>
    );
}

export default CommissionsReportPage;
