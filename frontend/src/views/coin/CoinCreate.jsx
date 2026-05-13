/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { coinActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';

function CoinCreatePage() {

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
    const { handleSubmit, register, errors, reset, control } = useForm();

    //Registrar data
    const onCreateData = (data, e) => {

        let values = []
        let dataDolar = {name:data.dolar, value:data.dolarValue};
        let dataEur = {name:data.eur, value:data.eurValue}
        let dataCop = {name:data.cop, value:data.copValue}
        //crear array de valores 
        values.push(dataDolar);
        values.push(dataEur);
        values.push(dataCop);
        data.values = values;

        
        dispatch(coinActions.createCoin( data, user ));
    };

    //State de guardado
    const registering = useSelector(state => state.coin.registering);

    //obtener monedas para colocar valor actual
    const getting = useSelector(state => state.coin.getting);
    const coin = useSelector(state => state.coin);
    
    useEffect(() => {
        dispatch(coinActions.listCoins());
    },[]);

    const [listCoin, setListCoin] = useState(null);

    useEffect(() => {
        if(coin.obtained){
            setListCoin(coin.list);
        }
    },[coin.obtained]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Monedas</h3>
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
                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                {listCoin && 
                                <Form onSubmit={handleSubmit(onCreateData)} className="form">
                                    <Row form>
                                        <Col md={4}>
                                        <FormGroup>
                                            <Label for="dolar">Moneda</Label>
                                            <input
                                                maxLength="20"
                                                autoComplete="off"
                                                className={'form-control' + (errors.dolar ? ' is-invalid' : '')}
                                                name="dolar"
                                                ref={register}
                                                defaultValue="Dólar"
                                                readOnly={ true }
                                                className="form-control-plaintext"
                                            />
                                        </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                        <FormGroup>
                                                <Label for="dolarValue">Valor</Label>
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
                                                    defaultValue={listCoin.length>0 ? listCoin[0].value : ''}
                                                    as={<NumberFormat className={'form-control' + (errors.dolarValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.dolarValue && <div className="invalid-feedback">{errors.dolarValue.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                        <FormGroup>
                                            <input
                                                maxLength="20"
                                                autoComplete="off"
                                                className={'form-control' + (errors.eur ? ' is-invalid' : '')}
                                                name="eur"
                                                ref={register}
                                                defaultValue="Euro"
                                                readOnly={ true }
                                                className="form-control-plaintext"
                                            />
                                        </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                        <FormGroup>
                                                <Controller
                                                    name="eurValue"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 1,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    defaultValue={listCoin.length>0 ? listCoin[1].value : ''}
                                                    as={<NumberFormat className={'form-control' + (errors.eurValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.eurValue && <div className="invalid-feedback">{errors.eurValue.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                        <FormGroup>
                                            <input
                                                maxLength="20"
                                                autoComplete="off"
                                                className={'form-control' + (errors.cop ? ' is-invalid' : '')}
                                                name="cop"
                                                ref={register}
                                                defaultValue="Pesos"
                                                readOnly={ true }
                                                className="form-control-plaintext"
                                            />
                                        </FormGroup>
                                        </Col>
                                        <Col md={8}>
                                        <FormGroup>
                                                <Controller
                                                    name="copValue"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: "",
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    defaultValue={listCoin.length>0 ? listCoin[2].value : ''}
                                                    as={<NumberFormat className={'form-control' + (errors.copValue ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.copValue && <div className="invalid-feedback">{errors.copValue.message}</div>}
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

export default CoinCreatePage;