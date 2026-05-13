//Tipos de salidas 
module.exports = {

    out: {
        sale:1,//venta
        decrease: 2,//merma
        reweigh: 3,//repesaje 
        packaging: 4,//empaques
        tasting: 5,//degustación
        donation: 6,//donacion
        readjustment: 7,//Usado anteriormente para el inventario fisico
        coupon:8, //vale o cupon
        correction:9,// corrección
        transfer:10,//Traslado
        mincemeat: 11,//Picadillo
        cutout: 12,//Recorte Salida,
        cutin: 13,//Recorte Entrada,
        adjustment: 14,//registro de nuevos valores fisicos o reajuste de inventario
        reset:15,//resetear inventario
        transferToFatt: 16,// Traslado a Fatt
        vale: 17,//vale

    },

    description: {
        1:'Ventas',
        2:'Merma',
        3:'Repesaje',
        4:'Empaques/Aserrin',
        5:'Desechos',
        6:'Degustación/Donación',
        7:'Reajuste',
        8:'Vale',
        9:'Corrección',
        10:'Traslado entre tiendas',
        11:'Picadillo',
        12:'Recorte Salida',
        13:'Recorte Entrada',
        14:'Inventario fisico',
        15:'Restaurar',
        16:'Traslado a Fabrica',
        17:'Vale',
    },

    outMiscellaneous: {
        used: 1,//usado
        trash: 2,//basura
        transfer: 3,//transferencia
    },

    descriptionMiscellaneous: {
        1:'Usado',
        2:'Traslado',
        3:'Desecho',
    }
}