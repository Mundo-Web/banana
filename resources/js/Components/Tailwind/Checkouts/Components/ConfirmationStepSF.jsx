import { useEffect, useState } from "react";
import Number2Currency from "../../../../Utils/Number2Currency";
import { recoveryOrderData } from "../../../../Actions/recoveryOrderData";
import ButtonPrimary from "./ButtonPrimary";
import { Local } from "sode-extend-react";
import Global from "../../../../Utils/Global";


export default function ConfirmationStepSF({ 
    setCart, 
    cart, 
    code, 
    delivery, 
    data,
    automaticDiscounts = [],
    automaticDiscountTotal = 0,
    couponDiscount = 0,
    couponCode = null
}) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await recoveryOrderData({ code });
                setOrder(response.order);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (code) {
            fetchOrderDetails();
            Local.delete(`${Global.APP_CORRELATIVE}_cart`);
            Local.set(`${Global.APP_CORRELATIVE}_cart`, []);
        }
    }, [code]);

    if (loading) {
        return (
            <div className="mx-auto">
                <div className="bg-white rounded-lg shadow p-6 font-font-general text-center">
                    <p>Cargando detalles de la orden...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto">
                <div className="bg-white rounded-lg shadow p-6 font-font-general text-center text-red-500">
                    <p>Error al cargar la orden: {error}</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto">
                <div className="bg-white rounded-lg shadow p-6 font-font-general text-center">
                    <p>No se encontraron datos de la orden</p>
                </div>
            </div>
        );
    }

    const totalPrice = order?.items?.reduce((acc, item) => {
        const itemPrice = item.price || 0;
        const quantity = item.quantity || 0;
        return acc + (itemPrice * quantity);
    }, 0) || 0;

    // Calcular subtotal sin IGV del precio total original
    const subTotalOriginal = parseFloat((totalPrice / 1.18).toFixed(2));
    const deliveryCost = parseFloat(order.delivery || 0);
    const couponDiscountAmount = parseFloat(order.coupon_discount || 0);
    const automaticDiscount = parseFloat(order.automatic_discount_total || 0);
    
    // Calcular subtotal después de descuentos
    const totalAllDiscounts = couponDiscountAmount + automaticDiscount;
    const subTotalAfterDiscounts = Math.max(0, subTotalOriginal - totalAllDiscounts);
    
    // Calcular IGV sobre el subtotal después de descuentos (18%)
    const igv = parseFloat((subTotalAfterDiscounts * 0.18).toFixed(2));
    
    // El subtotal que se muestra es el original para efectos de visualización
    const subTotal = subTotalOriginal;
    
    // Calcular total final
    const totalFinal = subTotalAfterDiscounts + igv + deliveryCost;
    console.log(order.delivery, "order.coupon_discount");
    return (
        <div className="mx-auto">
            <div className="bg-white rounded-lg shadow p-6 font-font-general">
                <div className="text-center space-y-2">
                    <h2 className="text-base xl:text-xl customtext-neutral-light">Gracias por tu compra 🎉</h2>
                    <p className="customtext-neutral-dark text-2xl xl:text-5xl font-semibold">Tu orden ha sido recibida</p>

                    <div className="py-4">
                        <div className=" customtext-neutral-light">Código de pedido</div>
                        <div className="customtext-neutral-dark text-lg font-semibold">#{order.code}</div>
                    </div>

                    <div className="space-y-4 max-w-lg bg-[#F7F9FB] mx-auto p-8 rounded-xl">
                        <div className="space-y-6 border-b-2 pb-6">
                            {order.items.map((item, index) => (
                                <div key={index} className="rounded-lg">
                                    <div className="flex gap-4">
                                        <div className="bg-white rounded-xl w-max">
                                            <img
                                                src={item.image ? `/storage/images/item/${item.image}` : '/assets/img/noimage/no_img.jpg'}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded"
                                                onError={(e) => (e.target.src = "/assets/img/noimage/no_img.jpg")}
                                            />
                                        </div>
                                        <div className="text-start">
                                            <h3 className="font-medium text-lg">
                                                {item.name}
                                                {item.is_free && (
                                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        ¡GRATIS!
                                                    </span>
                                                )}
                                            </h3>
                                           
                                            <p className="text-sm customtext-neutral-light">
                                                Cantidad: <span className="customtext-neutral-dark">{parseInt(item.quantity)}</span> -
                                                Precio: <span className="customtext-neutral-dark"> S/ {Number2Currency(item.price)}</span>
                                                {item.is_free && (
                                                    <span className="ml-1 text-green-600 font-semibold">(Promoción)</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Mostrar productos gratuitos de descuentos automáticos */}
                            {order.free_items && order.free_items.length > 0 && (
                                <>
                                    <div className="pt-4 border-t border-dashed border-green-300">
                                        <h4 className="text-sm font-bold text-green-600 mb-3">
                                            🎁 Productos gratuitos por promociones:
                                        </h4>
                                        {order.free_items.map((item, index) => (
                                            <div key={`free-${index}`} className="rounded-lg">
                                                <div className="flex gap-4">
                                                    <div className="bg-white rounded-xl w-max border-2 border-green-200">
                                                        <img
                                                            src={item.image ? `/storage/images/item/${item.image}` : '/assets/img/noimage/no_img.jpg'}
                                                            alt={item.name}
                                                            className="w-20 h-20 object-cover rounded"
                                                            onError={(e) => (e.target.src = "/assets/img/noimage/no_img.jpg")}
                                                        />
                                                    </div>
                                                    <div className="text-start">
                                                        <h3 className="font-medium text-lg">
                                                            {item.name}
                                                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                                ¡GRATIS!
                                                            </span>
                                                        </h3>
                                                       
                                                        <p className="text-sm customtext-neutral-light">
                                                            Cantidad: <span className="customtext-neutral-dark">{parseInt(item.quantity)}</span>
                                                            <span className="ml-1 text-green-600 font-semibold">- Por promoción "Compra X Lleva Y"</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-4 mt-6">
                            <div className="flex justify-between">
                                <span className="customtext-neutral-dark">Subtotal</span>
                                <span className="font-semibold">S/ {Number2Currency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="customtext-neutral-dark">IGV</span>
                                <span className="font-semibold">S/ {Number2Currency(igv)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="customtext-neutral-dark">Envío</span>
                                <span className="font-semibold">S/ {Number2Currency(order.delivery)}</span>
                            </div>
                            {order.coupon_id && (
                                <div className="mb-2 mt-2 flex justify-between items-center border-b pb-2 text-sm font-bold">
                                    <span>
                                        Cupón aplicado{" "}
                                    </span>
                                    <span>
                                        S/ -
                                        {Number2Currency(
                                            order.coupon_discount
                                        )}
                                    </span>
                                </div>
                            )}
                            {order.automatic_discounts && order.automatic_discounts.length > 0 && (
                                <div className="mb-2 mt-2 border-b pb-2">
                                    <div className="text-sm font-bold text-green-600 mb-1">
                                        Descuentos automáticos aplicados:
                                    </div>
                                    {order.automatic_discounts.map((discount, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm">
                                            <span className="text-green-700">
                                                {discount.rule_name || discount.name || 'Descuento automático'}
                                                <small className="block text-xs font-light text-gray-600">
                                                    {discount.description || 'Promoción especial'}
                                                </small>
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                S/ -{Number2Currency(discount.discount_amount || discount.amount || 0)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm font-bold text-green-600 mt-1 pt-1 border-t">
                                        <span>Total descuentos automáticos:</span>
                                        <span>S/ -{Number2Currency(order.automatic_discount_total || 0)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="py-3 border-y-2 mt-6">
                                <div className="flex justify-between font-bold text-[20px] items-center">
                                    <span>Total</span>
                                    <span>S/ {Number2Currency(totalFinal)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-3">
                            <ButtonPrimary href="/catalogo" className={` !rounded-full ${data?.class_button} `}>  Seguir Comprando</ButtonPrimary>

                        </div>

                    </div>


                </div>
            </div>
        </div>
    )
}

