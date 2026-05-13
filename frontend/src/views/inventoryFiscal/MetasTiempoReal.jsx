/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userActions } from "../../actions";
import { salesService } from "../../services";

// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import {
  Button,
  Row,
  Col,
  Form,
  FormGroup,
  Modal,
} from "reactstrap";

import "../../assets/css/table.css";
import "../../assets/css/filters.css";
import NumberFormat from "react-number-format";
import { useForm } from "react-hook-form";
import { useDarkMode } from "../../helpers/darkModeContext";
import "../../assets/css/darkMode.css";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

const CustomLoader = () => (<><div className="loading-table"></div></>);

function RealTimeGoalsPage() {
  useEffect(() => {
    document.body.classList.add("landing-page");
    document.body.classList.add("sidebar-collapse");
    document.documentElement.classList.remove("nav-open");
    return function cleanup() {
      document.body.classList.remove("landing-page");
      document.body.classList.remove("sidebar-collapse");
    };
  }, []);

  // Modo oscuro 
  const { darkMode } = useDarkMode();

  // Usuario
  const user = useSelector((state) => state.authentication.user);
  const dispatch = useDispatch();

  // Obtener data de usuario necesaria
  const getUserData = () => {
    return {
      agency: user.agency.id,
      role: user.role,
      id: user.id,
    };
  };

  // Obtener sucursales para select
  const getting = useSelector((state) => state.users.getting);
  const users = useSelector((state) => state.users);

  useEffect(() => {
    if (user && user.agency && user.agency.id) {
      dispatch(userActions.getListUserAgencies(getUserData()));
    }
  }, [dispatch, user]);

  const [listAgencies, setListAgencies] = useState(null);

  useEffect(() => {
    if (users.obtained) {
      setListAgencies(users.list.agencies);
    }
  }, [users.obtained, users.list]);

  // Estado de filtros
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedAgencyName, setSelectedAgencyName] = useState("");

  // Estado para datos de metas
  const [weeklyDetalData, setWeeklyDetalData] = useState(null);
  const [weeklyWholesaleData, setWeeklyWholesaleData] = useState(null);
  const [loadingDetal, setLoadingDetal] = useState(false);
  const [loadingWholesale, setLoadingWholesale] = useState(false);

  // Abrir/Cerrar filtros
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  // Errores
  const [agencyError, setAgencyError] = useState("");

  // Modal genérico y mensaje
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  // Form filtros
  const { handleSubmit, register, reset, setValue, watch } = useForm();

  // Reglas de Hooks: sincronizar el primer valor de sucursal SIEMPRE en el nivel superior,
  // para evitar "Warning: React has detected a change in the order of Hooks".
  const agencyWatch = watch('agency');
  useSyncFirstAgencyFormField(listAgencies, setValue, agencyWatch);

  // Función reutilizable para cargar metas de una agencia
  const loadAgencyGoals = async (agencyId, agencyLabel) => {
    if (!agencyId) return;

    // Nombre que se muestra arriba de las cartas
    setSelectedAgencyName(agencyLabel || "");

    setHasSearched(true);
    setLoadingDetal(true);
    setLoadingWholesale(true);

    try {
      // Meta al detal
      const detalData = await salesService.getWeeklyTotalRealtime({
        agency: agencyId,
      });
      setWeeklyDetalData(detalData);
    } catch (error) {
      console.error("Error al obtener meta semanal (detal):", error);
      setModalVisible(true);
      setModalMsg("Ocurrió un error al obtener la meta semanal de detal.");
    } finally {
      setLoadingDetal(false);
    }

    try {
      // Meta al mayor
      const wholesaleData = await salesService.getWeeklyWholesalesGoalRealtime({
        agency: agencyId,
      });
      setWeeklyWholesaleData(wholesaleData);
    } catch (error) {
      console.error("Error al obtener meta semanal (mayor):", error);
      setModalVisible(true);
      setModalMsg("Ocurrió un error al obtener la meta semanal de ventas al mayor.");
    } finally {
      setLoadingWholesale(false);
    }
  };

  const clearFilters = () => {
    reset({ agency: "" });
    setHasSearched(false);
    setWeeklyDetalData(null);
    setWeeklyWholesaleData(null);
    setSelectedAgencyName("");
    setAgencyError("");
  };

  // Consultar por filtros (solo agencia)
  const onFilterData = async (data) => {
    setAgencyError("");

    if (!data.agency || data.agency === "") {
      setAgencyError("La sucursal es requerida");
      return;
    }

    const agencyId = data.agency;
    const agencyObj =
      listAgencies &&
      listAgencies.find((a) => String(a.id) === String(agencyId));

    // Construir label "NombreAgencia - NombreCompañía" si existe la compañía
    let agencyLabel = "";
    if (agencyObj) {
      const companyName = agencyObj.company || "";
      const agencyName = agencyObj.name || "";
      agencyLabel = companyName ? `${agencyName} - ${companyName}` : agencyName;
    }

    await loadAgencyGoals(agencyId, agencyLabel);
  };

  // Para rol 3: cargar automáticamente las metas de su propia agencia al entrar,
  // sin mostrar filtros ni requerir clic en "Buscar"
  useEffect(() => {
    if (
      user &&
      user.role === 3 &&
      user.agency &&
      user.agency.id &&
      !hasSearched
    ) {
      const agencyId = user.agency.id;
      const agencyName = user.agency.name || "";
      const companyName = user.agency.company || "";
      const label = companyName
        ? `${agencyName} - ${companyName}`
        : agencyName;

      loadAgencyGoals(agencyId, label);
    }
  }, [user, hasSearched]);


  const renderMetaCard = (title, data, loading, color) => {
    return (
      <Col md={6} className="mb-4">
        <div
          style={{
            padding: "20px",
            backgroundColor: darkMode ? "#2d3748" : "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderTop: `4px solid ${color}`,
            height: "100%",
          }}
        >
          <h6
            style={{
              color: darkMode ? "#fff" : "#000",
              fontWeight: "bold",
              marginBottom: "10px",
              fontSize: "14px",
              textTransform: "uppercase",
            }}
          >
            {title}
          </h6>

          {loading ? (
            <div
              style={{
                padding: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CustomLoader />
            </div>
          ) : !data ? (
            <div
              style={{
                padding: "10px 0",
                fontSize: "13px",
                color: darkMode ? "#a0aec0" : "#718096",
              }}
            >
              No hay datos disponibles para la sucursal seleccionada.
            </div>
          ) : (
            (() => {
              // Detectar si es carta de detal o de mayor según la estructura
              const detalCalc = data.weeklyGoalCalculation;
              const wholesaleCalc = data.wholesalesGoalCalculation;

              let metaAlcanzar = 0;
              let ventas = 0;
              let porcentajeObjetivo = 0;
              let porcentajeVentas = 0;
              let diferencial = 0;
              let currencyPrefix = "";

              if (detalCalc) {
                // Carta detal
                metaAlcanzar = detalCalc.weeklyGoal || 0;
                ventas = detalCalc.totalAmount || 0;
                porcentajeObjetivo =
                  detalCalc.weeklyGoalMinimumPercentageOfSales || 0;
                porcentajeVentas = detalCalc.weeklyGoalPercentage || 0;
                currencyPrefix = "Bs. ";
                // Diferencial que falta para alcanzar el porcentaje objetivo
                diferencial = Math.max(
                  porcentajeObjetivo - porcentajeVentas,
                  0
                );
              } else if (wholesaleCalc) {
                // Carta al mayor
                metaAlcanzar = wholesaleCalc.wholesalesGoal || 0;
                ventas = wholesaleCalc.totalWholesales || 0;
                porcentajeObjetivo = 100; // fijo 100%
                porcentajeVentas = wholesaleCalc.wholesalesGoalPercentage || 0;
                currencyPrefix = "$ ";
                // Diferencial que falta para llegar al 100%
                diferencial = Math.max(
                  porcentajeObjetivo - porcentajeVentas,
                  0
                );
              }

              return (
                <>
                  {/* Meta a alcanzar */}
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: darkMode ? "#a0aec0" : "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      Meta a alcanzar
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      <NumberFormat
                        value={metaAlcanzar.toFixed(2)}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        prefix={currencyPrefix}
                      />
                    </div>
                  </div>

                  {/* Ventas */}
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: darkMode ? "#a0aec0" : "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      Ventas alcanzadas
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      <NumberFormat
                        value={ventas.toFixed(2)}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        prefix={currencyPrefix}
                      />
                    </div>
                  </div>

                  {/* Porcentaje a alcanzar */}
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: darkMode ? "#a0aec0" : "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      Porcentaje a alcanzar
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      <NumberFormat
                        value={porcentajeObjetivo.toFixed(2)}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        suffix={"%"}
                      />
                    </div>
                  </div>

                  {/* Porcentaje en ventas */}
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: darkMode ? "#a0aec0" : "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      Porcentaje alcanzado
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      <NumberFormat
                        value={porcentajeVentas.toFixed(2)}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        suffix={"%"}
                      />
                    </div>
                  </div>

                  {/* Diferencial para alcanzar el porcentaje objetivo */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: darkMode ? "#a0aec0" : "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      Diferencial porcentual para alcanzar la meta
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color:
                          porcentajeVentas >= porcentajeObjetivo
                            ? "#38a169" // verde si está por encima o igual a la meta
                            : "#e53e3e", // rojo si está por debajo de la meta
                      }}
                    >
                      <NumberFormat
                        value={diferencial.toFixed(2)}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        suffix={"%"}
                      />
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </Col>
    );
  };

  return (
    <>
      <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
        <SideBar />
        <div id="page-content-wrapper">
          <AdminNavbar />
          <div className="flex-column flex-md-row p-3">
            <div
              className="d-flex justify-content-between"
              style={{ padding: "4px 16px 4px 24px" }}
            >
              <div className="align-self-center">
                <h3
                  style={{
                    fontWeight: "bold",
                    fontStyle: "italic",
                    marginBottom: "0",
                  }}
                >
                  Metas en tiempo real
                </h3>
              </div>
            </div>

            {/* Filtros (solo roles 1 y 2) */}
            {(user.role === 1 || user.role === 2) && (
              <div className="filter">
                <div className="d-flex justify-content-between">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggle();
                    }}
                  >
                    <i className="fa fa-search" aria-hidden="true"></i>{" "}
                    Búsqueda avanzada
                  </a>
                  {isOpen && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        clearFilters();
                      }}
                    >
                      <i className="fa fa-times" aria-hidden="true"></i> Borrar
                      filtros
                    </a>
                  )}
                </div>

                {isOpen && (
                  <>
                    <Form
                      onSubmit={handleSubmit(onFilterData)}
                      style={{ marginTop: 15 }}
                    >
                      <Row className="mb-3">
                        <Col xs={12} sm={6} lg={3} className="mb-2">
                          <FormGroup>
                            {getting && (
                              <span className="spinner-border spinner-border-sm mr-1"></span>
                            )}
                            <select
                              className="form-control"
                              name="agency"
                              ref={register}
                              onChange={() => {
                                if (agencyError) {
                                  setAgencyError("");
                                }
                              }}
                            >
                              <option key="" name="" value="">
                                Seleccione sucursal
                              </option>
                              {listAgencies &&
                                listAgencies.map((list) => (
                                  <option
                                    key={list.id}
                                    name={list.id}
                                    value={list.id}
                                  >
                                    {`${list.name}`}
                                  </option>
                                ))}
                            </select>
                            {agencyError && (
                              <span
                                style={{
                                  color: "red",
                                  fontSize: "0.875rem",
                                  display: "block",
                                  marginTop: "5px",
                                }}
                              >
                                {agencyError}
                              </span>
                            )}
                          </FormGroup>
                        </Col>
                        <Col xs={12} sm={6} md={3} className="mb-2">
                          <Button
                            color="primary"
                            type="submit"
                            disabled={loadingDetal || loadingWholesale}
                            className="w-35"
                            style={{ minWidth: "120px", marginTop: "5px" }}
                          >
                            {(loadingDetal || loadingWholesale) && (
                              <span className="spinner-border spinner-border-sm mr-1"></span>
                            )}{" "}
                            Buscar
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </>
                )}
              </div>
            )}
            {/* Fin filtros */}

            {/* Contenido de metas */}
            {hasSearched && (
              <>
                {/* Título con Agencia seleccionada */}
                {selectedAgencyName && (
                  <Row className="mb-4">
                    <Col>
                      <div
                        style={{
                          padding: "20px",
                          backgroundColor: darkMode ? "#2d3748" : "#f8f9fa",
                          borderRadius: "8px",
                          marginBottom: "20px",
                          textAlign: "center",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            color: darkMode ? "#fff" : "#000",
                            fontWeight: "bold",
                          }}
                        >
                          {selectedAgencyName}
                        </h3>
                      </div>
                    </Col>
                  </Row>
                )}

                <Row>
                  {renderMetaCard(
                    "Meta tienda - Ventas al detal",
                    weeklyDetalData,
                    loadingDetal,
                    "#3182ce"
                  )}
                  {renderMetaCard(
                    "Meta mayoreo - Venta al mayor",
                    weeklyWholesaleData,
                    loadingWholesale,
                    "#dd6b20"
                  )}
                </Row>
              </>
            )}

            <Modal
              toggle={() => {
                setModalVisible(false);
                setModalMsg("");
              }}
              isOpen={modalVisible}
              className={`modal-lg ${darkMode ? "dark-mode" : ""}`}
            >
              <div
                className={`modal-header ${
                  darkMode ? "bg-dark text-white border-secondary" : ""
                }`}
              >
                <h5 className="modal-title" id="realTimeGoalsModalLabel">
                  Metas en tiempo real
                </h5>
                <button
                  aria-label="Close"
                  className="close"
                  type="button"
                  onClick={() => {
                    setModalVisible(false);
                    setModalMsg("");
                  }}
                >
                  <span aria-hidden={true}>×</span>
                </button>
              </div>
              <div
                className={`modal-body ${
                  darkMode ? "bg-dark text-white" : ""
                }`}
              >
                <p>{modalMsg}</p>
              </div>
              <div
                className={`modal-footer ${
                  darkMode ? "bg-dark border-secondary" : ""
                }`}
              >
                <Button
                  color="secondary"
                  type="button"
                  onClick={() => {
                    setModalVisible(false);
                    setModalMsg("");
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </>
  );
}

export default RealTimeGoalsPage;

