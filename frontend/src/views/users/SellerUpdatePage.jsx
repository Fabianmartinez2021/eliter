/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { history } from '../../helpers';
import { useLocation } from "react-router-dom";
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import { getFirstAgencyId } from '../../helpers/defaultAgency';

function UserUpdatePage() {

    // Modo oscuro 
     const { darkMode } = useDarkMode();

    const location = useLocation();
    const userData = useSelector(state => state.authentication.user);
    const userState = useSelector(state => state.users.user);
    const searching = useSelector(state => state.users.searching);
    const users = useSelector(state => state.users);
    const [user, setUser] = useState(null);
    //obtener id del location state
    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(userActions.getSeller( location.state.id ));
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
    const { handleSubmit, register, errors, setValue } = useForm();

    const onUpdateData = (data) => {
        dispatch(userActions.updateSeller(location.state.id, data));
    };

    //State de actualizacion
    const updating = useSelector(state => state.users.updating);

    //Actualizar estado de usuario al cambio de información y refrescar lista de vendedores para que la meta semanal se vea al volver
    useEffect(() => {
        if (users.success) {
            setUser(users.userUpdated);
            dispatch(userActions.getSellers());
        }
    }, [users.success, dispatch]);

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
            if(user){
                setAgencySelected(user.agency)
            }
          
        }
    },[agencies.obtained, users.searched, user]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Actualizar vendedor</h3>
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
                                                defaultValue={user.firstName}
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
                                                defaultValue={user.lastName}
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
                                                defaultValue={user.status}
                                                >
                                                    <option key="" name="" value=""></option>
                                                    <option key="1" name="1" value="1">Activo</option>
                                                    <option key="2" name="2" value="2">Bloqueado</option>
                                            </select>
                                            {errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <label htmlFor="creditLimit">Límite de crédito</label>
                                                <input
                                                    maxLength="20"
                                                    className={'form-control' + (errors.creditLimit ? ' is-invalid' : '')}
                                                    name="creditLimit"
                                                    type="number"
                                                    ref={register({
                                                        required: "El valor es requerido",
                                                    })}
                                                    defaultValue={user.creditLimit}
                                                />
                                                {errors.creditLimit && <div className="invalid-feedback">{errors.creditLimit.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <p className="text-muted small">Las metas de venta por sucursal se configuran al actualizar la sede en <strong>Sucursales</strong>.</p>
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

export default UserUpdatePage;