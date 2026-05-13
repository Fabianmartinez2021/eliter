/* eslint-disable */
/****************************************************************** */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { agencyActions, salesActions, userActions} from '../../actions';
import pendingValesActions from '../../actions/pendingVales.actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Collapse, InputGroup, Input, InputGroupAddon, Spinner, Badge } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import DataTable from 'react-data-table-component';
import '../../assets/css/table.css';
import '../../assets/css/options.css';
import useDebounce from '../../components/Debounce';
import moment from 'moment';
import { WeightProduct } from '../../helpers/weight'
import { currencyDollarActions } from '../../actions/currencyDollar.actions';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

import { Typeahead, withAsync } from 'react-bootstrap-typeahead';

const AsyncTypeahead = withAsync(Typeahead);

function ValePaymentPage() {

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

  const [comment, setComment] = useState("");
  

  //Alertas
  const alert = useSelector(state => state.alert);
  //Mostrar alertas
  const [visible, setVisible] = useState(true);
  const onDismiss = () => setVisible(false);

  useEffect(() => {
    if (alert.message) {
      setModalChange(false);
      setModalChangePayment(false);
      setVisible(true);
      window.setTimeout(() => { setVisible(false) }, 5000);
    }
  }, [alert]);

  //Obtener toda la data necesaria para ventas
  const getting = useSelector(state => state.sales.getting);
  const sales = useSelector(state => state.sales);           //  Informacion de las ventas al Detal

  //Obtener monedas, productos y terminales de sucursal
  useEffect(() => {
    dispatch(salesActions.salesDataForm(user.agency.id));
  }, []);

  const [listCoin, setListCoin] = useState(null);
  const [listProducts, setListProducts] = useState(null);
  const [listSellers, setListSellers] = useState(null);
  const [seller, setSeller] = useState([]);
  const [terminaList, setTerminalList] = useState([]);
  const [offerProducts, setOfferProducts] = useState(null);

  
  useEffect(() => {
    if (sales.obtained) {
        // Asignar los datos de `sales` a los estados correspondientes
        setListProducts(sales.data.products);
        setListSellers(sales.data.sellers);
        setTerminalList(sales.data.agency.terminal);
        setOfferProducts(sales.data.offers);
        setListCoin(sales.data.coins);
        
}}, [sales.obtained])


  //Form Tabla
  const { handleSubmit, register, errors, reset, control } = useForm();
  //Form resgistrar venta
  const { handleSubmit: handleSubmitSale, register: registerSale, errors: errorsSale, reset: resetSale, trigger, control: controlSale, watch, setValue, clearErrors } = useForm();
  //Form para el cambio
  const { handleSubmit: handleSubmitChange, register: registerChange, errors: errorsChange, reset: resetChange, control: controlChange, watch: watchChange } = useForm();
  //Form para el cambio si es un abono
  const { handleSubmit: handleSubmitChangePayment, register: registerChangePayment, errors: errorsChangePayment, reset: resetChangePayment, control: controlChangePayment, watch: watchChangePayment } = useForm();

  //State de guardado
  const registering = useSelector(state => state.sales.registering);
  const updatingPendigVales = useSelector(state => state.pendingVales.updating)

  //Tabla de productos añadidos
  const [tableSale, setTableSale] = useState([]);
  //  Deuda pendiente
  const [total, setTotal] = useState(0);
  //  Monto total del credito 
  const [totalCreditAmmount, setTotalCreditAmmount] = useState(0);
  //Total en peso de los productos
  const [totalWeight, setTotalWeight] = useState(0);
  //Código del pago pendiente a modificar
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(0);

  //Modal genérico y mensaje
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  const [dataSale, setDataSale] = useState(null);

  //Registrar pago completo de un crédito
  const onRegisterSale = (dataIncomplete, e) => {


    //limpiar errores del form de producto
    reset();

      let data = {...dataIncomplete, ...watch()}

      console.log("Valor de agency desde el formulario:", data.agency);

      if(total == 0 || tableSale.length == 0){
          setModalMsg('Debe ingresar al menos un producto');
          setModalVisible(true);
          return;
      }

      if(optionRest > 0 && collapses.includes(1)){
        
        setModalMsg('Debe completar el pago');
        setModalVisible(true);
        return;
      }

      let valueDollar = listCoin[0].value;

      data.user = user.id;
      data.agency = user.role === 3 ? user.agency.id : data.agency;
      
      data.total = total / valueDollar;
      //enviar valores actuales de las monedas
      data.valueDollar = listCoin[0].value.toFixed(2);
      data.valueEur = listCoin[1].value.toFixed(2);
      data.valueCop = listCoin[2].value.toFixed(2);

      //  Ya que es una venta al mayor
      data.isWholesale = true;

      //  Ya que es un abono
      data.isSumation = true;
      data.type = 10 // ver sales.enum.js en el backend

      //  Ya que es un pago
      data.isPayment = true;
      
      // Si los terminales aplican
      if (data.terminal){
        const terminal = terminaList.find((item) => item.id == data.terminal) 
        data.terminalApply = terminal.apply
      }
      if (data.terminalExtra){
          const terminalExtra = terminaList.find((item) => item.id == data.terminalExtra) 
          data.terminalExtraApply = terminalExtra.apply
      }

      //limpiar banco en tra
      if(data.tAmmount == ""){
          data.tBank = "";
      }

      console.log('data ', data)
      //Guardar venta
      if(exceeded > 0){
          setDataSale(data);
          setModalChange(true);
      }else{
          dispatch(pendingValesActions.pendingValesUpdate( pendingPaymentOrder, data ));
      }

  };

  const submitMarkAsPaidWithComment = (userComment) => {
    reset(); // Limpiar errores del form

    // Validación: no continuar si no hay productos
    if (tableSale.length === 0) {
      setModalMsg('Debe ingresar al menos un producto');
      setModalVisible(true);
      return;
    }

    // Calcular total en dólares según productos
    const valueDollar = listCoin[0].value;
    const totalCalculated = tableSale.reduce((acc, item) => acc + item.total, 0);
    const total = totalCalculated / valueDollar;

    const data = {
      // Usuario y agencia
      user: user.id,
      agency: user.agency.id,

      // Totales
      total,
      valueDollar: listCoin[0].value.toFixed(2),
      valueEur: listCoin[1].value.toFixed(2),
      valueCop: listCoin[2].value.toFixed(2),

      // Marcadores de venta
      isWholesale: true,
      isSumation: true,
      isPayment: true,
      type: 13, // SALVADO
      pending: 0, // Se marca como pagado
      comment: userComment,

      // Productos
      products: tableSale,
    };

    // Terminales
    const terminal = terminaList.find(item => item.id == watch("terminal"));
    if (terminal) {
      data.terminal = terminal.id;
      data.terminalApply = terminal.apply;
    }

    const terminalExtra = terminaList.find(item => item.id == watch("terminalExtra"));
    if (terminalExtra) {
      data.terminalExtra = terminalExtra.id;
      data.terminalExtraApply = terminalExtra.apply;
    }

    // Datos de transferencia
    if (watch("tAmmount") === "") {
      data.tBank = "";
    } else {
      data.tAmmount = watch("tAmmount");
      data.tBank = watch("tBank");
    }

    // Cliente (si están disponibles)
    if (watch("names")) data.names = watch("names");
    if (watch("document")) data.document = watch("document");
    if (watch("documentType")) data.documentType = watch("documentType");
    if (watch("businessName")) data.businessName = watch("businessName");
    if (watch("clientType")) data.clientType = watch("clientType");
    if (watch("taxpayer")) data.taxpayer = watch("taxpayer");
    if (watch("phone")) data.phone = watch("phone");
    if (watch("address")) data.address = watch("address");
    if (watch("autorize")) data.autorize = watch("autorize");


    // Enviar
    dispatch(pendingValesActions.pendingValesUpdate(pendingPaymentOrder, data));
  };

  //Registrar Abono
  const onRegisterPayment = async (data) => {
    //limpiar errores del form de producto
    reset();

    const triggerResponse = await trigger();

    //  Se verifica que todos los valores estén correctos
    if (!triggerResponse){
      return;
    }

    let valueDollar = listCoin[0].value;

    //  Si hay saldo restante, queda como saldo pendiente EN DOLARES
    if(optionRest > 0 && collapses.includes(1)){
      
      data.pending = optionRest / valueDollar;
    }else{
      setModalMsg('Debe escoger la opción Pagar Crédito');
      setModalVisible(true);
      return;
    }
    
    data.user = user.id;
    data.agency = user.role === 3 ? user.agency.id : data.agency;
    
    //  El total es calculado, y va en dolares
    data.total = (total - optionRest) / valueDollar;
    //enviar valores actuales de las monedas
    data.valueDollar = listCoin[0].value.toFixed(2);
    data.valueEur = listCoin[1].value.toFixed(2);
    data.valueCop = listCoin[2].value.toFixed(2);

    //  Ya que es una venta al mayor
    data.isWholesale = true;

    //  Ya que es un abono
    data.isSumation = true;
    data.type = 11 // ver sales.enum.js en el backend

    // Si los terminales aplican
    if (data.terminal){
        const terminal = terminaList.find((item) => item.id == data.terminal) 
        data.terminalApply = terminal.apply
    }
    if (data.terminalExtra){
        const terminalExtra = terminaList.find((item) => item.id == data.terminalExtra) 
        data.terminalExtraApply = terminalExtra.apply
    }
    
    // Si es televentas
    //data.isTelesale = watch("isTelesale") ? true : false

    //limpiar banco en tra
    if(data.tAmmount == ""){
        data.tBank = "";
    }

    setDataSale(data);

    //  Si se realiza un abono, la ventana de cambio es obligatoria

    setModalChangePayment(true); 

  };

  //Función para limpiar pantalla
  const resetScreen = () => {
    resetSale({ documentType: '', document: '', names: '', businessName: '', clientType: '', taxpayer: '', phone: '', address: '',  ves: '', dollar: '', eur: '', cop: '', tAmmount: '', tBank: '', tReference: '', pAmmount: '', pAmmountExtra: '', terminalExtra: '', pBank: '', pReference: '', pReferenceExtra: '', autorize:'Baltazar', agency:'' });
    setSeller([])
    setTotal(0);
    setTotalCreditAmmount(0);
    setTotalWeight(0);
    setTableSale([]);
    clientNamesRef.current.clear();
    clientNamesRef.current.focus();
    setSelected([]);
  }

  const statusRegister = useSelector(state => state.pendingVales);
  //Verificar si guardo y limpiar form
  useEffect(() => {
    if (statusRegister.successUpdated) {
      resetScreen();
      setModalChange(false);
      setModalChangePayment(false);
      setDataSale(null);
      clientNamesRef.current.clear();
      clientNamesRef.current.focus();
    }
  }, [statusRegister.successUpdated]);

  //Data de los forms
  let pos = watch("terminal");
  let tAmmount = watch("tAmmount");
  let ves = watch("ves");
  let dollar = watch("dollar");
  let eur = watch("eur");
  let cop = watch("cop");
  let pAmmount = watch("pAmmount");
  let documentType = watch("documentType");
  let documentClient = watch("document");
  let names = watch("names");
  let clientType = watch("clientType");
  let taxpayer = watch("taxpayer");
  let phone = watch("phone");
  let address = watch("address");
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
  const [totalEur, setTotalEur] = useState(0);
  const [totalCop, setTotalCop] = useState(0);

  //Sacar totales en monedas extranjeras
  useEffect(() => {
    if (total > 0 && listCoin && listCoin.length > 0) {
      setTotalDollar(total / listCoin[0].value);
      setTotalEur(total / listCoin[1].value);
      setTotalCop(total * listCoin[2].value);
    } else {
      setTotalDollar(0);
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
  }, [ves, dollar, eur, cop, pAmmount, tAmmount, pAmmountExtra]);

  //Referencia código de producto
  const clientNamesRef = useRef();

  //Focus inicial en el cliente
  useEffect(() => {
    clientNamesRef.current.focus();
  }, []);

  
  //Gestionar los cambios
  const [modalChange, setModalChange] = useState(false);
  //Gestionar los cambios al momento hacer un abono y requerir cambio
  const [modalChangePayment, setModalChangePayment] = useState(false);
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
  let infoSale = { ...dataSale };

  // Limpiar y convertir a número
  const rawAmount = parseFloat(data.changeAmmount.toString().replace(/,/g, ''));

  // Verificar si es un número válido
  if (isNaN(rawAmount)) {
    console.error('Monto inválido');
    return;
  }

  infoSale.changeDataPayment = {
    typeChangePayment: data.typeChange,
    changeAmmountPayment: rawAmount
  };

  dispatch(pendingValesActions.pendingValesUpdate(pendingPaymentOrder, infoSale));
}

  const onRegisterChangePayment = (data, e) => {
    let infoSale = dataSale;

    if (data.typeChangePayment != '5'){
      infoSale.changeDataPayment = data;
    }
    
    dispatch(pendingValesActions.pendingValesUpdate( pendingPaymentOrder, infoSale));
  }

  let typeChange = watchChange("typeChange");
  let typeChangePayment = watchChangePayment("typeChangePayment");

  /**
   * Busqueda autocompletado
   * 
   */

  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const handleSearch = (query) => {
    setIsLoading(true);
    setOptions([]);
    dispatch(userActions.getListWholesaleClientTypeahead(query));
  };

  // const handleSearchClientCode = (query) => {
  //   setIsLoading(true);
  //   setOptions([]);
  //   dispatch(userActions.getListWholesaleClientByCodeTypeahead(query));
  // };

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

      //  Si se selecciona añadir no debe pasar nada ya que es un error
      if (selectedOption[0].customOption === true){
        setModalMsg('El usuario no existe ');
        setModalVisible(true);
        
        setTableSale([]);
        setTotal(0);
        setTotalCreditAmmount(0);
        setTotalWeight(0);

        resetScreen()

        return
      }
      
      //  Datos del cliente
      // setValue('clientCode', selectedOption[0].clientCode);
      setValue('documentType', selectedOption[0].documentType);
      setValue('document', selectedOption[0].document);
      setValue('names', selectedOption[0].names);
      setValue('businessName', selectedOption[0].businessName);
      setValue('clientType', selectedOption[0].clientType);
      setValue('taxpayer', selectedOption[0].taxpayer);
      setValue('phone', selectedOption[0].phone);
      setValue('address', selectedOption[0].address);
      setValue('isSolvent', selectedOption[0].isSolvent);
      setValue('comment', selectedOption[0].comment);
      setValue('autorize', 'Baltazar');
      // setValue('agency', selectedOption[0].agency);

      
      //  Datos de la venta pendiente en caso de que sea o no solvente

      if (!selectedOption[0].isSolvent){

        //No está permitido cancelar una deuda en una agencia distinta de donde se creó
        if (selectedOption[0].pendingPayment.agency != user.agency.id){

          setModalMsg('La deuda no es de esta agencia ');
          setModalVisible(true);

          setTableSale([]);
          setTotal(0);
          setTotalCreditAmmount(0);
          setTotalWeight(0);
        }
        else{

          // Si hay un vendedor, se selecciona ese, de lo contrario se selecciona el primero de la lista de vendedores
          if (selectedOption[0].pendingPayment.seller){
            let sellerToPlace = listSellers.find((item) => item.id == selectedOption[0].pendingPayment.seller)
            setSeller([sellerToPlace]);
          }
          else{
            setSeller([listSellers[0]]);
          }

          // Se obtiene si es televenta o no
          setValue('isTelesale', selectedOption[0].isTelesale ? selectedOption[0].isTelesale : false);

          //  El nuevo total a tener en cuenta es el saldo pendiente pasado a bolivares para poder realizar todos los calculos
          const newTotal = selectedOption[0].pendingPayment.pending * listCoin[0].value;

          setTableSale(selectedOption[0].pendingPayment.products);
          setTotal(newTotal);
          setTotalCreditAmmount(selectedOption[0].pendingPayment.total);
          setTotalWeight(selectedOption[0].pendingPayment.totalWeight)
          setPendingPaymentOrder(selectedOption[0].pendingPayment.order)

          setValue('pAmmount', newTotal.toFixed(2));
        }
      }
      else{
        setTableSale([]);
        setTotal(0);
        setTotalCreditAmmount(0);
        setTotalWeight(0);
      }
    }

    setSelected(selectedOption);
  }

  const [selected, setSelected] = useState([]);





  //Array de cuentas pendientes
  const [pendingVales, setPendingVales] = useState([]);



  const dataPendingVales = useSelector(state => state.pendingVales.table); // Asegurar que no sea undefined
  const loadingPendingPayments = useSelector(state => state.pendingVales.loading);

   useEffect(() => {
  
          if(dataPendingVales && dataPendingVales.results){
  
              setPendingVales(dataPendingVales.results);
          }
          
          if(dataPendingVales && dataPendingVales.metadata && dataPendingVales.metadata[0]){
              setRowCount(dataPendingVales.metadata[0].total);
          }
      },[dataPendingVales]);


  //Estado del Modal para cuentas por cobrar
  const [modalPendingPayments, setModalPendingPayments] = useState(false);
  

  //Abrir modal de cuentas por cobrar y consultar listado
  const openModalPendingPayments = () => {
    setModalPendingPayments(true);
    getDataTable(1);
  }

  const clearModal = () => {
    setModalPendingPayments(false);
  }

  //obtener data de usuario necesaria
    const getUserData = () => {
        return {
            agency: user.agency.id,
            role:user.role,
            id: user.id
        }
    }

    //Filas por default
    const [perPage] = useState(10);
    //Cantidad de filas seleccionadas
    const [perPageSelect, setPerPageSelect] = useState(0);
    //Direccion del ordenamiento y columna
    const [direction, setDirection] = useState({ "id":"createdDate", "desc":true  });

    const getDataTable = (page) => {
        dispatch(pendingValesActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {unpaid: true}));
    }

    //Paginar
    const handlePageChange = async (page) => {
        dispatch(pendingValesActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {unpaid: true}));
    };
    
    //Ordenar
    const handleSort = (column, sortDirection) => {
        let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
        setDirection(sort);
        dispatch(pendingValesActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, {unpaid: true}));
    };

    //Cambiar cantidad de filas
    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPageSelect(newPerPage);
        dispatch(pendingValesActions.dataTable(getUserData(), page, newPerPage, direction));
    };
    
    // Consultar al entrar
    //  useEffect(() => {
    //      setData([])
    //      getDataTable(1);
    //  }, []);

    //Opciones de paginacion
    const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

  const [rowCount, setRowCount] = useState(0)
    
  const columns = [
        
        {
            name: 'Orden',
            selector: 'order',
            sortable: true,
        },
        // {
        // 	name: 'Código',
        // 	selector: 'clientCode',
        // 	sortable: true,
        // },
        {
            name:'Sucursal',
            selector:'agency.name',
            sortable: true,
            wrap:true
        },
        {
            name: 'Tipo',
            selector: 'clientType',
            sortable: true,
            cell : (row)=>{
                return (row.clientType);
            },
        },
        {
            name: 'Nombre',
            selector: 'names',
            sortable: true,
            wrap: true,
        },
        
        {
            name: 'Total',
            selector: 'total',
            sortable: true,
            cell : (row)=>{
                return (row.total.toFixed(2));
            },
        },
        {
            name: 'Pendiente',
            selector: 'pending',
            sortable: true,
            cell : (row)=>{
                return (row.pending.toFixed(2));
            },
        },
    ];

  const CustomLoader = () => (<><div className="loading-table"></div></>);


  const onClickPendingPayment = (row, event) => {


    if (collapses.length != 0) {
      changeCollapse(1)
    }
    
    //  Datos del cliente
    // setValue('clientCode', row.clientCode);
    setValue('documentType', row.documentType);
    setValue('document', row.document);
    setValue('names', row.names);
    setValue('businessName', row.businessName);
    setValue('clientType', row.clientType);
    setValue('taxpayer', row.taxpayer);
    setValue('phone', row.phone);
    setValue('address', row.address);
    setValue('isSolvent', row.isSolvent);
    setValue('comment', row.comment);
    setValue('autorize', 'Baltazar');

    if (row.agency) {
      const agencyId = row.agency._id || row.agency.id;
      setValue('agency', agencyId);
    }

    // Si hay un vendedor, se selecciona ese, de lo contrario se selecciona el primero de la lista de vendedores
    if (row.seller){
      let sellerToPlace = listSellers.find((item) => item.id == row.seller)
      setSeller([sellerToPlace]);
    }
    else{
      setSeller([listSellers[0]]);
    }
    
    // Se obtiene si es televenta o no
    setValue('isTelesale', row.isTelesale ? row.isTelesale : false);
    
    //  El nuevo total a tener en cuenta es el saldo pendiente pasado a bolivares para poder realizar todos los calculos
    const newTotal = row.pending * listCoin[0].value;

    setTableSale(row.products);
    setTotal(newTotal);
    setTotalCreditAmmount(row.total);
    setTotalWeight(row.totalWeight)
    setPendingPaymentOrder(row.order)

    setValue('pAmmount', newTotal.toFixed(2));

    let selectedOption = [row]
    setSelected(selectedOption);

    setModalPendingPayments(false);
    
  }

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
                      <div className="d-flex justify-content-between" style={{marginBottom:10}}> 
                        {listCoin[0] && (
                          <div style={{ fontSize: '0.9em' }}>
                            Dólar a {' '}
                            <b><NumberFormat value={listCoin[0].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                          </div>
                        )}
                        {listCoin[1] && (
                          <div style={{ fontSize: '0.9em' }}>
                            Euros a {' '}
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
                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Pagar o abonar vale</h3>
                    <Button color="primary" size="sm" onClick={() => openModalPendingPayments()}>
                      <i className="fa fa-list-ul"></i> Vales pendientes
                    </Button>
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
                        <Label for="names">Cliente</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          disabled = {true}
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
                          disabled = {true}
                          className={'form-control' + (errorsSale.clientType ? ' is-invalid' : '')}
                          ref={registerSale()}
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
                          disabled = {true}
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
                        <Controller
                          name="document"
                          control={controlSale}
                          rules={{
                            required: "El documento es requerido",
                          }}
                          render={({ }) => (
                            <AsyncTypeahead
                              clearButton
                              filterBy={filterBy}
                              ref={clientNamesRef}
                              inputProps={{ //  Para que solo sean numeros
                                type: 'number',
                              }}
                              id="async-example"
                              isInvalid={errorsSale.document ? true : false}
                              isLoading={isLoading}
                              minLength={3}   //  Numero de caracteres para realizar la búsqueda
                              onSearch={handleSearch} //  Para manejar la busqueda mientras se escribe
                              useCache={false}
                              onChange={e => handleChange(e)} //  Para manejar luego de que se escoge uno
                              options={options}
                              emptyLabel="No hay resultados"
                              labelKey="document" //  Elemento del objeto que se verá reflejada en la busqueda
                              selected={selected}
                            />
                          )}
                        />
                        {errorsSale.document && <div className="invalid-feedback d-block">{errorsSale.document.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={1.5}>
                      <FormGroup>
                        <Label for="documentType">V, J, E...</Label>
                        <select
                          name="documentType"
                          disabled = {true}
                          className={'form-control' + (errorsSale.documentType ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option name="" value=""></option>
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
                        <Controller
                          name="clientCode"
                          control={controlSale}
                          rules={{
                            required: "El código es requerido",
                          }}
                          render={({ }) => (
                            <AsyncTypeahead
                              clearButton
                              allowNew
                              newSelectionPrefix="Añadir:"
                              filterBy={filterBy}
                              inputProps={{ //  Para que solo sean numeros
                                type: 'number',
                              }}
                              id="async-example-code"
                              isInvalid={errorsSale.clientCode ? true : false}
                              isLoading={isLoading}
                              minLength={1}   //  Numero de caracteres para realizar la búsqueda
                              onSearch={handleSearchClientCode} //  Para manejar la busqueda mientras se escribe
                              useCache={false}
                              onChange={e => handleChange(e)} //  Para manejar luego de que se escoge uno
                              options={options}
                              emptyLabel="No hay resultados"
                              labelKey="clientCode" //  Elemento del objeto que se verá reflejada en la busqueda
                              selected={selected}
                            />
                          )}
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
                          disabled = {true}
                          className={'form-control' + (errors.businessName ? ' is-invalid' : '')}
                          name="businessName"
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
                          disabled = {true}
                          className={'form-control' + (errorsSale.taxpayer ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option name="" value=""></option>
                          <option name="Especial" value="Especial">Especial</option>
                          <option name="Ordinario" value="Ordinario">Ordinario</option>

                        </select>
                        {errorsSale.taxpayer && <div className="invalid-feedback d-block">{errorsSale.taxpayer.message}</div>}

                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="isSolvent"></Label>
                          <Controller
                            name="isSolvent"
                            control={controlSale}
                            as={<Badge 
                              color={watch('isSolvent') === undefined ? 'secondary' : watch('isSolvent') === true ? "success" : "danger"}  
                              pill className="h6 p-2 mt-4">
                                  {
                                    watch('isSolvent') === undefined ? '' : watch('isSolvent') === true ? "SOLVENTE" : "PENDIENTE"
                                  }
                            </Badge> }
                          />
                          
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
                            disabled = {true}
                            ref={registerSale({ required: "La direccion es requerida" })}
                            className={'form-control' + (errors.address ? ' is-invalid' : '')}
                            name="address"
                          />
                          {errorsSale.address && <div className="invalid-feedback d-block">{errorsSale.address.message}</div>}
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                  <Row>
                    <Col md={4}>  
                      {/* Solo role admin y supervisor */}
                      {(user.role == 1 || user.role == 9) && <>
                          <FormGroup>
                              <Label for="agency">Sucursal</Label>{' '}
                              {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
                              <select 
                                  className={'form-control' + (errors.agency ? ' is-invalid' : '')} 
                                  name="agency"
                                  disabled={true}
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
                    <Col md={4}> 
                        <FormGroup> 
                            <Label for="seller">Vendedor</Label>{' '}
                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            <select
                              className={'form-control' + (errors.seller ? ' is-invalid' : '')}
                              name="seller"
                              disabled={true}
                              ref={registerSale({ required: "El vendedor es requerido" })}
                              defaultValue={seller && seller[0]?.id} // primer vendedor por defecto
                            >
                              {Array.isArray(seller) && seller.map(item =>
                                item ? (
                                  <option key={item.id} value={item.id}>
                                    {item.firstName + ' ' + item.lastName}
                                  </option>
                                ) : null
                              )}
                            </select>
                            {errors.seller && <div className="invalid-feedback d-block">{errors.seller.message}</div>}
                        </FormGroup>
                    </Col>
                    <Col md={4}> 
                        <FormGroup> 
                            <Label for="isTelesale">¿Es televentas?</Label>{' '}
                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            <select 
                                className={'form-control' + (errorsSale.isTelesale ? ' is-invalid' : '')} 
                                name="isTelesale"
                                disabled={true}
                                ref={registerSale({ 
                                        required: "La opción es requerida" 
                                    })}>
                                    <option key={''} name={''} value={''}></option>
                                    <option key={'Si'} name={'Si'} value={true}>Si</option>
                                    <option key={'No'} name={'No'} value={false}>No</option>

                            </select>
                            {errorsSale.isTelesale && <div className="invalid-feedback d-block">{errorsSale.isTelesale.message}</div>}
                        </FormGroup>
                    </Col>
                    </div>
                    <Col md={4}> 
                        <FormGroup> 
                            <Label for="autorize">Autorizado por</Label>{' '}
                            {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            <select 
                                className={'form-control' + (errorsSale.autorize ? ' is-invalid' : '')} 
                                name="autorize"
                                disabled={true}
                                ref={registerSale({ 
                                        required: "La opción es requerida" 
                                    })}
                            >
                                      <option value="Baltazar">Baltazar</option>
                            </select>
                            {errorsSale.autorize && <div className="invalid-feedback d-block">{errorsSale.autorize.message}</div>}
                        </FormGroup>
                    </Col>
                  </Row>

                  <Table striped responsive>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>kg/unidades</th>
                        <th>Sub total $</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSale && tableSale.map((product, index) => {
                        return (
                          <tr key={index}>
                            <td>{product.name}</td>
                            <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                            <td><NumberFormat value={product.totalDollars.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>
                          </tr>
                        )
                      })
                      }
                    </tbody>
                  </Table>
                   {/* <Table bordered className="w-50">
                      <thead>
                          <tr>
                            <th>Base Imponible</th>
                            <th>IVA 16%</th>
                            <th>Exento</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                          <td className="text-end">
                            {tableSale && 
                                tableSale
                                    .filter((product) => product.taxed)  // Filtrar solo los productos con IVA
                                    .reduce((acc, product) => acc + (product.total / 1.16), 0)  // Calcular Base Imponible
                                    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                        </td>
                            <td className="text-end">
                                {tableSale && 
                                  tableSale
                                    .filter((product) => product.taxed)  // Filtrar solo los productos con IVA
                                    .reduce((acc, product) => acc + (product.total * 0.16), 0)  // Calcular IVA 16%
                                    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                }
                            </td>
                            <td className="text-end">
                              {tableSale && 
                                tableSale
                                  .filter((product) => product.exempt)  // Filtrar solo los productos exentos
                                  .reduce((acc, product) => acc + product.total, 0)  // Calcular Exento
                                  .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              }
                            </td>
                          </tr>
                        </tbody>
                      </Table> */}
                  <Row>
                    <Col className="text-right" style={{ margin: 0 }}>
                      <div className="d-inline-flex" style={{ padding: '5px 0px 10px 0px' }}>
                        <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', padding: 4 }}>
                          <b style={{ fontSize: 25, marginRight: 10, marginLeft: 10 }}>Total: {' '}$<NumberFormat value={totalCreditAmmount.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                        </div>
                        <div className="text-centerP" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', padding: 4 }}>
                          <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>Pendiente: {' '}$<NumberFormat value={totalDollar.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                        </div>
                      </div>
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
                                if((!tAmmount && !ves && !dollar && !eur && !cop && !terminal && !posExtra) || (!terminal && pAmmount)){
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
                        <div className="mb-2"><b>Métodos de pago</b></div>
                        {collapses.includes(1) ? <div className="pull-right align-self-center">
                          <div>
                            <b>Faltante: <NumberFormat value={optionRest.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>{' '}
                            <b>Total: <NumberFormat value={optionTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                          </div>
                          {exceeded > 0 &&
                            <div color="primary"> <i className="fa fa-exclamation-circle text-warning" aria-hidden="true"></i>{' '}
                              <b className="text-warning">Cambio: <NumberFormat value={exceeded.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                            </div>
                          }
                        </div> : ''}
                      </div>
                      <div className="form-row">
                        <FormGroup className="col-md-3">
                          <Label for="ves">BsF</Label>
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
                                {/* <option key="FATTORIA BICENTENARIO" name="FATTORIA BICENTENARIO" value="FATTORIA BICENTENARIO">EMBUTIDOS FATTORIA - BICENTENARIO</option> */}
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
                        <Button color="primary" disabled={total == 0 || registering || updatingPendigVales}>
                          {(updatingPendigVales) && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          Pagar vale
                        </Button>{' '}
                      </Col>

                      <Col>
                        <Button color="primary" disabled={total == 0 || registering || updatingPendigVales || exceeded > 0 || !collapses.includes(1)} onClick={() => {onRegisterPayment(watch())}}>
                          {(updatingPendigVales) && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          Realizar Abono
                        </Button>{' '}
                      </Col>
                      <Col>
                        <Button
                          color="primary"
                          disabled={total == 0 || registering || updatingPendigVales}
                          onClick={() => {
                            setModalMsg('¿Está seguro que desea marcar como pagado este vale sin dinero?');
                            setModalVisible(true);
                          }}
                        >
                          {(updatingPendigVales) && (
                            <span className="spinner-border spinner-border-sm mr-1"></span>
                          )}
                          Marcar pagado
                        </Button>{' '}
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
                    {((exceeded > 0) || (modalChangePayment)) && <>
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
                                min={0}
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
                            <Button color="primary" disabled={(registering || updatingPendigVales)}>
                              {(registering || updatingPendigVales) && <span className="spinner-border spinner-border-sm mr-1"></span>}
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
              <Modal toggle={() => { setModalChangePayment(false) ; setModalMsg('') }} isOpen={modalChangePayment}>
                <div className="modal-header">
                  <h5 className="modal-title" id="examplemodalMsgLabel">
                    Forma de cambio
                  </h5>
                  <button
                    aria-label="Close"
                    className="close"
                    type="button"
                    onClick={() => { setModalChangePayment(false) ; setModalMsg('') }}
                  >
                    <span aria-hidden={true}>×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: 20 }}>
                    {((exceeded > 0) || (modalChangePayment)) && <>
                      
                      <Form onSubmit={handleSubmitChangePayment(onRegisterChangePayment)}>
                        <Row>
                          <div className="col">
                            <FormGroup>
                              <Label for="typeChangePayment">Forma de pago</Label>
                              <select className={'form-control' + (errorsChangePayment.typeChangePayment ? ' is-invalid' : '')} name="typeChangePayment"
                                ref={registerChangePayment({
                                  required: "El tipo de divisa es requerido"
                                })}>

                                <option key="0" name="" value="">Seleccione</option>
                                <option key="5" name="5" value="5">No requiere cambio</option>
                                <option key="1" name="1" value="1">BsS</option>
                                <option key="2" name="2" value="2">Dólar</option>
                                <option key="3" name="3" value="3">Euros</option>
                                <option key="4" name="4" value="4">Pesos</option>
                              </select>
                              {errorsChange.typeChangePayment && <div className="invalid-feedback d-block">{errorsChangePayment.typeChangePayment.message}</div>}
                            </FormGroup>
                          </div>
                          <div className="col">
                            <FormGroup>
                              <Label for="changeAmmountPayment">Monto</Label>
                              <Controller
                                name="changeAmmountPayment"
                                control={controlChangePayment}
                                min={0}
                                disabled={typeChangePayment == '5'}
                                rules={{
                                  required: (typeChangePayment == '5' ? false : "El monto es requerido"),
                                  validate: value => {
                                    if ((typeChangePayment != '5')){
                                      let amount = parseFloat(value.toString().replace(/,/g, ''));
                                      if (value == '' || value < 0) {
                                        return "El monto es requerido"
                                      }
                                    }
                                  },
                                    min: {
                                      value: 0,
                                      message: "El valor no puede ser negativo"
                                    },
                                }}
                                as={<NumberFormat className={'form-control' + (errorsChangePayment.changeAmmountPayment ? ' is-invalid' : '')} thousandSeparator={true} />}
                              />
                              {errorsChangePayment.changeAmmountPayment && <div className="invalid-feedback">{errorsChangePayment.changeAmmountPayment.message}</div>}
                            </FormGroup>
                          </div>
                        </Row>
                        <Row>
                          <Col>
                            <Button color="primary" disabled={(registering || updatingPendigVales)}>
                              {(registering || updatingPendigVales) && <span className="spinner-border spinner-border-sm mr-1"></span>}
                              Procesar cambio
                            </Button>
                          </Col>
                          <Col>
                            <div className="pull-right">
                              <Button color="secondary" type="button" onClick={() => { setModalChangePayment(false); setModalMsg('') }}>
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

              {/* Modal de cuentas pendientes*/}
              <Modal toggle={() => { clearModal() }} isOpen={modalPendingPayments} className={`modal-lg ${darkMode ? "dark-mode" : ""}`} backdrop="static">
                <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                  <h5 className="modal-title" id="examplemodalMsgLabel">Cuentas pendientes</h5>
                  <button aria-label="Close" className="close" type="button" onClick={() => { clearModal() }} disabled={loadingPendingPayments}>
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
                        sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
                        title="Cuentas pendientes"
                        progressPending={loadingPendingPayments}
                        paginationComponentOptions={paginationOptions}
                        progressComponent={<CustomLoader />}
                        noDataComponent="No hay registros para mostrar"
                        noHeader={true}
                        columns={columns}
                        data={pendingVales}
                        pagination
                        paginationServer
                        paginationTotalRows={rowCount}
                        onChangeRowsPerPage={handlePerRowsChange}
                                        onChangePage={handlePageChange}
                        persistTableHead
                        onRowClicked={onClickPendingPayment}
                        pointerOnHover={true}
                                        theme={darkMode ? "dark" : "default"}
                      />
                    </Col>
                  </Row>
                </div>
                <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                  <Button color="secondary" type="button" onClick={() => { clearModal() }} disabled={loadingPendingPayments}>Cerrar</Button>
                </div>
              </Modal>
               <Modal
                  toggle={() => {
                    setModalVisible(false);
                    setModalMsg("");
                    setInvoiceIdToAnulate(null);
                  }}
                  isOpen={modalVisible}
                >
                  <div className="modal-header">
                    <h5 className="modal-title" id="examplemodalMsgLabel">
                      Cancelar Vale sin dinero
                    </h5>
                    <button
                      aria-label="Close"
                      className="close"
                      type="button"
                      onClick={() => {
                        setModalVisible(false);
                        setModalMsg("");
                        setInvoiceIdToAnulate(null);
                      }}
                    >
                      <span aria-hidden={true}>×</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>{modalMsg}</p>
                    <textarea
                      className="form-control"
                      label="Motivo de pago"
                      placeholder="Escribir motivo..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <Button
                      color="secondary"
                      type="button"
                      onClick={() => {
                        setModalVisible(false);
                        setModalMsg("");
                        setInvoiceIdToAnulate(null);
                        setComment("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="danger"
                      type="button"
                      onClick={() => {
                        submitMarkAsPaidWithComment(comment);
                        setModalVisible(false);
                        setModalMsg("");
                        setComment("");
                      }}
                      disabled={!comment}
                    >
                      Confirmar pago
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

export default ValePaymentPage;