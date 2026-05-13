/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assetsActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { Role, history } from '../../helpers';
import { useLocation } from "react-router-dom";
import assetsEnum from '../../enums/assets.enum';
import { getFirstAgencyId } from '../../helpers/defaultAgency';

function AssetsUpdatePage() {

    const location = useLocation();
    const user = useSelector(state => state.authentication.user);
    const assetsData = useSelector(state => state.assets.assets);
    const searching = useSelector(state => state.assets.searching);
    const assetsState = useSelector(state => state.assets);
    const [assets, setAssets] = useState(null);
    //obtener id del location state
    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(assetsActions.getAssets( location.state.id ));
            
        }
    }, [location]);

    useEffect(() => {
        if(assetsState.searched){
            setAssets(assetsData);
        }
    },[assetsState.searched]);

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
    const { handleSubmit, register, errors, watch, setValue } = useForm();

    //Registrar data
    const onUpdateData = (data, e) => {
        dispatch(assetsActions.update( location.state.id, data, user ));
    };

    //State de actualizacion
    const updating = useSelector(state => state.assets.updating);

    //Actualizar estado de usuario al cambio de información
    useEffect(() => {
        if(assetsState.success){
            setAssets(assetsState.assetsUpdated);
        }
    },[assetsState.success]);

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
        if(agencies.obtained && assetsState.searched){
            if(assets){
                setAgencySelected(assets.agency)
            }
          
        }
    },[agencies.obtained, assetsState.searched, assets]);

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
            <div className="d-flex" id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Actualizar activo</h3>
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
                                {assets &&
                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">       
                                    <Row form>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="code">Código del activo</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={assets.code}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="agency">Sucursal</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select className={'form-control' + (errors.agency ? ' is-invalid' : '')} name="agency" id="agency"
                                                    value={agencySelected} onChange={handleChange}
                                                    ref={register({ 
                                                            required: "La sucursal es requerida" 
                                                        })}
                                                   
                                                    >
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
                                                    defaultValue={assets.name}
                                                 
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
                                                    defaultValue={assets.hasSerial ? assets.serial : ''}
                                                 
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
                                                        defaultChecked={assets.hasSerial}
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
                                                        })}
                                                    defaultValue={assets.condition}
                                                  
                                                >
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
                                                        })}
                                                    defaultValue={assets.category}
                                                  
                                                    
                                                >
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
                                                        })}
                                                    defaultValue={assets.type}
                                                   
                                                >
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
                                                        })}
                                                    defaultValue={assets.status}
                                                    disabled = {((user.role != Role.Admin) && (user.role != Role.Manager) && (user.role != Role.Supervisor) && (user.role != Role.AuditorFinanciero))}
                                                >
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
                                                        defaultValue={assets.price}
                                                       
                                                    />
                                                    {errors.price && <div className="invalid-feedback">{errors.price.message}</div>}
                                                </FormGroup>
                                            </Col>
                                        }
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="code">Dias en reparacion</Label>
                                                <input
                                                    className="form-control-plaintext"
                                                    defaultValue={assets.daysUnderRepair}
                                                    id="staticCode"
                                                    readOnly={true  }
                                                    type="text"
                                                   
                                                />
                                            </FormGroup>
                                        </Col>
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
                                                    defaultValue={assets.description}
                                                
                                                />
                                                 {errors.description && <div className="invalid-feedback d-block">{errors.description.message}</div>}
											</FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={updating}>
                                            {updating  && <span className="spinner-border spinner-border-sm mr-1"></span>}
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

export default AssetsUpdatePage;