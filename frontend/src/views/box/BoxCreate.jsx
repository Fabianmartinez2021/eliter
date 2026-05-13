/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { boxActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Modal, Table  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function BoxCreatePage() {

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

    //obtener sucursales para select
    const gettingAgency = useSelector(state => state.agencies.getting);
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

    //Form Data
    const { handleSubmit, register, errors, reset, control, setValue, watch } = useForm();

    //Registrar data
    const onCreateData = (data, e) => {

        let values = [];
        let dataBs = { coin: 1, amount: data.bsValue };
        let dataDolar = { coin: 2, amount: data.dolarValue };
        let dataEur = { coin: 3, amount: data.eurValue };
        let dataCop = { coin: 4, amount: data.copValue };

        //crear array de valores 
        values.push(dataBs);
        values.push(dataDolar);
        values.push(dataEur);
        values.push(dataCop);
        data.values = values;

        if(user.role == 1){
            let productFilter = listAgencies.filter(item => item.id === data.agency);
            data.agencyName = productFilter[0].name;
        }
        if(user.role == 3){
            data.agencyName = user.agency.name;
        }
        data.user = user.id;
        //Si no es admin registrar en la agencia del usuario
        if(user.role !== 1){
            data.agency = user.agency.id;
        }
        setDataBox(data);
        setModalVisible(true);

    };

    const [dataBox, setDataBox] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    //State de guardado
    const registering = useSelector(state => state.box.registering);

    const saveOpening = () =>{
        //Aperturar caja
        dispatch(boxActions.boxOpening( dataBox ));
    }

    const box = useSelector(state => state.box);

    useEffect(() => {
        if(box.success){
            reset({
                bsValue:'',
                dolarValue:'',
                eurValue:'',
                copValue:'',
                agency:'',
            });
            setModalVisible(false);
        }else{
            setModalVisible(false);
        }
    },[box]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Apertura de caja</h3>
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
                                            <Label>Moneda</Label>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label for="bs">Bs</Label>
                                        </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                            <FormGroup>
                                                <Label for="bsValue">Monto</Label>
                                                <Controller
                                                    name="bsValue"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.bsValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.bsValue && <div className="invalid-feedback">{errors.bsValue.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                        <FormGroup>
                                             <Label for="bs">Dólar</Label>
                                        </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                        <FormGroup>
                                                <Controller
                                                    name="dolarValue"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.dolarValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.dolarValue && <div className="invalid-feedback">{errors.dolarValue.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="bs">Euro</Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                        <FormGroup>
                                                <Controller
                                                    name="eurValue"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.eurValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.eurValue && <div className="invalid-feedback">{errors.eurValue.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="bs">Pesos</Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                        <FormGroup>
                                                <Controller
                                                    name="copValue"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.copValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.copValue && <div className="invalid-feedback">{errors.copValue.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                     {/* Solo role admin */}
                                     {(user.role == 1) && <>
                                        <FormGroup>
                                            <Label for="agency">Sucursal</Label>{' '}
                                            {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
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
                                    </>
                                    }
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
                        <Modal toggle={() => {setModalVisible(false); setDataBox(null)}} isOpen={modalVisible}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                ¿Confirmar apertura de cuentas?
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setDataBox(null)}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
                                <Table striped responsive>
                                    <thead>
                                        <tr>
                                            <th>Sucursal</th>
                                            <th>Bs</th>
                                            <th>Dólar</th>
                                            <th>Euro</th>
                                            <th>Pesos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {(dataBox && dataBox.values.length > 0) && <tr>
                                        <td>{dataBox.agencyName}</td>
                                        <td><NumberFormat value={dataBox.values[0].amount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
                                        <td><NumberFormat value={ dataBox.values[1].amount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                        <td><NumberFormat value={dataBox.values[2].amount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
                                        <td><NumberFormat value={dataBox.values[3].amount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
                                    </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                            <div className="modal-footer">
                                <Button color="primary" disabled={registering} onClick={()=>saveOpening()}>
                                    {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    Confirmar
                                </Button>
                                <Button color="secondary" type="button" onClick={() => {setModalVisible(false);setDataBox(null);}} disabled={registering}>
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

export default BoxCreatePage;