/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resguardActions, userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Modal, Table  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';

function ResguardAddPage() {

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

    //obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

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
    const { handleSubmit, register, errors, reset, control, watch } = useForm({
        defaultValues: {
          amountBs: '',
          amountBsDescription: '',
          amountDollar: '',
          amountDollarDescription: '',
          amountEur: '',
          amountEurDescription: '',
          amountCop: '',
          amountCopDescription: '',
        }
      });

    //State de guardado
    const loading = useSelector(state => state.resguard.loading);

    const [dataResguard, setDataResguard] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    //Registrar data
    const onCreateData = (data, e) => {

        data.agency = user.agency.id;
        data.user = user.id;

        // Se le remueven los prefijos a las monedas
        data.amountBs = data.amountBs.replace('Bs ', '');
        data.amountDollar = data.amountDollar.replace('$ ', '');
        data.amountEur = data.amountEur.replace('Eur ', '');
        data.amountCop = data.amountCop.replace('Cop ', '');

        setDataResguard(data);
        setModalVisible(true);
    };
    

    //Luego de confirmar el cierre
    const saveOpening = () =>{
        dispatch(resguardActions.resguardAdd( getUserData(), dataResguard ));
    }

    const resguard = useSelector(state => state.resguard);

    useEffect(() => {
        if(resguard.success){
            reset({
                amountBs: '',
                amountBsDescription: '',
                amountDollar: '',
                amountDollarDescription: '',
                amountEur: '',
                amountEurDescription: '',
                amountCop: '',
                amountCopDescription: '',
            });
            setModalVisible(false);
        }else{
            setModalVisible(false);
        }
    },[resguard]);
    
    let amountBs = watch("amountBs");
    let amountDollar = watch("amountDollar");
    let amountEur = watch("amountEur");
    let amountCop = watch("amountCop");

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Ingreso de dinero a resguardo</h3>
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
                                        <Col md={5}>  
                                            <FormGroup>
                                                <Label for="amountBs">Cantidad de BOLIVARES</Label>
                                                <Controller
                                                    name="amountBs"
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (Number(value.replaceAll(',', '').replace('Bs ', '')) < 0){
                                                                return "El valor es debe ser mayor o igual a cero";
                                                            }
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountBs ? ' is-invalid' : '')} thousandSeparator={true} prefix='Bs '/>}
                                                />
                                                {errors.amountBs && <div className="invalid-feedback">{errors.amountBs.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountBsDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountBsDescription ? ' is-invalid' : '')}
                                                    name="amountBsDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountBs === 'Bs 0') ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountBsDescription && <div className="invalid-feedback d-block">{errors.amountBsDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label for="amountDollar">Cantidad de DÓLARES</Label>
                                                <Controller
                                                    name="amountDollar"
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (Number(value.replaceAll(',', '').replace('$ ', '')) < 0){
                                                                return "El valor es debe ser mayor o igual a cero";
                                                            }
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountDollar ? ' is-invalid' : '')} thousandSeparator={true} prefix='$ ' />}
                                                />
                                                {errors.amountDollar && <div className="invalid-feedback">{errors.amountDollar.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountDollarDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountDollarDescription ? ' is-invalid' : '')}
                                                    name="amountDollarDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountDollar === '$ 0') ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountDollarDescription && <div className="invalid-feedback d-block">{errors.amountDollarDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}> 
                                            <FormGroup>
                                                <Label for="amountEur">Cantidad de EUROS</Label>
                                                <Controller
                                                    name="amountEur"
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (Number(value.replaceAll(',', '').replace('Eur ', '')) < 0){
                                                                return "El valor es debe ser mayor o igual a cero";
                                                            }
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountEur ? ' is-invalid' : '')} thousandSeparator={true} prefix='Eur ' />}
                                                />
                                                {errors.amountEur && <div className="invalid-feedback">{errors.amountEur.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountEurDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountEurDescription ? ' is-invalid' : '')}
                                                    name="amountEurDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountEur === 'Eur 0') ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountEurDescription && <div className="invalid-feedback d-block">{errors.amountEurDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={5}>
                                            <FormGroup>
                                                <Label for="amountCop">Cantidad de PESOS</Label>
                                                <Controller
                                                    name="amountCop"
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (Number(value.replaceAll(',', '').replace('Cop ', '')) < 0){
                                                                return "El valor es debe ser mayor o igual a cero";
                                                            }
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amountCop ? ' is-invalid' : '')} thousandSeparator={true} prefix='Cop ' />}
                                                />
                                                {errors.amountCop && <div className="invalid-feedback">{errors.amountCop.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={7}>
                                            <FormGroup>
                                                <Label for="amountCopDescription">Descripción</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.amountCopDescription ? ' is-invalid' : '')}
                                                    name="amountCopDescription"
                                                    placeholder={"Ingrese la denominación de los billetes"}
                                                    ref={register({ 
                                                        validate: (value) => { 
                                                            return (!!value.trim() || amountCop === 'Cop 0') ? true : "Debe colocar la denominacion si aplica" 
                                                        },
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.amountCopDescription && <div className="invalid-feedback d-block">{errors.amountCopDescription.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>  
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    maxLength="150"
                                                    autoComplete="off"
                                                    className={'form-control'}
                                                    name="comment"
                                                    ref={register}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={loading}>
                                            {loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Guardar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => {setModalVisible(false); setDataResguard(null)}} isOpen={modalVisible} className={"modal-lg"}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                ¿Confirmar ingreso de dinero a resguardo?
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setDataResguard(null)}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
                                <Table striped responsive>
                                    <thead>
                                        <tr>
                                            <th>Bolívares</th>
                                            <th>Dólares</th>
                                            <th>Euros</th>
                                            <th>Pesos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {dataResguard && <tr>
                                        <td><NumberFormat value={dataResguard.amountBs} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' /></td>
                                        <td><NumberFormat value={dataResguard.amountDollar} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' /></td>
                                        <td><NumberFormat value={dataResguard.amountEur} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Eur ' /></td>
                                        <td><NumberFormat value={dataResguard.amountCop} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Cop ' /></td>                                        
                                    </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                            <div className="modal-footer">
                                <Button color="primary" disabled={loading} onClick={()=>saveOpening()}>
                                    {loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    Confirmar
                                </Button>
                                <Button color="secondary" type="button" onClick={() => {setModalVisible(false);setDataResguard(null);}} disabled={loading}>
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

export default ResguardAddPage;