/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { offlineActions, salesActions, productActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Collapse, Input } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import '../../assets/css/table.css';
import '../../assets/css/options.css';
import { WeightProduct } from '../../helpers/weight'
import moment from 'moment';
// import { currencyDollarActions } from '../../actions/currencyDollar.actions';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import Swal from 'sweetalert2';

function SalesCreateOfflinePage() {

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    const dispatch = useDispatch();
    //Modo oscuro 
    const { darkMode } = useDarkMode();

    //usuario
    const user = useSelector(state => state.authentication.user);
    const productsState = useSelector(state => state.products);

    // Obtener listado de combos para identificar combos desde el catálogo
    useEffect(() => {
        if (user?.id) dispatch(productActions.combosGetAll());
    }, [user?.id, dispatch]);

    // const state = useSelector(state => state.currencyDollar || {});
    // const { data } = state;

    // // Obtener información del BCV
    // const bcvData = data?.monitors?.bcv;

    // // Usar useEffect para obtener datos de divisas
    // useEffect(() => {
    //     dispatch(currencyDollarActions.fetchCurrencyDollarData());
    // }, [dispatch]);


    /**
     * Data offline
     */

    //data offline monedas, productos, vendedores, operadores y terminales
    const dataSale = useSelector(state => state.data.sale);

    //Redux ventas pendientes por procesar
    const pending = useSelector(state => state.pending);


    //Cantidad de ventas offline pendientes por procesar
    const [pendingSales, setPendingSales] = useState('');

    //Colocar cantidad de pendientes en el boton y menú ver: Sidebar.js
    const getPendings = () => {
        if (pending.sales && pending.sales.length > 0) {
            setPendingSales(`(${pending.sales.length})`);
        } else {
            setPendingSales('');
        }
    };

    useEffect(() => {
        getPendings();
    }, [pending]);

    //procesar ventas offline
    const onProcessData = () => {
        if (pending.sales && pending.sales.length > 0) {
            let sales = {
                items: pending.sales
            }
            dispatch(salesActions.processSalesOffline(sales));
        }
    }

    //State de registro offline de cada compra
    const registering = useSelector(state => state.offline.registering);

    //State de registro offline para procesar todas las ventas
    const registeringOffline = useSelector(state => state.sales.registeringOffline);
    //End data offline


    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if (alert.message) {
            setModalChange(false);
            setVisible(true);
            window.setTimeout(() => { setVisible(false) }, 5000);
        }
    }, [alert]);

    //Obtener toda la data necesaria para ventas
    const [listCoin, setListCoin] = useState(null);
    const [listProducts, setListProducts] = useState(null);
    const [listSellers, setListSellers] = useState([]);
    const [listOperators, setListOperators] = useState([]);
    const [terminaList, setTerminalList] = useState([]);
    const [offerProducts, setOfferProducts] = useState(null);


    useEffect(() => {
        if (dataSale) {
            // Asignar los datos de `dataSale` a los estados correspondientes
            setListProducts(dataSale.products);
            setListSellers(dataSale.sellers);
            setListOperators(dataSale.operators);
            setTerminalList(dataSale.agency.terminal);
            setOfferProducts(dataSale.offers);
            setListCoin(dataSale.coins);

        }
    }, [dataSale])

    //Form Tabla
    const { handleSubmit, register, errors, reset, control, setValue: setProductLineValue, clearErrors: clearProductLineErrors } = useForm();
    //Form resgistrar venta
    const { handleSubmit: handleSubmitSale, register: registerSale, errors: errorsSale, reset: resetSale, control: controlSale, watch, setValue } = useForm();
    const { handleSubmit: handleSubmitChange, register: registerChange, errors: errorsChange, reset: resetChange, control: controlChange, watch: watchChange } = useForm();

    //Tabla de productos añadidos
    const [tableSale, setTableSale] = useState([]);
    //Total de los productos
    const [total, setTotal] = useState(0);
    //Total en peso de los productos
    const [totalWeight, setTotalWeight] = useState(0);

    //Modal genérico y mensaje
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    const [catalogModalOpen, setCatalogModalOpen] = useState(false);
    const [catalogFilterText, setCatalogFilterText] = useState('');
    const [catalogType, setCatalogType] = useState('products'); // 'products' | 'combos'
    const [catalogCombos, setCatalogCombos] = useState([]);
    const focusKgAfterCatalogCloseRef = useRef(false);

    useEffect(() => {
        if (Array.isArray(productsState?.data)) {
            setCatalogCombos(productsState.data);
        }
    }, [productsState?.data]);

    const catalogRowsFiltered = useMemo(() => {
        const list = Array.isArray(listProducts) ? listProducts : [];
        const q = (catalogFilterText || '').trim().toLowerCase();
        const comboCodeSet = new Set((catalogCombos || []).map((c) => String(c?.code ?? '').trim()).filter(Boolean));
        const comboNameSet = new Set((catalogCombos || []).map((c) => String(c?.name ?? '').trim()).filter(Boolean));

        const isComboByCatalog = (p) => {
            const code = String(p?.code ?? '').trim();
            const name = String(p?.name ?? '').trim();
            return (code && comboCodeSet.has(code)) || (name && comboNameSet.has(name));
        };

        const byType = catalogType === 'combos' ? list.filter(isComboByCatalog) : list.filter((p) => !isComboByCatalog(p));

        if (!q) return byType;
        return byType.filter((p) => {
            const codeStr = String(p.code ?? '').toLowerCase();
            const nameStr = p.name ? String(p.name).toLowerCase() : '';
            return codeStr.includes(q) || nameStr.includes(q);
        });
    }, [listProducts, catalogFilterText, catalogType, catalogCombos]);

    // Cupón deshabilitado en ventas offline (no se puede validar sin conexión)

    //Añadir producto a tabla
    const onCreateData = (data, e) => {

        const codeInput = String(data.code ?? '').trim();
        let productFilter = listProducts.filter(item => String(item.code ?? '').trim() === codeInput);

        if (productFilter.length == 0) {
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        } else {

            //Obtener ofertas si existen
            var offer = null;
            if (offerProducts && offerProducts.length > 0) {
                offer = offerProducts.find(item => {
                    return String(item.product.code ?? '').trim() === codeInput;
                })
            }

            //tomar precio de oferta si existe sino, el precio normal
            let priceProduct = offer ? offer.price : (productFilter[0].price * (listCoin[0]?.value));

            // Validar que el precio no sea 0
            if (priceProduct === 0 || priceProduct <= 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Precio no válido',
                    text: 'El precio del producto está en 0. No se puede agregar este producto a la venta.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: 'red'
                });
                return;
            }

            // Se verifica que no se ingresen numeros decimales en productos por unidad
            if (productFilter[0].presentation === "Unidades") {
                if (data.kg != Math.round(data.kg)) {
                    setModalVisible(true);
                    setModalMsg(productFilter[0].name + ' se vende por unidades, por lo que sólo se debe ingresar numeros enteros');
                    return
                }
            }

            const target = { ...productFilter[0] };

            const source = {
                kg: parseFloat(data.kg),
                price: priceProduct,
                regularPrice: offer ? productFilter[0].price : 0,
                isOffer: offer ? true : false,
                total: parseFloat(data.kg) * parseFloat(priceProduct)
            };

            //Añadir al array de productos
            let preSale = [...tableSale]; // Crear una copia del array para evitar mutación directa
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
                if (getWeight) {
                    sumWeight += product.kg * getWeight.weight;
                } else {
                    sumWeight += product.kg;
                }
                setTotalWeight(sumWeight);
                //setear por defecto el total en punto (con descuento cupón si aplica)
                setValue('pAmmount', sum.toFixed(2));
            })
            //focus en el codigo nuevamente
            codeRef.current.focus();
            //resetear form
            reset({
                code: '',
                kg: ''
            });
        }

    };

    const [dataSaleOff, setDataSaleOff] = useState(null);

    //Registrar venta
    const onRegisterSale = (data, e) => {
        //limpiar errores del form de producto
        reset();

        if (total == 0 || tableSale.length == 0) {
            setModalMsg('Debe ingresar al menos un producto');
            setModalVisible(true);
            return;
        }
        if (optionRest > 0 && collapses.includes(1)) {
            setModalMsg('Debe completar el pago');
            setModalVisible(true);
            return;
        }

        data.user = user.id;
        data.agency = user.agency.id;
        data.items = tableSale;
        data.total = total;
        // Para metas/objetivos debe trabajarse en dólares (sin multiplicar por la tasa).
        data.totalDollar = parseFloat(totalDollar.toFixed(2));
        data.couponCode = '';
        data.totalWeight = totalWeight;//total peso
        //enviar valores actuales de las monedas
        data.valueDollar = listCoin[0].value.toFixed(2);
        data.valueEur = listCoin[1].value.toFixed(2);
        data.valueCop = listCoin[2].value.toFixed(2);

        // Si los terminales aplican
        if (data.terminal) {
            const terminal = terminaList.find((item) => item.id == data.terminal)
            data.terminalApply = terminal.apply
        }
        if (data.terminalExtra) {
            const terminalExtra = terminaList.find((item) => item.id == data.terminalExtra)
            data.terminalExtraApply = terminalExtra.apply
        }

        // Si es televentas
        //data.isTelesale = watch("isTelesale") ? true : false

        //limpiar banco en tra
        if (data.tAmmount == "") {
            data.tBank = "";
        }

        // Para las ventas offline se almacena la fecha de creacion para que de esta manera quede registrada
        data.createdDate = moment().utc().subtract(4, 'hours');

        //Guardar venta
        if (exceeded > 0) {
            setDataSaleOff(data);
            setModalChange(true);
        } else {
            dispatch(offlineActions.addSaleOffline(data));
        }

    };

    //Quitar elemento de la tabla
    const removeItem = (prod) => {

        let preSale = [...tableSale]; // Crear una copia del array para evitar mutación directa
        const index = preSale.indexOf(prod);

        if (index !== -1) {
            preSale.splice(index, 1);
            setTableSale(preSale)
        }

        let sum = 0;
        var sumWeight = 0;
        preSale.map((product) => {
            sum = sum + parseFloat(product.total);
            setTotal(sum);

            //buscar si el producto tiene un peso calcuado de bolsa
            const getWeight = WeightProduct.find(prod => prod.code == product.code);
            if (getWeight) {
                sumWeight += product.kg * getWeight.weight;
            } else {
                sumWeight += product.kg;
            }
            setTotalWeight(sumWeight);

            //setear por defecto el total en punto (con descuento cupón si aplica)
            setValue('pAmmount', sum.toFixed(2));
        })

        if (preSale.length == 0) {
            setTotal(0);
            setTotalWeight(0);
        }

    }

    //Función para limpiar pantalla
    const resetScreen = () => {
        resetSale({ document: '', names: '', phone: '', operator: '', isTelesale: '', ves: '', dollar: '', eur: '', cop: '', tAmmount: '', tBank: '', tReference: '', pAmmount: '', pAmmountExtra: '', terminalExtra: '', pBank: '', pReference: '', pReferenceExtra: '' });
        setTotal(0);
        setTotalWeight(0);
        setTableSale([]);
        clientNamesRef.current.focus();
    }

    //verificar estado de guardado del offline
    const statusRegister = useSelector(state => state.offline);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if (statusRegister.success) {
            resetScreen();
            setModalChange(false);
            setDataSaleOff(null);
        }
    }, [statusRegister.success]);

    //Data de los forms
    let pos = watch("terminal");
    let tAmmount = watch("tAmmount");
    let ves = watch("ves");
    let dollar = watch("dollar");
    let eur = watch("eur");
    let cop = watch("cop");
    let pAmmount = watch("pAmmount");
    let names = watch("names");
    let phone = watch("phone");
    //punto adicional
    let posExtra = watch("terminalExtra");
    let pAmmountExtra = watch("pAmmountExtra");

    // collapse opciones adicionales
    const [collapses, setCollapses] = useState([]);

    const changeCollapse = collapse => {
        if (collapses.includes(collapse)) {
            setCollapses(collapses.filter(prop => prop !== collapse));
        } else {
            setCollapses([...collapses, collapse]);
        }
    };

    //Si se contrae "otros" limpiar data
    useEffect(() => {
        if (collapses.length == 0) {
            setValue('ves', '');
            setValue('dollar', '');
            setValue('eur', '');
            setValue('cop', '');
            setValue('tAmmount', '');
            setValue('tBank', '');
            setValue('tReference', '');
            setValue('pAmmountExtra', '');
            setValue('terminalExtra', '');
            //setValue('pReferenceExtra','');
            setExceeded(0);
            if (total > 0) {
                setValue('pAmmount', total.toFixed(2));
            }
        } else {
            setValue('tBank', 'Principal');
        }
    }, [collapses, total]);

    useEffect(() => {
        //si se elimina productos contraer "otros"
        if (total == 0) {
            setCollapses([]);
            //setear por defecto el total el punto
            setValue('pAmmount', '');
        }
    }, [total]);

    //Si no se agregan otras opciones el total de punto de venta es de solo lectura
    const [readOnly, setReadOnly] = useState(true);
    useEffect(() => {
        if (total > 0 && collapses.includes(1)) {
            //permitir modificar valor del input monto de punto de venta cuando hay otras opciones
            setValue('pAmmount', '');
            setReadOnly(false);
        } else {
            setReadOnly(true);
        }
    }, [total, collapses]);

    //Total de todas las opciones
    const [optionTotal, setOptionTotal] = useState(true);
    //Total que falta
    const [optionRest, setOptionRest] = useState(0);
    //Total excedente 
    const [exceeded, setExceeded] = useState(0);

    //Totales en moneda extranjera
    const [totalDollar, setTotalDollar] = useState(0);
    const [totalVes, setTotalVes] = useState(0);
    const [totalEur, setTotalEur] = useState(0);
    const [totalCop, setTotalCop] = useState(0);

    //Sacar totales en monedas extranjeras
    useEffect(() => {
        if (total > 0 && listCoin && listCoin.length > 0) {
            setTotalDollar(total / listCoin[0].value);
            setTotalEur(total / listCoin[1].value);
            setTotalCop(total * listCoin[2].value);
            setTotalVes(total);
        } else {
            setTotalDollar(0);
            setTotalEur(0);
            setTotalCop(0);
            setTotalVes(0);
        }
    }, [total]);

    //Detectar cambios en monedas y sacar totales
    useEffect(() => {

        let totalProduct = total;
        let subTot = 0;
        setOptionTotal(subTot);
        setExceeded(0);
        setOptionRest(totalProduct);
        if (ves && ves.length > 0) {
            subTot += parseFloat(ves.replace(/,/g, ''));
        }
        if (pAmmount && pAmmount.length > 0) {
            subTot += parseFloat(pAmmount.replace(/,/g, ''));
        }
        if (pAmmountExtra && pAmmountExtra.length > 0) {
            subTot += parseFloat(pAmmountExtra.replace(/,/g, ''));
        }
        if (tAmmount && tAmmount.length > 0) {
            subTot += parseFloat(tAmmount.replace(/,/g, ''));
        }
        if (dollar && dollar.length > 0 && listCoin && listCoin.length > 0) {
            let dollarPrice = listCoin[0].value;
            let conversion = parseFloat(dollar.replace(/,/g, '')) * parseFloat(dollarPrice);
            subTot += conversion;
        }
        if (eur && eur.length > 0 && listCoin && listCoin.length > 0) {
            let eurPrice = listCoin[1].value;
            let conversion = parseFloat(eur.replace(/,/g, '')) * parseFloat(eurPrice);
            subTot += conversion;
        }
        if (cop && cop.length > 0 && listCoin && listCoin.length > 0) {
            let copPrice = listCoin[2].value;
            let conversion = parseFloat(cop.replace(/,/g, '')) / parseFloat(copPrice);
            subTot += conversion;
        }
        setOptionTotal(subTot);

        if (parseFloat(subTot.toFixed(2)) > parseFloat(totalProduct.toFixed(2))) {
            setExceeded(subTot.toFixed(2) - totalProduct.toFixed(2));
        }

        let rest = parseFloat(totalProduct.toFixed(2)) - parseFloat(subTot.toFixed(2));
        if (rest <= 0) {
            rest = 0;
        }

        if (parseFloat(totalProduct.toFixed(2)) <= parseFloat(subTot.toFixed(2))) {
            rest = 0;
        }
        setOptionRest(rest);
    }, [ves, dollar, eur, cop, pAmmount, tAmmount, pAmmountExtra, total]);

    //Referencia código de producto y cantidad (línea de venta)
    const codeRef = useRef();
    const kgInputRef = useRef();
    const clientNamesRef = useRef();

    const selectProductFromCatalog = (product) => {
        setProductLineValue('code', String(product.code ?? ''));
        clearProductLineErrors('code');
        focusKgAfterCatalogCloseRef.current = true;
        setCatalogModalOpen(false);
        setCatalogFilterText('');
    };

    const onCatalogModalClosed = () => {
        if (!focusKgAfterCatalogCloseRef.current) return;
        focusKgAfterCatalogCloseRef.current = false;
        requestAnimationFrame(() => {
            const el = kgInputRef.current;
            if (el) {
                el.focus();
                try { el.select(); } catch (e) { /* noop */ }
            }
        });
    };

    //Focus inicial en el cliente
    useEffect(() => {
        clientNamesRef.current.focus();
    }, []);

    //Gestionar los cambios
    const [modalChange, setModalChange] = useState(false);
    //Totales de cambio en moneda extranjera
    const [totalBsChange, setTotalBsChange] = useState(0);
    const [totalDollarChange, setTotalDollarChange] = useState(0);
    const [totalEurChange, setTotalEurChange] = useState(0);
    const [totalCopChange, setTotalCopChange] = useState(0);

    //Sacar totales en monedas extranjeras
    useEffect(() => {
        if (exceeded > 0 && listCoin && listCoin.length > 0) {
            setTotalBsChange(exceeded);
            setTotalDollarChange(exceeded / listCoin[0].value);
            setTotalEurChange(exceeded / listCoin[1].value);
            setTotalCopChange(exceeded * listCoin[2].value);
        } else {
            setTotalBsChange(0);
            setTotalDollarChange(0);
            setTotalEurChange(0);
            setTotalCopChange(0);
        }
    }, [exceeded]);

    //Registrar forma de cambio
    const onRegisterChange = (data, e) => {
        let infoSale = dataSaleOff;
        infoSale.changeData = data;
        dispatch(offlineActions.addSaleOffline(infoSale));
    }

    let typeChange = watchChange("typeChange");

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="container-fluid">
                        <Container>
                            <Row>
                                <Col sm="12" md={{ size: 8, offset: 2 }}>
                                    <div style={{ marginBottom: 20 }}>
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
                                    <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                                        <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Registro de venta offline al Detal </h3>
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
                                            <FormGroup>
                                                <Label for="document">Documento</Label>
                                                <input
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.document ? ' is-invalid' : '')}
                                                    name="document"
                                                    ref={(e) => {
                                                        clientNamesRef.current = e;
                                                        registerSale(e, { required: "El documento es requerido" })
                                                    }}
                                                />

                                                {errorsSale.document && <div className="invalid-feedback d-block">{errorsSale.document.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
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
                                        <Col md={3}>
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
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            {user.agency.name == "no aplica" && <>
                                                <FormGroup>
                                                    <Label for="operator">Operador</Label>{' '}
                                                    <select
                                                        className={'form-control' + (errorsSale.operator ? ' is-invalid' : '')}
                                                        name="operator"
                                                        ref={registerSale({
                                                            required: "El operador es requerido"
                                                        })}>

                                                        <option key={''} name={''} value={''}>Seleccione un operador</option>

                                                        {listOperators && listOperators.map(operator =>
                                                            <option
                                                                key={operator.id}
                                                                name={operator.id}
                                                                value={operator.id}>
                                                                {operator.firstName + ' ' + operator.lastName}
                                                            </option>
                                                        )}
                                                    </select>
                                                    {errorsSale.operator && <div className="invalid-feedback d-block">{errorsSale.operator.message}</div>}

                                                </FormGroup>
                                            </>}
                                        </Col>

                                        {/* <Col md={6}> 
                                    {user.agency.name != "no aplica" && <>
                                        <FormGroup> 
                                            <Label for="isTelesale">¿Es televentas?</Label>{' '}
                                            <select 
                                                className={'form-control' + (errorsSale.isTelesale ? ' is-invalid' : '')} 
                                                name="isTelesale"
                                                ref={registerSale({ 
                                                        required: "La opción es requerida" 
                                                    })}>
                                                    <option key={'No'} name={'No'} value={false}>No</option>
                                                    <option key={'Si'} name={'Si'} value={true}>Si</option>
                                            </select>
                                            {errorsSale.isTelesale && <div className="invalid-feedback d-block">{errorsSale.isTelesale.message}</div>}
                                        </FormGroup>
                                        </>}
                                    </Col> */}

                                    </Row>
                                    <Row style={{ display: "none" }}>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="seller">Vendedor</Label>{' '}
                                                <select
                                                    className={'form-control' + (errors.seller ? ' is-invalid' : '')}
                                                    name="seller"
                                                    ref={registerSale({
                                                        required: "El vendedor es requerido"
                                                    })}>
                                                    {listSellers && listSellers.map(seller =>
                                                        <option
                                                            key={seller.id}
                                                            name={seller.id}
                                                            value={seller.id}>
                                                            {seller.firstName + ' ' + seller.lastName}
                                                        </option>
                                                    )}

                                                </select>
                                                {errors.seller && <div className="invalid-feedback d-block">{errors.seller.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Form onSubmit={handleSubmit(onCreateData)} className="form" style={{
                                        border: '1px solid #dee2e6', padding: '10px 20px', borderRadius: '5px',
                                        marginBottom: '5px'
                                    }}>
                                        <Row form style={{ marginTop: '12px' }}>
                                            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                                <Button
                                                    type="button"
                                                    color="primary"
                                                    outline
                                                    className="btn-round"
                                                    style={{ marginTop: 0, height: '38px' }}
                                                    title="Ver catálogo y elegir producto"
                                                    disabled={!listProducts || listProducts.length === 0}
                                                    onClick={() => {
                                                        setCatalogFilterText('');
                                                        setCatalogType('products');
                                                        setCatalogModalOpen(true);
                                                    }}
                                                >
                                                    <i className="fa fa-th-list mr-1" aria-hidden="true" />
                                                    <span className="d-none d-sm-inline">Catálogo</span>
                                                </Button>
                                            </FormGroup>
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
                                                            value: 0.040,
                                                            message: "El peso minimo es 40 gr"
                                                        },
                                                        required: "El peso es requerido",
                                                    }}
                                                    as={<NumberFormat placeholder="Cantidad" className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} getInputRef={(el) => { kgInputRef.current = el; }} />}
                                                />
                                                {errors.kg && <div className="invalid-feedback">{errors.kg.message}</div>}
                                            </FormGroup>
                                            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                                <Button color="primary" className="btn-round btn-icon" style={{ marginTop: 0 }}>
                                                    <i className="fa fa-plus"></i>
                                                </Button>
                                            </FormGroup>
                                        </Row>
                                    </Form>
                                    <Table striped responsive className={darkMode ? 'dark-mode' : ''}>
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>kg/unidades</th>
                                                <th>Costo unitario</th>
                                                <th>Sub (Bs)</th>
                                                <th>Sub ($)</th>
                                                <th>Sub (Cop)</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableSale && tableSale.map((product, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{product.name}</td>
                                                        <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                                        <td><NumberFormat value={product.price.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs ' /></td>
                                                        <td><NumberFormat value={(product.total).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs ' /></td>
                                                        <td><NumberFormat value={(product.total / listCoin[0].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$ ' /></td>
                                                        <td><NumberFormat value={(product.total * listCoin[2].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop ' /></td>
                                                        <td>
                                                            <Button className="btn-link" color="primary" style={{ margin: 0, padding: 0 }}
                                                                onClick={e => { e.preventDefault(); removeItem(product) }}>
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
                                        <Col className="text-right" style={{ margin: 0 }}>
                                            {listCoin && listCoin.length >= 3 && (
                                                <div className="d-inline-flex" style={{ padding: '5px 0px 10px 0px' }}>
                                                    <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', padding: 4 }}>
                                                        <b style={{ fontSize: 25, marginRight: 10, marginLeft: 10 }}>
                                                            <NumberFormat value={totalWeight.toFixed(3)} displayType={'text'} thousandSeparator={true} prefix={'kg '} />
                                                        </b>
                                                    </div>
                                                    <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, padding: 4 }}>
                                                        <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                            <NumberFormat value={(total / (listCoin[0]?.value || 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} />
                                                        </b>
                                                    </div>
                                                    <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: 4 }}>
                                                        <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                            <NumberFormat value={total.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} />
                                                        </b>
                                                    </div>
                                                    <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', padding: 4 }}>
                                                        <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                            <NumberFormat value={(total * (listCoin[2]?.value || 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Cop '} />
                                                        </b>
                                                    </div>
                                                </div>
                                            )}
                                            </Col>
                                    </Row>
                                    <Form onSubmit={handleSubmitSale(onRegisterSale)}>
                                        <Row form>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label for="pBank">Punto</Label>
                                                    <select className={'form-control' + (errors.terminal ? ' is-invalid' : '')} name="terminal"
                                                        disabled={total == 0 ? true : false}
                                                        ref={registerSale({
                                                            validate: terminal => {
                                                                if ((!tAmmount && !ves && !dollar && !eur && !cop && !terminal && !posExtra) || (!terminal && pAmmount)) {
                                                                    return "Seleccione punto de venta"
                                                                }
                                                            }
                                                        })}>
                                                        <option key="" name="" value=""></option>
                                                        {terminaList && terminaList.map(list =>
                                                            <option
                                                                key={list.id}
                                                                name={list.id}
                                                                value={list.id}>
                                                                {list.code}
                                                            </option>
                                                        )}
                                                    </select>
                                                    {errorsSale.terminal && <div className="invalid-feedback d-block">Seleccione punto de venta</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label for="pAmmount">Monto</Label>
                                                    <Controller
                                                        name="pAmmount"
                                                        control={controlSale}
                                                        disabled={readOnly}
                                                        rules={{
                                                            validate: (value) => {
                                                                if (pos && !value) {
                                                                    return "El monto de punto de venta es requerido"
                                                                }
                                                            },
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },

                                                        }}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.pAmmount ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.pAmmount && <div className="invalid-feedback">{errorsSale.pAmmount.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label for="pReference">Referencia</Label>
                                                    <input
                                                        maxLength="100"
                                                        autoComplete="off"
                                                        ref={registerSale({
                                                            validate: (reference) => {
                                                                if (pos && !reference) {
                                                                    return "la referencia es requerida"
                                                                }
                                                            }
                                                        })}
                                                        disabled={total == 0 ? true : false}
                                                        className={'form-control' + (errorsSale.pReference ? ' is-invalid' : '')}
                                                        name="pReference"
                                                    />
                                                    {errorsSale.pReference && <div className="invalid-feedback d-block">{errorsSale.pReference.message}</div>}
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                                            <Button style={{ margin: 0, padding: 0, border: 'none', outline: 'none', width: '100%' }} className="btn-link" onClick={() => changeCollapse(1)} disabled={total == 0 ? true : false}>
                                                <div className="hr-theme-slash-2">
                                                    <div className="hr-line"></div>
                                                    <div className="hr-icon">
                                                        {collapses.length == 0 && <i className="fa fa-chevron-down icon-line fa-lg" aria-hidden="true"></i>}
                                                        {collapses.length > 0 && <i className="fa fa-chevron-up icon-line fa-lg" aria-hidden="true"></i>}
                                                    </div>
                                                    <div className="hr-line"></div>
                                                </div>
                                            </Button>
                                        </div>

                                        <Collapse isOpen={collapses.includes(1)}>
                                            <div className="d-flex justify-content-between">

                                                {collapses.includes(1) ? <div className="pull-right align-self-center">



                                                    <div>
                                                        {/* CALCULO DE FALTANTES*/}

                                                        <b style={{ fontSize: 18, color: '#BC0707' }}>Faltante <NumberFormat value={optionRest.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs:  ' /> /  </b>
                                                        <b style={{ fontSize: 18, color: '#BC0707' }}> <NumberFormat value={(optionRest / listCoin[0].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$:    ' /> /  </b>
                                                        <b style={{ fontSize: 18, color: '#BC0707' }}> <NumberFormat value={(optionRest * listCoin[2].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop:  ' /></b>
                                                    </div>
                                                    <br></br>


                                                    {/* CALCULO DE TOTAL*/}
                                                    <div>

                                                        <b style={{ fontSize: 18 }}>Total <NumberFormat value={optionTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs:  ' /> /  </b>
                                                        <b style={{ fontSize: 18 }}> <NumberFormat value={(optionTotal / listCoin[0].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$:    ' /> /  </b>
                                                        <b style={{ fontSize: 18 }}> <NumberFormat value={(optionTotal * listCoin[2].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop:  ' /></b>
                                                    </div>

                                                    <br></br>

                                                    {/* CALCULO DE CAMBIO*/}


                                                    {exceeded > 0 &&



                                                        <div color="primary"> <i className="fa fa-exclamation-circle text-warning" aria-hidden="true"></i>{' '}
                                                            <b style={{ fontSize: 18 }} className="text-warning">Cambio <NumberFormat value={exceeded.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs  ' /> /  </b>
                                                            <b style={{ fontSize: 18 }} className="text-warning"> <NumberFormat value={(exceeded / listCoin[0].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$  ' /> /  </b>
                                                            <b style={{ fontSize: 18 }} className="text-warning"> <NumberFormat value={((exceeded * listCoin[2].value).toFixed(2))} displayType={'text'} thousandSeparator={true} prefix='Cop  ' />   </b>
                                                        </div>


                                                    }
                                                    <br></br>


                                                </div> : ''}
                                            </div>
                                            <div className="form-row">
                                                <FormGroup className="col-md-3">
                                                    <Label for="ves">Bs <b>{<NumberFormat value={totalVes.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="ves"
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.ves ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.ves && <div className="invalid-feedback">{errorsSale.ves.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-3">
                                                    <Label for="dollar">$ Dólares <b>{<NumberFormat value={totalDollar.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="dollar"
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.dollar && <div className="invalid-feedback">{errorsSale.dollar.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-3">
                                                    <Label for="eur">€ Euros <b>{<NumberFormat value={totalEur.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="eur"
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.eur ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.eur && <div className="invalid-feedback">{errorsSale.eur.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-3">
                                                    <Label for="cop">$ Pesos <b>{<NumberFormat value={totalCop.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="cop"
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.cop ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.cop && <div className="invalid-feedback">{errorsSale.cop.message}</div>}
                                                </FormGroup>
                                            </div>
                                            <div className="mb-2"><b>Transferencia</b></div>
                                            <div className="form-row">
                                                <FormGroup className="col-md-4">
                                                    <Label for="tAmmount">Monto</Label>
                                                    <Controller
                                                        name="tAmmount"
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.tAmmount ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.tAmmount && <div className="invalid-feedback">{errorsSale.tAmmount.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-4">
                                                    <Label for="tBank">Banco</Label>
                                                    <select
                                                        className={'form-control' + (errorsSale.tBank ? ' is-invalid' : '')}
                                                        name="tBank"
                                                        disabled={total == 0 ? true : false}
                                                        ref={registerSale({
                                                            validate: (bank) => {
                                                                if (tAmmount && !bank) {
                                                                    return "El banco es requerido"
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <option key="Principal" name="Principal" value="Principal">Principal - VENEZUELA</option>
                                                        <option key="EMBUTIDOS MOHAN" name="EMBUTIDOS MOHAN" value="EMBUTIDOS MOHAN">Personal - BICENTENARIO</option>
                                                        {/* Ocultar resto de transferencias */}
                                                        {/* <option key="DANIEL PERSONAL" name="DANIEL PERSONAL" value="DANIEL PERSONAL">DANIEL PERSONAL - PROVINCIAL</option> */}
                                                        {/* <option key="DELICATESES MOMOY" name="DELICATESES MOMOY" value="DELICATESES MOMOY">DELICATESES MOMOY - BANESCO</option> */}
                                                        {/* <option key="DELICATESES ENMANUEL" name="DELICATESES ENMANUEL" value="DELICATESES ENMANUEL">DELICATESES EMMANUEL - BANESCO</option> */}
                                                        {/* <option key="Principal B" name="Principal B" value="Principal B">Principal - BANESCO</option> */}
                                                        {/* <option key="EMBUTIDOS MOHAN B" name="EMBUTIDOS MOHAN B" value="EMBUTIDOS MOHAN B">EMBUTIDOS MOHAN - BANESCO</option> */}

                                                    </select>
                                                    {errorsSale.tBank && <div className="invalid-feedback d-block">{errorsSale.tBank.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-4">
                                                    <Label for="tReference">Referencia</Label>
                                                    <input
                                                        disabled={total == 0 ? true : false}
                                                        maxLength="100"
                                                        autoComplete="off"
                                                        ref={registerSale({
                                                            validate: (reference) => {
                                                                if (tAmmount && !reference) {
                                                                    return "La referencia es requerida"
                                                                }
                                                            }
                                                        })}
                                                        className={'form-control' + (errors.tReference ? ' is-invalid' : '')}
                                                        name="tReference"
                                                    />
                                                    {errorsSale.tReference && <div className="invalid-feedback d-block">{errorsSale.tReference.message}</div>}
                                                </FormGroup>
                                            </div>
                                            <div className="mb-2"><b>Punto Adicional</b></div>
                                            <Row form>
                                                <Col md={4}>
                                                    <FormGroup>
                                                        <Label for="terminalExtra">Punto</Label>
                                                        <select className={'form-control' + (errors.terminalExtra ? ' is-invalid' : '')} name="terminalExtra"
                                                            disabled={total == 0 ? true : false}
                                                            ref={registerSale({
                                                                validate: terminalExtra => {
                                                                    if (pos) {
                                                                        if (pos == terminalExtra) {
                                                                            return "Seleccione otro punto de venta"
                                                                        }
                                                                    }
                                                                }
                                                            })}>
                                                            <option key="" name="" value=""></option>
                                                            {terminaList && terminaList.map(list =>
                                                                <option
                                                                    key={list.id}
                                                                    name={list.id}
                                                                    value={list.id}>
                                                                    {list.code}
                                                                </option>
                                                            )}
                                                        </select>
                                                        {errorsSale.terminalExtra && <div className="invalid-feedback d-block">Seleccione otro punto de venta</div>}
                                                    </FormGroup>
                                                </Col>
                                                <Col md={4}>
                                                    <FormGroup>
                                                        <Label for="pAmmountExtra">Monto</Label>
                                                        <Controller
                                                            name="pAmmountExtra"
                                                            control={controlSale}
                                                            rules={{
                                                                validate: (value) => {
                                                                    if (posExtra && !value) {
                                                                        return "El monto de punto de venta es requerido"
                                                                    }
                                                                },
                                                                min: {
                                                                    value: 0,
                                                                    message: "El valor no puede ser negativo"
                                                                },
                                                            }}
                                                            as={<NumberFormat className={'form-control' + (errorsSale.pAmmountExtra ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                        />
                                                        {errorsSale.pAmmountExtra && <div className="invalid-feedback">{errorsSale.pAmmountExtra.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                                <Col md={4}>
                                                    <FormGroup>
                                                        <Label for="pReferenceExtra">Referencia</Label>
                                                        <input
                                                            maxLength="100"
                                                            autoComplete="off"
                                                            ref={registerSale({
                                                                validate: (reference) => {
                                                                    if (posExtra && !reference) {
                                                                        return "la referencia es requerida"
                                                                    }
                                                                }
                                                            })}
                                                            disabled={total == 0 ? true : false}
                                                            className={'form-control' + (errorsSale.pReferenceExtra ? ' is-invalid' : '')}
                                                            name="pReferenceExtra"
                                                        />
                                                        {errorsSale.pReferenceExtra && <div className="invalid-feedback d-block">{errorsSale.pReferenceExtra.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Collapse>
                                        <Row>
                                            <Col>
                                                <Button color="primary" disabled={registering || registeringOffline}>
                                                    {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    Cobrar
                                                </Button>{' '}
                                            </Col>
                                            <Col>
                                                <div className="pull-right">
                                                    <Button onClick={e => { e.preventDefault(); history.goBack(); }}>Cancelar</Button>
                                                </div>
                                            </Col>
                                        </Row>
                                        {/* Ventas offline por procesar */}
                                        <Row>
                                            <Col>
                                                <div className="pull-left">
                                                    <Button color="primary" disabled={(!pending.sales || (pending.sales.length <= 0) || registering || registeringOffline)} onClick={e => { e.preventDefault(); onProcessData(); }}>
                                                        {registeringOffline && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                        Procesar Ventas {pendingSales !== '' ? pendingSales : ''}
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="d-flex justify-content-between">
                                            <div>

                                            </div>

                                        </div>
                                    </Form>
                                </Col>
                            </Row>
                            <Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible}>
                                <div className="modal-header">
                                    <h5 className="modal-title" id="examplemodalMsgLabel">
                                        Pago
                                    </h5>
                                    <button
                                        aria-label="Close"
                                        className="close"
                                        type="button"
                                        onClick={() => { setModalVisible(false); setModalMsg('') }}
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
                                        onClick={() => { setModalVisible(false); setModalMsg('') }}
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                            </Modal>
                            <Modal
                                toggle={() => { setCatalogModalOpen(false); setCatalogFilterText(''); setCatalogType('products'); }}
                                isOpen={catalogModalOpen}
                                onClosed={onCatalogModalClosed}
                                className={`modal-lg ${darkMode ? 'dark-mode' : ''}`}
                                backdrop="static"
                            >
                                <div className={`modal-header ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
                                    <h5 className="modal-title">Catálogo de productos</h5>
                                    <button
                                        aria-label="Close"
                                        className="close"
                                        type="button"
                                        onClick={() => { setCatalogModalOpen(false); setCatalogFilterText(''); setCatalogType('products'); }}
                                    >
                                        <span aria-hidden={true}>×</span>
                                    </button>
                                </div>
                                <div className={`modal-body ${darkMode ? 'bg-dark text-white' : ''}`}>
                                    <p className={`small mb-2 ${darkMode ? 'text-light' : 'text-muted'}`}>
                                        Busque por código o nombre, pulse <strong>Seleccionar</strong> y luego indique la cantidad para añadir.
                                    </p>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            color="primary"
                                            outline={catalogType !== 'products'}
                                            className="btn-round"
                                            onClick={() => setCatalogType('products')}
                                        >
                                            Productos
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            color="primary"
                                            outline={catalogType !== 'combos'}
                                            className="btn-round"
                                            onClick={() => setCatalogType('combos')}
                                        >
                                            Combos
                                        </Button>
                                    </div>
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Buscar por código o nombre…"
                                        value={catalogFilterText}
                                        onChange={(e) => setCatalogFilterText(e.target.value)}
                                        className="mb-3"
                                    />
                                    <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                                        <Table size="sm" striped responsive className={darkMode ? 'dark-mode' : ''}>
                                            <thead>
                                                <tr>
                                                    <th>Código</th>
                                                    <th>Producto</th>
                                                    <th style={{ width: 120 }} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {catalogRowsFiltered.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-3">
                                                            {listProducts && listProducts.length ? 'Sin coincidencias' : 'Sin catálogo (sincronice datos offline)…'}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    catalogRowsFiltered.map((p, idx) => (
                                                        <tr key={p._id || p.id || `${String(p.code)}-${idx}`}>
                                                            <td className="text-nowrap">{p.code}</td>
                                                            <td>{p.name}</td>
                                                            <td>
                                                                <Button color="primary" size="sm" type="button" onClick={() => selectProductFromCatalog(p)}>
                                                                    Seleccionar
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                                <div className={`modal-footer ${darkMode ? 'bg-dark border-secondary' : ''}`}>
                                    <Button color="secondary" type="button" onClick={() => { setCatalogModalOpen(false); setCatalogFilterText(''); setCatalogType('products'); }}>
                                        Cerrar
                                    </Button>
                                </div>
                            </Modal>
                            <Modal toggle={() => { setModalChange(false); setModalMsg('') }} isOpen={modalChange}>
                                <div className="modal-header">
                                    <h5 className="modal-title" id="examplemodalMsgLabel">
                                        Forma de cambio
                                    </h5>
                                    <button
                                        aria-label="Close"
                                        className="close"
                                        type="button"
                                        onClick={() => { setModalChange(false); setModalMsg('') }}
                                    >
                                        <span aria-hidden={true}>×</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div style={{ marginBottom: 20 }}>
                                        {exceeded > 0 && <>
                                            <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: '0.9em' }}>
                                                    BsS:{' '}<b><NumberFormat value={totalBsChange.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                                </div>
                                                <div style={{ fontSize: '0.9em' }}>
                                                    Dólar:{' '}<b><NumberFormat value={totalDollarChange.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} /></b>
                                                </div>
                                                <div style={{ fontSize: '0.9em' }}>
                                                    Euros:{' '}<b><NumberFormat value={totalEurChange.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'€ '} /></b>
                                                </div>
                                                <div style={{ fontSize: '0.9em' }}>
                                                    Pesos:{' '}<b><NumberFormat value={totalCopChange.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} /></b>
                                                </div>
                                            </div>
                                            <Form onSubmit={handleSubmitChange(onRegisterChange)}>
                                                <Row>
                                                    <div className="col">
                                                        <FormGroup>
                                                            <Label for="typeChange">Forma de pago</Label>
                                                            <select className={'form-control' + (errorsChange.typeChange ? ' is-invalid' : '')} name="typeChange"
                                                                ref={registerChange({
                                                                    required: "El tipo de divisa es requerido"
                                                                })}>
                                                                <option key="0" name="" value="">Seleccione</option>
                                                                <option key="1" name="1" value="1">BsS</option>
                                                                <option key="2" name="2" value="2">Dólar</option>
                                                                <option key="3" name="3" value="3">Euros</option>
                                                                <option key="4" name="4" value="4">Pesos</option>
                                                            </select>
                                                            {errorsChange.typeChange && <div className="invalid-feedback d-block">{errorsChange.typeChange.message}</div>}
                                                        </FormGroup>
                                                    </div>
                                                    <div className="col">
                                                        <FormGroup>
                                                            <Label for="changeAmmount">Monto</Label>
                                                            <Controller
                                                                name="changeAmmount"
                                                                control={controlChange}
                                                                rules={{
                                                                    required: "El monto es requerido",
                                                                    validate: value => {
                                                                        let amount = parseFloat(value.toString().replace(/,/g, ''));
                                                                        if (value == '' || value < 0) {
                                                                            return "El monto es requerido"
                                                                        }
                                                                        if (typeChange == '1') {
                                                                            if (amount > parseFloat(totalBsChange)) {
                                                                                return "El valor no puede ser mayor a lo indicado en BsS"
                                                                            }
                                                                        } else if (typeChange == '2') {
                                                                            if (amount > parseFloat(totalDollarChange)) {
                                                                                return "El valor no puede ser mayor a lo indicado en Dólares"
                                                                            }
                                                                        } else if (typeChange == '3') {
                                                                            if (amount > parseFloat(totalEurChange)) {
                                                                                return "El valor no puede ser mayor a lo indicado en Euros"
                                                                            }
                                                                        } else if (typeChange == '4') {
                                                                            if (amount > parseFloat(totalCopChange)) {
                                                                                return "El valor no puede ser mayor a lo indicado en Pesos"
                                                                            }
                                                                        }
                                                                    },
                                                                    min: {
                                                                        value: 0,
                                                                        message: "El valor no puede ser negativo"
                                                                    },

                                                                }}
                                                                as={<NumberFormat className={'form-control' + (errorsChange.changeAmmount ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                            />
                                                            {errorsChange.changeAmmount && <div className="invalid-feedback">{errorsChange.changeAmmount.message}</div>}
                                                        </FormGroup>
                                                    </div>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                        <Button color="primary" disabled={registering}>
                                                            {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                            Procesar cambio
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <div className="pull-right">
                                                            <Button color="secondary" type="button" onClick={() => { setModalChange(false); setModalMsg('') }}>
                                                                Cerrar
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </>
                                        }
                                    </div>
                                </div>

                            </Modal>
                        </Container>
                    </div>

                </div>
            </div>
        </>
    );
}

export default SalesCreateOfflinePage;