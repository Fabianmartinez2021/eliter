/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import { ticketFiscalActions } from '../../actions/ticketFiscal.actions';
import { salesFiscalActions } from '../../actions/salesFiscal.action';
import { validateCoupon as validateCouponService } from '../../services';
import Swal from 'sweetalert2';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Collapse, InputGroup, Input, InputGroupAddon, Spinner, Badge } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history, Role } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import DataTable from 'react-data-table-component';
import '../../assets/css/table.css';
import '../../assets/css/options.css';
import useDebounce from '../../components/Debounce';
import moment from 'moment';
import { WeightProduct } from '../../helpers/weight'
// import { currencyDollarActions } from '../../actions/currencyDollar.actions';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import "../../assets/css/coupon.css";

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
    return <InputGroup style={{ "width": "200px" }}>
        <Input autoComplete="off" style={{ "height": "38px", "marginTop": "10px" }} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
        <InputGroupAddon addonType="append">
            <Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
        </InputGroupAddon>
    </InputGroup>
}

import { Typeahead, withAsync } from 'react-bootstrap-typeahead';

const AsyncTypeahead = withAsync(Typeahead);

function SalesFiscalCreatePage() {

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    // Modo oscuro 
    const { darkMode } = useDarkMode();

    //usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

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
    const getting = useSelector(state => state.sales.getting);
    const sales = useSelector(state => state.sales);

    //Obtener monedas, productos y terminales de sucursal
    useEffect(() => {
        dispatch(salesActions.salesDataForm(user.agency.id));
    }, []);

    // Cargar tickets fiscales en espera al montar
    useEffect(() => {
        if (user?.agency?.id) {
            dispatch(ticketFiscalActions.dataTable({ id: user.agency.id }));
        }
    }, [user?.agency?.id, dispatch]);

    const [listCoin, setListCoin] = useState(null);
    const [listProducts, setListProducts] = useState(null);
    const [listSellers, setListSellers] = useState([]);
    const [listOperators, setListOperators] = useState([]);
    const [terminaList, setTerminalList] = useState([]);
    const [offerProducts, setOfferProducts] = useState(null);

    useEffect(() => {
        if (sales.obtained) {
            // Asignar los datos de `sales` a los estados correspondientes
            setListProducts(sales.data.products);
            setListSellers(sales.data.sellers);
            setListOperators(sales.data.operators);
            setTerminalList(sales.data.agency.terminal);
            setOfferProducts(sales.data.offers);
            setListCoin(sales.data.coins);

        }
    }, [sales.obtained])

    //Form Tabla
    const { handleSubmit, register, errors, reset, control } = useForm();
    //Form resgistrar venta
    const { handleSubmit: handleSubmitSale, register: registerSale, errors: errorsSale, reset: resetSale, control: controlSale, watch, setValue, clearErrors } = useForm();
    const { handleSubmit: handleSubmitChange, register: registerChange, errors: errorsChange, reset: resetChange, control: controlChange, watch: watchChange } = useForm();

    //State de guardado
    const registering = useSelector(state => state.salesFiscal.registeringFiscal);
    //Tabla de productos añadidos
    const [tableSale, setTableSale] = useState([]);
    //Total de los productos
    const [total, setTotal] = useState(0);
    //Total en peso de los productos
    const [totalWeight, setTotalWeight] = useState(0);

    //Modal genérico y mensaje
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [couponValid, setCouponValid] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponAmounts, setCouponAmounts] = useState(null);
    const effectiveTotal = useMemo(() => couponValid && total > 0 ? Math.round(total * 0.95 * 100) / 100 : total, [total, couponValid]);
    const totalInDollars = useMemo(() => (listCoin && listCoin[0]?.value) ? total / (listCoin[0].value || 1) : 0, [total, listCoin]);
    const canUseCoupon = total > 0 && totalInDollars >= 10;

    //Añadir producto a tabla
    const onCreateData = (data, e) => {


        //buscar codigo de producto para añadir
        let productFilter = listProducts.filter(item => item.code === data.code);

        if (productFilter.length == 0) {
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        } else {

            //Obtener ofertas si existen
            var offer = null;
            if (offerProducts.length > 0) {
                offer = offerProducts.find(item => {
                    return item.product.code === data.code
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
                setValue('pAmmount', (couponValid ? Math.round(sum * 0.95 * 100) / 100 : sum).toFixed(2));
            })
            //focus en el codigo nuevamente
            // codeRef.current.focus();
            //resetear form
            reset({
                code: '',
                kg: ''
            });

            if (product.current) {
                product.current.focus(); // Volver a enfocar el campo
            }
        }

    };

    const [dataSale, setDataSale] = useState(null);

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
        data.totalDollar = parseFloat((listCoin?.[0]?.value ? total / listCoin[0].value : 0).toFixed(2));
        data.couponCode = couponValid ? couponCodeInput.trim() : '';
        data.totalWeight = totalWeight;//total peso
        data.phone = (data.phone != null && String(data.phone).trim() !== '') ? String(data.phone).trim() : '';
        // Usar tasa del ticket si existe (creado tras cierre); si no, tasa actual
        if (rowSelected && rowSelected.valueDollar != null) {
            data.valueDollar = Number(rowSelected.valueDollar).toFixed(2);
            data.valueEur = rowSelected.valueEur != null ? Number(rowSelected.valueEur).toFixed(2) : listCoin[1].value.toFixed(2);
            data.valueCop = rowSelected.valueCop != null ? Number(rowSelected.valueCop).toFixed(2) : listCoin[2].value.toFixed(2);
        } else {
            data.valueDollar = listCoin[0].value.toFixed(2);
            data.valueEur = listCoin[1].value.toFixed(2);
            data.valueCop = listCoin[2].value.toFixed(2);
        }

        // Si los terminales aplican
        if (data.terminal) {
            const terminal = terminaList.find((item) => item.id == data.terminal)
            data.terminalApply = terminal.apply
        }
        if (data.terminalExtra) {
            const terminalExtra = terminaList.find((item) => item.id == data.terminalExtra)
            data.terminalExtraApply = terminalExtra.apply
        }

        data.type = 5 // ver sales.enum.js en el backend

        //Si es un ticket se envia para eliminarlo 
        data.idTicket = rowSelected ? rowSelected.id : null;

        // Calcular totales de Base Imponible, IVA y Exento
        let sumBaseImponible = tableSale
            .filter((product) => product.taxed) // Filtrar productos gravados con IVA
            .reduce((acc, product) => acc + product.total / 1.16, 0);

        let sumIva = tableSale
            .filter((product) => product.taxed) // Filtrar productos gravados con IVA
            .reduce((acc, product) => acc + ((product.total / 1.16) * 16) / 100, 0); // IVA correcto

        let sumExento = tableSale
            .filter((product) => product.exempt) // Filtrar productos exentos
            .reduce((acc, product) => acc + product.total, 0);

        // Agregar los totales al objeto data
        data.baseImponible = sumBaseImponible.toFixed(2);
        data.iva = sumIva.toFixed(2);
        data.exento = sumExento.toFixed(2);

        // Si es televentas
        //data.isTelesale = watch("isTelesale") ? true : false

        //limpiar banco en tra
        if (data.tAmmount == "") {
            data.tBank = "";
        }

        //Guardar venta
        if (exceeded > 0) {
            setDataSale(data);
            setModalChange(true);
        } else {
            dispatch(salesFiscalActions.createSaleFiscal(data));
        }

        if (product.current) {
            product.current.focus(); // Volver a enfocar el campo
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
            setValue('pAmmount', (couponValid ? Math.round(sum * 0.95 * 100) / 100 : sum).toFixed(2));
        })

        if (preSale.length == 0) {
            setTotal(0);
            setTotalWeight(0);
        }

    }

    //Función para limpiar pantalla
    const resetScreen = () => {
        resetSale({
            invoiceNumber: watch("invoiceNumber") || "0",
            address: watch("address") || "Merida",
            agency: '',
            document: watch("document") || "0",
            documentType: watch("documentType") || "",
            names: watch("names") || "cuenta clave",
            phone: watch("phone") || "0",
            operator: watch("operator") || "",
            ves: '',
            dollar: '',
            eur: '',
            cop: '',
            tAmmount: '',
            tBank: '',
            tReference: '',
            pAmmount: '',
            pAmmountExtra: '',
            terminalExtra: '',
            pBank: '',
            pReference: '',
            pReferenceExtra: ''
        });
        setTotal(0);
        setTotalWeight(0);
        setTableSale([]);
        setRowSelected(null);
        setRowDelete(null);
        // clientNamesRef.current.clear();
        // clientNamesRef.current.focus();
        setSelected([{ document: "0" }]);
        setCouponCodeInput('');
        setCouponValid(false);
        setCouponAmounts(null);
        setCouponError('');
    }

    const handleValidateCoupon = async () => {
        const code = couponCodeInput ? String(couponCodeInput).trim() : '';
        if (!code) { setCouponError('Ingrese el código del cupón'); setCouponValid(false); setCouponAmounts(null); return; }
        if (totalInDollars < 10) { setCouponError('El cupón está disponible solo en compras de $10 o más'); setCouponValid(false); setCouponAmounts(null); return; }
        setValidatingCoupon(true);
        setCouponError('');
        setCouponAmounts(null);
        try {
            const result = await validateCouponService(code, total);
            setCouponValid(!!result.valid);
            if (!result.valid) setCouponError(result.message || 'Cupón inválido o ya utilizado');
            else if (result.totalBeforeDiscount != null && result.totalAfterDiscount != null) {
                setCouponAmounts({
                    totalBeforeDiscount: result.totalBeforeDiscount,
                    couponDiscount: result.couponDiscount ?? 0,
                    totalAfterDiscount: result.totalAfterDiscount
                });
            }
        } catch (e) { setCouponValid(false); setCouponError('Error al validar cupón'); }
        setValidatingCoupon(false);
    };

    const statusRegister = useSelector(state => state.salesFiscal);

    //Verificar si guardo y limpiar form
    useEffect(() => {
        if (statusRegister.success) {
            resetScreen();
            setModalChange(false);
            setDataSale(null);
            // clientNamesRef.current.clear();
            // clientNamesRef.current.focus();
        }
    }, [statusRegister.success]);

    // Limpiar cupón cuando el total baja de $10
    useEffect(() => {
        if (!canUseCoupon && (couponValid || couponCodeInput || couponError)) {
            setCouponCodeInput('');
            setCouponValid(false);
            setCouponAmounts(null);
            setCouponError('');
        }
    }, [canUseCoupon]);

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
    let invoiceNumber = watch("invoiceNumber");
    let documentClient = watch("document");
    let documentType = watch("documentType");
    let baseImponible = watch("baseImponible");
    let iva = watch("iva");
    let exento = watch("exento");
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
            setOptionRest(0);
            if (total > 0) {
                setValue('pAmmount', effectiveTotal.toFixed(2));
            }
        } else {
            setValue('tBank', 'Principal');
        }
    }, [collapses, total, couponValid, effectiveTotal]);

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
    const [optionRest, setOptionRest] = useState(true);
    //Total excedente 
    const [exceeded, setExceeded] = useState(0);

    //Totales en moneda extranjera
    const [totalDollar, setTotalDollar] = useState(0);
    const [totalEur, setTotalEur] = useState(0);
    const [totalCop, setTotalCop] = useState(0);
    const [totalVes, setTotalVes] = useState(0);

    // Totales en cada moneda (cambian con cupón: con descuento = effectiveTotal, sin = total)
    const amountForPayment = couponValid ? effectiveTotal : total;
    useEffect(() => {
        if (amountForPayment > 0 && listCoin && listCoin.length > 0) {
            setTotalDollar(amountForPayment / listCoin[0].value);
            setTotalVes(amountForPayment);
            setTotalEur(amountForPayment / listCoin[1].value);
            setTotalCop(amountForPayment * listCoin[2].value);
        } else {
            setTotalDollar(0);
            setTotalEur(0);
            setTotalCop(0);
            setTotalVes(0);
        }
    }, [amountForPayment, listCoin]);

    //Detectar cambios en monedas y sacar totales (total a pagar = effectiveTotal si hay cupón válido)
    useEffect(() => {

        let totalProduct = effectiveTotal;
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
    }, [ves, dollar, eur, cop, pAmmount, tAmmount, pAmmountExtra, effectiveTotal]);

    //Referencia código de producto
    const codeRef = useRef();
    const product = useRef(null);

    //Focus inicial en el codigo de producto
    useEffect(() => {
        if (product.current) {
            product.current.focus(); // Enfoca el campo
        }
    }, []);

    /**
     * Ventas en espera
     * - Guardar en bd y limpiar form
     * - Abrir modal y consultar tabla de ventas en espera
     * - Eliminar o seleccionar ventas en espera
     * - En caso de seleccionar una venta colocarla en el form
     */

    //Modal
    const [modalTicket, setModalTicket] = useState(false);
    //limpiar data de modal de ticket
    const clearModal = () => {
        setModalTicket(false);
    }

    //State de guardado de ticket
    const registeringTicket = useSelector(state => state.ticketFiscal.registering);

    //Guardar ticket
    const saveTicket = () => {

        //limpiar errores del form de producto
        reset();

        if (!names) {
            setModalVisible(true);
            setModalMsg('Ingrese nombre de cliente');
            return;
        }
        if (!document) {
            setModalVisible(true);
            setModalMsg('Ingrese documento de identidad del cliente');
            return;
        }

        // Calcular totales de Base Imponible, IVA y Exento
        let sumBaseImponible = tableSale
            .filter((product) => product.taxed) // Filtrar productos gravados con IVA
            .reduce((acc, product) => acc + product.total / 1.16, 0);

        let sumIva = tableSale
            .filter((product) => product.taxed) // Filtrar productos gravados con IVA
            .reduce((acc, product) => acc + ((product.total / 1.16) * 16) / 100, 0); // IVA correcto

        let sumExento = tableSale
            .filter((product) => product.exempt) // Filtrar productos exentos
            .reduce((acc, product) => acc + product.total, 0);

        let ticket = {

            items: tableSale,
            agency: user.agency.id,
            user: user.id,
            total: total,
            totalWeight: totalWeight,
            invoiceNumber: invoiceNumber ? invoiceNumber : '',
            names: names,
            phone: phone ? phone : '',
            documentType: documentType ? documentType : '',
            document: documentClient,
            isTelesale: watch("isTelesale") ? true : false,
            baseImponible: sumBaseImponible.toFixed(2),
            iva: sumIva.toFixed(2),
            exento: sumExento.toFixed(2),
        }
        if (listCoin && listCoin.length >= 3) {
            ticket.valueDollar = listCoin[0].value;
            ticket.valueEur = listCoin[1].value;
            ticket.valueCop = listCoin[2].value;
        }

        //si hay fila seleccionada o una venta en espera se actualiza
        //de lo contrario se guarda 
        if (rowSelected) {
            dispatch(ticketFiscalActions.updateTicket(rowSelected.id, ticket));

        } else {
            dispatch(ticketFiscalActions.createTicket(ticket));
        }

    }

    //State de eliminacion de ticket
    const deletingTicket = useSelector(state => state.ticketFiscal.deleting);

    //Eliminar ticket
    const removeTicket = (row) => {
        //Sucursal actual
        let agency = {
            id: user.agency.id
        }

        setRowDelete(row.id);
        dispatch(ticketFiscalActions.removeTicket(row.id, agency));
    }

    const statusRegisterTicket = useSelector(state => state.ticketFiscal);
    //Verificar si guardo ticket y limpiar form
    useEffect(() => {
        if (statusRegisterTicket.success) {
            resetScreen();
        }
    }, [statusRegisterTicket.success]);

    const dataTickets = useSelector(state => state.ticketFiscal.data);


    //State de consulta de ticket
    const loadingTickets = useSelector(state => state.ticketFiscal.loading);

    const [dataTicket, setDataTicket] = useState([]);

    //fila a eliminar
    const [rowDelete, setRowDelete] = useState(null);
    //fila seleccionada de ventas en espera
    const [rowSelected, setRowSelected] = useState(null);

    //Verificar data de redux obteniendo resultados
    useEffect(() => {
        if (dataTickets) {
            setDataTicket(dataTickets.results);
        }
    }, [dataTickets]);

    //Verificar data de redux obteniendo resultados luego de eliminación
    const dataTicketsUpdated = useSelector(state => state.ticketFiscal.newData);
    useEffect(() => {

        if (dataTicketsUpdated) {
            //si hay una fila seleccionada y ésta fue eliminada limpio el form
            if (rowSelected) {
                if (rowSelected.id == rowDelete) {
                    resetScreen();
                }
            }
            setDataTicket(dataTicketsUpdated.results);
        }
    }, [dataTicketsUpdated]);

    const isTicketFromSameDay = (createdDate) => createdDate && moment(createdDate).startOf('day').isSame(moment().startOf('day'), 'day');

    //Abrir modal de ticket y consultar listado
    const openModalTicket = () => {
        setModalTicket(true);
        //Consultar por la sucursal
        let agency = {
            id: user.agency.id
        }

        dispatch(ticketFiscalActions.dataTable(agency));
    }

    //Verificar si seleccionó una venta en espera y colocar la data en el form
    useEffect(() => {
        if (rowSelected) {
            //contraer otras opciones
            setCollapses([]);
            setOptionRest(0);
            setTableSale(rowSelected.products);
            setTotal(rowSelected.total);
            rowSelected.totalWeight ? setTotalWeight(rowSelected.totalWeight) : setTotalWeight(0);
            setValue('names', rowSelected.names);
            setValue('phone', rowSelected.phone);
            setValue('document', rowSelected.document);
            setValue('documentType', rowSelected.documentType);
            setValue('invoiceNumber', rowSelected.invoiceNumber);
            setValue('pReferenceExtra', rowSelected.pReferenceExtra);
            setValue('baseImponible', rowSelected.baseImponible || 0);
            setValue('iva', rowSelected.iva || 0);
            setValue('exento', rowSelected.exento || 0);

            // Se obtiene si es televenta o no
            setValue('isTelesale', rowSelected.isTelesale ? rowSelected.isTelesale : '');

            let arrayDocument = [];
            arrayDocument.push(rowSelected.document)
            setSelected(arrayDocument);

        }
    }, [rowSelected]);

    const CustomLoader = () => (<><div className="loading-table"></div></>);

    //Opciones de paginacion
    const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

    //Columnas Data table
    const columns = [
        {
            name: '',
            button: true,
            width: '85px',
            cell: row => {
                const sameDay = isTicketFromSameDay(row.createdDate);
                const isOwnTicketAsTelesales = user?.role === Role.Telesales && row.user != null && String(row.user?.id || row.user) === String(user?.id);
                const canDelete = sameDay || user?.role === Role.Admin || isOwnTicketAsTelesales;
                return <>
                    <Button className="btn-link" color="primary" size="sm" onClick={e => {
                        e.preventDefault();
                        resetSale({ documentType: '', document: '', names: '', phone: '', operator: '', ves: '', dollar: '', eur: '', cop: '', tAmmount: '', tBank: '', tReference: '', pAmmount: '', pAmmountExtra: '', terminalExtra: '', pBank: '', pReference: '', pReferenceExtra: '' });
                        setModalTicket(false);
                        setRowSelected(row);
                    }}><i className="fas fa-pencil-alt" aria-hidden="true"></i>
                    </Button>{' '}
                    {canDelete && (
                        <Button className="btn-link" color="primary" size="sm" onClick={e => {
                            e.preventDefault();
                            removeTicket(row);
                        }}><i className="fa fa-trash" aria-hidden="true"></i>
                        </Button>
                    )}
                </>
            }
        },
        {
            name: 'Ticket',
            selector: 'order',
            sortable: true,
        },
        {
            name: 'Nombres',
            selector: 'names',
            sortable: true,
            wrap: true,
        },
        {
            name: 'Documento de identidad',
            selector: 'document',
            sortable: true,
            wrap: true,
        },
        {
            name: 'Teléfono',
            selector: 'phone',
            sortable: true,
            wrap: true,
        },
        {
            name: 'Fecha de creación',
            selector: 'createdDate',
            sortable: true,
            cell: row => row.createdDate ? moment(row.createdDate).format('DD/MM/YYYY HH:mm:ss') : '—',
        },
        {
            name: 'Monto total',
            selector: 'total',
            sortable: true,
            cell: row => row.total != null ? <NumberFormat value={Number(row.total).toFixed(2)} displayType="text" thousandSeparator="," decimalSeparator="." prefix="Bs " /> : '—',
        },
    ];

    const [filterText, setFilterText] = useState('');
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

    //Retraso 500ms input search
    const debouncedSearchTerm = useDebounce(filterText, 500);

    //Header search del DataTable
    const subHeaderComponentMemo = useMemo(() => {
        const handleClear = () => {
            if (filterText) {
                setResetPaginationToggle(!resetPaginationToggle);
                setFilterText('');
                setDataTicket(dataTickets.results);
            }
        };
        return <FilterComponent onFilter={e => setFilterText(e.target.value)} onClear={handleClear} filterText={filterText} />;
    }, [filterText, resetPaginationToggle]);


    //Filtrar con delay 
    useEffect(() => {
        if (debouncedSearchTerm) {
            setDataTicket(dataTickets.results.filter(item => (
                (item.createdDate && moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
                || (item.names && item.names.toLowerCase().includes(filterText.toLowerCase()))
                || (item.phone && item.phone.toString().toLowerCase().includes(filterText.toLowerCase()))
                || (item.order && item.order.toString().toLowerCase().includes(filterText.toLowerCase()))
                || (item.pReferenceExtra && item.pReferenceExtra.toLowerCase().includes(filterText.toLowerCase()))
            )
            ));
        }
    }, [debouncedSearchTerm]);

    //Data al expandir una fila de venta en espera
    const ExpandedComponent = ({ data }) => (
        <>
            <Table striped responsive>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Peso</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.products && data.products.map((product, index) => {
                        return (
                            <tr key={index}>
                                <td>{product.name}</td>
                                <td><NumberFormat value={product.price.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                <td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                            </tr>
                        )
                    })
                    }
                </tbody>
            </Table>
            <Row xs="12">
                <Col><div className="pull-right">
                    <b>Total: <NumberFormat value={data.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>
                </div>
                </Col>
            </Row>
        </>
    );

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
        let infoSale = dataSale;
        infoSale.changeData = data;
        dispatch(salesFiscalActions.createSaleFiscal(infoSale));
    }

    let typeChange = watchChange("typeChange");

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
        if (users.obtained) {
            setIsLoading(false);
            if (users.list.results && users.list.results.length > 0) {
                setOptions(users.list.results);
            } else {
                setOptions([]);
            }
        } else {
            setIsLoading(false);
        }
    }, [users.obtained]);

    // Bypass client-side filtering by returning `true`. Results are already
    // filtered by the search endpoint, so no need to do it again.
    const filterBy = () => true;

    const handleChange = (selectedOption) => {
        clearErrors(["document", "names"]);
        if (selectedOption.length > 0) {
            const selectedDocument = selectedOption[0].document || ""; // Extraer solo el documento como string
            setValue('document', selectedDocument);
            setValue('names', selectedOption[0].names);
            setValue('phone', selectedOption[0].phone);
        } else {
            setValue('document', "");
        }

        setSelected(selectedOption);
    }

    const [selected, setSelected] = useState([{ document: "0" }]);

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
                                    <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                                        <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Registro de venta especial al Detal</h3>
                                        <Button color="info" size="sm" onClick={() => openModalTicket()}>
                                            <i className="fa fa-list-ul"></i> Tickets en espera
                                        </Button>
                                    </div>
                                    <div>
                                        <Row form>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <h6>{user.agency.name}</h6>
                                                <h6>{user.agency.company}</h6>
                                            </div>
                                            <Col md={4} style={{ textAlign: 'left', marginLeft: '80px' }}>
                                                <FormGroup className="mr-3">
                                                    <Label for="invoiceNumber">Numero de Factura</Label>
                                                    <input
                                                        type="text"
                                                        name="invoiceNumber"
                                                        id="invoiceNumber"
                                                        defaultValue={0}
                                                        className="form-control"
                                                        placeholder="Ingrese el número de factura"
                                                        style={{ width: '100%' }}
                                                        ref={(e) => registerSale(e, { required: 'El número de factura es requerido' })}
                                                    />
                                                    {errors.invoiceNumber && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.invoiceNumber.message}
                                                        </div>
                                                    )}
                                                </FormGroup>
                                            </Col>
                                        </Row>
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
                                    {/* si hay un ticket seleccionado permitir limpiar la pantalla */}
                                    {rowSelected && <Button className="btn-link" style={{ margin: 0, padding: 0, color: 'white' }}
                                        onClick={() => { resetScreen() }}>
                                        <Badge color="info" style={{ fontSize: '1em' }}>ticket {rowSelected.order} <i className="fa fa-times-circle"></i>
                                        </Badge>
                                    </Button>}
                                    <Row form>
                                        <Col md={2}>
                                            <FormGroup>
                                                <Label for="documentType">V, J, E...</Label>
                                                <select
                                                    name="documentType"
                                                    className='form-control'
                                                    ref={registerSale({ required: true })}
                                                >
                                                    <option name="V" value="V">V</option>
                                                    <option name="J" value="J">J</option>
                                                    <option name="E" value="E">E</option>
                                                    <option name="G" value="G">G</option>
                                                    <option name="P" value="P">P</option>
                                                    <option name="R" value="R">R</option>
                                                </select>
                                                {errors.documentType && <div className="invalid-feedback d-block">{errors.documentType.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label for="document">Documento</Label>
                                                <Controller
                                                    name="document"
                                                    defaultValue="0"
                                                    control={controlSale}
                                                    rules={{
                                                        required: "El documento es requerido",
                                                        validate: (value) => {
                                                            // Permitir que "0" sea válido
                                                            if (value === "0") return true;
                                                            return value?.length > 0 || "El documento es requerido";
                                                        },
                                                    }}
                                                    render={({ field }) => (
                                                        <AsyncTypeahead
                                                            clearButton
                                                            allowNew
                                                            defaultSelected={[{ document: "0" }]}
                                                            newSelectionPrefix="Añadir:"
                                                            filterBy={filterBy}
                                                            // ref={clientNamesRef}
                                                            id="async-example"
                                                            isInvalid={errorsSale.document ? true : false}
                                                            isLoading={isLoading}
                                                            minLength={3}
                                                            onSearch={handleSearch}
                                                            useCache={false}
                                                            onChange={(selectedOption) => {
                                                                const selectedDocument = selectedOption.length > 0 ? selectedOption[0]?.document : ""; // Asegurarse de extraer la cadena
                                                                setValue("document", selectedDocument);
                                                                setSelected(selectedOption); // Actualiza el estado local
                                                            }}
                                                            options={[
                                                                { document: "0", names: "Default Option", phone: "0000000000" },
                                                                ...options, // Agrega otras opciones dinámicas
                                                            ]}
                                                            emptyLabel="No hay resultados"
                                                            labelKey="document"
                                                            selected={selected}
                                                        />
                                                    )}
                                                />
                                                {errorsSale.document && <div className="invalid-feedback d-block">{errorsSale.document.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="names">Nombre o Razón Social</Label>
                                                <input
                                                    maxLength="100"
                                                    placeholder="Ingrese el Nombre o Razón Social"
                                                    autoComplete="off"
                                                    defaultValue={'cuenta clave'}
                                                    className={'form-control' + (errorsSale.names ? ' is-invalid' : '')}
                                                    name="names"
                                                    ref={(e) => {
                                                        registerSale(e, { required: "El Nombre O Razón Social es requerido" })
                                                    }}
                                                />

                                                {errorsSale.names && <div className="invalid-feedback d-block">{errorsSale.names.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label for="phone">Teléfono</Label>
                                                <input
                                                    type="text"
                                                    maxLength="50"
                                                    placeholder="Ej: 04141234567"
                                                    autoComplete="tel"
                                                    ref={registerSale({})}
                                                    className={'form-control' + (errorsSale.phone ? ' is-invalid' : '')}
                                                    name="phone"
                                                />
                                                {errorsSale.phone && <div className="invalid-feedback d-block">{errorsSale.phone.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col>
                                            <FormGroup>
                                                <Label for="address">Direccion</Label>
                                                <input
                                                    placeholder="Ingrese la direccion"
                                                    maxLength="100"
                                                    defaultValue={'Merida'}
                                                    autoComplete="off"
                                                    ref={(e) => {
                                                        //clientNamesRef.current = e;
                                                        registerSale(e, { required: "El Nombre O Razón Social es requerido" })
                                                    }}
                                                    className={'form-control'}
                                                    name="address"
                                                />
                                                {errors.address && <div className="invalid-feedback d-block">{errors.address.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    {/* <Row>
                                    <Col md={6}> 
                                    {user.agency.name == "no aplica" && <>
                                        <FormGroup>
                                            <Label  for="operator">Operador</Label>{' '}
                                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            <select 
                                                className={'form-control' + (errorsSale.operator ? ' is-invalid' : '')} 
                                                name="operator"
                                                
                                                ref={registerSale({})}>

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
                                    <Col md={6}> 
                                    {user.agency.name === "no aplica" && <>
                                        <FormGroup> 
                                            <Label for="isTelesale">¿Es televentas?</Label>{' '}
                                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            <select 
                                                className={'form-control' + (errorsSale.isTelesale ? ' is-invalid' : '')} 
                                                name="isTelesale"
                                                ref={registerSale({ 
                                                        
                                                    })}>
                                                   <option key={'No'} name={'No'} value={false}>No</option>
                                                    <option key={'Si'} name={'Si'} value={true}>Si</option>
                                            </select>
                                            {errorsSale.isTelesale && <div className="invalid-feedback d-block">{errorsSale.isTelesale.message}</div>}
                                        </FormGroup>
                                        </>}
                                    </Col>
                                </Row> */}
                                    <Row style={{ display: listSellers.length === 1 ? "none" : '' }}>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="seller">Vendedor</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
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
                                                <input
                                                    type="text"
                                                    maxLength={50}
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.code ? ' is-invalid' : '')}
                                                    name="code"
                                                    ref={(e) => {
                                                        product.current = e;
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
                                                        pattern: {
                                                            value: /^(?=.*\d)\d*(\.\d+)?$/,
                                                            message: "Ingresa un peso válido"
                                                        },
                                                        required: "El peso es requerido",
                                                    }}
                                                    as={<NumberFormat placeholder="Cantidad" className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.kg && <div className="invalid-feedback">{errors.kg.message}</div>}
                                            </FormGroup>
                                            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                                <Button color="info" className="btn-round btn-icon" style={{ marginTop: 0 }}>
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
                                                const status = product.exempt
                                                    ? "E"
                                                    : product.taxed
                                                        ? "G"
                                                        : product.exempt;

                                                return (
                                                    <tr key={index}>
                                                        <td>{product.name} ({status})</td>
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
                                    <Table bordered className={` w-50 ${darkMode ? 'dark-mode' : ''}`}>
                                        <thead>
                                            <tr>
                                                <th>Base Imponible</th>
                                                <th>IVA 16%</th>
                                                <th>Exento</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Calcular totales por factura */}
                                            <tr>
                                                <td className="text-end">
                                                    {/* {tableSale && 
                                                    tableSale
                                                        .filter((product) => product.taxed)  // Filtrar solo los productos con IVA
                                                        .reduce((acc, product) => acc + (product.total / 1.16), 0)  // Calcular Base Imponible
                                                        .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                } */}
                                                    {rowSelected
                                                        ? rowSelected.baseImponible.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                        : tableSale
                                                            .filter((product) => product.taxed)
                                                            .reduce((acc, product) => acc + (product.total / 1.16), 0)
                                                            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    }
                                                </td>
                                                <td className="text-end">
                                                    {rowSelected
                                                        ? rowSelected.iva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                        : tableSale
                                                            .filter((product) => product.taxed)
                                                            .reduce((acc, product) => acc + (((product.total / 1.16) * 16) / 100), 0)
                                                            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    }
                                                </td>
                                                <td className="text-end">
                                                    {rowSelected
                                                        ? rowSelected.exento.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                        : tableSale
                                                            .filter((product) => product.exempt)
                                                            .reduce((acc, product) => acc + product.total, 0)
                                                            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    }
                                                </td>
                                            </tr>
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
                                                            <NumberFormat value={(effectiveTotal / (listCoin[0]?.value || 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} />
                                                        </b>
                                                    </div>
                                                    <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: 4 }}>
                                                        <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                            <NumberFormat value={effectiveTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} />
                                                        </b>
                                                    </div>
                                                    <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', padding: 4 }}>
                                                        <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                            <NumberFormat value={(effectiveTotal * (listCoin[2]?.value || 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Cop '} />
                                                        </b>
                                                    </div>
                                                </div>
                                            )}
                                            {couponValid && total > 0 && listCoin && listCoin.length >= 3 && (
                                                <div className="coupon-discount-preview ml-2">
                                                    <div className="before">
                                                        Sin descuento: $ <NumberFormat value={(total / (listCoin[0]?.value || 1)).toFixed(2)} displayType="text" thousandSeparator={true} />
                                                        {' · '} Bs <NumberFormat value={total.toFixed(2)} displayType="text" thousandSeparator={true} />
                                                        {' · '} Cop <NumberFormat value={(total * (listCoin[2]?.value || 1)).toFixed(2)} displayType="text" thousandSeparator={true} />
                                                    </div>
                                                    <div className="after mt-1">
                                                        Con descuento (5%): $ <NumberFormat value={(effectiveTotal / (listCoin[0]?.value || 1)).toFixed(2)} displayType="text" thousandSeparator={true} />
                                                        {' · '} Bs <NumberFormat value={effectiveTotal.toFixed(2)} displayType="text" thousandSeparator={true} />
                                                        {' · '} Cop <NumberFormat value={(effectiveTotal * (listCoin[2]?.value || 1)).toFixed(2)} displayType="text" thousandSeparator={true} />
                                                    </div>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                    {/*<Row form>
                                        <Col md={5} lg={4}>
                                            <FormGroup>
                                                <div className={`coupon-block ${couponValid ? 'is-valid' : ''} ${couponError ? 'has-error' : ''}`} style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #dee2e6', backgroundColor: couponValid ? '#f0f9f4' : couponError ? '#fff5f5' : '#fafafa' }}>
                                                    <Label for="coupon" style={{ fontWeight: 600, marginBottom: '0.35rem', color: '#495057' }}>Cupón (opcional)</Label>
                                                    <InputGroup style={{ borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                        <Input
                                                            id="coupon"
                                                            type="text"
                                                            placeholder="Ej: 01, 02, 10, 100..."
                                                            value={couponCodeInput}
                                                            onChange={(e) => { setCouponCodeInput(e.target.value); setCouponError(''); }}
                                                            disabled={!canUseCoupon}
                                                            style={{ borderRight: 0, minWidth: 140 }}
                                                        />
                                                        <InputGroupAddon addonType="append">
                                                            <Button type="button" color="primary" onClick={handleValidateCoupon} disabled={!canUseCoupon || validatingCoupon} style={{ fontWeight: 600 }}>
                                                                {validatingCoupon ? <Spinner size="sm" /> : 'Validar'}
                                                            </Button>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                    {!canUseCoupon && total > 0 && <div className="small mt-1" style={{ color: '#6c757d' }}>Disponible en compras de $10 o más</div>}
                                                    {couponError && <div className="small mt-1" style={{ color: '#c62828' }}>{couponError}</div>}
                                                    {couponValid && !couponError && <div className="small mt-1" style={{ color: 'var(--eliter-green, #328a6c)', fontWeight: 500 }}>✓ Cupón válido — 5% de descuento aplicado</div>}
                                                </div>
                                            </FormGroup>
                                        </Col>
                                    </Row>*/}
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
                                                        {terminaList && terminaList
                                                            .map(list =>
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
                                                        min={0}
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

                                                        <b style={{ fontSize: 18 }}>Total <NumberFormat value={effectiveTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs:  ' /> /  </b>
                                                        <b style={{ fontSize: 18 }}> <NumberFormat value={(effectiveTotal / listCoin[0].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$:    ' /> /  </b>
                                                        <b style={{ fontSize: 18 }}> <NumberFormat value={(effectiveTotal * listCoin[2].value).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop:  ' /></b>
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
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.ves ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.ves && <div className="invalid-feedback">{errorsSale.ves.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-3">
                                                    <Label for="dollar">$ Dólares <b>{<NumberFormat value={totalDollar.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="dollar"
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.dollar && <div className="invalid-feedback">{errorsSale.dollar.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-3">
                                                    <Label for="eur">€ Euros <b>{<NumberFormat value={totalEur.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="eur"
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
                                                        as={<NumberFormat className={'form-control' + (errorsSale.eur ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errorsSale.eur && <div className="invalid-feedback">{errorsSale.eur.message}</div>}
                                                </FormGroup>
                                                <FormGroup className="col-md-3">
                                                    <Label for="cop">$ Pesos <b>{<NumberFormat value={totalCop.toFixed(2)} displayType={'text'} thousandSeparator={true} />}</b></Label>
                                                    <Controller
                                                        name="cop"
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
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
                                                        rules={{
                                                            min: {
                                                                value: 0,
                                                                message: "El valor no puede ser negativo"
                                                            },
                                                        }}
                                                        control={controlSale}
                                                        disabled={total == 0 ? true : false}
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
                                                        <option key="Principal" name="Principal" value="Principal">Principal</option>
                                                        <option key="EMBUTIDOS MOHAN" name="EMBUTIDOS MOHAN" value="EMBUTIDOS MOHAN">Personal - BICENTENARIO</option>
                                                        {/* Ocultar resto de transferencias */}
                                                        {/* <option key="DANIEL PERSONAL" name="DANIEL PERSONAL" value="DANIEL PERSONAL">DANIEL PERSONAL</option> */}
                                                        {/* <option key="DELICATESES MOMOY" name="DELICATESES MOMOY" value="DELICATESES MOMOY">DELICATESES MOMOY</option> */}
                                                        {/* <option key="DELICATESES ENMANUEL" name="DELICATESES ENMANUEL" value="DELICATESES ENMANUEL">DELICATESES EMMANUEL</option> */}
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
                                                        <Label for="pReferenceExtra">Punto</Label>
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
                                                <Button color="info" disabled={registering || registeringTicket}>

                                                    {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    Cobrar
                                                </Button>{' '}
                                                <Button color="info" onClick={() => { saveTicket() }} disabled={total == 0 || registering || registeringTicket}>
                                                    {registeringTicket && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    <i className="fa fa-clock" aria-hidden="true"></i> En espera
                                                </Button>
                                            </Col>
                                            <Col>
                                                <div color="info" className="pull-right">
                                                    <Button onClick={e => { e.preventDefault(); history.goBack(); }}>Cancelar</Button>
                                                </div>
                                            </Col>
                                        </Row>
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
                            {/* Moda de tickets */}
                            <Modal toggle={() => { clearModal() }} isOpen={modalTicket} className={`modal-lg ${darkMode ? "dark-mode" : ""}`} backdrop="static">
                                <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                    <h5 className="modal-title" id="examplemodalMsgLabel">Ventas en espera</h5>
                                    <button aria-label="Close" className="close" type="button" onClick={() => { clearModal() }} disabled={loadingTickets || deletingTicket}>
                                        <span aria-hidden={true}>×</span>
                                    </button>
                                </div>
                                <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                                    <Row>
                                        <Col>
                                            <DataTable
                                                className="dataTables_wrapper"
                                                responsive
                                                highlightOnHover
                                                expandableRows
                                                expandableRowsComponent={<ExpandedComponent />}
                                                sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
                                                title="Ventas en espera"
                                                progressPending={loadingTickets || deletingTicket}
                                                paginationComponentOptions={paginationOptions}
                                                progressComponent={<CustomLoader />}
                                                noDataComponent="No hay registros para mostrar"
                                                noHeader={true}
                                                columns={columns}
                                                data={dataTicket}
                                                pagination
                                                paginationResetDefaultPage={resetPaginationToggle}
                                                subHeader
                                                subHeaderComponent={subHeaderComponentMemo}
                                                persistTableHead
                                                expandOnRowClicked
                                                theme={darkMode ? "dark" : "default"}
                                            />
                                            {deletingTicket && <div className="d-flex justify-content-center">Por favor espere</div>}
                                        </Col>
                                    </Row>
                                </div>
                                <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                                    <Button color="secondary" type="button" onClick={() => { clearModal() }} disabled={loadingTickets || deletingTicket}>Cerrar</Button>
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

export default SalesFiscalCreatePage;
