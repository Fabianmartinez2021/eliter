/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, orderMarketMiscellaneousActions, miscellaneousActions } from '../../actions';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import { Col, Row, Button, Form, FormGroup, Label, Container, Table, Modal, Alert } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { WeightProduct } from '../../helpers/weight';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import Swal from 'sweetalert2';

function SupplyUpdatedPage() {
    const location = history.location;
    const noteId = location.state && location.state.id ? location.state.id : null;

    // Refs para controlar el comportamiento de las alertas
    const previousNoteIdRef = useRef(null);
    const isFirstRender = useRef(true);
    const hasUpdatedRef = useRef(false);
    const isProcessingRef = useRef(false); // Ref para evitar múltiples envíos simultáneos

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    const { darkMode } = useDarkMode();
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    const sales = useSelector(state => state.sales);
    const orderMarketMiscellaneousState = useSelector(state => state.orderMarketMiscellaneous);
    const miscellaneousState = useSelector(state => state.miscellaneous);
    //Alertas
    const alert = useSelector(state => state.alert);
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if (alert.message) {
            setVisible(true);
            window.setTimeout(() => { setVisible(false) }, 5000);
        }
    }, [alert]);

    useEffect(() => {
        dispatch(miscellaneousActions.dataTable());
    }, []);

    // Obtener productos, monedas, tiendas y choferes
    useEffect(() => {
        dispatch(salesActions.salesDataForm(user.agency.id));
    }, []);

    // Obtener la nota a editar
    useEffect(() => {
        if (!noteId) return;

        const noteIdChanged = noteId !== previousNoteIdRef.current;

        // Si cambió el noteId, resetear todo y limpiar la nota actual
        if (noteIdChanged) {
            previousNoteIdRef.current = noteId;
            hasUpdatedRef.current = false;
            isFirstRender.current = true;

            // Limpiar los estados locales
            setTableSale([]);
            setTotal(0);
            setTotalWeight(0);
            setNoteDetails({
                marketId: '',
                marketName: '',
                marketCompany: '',
                marketAttendant: '',
                marketAddress: '',
                driverId: '',
                driverName: '',
                status: ''
            });
            originalProductsRef.current = [];
            originalTotalsRef.current = { total: 0, totalWeight: 0 };
            originalNoteRef.current = null;

            // Hacer nueva petición para obtener la nueva nota
            dispatch(orderMarketMiscellaneousActions.getOrderMarketMiscellaneous(noteId));
        } else if (!orderMarketMiscellaneousState.currentNote) {
            // Si es la primera vez y no hay currentNote, hacer la petición
            dispatch(orderMarketMiscellaneousActions.getOrderMarketMiscellaneous(noteId));
        }
    }, [noteId]);

    const [listCoin, setListCoin] = useState(null);
    const [listProducts, setListProducts] = useState(null);
    const [offerProducts, setOfferProducts] = useState(null);
    const [noteDetails, setNoteDetails] = useState({
        marketId: '',
        marketName: '',
        marketCompany: '',
        marketAttendant: '',
        marketAddress: '',
        driverId: '',
        driverName: '',
        status: ''
    });
    const [hasChanges, setHasChanges] = useState(false);
    const originalProductsRef = useRef([]);
    const originalTotalsRef = useRef({ total: 0, totalWeight: 0 });
    const originalNoteRef = useRef(null); // Guardar la nota original completa

    useEffect(() => {
        if (miscellaneousState.obtained && miscellaneousState.data?.results) {
            setListProducts(miscellaneousState.data.results);
        }
    }, [miscellaneousState.obtained, miscellaneousState.data]);

    useEffect(() => {
        if (sales.obtained && sales.data) {
            setListCoin(sales.data.coins);
            setOfferProducts(sales.data.offers);
        }
    }, [sales.obtained, sales.data]);

    // Cargar datos de la nota cuando se obtiene del backend
    useEffect(() => {
        if (orderMarketMiscellaneousState.currentNote && noteId) {
            const note = orderMarketMiscellaneousState.currentNote;

            // Verificar que la nota cargada corresponde al noteId actual
            const noteIdFromState = note.id || note._id;
            if (noteIdFromState !== noteId) {
                // Si no coincide, limpiar y esperar la correcta
                return;
            }

            const productsFromNote = (note.products || []).map(item => ({ ...item }));
            setTableSale(productsFromNote);
            setTotal(note.total || 0);
            setTotalWeight(note.totalWeight || 0);

            const marketIdSel = typeof note.marketId === 'object' ? (note.marketId._id || note.marketId.id) : (note.marketId || '');
            const driverIdSel = typeof note.driverId === 'object' ? (note.driverId._id || note.driverId.id) : (note.driverId || '');

            setNoteDetails({
                marketId: marketIdSel || '',
                marketName: note.marketName || '',
                marketCompany: note.marketCompany || '',
                marketAttendant: note.marketAttendant || '',
                marketAddress: note.marketAddress || '',
                driverId: driverIdSel || '',
                driverName: note.driverName || '',
                status: note.status || ''
            });
            originalProductsRef.current = productsFromNote.map(item => ({ ...item }));
            // Guardar también el total y totalWeight original
            originalTotalsRef.current = {
                total: note.total || 0,
                totalWeight: note.totalWeight || 0
            };
            // Guardar la nota original completa para enviarla al backend
            originalNoteRef.current = {
                ...note,
                products: productsFromNote.map(item => ({ ...item }))
            };
            setHasChanges(false);
        }
    }, [orderMarketMiscellaneousState.currentNote, noteId]);

    // Resetear el flag de procesamiento cuando termine la actualización (éxito o error)
    useEffect(() => {
        if (!orderMarketMiscellaneousState.updating && isProcessingRef.current) {
            // Si updating es false y estaba procesando, significa que terminó
            isProcessingRef.current = false;
        }
    }, [orderMarketMiscellaneousState.updating]);

    // Manejar éxito de actualización
    useEffect(() => {
        // Evitar que se ejecute en el montaje inicial
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Solo redirigir si successUpdated es true, updating es false, y realmente se hizo una actualización
        if (orderMarketMiscellaneousState.successUpdated && !orderMarketMiscellaneousState.updating && hasUpdatedRef.current) {
            hasUpdatedRef.current = false;
            isProcessingRef.current = false; // Asegurar que se resetee
            // Pequeño delay para que se muestre la alerta de éxito
            setTimeout(() => {
                history.push('/supply-notes');
            }, 1500);
        }
    }, [orderMarketMiscellaneousState.successUpdated, orderMarketMiscellaneousState.updating]);

    const { handleSubmit, register, errors, reset, control } = useForm();
    const { handleSubmit: handleSubmitUpdate } = useForm();

    const [tableSale, setTableSale] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalWeight, setTotalWeight] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');
    const [presentation, setPresentation] = useState('');

    const codeRef = useRef();

    useEffect(() => {
        if (!orderMarketMiscellaneousState.currentNote) return;
        const diff = computeModifiedProducts(tableSale);
        setHasChanges(diff.length > 0);
    }, [tableSale, orderMarketMiscellaneousState.currentNote]);

    // Igual que SalesUpdatedPage - getProductKey con soporte para product poblado (miscellaneous)
    const getProductKey = (product) => {
        if (!product) return '';
        const prodRef = typeof product.product === 'object' ? product.product : null;
        return (
            product.id ||
            product._id ||
            product.productId ||
            prodRef?.id ||
            prodRef?._id ||
            product.code ||
            (product.name ? `name-${product.name}` : '')
        ).toString();
    };

    // sanitizeProduct adaptado para miscellaneous (lastPrice, product ref)
    const sanitizeProduct = (product = {}) => {
        const prodRef = typeof product.product === 'object' ? product.product : null;
        const priceVal = product.price ?? product.lastPrice ?? 0;
        return {
            id: product.id ?? product._id ?? product.productId ?? prodRef?.id ?? prodRef?._id ?? null,
            code: String(product.code ?? prodRef?.code ?? '').trim(),
            name: product.name ?? prodRef?.name ?? '',
            kg: parseFloat(product.kg ?? 0),
            units: parseFloat(product.units ?? 0),
            price: parseFloat(priceVal),
            total: parseFloat(product.total ?? 0),
            regularPrice: parseFloat(product.regularPrice ?? product.lastPrice ?? priceVal),
            differential: parseFloat(product.differential ?? 0),
            isOffer: !!product.isOffer,
            presentation: product.presentation ?? '',
            wholesalePrice: parseFloat(product.wholesalePrice ?? 0),
            wholesaleDiscountPrice: parseFloat(product.wholesaleDiscountPrice ?? 0),
            applyWholesaleDiscount: !!product.applyWholesaleDiscount,
        };
    };

    const buildEntries = (products = []) =>
        products.map((product, index) => ({
            raw: product,
            sanitized: sanitizeProduct(product),
            key: getProductKey(product) || `index-${index}`,
            matched: false,
        }));

    // computeModifiedProducts - misma lógica que SalesUpdatedPage
    const computeModifiedProducts = (currentProducts = []) => {
        const currentEntries = buildEntries(currentProducts);
        const originalEntries = buildEntries(originalProductsRef.current || []);
        const changes = [];

        currentEntries.forEach((currentEntry) => {
            let matchIndex = originalEntries.findIndex((originalEntry) => {
                if (originalEntry.matched) return false;
                if (currentEntry.key && originalEntry.key && currentEntry.key === originalEntry.key) return true;
                if (
                    currentEntry.sanitized.code &&
                    originalEntry.sanitized.code &&
                    currentEntry.sanitized.code === originalEntry.sanitized.code
                ) return true;
                if (
                    currentEntry.sanitized.name &&
                    originalEntry.sanitized.name &&
                    currentEntry.sanitized.name === originalEntry.sanitized.name
                ) return true;
                return false;
            });

            if (matchIndex === -1) {
                changes.push({ type: 'added', product: currentEntry.raw });
            } else {
                const matchedEntry = originalEntries[matchIndex];
                matchedEntry.matched = true;
                if (JSON.stringify(matchedEntry.sanitized) !== JSON.stringify(currentEntry.sanitized)) {
                    changes.push({
                        type: 'updated',
                        before: matchedEntry.raw,
                        after: currentEntry.raw,
                    });
                }
            }
        });

        originalEntries
            .filter((entry) => !entry.matched)
            .forEach((entry) => {
                changes.push({ type: 'removed', product: entry.raw });
            });

        return changes;
    };

    // Extraer solo id, name, code, kg para modifiedProducts (formato simplificado backend)
    // Asegurando que el id corresponda SIEMPRE al producto real (catálogo) usando el código
    const toSimpleProduct = (p) => {
        const prodRef = typeof p?.product === 'object' ? p.product : null;
        const currentId = p?.id ?? p?._id ?? prodRef?.id ?? prodRef?._id ?? p?.product ?? null;
        const code = String(p?.code ?? prodRef?.code ?? '').trim();

        let catalogRef = null;
        if (Array.isArray(listProducts)) {
            catalogRef = listProducts.find(lp =>
                lp.id === currentId ||
                lp._id === currentId ||
                (code && String(lp.code || '').trim() === code)
            ) || null;
        }

        const resolvedId = catalogRef?.id ?? catalogRef?._id ?? currentId;
        const name = p?.name ?? prodRef?.name ?? catalogRef?.name ?? '';

        return {
            id: resolvedId,
            name,
            code,
            kg: parseFloat(p?.kg ?? 0)
        };
    };

    // Añadir producto a tabla
    const onCreateData = (data, e) => {
        if (!listProducts || !Array.isArray(listProducts)) {
            setModalVisible(true);
            setModalMsg('Los productos aún no se han cargado. Por favor, espere un momento.');
            return;
        }
        // Normalizar códigos a string para comparar (miscellaneous puede devolver code como número)
        let productFilter = listProducts.filter(item => String(item.code || '').trim() === String(data.code || '').trim());

        if (productFilter.length == 0) {
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
            return;
        }

        var offer = null;
        const dataCodeNorm = String(data.code || '').trim();
        if (offerProducts && offerProducts.length > 0) {
            offer = offerProducts.find(item => String(item.product?.code || '').trim() === dataCodeNorm);
        }

        if (productFilter[0].presentation === "Unidades") {
            if (data.kg != Math.round(data.kg)) {
                setModalVisible(true);
                setModalMsg(productFilter[0].name + ' se vende por unidades, por lo que sólo se debe ingresar numeros enteros');
                return;
            }
        }

        // Verificar si el producto ya está en la tabla (igual que SalesUpdatedPage)
        const productExists = tableSale.some(item => {
            const itemCode = String(item.code ?? (typeof item.product === 'object' ? item.product?.code : '') ?? '').trim();
            const dataCode = String(data.code || '').trim();
            return itemCode === dataCode;
        });
        if (productExists) {
            Swal.fire({
                icon: 'warning',
                text: 'El producto ya esta en la lista',
                confirmButtonText: 'Entendido',
                confirmButtonColor: 'red'
            });
            return;
        }

        const target = { ...productFilter[0] };
        const kg = parseFloat(data.kg) || 0;
        const valueDollar = listCoin && listCoin[0] && listCoin[0].value ? parseFloat(listCoin[0].value) : 1;
        const basePrice = offer ? parseFloat(offer.price || 0) : parseFloat(productFilter[0].price || 0);
        const price = Number.isNaN(basePrice) ? 0 : parseFloat(basePrice.toFixed(2) * valueDollar);
        const regularPrice = parseFloat(productFilter[0].price) || price;
        const differential = (regularPrice && price && kg) ? (regularPrice - price) * kg : 0;
        const priceDollar = valueDollar > 0 ? price / valueDollar : 0;

        const source = {
            kg: kg,
            units: 0,
            price: price,
            regularPrice: regularPrice,
            differential: isNaN(differential) ? 0 : differential,
            isWholesale: !!target.isWholesale,
            isOffer: !!offer,
            total: kg * price,
            totalDollars: kg * priceDollar,
            applyWholesaleDiscount: productFilter[0].applyWholesaleDiscount,
            wholesalePrice: parseFloat(productFilter[0].wholesalePrice) || 0,
            wholesaleDiscountPrice: parseFloat(productFilter[0].wholesaleDiscountPrice) || 0
        };
        setPresentation(target.presentation);

        let preSale = [...tableSale];
        preSale.unshift(Object.assign(target, source));
        setTableSale(preSale);
        setTotal(0);
        setTotalWeight(0);
        var sum = 0;
        var sumWeight = 0;
        preSale.forEach((product) => {
            sum += product.total || 0;
            const getWeight = WeightProduct.find(prod => prod.code == product.code);
            if (getWeight) {
                sumWeight += product.kg * getWeight.weight;
            } else {
                sumWeight += product.kg;
            }
        });
        setTotal(sum);
        setTotalWeight(sumWeight);

        if (codeRef.current) codeRef.current.focus();
        reset({
            code: '',
            kg: ''
        });
    };

    const removeItem = (prod) => {
        let preSale = tableSale.filter(item => item !== prod);
        setTableSale(preSale);
        let sum = 0;
        var sumWeight = 0;
        preSale.forEach((product) => {
            sum += product.total || 0;
            const getWeight = WeightProduct.find(prod => prod.code == product.code);
            if (getWeight) {
                sumWeight += product.kg * getWeight.weight;
            } else {
                sumWeight += product.kg;
            }
        });
        setTotal(sum);
        setTotalWeight(sumWeight);
    };

    const onUpdateNote = (data, e) => {
        e.preventDefault();

        // Bloquear si ya se está procesando una actualización
        if (isProcessingRef.current || orderMarketMiscellaneousState.updating) {
            return;
        }

        // Validar solo que exista al menos un producto en la lista
        if (!Array.isArray(tableSale) || tableSale.length === 0) {
            setModalVisible(true);
            setModalMsg('Debe ingresar al menos un producto');
            return;
        }

        // Marcar como procesando
        isProcessingRef.current = true;

        // Normalizar productos actuales (igual que SalesUpdatedPage, con lastPrice para miscellaneous)
        const normalizedItems = (Array.isArray(tableSale) ? tableSale : []).map(p => {
            const pId = p.id ?? p._id ?? (typeof p.product === 'object' ? (p.product?.id ?? p.product?._id) : p.product);
            const ref = (listProducts || []).find(lp =>
                lp.id === pId ||
                lp._id === pId ||
                String(lp.code || '').trim() === String(p.code || '').trim() ||
                lp.name === p.name
            ) || {};
            // Forzar que el id que se envía sea el del producto real (catálogo) si existe
            const resolvedId = ref.id ?? ref._id ?? pId ?? null;
            const codeNorm = String(p.code || ref.code || '').trim();
            const priceVal = p.price ?? p.lastPrice ?? 0;
            return {
                name: p.name,
                price: priceVal,
                lastPrice: p.lastPrice ?? priceVal,
                regularPrice: p.regularPrice ?? p.lastPrice ?? priceVal,
                differential: p.differential ?? 0,
                isOffer: p.isOffer ?? false,
                kg: p.kg || 0,
                units: p.units ?? 0,
                total: p.total || 0,
                code: codeNorm,
                // Aseguramos que TODOS los campos de id apunten al producto correcto
                id: resolvedId,
                product: resolvedId,
                productId: resolvedId,
                presentation: p.presentation || ref.presentation,
                wholesalePrice: p.wholesalePrice ?? ref.wholesalePrice,
                wholesaleDiscountPrice: p.wholesaleDiscountPrice ?? ref.wholesaleDiscountPrice,
                applyWholesaleDiscount: p.applyWholesaleDiscount ?? ref.applyWholesaleDiscount,
            };
        });

        // Normalizar productos originales
        const originalProductsArray = Array.isArray(originalProductsRef.current) ? originalProductsRef.current : [];

        const normalizedOriginalItems = originalProductsArray.map(p => {
            const origPId = p.id ?? p._id ?? (typeof p.product === 'object' ? (p.product?.id ?? p.product?._id) : p.product);
            const ref = (listProducts || []).find(lp =>
                lp.id === origPId ||
                lp._id === origPId ||
                String(lp.code || '').trim() === String(p.code || '').trim() ||
                lp.name === p.name
            ) || {};
            // Igual que arriba: usar siempre el id del producto de catálogo si está disponible
            const resolvedId = ref.id ?? ref._id ?? origPId ?? null;
            const codeNorm = String(p.code || ref.code || '').trim();
            const priceVal = p.price ?? p.lastPrice ?? 0;
            return {
                name: p.name,
                price: priceVal,
                lastPrice: p.lastPrice ?? priceVal,
                regularPrice: p.regularPrice ?? p.lastPrice ?? priceVal,
                differential: p.differential ?? 0,
                isOffer: p.isOffer ?? false,
                kg: p.kg || 0,
                units: p.units ?? 0,
                total: p.total || 0,
                code: codeNorm,
                // También aquí todos los campos usan el id correcto
                id: resolvedId,
                product: resolvedId,
                productId: resolvedId,
                presentation: p.presentation || ref.presentation,
                wholesalePrice: p.wholesalePrice ?? ref.wholesalePrice,
                wholesaleDiscountPrice: p.wholesaleDiscountPrice ?? ref.wholesaleDiscountPrice,
                applyWholesaleDiscount: p.applyWholesaleDiscount ?? ref.applyWholesaleDiscount,
            };
        });

        // Obtener total y totalWeight originales desde el ref
        const originalTotal = originalTotalsRef.current.total || normalizedOriginalItems.reduce((sum, p) => sum + (p.total || 0), 0);
        const originalTotalWeight = originalTotalsRef.current.totalWeight || normalizedOriginalItems.reduce((sum, p) => {
            const getWeight = WeightProduct.find(prod => prod.code === p.code);
            if (getWeight) {
                return sum + (p.kg || 0) * getWeight.weight;
            }
            return sum + (p.kg || 0);
        }, 0);

        const updateData = {
            // Productos modificados (la tabla actual después de modificar)
            items: normalizedItems,
            products: normalizedItems,
            total: total,
            totalWeight: totalWeight,
            marketId: noteDetails.marketId || null,
            marketName: noteDetails.marketName || '',
            marketCompany: noteDetails.marketCompany || '',
            marketAttendant: noteDetails.marketAttendant || '',
            marketAddress: noteDetails.marketAddress || '',
            driverId: noteDetails.driverId || null,
            driverName: noteDetails.driverName || '',
            // Nota original completa (todos los campos antes de modificar)
            originalData: originalNoteRef.current ? {
                // Productos originales
                products: normalizedOriginalItems,
                // Totales originales
                total: originalTotal,
                totalWeight: originalTotalWeight,
                // Información de la nota original
                marketId: originalNoteRef.current.marketId || null,
                marketName: originalNoteRef.current.marketName || '',
                marketCompany: originalNoteRef.current.marketCompany || '',
                marketAttendant: originalNoteRef.current.marketAttendant || '',
                marketAddress: originalNoteRef.current.marketAddress || '',
                driverId: originalNoteRef.current.driverId || null,
                driverName: originalNoteRef.current.driverName || '',
                order: originalNoteRef.current.order || null,
                valueDollar: originalNoteRef.current.valueDollar || null,
                totalDollar: originalNoteRef.current.totalDollar || null,
                status: originalNoteRef.current.status || '',
                // Cualquier otro campo de la nota original que pueda ser importante
                ...(originalNoteRef.current.createdDate && { createdDate: originalNoteRef.current.createdDate }),
                ...(originalNoteRef.current.userId && { userId: originalNoteRef.current.userId }),
                ...(originalNoteRef.current.userName && { userName: originalNoteRef.current.userName }),
                ...(originalNoteRef.current.agency && { agency: originalNoteRef.current.agency }),
            } : {
                // Fallback si no hay nota original guardada
                products: normalizedOriginalItems,
                total: originalTotal,
                totalWeight: originalTotalWeight,
            },
        };

        const noteDollarValue = listCoin && listCoin[0] && listCoin[0].value ? parseFloat(listCoin[0].value) : null;
        updateData.valueDollar = noteDollarValue !== null ? noteDollarValue.toFixed(2) : '0.00';
        updateData.totalDollar = noteDollarValue ? parseFloat((total / noteDollarValue).toFixed(2)) : 0;

        const changes = computeModifiedProducts(tableSale);

        if (changes.length > 0) {
            updateData.status = 'modified';
            // modifiedProducts: solo id, name, code, kg (formato simplificado para backend)
            updateData.modifiedProducts = changes.map((change) => {
                if (change.type === 'updated') {
                    return {
                        type: 'updated',
                        before: toSimpleProduct(change.before),
                        after: toSimpleProduct(change.after),
                    };
                }
                return {
                    type: change.type,
                    product: toSimpleProduct(change.product),
                };
            });
        } else {
            updateData.status = 'acept';
            updateData.modifiedProducts = [];
        }

        hasUpdatedRef.current = true;


        console.log('updateData', updateData);

        dispatch(orderMarketMiscellaneousActions.updateOrderMarketMiscellaneous(noteId, updateData));
    };

    if (!noteId) {
        return (
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="container-fluid">
                        <Container>
                            <Row>
                                <Col>
                                    <p>No se proporcionó un ID de nota válido.</p>
                                    <Button onClick={() => history.push('/supply-notes')}>Volver</Button>
                                </Col>
                            </Row>
                        </Container>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
            <SideBar />
            <div id="page-content-wrapper">
                <AdminNavbar />
                <div className="container-fluid">
                    <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <div style={{ marginBottom: 20 }}>
                                    {(miscellaneousState.loading || orderMarketMiscellaneousState.updating) && <span className="spinner-border spinner-border-sm mr-1"></span>}
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
                                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Editar nota de entrega de suministros</h3>
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
                                <Row form style={{ marginBottom: 15 }}>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="marketName">Tienda</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketName"
                                                value={noteDetails.marketName}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="driverName">Chofer</Label>
                                            <input
                                                className={'form-control'}
                                                name="driverName"
                                                value={noteDetails.driverName}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row form>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="marketCompany">Empresa</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketCompany"
                                                value={noteDetails.marketCompany}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="marketAttendant">Encargado</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketAttendant"
                                                value={noteDetails.marketAttendant}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="marketAddress">Dirección</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketAddress"
                                                value={noteDetails.marketAddress}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Form onSubmit={handleSubmit(onCreateData)} className="form" style={{ border: '1px solid #dee2e6', padding: '10px 20px', borderRadius: '5px', marginBottom: '5px' }}>
                                    <Row form style={{ marginTop: '12px' }}>
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
                                                    pattern: {
                                                        value: /^(?=.*\d)\d*(\.\d+)?$/,
                                                        message: "Ingresa un peso válido"
                                                    },
                                                    required: "El peso es requerido",
                                                }}
                                                as={<NumberFormat placeholder="Cantidad de kg" className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
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
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableSale && tableSale.map((product, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{product.name ?? product.product?.name ?? ''}</td>
                                                    <td><NumberFormat value={
                                                                product.presentation === "Unidades"
                                                                    ? parseInt(product.kg, 10)
                                                                    : Number(product.kg).toFixed(3)
                                                            }
                                                        displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                                    <td>
                                                        <Button className="btn-link" color="primary" style={{ margin: 0, padding: 0 }}
                                                            onClick={e => { e.preventDefault(); removeItem(product) }}>
                                                            <i className="fa fa-times-circle"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </Table>
                                
                                <Form onSubmit={handleSubmitUpdate(onUpdateNote)}>
                                    <Row>
                                        <Col>
                                            <Button 
                                                color="primary" 
                                                disabled={orderMarketMiscellaneousState.updating || isProcessingRef.current}
                                                type="submit"
                                            >
                                                {orderMarketMiscellaneousState.updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                Guardar Cambios
                                            </Button>
                                        </Col>
                                        <Col>
                                            <div className="pull-right">
                                                <Button onClick={(e) => { e.preventDefault(); history.push('/supply-notes'); }}>Cancelar</Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    Mensaje
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
                    </Container>
                </div>
            </div>
        </div>
    );
}

export default SupplyUpdatedPage;

