/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, terminalActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, Badge } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function TerminalReportPage() {

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

	const dataReports = useSelector(state => state.terminal.table);
    const loadingPage = useSelector(state => state.terminal.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([])
	const [dataTotal, setDataTotal] = useState(null)

	//Verificar data de redux
	useEffect(() => {
		if(dataReports && dataReports.results){
			setData(dataReports.results);
			setDataTotal(dataReports.total)
		}
		if(dataReports && dataReports.metadata && dataReports.metadata[0]){
			setRowCount(dataReports.metadata[0].total);
		}
  	},[dataReports]);
    	
	
	const [rowCount, setRowCount] = useState(0)
	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: false,
            omit: user.role == 1 || user.role == 2 ? false:true,//Visible si es admin o supervisor
            wrap:true,
		},
		{
			name: 'Total Aplica',
			selector: 'totalApplyAmmount',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.totalApplyAmmount?row.totalApplyAmmount.toFixed(2):row.totalApplyAmmount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' />
			},
		},
		{
			name: '(%)',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.totalApplyAmmount?(row.totalApplyAmmount/row.total*100).toFixed(2):row.totalApplyAmmount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix='%' />
			},
		},
		{
			name: 'Total NO Aplica',
			selector: 'totalNotApplyAmmount',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.totalNotApplyAmmount ? row.totalNotApplyAmmount.toFixed(2): '' } displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: '(%)',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.totalNotApplyAmmount?(row.totalNotApplyAmmount/row.total*100).toFixed(2):row.totalNotApplyAmmount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix='%' />
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.total ? row.total.toFixed(2): '' } displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD");
			},
		},
	];

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

	const getDataTable = (page) => {
		dispatch(terminalActions.terminalRecordsTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(terminalActions.terminalRecordsTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(terminalActions.terminalRecordsTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(terminalActions.terminalRecordsTable(getUserData(), page, newPerPage, direction, filters ? filters: {}));
    };
    

    //obtener sucursales para select
    const getting = useSelector(state => state.users.getting);
    const users = useSelector(state => state.users);
    useEffect(() => {
        dispatch(userActions.getListUserAgencies(getUserData()));
    },[]);

    const [listUsers, setListUsers] = useState(null);
    const [listAgencies, setListAgencies] = useState(null);
    
    useEffect(() => {
        if(users.obtained){
            setListUsers(users.list.users);
            setListAgencies(users.list.agencies);
        }
    },[users.obtained]);

	const [filters, setFilters] = useState('');

	//Consultar al entrar
	useEffect(() => {
		//setData([])
		//getDataTable(1);
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//Consultar por filtros
	const onFilterData = (data, e) => {

		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalVisible(true);
            setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate =  moment(data.endDate).isValid();

		if(data.endDate != "" && !validEndDate){
			setModalVisible(true);
            setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if(isafter){
			setModalVisible(true);
            setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');   // =1

		//Si el rango de fechas es superior a los seis días abrir modal
		if ( dateDiff > 15 ){
			setModalVisible(true);
            setModalMsg('El rango de fechas no puede superar los 15 días');
			return;
		}

		setFilters(data);
		dispatch(terminalActions.terminalRecordsTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();
	const agencyFilterWatch = watch('agency');
	useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

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
		reset({startDate:'', endDate:''})
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [expandAll, setExpandAll] = useState(false);

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<>
			<div className={`mt-4 ml-4 mr-4 ${darkMode ? 'text-white' : ''}`}><b>Puntos de venta que aplican</b></div>
			<Table striped  className={`mt-2 mb-4 ml-4 mr-4 ${darkMode ? 'dark-mode' : ''}`} >
				<thead className={darkMode ? 'bg-dark text-white' : ''} >
					<tr>
						<th>Terminal</th>
						<th>Debito</th>
						<th>Crédito</th>
						<th>Total</th>
					</tr>
				</thead>
				{
					data.applyStack.map(item => {
						return(
							<>
								
								<tbody className={darkMode ? 'bg-dark text-white' : ''} key={item.terminal.code}>
									<tr>
										<td>{item.terminal.code}</td>
										<td><NumberFormat value={ item.debit ? item.debit.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
										<td><NumberFormat value={ item.credit ? item.credit.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
										<td><NumberFormat value={ item.total ? item.total.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
									</tr>
								</tbody>
							</>
						)
					})
				}
			</Table>
			<div className={`mt-4 ml-4 mr-4 ${darkMode ? 'text-white' : ''}`}><b>Puntos de venta que NO aplican</b></div>
			<Table striped className={`mt-2 mb-4 ml-4 mr-4 ${darkMode ? 'dark-mode' : ''}`} >
				
				<thead className={darkMode ? 'bg-dark text-white' : ''}>
					<tr>
						<th>Terminal</th>
						<th>Debito</th>
						<th>Crédito</th>
						<th>Total</th>
					</tr>
				</thead>
				{
					data.notApplyStack.map(item => {
						return(
							<>
								
								<tbody className={darkMode ? 'bg-dark text-white' : ''} key={item.terminal.code}>
									<tr>
										<td>{item.terminal.code}</td>
										<td><NumberFormat value={ item.debit ? item.debit.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
										<td><NumberFormat value={ item.credit ? item.credit.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
										<td><NumberFormat value={ item.total ? item.total.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
									</tr>
								</tbody>
							</>
						)
					})
				}
			</Table>
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de puntos de venta</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5 || user.role == 10) && <FormGroup className="mr-3">
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
											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" }} isValidDate={isValidDate}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
										/>
									</FormGroup>
									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						<Row>
							<Col>
							<DataTable
								className="dataTables_wrapper"
								responsive
								highlightOnHover
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
								expandableRowExpanded={row => expandAll}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Ventas"
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
						{user.role !== 4 && <>
							<Row xs="12">
								<Col>
									<div className="pull-right">
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
										{(dataTotal && !loadingPage) &&
											<b>
												Total Aplica: <NumberFormat value={dataTotal.totalApplyAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
												&emsp;
												(%): <NumberFormat value={(dataTotal.totalApplyAmmount / dataTotal.total * 100).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} />
											</b>
										}
									</div>
								</Col>
							</Row>
							<Row xs="12">
								<Col>
									<div className="pull-right">
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
										{(dataTotal && !loadingPage) &&
											<b>
												Total NO aplica: <NumberFormat value={dataTotal.totalNotApplyAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
												&emsp;
												(%): <NumberFormat value={(dataTotal.totalNotApplyAmmount / dataTotal.total * 100).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} />
											</b>
										}
									</div>
								</Col>
							</Row>
							<Row xs="12">
								<Col>
								<div className="pull-right">
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
										{(dataTotal && !loadingPage) &&<b>Total: <NumberFormat value={dataTotal.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></b>}
									</div>
								</Col>
							</Row>
						</>}
						<Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible} className={`${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ventas
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
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
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
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

export default TerminalReportPage;