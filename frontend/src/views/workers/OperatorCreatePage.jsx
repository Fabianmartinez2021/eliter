/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { Role, history } from '../../helpers';
import Datetime from 'react-datetime';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function OperatorCreatePage() {

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

    // Fecha de ingreso
	const [startDate, setStartDate] = useState('');

    //Registrar data
    const onCreateData = (data, e) => {

        if (user.role === Role.Manager) data.agency = user.agency.id;
        
        dispatch(userActions.registerOperator( data ));
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
            setStartDate('')
        }
    },[statusRegister.success]);

    const _defaultAgencyWatch = watch('agency');

    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Añadir operador</h3>
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
                                    {user.role !== Role.Manager && <Row form>
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
                                    </Row>}
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup className="mr-3">
                                                <Label for="startDate">Fecha de ingreso</Label>{' '}
												<Datetime
                                                    timeFormat={false} 
                                                    dateFormat={'YYYY-MM-DD'} 
                                                    closeOnSelect 
                                                    onChange={(date) => setStartDate(date)}
                                                    value={startDate}
													inputProps={{  
                                                        name: 'startDate', 
                                                        ref:register, 
                                                        placeholder: "Fecha de ingreso", 
                                                        autoComplete:"off",
                                                        required:true
                                                    }
                                                    } 
												/>
											</FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="document">Documento</Label>
                                                <input
                                                    maxLength="100"
                                                    type="number"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.document ? ' is-invalid' : '')}
                                                    name="document"
                                                    ref={register({
                                                        required: "El documento es requerido",
                                                    })}
                                                />
                                                {errors.document && <div className="invalid-feedback">{errors.document.message}</div>}
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
                                        <Col>
                                            <FormGroup className="ml-4 my-1">
                                                <label>
                                                    <input 
                                                        className="form-check-input"
                                                        name="hasShirt"
                                                        id="hasShirt" 
                                                        type="checkbox" 
                                                        value={true}
                                                        ref={register}/> TIENE CAMISA
                                                </label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col>
                                            <FormGroup className="ml-4 my-1">
                                                <label>
                                                    <input 
                                                        className="form-check-input"
                                                        name="hasPant"
                                                        id="hasPant" 
                                                        type="checkbox" 
                                                        value={true}
                                                        ref={register}/> TIENE PANTALÓN
                                                </label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col>
                                            <FormGroup className="ml-4 my-1">
                                                <label>
                                                    <input 
                                                        className="form-check-input"
                                                        name="hasSecurityBoots"
                                                        id="hasSecurityBoots" 
                                                        type="checkbox" 
                                                        value={true}
                                                        ref={register}/> TIENE BOTAS DE SEGURIDAD
                                                </label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col>
                                            <FormGroup className="ml-4 my-1">
                                                <label>
                                                    <input 
                                                        className="form-check-input"
                                                        name="hasHat"
                                                        id="hasHat" 
                                                        type="checkbox" 
                                                        value={true}
                                                        ref={register}/> TIENE GORRO
                                                </label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={12}>  
                                            <FormGroup className="mt-3">
                                                <Label for="comment">Comentarios</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                    placeholder={"Indique algun comentario relacionado con el operador (Opcional)"}
                                                    ref={register}
                                                    rows="10" cols="50"
                                                />
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

export default OperatorCreatePage;