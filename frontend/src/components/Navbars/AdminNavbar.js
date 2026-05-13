/* eslint-disable */
import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
// reactstrap components
import {
  Collapse,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  NavbarBrand,
  Navbar,
  Nav
} from "reactstrap";
import { useDarkMode } from "../../helpers/darkModeContext";
import { useNotification } from "../../helpers/internalNotification";
import { Role } from "../../helpers";

import "../../assets/css/headerAdmin.css";

import { Icon } from "@iconify/react";
import indentIcon from "@iconify/icons-fa-solid/indent";
import userIcon from "@iconify/icons-fa-solid/user";
import signOutAlt from "@iconify/icons-fa-solid/sign-out-alt";
import sunIcon from "@iconify/icons-fa-solid/sun";
import moonIcon from "@iconify/icons-fa-solid/moon";
import bellIcon from "@iconify/icons-fa-solid/bell";
import trashIcon from "@iconify/icons-fa-solid/trash-alt";

const ROLE_LABELS = {
  [Role.Admin]: "Admin",
  [Role.Supervisor]: "Supervisor",
  [Role.Manager]: "Gerente",
  [Role.Cashier]: "Cajero",
  [Role.Collector]: "Recolector",
  [Role.Auditor]: "Auditor",
  [Role.Telesales]: "Telesales",
  [Role.suplyRole]: "Suministros",
  [Role.AuditorFinanciero]: "Auditor financiero",
  [Role.AuditorGeneral]: "Auditor general",
};

const headerIconColor = "#f8f1eb";

