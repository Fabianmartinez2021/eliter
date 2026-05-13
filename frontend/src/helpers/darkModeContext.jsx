import React, { createContext, useContext, useState } from 'react';

// Crear el contexto
const DarkModeContext = createContext();

// Proveedor del contexto
export const DarkModeProvider = ({ children }) => {
  // Leer el valor inicial desde localStorage (si existe, lo usa; si no, es `false`)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true"; // Convierte string a booleano
  });

  // Función para alternar el modo oscuro
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", newMode); // Guardar en localStorage
      return newMode;
    });
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Hook para usar el contexto
export const useDarkMode = () => {
  return useContext(DarkModeContext);
};
