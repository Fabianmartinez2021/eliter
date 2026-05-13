/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { boxActions, userActions } from '../../actions';
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


function BoxWithdrawalPage() {

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
    const { handleSubmit, register, errors, reset, control, setValue, watch } = useForm();

    //Registrar data
    const onCreateData = (data, e) => {

        // Se almacena la agencia del usuario en caso de que no coloque nada en el filtro
        if (!data.agency){
            data.agencyName = user.agency.name;
            data.agency = user.agency.id;
        }
        else{
            data.agencyName = listAgencies.filter(item => item.id === data.agency)[0].name;
        }

        data.user = user.id;
        let coinDes = [
            '','Bs','Dólar','Euro','Pesos'
        ]

        data.coinDes = coinDes[data.coin];

        setDataBox(data);
        setModalVisible(true);
    };

    const [dataBox, setDataBox] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    //State de guardado
    const withdrawing = useSelector(state => state.box.withdrawing);

    const saveOpening = () =>{
        //Retirar de caja

        dispatch(boxActions.boxAdd( dataBox ));
    }

    const box = useSelector(state => state.box);

    useEffect(() => {
        if(box.success){
            reset({
                amount:'',
                comment:'',
                coin:'',
            });
            setModalVisible(false);
        }else{
            setModalVisible(false);
        }
    },[box]);


    //obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}
    
	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	},[]);

	const [listAgencies, setListAgencies] = useState(null);

	useEffect(() => {
		if(users.obtained){
			setListAgencies(users.list.agencies);
		}
	},[users.obtained]);


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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Ingreso de dinero a caja</h3>
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
                                    
                                    {( user.role == 1 || user.role == 2) && 
                                        <Row form>
                                            <Col md={6}>
                                                <FormGroup className="mr-3">
                                                    { getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    <select className='form-control' name="agency"
                                                        ref={register}>
                                                            <option key="" name="" value="">Seleccione sucursal</option>
                                                            {listAgencies && listAgencies.map(list => 
                                                                <option
                                                                    key={list.id}
                                                                    name={list.id}
                                                                    value={list.id}>
                                                                    {`${list.name}`}
                                                                </option>
                                                            )}
                                                        </select>
                                                    </FormGroup>
                                            </Col>   
                                        </Row>
                                    }
                                    <Row form>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="username">Monto</Label>
                                                <Controller
                                                    name="amount"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 1,
                                                            message: "El valor es requerido"
                                                        },
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.amount ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.amount && <div className="invalid-feedback">{errors.amount.message}</div>}
                                            </FormGroup>
                                        </Col> 
                                        <Col md={6}> 
                                            <FormGroup>
                                                <Label for="coin">Divisa</Label>{' '}
                                                <select className={'form-control' + (errors.rol ? ' is-invalid' : '')} name="coin"
                                                    ref={register({ 
                                                            required: "La divisa es requerida" 
                                                        })}>
                                                        <option key="0" name="" value=""></option>
                                                        <option key="1" name="1" value="1">Bs</option>
                                                        <option key="2" name="2" value="2">Dólar</option>
                                                        <option key="3" name="3" value="3">Euro</option>
                                                        <option key="5" name="4" value="4">Pesos</option>
                                                </select>
                                                {errors.coin && <div className="invalid-feedback d-block">{errors.coin.message}</div>}
                                            </FormGroup>
                                        </Col>   
                                    </Row>
                                    <Row form>
                                        <Col md={12}>  
                                            <FormGroup>
                                                <Label for="comment">Comentarios</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                    placeholder={"Indicar detalladamente el concepto del ingreso del dinero y la procedencia"}
                                                    ref={register({ 
                                                        required: "El comentario es requerido" 
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.comment && <div className="invalid-feedback d-block">{errors.comment.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={withdrawing}>
                                            {withdrawing && <span className="spinner-border spinner-border-sm mr-1"></span>}
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
                                ¿Confirmar ingreso de dinero a caja?
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
                                            <th>Monto</th>
                                            <th>Divisa</th>
                                            <th>Comentarios</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {dataBox && <tr>
                                        <td>{dataBox.agencyName}</td>
                                        <td><NumberFormat value={dataBox.amount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
                                        <td>{dataBox.coinDes}</td>
                                        <td>
                                            <span className="d-inline-block text-truncate" style={{maxWidth:80}}>
                                                {dataBox.comment}
                                            </span>
                                        </td>
                                        
                                    </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                            <div className="modal-footer">
                                <Button color="primary" disabled={withdrawing} onClick={()=>saveOpening()}>
                                    {withdrawing && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    Confirmar
                                </Button>
                                <Button color="secondary" type="button" onClick={() => {setModalVisible(false);setDataBox(null);}} disabled={withdrawing}>
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

export default BoxWithdrawalPage;