function AdminNavbar() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { todayNotifications, unreadCount, markNotificationRead, markTicketNotificationsRead, dismissNotification, dismissAllNotifications } = useNotification();
  const history = useHistory();
  const [navbarColor] = React.useState("");
  const [collapseOpen, setCollapseOpen] = React.useState(false);
  const [bellAnimating, setBellAnimating] = React.useState(false);
  const [removingIds, setRemovingIds] = React.useState(new Set());
  const [dismissingAll, setDismissingAll] = React.useState(false);
  const prevUnreadRef = React.useRef(unreadCount);
  const user = useSelector((state) => state.authentication.user);

  React.useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setBellAnimating(true);
      prevUnreadRef.current = unreadCount;
      const timer = setTimeout(() => setBellAnimating(false), 1200);
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const handleNotificationClick = (notification) => {
    const ticketId = notification?.ticketId
      ? (typeof notification.ticketId === 'object' ? notification.ticketId?._id || notification.ticketId : notification.ticketId)
      : null;
    if (ticketId) {
      markNotificationRead(notification.id);
      markTicketNotificationsRead(String(ticketId));
      history.push(`/support-detail/${String(ticketId)}`);
    }
  };

  const handleDeleteNotification = (e, notification) => {
    e.stopPropagation();
    const id = String(notification?.id || notification?.backendId || '');
    if (!id) return;
    setRemovingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      dismissNotification(notification);
      setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 320);
  };

  const handleDismissAll = (e) => {
    e.stopPropagation();
    if (todayNotifications.length === 0) return;
    setDismissingAll(true);
    setTimeout(() => {
      dismissAllNotifications();
      setDismissingAll(false);
    }, 480);
  };

  return (
    <>
      {collapseOpen ? (
        <div
          id="bodyClick"
          onClick={() => {
            document.documentElement.classList.toggle("nav-open");
            setCollapseOpen(false);
          }}
        />
      ) : null}
      <Navbar
        className={`flex-column flex-md-row bd-navbar headerAdmin${
          darkMode ? " headerAdmin--deep" : ""
        } ${navbarColor}`}
        expand="lg"
        dark
      >
        <div className="navbar-translate headerAdmin-inner">
          <NavbarBrand
            href="#"
            id="navbar-sidebar-toggle"
            className="headerAdmin-toggle"
            aria-label="Abrir menú lateral"
            onClick={(event) => {
              event.preventDefault();
              const wrapper = document.getElementById("wrapper");
              if (wrapper) {
                wrapper.classList.toggle("toggled");
                document.body.classList.toggle("sidebar-open-mobile", window.innerWidth < 768 && wrapper.classList.contains("toggled"));
              }
              setCollapseOpen(false);
            }}
          >
            <Icon icon={indentIcon} width="20" height="20" style={{ color: headerIconColor }} />
          </NavbarBrand>

          <div
            className="headerAdmin-titleBlock"
            id="navbar-agency-name"
            onClick={(event) => event.preventDefault()}
            role="status"
          >
            <span className="headerAdmin-app">Orquesta Cafè</span>
            <span className="headerAdmin-sucursal">
              {user?.agency?.name || "—"}
              {user?.role != null && ROLE_LABELS[user.role]
                ? ` · ${ROLE_LABELS[user.role]}`
                : ""}
            </span>
          </div>

          {/* Campana siempre visible en móvil - fuera del menú colapsado */}
          <div className="d-lg-none d-flex align-items-center navbar-mobile-actions ml-auto mr-2">
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle
                aria-haspopup={true}
                caret={false}
                color="default"
                data-toggle="dropdown"
                href="#"
                nav
                onClick={(e) => e.preventDefault()}
                style={{ padding: "4px 8px" }}
              >
                <span className={`notification-bell-wrapper ${bellAnimating ? 'notification-bell-ringing' : ''}`} style={{ position: "relative", display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
                  <Icon icon={bellIcon} width="25" height="25" className="notification-bell-icon" style={{ color: headerIconColor }} />
                  {unreadCount > 0 && (
                    <span className="notification-bell-badge">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </DropdownToggle>
              <DropdownMenu right className={`dropdown-notifications ${dismissingAll ? 'dismissing-all' : ''}`} style={{ padding: 0, overflow: 'visible', border: 'none', boxShadow: 'none' }}>
                <div className="dropdown-notifications-inner" style={{ background: darkMode ? '#2d2d2d' : '#ffffff', borderRadius: 12, minWidth: 320, minHeight: 120, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }}>
                <DropdownItem tag="div" header className="d-flex align-items-center justify-content-between notification-header">
                  <span className="font-weight-bold">Notificaciones</span>
                  {todayNotifications.length > 0 && !dismissingAll && (
                    <button
                      type="button"
                      className="btn btn-sm notification-dismiss-all-btn"
                      onClick={(e) => { e.stopPropagation(); handleDismissAll(e); }}
                      title="Borrar todas las notificaciones"
                      disabled={dismissingAll}
                    >
                      <Icon icon={trashIcon} width="12" height="12" style={{ marginRight: 4 }} />
                      <span className="d-none d-lg-inline">Borrar todas</span>
                    </button>
                  )}
                </DropdownItem>
                {todayNotifications.length === 0 ? (
                  <DropdownItem disabled className="text-muted text-center small">
                    No hay notificaciones
                  </DropdownItem>
                ) : (
                  todayNotifications.slice(0, 50).map((n) => {
                    const nid = String(n.id || n.backendId || '');
                    const isRemoving = removingIds.has(nid) || dismissingAll;
                    return (
                      <div key={n.id} className={`notification-item-wrapper ${isRemoving ? 'notification-item-removing' : ''}`}>
                        <DropdownItem
                          tag="div"
                          onClick={() => !isRemoving && handleNotificationClick(n)}
                          style={{ cursor: isRemoving ? "default" : "pointer", whiteSpace: "normal" }}
                          className={`notification-dropdown-item ${n.read ? 'notification-read' : 'notification-unread'}`}
                        >
                          <div className="d-flex flex-column flex-grow-1">
                            <strong style={{ fontSize: "0.9rem" }}>{n.title}</strong>
                            <span className="notification-detail-text">{n.message}</span>
                            {n.ticketNumber && <span className="notification-detail-text notification-ticket-num">#{n.ticketNumber}</span>}
                          </div>
                          <button
                            type="button"
                            className="notification-delete-btn"
                            onClick={(e) => handleDeleteNotification(e, n)}
                            title="Eliminar notificación"
                            aria-label="Eliminar"
                            disabled={isRemoving}
                          >
                            <Icon icon={trashIcon} width="12" height="12" />
                          </button>
                        </DropdownItem>
                      </div>
                    );
                  })
                )}
                </div>
              </DropdownMenu>
            </UncontrolledDropdown>
            <UncontrolledDropdown nav inNavbar className="ml-1">
              <DropdownToggle
                aria-haspopup={true}
                caret
                color="default"
                data-toggle="dropdown"
                href="#"
                nav
                onClick={(e) => e.preventDefault()}
                style={{ padding: "4px 8px" }}
              >
                <Icon icon={userIcon} width="20" height="20" style={{ color: headerIconColor }} />
              </DropdownToggle>
              <DropdownMenu right aria-labelledby="navbarDropdownMenuLink" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
                <div className="dropdown-profile-inner" style={{ background: darkMode ? '#2d2d2d' : '#ffffff', borderRadius: 8, minWidth: 160, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                  <DropdownItem href="/profile">
                    <Icon icon={userIcon} width="12" height="12" style={{ marginRight: 5 }} />
                    Mi perfil
                  </DropdownItem>
                  <DropdownItem href="/login">
                    <Icon icon={signOutAlt} width="12" height="12" style={{ marginRight: 5 }} />
                    Salir
                  </DropdownItem>
                </div>
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>

          <button
            className="navbar-toggler headerAdmin-toggler"
            onClick={() => {
              document.documentElement.classList.toggle("nav-open");
              setCollapseOpen(!collapseOpen);
            }}
            aria-expanded={collapseOpen}
            type="button"
          >
            <span className="navbar-toggler-bar top-bar"></span>
            <span className="navbar-toggler-bar middle-bar"></span>
            <span className="navbar-toggler-bar bottom-bar"></span>
          </button>
        </div>

        <Collapse className="justify-content-end" isOpen={collapseOpen} navbar>
          <Nav navbar className="d-flex align-items-center">
            <UncontrolledDropdown nav inNavbar className="mr-2 d-none d-lg-block">
              <DropdownToggle
                aria-haspopup={true}
                caret={false}
                color="default"
                data-toggle="dropdown"
                href="#"
                nav
                onClick={(e) => e.preventDefault()}
                style={{ padding: "4px" }}
              >
                <span className={`notification-bell-wrapper ${bellAnimating ? 'notification-bell-ringing' : ''}`} style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Icon icon={bellIcon} width="23" height="23" className="notification-bell-icon" style={{ color: headerIconColor }} />
                  {unreadCount > 0 && (
                    <span className="notification-bell-badge">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </DropdownToggle>
              <DropdownMenu right className={`dropdown-notifications ${dismissingAll ? 'dismissing-all' : ''}`} style={{ padding: 0, overflow: 'visible', border: 'none', boxShadow: 'none' }}>
                <div className="dropdown-notifications-inner" style={{ background: darkMode ? '#2d2d2d' : '#ffffff', borderRadius: 12, minWidth: 320, minHeight: 120, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }}>
                <DropdownItem tag="div" header className="d-flex align-items-center justify-content-between notification-header">
                  <span className="font-weight-bold">Notificaciones</span>
                  {todayNotifications.length > 0 && !dismissingAll && (
                    <button
                      type="button"
                      className="btn btn-sm notification-dismiss-all-btn"
                      onClick={(e) => { e.stopPropagation(); handleDismissAll(e); }}
                      title="Borrar todas las notificaciones"
                      disabled={dismissingAll}
                    >
                      <Icon icon={trashIcon} width="12" height="12" style={{ marginRight: 4 }} />
                      <span className="d-none d-lg-inline">Borrar todas</span>
                    </button>
                  )}
                </DropdownItem>
                {todayNotifications.length === 0 ? (
                  <DropdownItem disabled className="text-muted text-center small">
                    No hay notificaciones
                  </DropdownItem>
                ) : (
                  todayNotifications.slice(0, 50).map((n) => {
                    const nid = String(n.id || n.backendId || '');
                    const isRemoving = removingIds.has(nid) || dismissingAll;
                    return (
                      <div key={n.id} className={`notification-item-wrapper ${isRemoving ? 'notification-item-removing' : ''}`}>
                        <DropdownItem
                          tag="div"
                          onClick={() => !isRemoving && handleNotificationClick(n)}
                          style={{ cursor: isRemoving ? "default" : "pointer", whiteSpace: "normal" }}
                          className={`notification-dropdown-item ${n.read ? 'notification-read' : 'notification-unread'}`}
                        >
                          <div className="d-flex flex-column flex-grow-1">
                            <strong style={{ fontSize: "0.9rem" }}>{n.title}</strong>
                            <span className="notification-detail-text">{n.message}</span>
                            {n.ticketNumber && <span className="notification-detail-text notification-ticket-num">#{n.ticketNumber}</span>}
                          </div>
                          <button
                            type="button"
                            className="notification-delete-btn"
                            onClick={(e) => handleDeleteNotification(e, n)}
                            title="Eliminar notificación"
                            aria-label="Eliminar"
                            disabled={isRemoving}
                          >
                            <Icon icon={trashIcon} width="10" height="10" />
                          </button>
                        </DropdownItem>
                      </div>
                    );
                  })
                )}
                </div>
              </DropdownMenu>
            </UncontrolledDropdown>
            <div className="d-none d-lg-block headerAdmin-themeToggle" onClick={toggleDarkMode} style={{ cursor: "pointer" }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDarkMode(); } }} aria-label={darkMode ? "Modo claro" : "Modo oscuro"}>
              {darkMode ? (
                <Icon icon={sunIcon} width="20" height="20" style={{ color: headerIconColor }} />
              ) : (
                <Icon icon={moonIcon} width="20" height="20" style={{ color: headerIconColor }} />
              )}
            </div>
            <UncontrolledDropdown nav className="d-none d-lg-block">
              <DropdownToggle
                aria-haspopup={true}
                caret
                color="default"
                data-toggle="dropdown"
                href="#"
                id="navbarDropdownMenuLink"
                nav
                onClick={(e) => e.preventDefault()}
                className="headerAdmin-userToggle"
              >
                <Icon icon={userIcon} width="20" height="20" style={{ color: headerIconColor }} />
              </DropdownToggle>
              <DropdownMenu aria-labelledby="navbarDropdownMenuLink" className="dropdown-menu-right" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
                <div className="dropdown-profile-inner" style={{ background: darkMode ? '#2d2d2d' : '#ffffff', borderRadius: 8, minWidth: 160, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                  <DropdownItem href="/profile">
                    <Icon icon={userIcon} width="12" height="12" style={{ marginRight: 5 }} />
                    Mi perfil
                  </DropdownItem>
                  <DropdownItem href="/login">
                    <Icon icon={signOutAlt} width="12" height="12" style={{ marginRight: 5 }} />
                    Salir
                  </DropdownItem>
                </div>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Collapse>
      </Navbar>
    </>
  );
}

export default AdminNavbar;
