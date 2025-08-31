import { useState, useRef, useEffect, useCallback } from "react";
import { useDrag } from "react-dnd";
import { Trash2, Type, Copy, CircleDot, Move } from "lucide-react";
import ContextMenu from "../UI/ContextMenu";
import FontFaceObserver from "fontfaceobserver";

// Función compartida para convertir estilos a formato canvas
export const getCanvasTextStyle = (style, scale = 1) => {
    return {
        fontFamily: style?.fontFamily || "Arial",
        fontSize: `${(parseInt(style?.fontSize) || 16) * scale}px`,
        fontWeight: style?.fontWeight || "normal",
        fontStyle: style?.fontStyle || "normal",
        textDecoration: style?.textDecoration || "none",
        textAlign: style?.textAlign || "left",
        color: style?.color || "#000000",
        backgroundColor: style?.backgroundColor || "transparent",
        padding: parseInt(style?.padding) || 0,
        lineHeight: style?.lineHeight || "1.4",
    };
};

// Función para precargar una fuente específica
export const loadFont = async (fontFamily) => {
    if (fontFamily === "Arial" || fontFamily === "sans-serif" || fontFamily === "serif") {
        return Promise.resolve(); // Fuentes del sistema no necesitan precarga
    }

    try {
        const font = new FontFaceObserver(fontFamily);
        await font.load(null, 10000); // timeout de 10 segundos
        return Promise.resolve();
    } catch (error) {
        console.warn(`No se pudo cargar la fuente: ${fontFamily}`, error);
        return Promise.resolve(); // Continuar con fuente por defecto
    }
};

