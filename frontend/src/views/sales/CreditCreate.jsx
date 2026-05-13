/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import '../../assets/css/table.css';
import '../../assets/css/options.css';
import { WeightProduct } from '../../helpers/weight'
//Componente filtro
import { Typeahead, withAsync } from 'react-bootstrap-typeahead';

const AsyncTypeahead = withAsync(Typeahead);

function SalesCreatePage() {

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
        if(sales.obtained){
            setListCoin(sales.data.coins);
            setListProducts(sales.data.products);
            setOfferProducts(sales.data.offers);
        }
    },[sales.obtained]);
  
    //Form Tabla
    const { handleSubmit, register, errors, reset, control } = useForm();
    //Form resgistrar venta
    const { handleSubmit:handleSubmitSale, register: registerSale , errors: errorsSale, reset:resetSale, control:controlSale, watch, setValue, clearErrors  } = useForm();

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
                //setear por defecto el total en punto
                setValue('pAmmount', sum.toFixed(2));
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
        data.agency = user.agency.id;
        data.items = tableSale;
        data.total = total;
        data.totalWeight = totalWeight;//total peso
        //enviar valores actuales de las monedas
        data.valueDollar = listCoin[0].value.toFixed(2);
        data.valueEur = listCoin[1].value.toFixed(2);
        data.valueCop = listCoin[2].value.toFixed(2);

        //Tipo credito
        data.type = 1;
        data.credit = total;
        //limpiar banco en tra
        if(data.tAmmount == ""){
            data.tBank = "";
        }
        dispatch(salesActions.createSale( data ));
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

            //setear por defecto el total en punto
            setValue('pAmmount', sum.toFixed(2));
        })

        if(preSale.length == 0){
            setTotal(0);
            setTotalWeight(0);
        }

    }

    //Función para limpiar pantalla
    const resetScreen = () =>{
        resetSale({ document:'', names:'', phone:'', ves:'',dollar:'',eur:'',cop:'',tAmmount:'',tBank:'',tReference:'',pAmmount:'',pAmmountExtra:'',terminalExtra:'',pBank:'',pReference:'', pReferenceExtra:''});
        setTotal(0);
        setTotalWeight(0);
        setTableSale([]);
        clientNamesRef.current.focus();
    }

    const statusRegister = useSelector(state => state.sales);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(statusRegister.success){
            resetScreen();
            clientNamesRef.current.clear();
        }
    },[statusRegister.success]);

    //Referencia código de producto
    const codeRef = useRef();
    const clientNamesRef = useRef();

    //Focus inicial en el cliente
    useEffect(() => {
        clientNamesRef.current.focus();
    }, []);


    /**
     * Busqueda autocompletado
     * 
     */
    
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const handleSearch = (query) => {
        setIsLoading(true);
        setOptions([]);
        dispatch(userActions.getListClientTypeahead(query));
    };

    //obtener sucursales para select
    const users = useSelector(state => state.users);
    
    useEffect(() => {
		if(users.obtained){
            setIsLoading(false);
            if(users.list.results && users.list.results.length>0){
                setOptions(users.list.results);
            }else{
                setOptions([]);
            }
		}else{
            setIsLoading(false);
        }
	},[users.obtained]);

    // Bypass client-side filtering by returning `true`. Results are already
    // filtered by the search endpoint, so no need to do it again.
    const filterBy = () => true;

    const handleChange = (selectedOption) =>{
        clearErrors(["document", "names"]);
        if(selectedOption.length>0){
            setValue('document', selectedOption[0].document);
            setValue('names', selectedOption[0].names);
            setValue('phone', selectedOption[0].phone);
        }
    }

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
                                <div style={{marginBottom:20}}>
                                    {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    {listCoin && listCoin.length>0 &&
                                        <div className="d-flex justify-content-between" style={{marginBottom:10}}> 
                                            <div style={{fontSize:'0.9em'}}>
                                                Dólar:{' '}<b><NumberFormat value={ listCoin[0].value.toFixed(2) } displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                            </div> 
                                            <div style={{fontSize:'0.9em'}}>
                                                Euros:{' '}<b><NumberFormat value={ listCoin[1].value.toFixed(2) } displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                            </div>   
                                            <div style={{fontSize:'0.9em'}}>
                                                Pesos:{' '}<b><NumberFormat value={ listCoin[2].value.toFixed(2) } displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                            </div>
                                       </div>
                                    }
                                </div>
                                <div className="d-flex justify-content-between" style={{marginBottom:10}}>  
                                    <h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Créditos </h3>
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
                                    <Col md={4}>
                                        <FormGroup>
                                        <Label for="document">Documento de identidad</Label>
                                        <Controller
                                            name="document"
                                            control={controlSale}
                                            rules={{
                                                required: "El documento es requerido",
                                            }}
                                            render={({}) => (
                                                <AsyncTypeahead
                                                    clearButton
                                                    allowNew
                                                    newSelectionPrefix="Añadir:"
                                                    filterBy={filterBy}
                                                    ref={clientNamesRef}
                                                    id="async-example"
                                                    isInvalid={errorsSale.document ? true:false}
                                                    isLoading={isLoading}
                                                    minLength={3}
                                                    onSearch={handleSearch}
                                                    useCache={false}
                                                    onChange={e => handleChange(e)}
                                                    options={options}
                                                    emptyLabel="No hay resultados"
                                                    labelKey="document"
                                                    // labelKey={option => `${option.document}`}
                                                />
                                            )}
                                        />
                                        {errorsSale.document && <div className="invalid-feedback d-block">{errorsSale.document.message}</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label for="names">Cliente</Label>
                                            <input
                                                maxLength="100"
                                                autoComplete="off"
                                                className={'form-control' + (errors.names ? ' is-invalid' : '')}
                                                name="names"
                                                ref={(e) => {
                                                    //clientNamesRef.current = e;
                                                    registerSale(e, { required: "El cliente es requerido" })
                                                }}
                                            />
                                            
                                            {errorsSale.names && <div className="invalid-feedback d-block">{errorsSale.names.message}</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label for="phone">Télefono</Label>
                                            <input
                                                maxLength="100"
                                                autoComplete="off"
                                                ref={registerSale({})}
                                                className={'form-control' + (errors.phone ? ' is-invalid' : '')}
                                                name="phone"
                                            />
                                            {errorsSale.phone && <div className="invalid-feedback d-block">{errorsSale.phone.message}</div>}
                                        </FormGroup>

                                        <FormGroup>
                                            <Label for="phone">Télefono</Label>
                                            <input
                                                maxLength="100"
                                                autoComplete="off"
                                                ref={registerSale({ required: "El Dirijido es requerido",})}
                                                className={'form-control' + (errors.phone ? ' is-invalid' : '')}
                                                name="phone"
                                            />
                                            {errorsSale.phone && <div className="invalid-feedback d-block">{errorsSale.phone.message}</div>}
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
                                                    register(e, { required: "El código es requerido", maxLength: { value: 50, message: "Máximo 50 caracteres" } })
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
                                                <b style={{fontSize:16, marginRight:10,  marginLeft:10}}>Total Peso: <NumberFormat value={ totalWeight.toFixed(3) } displayType={'text'} thousandSeparator={true} />{' '}Kg</b> 
                                            </div>
                                            <div className="text-center" style={{border:'1px solid #00C853', borderTopRightRadius:'25px', borderBottomRightRadius:'25px', backgroundColor:'#E6E6E6', padding:4}}>
                                                <b style={{fontSize:16, marginLeft:10,  marginRight:10}}>Total: <NumberFormat value={ total.toFixed(2) } displayType={'text'} thousandSeparator={true} />{' '}BsS.</b> 
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <Form onSubmit={handleSubmitSale(onRegisterSale)}>
                                    <Row form>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label for="comment">Comentarios</Label>
                                                <input
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    ref={registerSale({
                                                        required: "El comentario es requerido",
                                                    })}
                                                    disabled={total == 0 ? true: false}
                                                    className={'form-control' + (errorsSale.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                />
                                                {errorsSale.comment && <div className="invalid-feedback d-block">{errorsSale.comment.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Button color="primary" disabled={registering}>
                                                {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                Cobrar
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

export default SalesCreatePage;