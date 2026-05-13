/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, ButtonGroup, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

function TelesalesCommissionsReportPage() {

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

			// Data para el ExpandedComponent de las ventas al mayor
			setDataExpandedComponent(dataTable.commissionResultsWholesaleGoalPerAgency);

			// Data para el reporte de la meta semanal
			setData2(dataTable.commissionResultsWeeklyGoal)

			// Data para la sumatoria total del reporte de la meta semanal
			setData2Total(dataTable.commissionResultsWeeklyGoalTotal);
		}
  	},[dataTable]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [dataExpandedComponent, setDataExpandedComponent] = useState([]);
	const [data2, setData2] = useState([]);
	const [data2Total, setData2Total] = useState(null);

	//Columnas Data table para las comisiones por mayoreo
	const columns = [
		{
			name: 'Meta semanal',
			selector: 'wholesalesGoal',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.wholesalesGoal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
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
			name: 'Clientes atendidos',
			selector: 'totalClients',
			sortable: true,
			omit:true,
			cell : (row)=>{
				return row.wholesalesGoalReached ? <NumberFormat value={totalClients} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /> : '';
			},
		},
		{
			name: 'Porcentaje de Comisión',
			selector: 'wholesalesGoalCommissionPercentage',
			sortable: true,
			cell : (row)=>{
				return  row.wholesalesGoalReached ? <NumberFormat value={row.wholesalesGoalCommissionPercentage} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} /> : '';
			},
		},
		{
			name: 'Comisión a pagar',
			selector: 'totalDollars',
			sortable: true,
			cell : (row)=>{
				return  row.wholesalesGoalReached ? <NumberFormat value={(row.totalDollars * (row.wholesalesGoalCommissionPercentage / 100)).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /> : '';
			},
		},
		{
			name: 'Comisión a pagar (Bs)',
			selector: 'totalDollars',
			sortable: true,
			omit: true,
			cell : (row)=>{

				return  row.wholesalesGoalReached ? <NumberFormat value={(row.totalDollars * (row.wholesalesGoalCommissionPercentage / 100) * row.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /> : '';
			},
		},
	];

	//Columnas Data table para las comisiones por las metas semanales 
	const columns2 = [
		{
			name: 'Agencia',
			selector: 'agency.name',
			wrap: true,
			sortable: true,
		},
		{
			name: 'Total Bs',
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
			cell : (row)=>{
				return  <NumberFormat value={row.totalDollars ? row.totalDollars.toFixed(2) : row.totalDollars} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Clientes atendidos',
			selector: 'totalClients',
			sortable: true,
		},
		{
			name: 'Total de kg',
			selector: 'totalWeight',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalWeight ? row.totalWeight.toFixed(2) : row.totalWeight} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'kg'} />
			},
		},
	];

	const columnsExpandedComponent = [
		{
			name: 'Agencia',
			selector: 'agency.name',
			wrap: true,
			sortable: true,
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
			name: 'Clientes atendidos',
			selector: 'totalClients',
			sortable: true,
			cell : (row)=>{
				return row.wholesalesGoalReached ? <NumberFormat value={totalClients} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /> : '';
			},
		},
	];

	const headers = [
		{ label: "Fecha inicial", key: "startDate" },
		{ label: "Fecha final", key: "endDate" },
		{ label: "Meta semanal", key: "wholesalesGoal" },
		{ label: "Mayor", key: "totalWholesales" },
		{ label: "Alcanzado", key: "wholesalesGoalPercentage" },
		{ label: "Logrado", key: "wholesalesGoalReached" },

		{ label: "Abonos", key: "totalSumations" },
		{ label: "Total", key: "totalDollars" },
		{ label: "Clientes atendidos", key: "totalClients" },
		{ label: "Porcentaje de Comisión", key: "wholesalesGoalCommissionPercentage" },
		{ label: "Comisión a pagar", key: "commisionToPay" },
		{ label: "Comisión a pagar (Bs)", key: "commisionToPayBs" }
	];

	const headers2 = [
		{ label: "Fecha inicial", key: "startDate" },
		{ label: "Fecha final", key: "endDate" },
		{ label: "Agencia", key: "agency.name" },
		{ label: "Total Bs", key: "total" },
		{ label: "Total $", key: "totalDollars" },
		{ label: "Clientes atendidos", key: "totalClients" },
		{ label: "Total de kg", key: "totalWeight" }
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
	const { handleSubmit, register, reset } = useForm();

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


	//Consultar por filtros
	const onFilterData = (data, e) => {
		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate =  moment(data.endDate).isValid();

		if(data.endDate != "" && !validEndDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if(isafter){
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');

		//Si el rango de fechas es superior a los seis días abrir modal
		if ( dateDiff > 60 ){
			setModalWarning(true);
			setModalMsg('El rango de fechas no puede superar los 60 días');
			return;
		}

		setFilters(data);
		dispatch(salesActions.telesalesCommissionReports(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	//Verificar data de redux de la data de excel
	const exportExcel = () => {

		if(data || data2){

			let fixedData = [];
			
			// Se una copia de los detalles para que estos no sean los modificados
			//Se modifican los datos antes de la descarga en excel

			if (reportToSearch === 1){
				fixedData = dataTable.commissionResultsWholesaleGoal.map((item) => {return Object.assign({}, item)})
					
				fixedData.forEach((item) => {

					item.wholesalesGoal = item.wholesalesGoal.toString()
											.replace(/\,/g, '')  // se eliminan las comas
											.replace(".", ',');  // se cambia la coma por punto
					
					item.totalWholesales = item.totalWholesales.toString()
											.replace(/\,/g, '')  // se eliminan las comas
											.replace(".", ',');  // se cambia la coma por punto
					
					item.wholesalesGoalPercentage = item.wholesalesGoalPercentage.toString() + '%'
					
					// Si no se alcanzo la meta, no se muestran los abonos ni el total acumulado
					if (item.wholesalesGoalReached){

						item.totalSumations = item.totalSumations.toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto
									
						item.commisionToPay = item.totalDollars * (item.wholesalesGoalCommissionPercentage / 100)
						item.commisionToPay = item.commisionToPay.toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto
	
						item.commisionToPayBs = item.totalDollars * (item.wholesalesGoalCommissionPercentage / 100) * item.valueDollar
						item.commisionToPayBs = item.commisionToPayBs.toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto

						item.totalDollars = item.totalDollars.toString()
												.replace(/\,/g, '')  // se eliminan las comas
												.replace(".", ',');  // se cambia la coma por punto
					}
					// Si no se alcanzo la meta, estos campos no se muestran
					else{
						item.totalSumations = ''
						item.commisionToPay = ''
						item.commisionToPayBs = ''
						item.wholesalesGoalCommissionPercentage = ''
						item.totalDollars = ''
					}
					item.startDate = moment(filters.startDate).utc().format("YYYY-MM-DD");
					item.endDate = moment(filters.endDate).utc().format("YYYY-MM-DD");		
				})
			}
			else if (reportToSearch === 2){

				fixedData = dataTable.commissionResultsWeeklyGoal.map((item) => {return Object.assign({}, item)})

				fixedData.forEach((item) => {

					item.total = item.total.toString()
								.replace(/\,/g, '')  // se eliminan las comas
								.replace(".", ',');  // se cambia la coma por punto

					item.totalDollars = item.totalDollars.toString()
								.replace(/\,/g, '')  // se eliminan las comas
								.replace(".", ',');  // se cambia la coma por punto

					item.weeklyGoalReached = item.weeklyGoalReached ? 'Si' : 'No'
					
					item.startDate = moment(filters.startDate).utc().format("YYYY-MM-DD");
					item.endDate = moment(filters.endDate).utc().format("YYYY-MM-DD");
		
				})
			}

			setDataExcel(fixedData);
		}
	}

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0 && refExcel && refExcel.current && refExcel.current.link) {
			setTimeout(() => {
				refExcel.current.link.click();
				setDataExcel([]);
			});
		}
	},[dataExcel]);
	
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

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<>
			<div className="mt-4"><b></b></div>
				<DataTable
					className="dataTables_wrapper ml-4"
					responsive
					striped
					highlightOnHover
					sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
					title="Reporte de inventarios"
					progressPending={loadingPage}
					paginationComponentOptions={paginationOptions}
					progressComponent={<CustomLoader />}
					noDataComponent="Ingrese un rango de fechas para obtener el reporte"
					noHeader={true}
					columns={columnsExpandedComponent}
					data={dataExpandedComponent}
					//pagination
					persistTableHead
					conditionalRowStyles={conditionalRowStyles}
					/>
			
			<div className="mb-4 mt-2"><b></b></div>
		</>
	);

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de comisiones (Televentas)</h3>
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
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" , required:true } } 
											isValidDate={isValidDate}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" , required:true }}
											isValidDate={isValidDate}
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
											active={reportToSearch === 1}
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
									expandableRows
									expandableRowsComponent={<ExpandedComponent />}
									sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
									title="Reporte de inventarios"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="Ingrese un rango de fechas para obtener el reporte"
									noHeader={true}
									columns={columns}
									data={data}
									pagination
									//paginationServer
									//paginationTotalRows={rowCount}
									//sortServer
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
									//expandableRows
									//expandableRowDisabled={row => row.disabled}
									//expandableRowsComponent={<ExpandedComponent />}
									sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
									title="Reporte de inventarios"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="Ingrese un rango de fechas para obtener el reporte"
									noHeader={true}
									columns={columns2}
									data={data2}
									pagination
									//paginationServer
									//paginationTotalRows={rowCount}
									//onSort={handleSort}
									//sortServer
									//onChangeRowsPerPage={handlePerRowsChange}
									//onChangePage={handlePageChange}
									persistTableHead
									conditionalRowStyles={conditionalRowStyles2}
									theme={darkMode ? "dark" : "default"}						
									/>
							</Col>
						</Row>

						{/*Se muestra unicamente para el reporte total*/}
						<Row xs="12" style={reportToSearch === 2 ? {} : {display: "none"}}>
							<Col>
							<div className="pull-right mr-4">
								<b>Total Bs: <NumberFormat value={data2Total ? data2Total.total.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>
							</div>
							<br/>
							<div className="pull-right mr-4">
								<b>Total $: <NumberFormat value={data2Total ? data2Total.totalDollars.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>
							</div>
							<br/>
							<div className="pull-right mr-4">
								<b>Clientes atendidos: <NumberFormat value={data2Total ? data2Total.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>
							</div>
							<br/>
							<div className="pull-right mr-4">
								<b>Total de kg: <NumberFormat value={data2Total ? data2Total.totalWeight.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>
							</div>
							</Col>
						</Row>
						
						{ data && data.length > 0 && <>
							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} > 
								<Icon icon={fileDownload} /> Exportar {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>}
							</Button>
							{ 
								dataExcel.length>0 && <>
									<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={reportToSearch === 1 ? headers : headers2} filename={ reportToSearch == 1 ? "ComisionesMayor.csv" : "ComisionesDetal.csv"}  style={{display:'none'}}>
										Exportar
									</CSVLink>
								</>
							}
							</>	
						}
						{/* Modal de notificaciones */}
						<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning} className={` ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
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
            </div>
        </>
    );
}

export default TelesalesCommissionsReportPage;