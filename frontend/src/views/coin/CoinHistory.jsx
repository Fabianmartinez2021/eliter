/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Row, Col } from 'reactstrap';

import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import CurrencyHistoryPage from '../currency/CurrencyHistory';
import CoinHistoryPage from './CoinHistoryM';

function CoinHistory() {
	const user = useSelector(state => state.authentication.user);

	// Estado para controlar qué vista se muestra
	const [view, setView] = useState('currency'); // 'currency' o 'user'

	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return () => {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
	}, []);

	return (
		<>
			<div className="d-flex" id="wrapper">
				<SideBar />
				<div id="page-content-wrapper">
					<AdminNavbar />
					<div className="flex-column flex-md-row p-3">
						
						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: 0 }}>Historial de valor de moneda</h3>
						</div>

						{/* Botones para cambiar entre vistas */}
						<div className="d-flex justify-content-start mb-3">
							<Button style={{ marginLeft: '20px' }} color={view === 'currency' ? 'primary' : 'secondary'} onClick={() => setView('currency')}>
								BCV
							</Button>
							<Button color={view === 'user' ? 'primary' : 'secondary'} onClick={() => setView('user')} className="ml-2">
								Usuario
							</Button>
						</div>

						{/* Renderizar contenido basado en la vista seleccionada */}
						{view === 'currency' && <CurrencyHistoryPage />}
						{view === 'user' && <CoinHistoryPage/>} <div>{/* Aquí podrías renderizar el contenido del usuario si lo necesitas */}</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default CoinHistory;
