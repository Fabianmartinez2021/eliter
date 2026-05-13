/* eslint-disable */
import React from 'react';

/**
 * Etiqueta no interactiva dentro de un collapse para agrupar ítems relacionados.
 */
const MenuSubGroupHeading = ({ label, darkMode = false }) => (
	<div
		className={`menu-subgroup-heading${darkMode ? ' menu-subgroup-heading-dark' : ''}`}
		role="presentation"
	>
		{label}
	</div>
);

export default MenuSubGroupHeading;
