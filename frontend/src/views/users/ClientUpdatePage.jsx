/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { history } from '../../helpers';
import { useLocation } from "react-router-dom";

function ClientUpdatePage() {

    const location = useLocation();
    const userState = useSelector(state => state.users.user);
    const searching = useSelector(state => state.users.searching);
    const users = useSelector(state => state.users);
    const [user, setUser] = useState(null);
    //obtener id del location state
    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(userActions.getClient( location.state.id ));
        }
    }, [location]);

    useEffect(() => {
        if(users.searched){
            setUser(userState);
        }
    },[users.searched]);

  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
    });

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
    const { handleSubmit, register, errors, watch } = useForm();
    let pwd = watch("password");
    //Registrar data
    const onUpdateData = (data, e) => {
        dispatch(userActions.updateClient( location.state.id, data ));
    };

    //State de actualizacion
    const updating = useSelector(state => state.users.updating);

    //Actualizar estado de usuario al cambio de información
    useEffect(() => {
        if(users.success){
            setUser(users.userUpdated);
        }
    },[users.success]);

    return (
        <>
            <div className="d-flex" id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Actualizar cliente</h3>
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
                                {searching &&  <div className="d-flex justify-content-center">
                                    <Spinner color="primary" />
                                </div>} 
                                {user &&
                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">       
                                    <Row form>
                                        <Col md={6}>  
                                            <FormGroup>
                                            <Label for="document">Documento de identidad</Label>
                                            <input
                                                maxLength="100"
                                                autoComplete="off"
                                                className={'form-control' + (errors.document ? ' is-invalid' : '')}
                                                name="document"
                                                ref={register({
                                                    required: "El documento es requerido",
                                                })}
                                                defaultValue={user.document}
                                            />
                                            {errors.document && <div className="invalid-feedback">{errors.document.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="names">Nombres</Label>
                                            <input
                                                maxLength="200"
                                                autoComplete="off"
                                                className={'form-control' + (errors.names ? ' is-invalid' : '')}
                                                name="names"
                                                ref={register({
                                                    required: "El nombre es requerido",
                                                })}
                                                defaultValue={user.names}
                                            />
                                            {errors.names && <div className="invalid-feedback">{errors.names.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="phone">Teléfono</Label>
                                            <input
                                                maxLength="50"
                                                autoComplete="off"
                                                className={'form-control' + (errors.phone ? ' is-invalid' : '')}
                                                name="phone"
                                                ref={register({
                                                    required: "El teléfono es requerido",
                                                })}
                                                defaultValue={user.phone}
                                            />
                                            {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={updating}>
                                            {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Actualizar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                                }
                            </Col>
                        </Row>
                        </Container>
                    </div>

				</div>
            </div>
        </>
    );
}

export default ClientUpdatePage;