<?php

namespace App\Http\Controllers;

use App\Http\Classes\EmailConfig;
use App\Jobs\SendSaleEmail;
use App\Jobs\SendSaleWhatsApp;
use App\Models\Sale;
use App\Models\Bundle;
use App\Models\Coupon;
use App\Models\DeliveryPrice;
use App\Models\Item;
use App\Models\Renewal;
use App\Models\SaleDetail;
use App\Models\User;
use App\Models\General;
use App\Notifications\PurchaseSummaryNotification;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\JSON;
use SoDe\Extend\Trace;
use SoDe\Extend\Math;
use SoDe\Extend\Response;

class SaleController extends BasicController
{
    public $model = Sale::class;
    public $imageFields = ['payment_proof'];

    /**
     * Limpiar número de teléfono removiendo el prefijo si está presente
     */
    private static function cleanPhoneNumber($phoneNumber, $prefix = '51')
    {
        if (empty($phoneNumber)) {
            return $phoneNumber;
        }

        // Convertir a string y remover espacios
        $phone = trim((string)$phoneNumber);
        $cleanPrefix = trim((string)$prefix);

        // Si el número empieza con el prefijo, removerlo
        if (strpos($phone, $cleanPrefix) === 0) {
            $phone = substr($phone, strlen($cleanPrefix));
        }

        return $phone;
    }

    public function track(Request $request, string $code)
    {
        $response = Response::simpleTryCatch(function () use ($code) {
            $sale = Sale::select(['id', 'code', 'status_id', 'updated_at'])
                ->with(['status', 'tracking'])
                ->where('code', $code)
                ->first();
            if (!$sale) throw new Exception('El código de seguimiento no es válido');
            return $sale->toArray();
        });
        return response($response->toArray(), $response->status);
    }

