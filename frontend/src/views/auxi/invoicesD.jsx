/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions, productActions, agencyActions } from '../../actions';
import { inventoryFiscalActions } from '../../actions/inventoryFiscal.actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Input  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';


import { Typeahead, withAsync } from 'react-bootstrap-typeahead';

const AsyncTypeahead = withAsync(Typeahead);

function InvoiceD() {

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
    const { handleSubmit, register, errors, reset, control, setValue, watch } = useForm();

    const onCreateData = (data, e) => {
        
        if (tableProduct.length === 0) {
          setModalVisible(true);
          setModalMsg("Debe ingresar al menos un producto");
          return;
        }
      
        // Cálculo de totales
        const baseImponible = tableProduct
          .filter((product) => product.taxed)
          .reduce((acc, product) => acc + product.kg * parseFloat(product.unitPrice), 0);
        
          
        const iva = baseImponible * 0.16;
      
        const exento = tableProduct
          .filter((product) => product.exempt)
          .reduce((acc, product) => acc + product.kg * parseFloat(product.unitPrice), 0);
      
        const montoTotal = baseImponible + iva + exento;
      
        data.user = user.id;
        data.products = tableProduct;
        data.totals = {
          taxableBase: baseImponible.toFixed(2),
          iva: iva.toFixed(2),
          exempt: exento.toFixed(2),
          totalAmount: montoTotal.toFixed(2),
        };
      
        data.agency = user.agency.id;
      
      };
      
    //State de guardado
    const registering = useSelector(state => state.inventories.registering);

    //obtener productos para select
    const getting = useSelector(state => state.products.getting);
    const products = useSelector(state => state.products);
    
    useEffect(() => {
        dispatch(productActions.listProducts());
    },[]);

    const [listProducts, setListProducts] = useState(null);

    useEffect(() => {
        if(products.obtained){
            setListProducts(products.list);
        }
    },[products.obtained]);

    const statusRegister = useSelector(state => state.inventoriesFiscal);
    
    const [hasReloaded, setHasReloaded] = useState(false);
    //Verificar si guardo y limpiar form

    
    useEffect(() => {
      if (statusRegister.success && !hasReloaded) {
          setTableProduct([]);
          reset({
              controlNumber: '', // Número de control
              date: '',          // Fecha de emisión
              documentType: '',  // Tipo de documento
              document: '',      // Documento
              names: '',         // Nombre o Razón Social
              address: '',       // Dirección
              agency: '',        // Sucursal
          });

          // Marcar que se ha recargado
          setHasReloaded(true);
          // Recargar la página
          window.location.reload();
      }
  

        // setHasReloaded(true);

        // window.location.reload();

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
        
        // Buscar el producto por código
        const productFilter = listProducts.filter((item) => item.code === data.code);
        
        if (productFilter.length === 0) {
          setModalVisible(true);
          setModalMsg("No se encontró el producto");
          return;
        }
      
        const target = { ...productFilter[0] };
        
        // Calcular el precio unitario
        const unitPrice = target.taxed
          ? ((target.price / 1.16) / 1.3).toFixed(2) // Gravado: (price - 16%) / 1.3
          : (target.price / 1.3).toFixed(2); // Exento: price / 1.3
        
        
        // Asignar unitPrice al producto
        target.unitPrice = unitPrice; // Guardar como número
      
        // Añadir al array de productos
        const products = [...tableProduct];
        products.unshift({ ...target, ...data });
      
        setTableProduct(products);
      
        // Resetear formulario
        codeRef.current.focus();
        resetProduct({
          code: "",
          kg: "",
          price: "",
        });
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
          <div className="d-flex" id="wrapper">
				  <SideBar/>
				    <div id="page-content-wrapper">
					    <AdminNavbar/>
                <div className="container-fluid">
                  <Container>
                    <Row>
                      <Col sm="12" md={{ size: 8, offset: 2 }}>
                        <h3 style={{ fontWeight:'bold', fontStyle: 'italic' }}>Plantilla de factura</h3>
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
                            {/* <Row form>
                                <Col>
                                    <FormGroup className="mr-3">
                                        <Label for="controlNumber">Numero de Control</Label>
                                        <input 
                                            type="controlNumber"
                                            name="controlNumber"
                                            id="controlNumber"
                                            className='form-control'
                                            placeholder="Ingrese el numero de control"
                                            style={{width: '60%'}}
                                            ref={(e) => register(e, { required: 'El numero de control es requerido' })}
                                            
                                        />
                                        {errors.controlNumber && (
                                        <div className="invalid-feedback d-block">
                                            {errors.controlNumber.message}
                                        </div>)}
                                    </FormGroup>
                                </Col>
                                <Col>
                                    <FormGroup className="mr-3">
                                    <Label 
                                    for="date"
                                    style={{ marginLeft:'190px'}}
                                        >Fecha de emisión</Label>
                                    <input
                                        type="date"
                                        name="date"
                                        id="date"
                                        className='form-control'
                                        style={{width:'50%', marginLeft:'190px'}}
                                        ref={(e) => register(e, { required: 'La fecha es requerida' })}
                                    />
                                    {errors.date && (
                                        <div 
                                          style={{width:'50%', marginLeft:'190px'}}
                                          className="invalid-feedback d-block">
                                            {errors.date.message}
                                        </div>)}
                                    </FormGroup>
                                </Col>
                            </Row>
                          <Row form>
                          <Col md={1.5}>
                                <FormGroup>
                                  <Label for="documentType">V, J, E...</Label>
                                  <select
                                    name="documentType"
                                    className='form-control'
                                      ref={register({ required: true })}
                                  >
                                    <option name="J" value="J">J</option>
                                    <option name="V" value="V">V</option>
                                    <option name="E" value="E">E</option>
                                    <option name="G" value="G">G</option>
                                    <option name="P" value="P">P</option>
                                    <option name="R" value="R">R</option>
                                  </select>
                                  {errors.documentType && <div className="invalid-feedback d-block">{errors.documentType.message}</div>}
                                </FormGroup>
                              </Col>
                            <Col md={4}>
                            <FormGroup>
                                <Label for="document">Documento</Label>
                                <input
                                    type="number" // Puedes cambiar a "text" si es necesario
                                    name="document"
                                    defaultValue={409037100}
                                    id="document"
                                    className='form-control'
                                    placeholder="Ingrese el documento"
                                    ref={(e) => register(e, { required: "El documento  es requerido" })}
                                    
                                />
                                {errors.document && (
                                    <div className="invalid-feedback d-block">
                                    {errors.document.message || "El documento es requerido"}
                                    </div>
                                )}
                            </FormGroup>
                              </Col>
                              <Col md={6}>
                                <FormGroup>
                                    <Label for="names"
                                    style={{marginLeft:'45px'}}
                                        >Nombre o Razon social</Label>
                                    <input
                                    maxLength="100"
                                    autoComplete="off"
                                    defaultValue={'Embutidos Fattoria, C.A'}
                                    placeholder="Ingrese el nombre o razon social"
                                    className={'form-control' + (errors.names ? ' is-invalid' : '')}
                                    style={{marginLeft:'45px'}}
                                    name="names"
                                    ref={(e) => {
                                        //clientNamesRef.current = e;
                                        register(e, { required: "El cliente es requerido" })
                                    }}
                                    />

                                    {errors.names && <div  
                                    style={{marginLeft:'45px'}}
                                    
                                    className="invalid-feedback d-block">{errors.names.message}</div>}
                                </FormGroup>
                            </Col>
                                
                            </Row> */}
                            {/* <Row form>
                              <Col>
                                <FormGroup>
                                  <Label for="address">Dirección</Label>
                                  <input
                                    placeholder="Ingrese la direccion"
                                    maxLength="100"
                                    autoComplete="off"
                                    defaultValue={'Carretera Nacional Trasandina, Edificio Embutidos La Merideña, Piso Planta Baja, Local 2,Sector, San Rafael de Tabay-Mérida Mérida - Edo. Mérida. Zona Postal 5101.'}
                                    ref={register({ required: "La direccion es requerida" })}
                                    className={'form-control'}
                                    name="address"
                                  />
                                  {errors.address && <div className="invalid-feedback d-block">{errors.address.message}</div>} 
                                </FormGroup>
                              </Col>
                            </Row> */}
                                <Form onSubmit={handleSubmitProduct(onCreateDataProduct)} className="form">
                                    
                                    <Row form>
                                        <Col md={4}>
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
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="kg">Kg/Unidades</Label>
                                                <Controller
                                                    name="kg"
                                                    control={controlProduct}
                                                    rules={{
                                                        min: {
                                                            value: 0.001,
                                                            message: "El peso es requerido"
                                                        },
                                                        pattern: {
                                                            value: /^(?=.*\d)\d*(\.\d+)?$/,
                                                            message: "Ingresa un peso válido"
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
                                        <Button color="info">
                                            <i className="fa fa-plus-circle" aria-hidden="true"></i> Añadir
                                        </Button>
                                    </div>
                                </Form>
                                <Table striped responsive bordered hover className="mb-4">
                                    <thead className="bg-light text-end">
                                        <tr>
                                        <th>Kg/Unidades</th>
                                        <th>Producto</th>
                                        <th>Precio unitario</th>
                                        <th>Sub-total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                      {tableProduct.map((product, index) => {
                                        const status = product.exempt
                                          ? "E"
                                          : product.taxed
                                          ? "G"
                                          : "-";

                                        const unitPrice = product.unitPrice || 0; // Garantizar valor predeterminado

                                        return (
                                          <tr key={index}>
                                            <td>
                                              <NumberFormat
                                                displayType={"text"}
                                                value={product.kg.toLocaleString("en-US", {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}
                                                thousandSeparator={true}
                                              />
                                            </td>
                                            <td>{product.name} ({status})</td>
                                            <td>
                                              {unitPrice.toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                            <td>
                                              {(
                                                product.kg * unitPrice
                                              ).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                            <td>
                                              <Button
                                                className="btn-link"
                                                color="primary"
                                                style={{ margin: 0, padding: 0 }}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  removeItem(product);
                                                }}
                                              >
                                                <i className="fa fa-times-circle"></i>
                                              </Button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>

                                    </Table>


                                <div className="d-flex justify-content-end mt-3">
                                  <Table bordered className="w-50">
                                    <tbody>
                                    <tr>
                                        <th className="bg-light text-end">Exento</th>
                                        <td className="text-end">
                                          {tableProduct &&
                                            tableProduct
                                              .filter((product) => product.exempt)
                                              .reduce((acc, product) => acc + product.kg * product.unitPrice, 0)
                                              .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th className="bg-light text-end">Base imponible</th>
                                        <td className="text-end">
                                          {tableProduct &&
                                            tableProduct
                                              .filter((product) => product.taxed)
                                              .reduce((acc, product) => acc + product.kg * product.unitPrice, 0)
                                              .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th className="bg-light text-end">IVA 16%</th>
                                        <td className="text-end">
                                          {tableProduct &&
                                            tableProduct
                                              .filter((product) => product.taxed)
                                              .reduce(
                                                (acc, product) => acc + product.kg * product.unitPrice * 0.16,
                                                0
                                              )
                                              .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                      
                                      <tr>
                                        <th className="bg-light text-end">Monto total</th>
                                        <td className="text-end">
                                          {tableProduct &&
                                            tableProduct
                                              .reduce(
                                                (acc, product) =>
                                                  acc +
                                                  product.kg * product.unitPrice * (product.taxed ? 1.16 : 1),
                                                0
                                              )
                                              .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </Table>
                                </div>


                                <Form onSubmit={handleSubmit(onCreateData)} className="form">
                                    {/* Solo role admin y supervisor */}
                                    {(user.role == 1 || user.role == 2) && <>
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
                                        <Button color="info" disabled={registering} >
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
                                Inventario fiscal
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                color="info"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div>
                                <p>{modalMsg}</p>
                            </div>
                            <div className="modal-footer">
                            <Button
                                color="info"
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

export default InvoiceD;

