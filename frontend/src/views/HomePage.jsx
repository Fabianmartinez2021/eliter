/* eslint-disable */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Col, Row, FormGroup, Label, Alert, Modal, Form } from 'reactstrap';
import { history } from '../helpers';

// core components
import AdminNavbar from "../components/Navbars/AdminNavbar";
//import DefaultFooter from "../components/Footers/DefaultFooter";
import SideBar from "../components/SideBar/SideBar"
import { agencyActions } from '../actions';
import { useState } from 'react';
import { useDarkMode} from '../helpers/darkModeContext';
import "../assets/css/darkMode.css"; // Importa los estilos

function HomePage() {

    const user = useSelector(state => state.authentication.user);
    const { darkMode} = useDarkMode();
    
    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    
	// Obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

    const dispatch = useDispatch();

    const closeStore = () => {
        dispatch(agencyActions.closeAgency(getUserData(), false, comment))
        onCloseModal()
    }
    const closeStoreTest = () => {
        dispatch(agencyActions.closeAgency(getUserData(), true, ''))
    }

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if(alert.message){
            //setModalChange(false);
            setVisible(true); 
            window.setTimeout(()=>{setVisible(false)},5000);   
        }
    },[alert]);
    
    const getting = useSelector(state => state.agencies.getting);
    const success = useSelector(state => state.agencies.success);

    const [comment, setComment] = useState('');

	const [modalClose, setModalClose] = useState(false);

	const onCloseModal = () =>{
        setComment('');
        setModalClose(false);
	}

    // Si la comprobacion es exitosa, se abre el modal para el cierre
     useEffect(() => {
        if(success){
            setModalClose(true)
        }
    },[success]);

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar/>
                <div id="page-content-wrapper">
                    <AdminNavbar/>
                    <div className="container">
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
                        <Col md="4">
                            <h2 className="welcome-title">Bienvenido</h2>
                            <h1 className="name-user">{user.firstName}</h1>
                        </Col>
                        <div className="text-left">
                                <Button
                                    className="btn-round btn-salir-outline"
                                    color="primary"
                                    size="md"
                                    outline
                                    style={{ minWidth: 195 }}
                                    onClick={e => { e.preventDefault(); history.push('/login'); }}
                                >
                                    SALIR
                                </Button>
                            </div>

                            {/* <div className="text-center">
                                <Button
                                className="btn-primary"
                                    color="info"
                                    size="md"
                                    outline
                                    style={{fontWeight: "bold", minWidth:170, color:"#245CF0"}}

                                    a href="https://registrofactura.embutidosfattoria.com" target="_blank">Ir al Sistema de Facturas legales
                                </Button>
                            </div>
                            <div className="text-center">
                                <Button
                                className="btn-primary"
                                    color="info"
                                    size="md"
                                    outline
                                    style={{fontWeight: "bold", minWidth:170, color: "#245CF0"}}

                                    a href="https://despacho.embutidosfattoria.com/login" target="_blank">Ir al sistema de Despacho
                                </Button>
                            </div> */}
                            <div className="text-center" style={{display: (user.role == 3) ? "" : "none" }}>
                                <Button
                                    className="btn-round"
                                    color="success"
                                    size="md"
                                    style={{fontWeight: "bold", minWidth:195}}
                                    onClick={closeStoreTest}
                                    >
                                    CERRAR TIENDA
                                </Button>
                            </div>
                            
						<Modal toggle={() => {onCloseModal()}} isOpen={modalClose} backdrop="static" className={"modal-sm"}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                ¿Algún comentario para cerrar el día? 
                            </h5>
                            <button  aria-label="Close" className="close" type="button" onClick={() =>  {onCloseModal()}}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
							<Form className="form">
									<Row>
                                        <Col md={12}>
											<FormGroup>
												<Label for="comment">Comentario</Label>
												<textarea
													maxLength="200"
													autoComplete="off"
													placeholder='Ingrese un comentario (Opcional)'
													className={'form-control'}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    rows="10" cols="50"
												/>
											</FormGroup>
                                        </Col>
									</Row>
                                    <div className="d-flex justify-content-between">
										<Button color="primary" disabled={getting} onClick={closeStore}>
                                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Confirmar cierre
                                        </Button>
										                                       
										<Button color="secondary" type="button" onClick={() =>  {onCloseModal()}}>
											Cerrar
										</Button>
                                    </div>
                                </Form>  
                            </div>
                        </Modal>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HomePage;