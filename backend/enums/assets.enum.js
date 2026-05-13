module.exports = {


    recordType: {
        creation: 'CREACIÓN',           // Creación de un nuevo activo
        modification: 'MODIFICACIÓN',   // Modificación de un activo
        transfer: 'TRASLADO',           // Traslado de un activo
        elimination: 'ELIMINACIÓN',     // Eliminación de un activo
        restauration: 'RESTAURACIÓN',   // Restauración de un activo
    },

    recordTypeArray: [
        'CREACIÓN',
        'MODIFICACIÓN',
        'TRASLADO',
        'ELIMINACIÓN',
        'RESTAURACIÓN',
    ],

    modification: {
        serial: 'SERIAL',
        name: 'NOMBRE',
        condition: 'CONDICIÓN',
        type: 'TIPO',
        category: 'CATEGORIA',
        description: 'DESCRIPCIÓN',
        status: 'ESTATUS',
        price: 'PRECIO',
        other: 'OTRO',
    },

    modificationArray: [
        'SERIAL',
        'NOMBRE',
        'CONDICIÓN',
        'TIPO',
        'CATEGORIA',
        'DESCRIPCIÓN',
        'ESTATUS',
        'PRECIO',
        'OTRO'        
    ]
}