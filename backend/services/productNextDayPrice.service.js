const db = require('../_helpers/db');
const Product = db.Product;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

let productNextDayPriceService = {

    /**
     * Función para actualizar los precios del día siguiente de múltiples productos
     * Actualiza directamente el campo nextDayPrice en el modelo Product
     * 
     * @param {Array} products - Array de productos con id y nextDayPrice
     * @param {String} products[].id - ID del producto
     * @param {Number} products[].nextDayPrice - Precio del día siguiente
     */
    updatePrices: async (products) => {
        try {
            if (!products || !Array.isArray(products) || products.length === 0) {
                throw new Error('Se requiere un array de productos válido');
            }

            const results = [];
            const errors = [];

            for (let item of products) {
                try {
                    // Validar que el producto existe
                    if (!item.id) {
                        errors.push(`Producto sin ID: ${JSON.stringify(item)}`);
                        continue;
                    }

                    if (item.nextDayPrice === undefined || item.nextDayPrice === null) {
                        errors.push(`Producto ${item.id} sin nextDayPrice`);
                        continue;
                    }

                    // Convertir el ID a ObjectId
                    const productId = ObjectId.isValid(item.id) ? new ObjectId(item.id) : null;
                    if (!productId) {
                        errors.push(`ID de producto inválido: ${item.id}`);
                        continue;
                    }

                    // Buscar y actualizar el producto directamente
                    const product = await Product.findByIdAndUpdate(
                        productId,
                        {
                            nextDayPrice: item.nextDayPrice === null ? null : parseFloat(item.nextDayPrice),
                            updateDate: new Date()
                        },
                        { new: true }
                    );

                    if (!product) {
                        errors.push(`Producto no encontrado con ID: ${item.id}`);
                        continue;
                    }

                    results.push({
                        productId: item.id,
                        productName: product.name,
                        nextDayPrice: product.nextDayPrice
                    });

                } catch (productError) {
                    errors.push(`Error procesando producto ${item.id}: ${productError.message}`);
                }
            }

            return {
                success: true,
                message: `${results.length} precios actualizados correctamente`,
                updated: results.length,
                results: results,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error('Error actualizando precios del día siguiente:', error);
            throw new Error('Error en la actualización de precios: ' + error.message);
        }
    }
};

module.exports = productNextDayPriceService;

