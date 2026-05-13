/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import { useLocation } from "react-router-dom";
import NumberFormat from 'react-number-format';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

function InventoryReweighPage() {

    //Modo oscuro 
    const { darkMode} = useDarkMode();
    
    const location = useLocation();

    const inventoryState = useSelector(state => state.inventories.inventory);
    const searching = useSelector(state => state.inventories.searching);
    //obtener sede del state
    const [inventory, setInventory] = useState(null);

    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(inventoryActions.getInventory( location.state.id ));
            
        }
    }, [location]);

    useEffect(() => {
        if(inventoryState){
            setInventory(inventoryState); 
        }
    },[inventoryState]);


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
    const { handleSubmit, errors, control, reset } = useForm();

    //Registrar data
    const onUpdateData = (data, e) => {
        dispatch(inventoryActions.updateInventory( location.state.id, data ));
    };

    //State de actualizacion
    const updating = useSelector(state => state.inventories.updating);
    const inventories = useSelector(state => state.inventories);


    //Actualizar estado de inventario al cambio de información
    useEffect(() => {
        if(inventories.success){
            let update = inventory;
            try {
                update.kg = parseFloat(inventories.inventoryUpdated.kg);
            } catch (error) {
                update.kg = null;
            }   
            setInventory(update);
            reset({
                kg:''
            });
        }
    },[inventories.success]);

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Repesaje Inventario</h3>
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
                                {searching &&  <div className="d-flex justify-content-center">
                                    <Spinner color="primary" />
                                </div>}                       
                                {inventory &&
                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="name"><b>Producto</b></Label>
                                                <input
                                                    maxLength="20"
                                                    autoComplete="off"
                                                    className="form-control-plaintext"
                                                    name="name"
                                                    defaultValue={inventory.product.name}
                                                    readOnly={true}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="agency"><b>Sucursal</b></Label>
                                                <input
                                                    maxLength="20"
                                                    autoComplete="off"
                                                    className="form-control-plaintext"
                                                    name="agency"
                                                    defaultValue={inventory.agency.name}
                                                    readOnly={true}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="agency"><b>kg</b></Label>
                                                <NumberFormat  className="form-control-plaintext" value={ inventory.kg?inventory.kg.toFixed(3):inventory.kg } displayType={'text'} thousandSeparator={true}/>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="kg">Nuevo valor Kg</Label>
                                                <Controller
                                                    name="kg"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 0.001,
                                                            message: "El campo es requerido"
                                                        },
                                                        max:{
                                                            value: inventory.kg,
                                                            message: "No puede superar el valor actual" 
                                                        },
                                                        required: "El campo es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.kg && <div className="invalid-feedback">{errors.kg.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={updating}>
                                            {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Actualizar
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

export default InventoryReweighPage;