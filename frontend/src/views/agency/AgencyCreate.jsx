/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { agencyActions, terminalActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Modal  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

// Lista de empresas
const companies = [
    "EMBUTIDOS FATTORIA",
    "Principal",
    "EMBUTIDOS MOHAN",
    "DELICATESES EMMANUEL",
    "DELICATESES MOMOY",
    "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];


function AgencyCreatePage() {

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
    const { handleSubmit, register, errors, reset, control } = useForm();

    //Registrar data
    const onCreateData = (data, e) => {
        setDataTerminal(data.terminal);
        dispatch(agencyActions.createAgency( data ));
    };

    //State de guardado
    const registering = useSelector(state => state.agencies.registering);

    //terminales para guardar
    const [dataTerminal, setDataTerminal] = useState([]);

    //obtener terminales para multiselect
    const getting = useSelector(state => state.terminal.getting);
    const terminals = useSelector(state => state.terminal);
    useEffect(() => {
        dispatch(terminalActions.listUnused());
    },[]);

    const [listTerminals, setListTerminals] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');
    useEffect(() => {
        if(terminals.obtained){
            setListTerminals(terminals.list);
            if(terminals.list.length == 0){
                setModalVisible(true);
                setModalMsg('Debe ingresar terminales para para poder registrar sucursal');
            }
        }
    },[terminals.obtained]);

    const TypeAhead = useRef(null);
    const agencies = useSelector(state => state.agencies);
    //Actualizar estado de terminal al cambio de información
    useEffect(() => {
        if (agencies.success) {
            //quitar de la lista de terminales las guardadas
            const result = listTerminals.filter((elem) => !dataTerminal.find(({ id }) => elem.id === id));
            setListTerminals(result);
            setDataTerminal([]);
    
            reset({
                name: '',
                phone: '',
                address: '',
                company:'',
                rif: '',
                terminal: ''
            });
    
            // limpiar typeahead solo si TypeAhead.current no es null
            if (TypeAhead.current) {
                TypeAhead.current.clear();
            }
        }
    }, [agencies.success]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Añadir sucursal</h3>
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
                                        <Col md={4}>
                                        <FormGroup>
                                            <Label for="name">Nombre</Label>
                                            <input
                                                maxLength="20"
                                                autoComplete="off"
                                                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                                                name="name"
                                                ref={register({
                                                    required: "El nombre es requerido",
                                                })}
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                        <FormGroup>
                                            <Label for="company">Empresa</Label>
                                            <select
                                                name="company"
                                                ref={register({ required: "Seleccione una empresa" })}
                                                className={`form-control ${errors.company ? "is-invalid" : ""}`}
                                                style={{ width: '100%',}}
                                            >
                                                <option value="">Seleccione una empresa</option>
                                                {companies.map(company => (
                                                    <option key={company} value={company}>{company}</option>
                                                ))}
                                            </select>
                                            {errors.company && <div className="invalid-feedback">{errors.company.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                        <FormGroup>
                                            <Label for="rif">RIF</Label>
                                            <input
                                                type="text"
                                                maxLength="50"
                                                autoComplete="off"
                                                className={'form-control' + (errors.rif ? ' is-invalid' : '')}
                                                name="rif"
                                                ref={register}
                                            />
                                            {errors.rif && <div className="invalid-feedback">{errors.rif.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="attendant">Nombre del encargado</Label>
                                            <input
                                                maxLength="100"
                                                autoComplete="off"
                                                className={'form-control' + (errors.attendant ? ' is-invalid' : '')}
                                                name="attendant"
                                                ref={register({
                                                    required: "El encargado es requerido",
                                                })}
                                            />
                                            {errors.attendant && <div className="invalid-feedback">{errors.attendant.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="attendant">Numero de telefono</Label>
                                            <input
                                                maxLength="1000000"
                                                autoComplete="off"
                                                className={'form-control' + (errors.phone ? ' is-invalid' : '')}
                                                name="phone"
                                                ref={register({
                                                    required: "El numero de telefono es requerido",
                                                })}
                                            />
                                            {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup>
                                        <Label for="address">Dirección</Label>
                                        <input
                                            maxLength="250"
                                            autoComplete="off"
                                            className={'form-control' + (errors.address ? ' is-invalid' : '')}
                                            name="address"
                                            ref={register({
                                                required: "El dirección es requerida"
                                            })}
                                        />
                                        {errors.address && <div className="invalid-feedback">{errors.address.message}</div>}
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="terminal">Terminales</Label>
                                        {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                        <Controller
                                            name="terminal"
                                            control={control}
                                            rules={{
                                                required: "Seleccione al menos una terminal",
                                                validate: terminal => {
                                                    return Array.isArray(terminal) && terminal.length > 0;
                                                }
                                            }}
                                            as={
                                                <Typeahead
                                                    ref={TypeAhead}
                                                    isInvalid={errors.terminal ? true:false}
                                                    id="matter-select"
                                                    labelKey={option => `${option.code} - ${option.serial}`}
                                                    multiple
                                                    name="terminal"
                                                    options={listTerminals}
                                                    placeholder="Seleccione terminales"  
                                                    emptyLabel="No hay resultados"
                                                />
                                            }
                                        />
                                        {errors.terminal && <div className="invalid-feedback d-block">Seleccione al menos una terminal</div>}
                                    </FormGroup> 
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
                        <Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Inventario
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
                                <p>{modalMsg}</p>
                            </div>
                            <div className="modal-footer">
                            <Button
                                color="secondary"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
                            >
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

export default AgencyCreatePage;