/* eslint-disable */
import React from 'react';
import { Collapse } from 'reactstrap';
import { Icon } from '@iconify/react';
import angleDown from '@iconify/icons-fa-solid/angle-down';

/**
 * Componente reutilizable para secciones colapsables del menú
 * @param {Array<number>} roles - Array de roles que pueden ver esta sección. Si no se especifica, se muestra para todos.
 * @param {number} userRole - Rol del usuario actual
 */
const MenuSection = ({ 
    collapseId, 
    title, 
    icon, 
    children, 
    collapses, 
    changeCollapse, 
    darkMode,
    badge = null, // Para mostrar badges como contadores de pendientes
    roles = null, // Array de roles permitidos, ej: [1, 2, 3]
    userRole = null // Rol del usuario actual
}) => {
    // Si se especifican roles y el usuario no tiene uno permitido, no renderizar
    if (roles && userRole !== null && !roles.includes(userRole)) {
        return null;
    }

    const isOpen = collapses.includes(collapseId);
    
    return (
        <>
            <div className="margin-menu">
                <a 
                    aria-expanded={isOpen} 
                    className="menu-title" 
                    data-parent="#accordion" 
                    href="#"
                    onClick={e => { 
                        e.preventDefault(); 
                        changeCollapse(collapseId); 
                    }}
                >
                    <div className="parent-item">
                        <div className="d-flex">
                            <div className="icon-menu">
                                <Icon icon={icon} className="icon" />
                            </div>
                            <div className="text-menu">
                                <div className={`${darkMode ? "text" : "text"}`}>
                                    {title}
                                    {badge && <span> {badge}</span>}
                                </div>
                            </div>
                            <div className="angle-menu" aria-hidden="true">
                                <Icon icon={angleDown} width="14" height="14" />
                            </div>
                        </div>
                    </div>
                </a>
            </div>
            <Collapse isOpen={isOpen}>
                {children}
            </Collapse>
        </>
    );
};

export default MenuSection;

