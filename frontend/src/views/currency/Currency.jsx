import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { currencyDollarActions } from '../../actions/currencyDollar.actions';
import moment from 'moment';
import DataTable from 'react-data-table-component';
import { Row, Col } from 'reactstrap';
import '../../assets/css/table.css';
import AdminNavbar from '../../components/Navbars/AdminNavbar';
import SideBar from '../../components/SideBar/SideBar';
import CoinListPage from '../coin/CoinList';

const Currency = () => {
  const dispatch = useDispatch();

  // Obtener datos de divisas desde Redux
  const state = useSelector(state => state.currencyDollar || {});
  const { data } = state;

  // Obtener información del BCV
  const bcvData = data?.monitors?.bcv;



  // Usar useEffect para obtener datos de divisas
  useEffect(() => {
    dispatch(currencyDollarActions.fetchCurrencyDollarData());
  }, [dispatch]);

  // Columnas de la tabla de divisas
  const columns = [
    {
      name: 'Moneda',
      selector: 'title',
      sortable: true,
    },
    {
      name: 'Valor',
      selector: 'price',
      sortable: true,
      cell: row => <span>{row.price} {row.symbol}</span>,
    },
    {
      name: 'Precio Anterior',
      selector: 'price_old',
      sortable: true,
      cell: row => <span>{row.price_old}</span>,
    },
    {
      name: 'Cambio',
      selector: 'change',
      sortable: true,
      cell: row => <span>{row.change} ({row.percent}%)</span>,
    },
    {
      name: 'Última actualización',
      selector: 'last_update',
      sortable: true,
      cell: row => moment(row.last_update, "DD/MM/YYYY, hh:mm A").format("YYYY-MM-DD hh:mm:ss A"),

    },
  ];

  // Si no hay datos disponibles para el BCV
  if (!bcvData) {
    return <p>No hay datos disponibles para BCV.</p>;
  }

  return (
    <div className="d-flex" id="wrapper">				
    <SideBar/>

      <div id="page-content-wrapper">
      <AdminNavbar/>
        <div className="flex-column flex-md-row p-3">
          <Row>
            <Col>
              <h3 style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Valor de Moneda</h3>
              <DataTable
                className="dataTables_wrapper"
                responsive
                highlightOnHover
                striped
                columns={columns}
                data={[bcvData]}  // Usamos los datos del BCV en la tabla
                noDataComponent="No hay datos disponibles"
              />
            </Col>
            

          </Row>
        </div>
        <CoinListPage/>

      </div>
    </div>
  );
};

export default Currency;
