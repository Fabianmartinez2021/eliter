/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, productActions, userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Collapse, InputGroup, Input, InputGroupAddon, Spinner, Badge  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import '../../assets/css/table.css';
import '../../assets/css/options.css';
import moment from 'moment';
import { WeightProduct } from '../../helpers/weight'
import { currencyDollarActions } from '../../actions/currencyDollar.actions';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';


function CombosCreatePage() {

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
    const state = useSelector(state => state.currencyDollar || {});
    const { data } = state;

    // Obtener información del BCV
    const bcvData = data?.monitors?.bcv;

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        dispatch(currencyDollarActions.fetchCurrencyDollarData());
    }, [dispatch]);

   
    //Obtener toda la data necesaria para ventas
    const getting = useSelector(state => state.sales.getting);
    const sales = useSelector(state => state.sales);

    //Obtener monedas, productos y terminales de sucursal
    useEffect(() => {
        dispatch(salesActions.salesDataForm(user.agency.id));
    },[]);

    const [listCoin, setListCoin] = useState(null);
    const [listProducts, setListProducts] = useState(null);
    const [offerProducts, setOfferProducts] = useState(null);

    
  useEffect(() => {
    if (sales.obtained) {
        // Asignar los datos de `sales` a los estados correspondientes
        setListProducts(sales.data.products);
        setOfferProducts(sales.data.offers);
        setListCoin(sales.data.coins);
        
    }}, [sales.obtained])


    // useEffect(() => {
    //     if (sales.obtained) {
    //         // Asignar los datos de `sales` a los estados correspondientes
    //         setListProducts(sales.data.products);
    //         setOfferProducts(sales.data.offers);
    
    //         // Encontrar los objetos de 'Pesos' y 'Euro' dentro de sales.data.coins
    //         const pesosCoin = sales.data.coins?.find(coin => coin.name == "Euro");
    //         const eurosCoin = sales.data.coins?.find(coin => coin.name == "Pesos");
    
    //         // Inicializamos el array para las monedas actualizadas (solo USD)
    //         const updatedBcvCoins = [];
    
    //         if (bcvData) {
    //             // Actualizar USD usando los datos de `bcvData`
    //             const usdCoin = {
    //                 title: "USD",
    //                 value: bcvData.price,  // Usamos `price` del `bcvData` para USD
    //                 color: bcvData.color,
    //                 change: bcvData.change,
    //                 percent: bcvData.percent,
    //                 last_update: bcvData.last_update,
    //                 image: bcvData.image,
    //             };
    
    //             updatedBcvCoins.push(usdCoin);  // Añadimos solo el USD actualizado a la lista
    //         }
    
    //         // Combinar Pesos, Euro (sin cambios) con el USD actualizado
    //         const newCoinList = pesosCoin ? [...updatedBcvCoins, pesosCoin, eurosCoin] : [...updatedBcvCoins, eurosCoin];
    
    //         // Actualizar el estado de `listCoin`
    //         setListCoin(newCoinList);
    //     }
    // }, [sales.obtained, bcvData]);

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

	//obtener sucursales para select
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
  

    //Form Tabla
    const { handleSubmit, register, errors, reset, control } = useForm();
    //Form resgistrar venta
    const { handleSubmit:handleSubmitSale, register: registerSale , errors: errorsSale, reset:resetSale, control:controlSale, watch, setValue, clearErrors  } = useForm();

    const agencySaleWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencySaleWatch);
    
    //State de guardado
    const registering = useSelector(state => state.sales.registering);

    //Tabla de productos añadidos
    const [tableSale, setTableSale] = useState([]);
    //Total de los productos
    const [total, setTotal] = useState(0);
    //Total en peso de los productos
    const [totalWeight, setTotalWeight] = useState(0);

    //Modal genérico y mensaje
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    //Añadir producto a tabla
    const onCreateData = (data, e) => {

        //buscar codigo de producto para añadir
        let productFilter = listProducts.filter(item => item.code === data.code);

        if(productFilter.length == 0){
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        }else{

            //Obtener ofertas si existen
            var offer = null;
            if(offerProducts.length > 0){
                offer = offerProducts.find(item => {
                    return item.product.code === data.code
                })  
            }

            //tomar precio de oferta si existe sino, el precio normal
            let priceProduct = offer ? offer.price : productFilter[0].price;
           
            const target = {...productFilter[0]};
            const source = { 
                kg: parseFloat(data.kg), 
                price: priceProduct, 
                regularPrice: offer ? productFilter[0].price : 0,
                isOffer: offer ? true : false, 
                total: parseFloat(data.kg) * parseFloat(priceProduct) 
            };

             //Añadir al array de productos
            let preSale = tableSale;
            preSale.unshift(Object.assign(target, source));
            setTableSale(preSale);
            setTotal(0);
            setTotalWeight(0);//total de peso
            var sum = 0;
            var sumWeight = 0;
            preSale.map((product) => {
                sum += product.total;
                setTotal(sum);

                //buscar si el producto tiene un peso calcuado de bolsa
                const getWeight = WeightProduct.find(prod => prod.code == product.code);
                if(getWeight){
                    sumWeight += product.kg * getWeight.weight;
                }else{
                    sumWeight += product.kg;
                }
                setTotalWeight(sumWeight);
            })
            //focus en el codigo nuevamente
            codeRef.current.focus();
            //resetear form
            reset({
                code:'',
                kg:''
            });
        }

    };

    //Registrar venta
    const onRegisterSale = (data, e) => {
        //limpiar errores del form de producto
        reset();
        
        if(total == 0 || tableSale.length == 0){
            setModalMsg('Debe ingresar al menos un producto');
            setModalVisible(true);
            return;
        }

        
        data.user = user.id;
        data.userAgency = user.agency.id;
        data.items = tableSale;
        data.regularPrice = total;
        data.totalWeight = totalWeight;//total peso
        //enviar valores actuales de las monedas
        data.valueDollar = listCoin[0].value.toFixed(2);
        data.valueEur = listCoin[1].value.toFixed(2);
        data.valueCop = listCoin[2].value.toFixed(2);

        // Creacion del combo... Tipo 1... Vease el CombosRecord.model
        data.recordType = 1;

        // Se guarda la presentacion
        data.presentation = "Unidades";

        // En caso de que el combo sea únicamente para una de las sucursales
        if (data.agency){
            data.toAllAgencies = false;
        }else{
            data.agency = user.agency.id;
        }
       
        dispatch(productActions.createCombo( data ));
    };

    //Quitar elemento de la tabla
    const removeItem = (prod) => {

        let preSale = tableSale;
        const index = preSale.indexOf(prod);
        
        if (index !== -1) {
            preSale.splice(index, 1);
            setTableSale([...preSale])  
        }

        let sum = 0;
        var sumWeight = 0;
        preSale.map((product) => {
            sum = sum + parseFloat(product.total);
            setTotal(sum);

            //buscar si el producto tiene un peso calcuado de bolsa
            const getWeight = WeightProduct.find(prod => prod.code == product.code);
            if(getWeight){
                sumWeight += product.kg * getWeight.weight;
            }else{
                sumWeight += product.kg;
            }
            setTotalWeight(sumWeight);

        })

        if(preSale.length == 0){
            setTotal(0);
            setTotalWeight(0);
        }

    }

    //Función para limpiar pantalla
    const resetScreen = () =>{
        resetSale({ agency:'', code: '', name:'', price:''});
        setTotal(0);
        setTotalWeight(0);
        setTableSale([]);
    }

    
    const statusRegister = useSelector(state => state.products);
    
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(statusRegister.success){
            resetScreen();
        }
    },[statusRegister.success]);
    

    //Referencia código de producto
    const codeRef = useRef();

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
                                <div style={{marginBottom:20}}>
                                    {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    {listCoin && listCoin.length > 0 && (
                                    <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}> 
                                        {listCoin[0] && (
                                            <div style={{ fontSize: '0.9em' }}>
                                                Dólar a {' '}
                                                <b><NumberFormat value={listCoin[0].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                            </div>
                                        )}
                                        {listCoin[1] && (
                                            <div style={{ fontSize: '0.9em' }}>
                                                Euro a {' '}
                                                <b><NumberFormat value={listCoin[1].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                            </div>
                                        )}
                                        {listCoin[2] && (
                                            <div style={{ fontSize: '0.9em' }}>
                                                Pesos a {' '}
                                                <b><NumberFormat value={listCoin[2].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                </div>
                                <div className="d-flex justify-content-between" style={{marginBottom:10}}>  
                                    <h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Crear combo</h3>
                                </div>  
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
                                <Row form>
                                <Col md={3}>
                                        <FormGroup className="mr-3">
                                            <Label for="agency">Sucursal</Label>
                                            <select 
                                                className='form-control' 
                                                name="agency"
                                                ref={registerSale}>
                                                    <option key="" name="" value="">Todas las sucursales</option>
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
                                    <Col md={3}>
                                        <FormGroup>
                                            <Label for="code">Código</Label>
                                            <input
                                                type="text"
                                                maxLength={50}
                                                autoComplete="off"
                                                className={'form-control' + (errors.code ? ' is-invalid' : '')}
                                                name="code"
                                                ref={(e) => {
                                                    registerSale(e, {
                                                        required: "El código es requerido",
                                                        maxLength: { value: 50, message: "Máximo 50 caracteres" }
                                                    })
                                                }}
                                            />
                                            
                                            {errorsSale.code && <div className="invalid-feedback d-block">{errorsSale.code.message}</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={10}>
                                        <FormGroup>
                                            <Label for="name">Nombre</Label>
                                            <input
                                                autoComplete="off"
                                                ref={(e) => {
                                                    registerSale(e, { required: "El nombre es requerido" })
                                                }}className={'form-control' + (errors.name ? ' is-invalid' : '')}
                                                name="name"
                                            />
                                            {errorsSale.name && <div className="invalid-feedback d-block">{errorsSale.name.message}</div>}
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Form onSubmit={handleSubmit(onCreateData)} className="form" style={{border:'1px solid #dee2e6', padding: '10px 20px', borderRadius:'5px',
                                    marginBottom:'5px'}}>
                                    <Row form style={{marginTop:'12px'}}>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <input
                                                type="text"
                                                maxLength={50}
                                                autoComplete="off"
                                                className={'form-control' + (errors.code ? ' is-invalid' : '')}
                                                name="code"
                                                ref={(e) => {
                                                    codeRef.current = e;
                                                    register(e, {
                                                        required: "El código es requerido",
                                                        maxLength: { value: 50, message: "Máximo 50 caracteres" }
                                                    })
                                                }}
                                                placeholder="Código de producto"
                                            />
                                            {errors.code && <div className="invalid-feedback d-block">{errors.code.message}</div>}
                                        </FormGroup>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <Controller
                                                name="kg"
                                                control={control}
                                                rules={{
                                                    min: {
                                                        value: 0.001,
                                                        message: "El peso es requerido"
                                                    },
                                                    required: "El peso es requerido",
                                                }}
                                                as={<NumberFormat placeholder="Cantidad" className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                            />
                                            {errors.kg && <div className="invalid-feedback">{errors.kg.message}</div>}
                                        </FormGroup>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <Button color="primary" className="btn-round btn-icon" style={{marginTop:0}}>
                                                <i className="fa fa-plus"></i>
                                            </Button>
                                        </FormGroup>
                                    </Row>
                                </Form>
                                <Table striped responsive>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>kg/unidades</th>
                                            <th>Sub total</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableSale && tableSale.map((product, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{product.name}</td>
                                                    <td><NumberFormat value={ product.kg.toFixed(3) } displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                                    <td><NumberFormat value={ product.total.toFixed(2) } displayType={'text'} thousandSeparator={true} /></td>
                                                    <td>
                                                        <Button className="btn-link" color="primary" style={{margin:0, padding:0}}
                                                            onClick={e =>  { e.preventDefault(); removeItem(product) }}>
                                                            <i className="fa fa-times-circle"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                                )
                                            })
                                        }
                                    </tbody>
                                </Table>
                                <Row>
                                    <Col className="text-right" style={{ margin:0 }}>
                                        <div className="d-inline-flex" style={{padding: '5px 0px 10px 0px'}}>
                                            <div className="text-center" style={{border:'1px solid #00C853', borderRight:0, borderTopLeftRadius:'25px', borderBottomLeftRadius:'25px', padding:4}}>
                                                <b style={{fontSize:25, marginRight:10,  marginLeft:10}}>Total Peso: <NumberFormat value={ totalWeight.toFixed(3) } displayType={'text'} thousandSeparator={true} />{' '}Kg</b> 
                                            </div>
                                            <div className="text-center" style={{border:'1px solid #00C853', borderTopRightRadius:'25px', borderBottomRightRadius:'25px', padding:4}}>
                                                <b style={{fontSize:25, marginLeft:10,  marginRight:10}}>Total: <NumberFormat value={ total.toFixed(2) } displayType={'text'} thousandSeparator={true} />{' '}$</b> 
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <Form onSubmit={handleSubmitSale(onRegisterSale)}>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="price">Nuevo Monto</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    ref={(e) => {
                                                        registerSale(e, { required: "El monto es requerido" })
                                                    }}className={'form-control' + (errorsSale.price ? ' is-invalid' : '')}
                                                    name="price"
                                                />
                                                {errorsSale.price && <div className="invalid-feedback d-block">{errorsSale.price.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                        <Button color="primary" disabled={registering}>
                                                {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                Registrar
                                            </Button>{' '}
                                        </Col>
                                        <Col>
                                            <div  className="pull-right">
                                                <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Pago
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

export default CombosCreatePage;