    static function create(array $sale, array $details): array
    {
        try {
            $itemsJpa = Item::whereIn('id', array_map(fn($item) => $item['id'], $details))->get();

            $itemsJpa2Proccess = [];

            foreach ($details as $detail) {
                $itemJpa = clone $itemsJpa->firstWhere('id', $detail['id']);
                $itemJpa->final_price = $itemJpa->discount != 0
                    ? $itemJpa->discount
                    : $itemJpa->price;
                $itemJpa->quantity = $detail['quantity'];
                $itemJpa->colors = $detail['colors'];
                $itemJpa->user_formula_id = $detail['formula_id'];
                $itemsJpa2Proccess[] = $itemJpa;
            }

            $saleJpa = new Sale();

            // Sale info - Campos básicos
            $saleJpa->code = Trace::getId();
            $saleJpa->user_formula_id = $sale['user_formula_id'];
            $saleJpa->user_id = Auth::check() ? Auth::user()->id : null;
            $saleJpa->name = $sale['name'];
            $saleJpa->lastname = $sale['lastname'];
            $saleJpa->fullname = $sale['fullname'] ?? (($sale['name'] ?? '') . ' ' . ($sale['lastname'] ?? ''));
            $saleJpa->email = $sale['email'];
            $saleJpa->phone = $sale['phone'];
            $saleJpa->status_id = 'f13fa605-72dd-4729-beaa-ee14c9bbc47b';
            $saleJpa->billing_type = $sale['billing_type'];
            $saleJpa->billing_number = $sale['billing_number'];

            // Address info
            $saleJpa->country = $sale['country'];
            $saleJpa->department = $sale['department'];
            $saleJpa->province = $sale['province'];
            $saleJpa->district = $sale['district'];
            $saleJpa->zip_code = $sale['zip_code'];
            $saleJpa->ubigeo = $sale['ubigeo'] ?? null;
            $saleJpa->address = $sale['address'];
            $saleJpa->number = $sale['number'];
            $saleJpa->reference = $sale['reference'];
            $saleJpa->comment = $sale['comment'];

            // Document info - Compatible con PaymentController
            $saleJpa->documentType = $sale['document_type'] ?? $sale['documentType'] ?? null;
            $saleJpa->document = $sale['document'] ?? null;
            $saleJpa->invoiceType = $sale['invoiceType'] ?? null;
            $saleJpa->businessName = $sale['businessName'] ?? null;

            // Campos adicionales de PaymentController
            $saleJpa->delivery_type = $sale['delivery_type'] ?? null;
            $saleJpa->store_id = $sale['store_id'] ?? null;
            $saleJpa->payment_status = $sale['payment_status'] ?? 'pendiente';

            if (Auth::check()) {
                $userJpa = User::find(Auth::user()->id);
                // Limpiar el número de teléfono removiendo el prefijo antes de guardarlo
                $phonePrefix = $sale['phone_prefix'] ?? '51';
                $cleanPhone = self::cleanPhoneNumber($sale['phone'], $phonePrefix);
                $userJpa->phone = $cleanPhone;
                $userJpa->phone_prefix = $phonePrefix;
                $userJpa->country = $sale['country'];
                $userJpa->department = $sale['department'];
                $userJpa->province = $sale['province'];
                $userJpa->district = $sale['district'];
                $userJpa->zip_code = $sale['zip_code'];
                $userJpa->ubigeo = $sale['ubigeo'] ?? null;
                $userJpa->address = $sale['address'];
                $userJpa->address_number = $sale['number'];
                $userJpa->address_reference = $sale['reference'];
                $userJpa->dni = $sale['document'];
                $userJpa->document_type = $sale['document_type'] ?? $sale['documentType'];
                $userJpa->document_number = $sale['document'];
                $userJpa->save();
            }

            // Sale Header
            $totalPrice = array_sum(array_map(
                fn($item) => $item['final_price'] * $item['quantity'],
                $itemsJpa2Proccess
            ));

            $totalItems = array_sum(array_map(fn($item) => $item['quantity'], $itemsJpa2Proccess));

            $bundleJpa = Bundle::where('status', true)
                ->whereRaw("
                    CASE 
                        WHEN comparator = '<' THEN ? < items_quantity
                        WHEN comparator = '>' THEN ? > items_quantity 
                        ELSE ? = items_quantity
                    END
                ", [$totalItems, $totalItems, $totalItems])
                ->orderBy('percentage', 'desc')
                ->first();

            $bundle = 0;
            if ($bundleJpa) {
                $saleJpa->bundle_id = $bundleJpa->id;
                $bundle = $totalPrice * $bundleJpa->percentage;
                $saleJpa->bundle_discount = $bundle;
            }

            $renewalJpa = Renewal::find($sale['renewal_id'] ?? null);
            $renewal = 0;
            if ($renewalJpa) {
                $saleJpa->renewal_id = $renewalJpa->id;
                $renewal = ($totalPrice - $bundle) * $renewalJpa->percentage;
                $saleJpa->renewal_discount = $renewal;
            }

            // Manejar descuentos por cupones
            if (isset($sale['coupon']) && $sale['coupon']) {
                [$couponStatus, $couponJpa] = CouponController::verify(
                    $sale['coupon'],
                    $totalPrice,
                    $sale['email']
                );

                if (!$couponStatus) throw new Exception($couponJpa);

                $saleJpa->coupon_id = $couponJpa->id;
                $saleJpa->coupon_code = $couponJpa->code;
                if ($couponJpa->type == 'percentage') {
                    $saleJpa->coupon_discount = ($totalPrice - $bundle - $renewal) * ($couponJpa->value / 100);
                } else {
                    $saleJpa->coupon_discount = $couponJpa->value;
                }

                // Incrementar el contador de uso del cupón
                $couponJpa->incrementUsage();
            }

            // Manejar promociones automáticas - Compatible con PaymentController
            if (isset($sale['applied_promotions']) && $sale['applied_promotions']) {
                $saleJpa->applied_promotions = is_string($sale['applied_promotions'])
                    ? $sale['applied_promotions']
                    : json_encode($sale['applied_promotions']);
            }

            if (isset($sale['promotion_discount']) && $sale['promotion_discount'] > 0) {
                $saleJpa->promotion_discount = $sale['promotion_discount'];
            }

            // Compatibilidad con nombres alternativos
            if (isset($sale['automatic_discounts']) && $sale['automatic_discounts']) {
                $saleJpa->applied_promotions = is_string($sale['automatic_discounts'])
                    ? $sale['automatic_discounts']
                    : json_encode($sale['automatic_discounts']);
            }

            if (isset($sale['automatic_discount_total']) && $sale['automatic_discount_total'] > 0) {
                $saleJpa->promotion_discount = $sale['automatic_discount_total'];
            }

            $saleJpa->amount = Math::round($totalPrice * 10) / 10;
            $saleJpa->delivery = $sale['delivery'] ?? 0;
            $saleJpa->save();

            $detailsJpa = array();
            foreach ($itemsJpa2Proccess as $itemJpa) {
                $detailJpa = new SaleDetail();
                $detailJpa->sale_id = $saleJpa->id;
                $detailJpa->item_id = $itemJpa->id;
                $detailJpa->name = $itemJpa->name;
                $detailJpa->price = $itemJpa->final_price;
                $detailJpa->quantity = $itemJpa->quantity;
                $detailJpa->colors = $itemJpa->colors;
                $detailJpa->user_formula_id = $itemJpa->user_formula_id;
                $detailJpa->image = $itemJpa->image ?? null; // Agregar imagen
                $detailJpa->save();

                // Actualizar stock como PaymentController
                Item::where('id', $itemJpa->id)->decrement('stock', $itemJpa->quantity);

                $detailsJpa[] = $detailJpa->toArray();
            }

            $saleToReturn = Sale::with(['renewal', 'details'])->find($saleJpa->id);

            return [true, $saleToReturn];
        } catch (\Throwable $th) {
            return [false, [
                'error' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine()
            ]];
        }
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();

        // DEBUG: Logging de datos recibidos
        Log::info("🔍 === DATOS RECIBIDOS EN SaleController::beforeSave ===");
        Log::info("📝 Request all():", ['data' => $body]);
        Log::info("📦 Details raw:", ['details' => $request->details]);
        Log::info("🏷️ Details type:", ['type' => gettype($request->details)]);

        // Primero calculamos el total temporal para verificar el envío gratuito
        // Inicio de calculo de envio gratuito 
        $tempTotal = 0;
        $details = json_decode($request->details, true);
        $montocupon = 0;

        foreach ($details as $item) {
            $itemJpa = Item::find($item['id']);
            if ($itemJpa) {
                $tempTotal += $itemJpa->final_price * $item['quantity'];
            }
        }

        if ($request->coupon_id != 'null' && $request->coupon_discount > 0) {
            $montocupon = $request->coupon_discount ?? 0;
            $tempTotal -= $montocupon;
        } else {
            $body['coupon_id'] = null;
            $body['coupon_discount'] = 0;
        }

        $freeShippingThreshold = General::where('correlative', 'shipping_free')->first();
        $minFreeShipping = $freeShippingThreshold ? (float)$freeShippingThreshold->description : 0;
        $deliveryPrice = $request->delivery;

        if ($minFreeShipping > 0 && $tempTotal >= $minFreeShipping) {
            $deliveryPrice = 0;
        }
        // Fin de calculo de envio gratuito 

        $delivery = DeliveryPrice::query()
            ->where('ubigeo', $body['ubigeo'])
            ->first();

        //$body['delivery'] = $delivery?->price ?? 0;
        $body['delivery'] = $deliveryPrice ?? $delivery?->price;
        // $body['department'] = $delivery?->data['departamento'] ?? null;
        // $body['province'] = $delivery?->data['provincia'] ?? null;
        // $body['district'] = $delivery?->data['distrito'] ?? null;
        $body['ubigeo'] = $delivery?->ubigeo ?? null;
        $body['code'] = Trace::getId();
        // $body['status_id'] = 'f13fa605-72dd-4729-beaa-ee14c9bbc47b';
        // $body['status_id'] = 'e13a417d-a2f0-4f5f-93d8-462d57f13d3c';
        $body['status_id'] = 'bd60fc99-c0c0-463d-b738-1c72d7b085f5';
        $body['user_id'] = Auth::id();

        // Campos adicionales que maneja PaymentController con valores por defecto
        $body['fullname'] = $request->fullname ?? (($request->name ?? '') . ' ' . ($request->lastname ?? ''));
        $body['delivery_type'] = $request->delivery_type ?? 'domicilio'; // Valor por defecto
        $body['store_id'] = $request->store_id ?? null;
        $body['payment_status'] = $request->payment_status ?? 'pendiente';
        $body['invoiceType'] = $request->invoiceType ?? 'boleta'; // Valor por defecto
        $body['businessName'] = $request->businessName ?? null;

        // Document info (compatible con PaymentController)
        $body['documentType'] = $request->document_type ?? $request->documentType ?? null;
        $body['document'] = $request->document ?? null;

        // Manejar cupón si está presente
        if (isset($body['coupon_code']) && $body['coupon_code']) {
            $couponJpa = \App\Models\Coupon::where('code', $body['coupon_code'])->first();
            if ($couponJpa && $couponJpa->isValid($tempTotal)) {
                $body['coupon_id'] = $couponJpa->id;
                $body['coupon_code'] = $couponJpa->code;
                $body['coupon_discount'] = $couponJpa->calculateDiscount($tempTotal);

                // Incrementar el contador de uso del cupón
                $couponJpa->incrementUsage();
            }
        }

        // Manejar descuentos automáticos y promociones aplicadas
        if (isset($body['applied_promotions']) && $body['applied_promotions']) {
            $body['applied_promotions'] = is_string($body['applied_promotions'])
                ? $body['applied_promotions']
                : json_encode($body['applied_promotions']);
        }

        if (isset($body['promotion_discount'])) {
            $body['promotion_discount'] = $body['promotion_discount'] ?? 0;
        }

        // Compatibilidad con nombres alternativos para descuentos automáticos
        if (isset($body['automatic_discounts']) && $body['automatic_discounts']) {
            $body['applied_promotions'] = is_string($body['automatic_discounts'])
                ? $body['automatic_discounts']
                : json_encode($body['automatic_discounts']);
        }

        if (isset($body['automatic_discount_total'])) {
            $body['promotion_discount'] = $body['automatic_discount_total'] ?? 0;
        }

        if (Auth::check()) {
            $userJpa = User::find(Auth::user()->id);
            // Limpiar el número de teléfono removiendo el prefijo antes de guardarlo
            $phonePrefix = $request->phone_prefix ?? '51';
            $cleanPhone = self::cleanPhoneNumber($request->phone, $phonePrefix);
            $userJpa->phone = $cleanPhone;
            $userJpa->phone_prefix = $phonePrefix;
            $userJpa->document_type = $request->documentType ?? $request->document_type;
            $userJpa->document_number = $request->document;
            $userJpa->dni = $request->document; // Mantener compatibilidad
            $userJpa->country = $request->country;
            $userJpa->department = $request->department;
            $userJpa->province = $request->province;
            $userJpa->district = $request->district;
            $userJpa->ubigeo = $request->ubigeo;
            $userJpa->address = $request->address;
            $userJpa->reference = $request->reference;
            $userJpa->number = $request->number;
            $userJpa->save();
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $totalPrice = 0;
        $details = JSON::parse($request->details);

        // DEBUG: Logging detallado
        Log::info("🔍 === PROCESANDO DETAILS EN SaleController::afterSave ===");
        Log::info("📦 Details parsed:", ['details' => $details]);
        Log::info("🔢 Cantidad de items:", ['count' => count($details)]);

        foreach ($details as $index => $item) {
            $itemJpa = Item::find($item['id']);

            // Debug: Log de los datos del item
            Log::info("🛒 PROCESANDO ITEM #{$index} EN SALECONTROLLER:", [
                'item_data' => $item,
                'has_project_id' => isset($item['project_id']),
                'has_canvas_project_id' => isset($item['canvas_project_id']),
                'project_id_value' => $item['project_id'] ?? 'NO_SET',
                'canvas_project_id_value' => $item['canvas_project_id'] ?? 'NO_SET',
                'item_keys' => array_keys($item)
            ]);

            // Obtener información del proyecto si existe
            $projectId = $item['project_id'] ?? null;
            $canvasProjectId = $item['canvas_project_id'] ?? null;

            // Si es un álbum personalizado, guardar la información del proyecto en colors como JSON
            $colorsData = $itemJpa->color;
            if ($projectId || $canvasProjectId) {
                $colorsData = json_encode([
                    'color' => $itemJpa->color,
                    'project_id' => $projectId,
                    'canvas_project_id' => $canvasProjectId,
                    'type' => 'custom_album'
                ]);
                Log::info("🎨 GUARDANDO COLORS COMO JSON:", [
                    'colors_data' => $colorsData
                ]);
            } else {
                Log::info("🎨 NO HAY PROJECT_ID, USANDO COLOR NORMAL:", [
                    'color' => $itemJpa->color
                ]);
            }

            // Crear detalle de venta con todos los campos como PaymentController
            SaleDetail::create([
                'sale_id' => $jpa->id,
                'item_id' => $itemJpa->id,
                'name' => $itemJpa->name,
                'price' => $itemJpa->final_price,
                'quantity' => $item['quantity'],
                'colors' => $colorsData,
                'image' => $itemJpa->image,
            ]);

            $totalPrice += $itemJpa->final_price * $item['quantity'];

            // Actualizar stock como lo hace PaymentController
            Item::where('id', $itemJpa->id)->decrement('stock', $item['quantity']);
        }

        // El amount ya viene calculado correctamente desde el frontend con IGV aplicado sobre subtotal después de descuentos
        // No necesitamos recalcular aquí, solo usar el valor que viene del request
        if ($request->has('amount') && $request->amount > 0) {
            $jpa->amount = $request->amount;
        } else {
            // Fallback: si no viene amount del frontend, calcular de la forma tradicional
            // Aplicar descuentos de cupones
            if ($request->coupon_id != 'null' && $request->coupon_discount > 0) {
                $totalPrice -= $request->coupon_discount ?? 0;
            }

            // Aplicar descuentos automáticos/promociones
            if ($request->has('promotion_discount') && $request->promotion_discount > 0) {
                $totalPrice -= $request->promotion_discount;
            }

            // Compatibilidad con nombres alternativos
            if ($request->has('automatic_discount_total') && $request->automatic_discount_total > 0) {
                $totalPrice -= $request->automatic_discount_total;
            }

            $jpa->amount = $totalPrice;
        }
        $jpa->save();

        // Incrementar el contador de uso del cupón si se aplicó uno (como PaymentController)
        if ($request->coupon_code) {
            $coupon = Coupon::where('code', $request->coupon_code)->first();
            if ($coupon) {
                $coupon->incrementUsage();
            }
        }

        // Enviar notificación de resumen de compra
        $saleJpa = Sale::with('details')->find($jpa->id);
        $details = $saleJpa->details ?? SaleDetail::where('sale_id', $saleJpa->id)->get();
        //COMENTANDO MAIL
        // $saleJpa->notify(new PurchaseSummaryNotification($saleJpa, $details));

        return $jpa;
    }

    public function notify(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $sale = Sale::where('code', $request->code)->first();
            if (!$request->code) throw new Exception('No existe la venta');
            // SendSaleWhatsApp::dispatchAfterResponse($sale, true, false);
            // SendSaleEmail::dispatchAfterResponse($sale, true, false);
        });
        return response($response->toArray(), $response->status);
    }
}
