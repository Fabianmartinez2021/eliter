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
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function OperatorsPerformancePage() {

  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
  	});
   
	//usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

	const dataTable = useSelector(state => state.users.data);
    const loadingPage = useSelector(state => state.users.loading);

	//Verificar data de redux
	useEffect(() => {

		if(dataTable && dataTable.operatorPerformanceReport){
			
			// Data para el reporte al mayor
			setData(dataTable.operatorPerformanceReport);
		}
  	},[dataTable]);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);

	//Columnas Data table para los totales procesados
	const columns = [
        {
			name: 'Agencia',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
        },
        {
			name: 'Operador',
			selector: 'operator.firstName',
			sortable: true,
			wrap:true,
			cell : (row)=>{
				return  row.operator ? (row.operator.firstName + ' ' + row.operator.lastName) : ''
			},
        },
        {
			name: 'Documento',
			selector: 'operator.document',
			sortable: true,
			wrap:true,
        },
		{
			name: 'Mayor Bs',
			selector: 'totalWholesales',
			sortable: true,
			omit: user.role === 3,
			cell : (row)=>{
				return  <NumberFormat value={row.totalWholesales ? row.totalWholesales.toFixed(2) : row.totalWholesales} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Mayor Clientes',
			selector: 'totalWholesaleClients',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalWholesaleClients} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} />
			},
		},
		{
			name: 'Detal',
			selector: 'totalRetail',
			sortable: true,
			omit: user.role === 3,
			cell : (row)=>{
				return  <NumberFormat value={row.totalRetail ? row.totalRetail.toFixed(2) : row.totalRetail} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Detal Clientes',
			selector: 'totalRetailClients',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalRetailClients} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} />
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			omit: user.role === 3,
			cell : (row)=>{
				return  <NumberFormat value={row.total ? row.total.toFixed(2) : row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Total Clientes',
			selector: 'totalClients',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalClients} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} />
			},
		},
	];

	const headers = [
		{ label: "Fecha inicial", key: "startDate" },
		{ label: "Fecha Final", key: "endDate" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Operador", key: "operator.firstName" },
		{ label: "Documento", key: "operator.document" },
		{ label: "Mayor Bs", key: "totalWholesales" },
		{ label: "Mayor Clientes", key: "totalWholesaleClients" },
		{ label: "Detal Bs", key: "totalRetail" },
		{ label: "Detal Clientes", key: "totalRetailClients" },
		{ label: "Total Bs", key: "total" },
		{ label: "Total Clientes", key: "totalClients" },
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

		// Si es usuario gerente, puede ver solo los operadores de su sucursal 
		if (user.role == 3){
			data.agency = user.agency.id
		}

		setFilters(data);
		dispatch(userActions.operatorPerformanceReport(getUserData(), data));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	//Verificar data de redux de la data de excel
	const exportExcel = () => {
		if( data.length != 0 ){

			// Se una copia de los detalles para que estos no sean los modificados
			let fixedData = JSON.parse(JSON.stringify(data));

			//Se modifican los datos antes de la descarga en excel
			fixedData.forEach((item) => {

				item.totalWholesales = item.totalWholesales.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.totalRetail = item.totalRetail.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.total = item.total.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.operator.firstName = item.operator.firstName + ' ' + item.operator.lastName

				item.startDate = moment(filters.startDate).utc().format("YYYY-MM-DD hh:mm:ss a");
				item.endDate = moment(filters.endDate).utc().format("YYYY-MM-DD hh:mm:ss a");
			})

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

    const _defaultAgencyWatch = watch('agency');

    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


    return (
        <>
            <div className="d-flex" id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de rendimiento de los operadores</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6) && <FormGroup className="mr-3">
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
											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" , required:true } } 
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" , required:true }}
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
									columns={columns}
									data={data}
									pagination
									//paginationServer
									//paginationTotalRows={rowCount}
									//sortServer
									persistTableHead
									conditionalRowStyles={conditionalRowStyles}
									/>
							</Col>
						</Row>
						{ data && data.length > 0 && <>
							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingPage}> 
								<Icon icon={fileDownload} /> Exportar {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>}
							</Button>
							{ 
								dataExcel.length>0 && <>
									<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"RendimientoDeOperadores.csv"}  style={{display:'none'}}>
										Exportar
									</CSVLink>
								</>
							}
							</>	
						}
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

export default OperatorsPerformancePage;