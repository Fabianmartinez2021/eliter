/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { history } from '../../helpers';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function UserCreatePage() {

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
    const { handleSubmit, register, errors, reset, watch, setValue } = useForm();
    let pwd = watch("password");
    //Registrar data
    const onCreateData = (data, e) => {
        dispatch(userActions.register( data ));
    };

    //State de guardado
    const registering = useSelector(state => state.registration.registering);

    //obtener sucursales para select
    const getting = useSelector(state => state.agencies.getting);
    const agencies = useSelector(state => state.agencies);
    useEffect(() => {
        dispatch(agencyActions.listAgencies());
    },[]);

    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if(agencies.obtained){
            setListAgencies(agencies.list);
        }
    },[agencies.obtained]);

    const statusRegister = useSelector(state => state.registration);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(statusRegister.success){
            reset();
        }
    },[statusRegister.success]);

    const _defaultAgencyWatch = watch('agency');

    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Añadir usuario</h3>
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
                                    <Row form>
                                        <Col md={6}> 
                                            <FormGroup> 
                                                <Label for="agency">Sucursal</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select className={'form-control' + (errors.agency ? ' is-invalid' : '')} name="agency"
                                                    ref={register({ 
                                                            required: "La sucursal es requerida" 
                                                        })}>
                                                        <option key="" name="" value=""></option>
                                                        {listAgencies && listAgencies.map(list => 
                                                            <option
                                                                key={list.id}
                                                                name={list.id}
                                                                value={list.id}>
                                                                {list.name}
                                                            </option>
                                                        )}
                                                </select>
                                                {errors.agency && <div className="invalid-feedback d-block">{errors.agency.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="username">Nombre de usuario</Label>
                                                <input
                                                    maxLength="150"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.username ? ' is-invalid' : '')}
                                                    name="username"
                                                    ref={register({
                                                        required: "El nombre de usuario es requerido",
                                                        pattern: {
                                                            value: /^[a-z0-9_-]{6,16}$/i,
                                                            message: "Nombre de usuario inválido"
                                                        }
                                                    })}
                                                />
                                                {errors.username && <div className="invalid-feedback">{errors.username.message}</div>}
                                            </FormGroup>
                                        </Col>    
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="firstName">Nombres</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.firstName ? ' is-invalid' : '')}
                                                    name="firstName"
                                                    ref={register({
                                                        required: "El nombre es requerido",
                                                    })}
                                                />
                                                {errors.firstName && <div className="invalid-feedback">{errors.firstName.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="lastName">Apellidos</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.lastName ? ' is-invalid' : '')}
                                                    name="lastName"
                                                    ref={register({
                                                        required: "El apellido es requerido",
                                                    })}
                                                />
                                                {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="role">Rol</Label>{' '}
                                            <select className={'form-control' + (errors.rol ? ' is-invalid' : '')} name="role"
                                                ref={register({ 
                                                        required: "El rol es requerido" 
                                                    })}>
                                                    <option key="0" name="" value=""></option>
                                                    { (user && user.role == 1) && <>
                                                            <option key="1" name="1" value="1">Administrador</option>
                                                            <option key="2" name="2" value="2">Supervisor</option>
                                                            <option key="3" name="3" value="3">Gerente</option>
                                                            <option key="4" name="4" value="4">Cajero</option>
                                                            <option key="5" name="5" value="5">Cobranzas</option>
                                                            <option key="6" name="6" value="6">Auditor de inventarios</option>
                                                            <option key="7" name="7" value="7">Televentas</option>
                                                            <option key="8" name="8" value="8">Suministros</option>
                                                            <option key="9" name="9" value="9">Auditor de Finanzas</option>
                                                            <option key="10" name="10" value="10">Auditor General</option>
                                                        </>
                                                    }
                                                    { (user && user.role == 2) && <>
                                                       {/* <option key="1" name="1" value="1">Administrador</option>
                                                        <option key="2" name="2" value="2">Supervisor</option>
                                                        <option key="3" name="3" value="3">Gerente</option>*/}
                                                        <option key="4" name="4" value="4">Cajero</option>
                                                       { /*<option key="5" name="5" value="5">Cobranzas</option>
                                                        <option key="6" name="6" value="6">Auditor de inventarios</option>
                                                        <option key="7" name="7" value="7">Televentas</option>
                                                        <option key="8" name="8" value="8">Suministros</option>*/}
                                                        </>
                                                    }
                                            </select>
                                            {errors.role && <div className="invalid-feedback d-block">{errors.role.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="status">Estado</Label>
                                            <select className={'form-control' + (errors.status ? ' is-invalid' : '')} name="status"
                                                ref={register({ 
                                                        required: "El estado es requerido" 
                                                    })}>
                                                    <option key="0" name="" value=""></option>
                                                    <option key="1" name="1" value="1">Activo</option>
                                                    <option key="2" name="2" value="2">Bloqueado</option>
                                            </select>
                                            {errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <label htmlFor="password">Contraseña</label>
                                                <input
                                                    maxLength="20"
                                                    className={'form-control' + (errors.password ? ' is-invalid' : '')}
                                                    name="password"
                                                    type="password"
                                                    ref={register({
                                                        required: "La contraseña es requerida",
                                                        minLength:{ value:6, message: "La contraseña debe contener mínimo 6 caracteres"}
                                                    })}
                                                />
                                                {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <label htmlFor="confirm_password">Confirmar contraseña</label>
                                            <input
                                                maxLength="20"
                                                className={'form-control' + (errors.confirm_password ? ' is-invalid' : '')}
                                                name="confirm_password"
                                                type="password"
                                                ref={register({
                                                    required: "La confirmación de contraseña es requerida",
                                                    validate: value => value === pwd || "Las contraseñas no coinciden"
                                                })}
                                            />
                                            {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={registering}>
                                            {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Guardar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                        </Container>
                    </div>

				</div>
            </div>
        </>
    );
}

export default UserCreatePage;