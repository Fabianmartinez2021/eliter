/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { miscellaneousInventoryActions, miscellaneousActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Input  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { Role, history } from '../../helpers';
import NumberFormat from 'react-number-format';
import typeSupplyEnum from '../../enums/typeSupply.enum';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

function MiscellaneousInventoryCreatePage() {

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
        if(tableProduct.length == 0){
            setModalVisible(true);
            setModalMsg('Debe ingresar al menos un producto');
            return;
        }
        data.user = user.id;
        data.products = tableProduct;

        if(user.role == Role.Manager){
           data.agency = user.agency.id;
        }

        dispatch(miscellaneousInventoryActions.createInventory( data ));
    };

    //State de guardado
    const registering = useSelector(state => state.inventories.registering);

    //obtener productos para select
    const getting = useSelector(state => state.miscellaneous.getting);
    const products = useSelector(state => state.miscellaneous);

    useEffect(() => {
        dispatch(miscellaneousActions.dataTable());
    },[]);

    const [listProducts, setListProducts] = useState(null);

    useEffect(() => {
        if(products.obtained){
            setListProducts(products.data.results);
        }
    },[products.obtained]);

    const statusRegister = useSelector(state => state.miscellaneousInventory);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(statusRegister.success){
            setTableProduct([]);
            reset({
                typeIn: '',
                agency:'',
                note:'',
                comment:''
            });
        }
    },[statusRegister.success]);


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

    const agencyWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyWatch);

    //Form resgistrar venta
    const { handleSubmit:handleSubmitProduct, register: registerProduct , errors: errorsProduct, reset:resetProduct, control:controlProduct, setValue:setValueProduct  } = useForm();
    //Tabla de productos añadidos
    const [tableProduct, setTableProduct] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');
    //Añadir producto a tabla
    const onCreateDataProduct = (data, e) => {

        //buscar codigo de producto para añadir
        let productFilter = listProducts.filter(item => item.code.toString() === data.code);

        if(productFilter.length == 0){
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        }else{
            
            // Se verifica que no se ingresen numeros decimales en productos por unidad
            if (productFilter[0].presentation === "Unidades"){
                if (data.kg != Math.round(data.kg)){
                    setModalVisible(true);
                    setModalMsg(productFilter[0].name + ' se vende por unidades, por lo que sólo se debe ingresar numeros enteros');
                    return
                }
            }

            const target = {...productFilter[0]};
            const source = { kg: parseFloat(data.kg) };

             //Añadir al array de productos
            let products = tableProduct;
            products.unshift(Object.assign(target, source));
            setTableProduct(products);
            
            //focus en el codigo nuevamente
            codeRef.current.focus();
            //resetear form
            resetProduct({
                code:'',
                kg:''
            });
        }
        
    };

    //Quitar producto de lista
    const removeItem = (product) => {

        let products = tableProduct;
        const index = products.indexOf(product);
        if (index !== -1) {
            products.splice(index, 1);
            setTableProduct([...products])  
        }

    }

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Ingresar Suministros</h3>
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
                                    <Col>
                                        <FormGroup className="mr-3">
                                            <Label for="typeIn">Tipo de Ingreso</Label>
                                            <select
                                                name="typeIn"
                                                className={'form-control'}
                                                ref={register({
                                                    required: "El tipo de Ingreso es requerido",
                                                })}
                                                >
                                                <option name="" value=""></option>
                                                {Object.keys(typeSupplyEnum.inDescription).map((index) => {
                                                        return <option key={index} name={index} value={index}>{typeSupplyEnum.inDescription[index]}</option>
                                                    })}
                                            </select>
                                            
                                            {errors.typeIn && <div className="invalid-feedback d-block">{errors.typeIn.message}</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col>
                                    </Col>
                                </Row>
                                <Form onSubmit={handleSubmitProduct(onCreateDataProduct)} className="form">
                                    
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="product">Código</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <input
                                                    type="text"
                                                    maxLength={50}
                                                    autoComplete="off"
                                                    className={'form-control' + (errorsProduct.code ? ' is-invalid' : '')}
                                                    name="code"
                                                    ref={(e) => {
                                                        registerProduct(e, { required: "El código es requerido", maxLength: { value: 50, message: "Máximo 50 caracteres" } })
                                                        codeRef.current = e;
                                                    }}
                                                />
                                                {errorsProduct.code && <div className="invalid-feedback d-block">{errorsProduct.code.message}</div>}
                                            </FormGroup>
                                           
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="kg">Kg/Unidades</Label>
                                                <Controller
                                                    name="kg"
                                                    control={controlProduct}
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El peso es requerido"
                                                        },
                                                        setValueAs: (value) => {

                                                            return value ? parseFloat(value.toString().replace(/,/g, '')) : value;
                                                        },
                                                        required: "El peso es requerido",
                                                    }}
                                                    as={<NumberFormat  className={'form-control' + (errorsProduct.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsProduct.kg && <div className="invalid-feedback">{errorsProduct.kg.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary">
                                            <i className="fa fa-plus-circle" aria-hidden="true"></i> Añadir
                                        </Button>
                                    </div>
                                </Form>
                                <Table striped responsive className={darkMode ? 'dark-mode' : ''}>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Kg/Unidades</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {tableProduct && tableProduct.map((product, index) => {
                                        return (
                                                <tr key={index}>
                                                    <td>{product.name}</td>
                                                    <td>
                                                        <NumberFormat 
                                                            displayType={'text'} 
                                                            value={product.kg} 
                                                            thousandSeparator={true}
                                                            decimalScale={product.kg % 1 !== 0 ? 3 : 0}
                                                            fixedDecimalScale={product.kg % 1 !== 0}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Button className="btn-link" color="primary" style={{margin:0, padding:0}}
                                                            onClick={e => 
                                                                {
                                                                    e.preventDefault(); 
                                                                    removeItem(product);
                                                                }
                                                            }>
                                                            <i className="fa fa-times-circle"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                    </tbody>
                                </Table>
                                <Form onSubmit={handleSubmit(onCreateData)} className="form">
                                    {/* Solo role admin y supervisor */}
                                    {(user.role == 1 || user.role == 2 || user.role == Role.suplyRole || user.role == 9) && <>
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
                                    <Row form>
                                        <Col md={6}>  
                                            <FormGroup>
                                                <Label for="note">Nota</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.note ? ' is-invalid' : '')}
                                                    name="note"
                                                    ref={register({
                                                        required: "La nota es requerida",
                                                    })}
                                                />
                                                {errors.note && <div className="invalid-feedback">{errors.note.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>  
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
                                onClick={() =>  {setModalVisible(false); setModalMsg(''); setTableProduct([])}}
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
                                onClick={() =>  {
                                    setModalVisible(false); 
                                    setModalMsg('');
                                    resetProduct({ code: '', kg: '' }); 
                                }}
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

export default MiscellaneousInventoryCreatePage;