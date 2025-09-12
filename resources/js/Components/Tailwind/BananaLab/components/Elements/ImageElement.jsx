import { useDrag } from "react-dnd";
import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, Trash2, Replace, Copy, CircleDot } from "lucide-react";
import { imageMasks } from "../../constants/masks";
export default function ImageElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    availableMasks = [],
    disableResize,
    workspaceSize = { width: 800, height: 600 },
}) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "IMAGE_ELEMENT",
        item: { id: element.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const elementRef = useRef(null);
    const imageRef = useRef(null);

    // --- FUNCIONES Y VARIABLES DE POSICIÓN Y TAMAÑO (deben ir antes de cualquier uso) ---
    const toPixels = useCallback((val, total) => {
        if (typeof val === 'number') {
            return val <= 1 ? val * total : val;
        }
        return 0;
    }, []);

    const toRelative = useCallback((val, total) => {
        if (typeof val === 'number' && total > 0) {
            return val > 1 ? Math.min(val / total, 1) : val;
        }
        return 0;
    }, []);

    const currentPosition = {
        x: Math.max(0, toPixels(element.position?.x || 0, workspaceSize.width)),
        y: Math.max(0, toPixels(element.position?.y || 0, workspaceSize.height)),
    };

    const currentSize = {
        width: Math.max(50, element.size?.width ? toPixels(element.size.width, workspaceSize.width) : 200),
        height: Math.max(50, element.size?.height ? toPixels(element.size.height, workspaceSize.height) : 200),
    };

    // Estados para manipulación robusta de imagen
    const [isManipulating, setIsManipulating] = useState(false);
    const [manipulationType, setManipulationType] = useState(null); // 'move', 'resize'
    const [resizeHandle, setResizeHandle] = useState(null);
    const [startState, setStartState] = useState({
        mouseX: 0,
        mouseY: 0,
        elementX: 0,
        elementY: 0,
        elementWidth: 0,
        elementHeight: 0,
    });

    // Estados para UI
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    // Effect para forzar re-render cuando cambian los filtros
    useEffect(() => {
        if (imageRef.current && element.filters) {
            // Forzar repaint aplicando los estilos directamente
            const img = imageRef.current;
            img.style.filter = `
                brightness(${(element.filters?.brightness ?? 100) / 100})
                contrast(${(element.filters?.contrast ?? 100) / 100})
                saturate(${(element.filters?.saturation ?? 100) / 100})
                sepia(${(element.filters?.tint ?? 0) / 100})
                hue-rotate(${(element.filters?.hue ?? 0)}deg)
                blur(${element.filters?.blur ?? 0}px)
            `.replace(/\s+/g, ' ').trim();

            img.style.transform = `scale(${element.filters?.scale ?? 1}) rotate(${element.filters?.rotate ?? 0
                }deg) ${element.filters?.flipHorizontal ? "scaleX(-1)" : ""} ${element.filters?.flipVertical ? "scaleY(-1)" : ""
                }`.replace(/\s+/g, ' ').trim();

            img.style.mixBlendMode = element.filters?.blendMode ?? "normal";
            img.style.opacity = (element.filters?.opacity ?? 100) / 100;



            // Forzar repaint
            img.style.willChange = 'filter, transform, opacity';
            setTimeout(() => {
                if (img) img.style.willChange = 'auto';
            }, 100);
        }
    }, [element.filters]);    // 🎯 SOLUCIÓN PERFECTA: Detectar clics fuera del elemento para ocultar controles
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Solo actuar si el elemento está seleccionado
            if (!isSelected) return;

            // Si el clic fue dentro del elemento o sus controles, no hacer nada
            if (elementRef.current && elementRef.current.contains(event.target)) {
                return;
            }

            // Si el clic fue en cualquier control de resize (por si acaso)
            if (event.target.classList.contains('bg-blue-500') ||
                event.target.getAttribute('title')?.includes('Redimensionar')) {
                return;
            }

            // Clic fuera del elemento - deseleccionar
            onSelect?.(null); // Deseleccionar el elemento
        };

        // Solo agregar el listener si el elemento está seleccionado
        if (isSelected) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup: remover el listener al desmontar o cuando cambie isSelected
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (isSelected) {
                // console.log('🧹 [ImageElement] Listener de clic fuera removido');
            }
        };
    }, [isSelected, onSelect]);

    // Aplicar filtros CSS mejorados y forzar estilos de recorte en línea
    const filterStyle = {
        filter: `
            brightness(${(element.filters?.brightness ?? 100) / 100})
            contrast(${(element.filters?.contrast ?? 100) / 100})
            saturate(${(element.filters?.saturation ?? 100) / 100})
            sepia(${(element.filters?.tint ?? 0) / 100})
            hue-rotate(${(element.filters?.hue ?? 0)}deg)
            blur(${Math.max(element.filters?.blur ?? 0, element.filters?.gaussianBlur ?? 0)}px)
        `.replace(/\s+/g, ' ').trim(),
        transform: `scale(${element.filters?.scale ?? 1}) rotate(${element.filters?.rotate ?? 0
            }deg) ${element.filters?.flipHorizontal ? "scaleX(-1)" : ""} ${element.filters?.flipVertical ? "scaleY(-1)" : ""
            }`.replace(/\s+/g, ' ').trim(),
        mixBlendMode: element.filters?.blendMode ?? "normal",
        opacity: (element.filters?.opacity ?? 100) / 100,
        zIndex: element.filters?.zIndex ?? 1,
        position: 'relative',
        willChange: 'filter, transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        // CRÍTICO: Forzar recorte y proporción en línea para máxima compatibilidad
        objectFit: 'cover',
        objectPosition: 'center',
        width: '100%',
        height: '100%'
    };

    const mask = imageMasks.find((m) => m.id === element.mask) || imageMasks[0];

    // Función para iniciar redimensionamiento
    const handleStartResize = useCallback((e, handle) => {
        if (!isSelected || disableResize) return;
        e.stopPropagation();
        e.preventDefault();
        setIsManipulating(true);
        setManipulationType('resize');
        setResizeHandle(handle);
        setStartState({
            mouseX: e.clientX,
            mouseY: e.clientY,
            elementX: currentPosition.x,
            elementY: currentPosition.y,
            elementWidth: currentSize.width,
            elementHeight: currentSize.height,
        });
    }, [isSelected, currentPosition, currentSize, disableResize]);

    // Función para iniciar movimiento
    const handleStartMove = useCallback((e) => {
        if (!isSelected || e.target.closest('.resize-handle') || disableResize) return;
        e.stopPropagation();
        e.preventDefault();
        setIsManipulating(true);
        setManipulationType('move');
        setStartState({
            mouseX: e.clientX,
            mouseY: e.clientY,
            elementX: currentPosition.x,
            elementY: currentPosition.y,
            elementWidth: currentSize.width,
            elementHeight: currentSize.height,
        });
    }, [isSelected, currentPosition, currentSize]);

    // Función para manejar manipulación (mover/redimensionar)
    const handleManipulate = useCallback((e) => {
        if (!isManipulating || !startState || disableResize) return;

        const deltaX = e.clientX - startState.mouseX;
        const deltaY = e.clientY - startState.mouseY;

        if (manipulationType === 'move') {
            // Movimiento
            const newX = Math.max(0, Math.min(workspaceSize.width - currentSize.width, startState.elementX + deltaX));
            const newY = Math.max(0, Math.min(workspaceSize.height - currentSize.height, startState.elementY + deltaY));

            const updates = {
                position: {
                    x: toRelative(newX, workspaceSize.width),
                    y: toRelative(newY, workspaceSize.height)
                },
            };

            onUpdate(updates);
        } else if (manipulationType === 'resize') {
            // Redimensionamiento
            const minSize = 20;
            const aspectRatio = startState.elementWidth / startState.elementHeight;
            let newWidth = startState.elementWidth;
            let newHeight = startState.elementHeight;
            let newX = startState.elementX;
            let newY = startState.elementY;

            switch (resizeHandle) {
                case "nw": // Esquina superior izquierda
                    newWidth = Math.max(minSize, startState.elementWidth - deltaX);
                    newHeight = Math.max(minSize, startState.elementHeight - deltaY);
                    // Mantener proporción si se presiona Shift
                    if (e.shiftKey) {
                        newHeight = newWidth / aspectRatio;
                    }
                    newX = startState.elementX + (startState.elementWidth - newWidth);
                    newY = startState.elementY + (startState.elementHeight - newHeight);
                    break;
                case "n": // Borde superior
                    newHeight = Math.max(minSize, startState.elementHeight - deltaY);
                    newY = startState.elementY + (startState.elementHeight - newHeight);
                    break;
                case "ne": // Esquina superior derecha
                    newWidth = Math.max(minSize, startState.elementWidth + deltaX);
                    newHeight = Math.max(minSize, startState.elementHeight - deltaY);
                    if (e.shiftKey) {
                        newHeight = newWidth / aspectRatio;
                    }
                    newY = startState.elementY + (startState.elementHeight - newHeight);
                    break;
                case "e": // Borde derecho
                    newWidth = Math.max(minSize, startState.elementWidth + deltaX);
                    break;
                case "se": // Esquina inferior derecha
                    newWidth = Math.max(minSize, startState.elementWidth + deltaX);
                    newHeight = Math.max(minSize, startState.elementHeight + deltaY);
                    if (e.shiftKey) {
                        newHeight = newWidth / aspectRatio;
                    }
                    break;
                case "s": // Borde inferior
                    newHeight = Math.max(minSize, startState.elementHeight + deltaY);
                    break;
                case "sw": // Esquina inferior izquierda
                    newWidth = Math.max(minSize, startState.elementWidth - deltaX);
                    newHeight = Math.max(minSize, startState.elementHeight + deltaY);
                    if (e.shiftKey) {
                        newHeight = newWidth / aspectRatio;
                    }
                    newX = startState.elementX + (startState.elementWidth - newWidth);
                    break;
                case "w": // Borde izquierdo
                    newWidth = Math.max(minSize, startState.elementWidth - deltaX);
                    newX = startState.elementX + (startState.elementWidth - newWidth);
                    break;
            }

            // Validar límites del workspace
            newX = Math.max(0, Math.min(workspaceSize.width - newWidth, newX));
            newY = Math.max(0, Math.min(workspaceSize.height - newHeight, newY));
            newWidth = Math.min(newWidth, workspaceSize.width - newX);
            newHeight = Math.min(newHeight, workspaceSize.height - newY);

            const updates = {
                position: {
                    x: toRelative(newX, workspaceSize.width),
                    y: toRelative(newY, workspaceSize.height)
                },
                size: {
                    width: toRelative(newWidth, workspaceSize.width),
                    height: toRelative(newHeight, workspaceSize.height)
                },
            };

            onUpdate(updates);
        }
    }, [isManipulating, manipulationType, startState, resizeHandle, workspaceSize, currentSize, onUpdate, toRelative]);

    // Función para terminar manipulación
    const handleEndManipulation = useCallback(() => {
        setIsManipulating(false);
        setManipulationType(null);
        setResizeHandle(null);
    }, []);

    // Funciones adicionales para manipulación avanzada
    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        if (disableResize) return;
        // Doble clic para ajustar al tamaño original o centrar
        const naturalSize = {
            width: 200,
            height: 200,
        };

        onUpdate({
            size: {
                width: toRelative(naturalSize.width, workspaceSize.width),
                height: toRelative(naturalSize.height, workspaceSize.height),
            },
        });
    }, [onUpdate, toRelative, workspaceSize]);

    // Función para manejar atajos de teclado
    const handleKeyDown = useCallback((e) => {
        if (!isSelected || disableResize) return;

        const step = e.shiftKey ? 10 : 1; // Movimiento más grande con Shift
        let updates = {};

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                updates.position = {
                    x: Math.max(0, toRelative(currentPosition.x - step, workspaceSize.width)),
                    y: toRelative(currentPosition.y, workspaceSize.height),
                };
                break;
            case 'ArrowRight':
                e.preventDefault();
                updates.position = {
                    x: Math.min(1, toRelative(currentPosition.x + step, workspaceSize.width)),
                    y: toRelative(currentPosition.y, workspaceSize.height),
                };
                break;
            case 'ArrowUp':
                e.preventDefault();
                updates.position = {
                    x: toRelative(currentPosition.x, workspaceSize.width),
                    y: Math.max(0, toRelative(currentPosition.y - step, workspaceSize.height)),
                };
                break;
            case 'ArrowDown':
                e.preventDefault();
                updates.position = {
                    x: toRelative(currentPosition.x, workspaceSize.width),
                    y: Math.min(1, toRelative(currentPosition.y + step, workspaceSize.height)),
                };
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                onDelete();
                break;
            case 'Escape':
                e.preventDefault();
                onSelect(); // Deseleccionar
                break;
        }

        if (Object.keys(updates).length > 0) {
            onUpdate(updates);
        }
    }, [isSelected, currentPosition, workspaceSize, toRelative, onUpdate, onDelete, onSelect]);

    // Efecto para atajos de teclado
    useEffect(() => {
        if (isSelected) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isSelected, handleKeyDown]);

    // Función para limitar valores dentro de rangos
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    // Efectos para manejar eventos globales
    useEffect(() => {
        if (isManipulating) {
            const handleMouseMove = (e) => handleManipulate(e);
            const handleMouseUp = () => handleEndManipulation();

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isManipulating, handleManipulate, handleEndManipulation]);

    // Efecto para cerrar menú contextual
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (showContextMenu && !e.target.closest(".context-menu")) {
                setShowContextMenu(false);
            }
        };

        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, [showContextMenu]);

    const ref = useCallback(
        (node) => {
            elementRef.current = node;
            drag(node);
        },
        [drag]
    );

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const replaceImage = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        onUpdate({ content: e.target.result });
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        input.click();
        setShowContextMenu(false);
    };

    const duplicateElement = () => {
        const newElement = {
            ...JSON.parse(JSON.stringify(element)),
            id: `img-${Date.now()}`,
            position: {
                x: Math.min(0.9, (element.position?.x || 0) + 0.05),
                y: Math.min(0.9, (element.position?.y || 0) + 0.05),
            },
        };
        onUpdate(newElement, true);
        setShowContextMenu(false);
    };

    // Cursor apropiado según el estado
    const getCursor = () => {
        if (isManipulating) {
            if (manipulationType === 'move') return "grabbing";
            if (manipulationType === 'resize') return getResizeCursor(resizeHandle);
        }
        if (isSelected) return "grab";
        return "pointer";
    };

    const getResizeCursor = (handle) => {
        const cursors = {
            n: "n-resize",
            ne: "ne-resize",
            e: "e-resize",
            se: "se-resize",
            s: "s-resize",
            sw: "sw-resize",
            w: "w-resize",
            nw: "nw-resize",
        };
        return cursors[handle] || "default";
    }; return (
        <div
            ref={ref}
            data-element-type="image"
            className={`absolute ${isSelected ? "ring-2 ring-blue-500 ring-opacity-75" : ""
                } ${isDragging ? "opacity-50" : "opacity-100"}`} style={{
                    left: disableResize ? 0 : `${currentPosition.x}px`,
                    top: disableResize ? 0 : `${currentPosition.y}px`,
                    width: disableResize ? '100%' : `${currentSize.width}px`,
                    height: disableResize ? '100%' : `${currentSize.height}px`,
                    cursor: getCursor(),
                    zIndex: element.zIndex || 5, // Z-index fijo - NO cambia al seleccionar para mantener capas
                    transition: isManipulating ? "none" : "all 0.1s ease-out",
                    pointerEvents: "all",
                    userSelect: "none",
                    transformOrigin: "center",
                }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseDown={disableResize ? undefined : handleStartMove}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
        >
            {/* Contenedor de la imagen */}
            <div
                className={`w-full h-full overflow-hidden relative bg-transparent image-element`}
                style={{
                    clipPath: element.mask === 'circle' ? 'circle(50%)' :
                        element.mask === 'rounded' ? 'inset(0 round 8%)' :
                            element.mask === 'rounded-sm' ? 'inset(0 round 8%)' :
                                element.mask === 'rounded-lg' ? 'inset(0 round 16%)' :
                                    element.mask === 'rounded-rect' ? 'inset(0 round 12%)' :
                                        element.mask === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                                            element.mask === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                                                element.mask === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                                                    element.mask === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' :
                                                        element.mask === 'polaroid' ? 'inset(5% 5% 15% 5% round 2%)' :
                                                            element.mask === 'vintage' ? 'inset(5% round 5% 5% 10% 5%)' :
                                                                element.mask === 'diagonal' ? 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' :
                                                                    element.mask === 'frame' ? 'inset(10% round 10%)' :
                                                                        element.mask === 'blob1' ? 'path("M10,0 C15,0 20,5 20,10 C20,15 15,20 10,20 C5,20 0,15 0,10 C0,5 5,0 10,0 Z")' :
                                                                            element.mask === 'blob2' ? 'path("M10,0 C15,5 20,10 15,15 C10,20 5,15 0,10 C5,5 5,5 10,0 Z")' :
                                                                                element.mask === 'blob3' ? 'path("M10,0 C15,0 20,5 15,10 C20,15 15,20 10,15 C5,20 0,15 5,10 C0,5 5,0 10,0 Z")' : 'none'
                }}
            >
                <img
                    ref={imageRef}
                    src={element.content}
                    alt="Imagen editada"
                    className="w-full h-full object-cover select-none workspace-image"
                    style={filterStyle}
                    draggable={false}
                    onLoad={() => {
                        // Asegurar que la imagen se renderice correctamente
                        if (elementRef.current) {
                            elementRef.current.style.visibility = 'visible';
                        }
                        // Aplicar filtros nuevamente después de cargar
                        if (imageRef.current && element.filters) {
                            const img = imageRef.current;
                            img.style.filter = filterStyle.filter;
                            img.style.transform = filterStyle.transform;
                            img.style.mixBlendMode = filterStyle.mixBlendMode;
                            img.style.opacity = filterStyle.opacity;
                            img.style.zIndex = filterStyle.zIndex;
                            img.style.willChange = 'filter, transform, opacity';
                            setTimeout(() => {
                                if (img) img.style.willChange = 'auto';
                            }, 100);
                        }
                    }}
                />                {/* Controles de redimensionamiento mejorados */}
                {isSelected && !isDragging && (
                    <>
                        {/* Esquinas de redimensionamiento */}
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-nw-resize"
                            style={{ top: -8, left: -8, zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "nw")}
                            title="Redimensionar desde esquina superior izquierda"
                        />
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-ne-resize"
                            style={{ top: -8, right: -8, zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "ne")}
                            title="Redimensionar desde esquina superior derecha"
                        />
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-se-resize"
                            style={{ bottom: -8, right: -8, zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "se")}
                            title="Redimensionar desde esquina inferior derecha"
                        />
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-sw-resize"
                            style={{ bottom: -8, left: -8, zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "sw")}
                            title="Redimensionar desde esquina inferior izquierda"
                        />

                        {/* Controles de los bordes */}
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-n-resize"
                            style={{ top: -8, left: "calc(50% - 8px)", zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "n")}
                            title="Redimensionar verticalmente"
                        />
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-e-resize"
                            style={{ right: -8, top: "calc(50% - 8px)", zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "e")}
                            title="Redimensionar horizontalmente"
                        />
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-s-resize"
                            style={{ bottom: -8, left: "calc(50% - 8px)", zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "s")}
                            title="Redimensionar verticalmente"
                        />
                        <div
                            className="resize-control-handle absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600 transition-colors cursor-w-resize"
                            style={{ left: -8, top: "calc(50% - 8px)", zIndex: 9999 }}
                            onMouseDown={(e) => handleStartResize(e, "w")}
                            title="Redimensionar horizontalmente"
                        />

                        {/* Indicador visual de manipulación   */}
                        {isManipulating && (
                            <div className="resize-manipulation-indicator absolute -inset-2 border-2 border-blue-300 border-dashed rounded animate-pulse" style={{ zIndex: 9999 }} />
                        )}
                    </>
                )}
            </div>

            {/* Botones de acción mejorados {isSelected && !isManipulating && (
                <div className="absolute -top-12 right-0 flex gap-1 bg-white rounded-lg shadow-lg px-2 py-1">
                    <button
                        className="bg-white rounded-md p-1.5 shadow-sm hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                filters: {
                                    ...element.filters,
                                    rotate: (element.filters?.rotate || 0) + 90,
                                },
                            });
                        }}
                        title="Rotar 90°"
                    >
                        <RotateCw className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                        className="bg-white rounded-md p-1.5 shadow-sm hover:bg-red-100 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title="Eliminar imagen"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                </div>
            )}*/}
            {/* Menú contextual mejorado */}
            {showContextMenu && (
                <>
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 9998 }}
                        onClick={() => setShowContextMenu(false)}
                    />
                    <div
                        className="fixed bg-white shadow-xl rounded-lg py-2 w-56 context-menu border border-gray-200"
                        style={{
                            left: `${Math.min(contextMenuPos.x, window.innerWidth - 240)}px`,
                            top: `${Math.min(contextMenuPos.y, window.innerHeight - 200)}px`,
                            zIndex: 9999999, // Menu contextual siempre encima
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 text-gray-500 z-10"
                            onClick={() => setShowContextMenu(false)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        <div className="px-3 py-2 border-b border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900">Opciones de imagen</h3>
                        </div>

                        <button
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 hover:text-blue-700 transition-colors"
                            onClick={replaceImage}
                        >
                            <Replace className="h-4 w-4" />
                            Reemplazar imagen
                        </button>
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center gap-3 text-sm text-gray-700 hover:text-green-700 transition-colors"
                            onClick={duplicateElement}
                        >
                            <Copy className="h-4 w-4" />
                            Duplicar elemento
                        </button>

                        <div className="border-t border-gray-100 my-1" />

                        <button
                            className="w-full text-left px-4 py-2 hover:bg-yellow-50 flex items-center gap-3 text-sm text-gray-700 hover:text-yellow-700 transition-colors"
                            onClick={() => {
                                onUpdate({
                                    filters: {
                                        ...element.filters,
                                        opacity: Math.max(0, (element.filters?.opacity || 100) - 20),
                                    },
                                });
                                setShowContextMenu(false);
                            }}
                        >
                            <CircleDot className="h-4 w-4" />
                            Reducir opacidad
                        </button>

                        <button
                            className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center gap-3 text-sm text-gray-700 hover:text-purple-700 transition-colors"
                            onClick={() => {
                                onUpdate({
                                    filters: {
                                        ...element.filters,
                                        scale: Math.max(0.1, (element.filters?.scale || 1) - 0.1),
                                    },
                                });
                                setShowContextMenu(false);
                            }}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                            Reducir escala
                        </button>

                        <div className="border-t border-gray-100 my-1" />

                        <button
                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 text-sm text-gray-700 hover:text-red-700 transition-colors"
                            onClick={() => {
                                onDelete();
                                setShowContextMenu(false);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar imagen
                        </button>
                    </div>
                </>
            )}

            {/* Información de estado para debugging (solo en desarrollo)   {process.env.NODE_ENV === 'development' && isSelected && (
                <div className="absolute -bottom-8 left-0 text-xs bg-black text-white px-2 py-1 rounded">
                    {`${Math.round(currentPosition.x)}, ${Math.round(currentPosition.y)} | ${Math.round(currentSize.width)}×${Math.round(currentSize.height)}`}
                </div>
            )}*/}

        </div>
    );
}
