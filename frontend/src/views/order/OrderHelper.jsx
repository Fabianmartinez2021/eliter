/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { agencyActions, productActions, orderActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert  } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { Role, history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function OrderHelperPage() {

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
    const { handleSubmit, register, errors, control, reset, setValue, watch } = useForm();
    
    // REGISTRAR DATA
    const onCreateData = (data, e) => {
        dispatch(orderActions.setOrderHelper( getUserData(), data ));
    };

    // OBTENER SUCURSALES PARA EL SELECT
    const gettingAgencies = useSelector(state => state.agencies.getting);
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


    // OBTENER PRODUCTOS    
    const products = useSelector(state => state.products);

    useEffect(() => {
        dispatch(productActions.dataTable());
    },[]);

    const [productsList, setProductsList] = useState([]);

    useEffect(() => {

        if(products.data){

            const sortByProductCode = (itemA, itemB) => {
                const a = String(itemA?.code ?? '').trim();
                const b = String(itemB?.code ?? '').trim();
                const na = parseInt(a, 10);
                const nb = parseInt(b, 10);
                if (!isNaN(na) && !isNaN(nb) && a === String(na) && b === String(nb)) return na - nb;
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            };
            const sorted = products.data.results.slice().sort(sortByProductCode);

            setProductsList(sorted);
        }
    },[products.obtained]);


    // OBTENER TODAS LAS LISTAS DE AYUDA PARA LOS PEDIDOS
    const order = useSelector(state => state.order);

    useEffect(() => {
        dispatch(orderActions.getOrderHelper());
    },[]);

    const [orderHelperList, setOrderHelperList] = useState([]);
   
    useEffect(() => {
        if(order.orderHelperList){
            setOrderHelperList(order.orderHelperList);
        }
    },[order.getting]);


    // FUNCIÓN PARA FILTRAR POR SUCURSAL

    // Con esta variable se obliga re-renderizar la tabla de valores para que aplique entonces el defaultValue
    const [showTable, setShowTable] = useState(true);

    const filterByAgency = (e) => {

        let agencyId = e ? e.target.value : '';

        let filteredArray = orderHelperList.find( item => item.agency == agencyId );
        
        if (!filteredArray){
            
            setValue('orderType', '');

            for(var key in productsList){

                productsList[key].kg = 0;
            }
        }
        else{
            
            setValue('orderType', filteredArray.orderType);
            
            // Se comienza a crear cada producto
            for(var key in productsList){

                let productToMatch = filteredArray.products.find( item => item.product === productsList[key].id);

                productsList[key].kg = productToMatch.quantity;
            }
        }      

        setProductsList(productsList);
        
        // Se esconde la tabla para posteriormente volverla a renderizar y así aplique el defaultValue
        setShowTable(false)
    }

    useEffect(() => {
        setShowTable(true)
    },[showTable]);


    //Verificar si guardo y limpiar form 
    useEffect(() => {
        if(order.success){
            reset();
            setValue('agency', '');
            setValue('orderType', '');
            filterByAgency();
            dispatch(orderActions.getOrderHelper());
        }
    },[order.setting]);



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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Ayuda para los pedidos</h3>
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
                                        <Col md={6}> 
                                            <FormGroup> 
                                                <Label for="agency">Sucursal</Label>{' '}
                                                {gettingAgencies && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <select 
                                                    className={'form-control' + (errors.agency ? ' is-invalid' : '')} 
                                                    name="agency"
                                                    ref={register({ 
                                                            required: "La sucursal es requerida" 
                                                        })}
                                                    onChange={filterByAgency}
                                                        
                                                        >
                                                        <option key="" name="" value="">Seleccione sucursal</option>
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
                                                <Label for="orderType">Tipo de pedido</Label>
                                                <select 
                                                    className={'form-control' + (errors.orderType ? ' is-invalid' : '')} 
                                                    name="orderType"
                                                    ref={register({ 
                                                            required: "El tipo es requerido" 
                                                        })}>
                                                        <option key="0" name="0" value="">Seleccione el tipo</option>
                                                        <option key="1" name="1" value="1">Regular</option>
                                                        <option key="2" name="2" value="2">Semanal</option>
                                                        <option key="3" name="3" value="3">Quincenal</option>
                                                </select>
                                                {errors.orderType && <div className="invalid-feedback d-block">{errors.orderType.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <h4 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Ingreso de los valores a recomendados</h4>
                                    </Row>

									<Row style={{marginBottom: "0.5rem"}}>
										<Col md={2}>
                                            <h5 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Código</h5>
										</Col>
										<Col md={6}>
                                            <h5 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Nombre</h5>
										</Col>
										<Col md={3}>
                                            <h5 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Cantidad</h5>
										</Col>
                                    </Row>

                                    {(showTable && (productsList.length > 0)) && productsList.map((item, index) => (
                                        <Row form key={item.code} style={{marginBottom: "1rem"}}>
                                            <Col md={2} style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                                                <FormGroup style={{margin: "0"}}>
                                                    <Label for="code" style={{margin: "0"}}>
                                                        <b>{item.code}</b>
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                            <Col md={6} style={{display: "flex", alignItems: "center"}}>
                                                <FormGroup style={{margin: "0"}}>
                                                    <Label for="name" style={{margin: "0"}}>
                                                        <b>{item.name}</b>
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                            <Col md={3} style={{marginLeft: "11px", display: "flex", alignItems: "center"}}>
                                                <FormGroup style={{margin: "0"}}>
                                                    <Controller
                                                            name={`products.${item.code}`}
                                                            control={control}
                                                            placeholder={"Ingrese cantidad"} 
                                                            value={ (item && item.kg) ? item.kg.toFixed(2) : 0}
                                                            defaultValue={ (item && item.kg) ? item.kg.toFixed(2) : 0}
                                                            rules={{
                                                                min: {
                                                                    value: 0,
                                                                    message: "El monto es requerido"
                                                                },
                                                                required: "El monto es requerido",
                                                            }}
                                                            as={<NumberFormat className={'form-control' + (errors.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                        />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    ))}

                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={(gettingAgencies || order.getting || order.setting)}>
                                            {(gettingAgencies || order.getting || order.setting) && <span className="spinner-border spinner-border-sm mr-1"></span>}
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

export default OrderHelperPage;