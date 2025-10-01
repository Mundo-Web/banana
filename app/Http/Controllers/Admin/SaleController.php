<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Sale;
use App\Models\SaleStatus;
use App\Models\SaleStatusTrace;
use App\Notifications\OrderStatusChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SaleController extends BasicController
{
    public $model = Sale::class;
    public $reactView = 'Admin/Sales';
    public $with4get = ['status', 'details', 'store'];

    public function setReactViewProperties(Request $request)
    {
        return [
            'statuses' => SaleStatus::all(),
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::with(['status', 'store']);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        // Si es una venta nueva O se está actualizando el estado, registrar en el historial
        if (($isNew && $jpa->status_id) || (!$isNew && $request->has('status_id') && $request->status_id)) {
            SaleStatusTrace::create([
                'sale_id' => $jpa->id,
                'status_id' => $isNew ? $jpa->status_id : $request->status_id,
                'user_id' => Auth::id(),
            ]);
        }

        $saleJpa = Sale::with(array_merge($this->with4get, ['tracking']))->find($jpa->id);
       //COMENTANDO MAIL
       if ($request->notify_client) {
            $saleJpa->notify(new OrderStatusChangedNotification($saleJpa));
        } 
        return $saleJpa;
    }
}
