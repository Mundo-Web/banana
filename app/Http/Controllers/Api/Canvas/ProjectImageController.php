<?php

namespace App\Http\Controllers\Api\Canvas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProjectImageController extends Controller
{
    /**
     * Crear directorio con permisos correctos
     */
    private function createDirectoryWithPermissions($storagePath, $permissions = 0777)
    {
        if (!Storage::exists($storagePath)) {
            $fullPath = storage_path('app/' . $storagePath);
            if (!file_exists($fullPath)) {
                mkdir($fullPath, $permissions, true);
                return true;
            }
        }
        return false;
    }

    /**
     * Guardar archivo con permisos 777
     */
    private function saveFileWithPermissions($path, $content, $permissions = 0777)
    {
        // Guardar el archivo usando Storage::put
        $saved = Storage::put($path, $content);

        if ($saved) {
            // Establecer permisos específicos después de guardar
            $fullPath = storage_path('app/' . $path);
            if (file_exists($fullPath)) {
                chmod($fullPath, $permissions);
            }
        }

        return $saved;
    }
    /**
     * Subir imágenes del proyecto al servidor
     */
    public function uploadImages(Request $request, $projectId)
    {
        try {
            $request->validate([
                'images' => 'required|array',
                'images.*.filename' => 'required|string',
                'images.*.data' => 'required|string',
                'images.*.type' => 'required|string',
                'images.*.elementId' => 'required|string'
            ]);

            $uploadedImages = [];
            $projectPath = "images/projects/{$projectId}";

            // Crear directorio del proyecto si no existe - USANDO DISCO LOCAL como BasicController
            $this->createDirectoryWithPermissions($projectPath, 0777);

            foreach ($request->images as $imageData) {
                try {
                    // Decodificar la imagen base64
                    $imageContent = base64_decode($imageData['data']);

                    if ($imageContent === false) {
                        continue;
                    }

                    // Generar nombre único personalizado para evitar conflictos
                    $filename = $imageData['filename'];
                    $pathInfo = pathinfo($filename);
                    $timestamp = time();
                    $uniqueFilename = $pathInfo['filename'] . '-fullquality-' . $timestamp . '.' . ($pathInfo['extension'] ?? 'jpg');
                    $fullPath = $projectPath . '/' . $uniqueFilename;

                    // Guardar la imagen principal con permisos 777
                    $saved = $this->saveFileWithPermissions($fullPath, $imageContent, 0777);

                    if ($saved) {
                        // Generar miniatura automáticamente
                        $thumbnailResult = $this->generateThumbnail($fullPath, $uniqueFilename, $projectPath);

                        // Generar URL pública para acceder a la imagen
                        $publicUrl = Storage::url($fullPath);

                        $uploadedImages[] = [
                            'elementId' => $imageData['elementId'],
                            'originalFilename' => $filename,
                            'savedFilename' => $uniqueFilename,
                            'path' => $fullPath,
                            'url' => $publicUrl, // URL directa del storage
                            'thumbnail_url' => $thumbnailResult['url'] ?? null,
                            'thumbnail_path' => $thumbnailResult['path'] ?? null,
                            'size' => strlen($imageContent),
                            'type' => $imageData['type']
                        ];

                        if ($thumbnailResult['success']) {
                            //  Log::info("✅ [THUMBNAIL] Miniatura generada: {$thumbnailResult['filename']}");
                        }
                    } else {
                        //   Log::error("❌ [IMAGE-UPLOAD] Error guardando imagen: {$imageData['elementId']}");
                    }
                } catch (\Exception $e) {
                    //  Log::error("❌ [IMAGE-UPLOAD] Error procesando imagen {$imageData['elementId']}: " . $e->getMessage());
                    continue;
                }
            }

            // Limpiar imágenes antiguas del proyecto (opcional)
            $this->cleanupOldImages($projectPath);

            return response()->json([
                'success' => true,
                'message' => 'Imágenes subidas exitosamente',
                'uploaded_count' => count($uploadedImages),
                'total_requested' => count($request->images),
                'images' => $uploadedImages,
                'project_path' => $projectPath
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error subiendo imágenes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar nombre único para evitar conflictos
     */
    private function generateUniqueFilename($projectPath, $originalFilename)
    {
        $pathInfo = pathinfo($originalFilename);
        $basename = $pathInfo['filename'];
        $extension = $pathInfo['extension'] ?? 'png';

        $counter = 1;
        $uniqueFilename = $originalFilename;

        while (Storage::exists($projectPath . '/' . $uniqueFilename)) {
            $uniqueFilename = $basename . '_' . $counter . '.' . $extension;
            $counter++;
        }

        return $uniqueFilename;
    }

    /**
     * Limpiar imágenes antiguas del proyecto (mantener solo las últimas 50)
     */
    private function cleanupOldImages($projectPath)
    {
        try {
            $files = Storage::files($projectPath);

            if (count($files) > 50) {
                // Ordenar por fecha de modificación
                $filesWithTime = [];
                foreach ($files as $file) {
                    $filesWithTime[] = [
                        'file' => $file,
                        'time' => Storage::lastModified($file)
                    ];
                }

                // Ordenar por tiempo (más antiguos primero)
                usort($filesWithTime, function ($a, $b) {
                    return $a['time'] - $b['time'];
                });

                // Eliminar los más antiguos (mantener solo los últimos 50)
                $filesToDelete = array_slice($filesWithTime, 0, count($filesWithTime) - 50);

                foreach ($filesToDelete as $fileData) {
                    Storage::delete($fileData['file']);
                }
            }
        } catch (\Exception $e) {
            // Log::warning("⚠️ [IMAGE-CLEANUP] Error en limpieza: " . $e->getMessage());
        }
    }

    /**
     * Obtener todas las imágenes de un proyecto
     */
    public function getProjectImages($projectId)
    {
        try {
            $projectPath = "images/projects/{$projectId}";
            $thumbnailPath = $projectPath . '/thumbnails';

            $files = Storage::files($projectPath);

            $images = [];
            foreach ($files as $file) {
                $filename = basename($file);

                // Generar nombre de la miniatura correspondiente
                $pathInfo = pathinfo($filename);
                $thumbnailFilename = str_replace('-fullquality', '-thumbnail', $pathInfo['filename']) . '.jpg';
                $thumbnailFullPath = $thumbnailPath . '/' . $thumbnailFilename;

                // Verificar si existe la miniatura
                $thumbnailUrl = null;
                if (Storage::exists($thumbnailFullPath)) {
                    $encodedThumbnailPath = base64_encode($thumbnailFullPath);
                    $thumbnailUrl = "/storage/{$thumbnailPath}/{$thumbnailFilename}.jpg";
                }

                // Generar URL para la imagen principal
                $encodedPath = base64_encode($file);
                $imageUrl = "/storage/{$projectPath}/{$pathInfo['filename']}.jpg";

                $images[] = [
                    'id' => pathinfo($filename, PATHINFO_FILENAME), // ID único basado en el nombre
                    'filename' => $filename,
                    'path' => $file,
                    'url' => $imageUrl,
                    'thumbnail_url' => $thumbnailUrl,
                    'has_thumbnail' => $thumbnailUrl !== null,
                    'size' => Storage::size($file),
                    'last_modified' => Storage::lastModified($file)
                ];
            }

            // Ordenar por fecha de modificación (más recientes primero)
            usort($images, function ($a, $b) {
                return $b['last_modified'] - $a['last_modified'];
            });

            return response()->json([
                'success' => true,
                'project_id' => $projectId,
                'images_count' => count($images),
                'images' => $images
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo imágenes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar imágenes no utilizadas de un proyecto
     */
    public function cleanupUnusedImages(Request $request, $projectId)
    {
        try {
            $request->validate([
                'used_images' => 'required|array'
            ]);

            $projectPath = "images/projects/{$projectId}";
            $allFiles = Storage::files($projectPath);
            $usedImages = $request->used_images;

            $deletedCount = 0;

            foreach ($allFiles as $file) {
                $filename = basename($file);
                $fileUrl = Storage::url($file);

                // Verificar si la imagen está en uso
                $isUsed = false;
                foreach ($usedImages as $usedImage) {
                    if (str_contains($usedImage, $filename) || str_contains($usedImage, $fileUrl)) {
                        $isUsed = true;
                        break;
                    }
                }

                if (!$isUsed) {
                    Storage::delete($file);
                    $deletedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Limpieza completada',
                'deleted_count' => $deletedCount,
                'remaining_count' => count($allFiles) - $deletedCount
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error en limpieza: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Servir imagen desde storage/app - COMO BasicController
     */
    public function serveImage($encodedPath)
    {
        try {
            $path = base64_decode($encodedPath);

            if (!Storage::exists($path)) {
                return response()->json(['error' => 'Imagen no encontrada'], 404);
            }

            $file = Storage::get($path);
            $mimeType = Storage::mimeType($path);

            // Verificar si es un thumbnail (cache más corto) o imagen normal (cache largo)
            $isThumbnail = str_contains($path, '/thumbnails/') || str_contains($path, '-thumbnail.');

            if ($isThumbnail) {
                // Cache corto para thumbnails (1 hora) para permitir actualizaciones
                // En desarrollo, desactivar cache completamente
                if (config('app.env') === 'local') {
                    return response($file)
                        ->header('Content-Type', $mimeType)
                        ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                        ->header('Pragma', 'no-cache')
                        ->header('Expires', '0');
                } else {
                    return response($file)
                        ->header('Content-Type', $mimeType)
                        ->header('Cache-Control', 'public, max-age=3600') // 1 hora
                        ->header('Expires', gmdate('D, d M Y H:i:s \G\M\T', time() + 3600));
                }
            } else {
                // Cache largo para imágenes normales (1 año)
                return response($file)
                    ->header('Content-Type', $mimeType)
                    ->header('Cache-Control', 'public, max-age=31536000') // Cache por 1 año
                    ->header('Expires', gmdate('D, d M Y H:i:s \G\M\T', time() + 31536000));
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error sirviendo imagen'], 500);
        }
    }

    /**
     * Generar miniatura de una imagen
     */
    private function generateThumbnail($imagePath, $originalFilename, $projectPath)
    {
        try {
            // Leer la imagen original desde storage
            $imageContent = Storage::get($imagePath);

            if (!$imageContent) {
                return ['success' => false, 'error' => 'No se pudo leer la imagen original'];
            }

            // 🚀 VPS OPTIMIZATION: Verificar tamaño de archivo para evitar memory exhaustion
            $imageSize = strlen($imageContent);
            $maxImageSize = 5 * 1024 * 1024; // 5MB máximo

            if ($imageSize > $maxImageSize) {
                Log::warning("⚠️ [VPS-MEMORY] Imagen muy grande para thumbnail: " . number_format($imageSize / 1024 / 1024, 2) . "MB");
                // Intentar procesar con configuración más conservadora
                ini_set('memory_limit', '256M');
            }

            // Crear instancia de Intervention Image Manager
            $manager = new ImageManager(new Driver());
            $image = $manager->read($imageContent);

            // 🚀 VPS OPTIMIZATION: Liberar memoria de contenido original inmediatamente
            unset($imageContent);

            // Generar nombre personalizado para la miniatura
            $pathInfo = pathinfo($originalFilename);
            $timestamp = time();
            $thumbnailFilename = $pathInfo['filename'] . '-thumbnail.jpg'; // Siempre JPG para miniaturas
            $thumbnailPath = $projectPath . '/thumbnails/' . $thumbnailFilename;

            // Crear directorio de miniaturas si no existe
            $thumbnailDir = $projectPath . '/thumbnails';
            $this->createDirectoryWithPermissions($thumbnailDir, 0777);

            // 🚀 VPS OPTIMIZATION: Redimensionar más agresivo para ahorrar memoria (100x100 en lugar de 150x150)
            $thumbnailSize = app()->environment('production') ? 100 : 150;
            $image->cover($thumbnailSize, $thumbnailSize);

            // 🚀 VPS OPTIMIZATION: Calidad más baja en producción para ahorrar memoria y espacio
            $quality = app()->environment('production') ? 70 : 85;
            $encodedImage = $image->toJpeg($quality);

            // 🚀 VPS OPTIMIZATION: Liberar memoria de imagen inmediatamente
            unset($image);

            // Guardar la miniatura con permisos 777
            $thumbnailSaved = $this->saveFileWithPermissions($thumbnailPath, $encodedImage, 0777);

            // 🚀 VPS OPTIMIZATION: Liberar memoria de imagen codificada
            unset($encodedImage);

            if ($thumbnailSaved) {
                // Generar URL usando el servicio de imágenes (no Storage::url)
                $encodedThumbnailPath = base64_encode($thumbnailPath);
                $thumbnailUrl = "/storage/{$thumbnailPath}";

                return [
                    'success' => true,
                    'filename' => $thumbnailFilename,
                    'path' => $thumbnailPath,
                    'url' => $thumbnailUrl
                ];
            } else {
                return ['success' => false, 'error' => 'Error guardando miniatura'];
            }
        } catch (\Exception $e) {
            // 🚀 VPS OPTIMIZATION: Log detallado de errores de memoria
            if (strpos($e->getMessage(), 'memory') !== false) {
                Log::error("❌ [VPS-MEMORY-ERROR] Error de memoria en thumbnail: " . $e->getMessage());
            }
            return ['success' => false, 'error' => $e->getMessage()];
        } finally {
            // 🚀 VPS OPTIMIZATION: Forzar garbage collection si está disponible
            if (function_exists('gc_collect_cycles')) {
                gc_collect_cycles();
            }
        }
    }

    /**
     * Subir una sola imagen desde el editor
     */
    public function uploadEditorImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp',
                'projectId' => 'required|string',
            ]);

            $projectId = $request->projectId;
            $projectPath = "images/projects/{$projectId}";

            // Crear directorio del proyecto si no existe
            $this->createDirectoryWithPermissions($projectPath, 0777);

            // Generar nombre personalizado
            $originalName = $request->file('image')->getClientOriginalName();
            $pathInfo = pathinfo($originalName);
            $timestamp = time();
            $fullQualityFilename = $pathInfo['filename'] . '-fullquality-' . $timestamp . '.' . $pathInfo['extension'];

            // Guardar la imagen con nombre personalizado y permisos 777
            $imageContent = file_get_contents($request->file('image'));
            $path = $projectPath . '/' . $fullQualityFilename;
            $saved = $this->saveFileWithPermissions($path, $imageContent, 0777);

            if (!$saved) throw new \Exception('Error guardando la imagen');
            // Generar miniatura automáticamente
            $thumbnailResult = $this->generateThumbnail($path, $fullQualityFilename, $projectPath);

            // Generar la URL usando el servicio de imágenes (no Storage::url)
            $encodedPath = base64_encode($path);
            $url = "/storage/{$projectPath}/{$fullQualityFilename}";

            // Verificar que el archivo realmente exista en el disco
            if (!Storage::exists($path)) {
                throw new \Exception('La imagen no se guardó correctamente en el servidor');
            }

            return response()->json([
                'success' => true,
                'url' => $url,
                'path' => $path,
                'thumbnail_url' => $thumbnailResult['url'] ?? null,
                'thumbnail_path' => $thumbnailResult['path'] ?? null,
                'has_thumbnail' => $thumbnailResult['success'] ?? false,
                'filename' => $fullQualityFilename
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error subiendo imagen: ' . $e->getMessage()
            ], 500);
        }
    }
}