export default function TextElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    workspaceSize = { width: 800, height: 600 }, // Tamaño del workspace para cálculos responsivos
}) {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);
    const elementRef = useRef(null);
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "TEXT_ELEMENT",
        item: { id: element.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [isDraggingInside, setIsDraggingInside] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const [dragPreview, setDragPreview] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [dragStartTime, setDragStartTime] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    const [lastMoveTime, setLastMoveTime] = useState(0);

    const handleDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleChange = (e) => {
        onUpdate({ content: e.target.value });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            setIsEditing(false);
        }
    };

    const handleMouseDown = (e) => {
        // Permitir drag desde cualquier parte del elemento, no solo cuando está seleccionado
        if (!isEditing) {
            e.stopPropagation();
            onSelect(); // Seleccionar el elemento primero
            
            setDragStartTime(Date.now());
            setHasMoved(false);
            setIsDraggingInside(true);
            
            // Calcular posición en porcentajes para responsividad
            const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
            const currentX = element.position.x <= 1 ? element.position.x * parentRect.width : element.position.x;
            const currentY = element.position.y <= 1 ? element.position.y * parentRect.height : element.position.y;
            
            setStartPos({
                x: e.clientX - currentX,
                y: e.clientY - currentY,
            });
            
            // Configurar preview inicial
            setDragPreview({
                x: currentX,
                y: currentY
            });
            
            // Agregar clase de cursor global
            document.body.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e) => {
        if (isDraggingInside && elementRef.current) {
            // Throttle de mouse move para mejor rendimiento
            const now = Date.now();
            if (now - lastMoveTime < 16) return; // ~60fps
            setLastMoveTime(now);
            
            // Usar requestAnimationFrame para smoother drag
            requestAnimationFrame(() => {
                if (!elementRef.current) return;
                
                const parentRect = elementRef.current.parentElement.getBoundingClientRect();
                const newX = e.clientX - startPos.x;
                const newY = e.clientY - startPos.y;

                // Marcar que se ha movido si el movimiento es significativo
                const moveThreshold = 5; // píxeles
                if (!hasMoved && (Math.abs(newX - dragPreview.x) > moveThreshold || Math.abs(newY - dragPreview.y) > moveThreshold)) {
                    setHasMoved(true);
                }

                const maxX = parentRect.width - elementRef.current.offsetWidth;
                const maxY = parentRect.height - elementRef.current.offsetHeight;

                // Implementar snap-to-grid suave (grid de 5px para más precisión)
                const gridSize = 5;
                const snappedX = Math.round(newX / gridSize) * gridSize;
                const snappedY = Math.round(newY / gridSize) * gridSize;

                const boundedX = Math.max(0, Math.min(snappedX, maxX));
                const boundedY = Math.max(0, Math.min(snappedY, maxY));

                // Actualizar preview
                setDragPreview({
                    x: boundedX,
                    y: boundedY
                });

                // Convertir a porcentajes para mantener la responsividad
                const percentX = boundedX / parentRect.width;
                const percentY = boundedY / parentRect.height;

                onUpdate({ 
                    position: { 
                        x: percentX, 
                        y: percentY 
                    } 
                });
            });
        }
    };

    const handleMouseUp = (e) => {
        const dragDuration = Date.now() - dragStartTime;
        const wasQuickClick = dragDuration < 200 && !hasMoved; // Clic rápido sin movimiento
        
        setIsDraggingInside(false);
        // Restaurar cursor
        document.body.style.cursor = '';
        
        // Si fue un clic rápido sin movimiento y el elemento ya estaba seleccionado, activar edición
        if (wasQuickClick && isSelected) {
            setTimeout(() => {
                setIsEditing(true);
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.select();
                    }
                }, 0);
            }, 50);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const duplicateElement = () => {
        const newElement = {
            ...JSON.parse(JSON.stringify(element)),
            id: `text-${Date.now()}`,
            position: {
                x: element.position.x <= 1 ? Math.min(element.position.x + 0.02, 0.9) : element.position.x + 10,
                y: element.position.y <= 1 ? Math.min(element.position.y + 0.02, 0.9) : element.position.y + 10,
            },
        };
        onUpdate(newElement, true); // true indica que es un duplicado
        setShowContextMenu(false);
    };

    useEffect(() => {
        if (isDraggingInside) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingInside, startPos]);

    const ref = useCallback(
        (node) => {
            elementRef.current = node;
            drag(node);
        },
        [drag]
    );

    const textShadow = element.style?.textShadow
        ? `${element.style.textShadowX || 0}px ${
              element.style.textShadowY || 0
          }px ${element.style.textShadowBlur || 0}px ${
              element.style.textShadowColor || "rgba(0,0,0,0.5)"
          }`
        : "none";

    // Calcular posición y tamaño responsivos
    const calculateResponsiveStyle = () => {
        const baseStyle = {
            ...element.style,
            position: "absolute",
            cursor: isDraggingInside ? "grabbing" : (isHovering && !isEditing ? "grab" : "pointer"),
            textShadow,
            zIndex: element.zIndex || 10, // Z-index fijo - NO cambia al seleccionar para mantener capas
            fontFamily: element.style?.fontFamily || "Arial",
            color: element.style?.color || "#000000",
            fontWeight: element.style?.fontWeight || "normal",
            fontStyle: element.style?.fontStyle || "normal",
            textDecoration: element.style?.textDecoration || "none",
            textAlign: element.style?.textAlign || "left",
            backgroundColor: element.style?.backgroundColor || "transparent",
            padding: element.style?.padding || "8px",
            borderRadius: element.style?.borderRadius || "0px",
            border: element.style?.border || "none",
            opacity: element.style?.opacity !== undefined ? element.style.opacity : 1,
            // REMOVER transiciones durante drag para evitar efecto "pegajoso"
            transition: isDraggingInside ? 'none' : 'all 0.15s ease-out',
            // Forzar repaint para evitar replicación visual
            willChange: isDraggingInside ? 'transform' : 'auto',
            // Ligero scale durante drag para feedback visual
            transform: isDraggingInside ? 'scale(1.02)' : 'scale(1)',
        };

        // Calcular posición (porcentaje o píxeles)
        if (element.position.x <= 1 && element.position.y <= 1) {
            // Posición en porcentajes
            baseStyle.left = `${element.position.x * 100}%`;
            baseStyle.top = `${element.position.y * 100}%`;
        } else {
            // Posición en píxeles (fallback para elementos existentes)
            baseStyle.left = `${element.position.x}px`;
            baseStyle.top = `${element.position.y}px`;
        }

        // Calcular tamaño de fuente responsivo
        if (element.style?.fontSize) {
            const fontSize = parseFloat(element.style.fontSize);
            if (fontSize && workspaceSize.width) {
                // Hacer el tamaño de fuente responsivo basado en el workspace
                const responsiveFontSize = (fontSize / 800) * workspaceSize.width;
                baseStyle.fontSize = `${Math.max(12, responsiveFontSize)}px`;
            } else {
                baseStyle.fontSize = element.style.fontSize;
            }
        } else {
            // Tamaño de fuente por defecto responsivo
            const defaultFontSize = (16 / 800) * workspaceSize.width;
            baseStyle.fontSize = `${Math.max(12, defaultFontSize)}px`;
        }

        return baseStyle;
    };

    const combinedStyle = calculateResponsiveStyle();
    useEffect(() => {
        const fontFamily = element.style?.fontFamily?.replace(/'/g, "");
        if (fontFamily && !document.fonts.check(`12px ${fontFamily}`)) {
            const font = new FontFace(fontFamily, `local(${fontFamily})`);
            font.load().then(() => document.fonts.add(font));
        }
    }, [element.style?.fontFamily]);
    return (
        <div
            ref={ref}
            data-element-type="text"
            data-element-id={element.id}
            className={`
                ${isSelected ? "ring-2 ring-purple-500 shadow-lg" : ""} 
                ${isDragging ? "opacity-50" : "opacity-100"}
                ${isDraggingInside ? "ring-2 ring-blue-400 shadow-xl select-none" : ""}
                ${isHovering && !isEditing ? "ring-1 ring-gray-300" : ""}
                transition-all duration-150 ease-in-out
            `}
            style={{
                ...combinedStyle,
                // Evitar replicación durante drag
                userSelect: isDraggingInside ? 'none' : 'auto',
                pointerEvents: isDraggingInside ? 'none' : 'auto',
            }}
            onClick={(e) => {
                e.stopPropagation();
                // Solo seleccionar si no está ya seleccionado
                if (!isSelected) {
                    onSelect();
                }
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={element.content}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full p-1 border border-gray-300 rounded bg-white"
                    style={{
                        fontFamily: element.style?.fontFamily,
                        fontSize: element.style?.fontSize,
                        fontWeight: element.style?.fontWeight,
                        fontStyle: element.style?.fontStyle,
                        textDecoration: element.style?.textDecoration,
                        color: element.style?.color,
                        textAlign: element.style?.textAlign,
                        minWidth: "100px",
                    }}
                    autoFocus
                />
            ) : (
                <div
                    className="p-2 rounded"
                    style={{
                        backgroundColor:
                            element.style?.backgroundColor || "transparent",
                        padding: element.style?.padding || "8px",
                        borderRadius: element.style?.borderRadius || "0px",
                        border: element.style?.border || "none",
                        fontFamily: element.style?.fontFamily || "Arial",
                    }}
                >
                    {element.content || "Editar texto"}
                </div>
            )}

            {isSelected && (
                <>
                    {/* Indicador de drag en la esquina superior izquierda */}
                    <div 
                    data-editor
                        className="absolute top-0 left-0 transform translate-x-[-100%] translate-y-[-100%] bg-white rounded-md p-1 shadow-sm border"
                        style={{ zIndex: 9999 }} // Controles siempre encima
                    >
                        <Move className="h-3 w-3 text-gray-500"/>
                    </div>
                    
                    {/* Toolbar en la esquina superior derecha */}
                  {/*  <div 
                        className="absolute top-0 right-0 transform translate-y-[-100%] flex gap-1 bg-white rounded-t-md p-1 shadow-sm"
                        style={{ zIndex: 9999 }} // Controles siempre encima
                    >
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                style: {
                                    ...element.style,
                                    fontWeight:
                                        element.style?.fontWeight === "bold"
                                            ? "normal"
                                            : "bold",
                                },
                            });
                        }}
                    >
                        <span
                            className={`text-xs ${
                                element.style?.fontWeight === "bold"
                                    ? "font-bold"
                                    : ""
                            }`}
                        >
                            B
                        </span>
                    </button>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                style: {
                                    ...element.style,
                                    fontStyle:
                                        element.style?.fontStyle === "italic"
                                            ? "normal"
                                            : "italic",
                                },
                            });
                        }}
                    >
                        <span
                            className={`text-xs ${
                                element.style?.fontStyle === "italic"
                                    ? "italic"
                                    : ""
                            }`}
                        >
                            I
                        </span>
                    </button>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                style: {
                                    ...element.style,
                                    textDecoration:
                                        element.style?.textDecoration ===
                                        "underline"
                                            ? "none"
                                            : "underline",
                                },
                            });
                        }}
                    >
                        <span
                            className={`text-xs ${
                                element.style?.textDecoration === "underline"
                                    ? "underline"
                                    : ""
                            }`}
                        >
                            U
                        </span>
                    </button>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="h-3 w-3 text-gray-700" />
                    </button>
                    </div> */}
                </>
            )}

            {showContextMenu && (
                <div
                    className="fixed bg-white shadow-lg rounded-md py-1 w-48"
                    style={{
                        left: `${contextMenuPos.x}px`,
                        top: `${contextMenuPos.y}px`,
                        zIndex: 9999, // Menu contextual siempre encima
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                            setIsEditing(true);
                            setShowContextMenu(false);
                        }}
                    >
                        <Type className="h-4 w-4" />
                        Editar texto
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={duplicateElement}
                    >
                        <Copy className="h-4 w-4" />
                        Duplicar
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                            onUpdate({
                                style: {
                                    ...element.style,
                                    opacity: Math.max(
                                        0,
                                        (element.style?.opacity || 1) - 0.1
                                    ),
                                },
                            });
                            setShowContextMenu(false);
                        }}
                    >
                        <CircleDot className="h-4 w-4" />
                        Reducir opacidad
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                            onDelete();
                            setShowContextMenu(false);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
}
