/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { Role, history } from '../../helpers';
import { useLocation } from "react-router-dom";
import Datetime from 'react-datetime';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import { getFirstAgencyId } from '../../helpers/defaultAgency';

function OperatorUpdatePage() {

    // Modo oscuro 
	const { darkMode } = useDarkMode();

    const location = useLocation();
    const userData = useSelector(state => state.authentication.user);
    const userState = useSelector(state => state.users.user);
    const searching = useSelector(state => state.users.searching);
    const users = useSelector(state => state.users);
    const [operator, setOperator] = useState(null);
    //obtener id del location state
    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(userActions.getOperator( location.state.id ));
        }
    }, [location]);

    useEffect(() => {
        if(users.searched){
            setOperator(userState);
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
    const { handleSubmit, register, errors, watch, setValue } = useForm();
    let pwd = watch("password");
    //Registrar data
    const onUpdateData = (data, e) => {
        dispatch(userActions.updateOperator( location.state.id, data ));
    };

    //State de actualizacion
    const updating = useSelector(state => state.users.updating);

    //Actualizar estado de usuario al cambio de información
    useEffect(() => {
        if(users.success){
            setOperator(users.userUpdated);
        }
    },[users.success]);

    //obtener sedes para select
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


    //Setear sucursal seleccionada y gestionar cambio de dropdown
    useEffect(() => {
        if(agencies.obtained && users.searched){
            if(operator){
                setAgencySelected(operator.agency)
            }
          
        }
    },[agencies.obtained, users.searched, operator]);

    const [agencySelected, setAgencySelected] = useState('');

    const handleChange = (e) =>  {
        setAgencySelected( e.target.value);
    }

    useEffect(() => {
        const first = getFirstAgencyId(listAgencies);
        if (!first) return;
        setAgencySelected((prev) => {
            if (prev) return prev;
            setValue('agency', first);
            return first;
        });
    }, [listAgencies, setValue]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Actualizar operador</h3>
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
                                {operator &&
                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">       
                                    {user.role !== Role.Manager && <Row form>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="agency">Sucursal</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select className={'form-control' + (errors.agency ? ' is-invalid' : '')} name="agency" id="agency"
                                                    value={agencySelected} onChange={handleChange}
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
                                                        /*onChange={handleChangeStartDate} */
                                                        /*value={startDate}*/
                                                    defaultValue={new Date(operator.startDate)}
													inputProps={{  
                                                        name: 'startDate', 
                                                        ref:register, 
                                                        placeholder: "Fecha de ingreso", 
                                                        autoComplete: "off"
                                                    }} 
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
                                                    defaultValue={operator.document}
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
                                                defaultValue={operator.firstName}
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
                                                defaultValue={operator.lastName}
                                            />
                                            {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="status">Estado</Label>
                                            <select 
                                                className={'form-control' + (errors.status ? ' is-invalid' : '')} 
                                                name="status"
                                                ref={register({ 
                                                        required: "El estado es requerido" 
                                                    })}
                                                defaultValue={operator.status}
                                                >
                                                    <option key="" name="" value=""></option>
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
                                                        defaultChecked={operator.hasShirt}
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
                                                        defaultChecked={operator.hasPant}
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
                                                        defaultChecked={operator.hasSecurityBoots}
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
                                                        defaultChecked={operator.hasHat}
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
                                                    defaultValue={operator.comment}
                                                />
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

export default OperatorUpdatePage;