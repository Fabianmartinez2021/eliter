module.exports = {

    types: {
        opening: 1,     //apertura
        sale: 2,        //Venta
        change: 3,      //Cambio - Egreso 
        withdrawal: 4,  // Retiro - Egreso
        spending: 5,    //Gasto  - Egreso
        correction: 6,  // Corrección
        addition: 7,    // Ingreso
        resguard: 8     // Resguardo
    },

    descriptionType: {
        1:'Apertura',
        2:'Venta',
        3:'Cambio',
        4:'Retiro',
        5:'Gasto',
        6:'Corrección',
        7:'Ingreso',
        8:'Resguardo',
    },

    descriptionCoin: {
        1:'Bs',
        2:'Dólar',
        3:'Euro',
        4:'Pesos',
    }

}