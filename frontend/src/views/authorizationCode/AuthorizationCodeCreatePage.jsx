/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authorizationCodeActions, userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, ButtonGroup, Form, FormGroup, Label, Container, Alert, Modal  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { Role, history } from '../../helpers';
import NumberFormat from 'react-number-format';
import boxEnum from '../../enums/box.enum';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function AuthorizationCodeCreatePage() {

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
			id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
		}
	}

    //Form Data
    const { handleSubmit, register, errors, reset, setValue, watch, control } = useForm();
    //Registrar data
    const onCreateData = (data, e) => {

         data.usedAt = new Date();

        switch (codeType) {
            
            // Si es un código para realizar un retiro o gasto de caja
            case 1:
                data.isBoxWithdrawal = true;
                data.amount = parseFloat(data.amount.toString().replaceAll(/,/g, ''));

                dispatch(authorizationCodeActions.createBoxWithdrawalCode( getUserData(), data ));
                break;
            case 2:
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor2
                break;
            default:
                //Declaraciones ejecutadas cuando ninguno de los valores coincide con el valor de la expresión
                break;
          }
    };

    //State de guardado
    const registering = useSelector(state => state.authorizationCode.registering);

    //obtener sucursales para select
    const getting = useSelector(state => state.users.getting);
    const users = useSelector(state => state.users);
    useEffect(() => {
        dispatch(userActions.getListUserAgencies(getUserData()));
    },[]);

    const [listUsers, setListUsers] = useState(null);
    const [listAgencies, setListAgencies] = useState(null);
    
    useEffect(() => {
        if(users.obtained){
            setListUsers(users.list.users);
            setListAgencies(users.list.agencies);
        }
    },[users.obtained]);

    const authorizationCode = useSelector(state => state.authorizationCode);

    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(authorizationCode.success){            
            reset({ agency:'', role:'', amount:'', comment:'' });
            setFilteredListUsers([])

            setCodeData(authorizationCode.data)
        }
    },[authorizationCode.success]);
    

    const [filteredListUsers, setFilteredListUsers] = useState([]);

    const filterUsers = () => {
        let agency = watch("agency");
        let role = watch("role");

        if(agency && role){

            // Se filtra por agencia, rol y unicamente usuarios activos
            const newList = listUsers.filter((item) => {

                return ( (item.status === 1)  && ( item.role == role) && (item.agency.id == agency))
            })
            
            setFilteredListUsers(newList)
        }
        else{
            setFilteredListUsers([])
        }
    }
    
	// MODAL DE VISUALIZACIÓN DEL CÓDIGO
	const [codeDataModalOpen, setCodeDataModalOpen] = useState(false);
	const [codeData, setCodeData] = useState(null);
    
    useEffect(() => {
        if(codeData){
            setCodeDataModalOpen(true)
        }
    },[codeData]);
	
	const cleanDeleteData = () => {
		setCodeDataModalOpen(false);
		setCodeData(null);
	}


    // VARIABLES PARA EL CAMBIO ENTRE LOS TIPOS DE CÓDIGO
    const [codeType, setCodeType] = useState(1);


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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Generar código de autorización</h3>
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
                                
                                {/* Botones */}
                                <div className="filter">
                                    <ButtonGroup className="mr-5">
                                        <Button
                                            color="primary"
                                            outline={codeType !== 1}
                                            onClick={() => setCodeType(1)}
                                            active={codeType === 1}
                                            disabled={registering}
                                            >
                                            Retiro de caja
                                        </Button>
                                        <Button
                                            color="primary"
                                            outline={codeType !== 2}
                                            onClick={() =>  setCodeType(2)}
                                            active={codeType === 2}
                                            disabled={true || registering}
                                            >
                                            Otro código
                                        </Button>
                                    </ButtonGroup>
                                </div>
                       
                                <Form onSubmit={handleSubmit(onCreateData)} className="form">  
                                    <h4 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Datos del usuario a ser autorizado</h4>
                                    <div className='filter'>
                                    <Row form>
                                        <Col md={6}> 
                                            <FormGroup> 
                                                <Label for="agency">Sucursal</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select 
                                                    className={'form-control' + (errors.agency ? ' is-invalid' : '')} 
                                                    name="agency"
                                                    onChange={filterUsers}
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
                                        <Col md={6}>
                                        <FormGroup> 
                                                <Label for="agency">Cargo</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select 
                                                    className={'form-control' + (errors.rol ? ' is-invalid' : '')} 
                                                    name="role"
                                                    onChange={filterUsers}
                                                    ref={register({ 
                                                            required: "El rol es requerido" 
                                                        })}>
                                                        <option key="0" name="0" value=""></option>
                                                        <option key="1" name="1" value="1">Administrador</option>
                                                        <option key="2" name="2" value="2">Supervisor</option>
                                                        <option key="3" name="3" value="3">Gerente</option>
                                                        <option key="4" name="4" value="4">Cajero</option>
                                                        <option key="5" name="5" value="5">Cobranzas</option>
                                                        <option key="6" name="6" value="6">Auditor de inventarios</option>
                                                        <option key="7" name="7" value="7">Televentas</option>
                                                </select>
                                                {errors.role && <div className="invalid-feedback d-block">{errors.role.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}> 
                                            <FormGroup>
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select 
                                                    className={'form-control' + (errors.authorizedUser ? ' is-invalid' : '')} 
                                                    name="authorizedUser"
                                                    ref={register({ 
                                                            required: "El usuario es requerido" 
                                                        })}>
                                                            <option key="" name="" value="">Seleccione usuario</option>
                                                            {filteredListUsers && filteredListUsers.map(list => 
                                                                <option
                                                                    key={list.id}
                                                                    name={list.id}
                                                                    value={list.id}>
                                                                        {`${list.firstName} ${list.lastName}`}
                                                                </option>
                                                            )}
                                                </select>
                                                {errors.authorizedUser && <div className="invalid-feedback d-block">{errors.authorizedUser.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        </Col>
                                    </Row>
                                    </div>


                                    {/* Retiro de caja */}
                                    {   codeType === 1  && <>
                                        <h4 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Datos del retiro</h4>
                                        <div className='filter'>
                                            <Row form>
                                                <Col md={6}>  
                                                    <FormGroup>
                                                        <Label for="authorization">Autorizado por:</Label>{' '}
                                                        <select className={'form-control' + (errors.type ? ' is-invalid' : '')} 
                                                            name="authorization"
                                                            ref={register({ 
                                                                    required: "Debe escribir quién lo autorizó" 
                                                                })}>
                                                                <option key="baltazar" value="Baltazar">Baltazar</option>
                                                        </select>
                                                        {errors.authorization && <div className="invalid-feedback d-block">{errors.authorization.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <Row form>
                                                <Col md={6}>  
                                                    <FormGroup>
                                                        <Label for="amount">Monto a autorizar</Label>
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
                                                        <Label for="coin">Moneda a autorizar</Label>{' '}
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
                                                        <Label for="type">Tipo</Label>{' '}
                                                        <select className={'form-control' + (errors.type ? ' is-invalid' : '')} name="type"
                                                            ref={register({ 
                                                                    required: "La tipo de egreso es requerido" 
                                                                })}>
                                                                <option key="0" name="" value=""></option>
                                                                <option key="1" name="1" value={boxEnum.types.withdrawal}>Retiro</option>
                                                                <option key="2" name="2" value={boxEnum.types.spending}>Gasto</option>
                                                        </select>
                                                        {errors.type && <div className="invalid-feedback d-block">{errors.type.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </div>
                                    </>
                                    }

                                    {/* Otra posible funcionalidad */}
                                    {   codeType === 2 && <>
                                        {/*<h4 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Otra posible funcionalidad</h4>
                                        <div className='filter'>
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
                                        </div>*/}
                                    </>
                                    }

                                    
                                    <h4 style={{ fontWeight:'bold',fontStyle: 'italic'}}></h4>
                                    <div className='filter'>
                                    <Row form>
                                        <Col md={12}>
						 					<FormGroup>
												<Label for="comment">Comentario</Label>
                                                <textarea
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                    placeholder={'Ingrese la descripción de para qué es el código'}
                                                    ref={register({ 
                                                        required: "El comentario es requerido" 
                                                    })}
                                                    rows="10" cols="50"
                                                />
                                                 {errors.comment && <div className="invalid-feedback d-block">{errors.comment.message}</div>}
											</FormGroup>
                                        </Col>
                                    </Row>
                                    </div>
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
						{/* Modal de confirmación de eliminación del código */}
						<Modal toggle={() => { cleanDeleteData() }} isOpen={codeDataModalOpen}>
							<div className="modal-header">
							<h5 className="modal-title" id="examplemodalMsgLabel">
								Código generado
							</h5>
							<button
								aria-label="Close"
								className="close"
								type="button"
								onClick={() =>  { cleanDeleteData() }}
							>
								<span aria-hidden={true}>×</span>
							</button>
							</div>
							<div className="modal-body">
                                
                                { codeData && <>
                                    <p> Usuario Asignado: <strong className="font-weight-bold">{codeData.authorizedUser.firstName + ' ' +  codeData.authorizedUser.lastName}</strong></p>
                                    <p> Agencia: <strong className="font-weight-bold">{codeData.agency.name}</strong></p>
                                    <p> Código: <strong className="font-weight-bold">{codeData.code}</strong></p>
                                </> 
                                }
								<div className="d-flex justify-content-center">
									<Button color="primary" type="button" onClick={() =>  { cleanDeleteData()}} >
										Aceptar
									</Button>
								</div>
							</div>
						</Modal>
                    </div>

				</div>
            </div>
        </>
    );
}

export default AuthorizationCodeCreatePage;