//Tipos de salidas 
module.exports = {

    code: {
        banesco:1,
        provincial: 2,
        venezuela: 3,
        bicentenario: 4,
        mercantil: 5,
        bod: 6,
    },

    bank: {
        1:'BANESCO',
        2:'PROVINCIAL', 
        3:'VENEZUELA',
        4:'BICENTENARIO',
        5:'MERCANTIL',
        6:'BOD',
    },

    account: {
        1:'FATTORIA',
        2:'MOHAN 2025',
        3:'EMBUTIDOS MOHAN',
        4:'DELICATESES MOMOY',
        5:'DELICATESES ENMANUEL',
        6:'DANIEL PERSONAL',
        7:'YONATHAN PERSONAL',
        8:'PERSONAL',
        9:'MOHAN 2025 B', 
        10:'EMBUTIDOS MOHAN B',
        11:'Principal',
    },

    commissions: [
        {
            bank:'PROVINCIAL',
            debitCommission: 0.7,
            creditCommission: 0.72
        },
        {
            bank:'BICENTENARIO',
            debitCommission: 0.7,
            creditCommission: 0.72
        },
        {
            bank:'BANESCO',
            debitCommission: 0.7,
            creditCommission: 0.72
        },
        {
            bank:'VENEZUELA',
            debitCommission: 0.7,
            creditCommission: 0.72
        },
    ],
}