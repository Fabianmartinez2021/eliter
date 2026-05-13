/* eslint-disable */
import React, { useEffect, useState, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resguardActions, userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import moment from 'moment';
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Modal, Table  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";

function WithdrawalConfirmPage() {
    // Modo oscuro 
    const { darkMode } = useDarkMode();
	// Data del resguardo
	const data = useSelector(state => state.resguard.searched);
    const [defaultData, setDefaultData] = useState({});

	//Verificar data de redux
	useEffect(() => {

		if(data){
            // Si la operacion ya está confirmada, no es necesario que se vuelva a confirmar
            if (data.confirmationStatus){
                history.push('/resguard-report')
            }
            
            setDefaultData(data);
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

    //  OBTENER LA TRANSACCION CORRESPONDIENTE
    
    const location = useLocation();

    //obtener id del location state para obtener la transaccion
    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(resguardActions.getResguardOperation( getUserData(), location.state.id ));
        }
    }, [location]);


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

    const [modalVisible, setModalVisible] = useState(false);

    //Luego de confirmar el cierre
    const confirmWithdrawal = () =>{
        dispatch(resguardActions.resguardConfirmWithdrawal( getUserData(), location.state.id ));
    }

    const resguard = useSelector(state => state.resguard);

    useEffect(() => {
        if(resguard.successConfirmation && visible){
            history.goBack();
        }else{
            setModalVisible(false);
            window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
        }
    },[resguard]);
    

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`}  id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Confirmacion de Retiro</h3>
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
                              
                                <Form onSubmit={handleSubmit(() => setModalVisible(true))} className="form">
                                    <Row>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="agency">Agencia</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.agency ? defaultData.agency.name : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="date">Fecha de retiro</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.createdDate ?  moment(defaultData.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a") : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="user">Usuario responsable</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.user ? defaultData.user.username : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="user">Nombre</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.user ? defaultData.user.firstName + ' ' + defaultData.user.lastName  : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="responsible">Responsable de llevarse el dinero</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.responsible}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>  
                                            <FormGroup>
                                                <Label for="amountBs">Cantidad de BOLIVARES</Label>
                                                <input
                                                    className="form-control-plaintext" 
                                                    value={"Bs " + defaultData.amountBs}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountBsDescription">Descripción</Label>
                                                <textarea
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.amountBsDescription ? defaultData.amountBsDescription : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                    rows="3" cols="50"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label for="amountDollar">Cantidad de DÓLARES</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    value={"$ " + defaultData.amountDollar}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountDollarDescription">Descripción</Label>
                                                <textarea
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.amountDollarDescription ? defaultData.amountDollarDescription : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                    rows="3" cols="50"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}> 
                                            <FormGroup>
                                                <Label for="amountEur">Cantidad de EUROS</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    value={"Eur " + defaultData.amountEur}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountEurDescription">Descripción</Label>
                                                <textarea
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.amountEurDescription ? defaultData.amountEurDescription : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                    rows="3" cols="50"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label for="amountCop">Cantidad de PESOS</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    value={"Cop " + defaultData.amountCop}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountCopDescription">Descripción</Label>
                                                <textarea
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.amountCopDescription ? defaultData.amountCopDescription : ''}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                    rows="3" cols="50"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>  
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={defaultData.comment ? defaultData.comment : 'No hay comentarios'}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={loading}>
                                            {loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Confirmar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => {setModalVisible(false)}} isOpen={modalVisible} className={"modal-lg"}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                ¿Desea confirmar el retiro?
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false)}}
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
                                    {defaultData && <tr>
                                        <td><NumberFormat value={defaultData.amountBs} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
                                        <td><NumberFormat value={defaultData.amountDollar} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' /></td>
                                        <td><NumberFormat value={defaultData.amountEur} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Eur ' /></td>
                                        <td><NumberFormat value={defaultData.amountCop} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Cop ' /></td>                                        
                                    </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                            <div className="modal-footer">
                                <Button color="primary" disabled={loading} onClick={()=>confirmWithdrawal()}>
                                    {loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    Confirmar
                                </Button>
                                <Button color="secondary" type="button" onClick={() => {setModalVisible(false);}} disabled={loading}>
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

export default WithdrawalConfirmPage;