/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Alert, Modal, Badge } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { Icon } from '@iconify/react';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import { useReactToPrint } from 'react-to-print';

import { Line } from 'react-chartjs-2';

import Chart from 'chart.js/auto';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function PaymentMethodsChartPage() {

	function LineChart({ chartData, chartOptions}) {

		return <Line data={chartData} options={chartOptions} />;
	}

	const [userData, setUserData] = useState({
		labels: [],
		datasets: [{
			label: 'Productos vendidos ',
			data: [],
			backgroundColor: [
                'rgba(201, 203, 207, 0.2)'
			],
			borderColor: [
                'rgb(75, 192, 192)'
			],
            tension: 0.5,
			borderWidth: 1
		}]
	})	

	Chart.register({
		id: 'alwaysShowTooltip',
		afterDraw: (chart) => {
			const { ctx } = chart;
			ctx.save();
			chart.data.datasets.forEach((dataset, i) => {
				chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
					const {x, y} = datapoint.tooltipPosition();

					// Se obtiene el texto cada etiqueta con su respectivo dato
					const textLabel = chart.data.labels[index];
					const textLabelLength = ctx.measureText(textLabel).width;
					const textData = chart.data.datasets[i].data[index];
					const textDataLength = ctx.measureText(textData).width;

					ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

					// Se hace el cuadrado que va a contener la información
					// Inicialmente obtengo el ancho de la caja que debe ser el ancho del texto mayor entre la etiqueta y el dato
					let textWidth = textLabelLength > textDataLength ? textLabelLength : textDataLength;
					// Creo el cuadro con la etiqueta
					ctx.fillRect(x - ((textWidth + 20) / 2), y - 60, textWidth + 20, 25);
					// Creo el cuadro con la data
					ctx.fillRect(x - ((textWidth + 20) / 2), y - 35, textWidth + 20, 25);


					/// Hacer un triangulo abajo del cuadro
					ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x - 10, y - 10);
					ctx.lineTo(x + 10, y - 10);
					ctx.fill();
					ctx.restore(); // Se restauran las configuraciones del ctx como los colores, estilos, etc


					// Se implementa el texto
					ctx.font = 'bold 12px Arial';
					ctx.fillStyle = 'white';
					ctx.fillText(textLabel, x - (textWidth / 2), y - 50);
					ctx.fillText(textData, x - (textWidth / 2), y - 25);
					ctx.restore();
				})
			})
		}
	})
    const options = {
		scales: {
			y: {
			  type: 'linear',
			  grace: '20%'
			},
			x: {
			  offset: true
			},
		}
		//plugins: [alwaysShowTooltip],
    };

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


    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if(alert.message){
            setVisible(true); 
            window.setTimeout(()=>{setVisible(false)},5000);   
        }
    },[alert]);


	const dataSales = useSelector(state => state.sales.table);
    const loadingPage = useSelector(state => state.sales.loading);

	//Verificar data de redux
	useEffect(() => {

		if(dataSales && dataSales.results){

			setUserData({
				labels: dataSales.results.labels,
				datasets: [{
					label: 'Cantidad en dólares',
					data: dataSales.results.data,
                    backgroundColor: [
                        'rgba(201, 203, 207, 0.2)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)'
                    ],
                    tension: 0.2,
					borderWidth: 4
				}
			]
			})
		}
  	},[dataSales]);
    
	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
            agency: user.agency.id,
            role:user.role,
			id: user.id
		}
	}    

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

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(true);
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
		if ( dateDiff > 21 ){
			setModalVisible(true);
            setModalMsg('El rango de fechas no puede superar los 21 días');
			return;
		}

		setFilters(data);

		dispatch(salesActions.salesPaymentMethodsChart(getUserData(), data));

	};

	//Form Data Filter
	const { handleSubmit, register, reset, errors, setValue, watch } = useForm();

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
		reset({ticket:'', names:'', reference:'', startDate:'', endDate:''})
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [expandAll, setExpandAll] = useState(false);


	/** PARA EXPORTAR **/
	
	const [dataToPrint, setDataToPrint] = useState(null);

	const printRef = useRef(); 

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
		documentTitle: 'Ticket N° ' + (dataToPrint ? dataToPrint.order : ''),
		onAfterPrint: () => setDataToPrint(null),
		//pageStyle: "@page{margin: 20mm;	}"
		pageStyle: "@media print { @page {margin: 0mm;} body {padding: 20mm !important;}}"
	})
	
	const ComponentToPrint = ({ data }) => (
		 <>
			{ data && <div ref={printRef} > 
				
			</div>
			}
		</>
	)

	useEffect(() => {
		if (dataToPrint){
			handlePrint();
		}
	}, [dataToPrint]);

	
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Gráfico de Formas de Pago</h3>
							</div>
						</div>
                                {alert.message &&
                                    <Alert color={`alert ${alert.type}`} isOpen={visible} fade={true}>
                                        <div className="container">
                                            {alert.message}
                                            <button
                                                type="button"
                                                className="close"
                                                aria-label="Close"
                                                onClick={onDismiss}
                                            >
                                                <span aria-hidden="true">
                                                <i className="now-ui-icons ui-1_simple-remove"></i>
                                                </span>
                                            </button>
                                        </div>
                                    </Alert>
                                }
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5) && <FormGroup className="mr-3">
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
                                        {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                        <select className='form-control' name="type"
                                            ref={(e) => {
												//clientNamesRef.current = e;
												register(e, { required: "El campo es requerido" })}}>

												<option key="" name="" value="">Seleccione opción</option>
                                                <option key="totalAmmount" name="totalAmmount" value="totalAmmount">INGRESOS TOTALES REALES</option>
												<option key="totalStock" name="totalStock" value="totalStock">TOTAL EN MERCANCIA</option>
												<option key="totalPendingPayments" name="totalPendingPayments" value="totalPendingPayments">TOTAL DE CUENTAS POR COBRAR</option>
												
                                        </select>
                                    </FormGroup>
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
									<FormGroup className="mr-3">
										<Button color="primary" disabled={loadingPage} onClick={() => { setExpandAll(!expandAll)}}>
											{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Desplegar todo
										</Button>
									</FormGroup>
								</Form>
							</>
							}
						</div>
                        {
                            loadingPage && <CustomLoader />
                        }
                        {
                            (!loadingPage && (dataSales && dataSales.results)) && <Row>
                                <Col>
                                    <LineChart chartData={userData} chartOptions={options}/>
                                </Col>
                            </Row>
                        }
												
						<Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible} className={` ${darkMode ? "dark-mode" : ""}`}>
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
			{/* Componente para imprimir (está oculto) */}
			<div style={{ display: "none" }}>
				<ComponentToPrint data={dataToPrint}/>
			</div>
        </>
    );
}

export default PaymentMethodsChartPage;