/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assetsActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { Role, history } from '../../helpers';
import assetsEnum from '../../enums/assets.enum';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function AssetsCreatePage() {

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

    
	// Obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

    //Form Data
    const { handleSubmit, register, errors, reset, setValue, watch } = useForm();
    //Registrar data
    const onCreateData = (data, e) => {
        dispatch(assetsActions.register( getUserData(), data ));
    };

    //State de guardado
    const registering = useSelector(state => state.assets.loading);

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

    const assets = useSelector(state => state.assets);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(assets.success){
            reset();
            setValue('agency', '');
            setValue('name', '');
            setValue('serial', '');
            setValue('condition', '');
            setValue('category', '');
            setValue('type', '');
            setValue('status', '');
            setValue('description', '');
        }
    },[assets.success]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Añadir un nuevo activo</h3>
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
                                {((user.role == Role.Admin) || (user.role == Role.Supervisor)) ? (
                                        <Row form>
                                            <Col md={6}>
                                            <FormGroup>
                                                <Label for="agency">Sucursal</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select
                                                className={'form-control' + (errors.agency ? ' is-invalid' : '')}
                                                name="agency"
                                                ref={register({
                                                    required: "La sucursal es requerida",
                                                })}
                                                >
                                                <option key="" name="" value=""></option>
                                                {listAgencies &&
                                                    listAgencies.map((list) => (
                                                    <option key={list.id} name={list.id} value={list.id}>
                                                        {list.name}
                                                    </option>
                                                    ))}
                                                </select>
                                                {errors.agency && <div className="invalid-feedback d-block">{errors.agency.message}</div>}
                                            </FormGroup>
                                            </Col>
                                        </Row>
                                        ) : (
                                        <input
                                            type="hidden"
                                            name="agency"
                                            value={user.agency.id}
                                            ref={register({
                                            required: "La sucursal es requerida",
                                            })}
                                        />
                                        )}
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="name">Nombre</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.name ? ' is-invalid' : '')}
                                                    name="name"
                                                    ref={register({
                                                        required: "El nombre es requerido",
                                                        setValueAs: value => value.trim(),
                                                    })}
                                                />
                                                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>  
                                            <FormGroup>
                                                <Label for="serial">Serial</Label>
                                                <input
                                                    maxLength="150"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.serial ? ' is-invalid' : '')}
                                                    name="serial"
                                                    disabled={!watch("hasSerial")}
                                                    ref={register({
                                                        validate: (value) => {
                                                            if(!value && (watch("hasSerial") == "true")){
                                                                return "El serial es requerido"
                                                            }
                                                        }
                                                    })}
                                                />
                                                {errors.serial && <div className="invalid-feedback">{errors.serial.message}</div>}
                                            </FormGroup>
                                        </Col>    
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label for="hasSerial">Tiene serial</Label>
                                                    <input 
                                                        className="form-control"
                                                        name="hasSerial"
                                                        id="hasSerial" 
                                                        type="checkbox" 
                                                        value={true}
                                                        defaultChecked
                                                        style={{height: "1.5rem"}}
                                                        ref={register}/>  
                                            </FormGroup>
                                        </Col>    
                                    </Row>									
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="condition">Condición</Label>
                                                <select 
                                                    className={'form-control' + (errors.condition ? ' is-invalid' : '')} 
                                                    name="condition"
                                                    ref={register({ 
                                                            required: "La condición es requerida" 
                                                        })}>
                                                        <option key="0" name="" value=""></option>
                                                        {
                                                            assetsEnum.condition.map((item) => {
                                                                return <option key={item} name={item} value={item}>{item}</option>
                                                            })
                                                        }
                                                </select>
                                                {errors.condition && <div className="invalid-feedback d-block">{errors.condition.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="category">Categoria</Label>{' '}
                                                <select 
                                                    className={'form-control' + (errors.category ? ' is-invalid' : '')} 
                                                    name="category"
                                                    ref={register({ 
                                                            required: "La categoria es requerida" 
                                                        })}>
                                                        <option key="0" name="" value=""></option>
                                                        {
                                                            assetsEnum.category.map((item) => {
                                                                return <option key={item} name={item} value={item}>{item}</option>
                                                            })
                                                        }
                                                </select>
                                                {errors.category && <div className="invalid-feedback d-block">{errors.category.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="type">Tipo</Label>{' '}
                                                <select 
                                                    className={'form-control' + (errors.type ? ' is-invalid' : '')} 
                                                    name="type"
                                                    ref={register({ 
                                                            required: "El tipo es requerido" 
                                                        })}>
                                                        <option key="0" name="" value=""></option>
                                                        {
                                                            assetsEnum.type.map((item) => {
                                                                return <option key={item} name={item} value={item}>{item}</option>
                                                            })
                                                        }
                                                </select>
                                                {errors.type && <div className="invalid-feedback d-block">{errors.type.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="status">Estatus</Label>{' '}
                                                <select 
                                                    className={'form-control' + (errors.status ? ' is-invalid' : '')} 
                                                    name="status"
                                                    ref={register({ 
                                                            required: "El tipo es requerido" 
                                                        })}>
                                                        <option key="0" name="" value=""></option>
                                                        {
                                                            assetsEnum.status.map((item) => {
                                                                return <option key={item} name={item} value={item}>{item}</option>
                                                            })
                                                        }
                                                </select>
                                                {errors.status && <div className="invalid-feedback d-block">{errors.status.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        { ((user.role === Role.Admin) || (user.role === Role.Supervisor)) && // Por los momentos únicamente pueden observar el valor los administradores
                                            <Col md={6}>  
                                                <FormGroup>
                                                    <Label for="price">Valor en dólares</Label>
                                                    <input
                                                        maxLength="150"
                                                        autoComplete="off"
                                                        className={'form-control' + (errors.price ? ' is-invalid' : '')}
                                                        name="price"
                                                        type='number'
                                                        ref={register()}
                                                    />
                                                    {errors.price && <div className="invalid-feedback">{errors.price.message}</div>}
                                                </FormGroup>
                                            </Col>
                                        }
                                    </Row>
                                    <Row form>
                                        <Col md={12}>
											<FormGroup>
												<Label for="description">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.description ? ' is-invalid' : '')}
                                                    name="description"
                                                    placeholder={'Ingrese la descripción del activo'}
                                                    ref={register({ 
                                                        required: "La descripción es requerida" 
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.description && <div className="invalid-feedback d-block">{errors.description.message}</div>}
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

export default AssetsCreatePage;