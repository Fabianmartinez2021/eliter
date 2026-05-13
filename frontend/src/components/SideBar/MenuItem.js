/* eslint-disable */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

/**
 * Componente reutilizable para items individuales del menú
 */
const MenuItem = ({ 
    to, 
    icon, 
    text, 
    shortcut, 
    activeClassName = "item-active", 
    className = "menu-child",
    darkMode = false,
    badge = null,      // Para mostrar badges como contadores
    roles = null,      // Array de roles permitidos, ej: [1, 2]
    userRole = null    // Rol del usuario actual
}) => {
    // Si se especifican roles y el usuario no tiene uno permitido, no renderizar
    if (roles && userRole !== null && !roles.includes(userRole)) {
        return null;
    }

    return (
        <div className="margin-menu">
            <NavLink to={to} activeClassName={activeClassName} className={className}>
                <div className={`${darkMode ? "child-item" : "child-item"}`}>
                    <div className="d-flex">
                        <div className="icon-menu">
                            <Icon icon={icon} className="icon" />
                        </div>
                        <div className="text-menu">
                            <div className="text">
                                {text}
                                {shortcut && <h6>({shortcut})</h6>}
                                {badge && <span> {badge}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </NavLink>
        </div>
    );
};

export default MenuItem;