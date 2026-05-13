import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { terminalActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm  } from "react-hook-form";
import { history } from '../../helpers';
/* eslint-disable */
import { useLocation } from "react-router-dom";
import bankEnum from '../../enums/bank.enum';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

function TerminalUpdatePage() {

    // Modo oscuro 
    const { darkMode } = useDarkMode();

    const location = useLocation();

    const terminalState = useSelector(state => state.terminal);
    const searching = useSelector(state => state.terminal.searching);
    const user = useSelector(state => state.authentication.user);
    //obtener terminal del state
    const [terminal, setTerminal] = useState(null);

    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(terminalActions.getTerminal( location.state.id ));
            
        }
    }, [location]);

    //Si se obtiene la terminal se asigna a variable
    useEffect(() => {
        if(terminalState.get){
            setTerminal(terminalState.terminal);
        }
    },[terminalState.get]);


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
    const { handleSubmit, register, errors, reset } = useForm();

    //Registrar data
    const onUpdateData = (data, e) => {
        dispatch(terminalActions.updateTerminal( location.state.id, data, user ));
    };

    //State de actualizacion
    const updating = useSelector(state => state.terminal.updating);
    const terminals = useSelector(state => state.terminal);

    //Actualizar estado de terminal al cambio de información
    useEffect(() => {
        if(terminals.success){
            setTerminal(terminals.terminalUpdated);
        }
    },[terminals.success]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Actualizar terminal</h3>
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
                                {terminal &&
                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">
                                    <Row form>
                                        <Col md={5}>
                                        <FormGroup>
                                            <Label for="code">Código</Label>
                                            <input
                                                maxLength="20"
                                                autoComplete="off"
                                                className={'form-control' + (errors.code ? ' is-invalid' : '')}
                                                name="code"
                                                ref={register({
                                                    required: "El código es requerido",
                                                })}
                                                defaultValue={terminal.code}
                                            />
                                            {errors.code && <div className="invalid-feedback">{errors.code.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={5}>
                                        <FormGroup>
                                            <Label for="serial">Serial</Label>
                                            <input
                                                maxLength="20"
                                                autoComplete="off"
                                                className={'form-control' + (errors.serial ? ' is-invalid' : '')}
                                                name="serial"
                                                ref={register({
                                                    required: "El serial es requerido",
                                                })}
                                                defaultValue={terminal.serial}
                                            />
                                            {errors.serial && <div className="invalid-feedback">{errors.serial.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label for="apply">Aplica</Label>
                                                <select 
                                                    className={'form-control' + (errors.apply ? ' is-invalid' : '')}
                                                    name="apply"
                                                    ref={register({
                                                        required: "La opción es requerida",
                                                    })}
                                                    defaultValue={terminal.apply}>
                                                        <option key="SI" name="SI" value={true}>SI</option>
                                                        <option key="NO" name="NO" value={false}>NO</option>
                                                </select>
                                                {errors.apply && <div className="invalid-feedback">{errors.apply.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="bank">Banco</Label>
                                                <select 
                                                    className={'form-control' + (errors.bank ? ' is-invalid' : '')}
                                                    name="bank"
                                                    defaultValue={terminal.bank}
                                                    ref={register({
                                                        required: "El banco es requerido",
                                                    })}>
                                                        <option key="" name="" value="">Seleccione el banco</option>
                                                        {
                                                            Object.entries(bankEnum.bank).map((item) => {
                                                                return  <option key={item[1]} name={item[1]} value={item[1]}> {`${item[1]}`} </option> 
                                                            })
                                                        }
                                                </select>
                                                {errors.bank && <div className="invalid-feedback">{errors.bank.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="brand">Marca</Label>
                                                <input
                                                    maxLength="50"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.brand ? ' is-invalid' : '')}
                                                    name="brand"
                                                    ref={register({
                                                        required: "El marca es requerida",
                                                    })}
                                                    defaultValue={terminal.brand}
                                                />
                                                {errors.brand && <div className="invalid-feedback">{errors.brand.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="model">Modelo</Label>
                                                <input
                                                    maxLength="50"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.model ? ' is-invalid' : '')}
                                                    name="model"
                                                    ref={register({
                                                        required: "El modelo es requerido",
                                                    })}
                                                    defaultValue={terminal.model}
                                                />
                                                {errors.model && <div className="invalid-feedback">{errors.model.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup>
                                        <Label for="description">Descripción</Label>
                                            <select 
                                                className={'form-control' + (errors.description ? ' is-invalid' : '')}
                                                name="description"
                                                defaultValue={terminal.description}
                                                ref={register({
                                                    required: "La descripción es requerida",
                                                })}>
                                                    <option key="" name="" value="">Seleccione la cuenta</option>
                                                    {
                                                        Object.entries(bankEnum.account).map((item) => {
                                                            return  <option key={item[1]} name={item[1]} value={item[1]}> {`${item[1]}`} </option> 
                                                        })
                                                    }
                                            </select>
                                            {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                    ref={register()}
                                                    defaultValue={terminal.comment}
                                                />
                                                {errors.comment && <div className="invalid-feedback">{errors.comment.message}</div>}
                                            </FormGroup>
                                    </FormGroup>
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

export default TerminalUpdatePage;