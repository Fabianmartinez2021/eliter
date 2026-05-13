//Tipos de salidas 
module.exports = {

    in: {
        dispatch: 1,// Por despacho
        externProvider: 2,// Proveedor externo
        storeRelocation: 3,// Traslado de tienda
    },

    inDescription: {
        1: 'Por Despacho',
        2: 'Proveedor Externo',
        3: 'Traslado de Tienda',
    },

    out: {
        used: 1,// Suministros usados
        transfer: 2,//Traslado
        trash: 3,// Desechos
    },

    outDescription: {
        1: 'Suministros usados',
        2: 'Traslado entre tiendas',
        3: 'Desechos',
    }
}