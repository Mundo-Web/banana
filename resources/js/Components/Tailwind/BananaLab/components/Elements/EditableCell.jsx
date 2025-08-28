import { useDrop } from "react-dnd";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import ImageElement from "./ImageElement";
import TextElement from "./TextElement";

export default function EditableCell({
    id,
    elements = [],
    selectedElement,
    onSelectElement,
    onAddElement,
    onUpdateElement,
    onDeleteElement,
    availableMasks = [],
    workspaceSize = { width: 800, height: 600 }, // Tamaño del workspace completo
    cellSize = "auto", // Tamaño específico de esta celda si se necesita
    cellStyle = "", // Estilo dinámico del layout
    projectData = null, // Datos del proyecto para upload
}) {
    // 📏 CONFIGURACIÓN DE VALIDACIÓN DE IMÁGENES
    const IMAGE_VALIDATION = {
        maxSizeBytes: 10 * 1024 * 1024, // 10MB en bytes
        maxSizeMB: 10,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    };

    // 🔍 FUNCIÓN DE VALIDACIÓN DE ARCHIVOS
    const validateImageFile = (file) => {
        const errors = [];

        // Validar tipo de archivo
        if (!IMAGE_VALIDATION.allowedTypes.includes(file.type)) {
            errors.push(`❌ Tipo de archivo no permitido: ${file.type}. Solo se permiten: JPG, PNG, WebP, GIF`);
        }

        // Validar tamaño
        if (file.size > IMAGE_VALIDATION.maxSizeBytes) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            errors.push(`❌ Imagen muy pesada: ${fileSizeMB}MB (máximo ${IMAGE_VALIDATION.maxSizeMB}MB). Por favor, reduce el tamaño de la imagen antes de subirla.`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            fileSize: file.size,
            fileSizeMB: (file.size / (1024 * 1024)).toFixed(2)
        };
    };



    // 📤 FUNCIÓN PARA SUBIR IMAGEN AL SERVIDOR (CON VALIDACIÓN SIMPLE)
    const uploadImageToServer = async (file) => {
        if (!projectData?.id) {
            toast.error('Error: No se puede cargar la imagen sin un proyecto activo');
            return null;
        }

        console.log(`📤 [UPLOAD] Iniciando upload de imagen: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

        // 🔍 VALIDAR ARCHIVO ANTES DE SUBIR
        // Calculate maximum preset size in pixels
        const { height, width, dpi } = projectData.canvas_preset;
        const maxSizeMm = Math.max(height, width);
        const maxSizePx = Math.round((maxSizeMm * dpi) / 25.4);

        // Function to resize image if needed
        const resizeImageIfNeeded = async (file) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const maxImageDimension = Math.max(img.width, img.height);
                    
                    // If image is smaller than maxSizePx, return original file
                    if (maxImageDimension <= maxSizePx) {
                        URL.revokeObjectURL(img.src);
                        resolve(file);
                        return;
                    }

                    // Calculate new dimensions maintaining aspect ratio
                    const scale = maxSizePx / maxImageDimension;
                    const newWidth = Math.round(img.width * scale);
                    const newHeight = Math.round(img.height * scale);

                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    
                    // Draw and resize image
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // Convert to blob
                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(img.src);
                        resolve(new File([blob], file.name, { type: file.type }));
                    }, file.type);
                };
                img.src = URL.createObjectURL(file);
            });
        };

        const fileToUpload = await resizeImageIfNeeded(file)

        const validation = validateImageFile(fileToUpload);

        if (!validation.isValid) {
            console.error('❌ [VALIDATION] Archivo inválido:', validation.errors);

            // Mostrar todos los errores de validación
            validation.errors.forEach(error => {
                toast.error(error, {
                    duration: 5000, // Mostrar por más tiempo para que el usuario pueda leer
                });
            });

            return null;
        }

        // 🚀 SUBIR ARCHIVO VALIDADO
        const formData = new FormData();
        // formData.append('image', file);
        formData.append('image', fileToUpload);
        formData.append('projectId', projectData.id);

        // Mostrar toast de progreso
        const uploadToast = toast.loading(`📤 Subiendo imagen (${validation.fileSizeMB}MB)...`);

        try {
            const response = await fetch('/api/canvas/editor/upload-image', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                toast.success('✅ Imagen subida correctamente', { id: uploadToast });
                console.log(`✅ [UPLOAD] Upload exitoso: ${result.url}`);
                return result.url;
            } else {
                toast.error(result.message || 'Error al subir la imagen', { id: uploadToast });
                console.error('❌ [UPLOAD] Error del servidor:', result);
                return null;
            }
        } catch (error) {
            console.error('❌ [UPLOAD] Error de red:', error);
            toast.error('Error de red al subir la imagen', { id: uploadToast });
            return null;
        }
    };

    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["IMAGE_FILE", "TEXT_ELEMENT", "IMAGE_ELEMENT", "PROJECT_IMAGE"],
        drop: async (item) => {
            if (item.files) {
                const files = Array.isArray(item.files) ? item.files : [item.files[0]];

                console.log(`🎯 [DROP] Recibidos ${files.length} archivos por drag & drop`);

                // Procesar cada archivo
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];

                    // Validación rápida antes del upload
                    const quickValidation = validateImageFile(file);
                    if (!quickValidation.isValid) {
                        // Si hay errores, mostrar y continuar con el siguiente archivo
                        quickValidation.errors.forEach(error => toast.error(error, { duration: 5000 }));
                        continue;
                    }

                    const imageUrl = await uploadImageToServer(file);

                    if (imageUrl) {
                        const newElement = {
                            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            type: "image",
                            content: imageUrl,
                            position: { x: 0.05, y: 0.05 }, // Posición en porcentajes
                            size: { width: 0.3, height: 0.3 }, // Tamaño relativo
                            filters: {
                                brightness: 100,
                                contrast: 100,
                                saturation: 100,
                                tint: 0,
                                hue: 0,
                                blur: 0,
                                scale: 1,
                                rotate: 0,
                                opacity: 100,
                                blendMode: "normal",
                            },
                            mask: "none",
                            zIndex: elements.length + i + 1, // Z-index automático incremental
                        };
                        onAddElement(newElement, id);
                        console.log('[EditableCell] onAddElement via drop', { cellId: id, elementId: newElement.id });
                        onSelectElement(newElement.id, id);
                    }
                }
            } else if (item.type === "PROJECT_IMAGE") {
                // Manejar drag & drop desde la galería de imágenes del proyecto
                const newElement = {
                    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: "image",
                    content: item.imageUrl,
                    position: { x: 0.05, y: 0.05 }, // Posición en porcentajes
                    size: { width: 0.3, height: 0.3 }, // Tamaño relativo
                    filters: {
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        tint: 0,
                        hue: 0,
                        blur: 0,
                        scale: 1,
                        rotate: 0,
                        opacity: 100,
                        blendMode: "normal",
                    },
                    mask: "none",
                    zIndex: elements.length + 1, // Z-index automático
                };
                onAddElement(newElement, id);
                console.log('[EditableCell] onAddElement from gallery', { cellId: id, elementId: newElement.id });
                onSelectElement(newElement.id, id);
                toast.success('Imagen añadida desde la galería');
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: true }),
        }),
    }));

    const openFileExplorer = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = IMAGE_VALIDATION.allowedTypes.join(',');
        input.multiple = true; // Permitir múltiples archivos

        input.onchange = async (e) => {
            if (e.target.files) {
                const files = Array.from(e.target.files);

                console.log(`📁 [FILE-EXPLORER] Seleccionados ${files.length} archivos`);

                // Mostrar información sobre límites si hay archivos grandes
                const largeFiles = files.filter(file => file.size > IMAGE_VALIDATION.maxSizeBytes);
                /*  if (largeFiles.length > 0) {
                      toast.warning(`⚠️ ${largeFiles.length} imagen(es) exceden el límite de ${IMAGE_VALIDATION.maxSizeMB}MB y serán rechazadas`, {
                          duration: 6000
                      });
                  }*/

                // Procesar archivos uno por uno
                let successCount = 0;
                let rejectedCount = 0;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    console.log(`📤 [FILE-EXPLORER] Procesando archivo ${i + 1}/${files.length}: ${file.name}`);

                    const imageUrl = await uploadImageToServer(file);

                    if (imageUrl) {
                        const newElement = {
                            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            type: "image",
                            content: imageUrl,
                            position: { x: 0.05, y: 0.05 }, // Posición en porcentajes
                            size: { width: 0.3, height: 0.3 }, // Tamaño relativo
                            filters: {
                                brightness: 100,
                                contrast: 100,
                                saturation: 100,
                                tint: 0,
                                hue: 0,
                                blur: 0,
                                scale: 1,
                                rotate: 0,
                                opacity: 100,
                                blendMode: "normal",
                            },
                            mask: "none",
                            zIndex: elements.length + i + 1, // Z-index automático incremental
                        };
                        onAddElement(newElement, id);
                        console.log('[EditableCell] onAddElement', { cellId: id, elementId: newElement.id });
                        onSelectElement(newElement.id, id);
                        successCount++;
                    } else {
                        rejectedCount++;
                    }

                    // Pequeña pausa entre uploads para no sobrecargar
                    if (i < files.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }

                // Mostrar resumen final
                if (files.length > 1) {
                    if (rejectedCount === 0) {
                        toast.success(`✅ ${successCount} imágenes subidas exitosamente`);
                    } else if (successCount === 0) {
                        toast.error(`❌ Todas las imágenes fueron rechazadas (${rejectedCount})`);
                    } else {
                        toast.info(`📊 Resultado: ${successCount} exitosas, ${rejectedCount} rechazadas`);
                    }
                }
            }
        };

        input.click();
    };

    // Definir las clases de tamaño (mantenidas para compatibilidad)
    const sizeClasses = {
        square: "aspect-square", // 1:1
        landscape: "aspect-video", // 16:9
        portrait: "aspect-[3/4]", // 3:4
        wide: "aspect-[2/1]", // 2:1
        tall: "aspect-[9/16]", // 9:16
        custom: "h-[500px]", // tamaño personalizado
        auto: "w-full h-full", // Ocupa todo el espacio disponible en el grid
    };

    // Determinar si la celda tiene contenido para aplicar el border correcto
    const hasContent = elements.length > 0;

    // 📊 FUNCIÓN PARA MOSTRAR INFORMACIÓN DE ARCHIVO EN HOVER
    const showFileInfo = () => {
        const info = `
📁 Límites de archivo:
• Tamaño máximo: ${IMAGE_VALIDATION.maxSizeMB}MB
• Tipos permitidos: ${IMAGE_VALIDATION.allowedTypes.join(', ')}

⚠️ Las imágenes que excedan estos límites serán rechazadas.
        `.trim();

        console.log(info);
        return info;
    };

    return (
        <div
            ref={drop}
            data-cell-id={id} // 🔧 Identificador para captura de layouts
            className={`relative w-full h-full ${cellStyle || 'rounded-lg overflow-hidden'} ${isOver ? "ring-2 ring-purple-500 bg-transparent" : ""
                } ${!hasContent
                    ? "border-2 border-dashed border-gray-300 bg-transparent hover:border-gray-400 hover:bg-transparent hover:text-white"
                    : "bg-transparent"
                }`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onSelectElement(null, id);
                }
            }}
            style={{
                isolation: "isolate",
                background: hasContent ? "transparent" : undefined,
                minHeight: "120px", // Altura mínima para celdas muy pequeñas
            }}
        >
            {elements.length === 0 ? (
                <div
                    className="absolute group inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        openFileExplorer();
                    }}

                >
                    <Upload className="h-8 w-8 text-gray-300 group-hover:text-white transition-colors" />
                    <p className="text-sm text-gray-400 group-hover:text-white text-center transition-colors">
                        Haz clic o arrastra una imagen
                    </p>
                    <div className="text-xs text-gray-500 group-hover:text-gray-300 text-center mt-1 transition-colors">
                        <p>Máximo {IMAGE_VALIDATION.maxSizeMB}MB</p>
                        <p className="opacity-75">JPG, PNG, WebP, GIF</p>
                    </div>

                    {/* Indicador de drag over */}
                    {isOver && (
                        <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-500 border-dashed rounded-lg flex items-center justify-center">
                            <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Suelta aquí la imagen
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                elements.map((element) => (
                    <div
                        key={element.id}
                        className="absolute inset-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {element.type === "image" ? (
                            <ImageElement
                                element={element}
                                isSelected={selectedElement === element.id}
                                onSelect={() => onSelectElement(element.id, id)}
                                onUpdate={(updates) =>
                                    onUpdateElement(element.id, updates)
                                }
                                onDelete={() => onDeleteElement(element.id)}
                                availableMasks={availableMasks}
                                workspaceSize={workspaceSize}
                            />
                        ) : (
                            <TextElement
                                element={element}
                                workspaceSize={workspaceSize}
                                isSelected={selectedElement === element.id}
                                onSelect={() => onSelectElement(element.id, id)}
                                onUpdate={(updates) =>
                                    onUpdateElement(element.id, updates)
                                }
                                onDelete={() => onDeleteElement(element.id)}
                            />
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
// 🔍 FUNCIÓN DE UTILIDAD PARA DEBUGGING DE VALIDACIÓN
export const debugImageValidation = (file) => {
    const validation = {
        maxSizeBytes: 2 * 1024 * 1024,
        maxSizeMB: 2,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    };

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const isTooBig = file.size > validation.maxSizeBytes;
    const isValidType = validation.allowedTypes.includes(file.type);

    console.log('🔍 [DEBUG-VALIDATION] Información del archivo:', {
        name: file.name,
        type: file.type,
        sizeMB: fileSizeMB,
        isValidType: isValidType,
        isValidSize: !isTooBig,
        status: isValidType && !isTooBig ? '✅ VÁLIDO' : '❌ RECHAZADO',
        reason: !isValidType ? 'Tipo no permitido' : isTooBig ? `Muy pesado (${fileSizeMB}MB > ${validation.maxSizeMB}MB)` : 'OK'
    });
};

// Exponer función globalmente para debugging
if (typeof window !== 'undefined') {
    window.debugImageValidation = debugImageValidation;
}