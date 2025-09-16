<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\General;
use App\Helpers\NotificationHelper;
use App\Notifications\ClaimNotification;
use App\Notifications\AdminClaimNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Crypto;

class ComplaintController extends BasicController
{
    public $model = Complaint::class;
    public $reactView = 'Complaint';
    public $reactRootView = 'public';
    private function verifyCustomCaptcha($token)
    {
        // Si el token tiene el formato de nuestro captcha personalizado
        if (preg_match('/^captcha_\d+_[a-z0-9]+$/', $token)) {
            $parts = explode('_', $token);
            if (count($parts) === 3) {
                $timestamp = intval($parts[1]);
                $currentTime = time() * 1000;
                $maxAge = 10 * 60 * 1000; // 10 minutos
                
                // Verificar que no sea muy antiguo
                return ($currentTime - $timestamp) <= $maxAge;
            }
        }
        return false;
    }

    private function verifyRecaptcha($recaptchaToken)
    {
        $secretKey = env('RECAPTCHA_SECRET_KEY');
        $response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$secretKey}&response={$recaptchaToken}");
        $result = json_decode($response);

        return $result->success;
    }



    public function saveComplaint(Request $request)
    {
        //  dump($request->all());
        try {

            $request->validate([
                'nombre' => 'required|string|max:255',
                'tipo_documento' => 'required|string|in:ruc,dni,ce,pasaporte',
                'numero_identidad' => 'required|string|max:20',
                'celular' => 'nullable|string|max:20',
                'correo_electronico' => 'required|email|max:255',
                'departamento' => 'required|string|max:100',
                'provincia' => 'required|string|max:100',
                'distrito' => 'required|string|max:100',
                'direccion' => 'required|string|max:255',
                'tipo_producto' => 'required|string|in:producto,servicio',
                'monto_reclamado' => 'nullable|numeric',
                'descripcion_producto' => 'required|string',
                'tipo_reclamo' => 'required|string|in:reclamo,queja',
                'fecha_ocurrencia' => 'nullable|date',
                'numero_pedido' => 'nullable|string|max:50',
                'detalle_reclamo' => 'required|string',
                'acepta_terminos' => 'required|boolean',
                'recaptcha_token' => 'required|string',
            ]);

            if ($request->acepta_terminos != true) {
                return response()->json([
                    'type' => 'error',
                    'message' => 'Por favor aceptar los términos y condiciones'
                ], 400);
            }
            
            // Verificar captcha (personalizado o reCAPTCHA)
            $token = $request->recaptcha_token;
            $isValidCaptcha = $this->verifyCustomCaptcha($token) || $this->verifyRecaptcha($token);
            
            if (!$isValidCaptcha) {
                return response()->json([
                    'type' => 'error',
                    'message' => 'Verificación de seguridad no válida'
                ], 400);
            }

            // Guardar en la base de datos
            $complaint = Complaint::create([
                'nombre' => $request->nombre,
                'tipo_documento' => $request->tipo_documento,
                'numero_identidad' => $request->numero_identidad,
                'celular' => $request->celular,
                'correo_electronico' => $request->correo_electronico,
                'departamento' => $request->departamento,
                'provincia' => $request->provincia,
                'distrito' => $request->distrito,
                'direccion' => $request->direccion,
                'tipo_producto' => $request->tipo_producto,
                'monto_reclamado' => $request->monto_reclamado,
                'descripcion_producto' => $request->descripcion_producto,
                'tipo_reclamo' => $request->tipo_reclamo,
                'fecha_ocurrencia' => $request->fecha_ocurrencia,
                'numero_pedido' => $request->numero_pedido,
                'detalle_reclamo' => $request->detalle_reclamo,
                'acepta_terminos' => $request->acepta_terminos,
                'recaptcha_token' => $request->recaptcha_token,
            ]);

            try {
                Log::info('ComplaintController - Iniciando envío de notificaciones', [
                    'complaint_id' => $complaint->id,
                    'email' => $complaint->correo_electronico,
                    'name' => $complaint->nombre,
                    'type' => $complaint->tipo_reclamo
                ]);

                // Enviar notificación al cliente y al administrador usando NotificationHelper
                //COMENTANDO MAIL
                NotificationHelper::sendToClientAndAdmin($complaint, new ClaimNotification($complaint), new AdminClaimNotification($complaint));
                
                Log::info('ComplaintController - Notificaciones de reclamo enviadas exitosamente', [
                    'complaint_id' => $complaint->id
                ]);

            } catch (\Exception $e) {
                Log::error('ComplaintController - Error enviando notificaciones de reclamo', [
                    'error' => $e->getMessage(),
                    'complaint_id' => $complaint->id ?? 'unknown',
                    'trace' => $e->getTraceAsString(),
                    'email_settings' => [
                        'mail_host' => config('mail.mailers.smtp.host'),
                        'mail_port' => config('mail.mailers.smtp.port'),
                        'mail_encryption' => config('mail.mailers.smtp.encryption'),
                        'mail_from' => config('mail.from.address'),
                    ]
                ]);
                // No lanzamos la excepción para no interrumpir el flujo del guardado
            }
            //dump(DB::getQueryLog());
            // dump($complaint);

            return response()->json([
                'type' => 'success',
                'message' => 'Reclamo registrado con éxito',
                'data' => $complaint
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'type' => 'error',
                'message' => 'Error al registrar el reclamo' . $e->getMessage(),
            ], 500);
        }
    }
}
 /* public function saveComplaint(Request $request)
    {
        //dump($request->all());
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'dni' => 'nullable|string|max:20',
            'type' => 'required|in:queja,sugerencia,reclamo técnico',
            'incident_date' => 'nullable|date',
            'order_number' => 'nullable|string|max:50',
            'priority' => 'required|in:baja,media,alta',
            'description' => 'required|string',
            'files.*' => 'nullable|file',
        ]);

        $filePaths = [];
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $full = $file;
                $uuid = Crypto::randomUUID();
                $ext = $full->getClientOriginalExtension();
                $path = "images/complaint/{$uuid}.{$ext}";
                Storage::put($path, file_get_contents($full));
                
                // ✅ FIJO: Establecer permisos 777
                $fullPath = storage_path('app/' . $path);
                if (file_exists($fullPath)) {
                    chmod($fullPath, 0777);
                }
                $filePaths[] = "{$uuid}.{$ext}";
            }
        }
        //dump($filePaths);
        $complaint = Complaint::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'dni' => $request->dni,
            'type' => $request->type,
            'incident_date' => $request->incident_date,
            'order_number' => $request->order_number,
            'priority' => $request->priority,
            'description' => $request->description,
            'file_paths' => $filePaths,
        ]);
        //dump(DB::getQueryLog());

        //dump($complaint);

        return response()->json(['message' => 'Reclamo registrado con éxito', 'data' => $complaint], 201);
    }*/