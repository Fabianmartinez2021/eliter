/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resguardActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Row, Table, Col,  Modal, Badge, Form, FormGroup, ListGroupItemHeading } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import checkIcon from '@iconify/icons-fa-solid/check';
import timesIcon from '@iconify/icons-fa-solid/times';
import { Role, history } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function ResguardReportPage() {

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

	const dataResguard = useSelector(state => state.resguard.data);
    const loadingPage = useSelector(state => state.resguard.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);

	//Verificar data de redux
	useEffect(() => {
		if(dataResguard && dataResguard.results){
            setData(dataResguard.results);
		}
  	},[dataResguard]);
    
	const [rowCount, setRowCount] = useState(0);
	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'lastOperation.agency.name',
            sortable: true,
            wrap:true
		},
        {
			name: 'Bolivares',
			selector: 'lastOperation.amountBsTotal',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.lastOperation.amountBsTotal ? row.lastOperation.amountBsTotal.toFixed(2) : row.lastOperation.amountBsTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' />
			},
        },
        {
			name: 'Dólares',
			selector: 'lastOperation.amountDollarTotal',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.lastOperation.amountDollarTotal ? row.lastOperation.amountDollarTotal.toFixed(2) : row.lastOperation.amountDollarTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},
        },
        {
			name: 'Euros',
			selector: 'lastOperation.amountEurTotal',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.lastOperation.amountEurTotal ? row.lastOperation.amountEurTotal.toFixed(2) : row.lastOperation.amountEurTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Eur ' />
			},
        },
        {
			name: 'Pesos',
			selector: 'lastOperation.amountCopTotal',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.lastOperation.amountCopTotal ? row.lastOperation.amountCopTotal.toFixed(2) : row.lastOperation.amountCopTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Cop ' />
			},
        },
        {
			name: 'Ultima actualización',
			selector: 'lastOperation.createdDate',
			sortable: true,
			cell : (row)=>{
				return row.lastOperation ? moment(row.lastOperation.createdDate).utc().format('MMMM Do YYYY, h:mm:ss a') : '';
			},
        },
	];

	// Headers para exportación a Excel
	const headers = [
		{ label: 'Sucursal', key: 'lastOperation.agency.name' },
		{ label: 'Bolivares', key: 'lastOperation.amountBsTotal' },
		{ label: 'Dólares', key: 'lastOperation.amountDollarTotal' },
		{ label: 'Euros', key: 'lastOperation.amountEurTotal' },
		{ label: 'Pesos', key: 'lastOperation.amountCopTotal' },
		{ label: 'Ultima actualización', key: 'lastOperation.createdDate' }
	];

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
            agency: user.agency.id,
            role:user.role,
            id: user.id,
            manager: true,
		}
	}

	//Consultar al entrar
	useEffect(() => {
		dispatch(resguardActions.resguardReport(getUserData(), {}));
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

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



	const [filters, setFilters] = useState('');

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const [startDate, setStartDate] = useState('');

	const clearFilters = () =>{
		setStartDate(''); 
		reset({agency:'', startDate:'', endDate:''})
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

		setFilters(data);
		dispatch(resguardActions.resguardReport(getUserData(), data, false));
	}

	// En caso de que se quiera hacer un retiro
	
	const [dataWithdrawal, setDataWithdrawal] = useState(null);
	const [modalWithdrawal, setModalWithdrawal] = useState(false);

	const getWithdrawal = (data) => {

		setDataWithdrawal(data);
		setModalWithdrawal(true);
	}

	const confirmWithdrawal = () => {
		dispatch(resguardActions.resguardWithdrawal(getUserData()));
	}

	const totalBs = dataResguard?.results?.reduce((acc, item) => {
	return acc + (item.lastOperation?.amountBsTotal || 0);
	}, 0) || 0;
	const totalUsd = dataResguard?.results?.reduce((acc, item) => acc + (item.lastOperation?.amountDollarTotal || 0), 0);
	const totalEur = dataResguard?.results?.reduce((acc, item) => acc + (item.lastOperation?.amountEurTotal || 0), 0);
	const totalCop = dataResguard?.results?.reduce((acc, item) => acc + (item.lastOperation?.amountCopTotal || 0), 0);

	
	
	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(resguardActions.resguardReport(getUserData(), filters , true));
	}

	const exportToExcel = (data, filename = 'DineroActualCajaFuerte.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Resguardo');

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

	console.log('dataExcel', dataExcel)

	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(excel && excel.results){
			// Crear datos formateados para Excel
			const excelData = excel.results.map((item) => {
				if(item.lastOperation) {
					return {
						'Sucursal': item.lastOperation.agency?.name || '',
						'Bolivares': item.lastOperation.amountBsTotal || 0,
						'Dólares': item.lastOperation.amountDollarTotal || 0,
						'Euros': item.lastOperation.amountEurTotal || 0,
						'Pesos': item.lastOperation.amountCopTotal || 0,
						'Ultima actualización': moment(item.lastOperation.createdDate).utc().format("YYYY-MM-DD HH:mm:ss")
					};
				}
				return {};
			});

			setDataExcel(excelData);
		}
	},[excel]);

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			exportToExcel(dataExcel);
			setDataExcel([]);
		}
	}, [dataExcel]);




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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Dinero actual en caja fuerte</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 9 || user.role == 10) && <FormGroup className="mr-3">
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
											inputProps={{  name: 'startDate', ref:register, placeholder: "Ingrese una fecha", autoComplete:"off" }} isValidDate={isValidDate}
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
								persistTableHead
								theme={darkMode ? "dark" : "default"}

							/>
							</Col>
							
						</Row>
						{data && data.length > 0 && (
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
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent:'end',
							alignItems:'flex-end',
							width: '100%',
						}}>
							<div 
								style={{
									display: 'flex',
									gap: '10px',
									width:'200px'

								}}
							>
								<b>Total en Bs:</b> <NumberFormat value={totalBs.toFixed(2)} displayType={'text'} thousandSeparator={true} /> <br />
							</div>
							<div
								style={{
									display: 'flex',
									gap: '10px',
									width:'200px'

								}}
							>
								<b>Total en USD:</b> <NumberFormat value={totalUsd?.toFixed(2)} displayType={'text'} thousandSeparator={true} /> <br />
							</div>
							<div 
								style={{
									display: 'flex',
									gap: '10px',
									width:'200px'

								}}
							>
								<b>Total en EUR:</b><NumberFormat value={totalEur?.toFixed(2)} displayType={'text'} thousandSeparator={true} /> <br />
							</div>
							<div 
								style={{
									display: 'flex',
									gap: '10px',
									width:'200px'
								}}
							>
								<b>Total en COP:</b><NumberFormat value={totalCop?.toFixed(2)} displayType={'text'} thousandSeparator={true} />
							</div>

						</div>

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
                        <Modal toggle={() => {setModalWithdrawal(false); setDataWithdrawal(null)}} isOpen={modalWithdrawal} className={"modal-lg"}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                ¿Confirmar retiro del resguardo?
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalWithdrawal(false); setDataWithdrawal(null)}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
                                <Table striped responsive>
                                    <thead>
                                        <tr>
                                            <th>Bolívares</th>
                                            <th>Dólares</th>
                                            <th>Euros</th>
                                            <th>Pesos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {dataWithdrawal && <tr>
                                        <td><NumberFormat value={dataWithdrawal.amountBsTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
                                        <td><NumberFormat value={dataWithdrawal.amountDollarTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' /></td>
                                        <td><NumberFormat value={dataWithdrawal.amountEurTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Eur ' /></td>
                                        <td><NumberFormat value={dataWithdrawal.amountCopTotal} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Cop ' /></td>                                        
                                    </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                            <div className="modal-footer">
                                <Button color="primary" onClick={()=>confirmWithdrawal()}>
                                    Confirmar
                                </Button>
                                <Button color="secondary" type="button" onClick={() => {setModalWithdrawal(false);setDataWithdrawal(null);}}>
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

export default ResguardReportPage;