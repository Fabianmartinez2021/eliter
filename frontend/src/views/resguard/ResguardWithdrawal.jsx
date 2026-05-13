/* eslint-disable */
import React, { useEffect, useState, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resguardActions, userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Modal, Table  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

function ResguardWithdrawalPage() {


   
	// Data del resguardo
	const data = useSelector(state => state.resguard.data);
    const [noData, setNoData] = useState(false);            // Variable para indicar si no hay data para no permitir una transaccion
    const [defaultData, setDefaultData] = useState({});

    
	//Consultar al entrar
	useEffect(() => {
		dispatch(resguardActions.resguardReport(getUserData(), {agency: user.agency.id}));
	}, []);

	//Verificar data de redux
	useEffect(() => {
		if(data && data.results && user.agency.name != "FATTORIA-FABRICA"  && user.agency.name != "Barinas-AltoBarinas"  && user.agency.name != "Barinas-Centro"){

            // Si no ha habido ningún registro de dinero todos los montos obviamente serán cero
            if(data.results.length === 0){
                setNoData(true)
                setDefaultData(null);
                setValue('amountBs', 0);
                setValue('amountDollar', 0);
                setValue('amountEur', 0);
                setValue('amountCop', 0);
            }
            else{
                // SI ya hay registros, el comportamiento es normal
               // SI ya hay registros, el comportamiento es normal
               let resguardData = data.results[0];
               setDefaultData(data.results[0]);
               setValue('amountBs', resguardData.lastOperation.amountBsTotal);
               setValue('amountDollar', resguardData.lastOperation.amountDollarTotal);
               setValue('amountEur', resguardData.lastOperation.amountEurTotal);
               setValue('amountCop', resguardData.lastOperation.amountCopTotal);


                // Si todos los valores son cero, obviamente tampoco se puede realizar un retiro
                if( !resguardData.lastOperation.amountBsTotal && !resguardData.lastOperation.amountDollarTotal && !resguardData.lastOperation.amountEurTotal && !resguardData.lastOperation.amountCopTotal ){
                    setNoData(true)
                }

            }
		}
  	},[data]);
    
  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
    });
    
    //Modo oscuro 
    const { darkMode} = useDarkMode();

    //usuario
    const user = useSelector(state => state.authentication.user);

    //obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

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

    //Form Data
    const { handleSubmit, register, errors, reset, control, watch, setValue} = useForm();

    //State de guardado
    const loading = useSelector(state => state.resguard.loading);

    const [dataResguard, setDataResguard] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    //Registrar data
    const onCreateData = (data, e) => {
        data.agency = user.agency.id;
        data.user = user.id;

        // Verificar si el usuario es rol 5 y está en la sucursal correcta
        if (user.role === 5 && user.agency.name === "FATTORIA-FABRICA") {
            // Permitir cualquier cantidad
            setDataResguard(data);
            setModalVisible(true);
        } else {
            // Verificar si hay montos disponibles para retirar
            if (noData) {
                alert("No hay fondos disponibles para retirar.");
            } else {
                // Aquí puedes agregar la lógica para manejar otras sucursales o roles
                setDataResguard(data);
                setModalVisible(true);
            }
        }
    };

    //Luego de confirmar el cierre
    const saveWithdrawal = () =>{
        dispatch(resguardActions.resguardWithdrawal( getUserData(), dataResguard ));
    }

    const resguard = useSelector(state => state.resguard);

    // Referencia para hacer focus al entrar y enviar los datos
    const refFocus = useRef()

    //Focus inicial en el cliente
    useEffect(() => {
        refFocus.current.focus();
    }, []);


    useEffect(() => {
        if(resguard.success){
            reset({
                amountBs: '',
                amountBsDescription: '',
                amountDollar: '',
                amountDollarDescription: '',
                amountEur: '',
                amountEurDescription: '',
                amountCop: '',
                amountCopDescription: '',
            });
            setModalVisible(false);
            refFocus.current.focus();
            dispatch(resguardActions.resguardReport(getUserData(), {agency: user.agency.id}));

        }else{
            setModalVisible(false);
            refFocus.current.focus();
        }
    },[resguard]);
    
    let amountBs = watch("amountBs");
    let amountDollar = watch("amountDollar");
    let amountEur = watch("amountEur");
    let amountCop = watch("amountCop");

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`}id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Retiro de dinero de la caja fuerte</h3>
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
                              
                                <Form onSubmit={handleSubmit(onCreateData)} className="form">
                                    <Row>
                                        <Col md={12}>  
                                            <FormGroup>
                                                <Label for="responsible">Responsable de llevarse el dinero</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.responsible ? ' is-invalid' : '')}
                                                    name="responsible"
                                                    ref={(e) => {
                                                        refFocus.current = e; 
                                                        register(e, { required: "El responsable es requerido" })
                                                    }}
                                                />
                                            {errors.responsible && <div className="invalid-feedback d-block">{errors.responsible.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>  
                                            <FormGroup>
                                                <Label for="amountBs">Cantidad de BOLIVARES</Label>
                                                <Controller
                                                    name="amountBs"
                                                    control={control}
                                                    disabled={user.role != 1 && user.role != 5  && user.role != 2 && user.role != 3} 
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountBs ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.amountBs && <div className="invalid-feedback">{errors.amountBs.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountBsDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountBsDescription ? ' is-invalid' : '')}
                                                    name="amountBsDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountBs === 0) ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountBsDescription && <div className="invalid-feedback d-block">{errors.amountBsDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label for="amountDollar">Cantidad de DÓLARES</Label>
                                                <Controller
                                                    name="amountDollar"
                                                    control={control}
                                                    disabled={user.role != 1 && user.role != 5  && user.role != 2 && user.role != 3} 
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountDollar ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.amountDollar && <div className="invalid-feedback">{errors.amountDollar.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountDollarDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountDollarDescription ? ' is-invalid' : '')}
                                                    name="amountDollarDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountDollar === 0) ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountDollarDescription && <div className="invalid-feedback d-block">{errors.amountDollarDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}> 
                                            <FormGroup>
                                                <Label for="amountEur">Cantidad de EUROS</Label>
                                                <Controller
                                                    name="amountEur"
                                                    control={control}
                                                    disabled={user.role != 1 && user.role != 5  && user.role != 2 && user.role != 3} 
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountEur ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.amountEur && <div className="invalid-feedback">{errors.amountEur.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountEurDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountEurDescription ? ' is-invalid' : '')}
                                                    name="amountEurDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountEur === 0) ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountEurDescription && <div className="invalid-feedback d-block">{errors.amountEurDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label for="amountCop">Cantidad de PESOS</Label>
                                                <Controller
                                                    name="amountCop"
                                                    control={control}
                                                    disabled={user.role != 1 && user.role != 5  && user.role != 2 && user.role != 3} 
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountCop ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.amountCop && <div className="invalid-feedback">{errors.amountCop.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountCopDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountCopDescription ? ' is-invalid' : '')}
                                                    name="amountCopDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountCop === 0) ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountCopDescription && <div className="invalid-feedback d-block">{errors.amountCopDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>  
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    maxLength="150"
                                                    autoComplete="off"
                                                    className={'form-control'}
                                                    name="comment"
                                                    ref={register}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={loading || noData}>
                                            {loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Guardar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => {setModalVisible(false); setDataResguard(null)}} isOpen={modalVisible} className={"modal-lg"}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                ¿Confirmar el retiro de resguardo de los siguientes montos?
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setDataResguard(null)}}
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
                                    {dataResguard && <tr>
                                        <td><NumberFormat value={dataResguard.amountBs} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
                                        <td><NumberFormat value={dataResguard.amountDollar} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' /></td>
                                        <td><NumberFormat value={dataResguard.amountEur} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Eur ' /></td>
                                        <td><NumberFormat value={dataResguard.amountCop} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Cop ' /></td>                                        
                                    </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                            <div className="modal-footer">
                                <Button color="primary" disabled={loading} onClick={()=>saveWithdrawal()}>
                                    {loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    Confirmar
                                </Button>
                                <Button color="secondary" type="button" onClick={() => {setModalVisible(false);setDataResguard(null);}} disabled={loading}>
                                    Cerrar
                                </Button>
                            </div>
                        </Modal>
                        </Container>
                    </div>

				</div>
            </div>
        </>
    );
}

export default ResguardWithdrawalPage;