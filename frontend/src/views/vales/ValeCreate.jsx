/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, ticketActions, userActions, agencyActions, productActions } from '../../actions';
import pendingValesActions from '../../actions/pendingVales.actions';
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
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';


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

function valesCreatePage() {

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
  const { darkMode } = useDarkMode();

  //usuario
  const user = useSelector(state => state.authentication.user);
  const productsState = useSelector(state => state.products);
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
  const sales = useSelector(state => state.sales);            //  Informacion de las ventas al Detal

  //Obtener monedas, productos y terminales de sucursal
  useEffect(() => {
    dispatch(salesActions.salesDataForm(user.agency.id));
  }, []);

  useEffect(() => {
    if (user?.id) dispatch(productActions.combosGetAll());
  }, [user?.id, dispatch]);

  // Cargar tickets en espera al montar
  useEffect(() => {
    if (user?.agency?.id) {
      dispatch(ticketActions.dataTableWholesale({ id: user.agency.id }));
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

  // Tasas por nombre de moneda para evitar depender del orden de `listCoin`.
  const normalizeCoinName = (s = '') =>
    String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const dolarCoin = (listCoin || []).find((c) => normalizeCoinName(c?.name).includes('dolar'));
  const eurCoin = (listCoin || []).find((c) => normalizeCoinName(c?.name).includes('euro'));
  const copCoin = (listCoin || []).find((c) =>
    ['cop', 'pesos'].some((k) => normalizeCoinName(c?.name).includes(k))
  );
  const valueDollar = Number(dolarCoin?.value ?? listCoin?.[0]?.value ?? 0) || 0;
  const valueEur = Number(eurCoin?.value ?? listCoin?.[1]?.value ?? 0) || 0;
  const valueCop = Number(copCoin?.value ?? listCoin?.[2]?.value ?? 0) || 0;


  //Form Tabla (código + cantidad)
  const { handleSubmit, register, errors, reset, control, setValue: setProductLineValue, clearErrors: clearProductLineErrors } = useForm();
  //Form resgistrar venta
  const { handleSubmit: handleSubmitSale, register: registerSale, trigger, errors: errorsSale, reset: resetSale, control: controlSale, watch, setValue, clearErrors } = useForm();
  const { handleSubmit: handleSubmitChange, register: registerChange, errors: errorsChange, reset: resetChange, control: controlChange, watch: watchChange } = useForm();

  //State de guardado
  const registering = useSelector(state => state.sales.registering);

  //Tabla de productos añadidos
  const [tableSale, setTableSale] = useState([]);
  //Total de los productos
  const [total, setTotal] = useState(0);
  //Total de los productos en dolares
  const [totalDollars, setTotalDollars] = useState(0);
  //Total en peso de los productos
  const [totalWeight, setTotalWeight] = useState(0);


  // CÓDIGO PARA EL DESCUENTO
  //Total en Bs de la venta al aplicarle el descuento al mayor 
  const [totalWithoutDiscount, setTotalWithoutDiscount] = useState(0);
  //Total anterior en Dólares
  const [totalDollarsWithoutDiscount, setTotalDollarsWithoutDiscount] = useState(0);
  // Si aplica para un descuento por llevar algun producto al mayor
  const [appliedWholesaleDiscount, setAppliedWholesaleDiscount] = useState(false);


  //Modal genérico y mensaje
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  // Catálogo emergente (productos / combos), mismo criterio que registro de ventas al detal
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogFilterText, setCatalogFilterText] = useState('');
  const [catalogType, setCatalogType] = useState('products');
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

  const selectProductFromCatalog = (product) => {
    setProductLineValue('code', String(product.code ?? ''));
    clearProductLineErrors('code');
    focusKgAfterCatalogCloseRef.current = true;
    setCatalogModalOpen(false);
    setCatalogFilterText('');
  };

  //Añadir producto a tabla (incluye combos al detal: mismo criterio que venta al detal, sin bloqueo por código)
  const onCreateData = (data, e) => {

    const codeInput = String(data.code ?? '').trim();
    let productFilter = listProducts.filter(item => String(item.code ?? '').trim() === codeInput);

    if (productFilter.length == 0) {
      setModalVisible(true);
      setModalMsg('No se encontró el producto');
    } else {

      const p = productFilter[0];

      //Obtener ofertas si existen
      var offer = null;
      if (offerProducts && offerProducts.length > 0) {
        offer = offerProducts.find(item => {
          return String(item.product?.code ?? '').trim() === codeInput;
        })
      }

      // Precio: oferta en Bs si aplica; si no, precio catálogo (USD) × tasa (combos y productos al detal)
      let priceProductDollars = p.price;
      let priceProduct = p.price * valueDollar;
      if (offer) {
        priceProduct = offer.price;
        priceProductDollars = valueDollar > 0 ? offer.price / valueDollar : 0;
      }

      if (!priceProduct || priceProduct <= 0) {
        setModalVisible(true);
        setModalMsg('El producto o combo no tiene un precio válido');
        return;
      }

      // Se verifica que no se ingresen numeros decimales en productos por unidad
      if (p.presentation === "Unidades") {
        if (data.kg != Math.round(data.kg)) {
          setModalVisible(true);
          setModalMsg(p.name + ' se vende por unidades, por lo que sólo se debe ingresar numeros enteros');
          return
        }
      }

      const target = { ...p };
      const source = {
        kg: parseFloat(data.kg),
        price: parseFloat(priceProduct.toFixed(2)),
        regularPrice: offer ? p.price : p.price,
        wholesalePrice: parseFloat(priceProductDollars),
        wholesalePriceBs: parseFloat(priceProductDollars),
        isWholesale: false,
        isOffer: !!offer,
        total: parseFloat(data.kg) * parseFloat(priceProduct.toFixed(2)),
        totalDollars: parseFloat(data.kg) * parseFloat(priceProductDollars),
        applyWholesaleDiscount: p.applyWholesaleDiscount,
        wholesaleDiscountPrice: parseFloat(p.wholesaleDiscountPrice),
        wholesaleDiscountPriceBs: parseFloat(p.wholesaleDiscountPrice)
      };

      //Añadir al array de productos
      let preSale = tableSale;
      preSale.unshift(Object.assign(target, source));
      setTableSale(preSale);
      setTotal(0);
      setTotalDollars(0);
      setTotalWithoutDiscount(0)
      setTotalDollarsWithoutDiscount(0);
      setTotalWeight(0);//total de peso
      var sum = 0;
      var sumDollars = 0;
      var sumWithoutDiscount = 0;
      var sumDollarsWithoutDiscount = 0;
      var sumWeight = 0;

      // Se verifica si alguno de los productos aplica para el descuento 
      let applyWholesaleDiscount = preSale.some((product) => (product.applyWholesaleDiscount === true));
      setAppliedWholesaleDiscount(applyWholesaleDiscount);

      preSale.map((product) => {
        sum += product.total;
        sumDollars += product.totalDollars;
        // En principio ambas sumatorias serán iguales, a menos de que haya un descuento en algún producto
        sumWithoutDiscount += parseFloat(product.kg) * parseFloat(product.price);
        sumDollarsWithoutDiscount += parseFloat(product.kg) * parseFloat(product.wholesalePrice != null && product.wholesalePrice !== '' ? product.wholesalePrice : product.price);

        //buscar si el producto tiene un peso calcuado de bolsa
        const getWeight = WeightProduct.find(prod => prod.code == product.code);
        if (getWeight) {
          sumWeight += product.kg * getWeight.weight;
        } else {
          sumWeight += product.kg;
        }
      })

      // Siempre se guardarán inicialmente los valores sin descuento
      setTotal(sum);
      setTotalDollars(sumDollars);

      setTotalWithoutDiscount(sumWithoutDiscount)
      setTotalDollarsWithoutDiscount(sumDollarsWithoutDiscount);

      setTotalWeight(sumWeight);
      //setear por defecto el total en punto
      setValue('pAmmount', sum.toFixed(2));

      //focus en el codigo nuevamente
      codeRef.current.focus();
      //resetear form
      reset({
        code: '',
        kg: ''
      });
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
    data.totalDollar = totalDollar;
    data.totalWeight = totalWeight;//total peso
    // Usar tasa del ticket si existe (creado tras cierre); si no, tasa actual
    if (rowSelected && rowSelected.valueDollar != null) {
      data.valueDollar = Number(rowSelected.valueDollar).toFixed(2);
      data.valueEur = rowSelected.valueEur != null ? Number(rowSelected.valueEur).toFixed(2) : valueEur.toFixed(2);
      data.valueCop = rowSelected.valueCop != null ? Number(rowSelected.valueCop).toFixed(2) : valueCop.toFixed(2);
    } else {
      data.valueDollar = valueDollar.toFixed(2);
      data.valueEur = valueEur.toFixed(2);
      data.valueCop = valueCop.toFixed(2);
    }

    //  Ya que es una venta al mayor
    data.isWholesale = true;
    data.type = 10 // ver sales.enum.js en el backend

    //Si es un ticket se envia para eliminarlo 
    data.idTicket = rowSelected ? rowSelected.id : null;

    // Si es televentas
    //data.isTelesale = watch("isTelesale") ? true : false

    // Si está pagando de contado y tiene un producto especial, aplica para el descuento
    data.appliedWholesaleDiscount = appliedWholesaleDiscount;

    // Se elimina el campo de operador si no se necesitó
    if (data.operator === 'No necesitó operador') {
      delete data.operator
    }

    // Se elimina el campo seller si está vacío para evitar error de ObjectId
    if (!data.seller || data.seller === '') {
      delete data.seller
    }

    //limpiar banco en tra
    if (data.tAmmount == "") {
      data.tBank = "";
    }
    //Guardar venta
    if (exceeded > 0) {
      setDataSale(data);
      setModalChange(true);
    } else {
      dispatch(salesActions.createSale(data));
    }
  };

  //  Registrar crédito

  const onRegisterCredit = async (data) => {


    //limpiar errores del form de producto
    reset();


    const triggerResponse = await trigger(["documentType", "document", "businessName", "names", "pReferenceExtra", "clientType", "taxpayer", "phone", "address", "comment"]);


    //  Se verifica que todos los valores referentes al cliente estén correctos
    if (!triggerResponse) {
      setModalVisible(true);
      setModalMsg('Debe verificar que todos los datos hayan sido ingresados');
      return;
    }

    if ((!data.documentType) || (!data.document) || (!data.names) || (!data.clientType) || (!data.phone) || (!data.address)) {
      setModalVisible(true);
      setModalMsg('Debe ingresar todos los datos');
      return;
    }

    if (total == 0 || tableSale.length == 0) {
      setModalMsg('Debe ingresar al menos un producto');
      setModalVisible(true);
      return;
    }

    data.user = user.id;
    data.agency = user.role === 3 ? user.agency.id : data.agency;
    data.items = tableSale;
    data.total = totalWithoutDiscount;              // Sin el descuento por ventas al mayor, si aplica
    data.totalDollar = totalDollarsWithoutDiscount  // Sin el descuento por ventas al mayor, si aplica
    data.totalWeight = totalWeight;//total peso

    // Usar tasa del ticket si existe (creado tras cierre); si no, tasa actual
    if (rowSelected && rowSelected.valueDollar != null) {
      data.valueDollar = Number(rowSelected.valueDollar).toFixed(2);
      data.valueEur = rowSelected.valueEur != null ? Number(rowSelected.valueEur).toFixed(2) : valueEur.toFixed(2);
      data.valueCop = rowSelected.valueCop != null ? Number(rowSelected.valueCop).toFixed(2) : valueCop.toFixed(2);
    } else {
      data.valueDollar = valueDollar.toFixed(2);
      data.valueEur = valueEur.toFixed(2);
      data.valueCop = valueCop.toFixed(2);
    }

    //  Ya que es una venta al mayor
    data.isWholesale = false;

    //  Ya que es un credito
    data.isCredit = true;
    data.type = 12 // ver sales.enum.js en el backend

    //  El cliente ya pasa a NO ser solvente
    data.isSolvent = true;

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

    // Se elimina el campo de operador si no se necesitó
    if (data.operator === 'No necesitó operador') {
      delete data.operator
    }

    // Se elimina el campo seller si está vacío para evitar error de ObjectId
    if (!data.seller || data.seller === '') {
      delete data.seller
    }

    //  Se vuelven cero los valores no relevantes para un crédito o que pueden ser introducidos por error

    data.ves = '';
    data.cop = '';
    data.dollar = '';
    data.eur = '';
    data.pAmmount = '';
    data.pAmmountExtra = '';
    data.pReference = '';
    data.pReferenceExtra = '';
    data.tAmmount = '';
    data.tReference = '';
    data.terminal = '';
    data.terminalExtra = '';

    //Si es un ticket se envia para eliminarlo 
    data.idTicket = rowSelected ? rowSelected.id : null;
    //  Crear crédito
    dispatch(pendingValesActions.pendingValesCreate(data));
  };

  //Quitar elemento de la tabla
  const removeItem = (prod) => {

    let preSale = tableSale;
    const index = preSale.indexOf(prod);
    // Nota: se mantenían cálculos de tasa sin uso; no afecta la suma.

    if (index !== -1) {
      preSale.splice(index, 1);
      setTableSale([...preSale])
    }

    let sum = 0;
    var sumDollars = 0;
    let sumWithoutDiscount = 0;
    var sumDollarsWithoutDiscount = 0;
    var sumWeight = 0;

    // Se verifica si alguno de los productos aplica para el descuento 
    let applyWholesaleDiscount = preSale.some((product) => (product.applyWholesaleDiscount === true));
    setAppliedWholesaleDiscount(applyWholesaleDiscount);

    preSale.map((product) => {
      sum = sum + parseFloat(product.total);
      sumDollars += product.totalDollars;
      // En principio ambas sumatorias serán iguales, a menos de que haya un descuento en algún producto
      sumWithoutDiscount += parseFloat(product.kg) * parseFloat(product.price);
      sumDollarsWithoutDiscount += parseFloat(product.kg) * parseFloat(product.wholesalePrice != null && product.wholesalePrice !== '' ? product.wholesalePrice : product.price);
      //buscar si el producto tiene un peso calcuado de bolsa
      const getWeight = WeightProduct.find(prod => prod.code == product.code);
      if (getWeight) {
        sumWeight += product.kg * getWeight.weight;
      } else {
        sumWeight += product.kg;
      }
    })

    setTotal(sum);
    setTotalDollars(sumDollars);

    setTotalWithoutDiscount(sumWithoutDiscount)
    setTotalDollarsWithoutDiscount(sumDollarsWithoutDiscount);

    setTotalWeight(sumWeight);
    //setear por defecto el total en punto
    setValue('pAmmount', sum.toFixed(2));

  }

  //Función para limpiar pantalla
  const resetScreen = () => {
    resetSale({ names: '', clientType: '', phone: '', comment: '', seller: listSellers[0] ? listSellers[0].id : '', ves: '', dollar: '', eur: '', cop: '', tAmmount: '', tBank: '', tReference: '', pAmmount: '', pAmmountExtra: '', terminalExtra: '', pBank: '', pReference: '', pReferenceExtra: '', autorize: 'Baltazar', agency: '' });
    setTotal(0);
    setTotalDollars(0);
    setTotalWithoutDiscount(0)
    setTotalDollarsWithoutDiscount(0);
    setAppliedWholesaleDiscount(false);
    setTotalWeight(0);
    setTableSale([]);
    setRowSelected(null);
    setRowDelete(null);
    // clientNamesRef.current.clear();
    // clientNamesRef.current.focus();
    setSelected([]);
  }

  const statusRegister = useSelector(state => state.sales);
  const statusRegisterPendingVales = useSelector(state => state.pendingVales);
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

  useEffect(() => {
    if (statusRegisterPendingVales.success) {
      resetScreen();
      setModalChange(false);
      setDataSale(null);
      // clientNamesRef.current.clear();
      // clientNamesRef.current.focus();
    }
  }, [statusRegisterPendingVales.success]);

  //Data de los forms
  let pos = watch("terminal");
  let tAmmount = watch("tAmmount");
  let ves = watch("ves");
  let dollar = watch("dollar");
  let eur = watch("eur");
  let cop = watch("cop");
  let pAmmount = watch("pAmmount");
  // let clientCode = watch("clientCode");
  let documentType = watch("documentType");
  let documentClient = watch("document");
  let businessName = watch("businessName");
  let names = watch("names");
  let clientType = watch("clientType");
  let taxpayer = watch("taxpayer");
  let phone = watch("phone");
  let address = watch("address");
  let comment = watch("comment");
  let isSolvent = watch("isSolvent");
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
        setValue('pAmmount', total.toFixed(2));
      }
    } else {
      setValue('tBank', 'Principal');
    }
  }, [collapses]);

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
  const [totalVes, setTotalVes] = useState(0);
  const [totalEur, setTotalEur] = useState(0);
  const [totalCop, setTotalCop] = useState(0);

  //Sacar totales en monedas extranjeras
  useEffect(() => {
    if (total > 0 && listCoin && listCoin.length > 0) {
      setTotalDollar(valueDollar > 0 ? total / valueDollar : 0);
      setTotalVes(total);
      setTotalEur(valueEur > 0 ? total / valueEur : 0);
      setTotalCop(valueDollar > 0 ? (total / valueDollar) * valueCop : 0);
    } else {
      setTotalDollar(0);
      setTotalVes(0);
      setTotalEur(0);
      setTotalCop(0);
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
      let dollarPrice = valueDollar;
      let conversion = parseFloat(dollar.replace(/,/g, '')) * parseFloat(dollarPrice);
      subTot += conversion;
    }
    if (eur && eur.length > 0 && listCoin && listCoin.length > 0) {
      let eurPrice = valueEur;
      let conversion = parseFloat(eur.replace(/,/g, '')) * parseFloat(eurPrice);
      subTot += conversion;
    }
    if (cop && cop.length > 0 && listCoin && listCoin.length > 0) {
      let copPrice = valueCop;
      let conversion =
        valueCop > 0 ? (parseFloat(cop.replace(/,/g, '')) / parseFloat(copPrice)) * valueDollar : 0;
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
  }, [ves, dollar, eur, cop, pAmmount, tAmmount, pAmmountExtra]);

  //Referencia código de producto y cantidad
  const codeRef = useRef();
  const kgInputRef = useRef();
  const clientNamesRef = useRef();

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
  // useEffect(() => {
  //   clientNamesRef.current.focus();
  // }, []);

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
  const registeringTicket = useSelector(state => state.ticket.registering);

  // State para el guardado un nuevo crédito
  const registeringPendingVales = useSelector(state => state.pendingVales.registering);

  //State de eliminacion de ticket
  const deletingTicket = useSelector(state => state.ticket.deleting);

  //Eliminar ticket
  const removeTicket = (row) => {
    //Sucursal actual
    let agency = {
      id: user.agency.id
    }
    setRowDelete(row.id);
    dispatch(ticketActions.removeTicket(row.id, agency));
  }

  const statusRegisterTicket = useSelector(state => state.ticket);
  //Verificar si guardo ticket y limpiar form
  useEffect(() => {
    if (statusRegisterTicket.success) {
      resetScreen();
    }
  }, [statusRegisterTicket.success]);

  const dataTickets = useSelector(state => state.ticket.data);
  //State de consulta de ticket
  const loadingTickets = useSelector(state => state.ticket.loading);
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
  const dataTicketsUpdated = useSelector(state => state.ticket.newData);
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
    dispatch(ticketActions.dataTableWholesale(agency));
  }

  //Verificar si seleccionó una venta en espera y colocar la data en el form
  useEffect(() => {
    if (rowSelected) {

      // setValue('clientCode', rowSelected.clientCode);
      setValue('documentType', rowSelected.documentType);
      setValue('businessName', rowSelected.businessName);
      setValue('document', rowSelected.document);
      setValue('names', rowSelected.names);
      setValue('clientType', rowSelected.clientType);
      setValue('taxpayer', rowSelected.taxpayer);
      setValue('phone', rowSelected.phone);
      setValue('address', rowSelected.address);
      setValue('comment', rowSelected.comment);
      setValue('isSolvent', rowSelected.isSolvent);

      // Se obtiene si es televenta o no
      setValue('isTelesale', rowSelected.isTelesale ? rowSelected.isTelesale : '');


      //contraer otras opciones
      setCollapses([]);
      setOptionRest(0);
      setTableSale(rowSelected.products);

      // Se setean los totales, teniendo en cuenta si alguno de los productos aplica para el descuento al mayor
      let applyWholesaleDiscount = rowSelected.products.some((product) => (product.applyWholesaleDiscount === true));
      setAppliedWholesaleDiscount(applyWholesaleDiscount);

      var sum = 0;
      var sumDollars = 0;
      var sumWithoutDiscount = 0;
      var sumDollarsWithoutDiscount = 0;
      var sumWeight = 0;

      rowSelected.products.map((product) => {
        sum += product.total;
        sumDollars += product.totalDollars;
        // En principio ambas sumatorias serán iguales, a menos de que haya un descuento en algún producto
        sumWithoutDiscount += parseFloat(product.kg) * parseFloat(product.price);
        sumDollarsWithoutDiscount += parseFloat(product.kg) * parseFloat(product.wholesalePrice != null && product.wholesalePrice !== '' ? product.wholesalePrice : product.price);

        //buscar si el producto tiene un peso calcuado de bolsa
        const getWeight = WeightProduct.find(prod => prod.code == product.code);
        if (getWeight) {
          sumWeight += product.kg * getWeight.weight;
        } else {
          sumWeight += product.kg;
        }
      })

      // Siempre se guardarán inicialmente los valores sin descuento
      setTotal(sum);
      setTotalDollars(sumDollars);

      setTotalWithoutDiscount(sumWithoutDiscount)
      setTotalDollarsWithoutDiscount(sumDollarsWithoutDiscount);

      //setear por defecto el total en punto
      setValue('pAmmount', sum.toFixed(2));

      rowSelected.totalWeight ? setTotalWeight(rowSelected.totalWeight) : setTotalWeight(0);

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
            resetSale({ documentType: '', document: '', names: '', businessName: '', clientType: '', taxpayer: '', phone: '', address: '', comment: '', isSolvent: '', seller: listSellers[0] ? listSellers[0].id : '', ves: '', dollar: '', eur: '', cop: '', tAmmount: '', tBank: '', tReference: '', pAmmount: '', pAmmountExtra: '', terminalExtra: '', pBank: '', pReference: '', pReferenceExtra: '' });
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
    {
      name: 'Status',
      selector: 'isSolvent',
      sortable: false,
      center: true,
      cell: row => {
        return <>
          <Badge
            color={row.isSolvent ? "success" : "danger"}
            pill className="h8 p-2 mt-1">
            {
              row.isSolvent ? "SOLVENTE" : "PENDIENTE"
            }
          </Badge>
        </>
      }
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
            <th>Precio unit. (Bs)</th>
            <th>Peso</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.products && data.products.map((product, index) => {
            return (
              <tr key={index}>
                <td>{product.name}</td>
                <td><NumberFormat value={(product.kg > 0 ? product.total / product.kg : product.price).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix="Bs " /></td>
                <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                <td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix="Bs " /></td>
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
      setTotalDollarChange(valueDollar > 0 ? exceeded / valueDollar : 0);
      setTotalEurChange(valueEur > 0 ? exceeded / valueEur : 0);
      setTotalCopChange(valueDollar > 0 ? (exceeded / valueDollar) * valueCop : 0);
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
    dispatch(salesActions.createSale(infoSale));
  }

  let typeChange = watchChange("typeChange");

  /**
   * Busqueda autocompletado
   * 
   */

  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

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
      // setValue('clientCode', selectedOption[0].clientCode);
      setValue('documentType', selectedOption[0].documentType);
      setValue('businessName', selectedOption[0].businessName);
      setValue('document', selectedOption[0].document);
      setValue('names', selectedOption[0].names);
      setValue('clientType', selectedOption[0].clientType);
      setValue('taxpayer', selectedOption[0].taxpayer);
      setValue('phone', selectedOption[0].phone);
      setValue('address', selectedOption[0].address);
      setValue('comment', selectedOption[0].comment);
      setValue('isSolvent', selectedOption[0].isSolvent);
    }

    setSelected(selectedOption);
  }

  const [selected, setSelected] = useState([]);

  //obtener sucursales para select
  const gettingAgency = useSelector(state => state.agencies.getting);
  const agencies = useSelector(state => state.agencies);
  useEffect(() => {
    dispatch(agencyActions.listAgencies());
  }, []);

  const [listAgencies, setListAgencies] = useState(null);


  useEffect(() => {
    if (agencies.obtained) {
      setListAgencies(agencies.list);
    }
  }, [agencies.obtained]);

  const agencyWatch = watch('agency');
  useSyncFirstAgencyFormField(listAgencies, setValue, agencyWatch);

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
                            <b><NumberFormat value={valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                          </div>
                        )}
                        {valueEur > 0 && (
                          <div style={{ fontSize: '0.9em' }}>
                            Euro a {' '}
                            <b><NumberFormat value={valueEur.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                          </div>
                        )}
                        {valueCop > 0 && (
                          <div style={{ fontSize: '0.9em' }}>
                            Pesos a {' '}
                            <b><NumberFormat value={valueCop.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Registro de vale al detal</h3>
                    {/* <Button color="primary" size="sm" onClick={() => openModalTicket()}>
                      <i className="fa fa-list-ul"></i> Tickets en espera
                    </Button> */}
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
                    <Col md={3}>
                      <FormGroup>
                        <Label for="names">Nombre</Label>
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
                        <Label for="clientType">Tipo de cliente</Label>
                        <select
                          name="clientType"
                          className={'form-control' + (errorsSale.clientType ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option name="" value=""></option>
                          <option name="Seniat" value="Seniat">Seniat</option>
                           <option name="Cliente" value="Cliente">Cliente</option>
                          <option name="Bomberos" value="Bomberos">Bomberos</option>
                          <option name="Alquiler" value="Alquiler">Alquiler</option>
                          <option name="Corpoelec" value="Corpoelec">Corpoelec</option>
                          <option name="Guardias" value="Guardias">Guardias</option>
                          <option name="Otros" value="Otros">Otros</option>
                        </select>
                        {errorsSale.clientType && <div className="invalid-feedback d-block">{errorsSale.clientType.message}</div>}

                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="phone">Telefono</Label>
                        <input
                          maxLength="1000000"
                          autoComplete="off"
                          ref={registerSale({ required: "El teléfono es requerido" })}
                          className={'form-control' + (errors.phone ? ' is-invalid' : '')}
                          name="phone"
                        />
                        {errorsSale.phone && <div className="invalid-feedback d-block">{errorsSale.phone.message}</div>}
                      </FormGroup>
                    </Col>
                    <div style={{
                      display: 'none',
                    }}>
                      <Col md={3.5}>
                        <FormGroup>
                          <Label for="document">Documento</Label>
                          <input
                            maxLength="100"
                            autoComplete="off"
                            className={'form-control' + (errors.document ? ' is-invalid' : '')}
                            name="document"
                            defaultValue='123456'
                            ref={(e) => {
                              //clientNamesRef.current = e;
                              registerSale(e, { required: "El documento es requerido" })
                            }}
                          />

                          {errorsSale.comment && <div className="invalid-feedback d-block">{errorsSale.comment.message}</div>}
                        </FormGroup>

                      </Col>
                      <Col md={1.5}>
                        <FormGroup>
                          <Label for="documentType">V, J, E...</Label>
                          <select
                            name="documentType"
                            className={'form-control' + (errorsSale.documentType ? ' is-invalid' : '')}
                            ref={registerSale({ required: true })}
                          >
                            <option name="V" value="V">V</option>
                            <option name="J" value="J">J</option>
                            <option name="E" value="E">E</option>
                            <option name="G" value="G">G</option>
                            <option name="P" value="P">P</option>
                            <option name="R" value="R">R</option>
                          </select>
                          {errorsSale.documentType && <div className="invalid-feedback d-block">{errorsSale.documentType.message}</div>}
                        </FormGroup>
                      </Col>

                      {/* <Col md={2}>
                      <FormGroup>
                        <Label for="clientCode">Código</Label>
                        <input
                          type= "number"
                          maxLength="100"
                          autoComplete="off"
                          className={'form-control' + (errors.clientCode ? ' is-invalid' : '')}
                          name="clientCode"
                          ref={(e) => {
                            //clientNamesRef.current = e;
                            registerSale(e, { required: "El código es requerido" })
                          }}
                        />

                        {errorsSale.clientCode && <div className="invalid-feedback d-block">{errorsSale.clientCode.message}</div>}
                      </FormGroup>
                    </Col> */}
                      <Col md={3}>
                        <FormGroup>
                          <Label for="businessName">Razon social</Label>
                          <input
                            maxLength="100"
                            autoComplete="off"
                            className={'form-control' + (errors.businessName ? ' is-invalid' : '')}
                            name="businessName"
                            defaultValue='Razon Social'
                            ref={(e) => {
                              //clientNamesRef.current = e;
                              registerSale(e, { required: "El nombre del negocio es requerido" })
                            }}
                          />
                          {errorsSale.businessName && <div className="invalid-feedback d-block">{errorsSale.businessName.message}</div>}
                        </FormGroup>
                      </Col>

                      <Col md={3}>
                        <FormGroup>
                          <Label for="taxpayer">Contribuyente</Label>
                          <select
                            name="taxpayer"
                            className={'form-control' + (errorsSale.taxpayer ? ' is-invalid' : '')}
                            ref={registerSale({ required: true })}
                          >
                            <option name="Especial" value="Especial">Especial</option>
                            <option name="Ordinario" value="Ordinario">Ordinario</option>

                          </select>
                          {errorsSale.taxpayer && <div className="invalid-feedback d-block">{errorsSale.taxpayer.message}</div>}

                        </FormGroup>
                      </Col>

                    </div>

                  </Row>
                  <div style={{
                    display: 'none',
                  }}>
                    <Row>
                      <Col>
                        <FormGroup>
                          <Label for="address">Direccion</Label>
                          <input
                            maxLength="100"
                            autoComplete="off"
                            ref={registerSale({ required: "La direccion es requerida" })}
                            className={'form-control' + (errors.address ? ' is-invalid' : '')}
                            defaultValue='direccion'
                            name="address"
                          />
                          {errorsSale.address && <div className="invalid-feedback d-block">{errorsSale.address.message}</div>}
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                  <Row>
                    <Col>
                      <FormGroup>
                        <Label for="comment">Comentarios</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          ref={registerSale()}
                          className={'form-control' + (errors.comment ? ' is-invalid' : '')}
                          name="comment"
                        />
                        {errorsSale.comment && <div className="invalid-feedback d-block">{errorsSale.comment.message}</div>}
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>


                    <Col md={4.5}>
                      {user.agency.name == "no aplica" && <>
                        <FormGroup>
                          <Label for="operator">Operador</Label>{' '}
                          {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          <select
                            className={'form-control' + (errorsSale.operator ? ' is-invalid' : '')}
                            name="operator"
                            ref={registerSale({})}>
                            <option key={'No necesitó operador'} name={''} value={'No necesitó operador'}>No necesitó operador</option>
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
                    <Col md={4}>
                      {/* Solo role admin y supervisor */}
                      {(user.role == 1 || user.role == 9) && <>
                        <FormGroup>
                          <Label for="agency">Sucursal</Label>{' '}
                          {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          <select
                            className={'form-control' + (errors.agency ? ' is-invalid' : '')}
                            name="agency"
                            ref={registerSale({
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
                    </Col>
                    <div style={{
                      display: 'none',
                    }}>
                      <Col md={4.5}>
                        <FormGroup>
                          <Label for="seller">Vendedor</Label>{' '}
                          {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          <select
                            className={'form-control' + (errorsSale.seller ? ' is-invalid' : '')}
                            name="seller"
                            ref={registerSale({

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
                          {errorsSale.seller && <div className="invalid-feedback d-block">{errorsSale.seller.message}</div>}
                        </FormGroup>
                      </Col>
                    </div>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="autorize">Autorizado por</Label>
                        <select
                          name="autorize"
                          className={'form-control' + (errorsSale.autorize ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option value="Baltazar">Baltazar</option>
                        </select>
                        {errorsSale.autorize && <div className="invalid-feedback d-block">{errorsSale.autorize.message}</div>}

                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      {user.agency.name == "no aplica" && <>
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
                  </Row>
                  <Form onSubmit={handleSubmit(onCreateData)} className={`form ${darkMode ? 'dark-mode' : ''}`} style={{
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
                          title="Ver catálogo y elegir producto o combo"
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
                              value: 0,
                              message: "El peso minimo debe ser 0 kg"
                            },
                            pattern: {
                              value: /^(?=.*\d)\d*(\.\d+)?$/,
                              message: "Ingresa un peso válido"
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
                        <th>Costo ($)</th>
                        <th>Sub total $</th>
                        <th>Sub total Bs</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSale && tableSale.map((product, index) => {
                        return (
                          <tr key={index} style={{ backgroundColor: product.applyWholesaleDiscount ? '#D3FFDF' : '' }}>
                            <td>{product.name}</td>
                            <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                            <td><NumberFormat value={Number(product.wholesalePrice != null && product.wholesalePrice !== '' ? product.wholesalePrice : (valueDollar > 0 ? product.price / valueDollar : 0)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$ ' /></td>
                            <td><NumberFormat value={(product.totalDollars != null ? product.totalDollars : (valueDollar > 0 ? product.total / valueDollar : 0)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$ ' /></td>
                            <td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs ' /></td>

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
                      <div className="d-inline-flex" style={{ padding: '5px 0px 10px 0px' }}>
                        <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', padding: 4 }}>
                          <b style={{ fontSize: 25, marginRight: 10, marginLeft: 10 }}>Kg <NumberFormat value={totalWeight.toFixed(3)} displayType={'text'} thousandSeparator={true} />{' '}</b>
                        </div>
                        <div className="text-center" style={{ border: '1px solid #00C853', padding: 4 }}>
                          <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>Bs <NumberFormat value={total.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                        </div>
                        <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', padding: 4 }}>
                          <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>$ <NumberFormat
                            value={(valueDollar > 0) ? (total.toFixed(2) / valueDollar).toFixed(2) : 0.00}
                            displayType={'text'} thousandSeparator={true} />{' '}</b>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  {appliedWholesaleDiscount && <Row>
                    <Col className="text-right" style={{ margin: 0 }}>
                      <div className="d-inline-flex" style={{ padding: '5px 0px 10px 0px' }}>
                        <div className="text-center" style={{ border: '1px solid #00C853', backgroundColor: '#E6E6E6', padding: 4 }}>
                          <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>Total Desc: <NumberFormat value={total.toFixed(2)} displayType={'text'} thousandSeparator={true} />{' '}Bs.</b>
                        </div>
                        <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', backgroundColor: '#E6E6E6', padding: 4 }}>
                          <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>Total Desc: ${' '}<NumberFormat value={totalDollars.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                        </div>
                      </div>
                    </Col>
                  </Row>}
                  <Form onSubmit={handleSubmitSale(onRegisterSale)}>
                    {/* <Row form>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="pBank">Punto</Label>
                          <select className={'form-control' + (errors.terminal ? ' is-invalid' : '')} name="terminal"
                            disabled={total == 0 ? true : false}
                            ref={registerSale({
                              validate: terminal => {
                                if (!tAmmount && !ves && !dollar && !eur && !cop && !terminal && !posExtra) {
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
                    </Row> */}
                    {/* <div style={{ marginTop: '10px', marginBottom: '10px' }}>
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
                    </div> */}

                    <Collapse isOpen={collapses.includes(1)}>
                      <div className="d-flex justify-content-between">

                        {collapses.includes(1) ? <div className="pull-right align-self-center">


                          <div>
                            {/* CALCULO DE FALTANTES*/}

                            <b style={{ fontSize: 18, color: '#BC0707' }}>Faltante <NumberFormat value={optionRest.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs:  ' /> /  </b>
                            <b style={{ fontSize: 18, color: '#BC0707' }}> <NumberFormat value={(valueDollar > 0 ? (optionRest / valueDollar) : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$:    ' /> /  </b>
                            <b style={{ fontSize: 18, color: '#BC0707' }}> <NumberFormat value={(valueDollar > 0 ? (optionRest / valueDollar) * valueCop : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop:  ' /></b>
                          </div>
                          <br></br>


                          {/* CALCULO DE TOTAL*/}
                          <div>

                            <b style={{ fontSize: 18 }}>Total <NumberFormat value={optionTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs:  ' /> /  </b>
                            <b style={{ fontSize: 18 }}> <NumberFormat value={(valueDollar > 0 ? (optionTotal / valueDollar) : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$:    ' /> /  </b>
                            <b style={{ fontSize: 18 }}> <NumberFormat value={(valueDollar > 0 ? (optionTotal / valueDollar) * valueCop : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop:  ' /></b>
                          </div>

                          <br></br>

                          {/* CALCULO DE CAMBIO*/}


                          {exceeded > 0 &&



                            <div color="primary"> <i className="fa fa-exclamation-circle text-warning" aria-hidden="true"></i>{' '}
                              <b style={{ fontSize: 18 }} className="text-warning">Cambio <NumberFormat value={exceeded.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs  ' /> /  </b>
                              <b style={{ fontSize: 18 }} className="text-warning"> <NumberFormat value={(valueDollar > 0 ? (exceeded / valueDollar) : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$  ' /> /  </b>
                              <b style={{ fontSize: 18 }} className="text-warning"> <NumberFormat value={(valueDollar > 0 ? (exceeded / valueDollar) * valueCop : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop  ' />   </b>
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
                            {/* <option key="EMBUTIDOS FATTORIA" name="EMBUTIDOS FATTORIA" value="EMBUTIDOS FATTORIA">EMBUTIDOS FATTORIA</option> */}
                            {/* <option key="Principal BANESCO" name="Principal BANESCO" value="Principal BANESCO">Principal BANESCO</option> */}
                            {/* <option key="EMBUTIDOS MOHAN BANESCO" name="EMBUTIDOS MOHAN BANESCO" value="EMBUTIDOS MOHAN BANESCO">EMBUTIDOS MOHAN BANESCO</option> */}
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
                        {/* <Button color="primary" disabled={total == 0 || registering || registeringTicket || registeringPendingVales || watch('isSolvent') === false}>
                          {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          Cobrar
                        </Button>{' '} */}
                        {/* <Button color="primary" onClick={() => { saveTicket() }} disabled={(total == 0 || registering || registeringTicket || registeringPendingVales) }>
                          {registeringTicket && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          <i className="fa fa-clock" aria-hidden="true"></i> En espera
                        </Button> */}
                        <Button color="primary" onClick={() => { onRegisterCredit(watch()) }} disabled={total == 0 || registering || registeringTicket || registeringPendingVales || watch('isSolvent') === false}>
                          {(registeringPendingVales) && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          <i className="fa fa-clock" aria-hidden="true"></i> Vale
                        </Button>
                      </Col>
                      <Col>
                        <div className="pull-right">
                          <Button onClick={e => { e.preventDefault(); history.goBack(); }}>Cancelar</Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Col>
              </Row>
              <Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible} className={`${darkMode ? "dark-mode" : ""}`}>
                <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
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
                <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                  <p>{modalMsg}</p>
                </div>
                <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
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
                  <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: '0.5rem' }}>
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
                              {listProducts && listProducts.length ? 'Sin coincidencias' : 'Cargando catálogo…'}
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

export default valesCreatePage;