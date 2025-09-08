import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import html2canvas from 'html2canvas'; // Para captura de alta calidad
import * as htmlToImage from "html-to-image";

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import '/resources/css/thumbnail.css'


// ⚡ OPTIMIZACIÓN: Sistema de logging inteligente
const isServer = typeof window === 'undefined';
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log : () => { };
const warn = isDev ? console.warn : () => { };
const error = console.error; // Errores siempre visibles
const logVPS = console.log; // Logs normales habilitados

// Estilos personalizados para Driver.js con tema BananaLab
const driverStyles = `
    .driver-popover-banana {
        background: linear-gradient(135deg, #ffffff 0%, #faf7fb 100%);
        border: 2px solid #af5cb8;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(175, 92, 184, 0.15);
        max-width: 420px !important;
        min-width: 380px !important;
        padding: 20px !important;
    }
    
    .driver-popover-banana .driver-popover-title {
        color: #af5cb8;
        font-weight: 700;
        font-size: 20px !important;
        margin-bottom: 12px !important;
        display: flex;
        align-items: center;
        gap: 8px;
        line-height: 1.3 !important;
        word-wrap: break-word;
        white-space: normal;
    }
    
    .driver-popover-banana .driver-popover-description {
        color: #4a5568;
        font-size: 16px !important;
        line-height: 1.6 !important;
        margin-bottom: 20px !important;
        word-wrap: break-word;
        white-space: normal;
        text-align: left;
    }
    
    .driver-popover-banana .driver-popover-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-top: 20px !important;
        flex-wrap: wrap;
    }
    
    .driver-popover-banana .driver-popover-progress-text {
        color: #af5cb8;
        font-size: 13px !important;
        font-weight: 600;
        background: rgba(175, 92, 184, 0.1);
        padding: 6px 10px;
        border-radius: 8px;
        white-space: nowrap;
    }
    
    .driver-popover-banana .driver-popover-next-btn,
    .driver-popover-banana .driver-popover-prev-btn {
        background: linear-gradient(135deg, #af5cb8 0%, #9333ea 100%);
        color: white;
        border: none;
        padding: 12px 20px !important;
        border-radius: 10px;
        font-weight: 600;
        font-size: 15px !important;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(175, 92, 184, 0.3);
        white-space: nowrap;
        min-width: 120px;
    }
    
    .driver-popover-banana .driver-popover-next-btn:hover,
    .driver-popover-banana .driver-popover-prev-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(175, 92, 184, 0.4);
    }
    
    .driver-popover-banana .driver-popover-prev-btn {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    }
    
    .driver-popover-banana .driver-popover-prev-btn:hover {
        box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
    }
    
    .driver-popover-banana .driver-popover-close-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
    }
    
    .driver-popover-banana .driver-popover-close-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.05);
    }
    
    .driver-overlay {
        background: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
    }
    
    .driver-highlighted-element {
        border-radius: 12px !important;
        box-shadow: 0 0 0 6px rgba(175, 92, 184, 0.8) !important, 
                    0 0 30px rgba(175, 92, 184, 0.6) !important,
                    0 0 60px rgba(175, 92, 184, 0.4) !important;
        position: relative !important;
        z-index: 9999 !important;
        background: rgba(255, 255, 255, 0.05) !important;
    }
    
    .driver-highlighted-element::before {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 12px;
        padding: 2px;
        background: linear-gradient(45deg, #af5cb8, #9333ea, #af5cb8);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        -webkit-mask-composite: xor;
        animation: borderGlow 2s ease-in-out infinite alternate;
    }
    
    @keyframes borderGlow {
        0% { opacity: 0.6; }
        100% { opacity: 1; }
    }
    
    /* Responsive adjustments */
    @media (max-width: 480px) {
        .driver-popover-banana {
            max-width: 95vw !important;
            min-width: 300px !important;
            margin: 10px !important;
        }
        
        .driver-popover-banana .driver-popover-title {
            font-size: 18px !important;
        }
        
        .driver-popover-banana .driver-popover-description {
            font-size: 14px !important;
        }
        
        .driver-popover-banana .driver-popover-footer {
            flex-direction: column;
            gap: 12px;
        }
        
        .driver-popover-banana .driver-popover-next-btn,
        .driver-popover-banana .driver-popover-prev-btn {
            width: 100%;
            min-width: auto;
        }
    }
`;

// Inyectar estilos en el head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = driverStyles;
    document.head.appendChild(styleSheet);
}

// Función debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

import LayerPanel from "./components/Elements/LayerPanel";
import {
    Undo2,
    Redo2,
    Trash2,
    ChevronLeft,
    ImageIcon,
    Type,
    Plus,
    Copy,
    Book,
    Pencil,
    CheckCircleIcon,
    Save,
    HelpCircle,
    MoreHorizontal,
    Layers,
    Layout,
    Filter,
} from "lucide-react";

import { toast, Toaster } from "sonner";
import { Local } from "sode-extend-react";

import { layouts } from "./constants/layouts";
import { imageMasks } from "./constants/masks";
import Button from "./components/UI/Button";

import EditableCell from "./components/Elements/EditableCell";
import LayoutSelector from "./components/Elements/LayoutSelector";
import { FilterControls } from "./components/Editor/FilterControls";

import { MaskSelector } from "./components/Elements/MaskSelector";
import BookPreviewModal from "./components/Editor/BookPreview";
import Global from "../../../Utils/Global";
import { generateFastThumbnails, clearThumbnailCaches, generateSingleThumbnail, generateThumbnailWithGuaranteedFilters } from "./utils/thumbnailGenerator";

import { useAutoSave } from "./utils/useAutoSave";
import SaveIndicator from "./components/UI/SaveIndicator";

// 🚀 NUEVO: Hook para convertir data URLs a Blob URLs automáticamente
import { useBlobThumbnails } from "./hooks/useBlobThumbnails";

// 🔧 FUNCIÓN MEJORADA PARA CALCULAR DIMENSIONES DE CELDAS EN LAYOUTS
const calculateCellDimensions = (layout, cellIndex, workspaceDimensions) => {
    if (!layout || !layout.template) {
        return workspaceDimensions; // Fallback a workspace completo
    }

    // Extraer información del template CSS Grid
    const template = layout.template;
    let cols = 1, rows = 1;

    // 🔧 MEJORADO: Parsear diferentes formatos de grid
    const colsMatch = template.match(/grid-cols-(\d+)/);
    const rowsMatch = template.match(/grid-rows-(\d+)/);

    if (colsMatch) cols = parseInt(colsMatch[1]);
    if (rowsMatch) rows = parseInt(rowsMatch[1]);

    // 🔧 MEJORADO: Extraer gap del template si existe
    let gapValue = 16; // Default
    const gapMatch = template.match(/gap-(\d+)/);
    if (gapMatch) {
        gapValue = parseInt(gapMatch[1]) * 4; // Tailwind: gap-1 = 4px, gap-2 = 8px, etc.
    } else if (layout.style?.gap) {
        gapValue = parseInt(layout.style.gap);
    }

    // 🔧 MEJORADO: Calcular padding del layout
    let paddingValue = 0;
    if (layout.style?.padding) {
        paddingValue = parseInt(layout.style.padding) * 2; // Top + bottom, left + right
    }

    // Calcular dimensiones disponibles después de gaps y padding
    const availableWidth = workspaceDimensions.width - paddingValue - (gapValue * (cols - 1));
    const availableHeight = workspaceDimensions.height - paddingValue - (gapValue * (rows - 1));

    // 🔧 MEJORADO: Manejar layouts con celdas que ocupan múltiples columnas/filas
    let cellWidth = Math.floor(availableWidth / cols);
    let cellHeight = Math.floor(availableHeight / rows);

    // Para layouts complejos como magazine-asymmetric, usar cellStyles si existe
    if (layout.cellStyles && layout.cellStyles[cellIndex]) {
        const cellStyle = layout.cellStyles[cellIndex];

        // Detectar col-span y row-span
        const colSpanMatch = cellStyle.match(/col-span-(\d+)/);
        const rowSpanMatch = cellStyle.match(/row-span-(\d+)/);

        if (colSpanMatch) {
            const colSpan = parseInt(colSpanMatch[1]);
            cellWidth = Math.floor((availableWidth + (gapValue * (colSpan - 1))) / cols * colSpan);
        }

        if (rowSpanMatch) {
            const rowSpan = parseInt(rowSpanMatch[1]);
            cellHeight = Math.floor((availableHeight + (gapValue * (rowSpan - 1))) / rows * rowSpan);
        }
    }

    logVPS(`🔧 [CELL-DIMENSIONS] Layout: ${layout.id}, Celda: ${cellIndex}, Grid: ${cols}x${rows}, Gap: ${gapValue}px, Dims: ${cellWidth}x${cellHeight}`);

    return {
        width: cellWidth,
        height: cellHeight
    };
};

// Componente para mostrar imágenes del proyecto con drag & drop
const ProjectImageGallery = React.memo(({ images, onImageSelect, isLoading }) => {
    const ImageItem = React.memo(({ image }) => {
        const [imageLoaded, setImageLoaded] = useState(false);
        const [imageError, setImageError] = useState(false);
        const [dragStarted, setDragStarted] = useState(false);

        const [{ isDragging }, drag] = useDrag(() => ({
            type: 'PROJECT_IMAGE',
            item: { type: 'PROJECT_IMAGE', imageUrl: image.url },
            collect: (monitor) => ({
                isDragging: !!monitor.isDragging(),
            }),
            end: () => {
                // Reset drag state after a short delay
                setTimeout(() => setDragStarted(false), 100);
            }
        }));

        // Usar miniatura si está disponible, sino usar imagen original
        const displayImage = image.thumbnail_url || image.url;
        const fullImage = image.url;

        // 🚀 Handler para detectar inicio de drag vs click
        const handleMouseDown = (e) => {
            setDragStarted(true);
            // Reset after a longer delay to ensure drag detection
            setTimeout(() => setDragStarted(false), 500);
        };

        const handleClick = (e) => {
            // Prevent click if drag was initiated recently or if currently dragging
            if (dragStarted || isDragging) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Solo ejecutar si es un click genuino (no parte de drag)
            onImageSelect(fullImage);
        };

        return (
            <div
                ref={drag}
                className={`relative group cursor-pointer bg-gray-50 rounded-lg overflow-hidden border-2 border-transparent hover:border-[#af5cb8] transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''
                    }`}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
            >
                <div className="aspect-square relative">
                    {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[#af5cb8] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {imageError ? (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-xs">Error al cargar</p>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={displayImage}
                            alt={image.filename || 'Project image'}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                        />
                    )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white rounded-full p-2 shadow-md">
                            <Plus className="h-4 w-4 text-[#af5cb8]" />
                        </div>
                    </div>
                </div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {image.has_thumbnail ? 'Optimizada' : 'Arrastra o haz clic'}
                </div>
                {/* Indicador de miniatura */}
                {image.has_thumbnail && (
                    <div className="absolute top-2 left-2 bg-green-500 rounded-full w-2 h-2"></div>
                )}
            </div>
        );
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">No hay imágenes en este proyecto</p>
                <p className="text-xs text-gray-500">Sube una imagen para empezar</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                    <ImageItem key={`${image.id || image.url}-${index}`} image={image} />
                ))}
            </div>

            {/* Información adicional */}
            <div className="text-center">
                <p className="text-xs text-gray-500">
                    {images.filter(img => img.has_thumbnail).length} de {images.length} imágenes optimizadas
                </p>
            </div>
        </div>
    );
});

// Componente principal del editor
export default function EditorLibro() {
    // Estados para cargar datos desde el backend
    const [projectData, setProjectData] = useState(null);
    const [itemData, setItemData] = useState(null);
    const [presetData, setPresetData] = useState(null);
    const [initialProject, setInitialProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Estado para auto-guardado inteligente
    const [autoSaveState, setAutoSaveState] = useState({
        hasUnsavedChanges: false,
        lastEditTime: null,
        isSaving: false
    });

    // Estado para rastrear cambios por página
    const [pageChanges, setPageChanges] = useState(new Map());

    // Cola de guardado en segundo plano
    const [saveQueue, setSaveQueue] = useState([]);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);

    // Referencias para acceder a los valores actuales sin dependencias
    const saveQueueRef = useRef(saveQueue);
    const pageChangesRef = useRef(pageChanges);
    const loadingTimeoutRef = useRef(null); // 🚀 Timeout para loading states
    const thumbnailLoadTimeoutRef = useRef(null); // 🛡️ Timeout para debounce de carga de thumbnails

    // Actualizar refs cuando cambien los valores
    useEffect(() => {
        saveQueueRef.current = saveQueue;
    }, [saveQueue]);

    useEffect(() => {
        pageChangesRef.current = pageChanges;
    }, [pageChanges]);

    // Efecto para cargar datos desde la URL
    useEffect(() => {
        const loadProjectData = async () => {
            try {
                // Obtener el parámetro project de la URL
                const urlParams = new URLSearchParams(window.location.search);
                const projectId = urlParams.get('project');

                if (!projectId) {
                    setLoadError('No se encontró el ID del proyecto en la URL');
                    setIsLoading(false);
                    return;
                }


                // Realizar fetch al backend para obtener los datos del proyecto
                const response = await fetch(`/api/canvas/projects/${projectId}`, {
                    method: 'GET',
                    credentials: 'include', // Incluir cookies de sesión
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar el proyecto');
                }

                const data = await response.json();


                // Establecer los datos en el estado
                setProjectData(data.project);
                setItemData(data.item);
                setPresetData(data.canvasPreset);
                setInitialProject(data.initialProject);

                setIsLoading(false);

            } catch (error) {
                console.error('❌ Error cargando proyecto:', error);
                setLoadError(error.message);
                setIsLoading(false);
            }
        };

        loadProjectData();
    }, []);

    // Estado del carrito - igual que en System.jsx
    const [cart, setCart] = useState(
        Local.get(`${Global.APP_CORRELATIVE}_cart`) ?? []
    );

    // Sincronizar carrito con localStorage
    useEffect(() => {
        Local.set(`${Global.APP_CORRELATIVE}_cart`, cart);
    }, [cart]);

    // Estado inicial de páginas - viene desde initialProject
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [workspaceSize, setWorkspaceSize] = useState("preset");

    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [activeTab, setActiveTab] = useState("pages");
    const [history, setHistory] = useState([JSON.stringify(pages)]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [pageThumbnails, setPageThumbnails] = useState({});


    const [projectImages, setProjectImages] = useState([]); // Nueva: imágenes del proyecto
    const [projectImagesLoading, setProjectImagesLoading] = useState(false);
    const [imageCache, setImageCache] = useState(new Map()); // Cache para evitar re-renders
    const [imageBlobCache, setImageBlobCache] = useState(() => new Map()); // 🚀 Cache de blobs optimizado
    const [thumbnailProgress, setThumbnailProgress] = useState(null); // ⚡ Estado de progreso de thumbnails
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false); // 🛡️ Control de llamadas en progreso


    // 🚨 SOLUCIÓN DE EMERGENCIA: Sistema global para forzar regeneración de thumbnails (SOLO CLIENTE)
    if (!isServer) {
        window.FORCE_THUMBNAIL_REGENERATION = true; // Habilitado globalmente
        window.PREVENT_THUMBNAIL_RESET = false; // Permitir generación automática de thumbnails normales
        window._protectedThumbnailIds = []; // Resetear lista de thumbnails protegidos
        window.THUMBNAIL_PROTECTED = false; // Desactivar protección global al inicio

        // 🎭 PRESERVAR FILTROS: Asegurarse que se apliquen todos los filtros correctamente
        window.PRESERVE_FILTERS = true; // Flag global para indicar que queremos mantener los filtros
    }

    // �🚀 Estado para control de inicialización de progreso
    const [hasInitializedProgress, setHasInitializedProgress] = useState(false);

    // Referencias y timeouts para manejo de miniaturas
    const thumbnailTimeout = useRef();

    // Estado para las dimensiones calculadas
    const [workspaceDimensions, setWorkspaceDimensions] = useState({ width: 1000, height: 800 });

    // 🛡️ FUNCIÓN SEGURA PARA ESTABLECER THUMBNAILS (con protección)
    const setPageThumbnailsSafely = useCallback((pageId, thumbnail, source = 'unknown') => {
        // Verificar si el thumbnail está protegido
        if (window.isThumbnailProtected?.(pageId)) {
            console.error(`� [PROTECTION BLOCK] ¡BLOQUEADO! Intento de sobrescribir thumbnail protegido ${pageId} desde: ${source}`);
            console.error(`🚨 [PROTECTION BLOCK] Stack trace:`, new Error().stack);
            return false; // No permitir la sobrescritura
        }

        setPageThumbnails(prev => {
            const oldThumbnail = prev[pageId];
            const isOverwriting = oldThumbnail && oldThumbnail !== thumbnail;

            if (isOverwriting) {
                // console.log(`🔄 [THUMBNAIL UPDATE] Actualizando thumbnail ${pageId} desde: ${source}`);
            } else {
                //console.log(`✅ [THUMBNAIL SET] Estableciendo thumbnail ${pageId} desde: ${source}`);
            }

            return {
                ...prev,
                [pageId]: thumbnail
            };
        });

        return true; // Éxito
    }, []);

    // ✨ Configuración de Driver.js para la guía
    const driverObj = useMemo(() => {
        return driver({
            showProgress: true,
            animate: true,
            smoothScroll: true,
            allowClose: true,
            steps: [
                {
                    element: '#editor-workspace',
                    popover: {
                        title: '¡Bienvenido al Editor de BananaLab! 🍌',
                        description: 'Este es tu lienzo de trabajo donde crearás diseños increíbles. Aquí puedes ver y editar la página actual de tu proyecto.',
                        side: "left",
                        align: 'start'
                    }
                },
                {
                    popover: {
                        title: '🎯 Navegación Principal',
                        description: 'En la barra lateral izquierda encontrarás todas las herramientas organizadas por categorías. Cada ícono te lleva a una sección específica.',
                        side: "right",
                        align: 'center'
                    }
                },
                {
                    element: '[data-tab="pages"]',
                    popover: {
                        title: '📄 Sección Páginas',
                        description: 'Gestiona todas las páginas de tu proyecto: portada, páginas de contenido y contraportada. Haz clic en cualquier página para editarla.',
                        side: "right",
                        align: 'start'
                    }
                },
                {
                    element: '[data-tab="templates"]',
                    popover: {
                        title: '🎨 Sección Diseños',
                        description: 'Elige entre diferentes layouts y plantillas para organizar el contenido de tu página. Cada diseño tiene una distribución única.',
                        side: "right",
                        align: 'center'
                    }
                },
                {
                    element: '[data-tab="panel"]',
                    popover: {
                        title: '📚 Sección Capas',
                        description: 'Organiza y controla la superposición de elementos. Cambia el orden de las capas, oculta elementos o ajusta su posición.',
                        side: "right",
                        align: 'center'
                    }
                },
                {
                    element: '[data-tab="text"]',
                    popover: {
                        title: '✍️ Sección Textos',
                        description: 'Agrega y personaliza textos: títulos, subtítulos y párrafos. Cambia fuentes, colores, tamaños y efectos de texto.',
                        side: "right",
                        align: 'center'
                    }
                },
                {
                    element: '[data-tab="filters"]',
                    popover: {
                        title: '🎭 Sección Filtros',
                        description: 'Aplica efectos visuales a tus imágenes: brillo, contraste, saturación, máscaras y más filtros profesionales.',
                        side: "right",
                        align: 'center'
                    }
                },
                {
                    element: '#quick-actions-bar',
                    popover: {
                        title: '⚡ Acciones Rápidas',
                        description: 'Herramientas de acceso rápido: cambiar diseño de página, gestionar capas, agregar imágenes y duplicar elementos.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#toolbar-actions',
                    popover: {
                        title: '💾 Controles de Proyecto',
                        description: 'Deshacer/rehacer cambios, guardar progreso automáticamente y acceder a la vista previa de tu álbum.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#preview-button',
                    popover: {
                        title: '👁️ Vista de Álbum',
                        description: 'Visualiza tu proyecto completo como un álbum real. Perfecto para revisar el resultado final antes de completar.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    popover: {
                        title: '🎉 ¡Listo para crear!',
                        description: 'Ya conoces todas las herramientas principales. Comienza seleccionando una página y agregando elementos. ¡Diviértete creando!',
                        side: "center",
                        align: 'center'
                    }
                }
            ],
            nextBtnText: 'Siguiente →',
            prevBtnText: '← Anterior',
            doneBtnText: '¡Empezar a crear! 🚀',
            closeBtnText: '✕',
            progressText: 'Paso {{current}} de {{total}}',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            popoverClass: 'driver-popover-banana',
            onHighlightStarted: (element, step) => {

                // Si el paso requiere cambiar a una pestaña específica
                const tabElement = element?.getAttribute?.('data-tab');
                if (tabElement && activeTab !== tabElement) {
                    setActiveTab(tabElement);
                }
            },
            onDeselected: () => {
                console.log('🎯 [TOUR-COMPLETED] Tour completado por el usuario');

                // Marcar tour como completado para este usuario específico
                const userId = projectData?.user_id || 'anonymous';
                const userTourKey = `bananalab_editor_tour_user_${userId}`;
                localStorage.setItem('bananalab_editor_tour_completed', 'true');
                localStorage.setItem(userTourKey, new Date().toISOString());

                // Opcional: mostrar mensaje de bienvenida final
                toast.success('¡Guía completada! Ya puedes empezar a crear tu diseño.', {
                    duration: 3000
                });
            }
        });
    }, [activeTab, setActiveTab]);

    // 🎯 SISTEMA DE TOUR AUTOMÁTICO PARA USUARIOS NUEVOS
    const checkAndStartAutoTour = useCallback(() => {
        // Verificar si el usuario ya ha visto el tour
        const hasSeenTour = localStorage.getItem('bananalab_editor_tour_completed');
        const userId = projectData?.user_id || 'anonymous';
        const userTourKey = `bananalab_editor_tour_user_${userId}`;
        const hasUserSeenTour = localStorage.getItem(userTourKey);

        // Si es la primera vez (ni global ni por usuario), iniciar tour automáticamente
        if (!hasSeenTour && !hasUserSeenTour) {
            console.log('🎯 [AUTO-TOUR] Usuario nuevo detectado, iniciando tour automático');

            // Pequeño delay para asegurar que el DOM esté completamente cargado
            setTimeout(() => {
                startTour();

                // Marcar como completado tanto globalmente como por usuario
                localStorage.setItem('bananalab_editor_tour_completed', 'true');
                localStorage.setItem(userTourKey, new Date().toISOString());
            }, 1500); // 1.5 segundos de delay para mejor UX
        } else {
            console.log('🎯 [AUTO-TOUR] Usuario experimentado, no se inicia tour automático');
        }
    }, [projectData?.user_id]);

    // Función para iniciar la guía manualmente
    const startTour = useCallback(() => {
        console.log('🎯 [MANUAL-TOUR] Iniciando tour manual');
        driverObj.drive();
    }, [driverObj]);

    // 🔧 FUNCIÓN DE UTILIDAD: Resetear estado del tour (para testing/admin)
    const resetTourState = useCallback(() => {
        const userId = projectData?.user_id || 'anonymous';
        const userTourKey = `bananalab_editor_tour_user_${userId}`;

        localStorage.removeItem('bananalab_editor_tour_completed');
        localStorage.removeItem(userTourKey);

        console.log('🔧 [TOUR-RESET] Estado del tour reseteado para usuario:', userId);
        toast.info('Estado del tour reseteado. Recarga la página para ver el tour automático.', {
            duration: 4000
        });
    }, [projectData?.user_id]);

    // 🖼️ Función para cargar thumbnails guardados desde la base de datos (OPCIONAL)
    const loadStoredThumbnails = useCallback(async () => {
        if (!projectData?.id) return;

        try {
            // Usar el endpoint original primero para verificar si hay thumbnails
            const response = await fetch(`/api/thumbnails/${projectData.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.thumbnails && data.thumbnails.length > 0) {
                    // Solo actualizar si hay thumbnails guardados
                    const thumbnailsObject = {};
                    data.thumbnails.forEach(thumbnail => {
                        if (thumbnail.page_id && thumbnail.thumbnail_url) {
                            thumbnailsObject[thumbnail.page_id] = thumbnail.thumbnail_url;
                        }
                    });

                    // Solo actualizar si encontramos thumbnails guardados
                    if (Object.keys(thumbnailsObject).length > 0) {
                        setPageThumbnails(prev => {
                            console.warn(`🚨 [STORAGE LOAD] ¡ALERTA! Cargando thumbnails desde storage - POSIBLE CULPABLE DE SOBRESCRITURA`);
                            console.warn(`🚨 [STORAGE LOAD] Thumbnails protegidos:`, Array.from(window._protectedThumbnails || []));
                            console.warn(`🚨 [STORAGE LOAD] Stack trace:`, new Error().stack);

                            // Filtrar thumbnails protegidos para no sobrescribirlos
                            const filteredThumbnails = {};
                            for (const [pageId, thumbnail] of Object.entries(thumbnailsObject)) {
                                if (window.isThumbnailProtected?.(pageId)) {
                                    console.warn(`🛡️ [STORAGE PROTECTION] NO sobrescribiendo thumbnail protegido: ${pageId}`);
                                } else {
                                    filteredThumbnails[pageId] = thumbnail;
                                }
                            }

                            return {
                                ...prev, // Mantener thumbnails locales existentes
                                ...filteredThumbnails // Solo añadir los no protegidos
                            };
                        });
                    } else {
                        //    console.log('ℹ️ No hay thumbnails guardados, usando generación local');
                    }
                } else {
                    // console.log('ℹ️ No hay thumbnails guardados para este proyecto');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error cargando thumbnails guardados (usando locales):', error);
        }
    }, [projectData?.id]);

    // ⚡ OPTIMIZACIÓN: Referencias adicionales para debounce y cache
    const thumbnailDebounceTimers = useRef(new Map());
    const thumbnailCache = useRef(new Map());

    // ⚡ OPTIMIZACIÓN: Limpieza de memoria cada 5 minutos
    const memoryCleanupInterval = useRef(null);

    useEffect(() => {
        // Limpieza automática cada 5 minutos
        memoryCleanupInterval.current = setInterval(() => {
            // Limpiar caché de thumbnails antiguo (más de 10 minutos)
            const now = Date.now();
            const CACHE_MAX_AGE = 10 * 60 * 1000; // 10 minutos

            for (const [key, value] of thumbnailCache.current.entries()) {
                if (now - value.timestamp > CACHE_MAX_AGE) {
                    thumbnailCache.current.delete(key);
                }
            }

            // Limpiar caché global de thumbnails si es muy grande
            if (window.thumbnailCache && typeof window.thumbnailCache === 'object') {
                const keys = Object.keys(window.thumbnailCache);
                if (keys.length > 100) { // Máximo 100 thumbnails en caché
                    // Mantener solo los 60 más recientes
                    const sortedKeys = keys.sort().slice(-60);
                    const newCache = {};
                    sortedKeys.forEach(key => {
                        newCache[key] = window.thumbnailCache[key];
                    });
                    window.thumbnailCache = newCache;
                }
            }

        }, 300000); // Cada 5 minutos

        return () => {
            if (memoryCleanupInterval.current) {
                clearInterval(memoryCleanupInterval.current);
            }
        };
    }, []);


    // 🚀 OPTIMIZACIÓN: Pre-cache de imágenes en background
    const preloadImageCache = useCallback((imageUrl) => {
        if (imageBlobCache.has && imageBlobCache.has(imageUrl)) return;

        // Crear versión optimizada de la imagen en background
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Solo comprimir si la imagen es muy grande
            const shouldCompress = img.width > 1200 || img.height > 1200;

            if (shouldCompress) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calcular nuevo tamaño manteniendo aspect ratio
                const maxSize = 1200;
                const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;

                canvas.width = newWidth;
                canvas.height = newHeight;

                // Usar filtro para mejor calidad
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setImageBlobCache(prev => {
                            const newCache = new Map(prev);
                            newCache.set(imageUrl, url);

                            // Limpiar cache si es muy grande
                            if (newCache.size > 15) {
                                const firstKey = newCache.keys().next().value;
                                const firstUrl = newCache.get(firstKey);
                                URL.revokeObjectURL(firstUrl);
                                newCache.delete(firstKey);
                            }

                            return newCache;
                        });
                    }
                }, 'image/webp', 0.85);
            }
        };
        img.onerror = () => {
            console.warn('❌ Error pre-cargando imagen:', imageUrl);
        };
        img.src = imageUrl;
    }, []); // Remove imageBlobCache dependency

    // 🚀 OPTIMIZACIÓN: Precargar imágenes del proyecto en background
    useEffect(() => {
        if (projectImages.length > 0) {
            // Precargar solo las primeras 10 imágenes para no sobrecargar
            const imagesToPreload = projectImages.slice(0, 10);
            imagesToPreload.forEach((image, index) => {
                setTimeout(() => {
                    preloadImageCache(image.url);
                }, index * 100); // Stagger la carga
            });
        }
    }, [projectImages, preloadImageCache]);

    // 🚀 OPTIMIZACIÓN: Limpiar cache de blobs al desmontar
    useEffect(() => {
        return () => {
            if (imageBlobCache && imageBlobCache.forEach) {
                imageBlobCache.forEach(url => URL.revokeObjectURL(url));
            }
        };
    }, []); // Empty dependency array - cleanup only on unmount

    // 🚀 OPTIMIZACIÓN: Limpiar caches de thumbnails rápidos al desmontar
    useEffect(() => {
        return () => {
            clearThumbnailCaches();
        };
    }, []);


    // Actualizar estados del editor cuando se cargan los datos del proyecto
    useEffect(() => {
        if (initialProject && itemData && presetData) {

            // En lugar de usar directamente initialProject.pages, recreamos las páginas
            // para asegurar que tengan las propiedades backgroundImage y backgroundColor correctas
            if (initialProject.pages && Array.isArray(initialProject.pages)) {

                // Si ya hay páginas en initialProject, las usamos como base pero actualizamos los backgrounds
                const updatedPages = initialProject.pages.map(page => {
                    let backgroundImage = null;
                    let backgroundColor = presetData.background_color || '#ffffff';

                    // Aplicar la lógica de background según el tipo de página y si está habilitada
                    if (page.type === 'cover' && (itemData.has_cover_image === true || itemData.has_cover_image === 1)) {
                        if (itemData.cover_image) {
                            backgroundImage = `/storage/images/item/${itemData.cover_image}`;
                        }
                    } else if (page.type === 'content') {
                        // Páginas de contenido siempre activas
                        if (itemData.content_image) {
                            backgroundImage = `/storage/images/item/${itemData.content_image}`;
                        }
                    } else if ((page.type === 'final' || page.type === 'contraportada') && (itemData.has_back_cover_image === true || itemData.has_back_cover_image === 1)) {
                        if (itemData.back_cover_image) {
                            backgroundImage = `/storage/images/item/${itemData.back_cover_image}`;
                        }
                    }

                    return {
                        ...page,
                        backgroundImage,
                        backgroundColor
                    };
                }).filter(page => {
                    // Filtrar páginas que no deberían existir según la configuración
                    if (page.type === 'cover' && (itemData.has_cover_image === false || itemData.has_cover_image === 0)) {
                        return false;
                    }
                    if ((page.type === 'final' || page.type === 'contraportada') && (itemData.has_back_cover_image === false || itemData.has_back_cover_image === 0)) {
                        return false;
                    }
                    return true;
                });

                // 🚀 PROTECCIÓN: Solo actualizar si no hay páginas ya cargadas o si es la carga inicial
                setPages(prevPages => {
                    // Si ya hay páginas con contenido, no sobrescribir
                    if (prevPages.length > 0) {
                        // Mergear solo los backgrounds sin perder elementos del usuario
                        return prevPages.map((existingPage, index) => {
                            const newPageData = updatedPages[index];
                            if (newPageData) {
                                return {
                                    ...existingPage,
                                    // Solo actualizar backgrounds si no se han modificado
                                    backgroundImage: existingPage.backgroundImage || newPageData.backgroundImage,
                                    backgroundColor: existingPage.backgroundColor || newPageData.backgroundColor
                                };
                            }
                            return existingPage;
                        });
                    }

                    // Primera carga: usar las páginas de la DB
                    return updatedPages;
                });

                // Solo inicializar historial si está vacío
                setHistory(prevHistory => {
                    if (prevHistory.length <= 1) {
                        return [JSON.stringify(updatedPages)];
                    }
                    return prevHistory;
                });

                setHistoryIndex(prevIndex => {
                    if (prevIndex === 0 && history.length <= 1) {
                        return 0;
                    }
                    return prevIndex;
                });

                // 🖼️ Cargar thumbnails guardados después de inicializar páginas
                setTimeout(() => {
                    loadStoredThumbnails();
                }, 100);
            } else {
                // Si no hay páginas, crear páginas nuevas usando createPagesFromPreset
                const newPages = createPagesFromPreset(presetData, itemData);
                setPages(newPages);
                setHistory([JSON.stringify(newPages)]);
                setHistoryIndex(0);

                // 🖼️ Cargar thumbnails guardados después de crear páginas
                setTimeout(() => {
                    loadStoredThumbnails();
                }, 100);
            }

            if (typeof initialProject.currentPage === 'number') {
                setCurrentPage(initialProject.currentPage);
            }

            if (initialProject.workspaceSize) {
                setWorkspaceSize(initialProject.workspaceSize);
            }
        }
    }, [initialProject, itemData, presetData, loadStoredThumbnails]);

    // 💾 Inicializar hook de auto-guardado con todos los parámetros necesarios
    const autoSave = useAutoSave(pages, projectData, itemData, presetData, workspaceDimensions, pageThumbnails);

    // Función para obtener las dimensiones del área de trabajo
    const getWorkspaceDimensions = () => {
        // Si hay preset con dimensiones, usar esas dimensiones
        if (presetData?.width && presetData?.height) {
            // Las dimensiones vienen en centímetros desde la base de datos
            let widthCm = presetData.width * 6;
            let heightCm = presetData.height * 6;
            let widthPx = widthCm * 37.8; // Conversión aproximada cm a px (300 DPI)
            let heightPx = heightCm * 37.8;

            if (widthPx && heightPx) {
                const maxScreenWidth = window.innerWidth * 0.6; // 60% del ancho de pantalla
                const maxScreenHeight = window.innerHeight * 0.7; // 70% del alto de pantalla

                // Calcular escala para que quepa en pantalla manteniendo proporción
                const scaleX = maxScreenWidth / widthPx;
                const scaleY = maxScreenHeight / heightPx;
                const scale = Math.min(scaleX, scaleY, 1); // No agrandar más del tamaño original

                return {
                    width: Math.round(widthPx * scale),
                    height: Math.round(heightPx * scale),
                    originalWidth: widthCm,
                    originalHeight: heightCm,
                    scale: scale,
                    unit: 'cm',
                    originalWidthPx: Math.round(widthPx),
                    originalHeightPx: Math.round(heightPx)
                };
            }
        }

        // Fallback si hay canvas_config en extra_settings
        if (presetData?.extra_settings) {
            try {
                const extraSettings = typeof presetData.extra_settings === 'string'
                    ? JSON.parse(presetData.extra_settings)
                    : presetData.extra_settings;

                if (extraSettings?.canvas_config) {
                    const canvasConfig = extraSettings.canvas_config;
                    let widthCm = canvasConfig.width;
                    let heightCm = canvasConfig.height;
                    let widthPx = widthCm * 37.8;
                    let heightPx = heightCm * 37.8;

                    if (widthPx && heightPx) {
                        const maxScreenWidth = window.innerWidth * 0.6;
                        const maxScreenHeight = window.innerHeight * 0.7;
                        const scaleX = maxScreenWidth / widthPx;
                        const scaleY = maxScreenHeight / heightPx;
                        const scale = Math.min(scaleX, scaleY, 1);

                        return {
                            width: Math.round(widthPx * scale),
                            height: Math.round(heightPx * scale),
                            originalWidth: widthCm,
                            originalHeight: heightCm,
                            scale: scale,
                            unit: 'cm',
                            originalWidthPx: Math.round(widthPx),
                            originalHeightPx: Math.round(heightPx)
                        };
                    }
                }
            } catch (e) {
                console.warn('Error parsing extra_settings:', e);
            }
        }

        // Fallback a tamaños predefinidos
        const predefinedSizes = {
            "square": { width: 600, height: 600 },
            "landscape": { width: 1280, height: 720 },
            "portrait": { width: 600, height: 800 },
            "wide": { width: 1200, height: 600 },
            "tall": { width: 540, height: 960 },
            "preset": { width: 800, height: 600 } // Default si no hay preset
        };

        const size = predefinedSizes[workspaceSize] || predefinedSizes.preset;

        // Aplicar escalado también a tamaños predefinidos
        const maxScreenWidth = isServer ? 1200 : window.innerWidth * 0.6;
        const maxScreenHeight = isServer ? 800 : window.innerHeight * 0.7;

        const scaleX = maxScreenWidth / size.width;
        const scaleY = maxScreenHeight / size.height;
        const scale = Math.min(scaleX, scaleY, 1);

        return {
            width: Math.round(size.width * scale),
            height: Math.round(size.height * scale),
            originalWidth: size.width,
            originalHeight: size.height,
            scale: scale,
            unit: 'px'
        };
    };

    // Función para obtener dimensiones completas sin escalado para PDFs de alta resolución
    const getFullWorkspaceDimensions = () => {
        // Si hay preset con dimensiones, usar esas dimensiones COMPLETAS
        if (presetData?.width && presetData?.height) {
            // Las dimensiones vienen en centímetros desde la base de datos
            let widthCm = presetData.width;
            let heightCm = presetData.height;
            let widthPx = widthCm * 37.8; // Conversión aproximada cm a px (300 DPI)
            let heightPx = heightCm * 37.8;

            if (widthPx && heightPx) {
                return {
                    width: Math.round(widthPx),
                    height: Math.round(heightPx),
                    originalWidth: widthCm,
                    originalHeight: heightCm,
                    scale: 1, // Sin escalado para PDF
                    unit: 'cm',
                    originalWidthPx: Math.round(widthPx),
                    originalHeightPx: Math.round(heightPx)
                };
            }
        }

        // Fallback si hay canvas_config en extra_settings
        if (presetData?.extra_settings) {
            try {
                const extraSettings = typeof presetData.extra_settings === 'string'
                    ? JSON.parse(presetData.extra_settings)
                    : presetData.extra_settings;

                if (extraSettings?.canvas_config) {
                    const canvasConfig = extraSettings.canvas_config;
                    let widthCm = canvasConfig.width;
                    let heightCm = canvasConfig.height;
                    let widthPx = widthCm * 37.8;
                    let heightPx = heightCm * 37.8;

                    if (widthPx && heightPx) {
                        return {
                            width: Math.round(widthPx),
                            height: Math.round(heightPx),
                            originalWidth: widthCm,
                            originalHeight: heightCm,
                            scale: 1, // Sin escalado para PDF
                            unit: 'cm',
                            originalWidthPx: Math.round(widthPx),
                            originalHeightPx: Math.round(heightPx)
                        };
                    }
                }
            } catch (e) {
                console.warn('Error parsing extra_settings:', e);
            }
        }

        // Fallback a tamaños grandes para PDF
        const pdfSizes = {
            "square": { width: 1000, height: 1000 },
            "landscape": { width: 1280, height: 800 },
            "portrait": { width: 1000, height: 1200 },
            "wide": { width: 1400, height: 800 },
            "tall": { width: 800, height: 1200 },
            "preset": { width: 1000, height: 800 } // Default más grande para PDF
        };

        const size = pdfSizes[workspaceSize] || pdfSizes.preset;

        return {
            width: size.width,
            height: size.height,
            originalWidth: size.width,
            originalHeight: size.height,
            scale: 1, // Sin escalado
            unit: 'px'
        };
    };

    // Función para capturar el workspace actual con alta calidad y sin bordes
    const captureCurrentWorkspace = useCallback(async (pageIndex, options = { type: 'thumbnail' }) => {

        if (!pages[pageIndex]) return null;

        try {
            // CORRECCIÓN THUMBNAIL: Buscar específicamente el elemento de la página que tiene las dimensiones correctas de la BD
            let workspaceElement = document.querySelector(`#page-${pages[pageIndex].id}`);

            if (!workspaceElement) {
                console.warn('❌ THUMBNAIL: No se encontró el elemento de página específico');
                return null;
            }



            // Debug adicional para la página actual
            const currentPageData = pages[pageIndex];

            // 🔧 DETECTAR MODO LAYOUT: Verificar si estamos en modo layout con celdas
            const hasLayoutCells = currentPageData?.cells && currentPageData.cells.length > 0;
            const isLayoutMode = hasLayoutCells && workspaceElement.classList.contains('grid');

            logVPS(`🔧 [CAPTURE-MODE] Página ${pageIndex}: ${isLayoutMode ? 'LAYOUT' : 'LIBRE'}, Celdas: ${currentPageData?.cells?.length || 0}`);

            // 🛠️ LAYOUT MODE: Esperar renderizado del grid antes de capturar (OPTIMIZADO)
            if (isLayoutMode) {
                // 🚀 OPTIMIZACIÓN VPS: Reducir logs y timing para producción
                const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

                if (!isProduction) {
                    //console.log('🔧 [LAYOUT-CAPTURE] Esperando renderizado completo del grid...');
                }

                // 🚀 OPTIMIZACIÓN: Un solo requestAnimationFrame en lugar de doble
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        // Verificación mínima en producción
                        const cells = workspaceElement.querySelectorAll('[data-cell-id]');

                        if (!isProduction) {

                            // Solo mostrar logs detallados en desarrollo
                            if (cells.length <= 4) { // Limitar logs para layouts complejos
                                cells.forEach((cell, idx) => {
                                    const rect = cell.getBoundingClientRect();
                                });
                            }
                        }

                        resolve();
                    });
                });
            }

            // Configuración según el tipo de captura (thumbnail vs PDF)
            const isPDF = options.type === 'pdf';
            // 🖨️ IMPRESIÓN PROFESIONAL: Escalado optimizado para 300 DPI
            // 🚀 OPTIMIZACIÓN VPS: Factor de escala adaptivo según entorno
            const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';
            const scaleFactor = isPDF ?
                4 : // 4x para PDF 4000px alta calidad consistente
                4; // 4x para ULTRA ALTA calidad (4000x3200px) tanto en producción como local
            const quality = 1.0; // Calidad máxima sin compresión

            // Obtener dimensiones apropiadas según el tipo
            const dimensions = isPDF ? getFullWorkspaceDimensions() : workspaceDimensions;

            // CORRECCIÓN THUMBNAIL: Obtener las dimensiones reales del workspace de la BD
            const workspaceStyle = getComputedStyle(workspaceElement);

            // CORRECCIÓN THUMBNAIL: Determinar el color de fondo correcto del workspace/página
            let workspaceBackground = currentPageData?.backgroundColor || '#ffffff'; // Default a blanco

            // Si el elemento de página tiene un background específico, usarlo
            if (workspaceStyle.backgroundColor && workspaceStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                workspaceBackground = workspaceStyle.backgroundColor;
            }

            // 🖨️ OPCIONES PROFESIONALES: Configuración especial para PDF vs Thumbnails (OPTIMIZADO VPS)
            const captureOptions = {
                scale: scaleFactor,
                useCORS: true,
                allowTaint: false,
                backgroundColor: workspaceBackground,
                width: dimensions.width,
                height: dimensions.height,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                // 🔧 OPTIMIZACIÓN VPS: Reducir opciones pesadas en producción
                ...(isLayoutMode && {
                    windowWidth: dimensions.width / 2,
                    windowHeight: dimensions.height / 2,
                    ignoreElements: (el) => {
                        // 🚀 OPTIMIZACIÓN: Logs solo en desarrollo
                        if (el.style && el.style.filter && options.preserveFilters) {
                            if (!isProduction) {
                                //console.log('🎭 [PRESERVE-FILTER] Preservando filtro en layout:', el.id);
                            }
                            return false;
                        }
                        return el.classList?.contains('exclude-from-capture');
                    }
                }),
                // 🎭 MODO LIBRE: Configuración para elementos con posicionamiento absoluto
                ...(!isLayoutMode && {
                    ignoreElements: (el) => {
                        // 🚀 OPTIMIZACIÓN: Logs solo en desarrollo
                        if (el.style && el.style.filter && options.preserveFilters) {
                            if (!isProduction) {
                                // console.log('🎭 [PRESERVE-FILTER] Preservando filtro:', el.id);
                            }
                            return false;
                        }
                        return el.classList?.contains('exclude-from-capture');
                    }
                }),
                // 🖨️ Configuración específica para PDF de impresión profesional
                foreignObjectRendering: (isPDF || isLayoutMode) ? true : false, // Mejor renderizado para PDF y LAYOUTS
                removeContainer: false,
                logging: isLayoutMode && !isProduction ? true : false, // 🚀 OPTIMIZACIÓN: Solo logs en desarrollo
                imageTimeout: isPDF ? 60000 : (isLayoutMode ? (isProduction ? 15000 : 30000) : 15000), // 🚀 Timeouts más cortos en VPS
                pixelRatio: isPDF ? 3 : (isProduction ? 1 : (isServer ? 1 : (window.devicePixelRatio || 1))), // 🚀 Reducir pixelRatio en VPS y servidor
                // 🔧 LAYOUT MODE: Configuración especial para CSS Grid
                ...(isLayoutMode && {
                    allowTaint: true,
                    useCORS: true,
                    letterRendering: !isProduction, // 🚀 Simplificar renderizado en VPS
                    ignoreElements: (el) => {
                        // En layouts, ser más permisivo con elementos
                        return el.classList?.contains('exclude-from-capture') ||
                            el.classList?.contains('ui-element');
                    }
                }),
                // 🖨️ CONFIGURACIÓN CRÍTICA para impresión profesional
                canvas: isPDF ? document.createElement('canvas') : null,
                windowWidth: isPDF ? (() => {
                    const fullDims = getFullWorkspaceDimensions();
                    return fullDims.width * scaleFactor;
                })() : null,
                windowHeight: isPDF ? (() => {
                    const fullDims = getFullWorkspaceDimensions();
                    return fullDims.height * scaleFactor;
                })() : null,
                onclone: async (clonedDoc) => {

                    // CORRECCIÓN THUMBNAIL: Limpiar elementos de UI que no pertenecen al workspace
                    const excludedSelectors = [
                        '.toolbar',
                        '.ui-element',
                        '.floating',
                        '.overlay',
                        '.modal',
                        '.popover',
                        '.text-toolbar',
                        '.element-selector',
                        '.element-controls',
                        '.resize-handle',
                        '.resize-control-handle',
                        '.resize-manipulation-indicator',
                        '.sidebar',
                        '.panel',
                        '.btn',
                        '.button',
                        '.control',
                        '.menu',
                        '.dropdown',
                        '.tooltip',
                        '.pointer-events-none',
                        '[data-exclude-thumbnail="true"]'
                    ];

                    excludedSelectors.forEach(selector => {
                        try {
                            const elements = clonedDoc.querySelectorAll(selector);
                            elements.forEach(el => el.remove());
                        } catch (e) {
                            console.warn('Error removing selector:', selector, e);
                        }
                    });

                    // CORRECCIÓN THUMBNAIL: Configurar específicamente el elemento de página clonado
                    try {
                        const clonedPageElement = clonedDoc.querySelector(`#page-${pages[pageIndex].id}`);


                        if (clonedPageElement) {
                            // CORRECCIÓN THUMBNAIL: Asegurar dimensiones exactas del workspace de la BD
                            clonedPageElement.style.width = dimensions.width + 'px';
                            clonedPageElement.style.height = dimensions.height + 'px';

                            // 🔧 LAYOUT MODE: No cambiar position si es un grid (preservar layout)
                            if (!isLayoutMode) {
                                clonedPageElement.style.position = 'relative';
                            }

                            clonedPageElement.style.overflow = 'hidden';

                            // Aplicar backgrounds de la página si existen
                            if (currentPageData?.backgroundImage) {
                                clonedPageElement.style.backgroundImage = `url(${currentPageData.backgroundImage})`;
                                clonedPageElement.style.backgroundSize = 'cover';
                                clonedPageElement.style.backgroundPosition = 'center';
                                clonedPageElement.style.backgroundRepeat = 'no-repeat';
                            }

                            // 🎭 PRESERVAR FILTROS: Asegurar que los elementos con filtros mantengan sus estilos
                            const elementosConFiltros = clonedPageElement.querySelectorAll('[style*="filter"]');
                            elementosConFiltros.forEach(el => {
                                // console.log('🎭 [THUMBNAIL] Preservando filtros en elemento:', el.id);
                            });

                            // 🔧 LAYOUT MODE: Ajustes especiales para celdas en grid
                            if (isLayoutMode) {
                                // console.log('🔧 [THUMBNAIL-LAYOUT] Aplicando correcciones para grid CSS...');

                                // Asegurar que el elemento principal mantenga sus clases de grid
                                const gridClasses = clonedPageElement.className;

                                // Forzar aplicación de estilos de grid directamente
                                const gridStyle = getComputedStyle(workspaceElement);
                                clonedPageElement.style.display = 'grid';
                                clonedPageElement.style.gridTemplateColumns = gridStyle.gridTemplateColumns;
                                clonedPageElement.style.gridTemplateRows = gridStyle.gridTemplateRows;
                                clonedPageElement.style.gap = gridStyle.gap;

                                if (!isProduction) {
                                    //console.log(`🔧 [THUMBNAIL-LAYOUT] Grid aplicado: cols=${gridStyle.gridTemplateColumns}, rows=${gridStyle.gridTemplateRows}, gap=${gridStyle.gap}`);
                                }

                                const cells = clonedPageElement.querySelectorAll('[data-cell-id]');
                                if (!isProduction) {
                                    //console.log(`🔧 [THUMBNAIL-LAYOUT] Procesando ${cells.length} celdas...`);
                                }

                                cells.forEach((cell, idx) => {
                                    if (!isProduction) {
                                        // console.log(`🔧 [THUMBNAIL-LAYOUT] Procesando celda ${idx}:`, cell.id);
                                    }

                                    // Asegurar posicionamiento correcto de la celda
                                    const originalCell = workspaceElement.querySelector(`[data-cell-id="${cell.getAttribute('data-cell-id')}"]`);
                                    if (originalCell) {
                                        const originalStyle = getComputedStyle(originalCell);
                                        cell.style.gridColumn = originalStyle.gridColumn;
                                        cell.style.gridRow = originalStyle.gridRow;
                                        cell.style.position = 'relative'; // Importante para contenido interno
                                    }

                                    // Procesar imágenes dentro de cada celda
                                    const images = cell.querySelectorAll('img, [data-element-type="image"]');
                                    images.forEach(img => {
                                        if (!isProduction) {
                                            //console.log(`🔧 [THUMBNAIL-LAYOUT] Ajustando imagen en celda ${idx}:`, img);
                                        }
                                        // Las imágenes en layouts deben respetar el contenedor de la celda
                                        if (img.style.position === 'absolute') {
                                            // Mantener posicionamiento absoluto pero relativo a la celda
                                            img.style.position = 'absolute';
                                        }
                                    });
                                });
                            }

                            if (currentPageData?.backgroundColor) {
                                clonedPageElement.style.backgroundColor = currentPageData.backgroundColor;
                            }


                        }
                    } catch (e) {
                        console.error('❌ [THUMBNAIL-FIX] Error configurando elemento de página:', e);
                    }

                    // 🚀 SOLUCIÓN AVANZADA SENIOR: PRE-PROCESAMIENTO DE IMÁGENES PARA html2canvas
                    try {

                        // 1. CAPTURAR DATOS ORIGINALES DE IMÁGENES ANTES DEL CLONADO
                        const originalImageData = new Map();
                        const originalImages = workspaceElement.querySelectorAll('[data-element-type="image"] img, .workspace-image, img');

                        originalImages.forEach((img, index) => {
                            if (img.complete && img.naturalWidth > 0) {
                                const container = img.closest('[data-element-type="image"]') || img.parentElement;
                                const containerRect = container.getBoundingClientRect();
                                const imgRect = img.getBoundingClientRect();

                                originalImageData.set(img.src, {
                                    src: img.src,
                                    naturalWidth: img.naturalWidth,
                                    naturalHeight: img.naturalHeight,
                                    containerWidth: containerRect.width,
                                    containerHeight: containerRect.height,
                                    objectFit: getComputedStyle(img).objectFit || 'cover',
                                    objectPosition: getComputedStyle(img).objectPosition || 'center',
                                    crossOrigin: img.crossOrigin
                                });

                            }
                        });

                        // 2. FUNCIÓN AVANZADA PARA SIMULAR object-fit: cover MANUALMENTE
                        const simulateObjectFitCover = async (img, containerWidth, containerHeight, naturalWidth, naturalHeight) => {
                            return new Promise((resolve) => {
                                try {
                                    // Calcular las dimensiones para object-fit: cover
                                    const containerAspect = containerWidth / containerHeight;
                                    const imageAspect = naturalWidth / naturalHeight;

                                    const maxContainer = Math.max(containerWidth, containerHeight)
                                    const maxOriginal = Math.max(naturalWidth, naturalHeight)

                                    const scaleFactor = (maxOriginal / maxContainer)

                                    let cropWidth, cropHeight, cropX, cropY;
                                    let displayWidth, displayHeight;

                                    if (imageAspect > containerAspect) {
                                        // Imagen más ancha que el contenedor - recortar por los lados
                                        displayHeight = containerHeight;
                                        displayWidth = containerHeight * imageAspect;
                                        cropHeight = naturalHeight;
                                        cropWidth = naturalHeight * containerAspect;
                                        cropX = (naturalWidth - cropWidth) / 2;
                                        cropY = 0;
                                    } else {
                                        // Imagen más alta que el contenedor - recortar por arriba/abajo
                                        displayWidth = containerWidth;
                                        displayHeight = containerWidth / imageAspect;
                                        cropWidth = naturalWidth;
                                        cropHeight = naturalWidth / containerAspect;
                                        cropX = 0;
                                        cropY = (naturalHeight - cropHeight) / 2;
                                    }

                                    // Crear canvas temporal para el recorte
                                    const tempCanvas = clonedDoc.createElement('canvas');
                                    tempCanvas.width = containerWidth * scaleFactor;
                                    tempCanvas.height = containerHeight * scaleFactor;
                                    const tempCtx = tempCanvas.getContext('2d');

                                    // Crear nueva imagen para el canvas
                                    const tempImg = new Image();
                                    tempImg.crossOrigin = 'anonymous';

                                    tempImg.onload = () => {
                                        try {
                                            // Dibujar la imagen recortada simulando object-fit: cover
                                            tempCtx.drawImage(
                                                tempImg,
                                                cropX, cropY, cropWidth, cropHeight,  // Source rectangle (crop)
                                                0, 0, containerWidth * scaleFactor, containerHeight * scaleFactor  // Destination rectangle
                                            );

                                            // 🚀 Convertir a máxima calidad 4K
                                            const croppedDataUrl = tempCanvas.toDataURL('image/png', 1.0);

                                            // Aplicar la imagen pre-procesada
                                            img.src = croppedDataUrl;
                                            img.style.objectFit = 'fill'; // Cambiar a fill ya que ya está recortada
                                            img.style.objectPosition = 'center';
                                            img.style.width = '100%';
                                            img.style.height = '100%';

                                            resolve();
                                        } catch (e) {
                                            console.warn('⚠️ [ADVANCED-THUMBNAIL] Error en canvas processing:', e);
                                            resolve(); // Continuar aunque falle
                                        }
                                    };

                                    tempImg.onerror = () => {
                                        console.warn('⚠️ [ADVANCED-THUMBNAIL] Error cargando imagen temporal');
                                        resolve(); // Continuar aunque falle
                                    };

                                    tempImg.src = img.src;

                                } catch (e) {
                                    console.warn('⚠️ [ADVANCED-THUMBNAIL] Error en simulateObjectFitCover:', e);
                                    resolve();
                                }
                            });
                        };

                        // 3. PROCESAR TODAS LAS IMÁGENES EN EL DOCUMENTO CLONADO
                        const clonedImages = clonedDoc.querySelectorAll('[data-element-type="image"] img, .workspace-image, img');
                        const imageProcessingPromises = [];

                        clonedImages.forEach((img, index) => {
                            if (img.src && originalImageData.has(img.src)) {
                                const data = originalImageData.get(img.src);
                                const container = img.closest('[data-element-type="image"]') || img.parentElement;

                                // Asegurar que el contenedor tenga las dimensiones correctas
                                if (container) {
                                    container.style.overflow = 'hidden';
                                    container.style.position = 'relative';
                                }

                                // Solo procesar si la imagen necesita object-fit: cover
                                if (data.objectFit === 'cover' || img.classList.contains('object-cover') || img.classList.contains('workspace-image')) {

                                    const promise = simulateObjectFitCover(
                                        img,
                                        data.containerWidth,
                                        data.containerHeight,
                                        data.naturalWidth,
                                        data.naturalHeight
                                    );

                                    imageProcessingPromises.push(promise);
                                } else {
                                    // Para imágenes que no necesitan cover, mantener comportamiento normal
                                    img.style.width = '100%';
                                    img.style.height = '100%';
                                    img.style.objectFit = 'fill';
                                }
                            }
                        });

                        // 4. ESPERAR A QUE TODAS LAS IMÁGENAS SE PROCESEN
                        if (imageProcessingPromises.length > 0) {
                            await Promise.all(imageProcessingPromises);
                        }


                        // 5. CSS SIMPLIFICADO PARA IMÁGENES PRE-PROCESADAS
                        const style = clonedDoc.createElement('style');
                        style.textContent = `
                            /* CORRECCIÓN THUMBNAIL: Estructura del elemento de página */
                            #page-${pages[pageIndex].id} {
                                width: ${dimensions.width}px !important;
                                height: ${dimensions.height}px !important;
                                position: relative !important;
                                overflow: hidden !important;
                                box-sizing: border-box !important;
                            }
                            
                            /* 🖨️ IMÁGENES PROFESIONALES: Optimizada para PDF vs Thumbnails */
                            img {
                                width: 100% !important;
                                height: 100% !important;
                                object-fit: fill !important; /* fill porque ya están recortadas */
                                object-position: center !important;
                                display: block !important;
                                ${isPDF ? `
                                /* 🖨️ IMPRESIÓN PROFESIONAL 300 DPI */
                                image-rendering: -webkit-optimize-contrast !important;
                                image-rendering: -webkit-crisp-edges !important;
                                image-rendering: -moz-crisp-edges !important;
                                image-rendering: pixelated !important;
                                image-rendering: crisp-edges !important;
                                image-rendering: optimizeQuality !important;
                                backface-visibility: hidden !important;
                                transform: translateZ(0) scale(1) !important;
                                will-change: transform !important;
                                filter: contrast(1.02) saturate(1.05) !important;
                                ` : `
                                /* Thumbnails optimizados */
                                image-rendering: -webkit-optimize-contrast !important;
                                image-rendering: crisp-edges !important;
                                image-rendering: high-quality !important;
                                `}
                            }
                            
                            /* Contenedores de imagen */
                            [data-element-type="image"] {
                                overflow: hidden !important;
                                position: relative !important;
                            }
                            
                            [data-element-type="image"] > div {
                                width: 100% !important;
                                height: 100% !important;
                                overflow: hidden !important;
                            }
                            
                            /* Backgrounds de página */
                            #page-${pages[pageIndex].id} {
                                background-size: cover !important;
                                background-position: center !important;
                                background-repeat: no-repeat !important;
                            }
                            
                            /* 🖨️ OPTIMIZACIONES GENERALES PARA PDF DE IMPRESIÓN */
                            ${isPDF ? `
                            * {
                                -webkit-font-smoothing: antialiased !important;
                                -moz-osx-font-smoothing: grayscale !important;
                                text-rendering: optimizeLegibility !important;
                                -webkit-backface-visibility: hidden !important;
                                backface-visibility: hidden !important;
                                -webkit-transform: translateZ(0) !important;
                                transform: translateZ(0) !important;
                            }
                            
                            /* Elementos de texto de alta calidad */
                            p, span, div, h1, h2, h3, h4, h5, h6, [contenteditable] {
                                text-rendering: optimizeLegibility !important;
                                -webkit-font-smoothing: antialiased !important;
                                -moz-osx-font-smoothing: grayscale !important;
                                font-smooth: always !important;
                            }
                            
                            /* Elementos vectoriales de alta calidad */
                            svg, path, circle, rect, line {
                                shape-rendering: geometricPrecision !important;
                                vector-effect: non-scaling-stroke !important;
                            }
                            ` : ''}
                            
                            /* Resetear estilos que puedan interferir */
                            img {
                                max-width: none !important;
                                max-height: none !important;
                                border: none !important;
                                outline: none !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);


                    } catch (e) {
                        console.error('❌ [ADVANCED-THUMBNAIL] Error en pre-procesamiento avanzado:', e);

                        // Fallback: CSS básico si falla el pre-procesamiento
                        const fallbackStyle = clonedDoc.createElement('style');
                        fallbackStyle.textContent = `
                            img { object-fit: cover !important; object-position: center !important; }
                            [data-element-type="image"] { overflow: hidden !important; }
                        `;
                        clonedDoc.head.appendChild(fallbackStyle);
                    }

                }
            };


            // 🖨️ CAPTURA PROFESIONAL: html2canvas con manejo de memoria optimizado
            let canvas = null;
            let dataUrl = '';

            try {
                if (!isProduction) {
                    // console.log('🎨 [HTML2CANVAS] Iniciando captura:', captureOptions);
                }

                canvas = await html2canvas(workspaceElement, captureOptions);

                // 🖨️ POST-PROCESAMIENTO para PDF de impresión profesional
                if (isPDF && canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Mejorar el contraste y nitidez para impresión
                        ctx.imageSmoothingEnabled = false; // Desactivar suavizado para máxima nitidez
                        ctx.imageSmoothingQuality = 'high';

                        // Aplicar filtros de mejora de calidad si es necesario
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        // Ligero aumento de contraste para impresión
                        for (let i = 0; i < data.length; i += 4) {
                            // Ajuste sutil de contraste (factor 1.05)
                            data[i] = Math.min(255, data[i] * 1.05);     // R
                            data[i + 1] = Math.min(255, data[i + 1] * 1.05); // G
                            data[i + 2] = Math.min(255, data[i + 2] * 1.05); // B
                            // Alpha se mantiene igual (data[i + 3])
                        }

                        ctx.putImageData(imageData, 0, 0);
                    }
                }

                if (!canvas) {
                    throw new Error('html2canvas no devolvió un canvas válido para el elemento de página');
                }

                // CORRECCIÓN THUMBNAIL: Verificar que el canvas tenga las dimensiones correctas del workspace
                if (canvas.width === 0 || canvas.height === 0) {
                    throw new Error('Canvas del elemento de página tiene dimensiones inválidas');
                }

                // Get canvas preset dimensions
                const { height, width, dpi } = projectData.canvas_preset;
                const maxSizeMm = Math.max(height, width);
                const maxSizePx = Math.round((maxSizeMm * dpi) / 25.4);

                // Create temporary canvas for resizing
                const tempCanvas = document.createElement('canvas');
                const maxDimension = Math.max(canvas.width, canvas.height);
                const scale = maxSizePx / maxDimension;
                tempCanvas.width = Math.round(canvas.width * scale);
                tempCanvas.height = Math.round(canvas.height * scale);

                // Draw and resize image
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

                // Convert to dataURL with appropriate quality
                dataUrl = tempCanvas.toDataURL('image/png', 1);

                if (!isProduction) {
                    //continue producction
                }

            } catch (error) {
                console.error('❌ [ERROR-CAPTURA]:', error);
                throw error;
            } finally {
                // 🚀 LIMPIEZA CRÍTICA: Liberar memoria del canvas
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    canvas.width = 0;
                    canvas.height = 0;
                    canvas = null;
                }

                // 🚀 FORZAR GARBAGE COLLECTION si está disponible  
                if (isProduction && window.gc) {
                    try {
                        window.gc();
                    } catch (e) {
                        // Ignorar si gc no está disponible
                    }
                }
            }

            if (!dataUrl || dataUrl === 'data:,') {
                throw new Error('No se pudo generar dataURL del elemento de página');
            }



            return isPDF ? canvas : dataUrl; // Retornar canvas para PDF, dataURL para thumbnail

        } catch (error) {
            console.error('❌ [THUMBNAIL-FIX] Error capturando elemento de página:', error);

            // Fallback: crear thumbnail con las dimensiones exactas del workspace de la BD
            try {
                const canvas = document.createElement('canvas');
                // Usar el scaleFactor ya definido arriba (4x para ambos casos)
                canvas.width = dimensions.width * scaleFactor;
                canvas.height = dimensions.height * scaleFactor;
                const ctx = canvas.getContext('2d');

                // CORRECCIÓN THUMBNAIL: Aplicar background del elemento de página en fallback
                const bgColor = workspaceBackground || currentPageData?.backgroundColor || '#ffffff';
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Texto indicativo
                ctx.fillStyle = bgColor === '#ffffff' || bgColor.includes('white') ? '#374151' : '#666666';
                ctx.font = `${14 * scaleFactor}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('Página ' + (pageIndex + 1), canvas.width / 2, canvas.height / 2);



                if (options.type === 'pdf') {
                    return canvas;
                } else {
                    const fallbackDataUrl = canvas.toDataURL('image/png', 1.0); // 🚀 Máxima calidad
                    return fallbackDataUrl;
                }
            } catch (fallbackError) {
                return null;
            }
        }
    }, [currentPage, pages]);


    // Actualizar dimensiones cuando cambie el preset o el tamaño del workspace
    useEffect(() => {
        const dimensions = getWorkspaceDimensions();
        setWorkspaceDimensions(dimensions);
    }, [presetData, workspaceSize]);

    // Actualizar dimensiones cuando cambie el tamaño de la ventana
    useEffect(() => {
        const handleResize = () => {
            const dimensions = getWorkspaceDimensions();
            setWorkspaceDimensions(dimensions);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [presetData, workspaceSize]);


    // useEffect para verificar imagen de fondo (solo cuando cambia la página o la imagen)
    useEffect(() => {
        const currentPageData = pages[currentPage];

        if (currentPageData?.backgroundImage) {
            // Verificar si la imagen existe mediante fetch (solo una vez por imagen)
            fetch(currentPageData.backgroundImage, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        //console.log('✅ [WORKSPACE] Imagen existe en el servidor');
                    } else {
                        console.error('❌ [WORKSPACE] Imagen NO existe en el servidor. Status:', response.status);
                    }
                })
                .catch(error => {
                    console.error('❌ [WORKSPACE] Error verificando imagen:', error);
                });
        }
    }, [currentPage, pages[currentPage]?.backgroundImage]);

    // 🚀 Sistema de guardado inteligente en segundo plano
    useEffect(() => {
        if (!projectData?.id || pages.length === 0) return;

        let autoSaveTimer;
        let lastActivityTime = Date.now();
        let hasUnsavedChanges = false;

        // Función para detectar cambios en el proyecto
        const detectChanges = () => {
            hasUnsavedChanges = true;
            lastActivityTime = Date.now();
        };

        // Función de guardado silencioso en segundo plano
        const performSilentAutoSave = async () => {
            if (!hasUnsavedChanges) return;

            try {

                // Actualizar estado de guardado
                setAutoSave(prev => ({ ...prev, saveStatus: 'saving' }));

                // Realizar guardado usando la API directamente (sin depender de autoSaveToDatabase)
                const response = await fetch(`/api/projects/${projectData.id}/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        pages: pages,
                        force: false // Guardado ligero
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Marcar como guardado
                    hasUnsavedChanges = false;
                    setAutoSaveState(prev => ({
                        ...prev,
                        saveStatus: 'saved',
                        lastAutoSaved: new Date(),
                        hasUnsavedChanges: false
                    }));

                } else {
                    throw new Error('Guardado falló');
                }

            } catch (error) {
                console.error('❌ [AUTO-SAVE] Error en guardado silencioso:', error);
                setAutoSaveState(prev => ({
                    ...prev,
                    saveStatus: 'error',
                    saveError: error.message
                }));
            }
        };

        // Configurar timer de guardado automático (cada 3 minutos si hay cambios)
        const startAutoSaveTimer = () => {
            autoSaveTimer = setInterval(() => {
                const timeSinceLastActivity = Date.now() - lastActivityTime;

                // Solo guardar si:
                // 1. Hay cambios sin guardar
                // 2. Han pasado al menos 1 minuto desde la última actividad (usuario no está editando activamente)
                // 3. No hay un guardado en progreso
                if (hasUnsavedChanges &&
                    timeSinceLastActivity > 60000) {

                    performSilentAutoSave();
                }
            }, 3 * 60 * 1000); // 3 minutos
        };

        // Detectar cambios en pages, currentPage, o elementos
        const pagesString = JSON.stringify(pages);
        const currentPageData = pages[currentPage];

        // Marcar que hay cambios cuando se detecten
        detectChanges();

        // Iniciar el timer de guardado automático
        startAutoSaveTimer();

        // Cleanup
        return () => {
            if (autoSaveTimer) {
                clearInterval(autoSaveTimer);
            }
        };
    }, [pages, currentPage, projectData?.id]); // Removemos autoSaveToDatabase para evitar error de inicialización

    // Detectar cambios específicos en elementos de la página actual
    useEffect(() => {
        if (!pages[currentPage]) return;

        const currentPageElements = pages[currentPage].cells?.flatMap(cell => cell.elements) || [];
        const elementsString = JSON.stringify(currentPageElements);

        // Actualizar estado de cambios sin guardar
        setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: true }));

    }, [pages[currentPage]?.cells, currentPage]);

    // Añade estos estados al principio del componente EditorLibro
    const [textToolbarVisible, setTextToolbarVisible] = useState(false);
    const [textEditingOptions, setTextEditingOptions] = useState({
        elementId: null,
        cellId: null,
    });
    const [isBookPreviewOpen, setIsBookPreviewOpen] = useState(false);
    const [showProgressRecovery, setShowProgressRecovery] = useState(false);
    const [savedProgress, setSavedProgress] = useState(null);

    // 🚀 NUEVOS ESTADOS: Para animación de carga del modal de álbum
    const [albumLoadingState, setAlbumLoadingState] = useState({
        isLoading: false,
        loadedImages: 0,
        totalImages: 0,
        message: ''
    });

    // 🎭 NUEVO ESTADO: Modal de preparación con experiencia única
    const [albumPreparationModal, setAlbumPreparationModal] = useState({
        isOpen: false,
        phase: 'preparing', // 'preparing', 'processing', 'finalizing', 'ready'
        progress: 0,
        message: 'Iniciando experiencia de álbum...',
        subMessage: 'Preparando tu vista previa personalizada'
    });

    // Estado para el input de carga de imágenes
    const imageInputRef = useRef(null);

    // Función para añadir un elemento de imagen al lienzo
    const addImageElement = (imageUrl) => {
        const targetCell = selectedCell || pages[currentPage]?.cells[0]?.id;
        if (!targetCell) return;

        const newElement = {
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: imageUrl,
            position: { x: 0.1, y: 0.1 },
            size: { width: 0.3, height: 0.3 },
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
            mask: 'none',
            zIndex: (pages[currentPage].cells.find(cell => cell.id === targetCell)?.elements?.length || 0) + 1,
        };

        addElementToCell(targetCell, newElement);
        toast.success('Imagen añadida correctamente');

        // NO recargar imágenes del proyecto aquí para evitar re-renders innecesarios
    };

    // Función para cargar las imágenes del proyecto con throttling (ULTRA OPTIMIZADA)
    const loadProjectImages = useCallback(
        debounce(async (forceRefresh = false) => {
            if (!projectData?.id) return;

            // 🚀 OPTIMIZACIÓN: Verificar cache primero
            const cachedImages = imageCache.get(projectData.id);
            if (!forceRefresh && cachedImages && cachedImages.length > 0) {
                if (projectImages.length === 0) {
                    setProjectImages(cachedImages);
                }
                return;
            }

            // 🚀 OPTIMIZACIÓN: Evitar múltiples cargas simultáneas
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }

            if (projectImagesLoading && !forceRefresh) {
                return;
            }

            setProjectImagesLoading(true);

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const response = await fetch(`/api/canvas/projects/${projectData.id}/images`, {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();

                if (result.success) {
                    const images = result.images || [];

                    // 🚀 OPTIMIZACIÓN: Solo actualizar si hay cambios reales
                    const currentImagesStr = JSON.stringify(projectImages);
                    const newImagesStr = JSON.stringify(images);

                    if (currentImagesStr !== newImagesStr) {
                        setProjectImages(images);

                        // 🚀 OPTIMIZACIÓN: Actualizar cache de forma eficiente
                        setImageCache(prevCache => {
                            const newCache = new Map(prevCache);
                            newCache.set(projectData.id, images);

                            // Limpiar cache viejo si hay más de 5 proyectos
                            if (newCache.size > 5) {
                                const oldestKey = newCache.keys().next().value;
                                newCache.delete(oldestKey);
                            }

                            return newCache;
                        });
                    }
                } else {
                    console.error('Error cargando imágenes:', result.message);
                    toast.error('Error cargando galería de imágenes');
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn('⚠️ Carga de imágenes cancelada por timeout');
                } else {
                    console.error('Error cargando imágenes del proyecto:', error);
                    toast.error('Error de conexión al cargar imágenes');
                }
            } finally {
                setProjectImagesLoading(false);
            }
        }, 200), // 200ms debounce para evitar spam
        [projectData?.id, imageCache, projectImages, projectImagesLoading]
    );

    // Función para manejar la carga de imágenes (OPTIMIZADA)
    const handleImageUpload = useCallback(async (event) => {
        console.log('aqui entro ')
        const file = event.target.files[0];
        if (!file || !projectData?.id) return;

        // 🚀 OPTIMIZACIÓN: Mostrar feedback inmediato
        const loadingToast = toast.loading('Subiendo imagen...', {
            description: 'Procesando imagen, esto puede tomar unos segundos'
        });

        // 🚀 OPTIMIZACIÓN: Crear imagen local optimizada inmediatamente
        const imageUrl = URL.createObjectURL(file);
        const tempImage = {
            id: `temp-${Date.now()}`,
            filename: file.name,
            url: imageUrl,
            thumbnail_url: imageUrl,
            has_thumbnail: false,
            size: file.size,
            last_modified: Date.now() / 1000,
            created_at: new Date().toISOString(),
            isTemporary: true
        };

        // 🚀 OPTIMIZACIÓN: Añadir imagen temporalmente al estado para feedback inmediato
        setProjectImages(prev => [tempImage, ...prev]);

        // 🚀 OPTIMIZACIÓN: Añadir al canvas inmediatamente para mejor UX
        addImageElement(imageUrl);

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

        const formData = new FormData();
        // formData.append('image', file);
        formData.append('image', fileToUpload);
        formData.append('projectId', projectData.id);

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
                // 🚀 OPTIMIZACIÓN: Reemplazar imagen temporal con la real
                const finalImage = {
                    id: result.id || Date.now(),
                    // filename: file.name,
                    filename: fileToUpload.name,
                    url: result.url,
                    thumbnail_url: result.thumbnail_url || result.url,
                    has_thumbnail: result.has_thumbnail || false,
                    // size: file.size,
                    size: fileToUpload.size,
                    last_modified: Date.now() / 1000,
                    created_at: new Date().toISOString()
                };

                setProjectImages(prev => [
                    finalImage,
                    ...prev.filter(img => img.id !== tempImage.id)
                ]);

                // 🚀 OPTIMIZACIÓN: Actualizar el elemento en el canvas con la URL final
                setTimeout(() => {
                    setPages(prevPages => {
                        const updatedPages = [...prevPages];
                        const currentPageData = updatedPages[currentPage];

                        // Buscar y actualizar el elemento con la imagen temporal
                        currentPageData.cells.forEach(cell => {
                            cell.elements.forEach(element => {
                                if (element.type === 'image' && element.content === imageUrl) {
                                    element.content = result.url;
                                }
                            });
                        });

                        return updatedPages;
                    });
                }, 100);

                toast.dismiss(loadingToast);
                toast.success(result.has_thumbnail ?
                    'Imagen subida y optimizada correctamente' :
                    'Imagen subida correctamente'
                );

                // 🚀 OPTIMIZACIÓN: Refresh de galería en background sin bloquear UI
                setTimeout(() => {
                    loadProjectImages(true);
                }, 2000);
            } else {
                // 🚀 OPTIMIZACIÓN: Limpiar imagen temporal en caso de error
                setProjectImages(prev => prev.filter(img => img.id !== tempImage.id));
                URL.revokeObjectURL(imageUrl);

                toast.dismiss(loadingToast);
                toast.error(result.message || 'Error al subir la imagen');
            }
        } catch (error) {
            console.error('Error subiendo la imagen:', error);

            // 🚀 OPTIMIZACIÓN: Limpiar imagen temporal en caso de error
            setProjectImages(prev => prev.filter(img => img.id !== tempImage.id));
            URL.revokeObjectURL(imageUrl);

            toast.dismiss(loadingToast);
            toast.error('Error de red al subir la imagen');
        }
    }, [projectData?.id, currentPage, addImageElement, loadProjectImages]);

    // Cargar imágenes cuando se carga el proyecto (con debounce)
    useEffect(() => {
        if (projectData?.id) {
            // Primero verificar si tenemos imágenes en cache
            const cachedImages = imageCache.get(projectData.id);
            if (cachedImages && cachedImages.length > 0) {
                setProjectImages(cachedImages);
                return;
            }

            loadingTimeoutRef.current = setTimeout(() => {
                loadProjectImages(false); // No forzar refresh inicial
            }, 150); // Pequeño delay para evitar múltiples cargas

            return () => {
                if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                }
            };
        }
    }, [projectData?.id, imageCache]);

    // Cleanup effect para evitar memory leaks
    useEffect(() => {
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, []);

    // 🚀 Añadir elemento sin seleccionarlo automáticamente (para galería de imágenes)
    const addElementToCellWithoutSelection = (cellId, element) => {

        // 🚀 PROTECCIÓN: Asegurar que tenemos páginas válidas
        if (!pages || pages.length === 0 || !pages[currentPage]) {
            console.error('❌ [ADD-IMAGE] No hay páginas válidas para agregar imagen');
            return;
        }

        // 🚀 PROTECCIÓN: Crear una copia profunda para evitar mutaciones
        const updatedPages = JSON.parse(JSON.stringify(pages));

        // Encontrar y actualizar solo la celda correcta
        let cellFound = false;
        for (let i = 0; i < updatedPages[currentPage].cells.length; i++) {
            if (updatedPages[currentPage].cells[i].id === cellId) {
                updatedPages[currentPage].cells[i].elements.push(element);
                cellFound = true;
                break;
            }
        }

        if (!cellFound) {
            console.error('❌ [ADD-IMAGE] Celda no encontrada:', cellId);
            return;
        }

        // 🚀 PROTECCIÓN: Usar setTimeout para evitar conflictos de estado
        setTimeout(() => {
            updatePages(updatedPages);
        }, 0);
    };

    // Función para añadir imagen desde la galería
    const addImageFromGallery = useCallback((imageUrl) => {

        // 🚀 PROTECCIÓN CRÍTICA: Bloquear temporalmente el sistema de recuperación
        const originalProgress = hasInitializedProgress;
        setHasInitializedProgress(true);

        // 🚀 PROTECCIÓN: No cambiar de tab si ya estamos en 'images'
        const wasInImagesTab = activeTab === 'images';

        const targetCell = selectedCell || pages[currentPage]?.cells[0]?.id;
        if (!targetCell) {
            console.error('❌ [ADD-FROM-GALLERY] No hay celda disponible');
            toast.error('No hay celda disponible para agregar la imagen');
            setHasInitializedProgress(originalProgress); // Restaurar estado
            return;
        }

        // 🚀 PROTECCIÓN: Validar que la imagen URL es válida
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.error('❌ [ADD-FROM-GALLERY] URL de imagen inválida');
            toast.error('URL de imagen no válida');
            setHasInitializedProgress(originalProgress); // Restaurar estado
            return;
        }

        // 🚀 PROTECCIÓN: Crear una copia profunda de las páginas actuales ANTES de modificar
        const currentPagesSnapshot = JSON.parse(JSON.stringify(pages));

        const newElement = {
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: imageUrl,
            position: { x: 0.1, y: 0.1 },
            size: { width: 0.3, height: 0.3 },
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
            mask: 'none',
            zIndex: (currentPagesSnapshot[currentPage].cells.find(cell => cell.id === targetCell)?.elements?.length || 0) + 1,
        };


        // 🚀 PROTECCIÓN: Usar setTimeout múltiples para evitar conflictos de estado
        setTimeout(() => {
            // Primer paso: Agregar elemento sin seleccionarlo
            addElementToCellWithoutSelection(targetCell, newElement);

            setTimeout(() => {
                // Segundo paso: Restaurar tab si es necesario
                if (wasInImagesTab) {
                    setActiveTab('images');
                }

                setTimeout(() => {
                    // Tercer paso: Restaurar protección y mostrar éxito
                    setHasInitializedProgress(originalProgress);
                    toast.success('✅ Imagen añadida desde la galería');
                }, 50);
            }, 50);
        }, 50);
    }, [activeTab, selectedCell, pages, currentPage, hasInitializedProgress, addElementToCellWithoutSelection]);



    // �️ FUNCIÓN PARA PROCESAR Y GUARDAR IMÁGENES EN EL SERVIDOR
    const processAndSaveImages = useCallback(async (pages, projectId) => {
        const processedPages = [];
        const imagesToUpload = [];

        for (const page of pages) {
            const processedPage = { ...page };

            if (page.cells) {
                processedPage.cells = [];

                for (const cell of page.cells) {
                    const processedCell = { ...cell };

                    if (cell.elements) {
                        processedCell.elements = [];

                        for (const element of cell.elements) {
                            if (element.type === 'image' && element.content?.startsWith('data:image/')) {
                                // Detectar imagen en base64
                                const imageId = `${element.id}_${Date.now()}`;
                                const filename = `${imageId}.png`;

                                // Extraer el tipo de imagen y los datos
                                const matches = element.content.match(/^data:image\/([^;]+);base64,(.+)$/);
                                if (matches) {
                                    const imageType = matches[1];
                                    const imageData = matches[2];
                                    const extension = imageType === 'jpeg' ? 'jpg' : imageType;
                                    const finalFilename = `${imageId}.${extension}`;

                                    // Agregar a la lista de imágenes para subir
                                    imagesToUpload.push({
                                        filename: finalFilename,
                                        data: imageData,
                                        type: imageType,
                                        elementId: element.id
                                    });

                                    // Reemplazar el contenido por una ruta temporal (se actualizará después)
                                    processedCell.elements.push({
                                        ...element,
                                        content: element.content, // Mantener base64 temporalmente
                                        _wasBase64: true,
                                        _originalSize: element.content.length,
                                        _elementId: element.id // Para mapear después
                                    });

                                } else {
                                    // Si no coincide el patrón, mantener como está
                                    processedCell.elements.push(element);
                                }
                            } else {
                                // Elemento que no es imagen base64, mantener como está
                                processedCell.elements.push(element);
                            }
                        }
                    }

                    processedPage.cells.push(processedCell);
                }
            }

            processedPages.push(processedPage);
        }

        // 🚀 SUBIR TODAS LAS IMÁGENES AL SERVIDOR
        if (imagesToUpload.length > 0) {

            try {
                const uploadResponse = await fetch(`/api/canvas/projects/${projectId}/upload-images`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        images: imagesToUpload
                    })
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();

                    // 🔄 ACTUALIZAR LAS URLs CON LAS RESPUESTAS DEL SERVIDOR
                    if (uploadResult.uploadedImages) {
                        // Crear mapa de elementId -> URL del servidor
                        const elementToUrlMap = new Map();
                        uploadResult.uploadedImages.forEach(uploadedImg => {
                            elementToUrlMap.set(uploadedImg.elementId, uploadedImg.url);
                        });

                        // Actualizar las páginas procesadas con las URLs del servidor
                        for (const page of processedPages) {
                            if (page.cells) {
                                for (const cell of page.cells) {
                                    if (cell.elements) {
                                        for (const element of cell.elements) {
                                            if (element._wasBase64 && element._elementId && elementToUrlMap.has(element._elementId)) {
                                                element.content = elementToUrlMap.get(element._elementId);
                                                // Limpiar propiedades temporales
                                                delete element._elementId;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    const errorData = await uploadResponse.json().catch(() => ({ message: 'Error desconocido en upload' }));
                    console.error('❌ [IMAGE-UPLOAD] Error subiendo imágenes:', errorData);

                    // En caso de error, conservar las imágenes base64 originales
                    return pages; // Retornar páginas originales sin procesar
                }
            } catch (uploadError) {
                console.error('❌ [IMAGE-UPLOAD] Error de red subiendo imágenes:', uploadError);
                return pages; // Retornar páginas originales sin procesar
            }
        }

        return processedPages;
    }, []);

    // 💾 SISTEMA DE GUARDADO AUTOMÁTICO OPTIMIZADO - Con procesamiento de imágenes
    const autoSaveToDatabase = useCallback(async (pagesToSave = pages, force = false) => {
        if (!projectData?.id || (!force && pagesToSave.length === 0)) return;

        try {

            // 🖼️ PASO 1: Procesar y subir imágenes al servidor
            const optimizedPages = await processAndSaveImages(pagesToSave, projectData.id);

            // CORRECCIÓN: Preparar datos según la estructura que espera ProjectSaveController
            const designData = {
                pages: optimizedPages,
                currentPage: currentPage,
                workspaceDimensions: workspaceDimensions,
                workspaceSize: workspaceSize,
                selectedElement: selectedElement,
                selectedCell: selectedCell,
                history: history.slice(-5), // Mantener más historial ya que las imágenes están optimizadas
                historyIndex: Math.min(historyIndex, 4),
                timestamp: new Date().toISOString(),
                version: '2.0', // Nueva versión con imágenes en servidor
                project: {
                    id: projectData.id,
                    name: itemData?.name || 'Álbum Personalizado',
                    item_id: itemData?.id,
                    preset_id: presetData?.id
                }
            };

            // CORRECCIÓN: Enviar thumbnails base64 al backend para que los convierta a archivos
            const requestData = {
                design_data: designData,
                thumbnails: pageThumbnails // Enviar thumbnails base64 para conversión
            };

            // 📊 Calcular tamaño final (debería ser mucho menor ahora)
            const finalDataSize = JSON.stringify(requestData).length;
            const finalDataSizeMB = finalDataSize / (1024 * 1024);


            // AQUI AGRWEGAR
            // 🚀 Enviar datos optimizados (sin verificación de tamaño extrema ya que están optimizados)
            const response = await fetch(`/api/canvas/projects/${projectData.id}/save-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();

                // Limpiar localStorage después de guardar en BD
                const storageKey = `editor_progress_project_${projectData.id}`;
                localStorage.removeItem(storageKey);

                // Limpiar cambios de todas las páginas que se guardaron exitosamente
                setPageChanges(prev => {
                    const newMap = new Map(prev);
                    // Si guardamos todas las páginas (force = true), limpiar todos los cambios
                    if (force) {
                        newMap.clear();
                    } else {
                        // Limpiar solo la página actual
                        newMap.delete(currentPage);
                    }
                    return newMap;
                });

                return true;
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                console.error('❌ [AUTO-SAVE] Error guardando en BD:', errorData);
                return false;
            }

        } catch (error) {
            console.error('❌ [AUTO-SAVE] Error en auto-save con procesamiento de imágenes:', error);
            return false;
        }
    }, [pages, currentPage, workspaceDimensions, workspaceSize, projectData?.id, itemData?.name, itemData?.id, presetData?.id, processAndSaveImages]); // ⚡ OPTIMIZACIÓN: Reducidas dependencias innecesarias

    // 💾 ⚡ OPTIMIZACIÓN: Auto-save menos agresivo cada 10 minutos (reducido impacto)
    useEffect(() => {
        if (!projectData?.id) return;

        const backupAutoSaveInterval = setInterval(() => {
            if (pages.length > 0) {
                autoSaveToDatabase(pages, false);
            }
        }, 10 * 60 * 1000); // ⚡ 10 minutos = 600,000ms (menos agresivo)

        return () => clearInterval(backupAutoSaveInterval);
    }, [autoSaveToDatabase, pages, projectData?.id]);

    // 🚫 DESHABILITADO: Auto-save automático cuando cambian las páginas
    // Ahora solo guardado manual + respaldo cada 5 minutos

    // �💾 FUNCIÓN DE GUARDADO MANUAL
    const saveProgressManually = useCallback(async () => {
        if (!projectData?.id || pages.length === 0) {
            toast.error('No hay datos para guardar');
            return false;
        }

        try {
            // �💾 PASO 3: Guardar el proyecto
            const success = await autoSaveToDatabase(pages, true); // force = true para guardado manual

            if (success) {
                toast.success('Progreso guardado exitosamente');
                return true;
            } else {
                toast.error('Error al guardar el progreso');
                return false;
            }
        } catch (error) {
            console.error('❌ [SAVE] Error al guardar el progreso:', error);
            toast.error('Error al guardar el progreso');
            return false;
        }
    }, [autoSaveToDatabase, pages, projectData?.id, workspaceDimensions, presetData]);

    // Función simplificada para guardado desde la cola (con menos dependencias)
    const saveFromQueue = useCallback(async (pagesToSave) => {
        // console.log('💾 [QUEUE-SAVE] Iniciando guardado desde cola...');


        if (!projectData?.id) {
            error('❌ [QUEUE-SAVE] No hay project ID');
            return false;
        }

        if (!pagesToSave || pagesToSave.length === 0) {
            error('❌ [QUEUE-SAVE] No hay páginas para guardar');
            return false;
        }

        try {
            // Preparar datos básicos para el guardado
            const designData = {
                pages: pagesToSave,
                currentPage: currentPage,
                workspaceDimensions: workspaceDimensions,
                timestamp: new Date().toISOString(),
                version: '2.0'
            };

            const requestData = {
                design_data: designData,
            };

            log('📤 [QUEUE-SAVE] Enviando petición al servidor...');

            const response = await fetch(`/api/canvas/projects/${projectData.id}/save-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            log('📥 [QUEUE-SAVE] Respuesta del servidor:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                log('✅ [QUEUE-SAVE] Guardado exitoso desde cola:', result);
                return true;
            } else {
                const errorText = await response.text();
                error('❌ [QUEUE-SAVE] Error en respuesta del servidor:', response.status, errorText);
                return false;
            }
        } catch (error) {
            error('❌ [QUEUE-SAVE] Error guardando desde cola:', error);
            return false;
        }
    }, [projectData?.id, currentPage, workspaceDimensions]);

    // Función para procesar la cola de guardado en segundo plano (versión corregida)
    const processSaveQueue = useCallback(async () => {


        if (isProcessingQueue) {
            return;
        }

        if (saveQueue.length === 0) {
            return;
        }

        setIsProcessingQueue(true);

        try {
            // Capturar la cola actual ANTES de limpiarla
            const currentQueue = saveQueue.slice();

            // Ahora sí limpiar la cola
            setSaveQueue([]);

            for (const saveTask of currentQueue) {

                const success = await saveFromQueue(saveTask.pages);

                if (success) {
                    // Marcar la página como guardada
                    setPageChanges(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(saveTask.pageIndex);
                        return newMap;
                    });
                } else {
                    console.error('❌ [SAVE-QUEUE] Error guardando página:', saveTask.pageIndex);
                    // En caso de error, re-agregar a la cola para reintentar
                    setSaveQueue(prev => [...prev, saveTask]);
                }
            }

        } catch (error) {
            console.error('❌ [SAVE-QUEUE] Error procesando cola:', error);
        } finally {
            setIsProcessingQueue(false);
        }
    }, [isProcessingQueue, saveQueue, saveFromQueue]);

    // Sistema simplificado de procesamiento automático
    useEffect(() => {


        if (saveQueue.length > 0 && !isProcessingQueue) {

            // Pequeño delay para evitar condiciones de carrera
            setTimeout(() => {
                processSaveQueue();
            }, 100);
        }
    }, [saveQueue.length, isProcessingQueue, processSaveQueue]);

    // Debug: Efecto para monitorear cambios en la cola
    useEffect(() => {
        //save queue
    }, [saveQueue, isProcessingQueue]);

    // Función para agregar una página a la cola de guardado
    const addToSaveQueue = useCallback((pageIndex, pagesData) => {

        // Usar función de estado para verificar cambios sin dependencias
        setPageChanges(currentPageChanges => {
            const changedPages = Array.from(currentPageChanges.keys());

            if (!currentPageChanges.has(pageIndex)) {
                return currentPageChanges; // Solo guardar si hay cambios
            }


            setSaveQueue(prev => {

                // Evitar duplicados
                const existingIndex = prev.findIndex(item => item.pageIndex === pageIndex);
                if (existingIndex !== -1) {
                    // Actualizar el elemento existente
                    const newQueue = [...prev];
                    newQueue[existingIndex] = { pageIndex, pages: pagesData, timestamp: Date.now() };
                    return newQueue;
                } else {
                    // Agregar nuevo elemento
                    const newQueue = [...prev, { pageIndex, pages: pagesData, timestamp: Date.now() }];
                    return newQueue;
                }
            });

            return currentPageChanges; // Retornar sin cambios
        });
    }, []);

    // Función para cambiar de página con guardado automático (optimizada para VPS)
    const handlePageChange = useCallback(async (newPageIndex) => {
        log('🔄 [PAGE-CHANGE] Iniciando cambio de página de', currentPage, 'a', newPageIndex);

        if (newPageIndex === currentPage) {
            log('⚠️ [PAGE-CHANGE] Misma página, no se hace nada');
            return; // No hacer nada si es la misma página
        }


        // Comportamiento original para local (más detallado)
        // Verificar si la página actual tiene cambios sin guardar usando función de estado
        setPageChanges(currentPageChanges => {
            log('🔍 [PAGE-CHANGE] Verificando cambios en página actual:', currentPage);
            const changedPages = Array.from(currentPageChanges.keys());
            log('🔍 [PAGE-CHANGE] Páginas con cambios:', changedPages.join(', ') || 'ninguna');

            if (currentPageChanges.has(currentPage)) {
                log('💾 [PAGE-CHANGE] ✅ Página actual tiene cambios, guardando antes del cambio:', currentPage);

                // Agregar la página actual a la cola de guardado
                addToSaveQueue(currentPage, pages);
            } else {
                log('ℹ️ [PAGE-CHANGE] No hay cambios en la página actual:', currentPage);
            }
            return currentPageChanges; // Retornar sin cambios
        });

        // Cambiar directamente a la nueva página
        setCurrentPage(newPageIndex);
        log('📄 [PAGE-CHANGE] ✅ Página cambiada a:', newPageIndex);

    }, [currentPage, pages, addToSaveQueue]);

    // Función para obtener el storage key único basado en el proyecto
    const getStorageKey = () => {
        return `editor_progress_project_${projectData?.id}`;
    };

    // Función para verificar y cargar progreso guardado al inicializar
    const checkAndLoadSavedProgress = useCallback(async () => {
        if (!projectData?.id) return;

        // 🚀 PROTECCIÓN: No ejecutar si ya hay elementos en el workspace
        const hasWorkspaceContent = pages.some(page =>
            page.cells?.some(cell =>
                cell.elements?.length > 0
            )
        );

        if (hasWorkspaceContent) {
            return;
        }

        try {
            // 1. Verificar localStorage primero
            const localProgress = autoSave.loadFromLocalStorage();

            // 2. Verificar base de datos
            const response = await fetch(`/api/canvas/projects/${projectData.id}/load-progress`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            let serverProgress = null;
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data?.design_data) {
                    serverProgress = result.data;
                }
            }

            // Determinar qué progreso usar (el más reciente)
            let progressToUse = null;

            if (localProgress && serverProgress) {
                const localTime = new Date(localProgress.savedAt).getTime();
                const serverTime = new Date(serverProgress.saved_at).getTime();
                progressToUse = localTime > serverTime ? localProgress : serverProgress;
            } else if (localProgress) {
                progressToUse = localProgress;
            } else if (serverProgress) {
                progressToUse = serverProgress;
            }

            // 🚀 CARGA AUTOMÁTICA: Cargar automáticamente el progreso más reciente sin modal
            if (progressToUse &&
                (progressToUse.pages?.length > 0 || progressToUse.design_data?.pages?.length > 0)) {

                // Verificar si el progreso es realmente más nuevo que el workspace actual
                const progressTime = new Date(progressToUse.savedAt || progressToUse.saved_at).getTime();
                const now = Date.now();
                const timeDiff = now - progressTime;

                // Solo cargar si el progreso es de los últimos 30 minutos
                if (timeDiff < 30 * 60 * 1000) {
                    //console.log('🔄 [AUTO-RECOVERY] Cargando automáticamente el progreso más reciente');
                    toast.info('🔄 Cargando progreso guardado automáticamente...');
                    // Cargar automáticamente sin mostrar modal
                    handleLoadProgress(progressToUse);
                } else {
                    //console.log('📅 [RECOVERY] Progreso muy antiguo, ignorando automáticamente');
                }
            }

        } catch (error) {
            console.error('❌ [RECOVERY] Error verificando progreso guardado:', error);
        }
    }, [projectData?.id, autoSave, pages]);

    // Cargar progreso guardado
    const handleLoadProgress = useCallback(async (progress) => {
        try {

            let pagesToLoad = [];

            // Determinar el formato del progreso
            if (progress.pages) {
                // Formato localStorage
                pagesToLoad = progress.pages;
            } else if (progress.design_data?.pages) {
                // Formato base de datos
                pagesToLoad = progress.design_data.pages;
            }

            if (pagesToLoad.length > 0) {
                setPages(pagesToLoad);

                // Actualizar el historial
                const newHistory = [JSON.stringify(pagesToLoad)];
                setHistory(newHistory);
                setHistoryIndex(0);

                // Regenerar thumbnails para las páginas cargadas
                setTimeout(() => {
                    setPageThumbnails({});
                }, 100);

                toast.success('✅ Progreso cargado exitosamente');

                // Cerrar el modal automáticamente si estaba abierto
                setShowProgressRecovery(false);
            }

        } catch (error) {
            console.error('❌ [RECOVERY] Error cargando progreso:', error);
            toast.error('Error al cargar el progreso guardado');
        }
    }, [setPages, setHistory, setHistoryIndex, setPageThumbnails]);

    // Efecto para inicializar páginas cuando se cargan los datos del proyecto
    useEffect(() => {
        if (projectData && itemData && presetData) {
            // Si no hay páginas iniciales o initialProject, crear desde el preset
            if (!initialProject?.pages || initialProject.pages.length === 0) {
                createPagesFromPreset(presetData, itemData);
            }
            // Las páginas ya se configuran en el otro useEffect que maneja initialProject
        }
    }, [projectData, itemData, presetData, initialProject]);

    // Verificar progreso guardado cuando se cargan los datos del proyecto
    useEffect(() => {
        // 🚀 PROTECCIÓN: Solo ejecutar UNA VEZ al inicio, no cada vez que cambian las páginas
        if (projectData?.id && !isLoading && pages.length === 0 && !hasInitializedProgress) {
            setHasInitializedProgress(true);
            // Añadir un pequeño delay para asegurar que el componente esté completamente montado
            setTimeout(() => {
                checkAndLoadSavedProgress();
            }, 500);
        }
    }, [projectData?.id, isLoading, pages.length, checkAndLoadSavedProgress, hasInitializedProgress]);

    // 🎯 EFECTO PARA TOUR AUTOMÁTICO: Ejecutar cuando el editor esté completamente cargado
    useEffect(() => {
        // Verificar que todo esté listo para el tour automático
        const isEditorReady = projectData?.id &&
            !isLoading &&
            pages.length > 0 &&
            hasInitializedProgress;

        if (isEditorReady) {
            console.log('🎯 [AUTO-TOUR] Editor completamente cargado, verificando si mostrar tour');
            checkAndStartAutoTour();
        }
    }, [projectData?.id, isLoading, pages.length, hasInitializedProgress, checkAndStartAutoTour]);

    // Función para crear páginas basadas en el preset
    const createPagesFromPreset = (preset, item) => {
        try {

            const newPages = [];
            const totalPages = item.pages || preset.pages || 20; // Usar páginas del preset primero


            // 1. PÁGINA DE PORTADA - Solo si está habilitada (true o 1)
            if (item.has_cover_image === true || item.has_cover_image === 1) {
                const coverBackgroundImage = item.cover_image ? `/storage/images/item/${item.cover_image}` : null;
                const coverBackgroundColor = !item.cover_image ? (preset.background_color || "#ffffff") : null;

                const coverPage = {
                    id: "page-cover",
                    type: "cover",
                    layout: "layout-1",
                    backgroundImage: coverBackgroundImage,
                    backgroundColor: coverBackgroundColor,
                    cells: [{
                        id: "cell-cover-1",
                        elements: [
                            // Título del álbum

                        ]
                    }]
                };

                newPages.push(coverPage);
            }

            // 2. PÁGINAS DE CONTENIDO (Siempre obligatorias)
            const contentBackgroundImage = item.content_image ? `/storage/images/item/${item.content_image}` : null;
            const contentBackgroundColor = !item.content_image ? (preset.background_color || "#ffffff") : null;


            for (let i = 1; i <= totalPages; i++) {
                const contentPage = {
                    id: `page-content-${i}`,
                    type: "content",
                    pageNumber: i,
                    layout: "layout-1",
                    backgroundImage: contentBackgroundImage,
                    backgroundColor: contentBackgroundColor,
                    cells: [{
                        id: `cell-content-${i}-1`,
                        elements: [

                        ]
                    }]
                };

                newPages.push(contentPage);
            }

            // 3. PÁGINA FINAL/CONTRAPORTADA - Solo si está habilitada (true o 1)
            if (item.has_back_cover_image === true || item.has_back_cover_image === 1) {
                const finalBackgroundImage = item.back_cover_image ? `/storage/images/item/${item.back_cover_image}` : null;
                const finalBackgroundColor = !item.back_cover_image ? (preset.background_color || "#ffffff") : null;

                const finalPage = {
                    id: "page-final",
                    type: "final",
                    layout: "layout-1",
                    backgroundImage: finalBackgroundImage,
                    backgroundColor: finalBackgroundColor,
                    cells: [{
                        id: "cell-final-1",
                        elements: [
                            // Texto de cierre
                            {
                                id: "final-text",
                                type: "text",
                                content: " ",
                                position: { x: 30, y: 45 },
                                size: { width: 40, height: 10 },
                                style: {
                                    fontSize: "20px",
                                    fontFamily: "Arial",
                                    color: "#000000",
                                    fontWeight: "bold",
                                    textAlign: "center"
                                },
                                zIndex: 1
                            }
                        ]
                    }]
                };

                newPages.push(finalPage);
            }

            setPages(newPages);
            setCurrentPage(0); // Empezar en la primera página disponible

            // Configurar dimensiones del workspace basadas en el preset
            if (preset.width && preset.height) {
                setWorkspaceSize("preset");
            }

        } catch (error) {
            console.error('❌ Error creating pages:', error);
            setLoadError(error.message);
        }
    };


    // 🎯 FUNCIÓN: Organizar páginas con lógica correcta de libro
    const organizeBookPages = useCallback((pages) => {
        if (!pages || pages.length === 0) return [];

        // Separar páginas por tipo
        const coverPages = pages.filter(p => p.type === 'cover');
        const contentPages = pages.filter(p => p.type === 'content');
        const finalPages = pages.filter(p => p.type === 'final');



        // Si no hay tapa ni contratapa, devolver como está
        if (coverPages.length === 0 && finalPages.length === 0) {
            return pages;
        }

        const organizedPages = [];

        // 1. Agregar TAPA si existe (siempre primera, página derecha)
        if (coverPages.length > 0) {
            organizedPages.push(...coverPages);

            // 🎯 LÓGICA CLAVE: Después de la tapa, agregar reverso con logo
            // Esto hace que la página 1 del contenido aparezca en la siguiente página (izquierda)
            organizedPages.push({
                id: `blank-page-cover-back-${Date.now()}`,
                type: 'blank',
                isBlankPage: true,
                hasLogo: true, // 🎯 NUEVO: Indicador para mostrar logo
                logoUrl: '/assets/resources/logo.png', // 🎯 NUEVO: URL del logo
                cells: [],
                backgroundColor: '#ffffff',
                layout: layouts[0]?.id || 'layout1' // Layout básico
            });
        }

        // 2. Agregar páginas de CONTENIDO
        if (contentPages.length > 0) {
            // 🎯 AHORA: La página 1 del contenido aparecerá en la posición correcta (izquierda si hay tapa)
            organizedPages.push(...contentPages);
        }

        // 3. Agregar CONTRATAPA si existe (siempre última, página izquierda)
        if (finalPages.length > 0) {
            // 🎯 LÓGICA CLAVE: La contratapa debe estar en la página izquierda
            // Si tenemos un número impar de páginas antes, necesitamos agregar una página en blanco
            const totalBeforeBackCover = organizedPages.length;

            // Si el total es impar, la contratapa estará en la derecha (incorrecto)
            // Necesitamos agregar una página en blanco para que esté en la izquierda
            if (totalBeforeBackCover % 2 === 1) {
                // Agregar página en blanco virtual para que la contratapa quede en la izquierda
                organizedPages.push({
                    id: `blank-page-before-back-${Date.now()}`,
                    type: 'blank',
                    isBlankPage: true,
                    cells: [],
                    backgroundColor: '#ffffff',
                    layout: layouts[0]?.id || 'layout1' // Layout básico
                });
            }

            organizedPages.push(...finalPages);
        }



        return organizedPages;
    }, [layouts]);

    // Memoize categorized pages for sidebar rendering to avoid re-filtering on every render
    const categorizedPages = useMemo(() => {
        // ✅ VALIDACIÓN DE SEGURIDAD: Verificar que itemData existe
        if (!itemData) {
            return {
                cover: pages.filter(page => page.type === "cover"),
                content: pages.filter(page => page.type === "content"),
                final: pages.filter(page => page.type === "final")
            };
        }

        return {
            cover: pages.filter(page =>
                page.type === "cover" &&
                (itemData.has_cover_image === true || itemData.has_cover_image === 1)
            ),
            content: pages.filter(page => page.type === "content"),
            final: pages.filter(page =>
                page.type === "final" &&
                (itemData.has_back_cover_image === true || itemData.has_back_cover_image === 1)
            )
        };
    }, [pages, itemData]);

    // 🎯 FUNCIÓN INTELIGENTE: Detectar tipo de contenido basado en configuración real
    const getContentType = useCallback(() => {
        // ✅ VALIDACIÓN DE SEGURIDAD: Verificar que itemData existe
        if (!itemData) {
            console.warn('⚠️ [CONTENT-TYPE] itemData no disponible, usando tipo por defecto');
            return {
                type: 'album',
                name: 'Álbum',
                description: 'Vista de Álbum',
                icon: '📖',
                experience: 'book'
            };
        }

        // ✅ VALIDACIÓN CORRECTA: Verificar configuración Y existencia de páginas
        const hasCoverEnabled = (itemData.has_cover_image === true || itemData.has_cover_image === 1);
        const hasBackCoverEnabled = (itemData.has_back_cover_image === true || itemData.has_back_cover_image === 1);
        const hasCover = hasCoverEnabled && categorizedPages.cover.length > 0;
        const hasBackCover = hasBackCoverEnabled && categorizedPages.final.length > 0;
        const contentPages = categorizedPages.content.length;



        if (hasCover && hasBackCover) {
            return {
                type: 'album',
                name: 'Álbum',
                description: 'Vista de Álbum',
                icon: '📖',
                experience: 'book' // Experiencia tipo libro con tapas
            };
        } else if (hasCover || hasBackCover) {
            return {
                type: 'booklet',
                name: 'Folleto',
                description: 'Vista de Folleto',
                icon: '📋',
                experience: 'booklet' // Experiencia híbrida
            };
        } else if (contentPages > 1) {
            return {
                type: 'catalog',
                name: 'Catálogo',
                description: 'Vista de Catálogo',
                icon: '📑',
                experience: 'catalog' // Experiencia tipo catálogo/galería
            };
        } else {
            return {
                type: 'card',
                name: 'Diseño',
                description: 'Vista Previa',
                icon: '🎨',
                experience: 'single' // Vista única
            };
        }
    }, [categorizedPages, itemData]);

    const contentType = getContentType();

    // Modifica la función getSelectedElement para que use useCallback
    const getSelectedElement = useCallback(() => {
        if (!selectedElement || !selectedCell || pages.length === 0) return null;

        const currentPageData = pages[currentPage];
        if (!currentPageData) return null;

        const cell = currentPageData.cells.find(
            (cell) => cell.id === selectedCell
        );
        if (!cell) return null;
        return cell.elements.find((el) => el.id === selectedElement);
    }, [selectedElement, selectedCell, pages, currentPage]);

    // Añade esta función para manejar la selección de elementos
    const handleSelectElement = (elementId, cellId) => {
        // Verificar si el elemento está bloqueado
        if (cellId) {
            const cell = pages[currentPage].cells.find(cell => cell.id === cellId);
            const element = cell?.elements.find(el => el.id === elementId);

            if (element?.locked) {
                // Mostrar mensaje temporal (opcional)
                const message = document.createElement('div');
                message.className = 'fixed top-4 right-4 bg-amber-100 border border-amber-400 text-amber-700 px-4 py-2 rounded-lg z-50';
                message.textContent = 'Este elemento es parte del diseño base y no se puede editar';
                document.body.appendChild(message);
                setTimeout(() => {
                    if (document.body.contains(message)) {
                        document.body.removeChild(message);
                    }
                }, 3000);
                return;
            }
        }

        // Siempre actualizar la celda seleccionada si se proporciona
        if (cellId) {
            setSelectedCell(cellId);
        }

        // Actualizar el elemento seleccionado
        setSelectedElement(elementId);

        // Manejo del toolbar
        if (elementId) {
            const cell = pages[currentPage].cells.find(
                (cell) => cell.id === (cellId || selectedCell)
            );
            const element = cell?.elements.find((el) => el.id === elementId);

            if (element?.type === "image") {
                setSelectedImage(element);
                // ✅ COMPLETAMENTE BLOQUEADO - NUNCA cambiar automáticamente a filtros
                // ✅ Solo establecer la imagen seleccionada para que esté disponible cuando vaya a filtros

                // 🛡️ ASEGURAR que NO se cambie a filtros automáticamente
                if (activeTab === 'filters') {
                    //console.log('✅ Usuario ya está en filtros, manteniendo');
                } else {
                    //  console.log('✅ Imagen seleccionada, pero manteniendo tab actual:', activeTab);
                }
            } else if (element?.type === "text") {
                setTextToolbarVisible(true);
                setTextEditingOptions({
                    elementId,
                    cellId: cellId || selectedCell,
                });
                // Solo cambiar a text si no estamos ya en una sección específica
                if (activeTab !== 'filters' && activeTab !== 'images') {
                    setActiveTab('text');
                }
            } else {
                setTextToolbarVisible(false);
            }
        } else {
            setTextToolbarVisible(false);
            setSelectedImage(null);
        }
    };

    // 🔧 MEJORADO: Obtener el layout actual con información adicional
    const getCurrentLayout = () => {
        if (pages.length === 0) return layouts[0];

        const currentPageData = pages[currentPage];
        if (!currentPageData) return layouts[0];

        const layout = layouts.find((layout) => layout.id === currentPageData.layout) || layouts[0];

        // 🔧 AÑADIR: Información adicional sobre complejidad del layout
        const isComplexLayout = layout.cellStyles && Object.values(layout.cellStyles).some(style =>
            style.includes('col-span-') || style.includes('row-span-')
        );

        return {
            ...layout,
            isComplex: isComplexLayout,
            pageId: currentPageData.id
        };
    };

    // 🚀 OPTIMIZACIÓN: Función debounced para localStorage
    const debouncedSaveToLocalStorage = useCallback(
        debounce((pages) => {
            try {
                const storageKey = getStorageKey();
                const dataToSave = {
                    pages,
                    currentPage,
                    savedAt: Date.now(),
                };

                const dataString = JSON.stringify(dataToSave);
                const dataSizeKB = Math.round(dataString.length / 1024);

                if (dataSizeKB < 2048) {
                    localStorage.setItem(storageKey, dataString);
                } else {
                    console.warn(`⚠️ Datos demasiado grandes para localStorage (${dataSizeKB} KB)`);
                    localStorage.removeItem(storageKey);
                }
            } catch (error) {
                console.error('❌ Error guardando en localStorage:', error);
                if (error.name === 'QuotaExceededError') {
                    try {
                        localStorage.removeItem(getStorageKey());
                    } catch (cleanError) {
                        console.error('Error limpiando localStorage:', cleanError);
                    }
                }
            }
        }, 300), // 300ms debounce para evitar spam
        [currentPage, getStorageKey]
    );

    // Actualizar el estado de las páginas y guardar en localStorage (ULTRA OPTIMIZADO)
    const updatePages = useCallback((newPages) => {
        // 🚀 OPTIMIZACIÓN: Evitar actualizaciones innecesarias si las páginas son idénticas
        setPages(prevPages => {
            // 🚀 OPTIMIZACIÓN: Comparación rápida por referencia primero
            if (prevPages === newPages) {
                return prevPages;
            }

            // 🚀 OPTIMIZACIÓN: Comparación por contenido solo si es necesario
            const prevPagesStr = JSON.stringify(prevPages);
            const newPagesStr = JSON.stringify(newPages);

            if (prevPagesStr === newPagesStr) {
                return prevPages;
            }


            // 🚀 OPTIMIZACIÓN: Usar requestAnimationFrame para operaciones no críticas
            requestAnimationFrame(() => {
                // Marcar la página actual como modificada
                setPageChanges(prev => {
                    const newMap = new Map(prev);
                    newMap.set(currentPage, Date.now());
                    return newMap;
                });

                // 🚀 OPTIMIZACIÓN: Invalidar thumbnail solo si hay cambios visuales reales
                if (newPages[currentPage]) {
                    const currentPageId = newPages[currentPage].id;
                    setPageThumbnails(prev => {
                        if (prev[currentPageId]) {
                            const updated = { ...prev };
                            delete updated[currentPageId];
                            return updated;
                        }
                        return prev;
                    });
                }
            });

            // 🚀 OPTIMIZACIÓN: Diferir operaciones de historial y localStorage
            setTimeout(() => {
                // Actualizar el historial de forma más eficiente
                setHistory(prevHistory => {
                    const newHistory = [
                        ...prevHistory.slice(0, historyIndex + 1),
                        newPagesStr,
                    ];

                    // 🚀 OPTIMIZACIÓN: Limitar historial para evitar uso excesivo de memoria
                    if (newHistory.length > 50) {
                        return newHistory.slice(-50);
                    }

                    return newHistory;
                });

                setHistoryIndex(prevIndex => {
                    const newIndex = prevIndex + 1;
                    return newIndex > 50 ? 49 : newIndex;
                });
            }, 0);

            return newPages;
        });

        // 🚀 OPTIMIZACIÓN: Guardar en localStorage con debounce agresivo
        debouncedSaveToLocalStorage(newPages);
    }, [currentPage, historyIndex, debouncedSaveToLocalStorage]);

    // Guardar currentPage en localStorage cuando cambie (con manejo de errores)
    useEffect(() => {
        try {
            const storageKey = getStorageKey();
            const dataToSave = {
                pages,
                currentPage,
                savedAt: Date.now(),
            };

            const dataString = JSON.stringify(dataToSave);
            const dataSizeKB = Math.round(dataString.length / 1024);

            if (dataSizeKB < 2048) {
                localStorage.setItem(storageKey, dataString);
            } else {
                console.warn(`⚠️ Datos demasiado grandes para localStorage (${dataSizeKB} KB), saltando guardado`);
            }
        } catch (error) {
            console.error('❌ Error guardando currentPage en localStorage:', error);
            if (error.name === 'QuotaExceededError') {
                try {
                    const storageKey = getStorageKey();
                    localStorage.removeItem(storageKey);
                } catch (cleanError) {
                    console.error('Error limpiando localStorage:', cleanError);
                }
            }
        }
    }, [currentPage, pages, getStorageKey]);
    // Función para exportar el proyecto como PDF usando el backend optimizado



    // Cambiar el layout de la página actual
    const changeLayout = (layoutId) => {
        const selectedLayout = layouts.find((l) => l.id === layoutId);
        if (!selectedLayout) return;

        const updatedPages = [...pages];
        const currentPageData = updatedPages[currentPage];

        // Crear nuevas celdas basadas en el layout seleccionado
        const newCells = Array.from({ length: selectedLayout.cells }).map(
            (_, index) => {
                const existingCell = currentPageData.cells[index];
                return (
                    existingCell || {
                        id: `cell-${currentPageData.id}-${index + 1}`,
                        elements: [],
                    }
                );
            }
        );

        updatedPages[currentPage] = {
            ...currentPageData,
            layout: layoutId,
            cells: newCells,
        };

        updatePages(updatedPages);
        setSelectedElement(null);
        setSelectedCell(null);
    };

    // Añadir un elemento a una celda
    const addElementToCell = (cellId, element) => {
        setPages(prev => {
            const updatedPages = [...prev];
            // Ensure we only add to the correct cell
            const cellIndex = updatedPages[currentPage].cells.findIndex(cell => cell.id === cellId);

            if (cellIndex !== -1) {
                updatedPages[currentPage].cells[cellIndex].elements.push(element);
            }

            return updatedPages;
        });
        setSelectedElement(element.id);
        setSelectedCell(cellId);
    };

    // 🚀 OPTIMIZACIÓN: Función debounced para updatePages en cambios no críticos
    const debouncedUpdatePages = useCallback(
        debounce(() => {
            setPageChanges(prev => {
                const newMap = new Map(prev);
                newMap.set(currentPage, Date.now());
                return newMap;
            });
        }, 100),
        [currentPage]
    );

    // Actualizar un elemento en una celda (OPTIMIZADA para redimensionamiento fluido)
    const updateElementInCell = useCallback((
        cellId,
        elementId,
        updates,
        isDuplicate = false
    ) => {


        // 🚀 OPTIMIZACIÓN: Usar función de callback para evitar re-renders innecesarios
        setPages(prevPages => {
            const updatedPages = [...prevPages];
            const cellIndex = updatedPages[currentPage].cells.findIndex(
                (cell) => cell.id === cellId
            );

            if (cellIndex === -1) return prevPages; // Celda no encontrada

            if (isDuplicate) {
                // Añadir como nuevo elemento
                const sourceElement = updatedPages[currentPage].cells[cellIndex].elements.find(
                    (el) => el.id === elementId
                );

                if (!sourceElement) return prevPages;

                updatedPages[currentPage].cells[cellIndex].elements.push({
                    ...sourceElement,
                    ...updates,
                });
            } else {
                // 🚀 OPTIMIZACIÓN: Actualizar elemento existente de forma más eficiente
                const elementIndex = updatedPages[currentPage].cells[cellIndex].elements.findIndex(
                    (el) => el.id === elementId
                );

                if (elementIndex === -1) return prevPages; // Elemento no encontrado

                const currentElement = updatedPages[currentPage].cells[cellIndex].elements[elementIndex];

                // 🚀 OPTIMIZACIÓN: Solo actualizar si hay cambios reales
                const hasChanges = Object.keys(updates).some(key => {
                    const currentValue = currentElement[key];
                    const newValue = updates[key];

                    // Comparación profunda para objetos anidados (como style, position, size)
                    if (typeof newValue === 'object' && typeof currentValue === 'object') {
                        return JSON.stringify(currentValue) !== JSON.stringify(newValue);
                    }

                    return currentValue !== newValue;
                });

                if (!hasChanges) {
                    return prevPages; // No hay cambios reales
                }

                const updatedElement = {
                    ...currentElement,
                    ...updates,
                };


                updatedPages[currentPage].cells[cellIndex].elements[elementIndex] = updatedElement;
            }

            return updatedPages;
        });

        // 🚀 OPTIMIZACIÓN: Usar requestAnimationFrame para updatePages en operaciones de drag/resize
        if (updates.position || updates.size) {
            // Para operaciones de redimensionamiento/movimiento, usar RAF para mejor fluidez
            requestAnimationFrame(() => {
                // Marcar página como modificada de forma eficiente
                setPageChanges(prev => {
                    if (prev.has(currentPage)) return prev;
                    const newMap = new Map(prev);
                    newMap.set(currentPage, Date.now());
                    return newMap;
                });
            });
        } else {
            // Para otros cambios, usar el sistema normal
            debouncedUpdatePages();
        }
    }, [currentPage, debouncedUpdatePages]);


    // Eliminar un elemento de una celda
    const deleteElementFromCell = (cellId, elementId) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            updatedPages[currentPage].cells[cellIndex].elements = updatedPages[currentPage].cells[cellIndex].elements.filter(el => el.id !== elementId);
            setPages(prev => {
                const newPages = [...prev];
                newPages[currentPage] = updatedPages[currentPage];
                return newPages;
            });

            if (selectedElement === elementId) {
                setSelectedElement(null);
            }
        }
    };

    // Mover un elemento hacia arriba o abajo en el z-index
    const moveElementInCell = (cellId, elementId, direction) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            const elements = updatedPages[currentPage].cells[cellIndex].elements;
            const elementIndex = elements.findIndex((el) => el.id === elementId);

            if (elementIndex !== -1) {
                const newIndex = direction === 'up' ? elementIndex + 1 : elementIndex - 1;

                // Verificar límites
                if (newIndex >= 0 && newIndex < elements.length) {
                    // Intercambiar elementos
                    const temp = elements[elementIndex];
                    elements[elementIndex] = elements[newIndex];
                    elements[newIndex] = temp;

                    updatePages(updatedPages);
                }
            }
        }
    };

    // Deshacer
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPages(JSON.parse(history[historyIndex - 1]));
            setSelectedElement(null);
            setSelectedCell(null);
        }
    };

    // Rehacer
    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPages(JSON.parse(history[historyIndex + 1]));
            setSelectedElement(null);
            setSelectedCell(null);
        }
    };


    // Añadir texto desde el botón
    const handleAddText = (textType = 'body') => {
        const newId = `text-${Date.now()}`;

        // Definir estilos específicos para cada tipo de texto
        const textStyles = {
            heading: {
                fontSize: "32px",
                fontFamily: "Arial",
                color: "#000000",
                fontWeight: "bold",
                fontStyle: "normal",
                textDecoration: "none",
                textAlign: "left",
                backgroundColor: "transparent",
                padding: "12px",
                borderRadius: "0px",
                border: "none",
                opacity: 1,
            },
            subheading: {
                fontSize: "24px",
                fontFamily: "Arial",
                color: "#333333",
                fontWeight: "600",
                fontStyle: "normal",
                textDecoration: "none",
                textAlign: "left",
                backgroundColor: "transparent",
                padding: "10px",
                borderRadius: "0px",
                border: "none",
                opacity: 1,
            },
            body: {
                fontSize: "16px",
                fontFamily: "Arial",
                color: "#000000",
                fontWeight: "normal",
                fontStyle: "normal",
                textDecoration: "none",
                textAlign: "left",
                backgroundColor: "transparent",
                padding: "8px",
                borderRadius: "0px",
                border: "none",
                opacity: 1,
            }
        };

        // Definir contenido y tamaño según el tipo
        const textContent = {
            heading: "Título Principal",
            subheading: "Subtítulo",
            body: "Haz clic para editar"
        };

        const textSizes = {
            heading: { width: 0.8, height: 0.2 },
            subheading: { width: 0.6, height: 0.15 },
            body: { width: 0.4, height: 0.15 }
        };

        const newElement = {
            id: newId,
            type: "text",
            content: textContent[textType],
            position: { x: 0.05, y: 0.05 }, // Posición en porcentajes para responsividad
            size: textSizes[textType], // Tamaño específico según el tipo
            style: textStyles[textType]
        }

        if (selectedCell) {
            // Añadir a la celda seleccionada
            addElementToCell(selectedCell, newElement);
        } else {
            // Si no hay celda seleccionada, no hacer nada o mostrar un mensaje
        }
    };

    useEffect(() => {
        // Función para manejar beforeunload (antes de cerrar la ventana)
        const handleBeforeUnload = (event) => {
            // Usar refs para acceder a los valores actuales sin dependencias
            const currentSaveQueue = saveQueueRef.current;
            const currentPageChanges = pageChangesRef.current;

            if (currentSaveQueue.length > 0 || currentPageChanges.size > 0) {
                // Mostrar mensaje de advertencia
                event.preventDefault();
                event.returnValue = 'Hay cambios sin guardar. ¿Estás seguro de que quieres salir?';
                return event.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []); // Sin dependencias para evitar el bucle

    // Efecto de limpieza separado que solo se ejecuta al desmontar
    useEffect(() => {
        return () => {
            // Solo limpiar al desmontar, sin setState que cause bucles
            //console.log('🧹 [CLEANUP] Componente desmontado');
        };
    }, []);

    // --- Función para agregar álbum al carrito CON BACKEND PDF ---
    const addAlbumToCart = async () => {

        try {



            if (!itemData || !presetData || !projectData?.id) {

                return false;
            }

            // Paso 1: GUARDAR PROGRESO FINAL EN BASE DE DATOS
            const savedSuccessfully = await autoSaveToDatabase(pages, true); // Force save

            if (!savedSuccessfully) {
                console.warn('⚠️ No se pudo guardar el progreso, pero continuando...');
            }

            // Paso 2: Preparar datos para generación de PDF en backend
            const pdfData = {
                design_data: {
                    id: projectData.id,
                    title: itemData?.name || 'Álbum Personalizado',
                    pages: pages,
                    workspace_dimensions: workspaceDimensions,
                    created_at: new Date().toISOString()
                },
                item_data: {
                    id: itemData?.id,
                    name: itemData?.name || itemData?.title,
                    price: itemData?.price,
                    user_id: itemData?.user_id,
                    width: itemData?.width,
                    height: itemData?.height
                },
                preset_data: {
                    id: presetData?.id,
                    width: presetData?.width,
                    height: presetData?.height,
                    cover_image: presetData?.cover_image,
                    content_layer_image: presetData?.content_layer_image,
                    final_layer_image: presetData?.final_layer_image
                },
                dimensions: {
                    width_mm: presetData?.width || itemData?.width || 210,
                    height_mm: presetData?.height || itemData?.height || 297,
                    workspace_width: workspaceDimensions?.width || 800,
                    workspace_height: workspaceDimensions?.height || 600
                }
            };

            // Paso 3: Marcar proyecto como listo para PDF backend
            try {
                const completeResponse = await fetch(`/api/canvas-projects/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        id: projectData.id,
                        status: 'ready_for_pdf',
                        pdf_data: pdfData,
                        completed_at: new Date().toISOString()
                    })
                });

                if (completeResponse.ok) {
                    const completeResult = await completeResponse.json();
                } else {
                    console.warn('⚠️ Error marcando proyecto como completado');
                }
            } catch (completeError) {
                console.warn('⚠️ Error en marcado de completado:', completeError);
            }

            // Paso 3: Generar un project_id único para el carrito
            const timestamp = Date.now();
            const cartProjectId = projectData.id; // Usar el ID del proyecto de BD

            // Establecer el project_id globalmente para uso posterior
            window.currentProjectId = cartProjectId;
            window.albumProjectId = cartProjectId;

            // Paso 4: Crear el producto del álbum para el carrito

            // Obtener thumbnail de la portada si está disponible
            let albumThumbnail = presetData.cover_image;
            if (pageThumbnails && pageThumbnails['page-cover']) {
                albumThumbnail = pageThumbnails['page-cover'];
            }

            // Optimizar imagen del thumbnail (reducir calidad si es base64)
            let optimizedThumbnail = albumThumbnail;
            if (albumThumbnail && albumThumbnail.startsWith('data:image/')) {
                if (albumThumbnail.length > 100000) { // Si es mayor a ~100KB
                    optimizedThumbnail = presetData.cover_image || '/assets/img/default-album.jpg';
                }
            }

            // Crear el producto siguiendo la estructura de itemData
            const albumProduct = {
                ...itemData, // Incluir todos los campos de itemData
                project_id: cartProjectId, // El project_id que se guardará en colors
                canvas_project_id: projectData.id, // ID del proyecto en canvas_projects
                quantity: 1,
                type: 'custom_album',
                // Metadatos adicionales para el PDF backend
                pdf_metadata: {
                    width_mm: presetData.width,
                    height_mm: presetData.height,
                    pages_count: pages.length,
                    workspace_dimensions: workspaceDimensions,
                    requires_pdf_generation: true
                }
            };




            // Paso 5: Agregar al carrito usando el patrón correcto

            const newCart = structuredClone(cart);
            const index = newCart.findIndex((x) => x.id == albumProduct.id);

            if (index == -1) {
                // Producto nuevo - agregarlo
                newCart.push({ ...albumProduct, quantity: 1 });
            } else {
                // Producto existente - incrementar cantidad
                newCart[index].quantity++;
            }

            // Actualizar estado del carrito
            setCart(newCart);

            // Mostrar notificación de éxito
            toast.success("Álbum agregado al carrito", {
                description: `${albumProduct.name} se ha añadido al carrito. El PDF se generará en el backend.`,
                icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
                duration: 4000,
                position: "bottom-center",
            });

            // Disparar evento personalizado para notificar otros componentes
            window.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: { cart: newCart, action: 'add', product: albumProduct }
            }));

            // 🎯 REDIRECCIÓN AUTOMÁTICA AL CARRITO
            console.log('✅ [CART] Álbum agregado exitosamente, redirigiendo al carrito...');

            // Usar timeout para permitir que las notificaciones se muestren
            setTimeout(() => {
                console.log('🔄 [CART] Ejecutando redirección a /cart');
                window.location.href = '/cart';
            }, 2000); // Aumentado a 2 segundos para mejor UX

            return true;

        } catch (error) {
            console.error('❌ === ERROR EN addAlbumToCart ===');
            console.error('Error completo:', error);
            console.error('Stack trace:', error.stack);
            console.error('Mensaje del error:', error.message);

            toast.error("Error al agregar al carrito", {
                description: `Error específico: ${error.message}`,
                duration: 5000,
                position: "bottom-center",
            });
            return false;
        }
    };


    // --- Finalizar diseño del álbum ---
    // Guarda el estado completo del diseño en la base de datos (optimizado)
    window.finalizeAlbumDesign = async () => {

        try {
            if (!pages || pages.length === 0) {
                throw new Error('No hay páginas para finalizar');
            }

            // Función para optimizar páginas y reducir el tamaño de los datos
            const optimizePages = (pages) => pages.map(page => ({
                id: page.id,
                type: page.type,
                pageNumber: page.pageNumber,
                layout: page.layout,
                cells: page.cells.map(cell => ({
                    id: cell.id,
                    elements: cell.elements.map(element => {
                        const optimizedElement = {
                            id: element.id,
                            type: element.type,
                            position: element.position,
                            zIndex: element.zIndex || 1
                        };

                        // Solo incluir propiedades necesarias según el tipo
                        if (element.type === 'image') {
                            // Para imágenes base64, guardar solo un hash o identificador
                            if (element.content.startsWith('data:image/')) {
                                // Crear un hash simple de la imagen para identificarla
                                const imageHash = btoa(element.content.substring(0, 100)).substring(0, 20);
                                optimizedElement.content = `[BASE64_IMAGE_${imageHash}]`;
                                optimizedElement.contentType = element.content.split(';')[0].split(':')[1];
                                optimizedElement.originalSize = element.content.length;
                            } else {
                                optimizedElement.content = element.content;
                            }

                            // Solo incluir filtros no vacíos
                            if (element.filters) {
                                const activeFilters = Object.entries(element.filters)
                                    .filter(([key, value]) => value !== 0 && value !== false && value !== null)
                                    .reduce((acc, [key, value]) => {
                                        acc[key] = value;
                                        return acc;
                                    }, {});

                                if (Object.keys(activeFilters).length > 0) {
                                    optimizedElement.filters = activeFilters;
                                }
                            }

                            if (element.mask && element.mask !== 'none') {
                                optimizedElement.mask = element.mask;
                            }
                            if (element.size) {
                                optimizedElement.size = element.size;
                            }
                            if (element.locked) {
                                optimizedElement.locked = element.locked;
                            }
                        } else if (element.type === 'text') {
                            optimizedElement.content = element.content;
                            if (element.style) {
                                // Solo incluir estilos no por defecto
                                const nonDefaultStyles = Object.entries(element.style)
                                    .filter(([key, value]) => {
                                        // Filtrar valores por defecto comunes
                                        if (key === 'fontSize' && value === '16px') return false;
                                        if (key === 'color' && value === '#000000') return false;
                                        if (key === 'fontFamily' && value === 'Arial') return false;
                                        return true;
                                    })
                                    .reduce((acc, [key, value]) => {
                                        acc[key] = value;
                                        return acc;
                                    }, {});

                                if (Object.keys(nonDefaultStyles).length > 0) {
                                    optimizedElement.style = nonDefaultStyles;
                                }
                            }
                        }

                        return optimizedElement;
                    })
                }))
            }));

            // Preparar los datos del diseño optimizados
            const designData = {
                pages: optimizePages(pages),
                projectInfo: {
                    id: projectData?.id,
                    item_id: itemData?.id,
                    title: itemData?.title,
                    preset_id: presetData?.id
                },
                presetInfo: {
                    id: presetData?.id,
                    name: presetData?.name,
                    cover_image: presetData?.cover_image,
                    content_image: presetData?.content_image,
                    back_cover_image: presetData?.back_cover_image
                },
                workspace: {
                    width: workspaceDimensions.width,
                    height: workspaceDimensions.height,
                    scale: workspaceDimensions.scale
                },
                meta: {
                    finalizedAt: new Date().toISOString(),
                    version: '1.3'
                }
            };

            // Preparar datos para enviar
            const requestData = {
                design_data: designData,
                thumbnails: Object.fromEntries(
                    Object.entries(pageThumbnails).map(([pageId, thumbnail]) => [pageId, thumbnail])
                )
            };

            // Verificar el tamaño del payload
            const dataString = JSON.stringify(requestData);
            const dataSizeKB = Math.round(dataString.length / 1024);
            const dataSizeMB = Math.round(dataSizeKB / 1024 * 100) / 100;


            // Mostrar información detallada sobre el contenido
            let base64Images = 0;
            let totalBase64Size = 0;

            pages.forEach(page => {
                page.cells?.forEach(cell => {
                    cell.elements?.forEach(element => {
                        if (element.type === 'image' && element.content && element.content.startsWith('data:image/')) {
                            base64Images++;
                            totalBase64Size += element.content.length;
                        }
                    });
                });
            });

            const base64SizeMB = Math.round(totalBase64Size / (1024 * 1024) * 100) / 100;

            // Advertir si el payload es muy grande
            if (dataSizeKB > 1024) { // Más de 1MB
                const proceed = confirm(
                    `El diseño contiene ${base64Images} imágenes (${base64SizeMB} MB en imágenes). ` +
                    `Payload completo: ${dataSizeMB} MB. ` +
                    `Esto podría causar problemas al guardarlo. ` +
                    `¿Desea continuar de todos modos?`
                );
                if (!proceed) {
                    return false;
                }
            }

            // Enviar al backend
            const response = await fetch(`/api/canvas/projects/${projectData.id}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: dataString
            });

            if (!response.ok) {
                let errorMessage = 'Error al finalizar el diseño';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si no se puede parsear la respuesta como JSON
                    if (response.status === 413) {
                        errorMessage = 'El diseño es demasiado grande para ser guardado. Intente simplificar las imágenes.';
                    } else if (response.status >= 500) {
                        errorMessage = 'Error del servidor. Intente nuevamente más tarde.';
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            return true;

        } catch (error) {
            console.error('Error al finalizar diseño:', error);
            let userMessage = error.message;

            // Mejorar mensajes de error específicos
            if (error.message.includes('Failed to fetch')) {
                userMessage = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.';
            } else if (error.message.includes('NetworkError') || error.message.includes('net::')) {
                userMessage = 'Error de red. Intente nuevamente más tarde.';
            }

            alert('Error al finalizar el diseño: ' + userMessage);
            return false;
        }
    };

    // --- Generar PDF del álbum con calidad de impresión 300 DPI ---
    // Renderiza cada página usando el mismo componente React con alta resolución
    const generateAlbumPDF = useCallback(async () => {


        try {
            // Importar pdf-lib dinámicamente
            const { PDFDocument } = await import('pdf-lib');

            // 🖨️ DIMENSIONES PROFESIONALES: Con sangrado para impresión
            let pageWidthCm = presetData?.width || 21; // A4 por defecto
            let pageHeightCm = presetData?.height || 29.7;

            // Agregar sangrado de 3mm (0.3cm) en cada lado para impresión profesional
            const bleedCm = 0.3; // 3mm de sangrado estándar
            const printWidthCm = pageWidthCm + (bleedCm * 2);
            const printHeightCm = pageHeightCm + (bleedCm * 2);

            // Convertir a puntos (1 cm = 28.35 puntos)
            const pageWidthPt = printWidthCm * 28.35;
            const pageHeightPt = printHeightCm * 28.35;

            // Crear documento PDF
            const pdfDoc = await PDFDocument.create();

            // Mostrar progreso
            const totalPages = pages.length;
            let processedPages = 0;

            // Crear elemento de progreso
            const progressContainer = document.createElement('div');
            progressContainer.id = 'pdf-progress';
            progressContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            progressContainer.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold mb-4">Generando PDF de alta calidad...</h3>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div id="pdf-progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">
                <span id="current-page">0</span> de ${totalPages} páginas procesadas
            </p>
        </div>
    `;
            document.body.appendChild(progressContainer);

            const updateProgress = (current) => {
                const percentage = (current / totalPages) * 100;
                document.getElementById('pdf-progress-bar').style.width = `${percentage}%`;
                document.getElementById('current-page').textContent = current;
            };

            // 🖨️ GUARDAR PÁGINA ORIGINAL antes del loop
            const originalCurrentPage = currentPage;

            // Procesar cada página
            for (let i = 0; i < pages.length; i++) {
                const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

                // Cambiar a la página actual temporalmente para capturarla
                setCurrentPage(i);

                // Esperar un momento para que se renderice
                await new Promise(resolve => setTimeout(resolve, 500));

                try {
                    // Capturar la página con alta calidad para PDF
                    const canvas = await captureCurrentWorkspace({ type: 'pdf' });

                    if (canvas) {
                        // Calcular dimensiones para mantener aspecto y llenar la página
                        const canvasAspect = canvas.width / canvas.height;
                        const pageAspect = pageWidthPt / pageHeightPt;

                        let imgWidth, imgHeight, offsetX = 0, offsetY = 0;

                        if (canvasAspect > pageAspect) {
                            // La imagen es más ancha, ajustar por ancho
                            imgWidth = pageWidthPt;
                            imgHeight = pageWidthPt / canvasAspect;
                            offsetY = (pageHeightPt - imgHeight) / 2;
                        } else {
                            // La imagen es más alta, ajustar por alto
                            imgHeight = pageHeightPt;
                            imgWidth = pageHeightPt * canvasAspect;
                            offsetX = (pageWidthPt - imgWidth) / 2;
                        }

                        // 🖨️ CALIDAD PROFESIONAL: PNG sin compresión para impresión
                        const imgData = canvas.toDataURL('image/png', 1.0);
                        const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
                        const embeddedImage = await pdfDoc.embedPng(imgBytes);

                        // Dibujar imagen en la página
                        page.drawImage(embeddedImage, {
                            x: offsetX,
                            y: offsetY,
                            width: imgWidth,
                            height: imgHeight,
                        });

                    } else {
                        console.warn(`⚠️ No se pudo capturar la página ${i + 1}`);
                        page.drawText(`Error al renderizar página ${i + 1}`, {
                            x: pageWidthPt / 2 - 50,
                            y: pageHeightPt / 2,
                            size: 12,
                        });
                    }
                } catch (pageError) {
                    console.error(`❌ Error procesando página ${i + 1}:`, pageError);
                    page.drawText(`Error al procesar página ${i + 1}`, {
                        x: pageWidthPt / 2 - 50,
                        y: pageHeightPt / 2,
                        size: 12,
                    });
                }

                processedPages++;
                updateProgress(processedPages);

                // Pausa pequeña entre páginas para no sobrecargar el navegador
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Restaurar página original
            setCurrentPage(originalCurrentPage);

            // Generar nombre del archivo
            const fileName = `${itemData?.name || 'album'}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Descargar el PDF
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();

            // Remover progreso
            document.body.removeChild(progressContainer);

            // Mostrar mensaje de éxito
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg z-50';
            successMsg.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span>PDF de alta calidad generado: ${fileName}</span>
                </div>
            `;
            document.body.appendChild(successMsg);

            setTimeout(() => {
                if (document.body.contains(successMsg)) {
                    document.body.removeChild(successMsg);
                }
            }, 5000);

            return fileName;

        } catch (error) {
            console.error('❌ Error generando PDF:', error);

            // Remover progreso si existe
            const progressElement = document.getElementById('pdf-progress');
            if (progressElement) {
                document.body.removeChild(progressElement);
            }

            // Mostrar error
            const errorMsg = document.createElement('div');
            errorMsg.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50';
            errorMsg.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Error al generar PDF: ${error.message}</span>
                </div>
            `;
            document.body.appendChild(errorMsg);

            setTimeout(() => {
                if (document.body.contains(errorMsg)) {
                    document.body.removeChild(errorMsg);
                }
            }, 7000);

            throw error;
        }

    }, [pages, currentPage, setCurrentPage, captureCurrentWorkspace, presetData, itemData]);

    // Exponer funciones útiles globalmente para uso externo
    window.generateAlbumPDF = generateAlbumPDF;

    // 🎯 FUNCIONES DE TOUR EXPUESTAS GLOBALMENTE
    window.startEditorTour = startTour;
    window.resetEditorTourState = resetTourState;
    window.checkTourStatus = () => {
        const hasSeenTour = localStorage.getItem('bananalab_editor_tour_completed');
        const userId = projectData?.user_id || 'anonymous';
        const userTourKey = `bananalab_editor_tour_user_${userId}`;
        const hasUserSeenTour = localStorage.getItem(userTourKey);

        return {
            hasSeenTourGlobally: !!hasSeenTour,
            hasUserSeenTour: !!hasUserSeenTour,
            userId: userId,
            shouldShowAutoTour: !hasSeenTour && !hasUserSeenTour
        };
    };

    const createMirrorElement = useCallback((element, targetWidth) => {
        if (!projectData?.canvas_preset) return null;

        const aspect = projectData.canvas_preset.height / projectData.canvas_preset.width;
        const scale = (targetWidth / workspaceDimensions.width).toFixed(2);
        const targetHeight = Math.round(targetWidth * aspect);

        // Create container with target dimensions and overflow hidden
        const container = document.createElement('div');
        container.style.width = targetWidth + "px";
        container.style.height = targetHeight + "px";
        container.style.overflow = "hidden";
        container.style.position = "relative";

        // console.trace(JSON.stringify(rect, null, 2))

        // Clonar el elemento
        const mirror = element.cloneNode(true);
        mirror.setAttribute('id', `th-${element.id}`)
        mirror.classList.add("thumbnail");
        mirror.style.width = workspaceDimensions.width + "px";
        mirror.style.height = workspaceDimensions.height + "px";
        mirror.style.transform = `scale(${scale})`;
        mirror.style.transformOrigin = "top left";
        mirror.style.position = "absolute";
        mirror.style.pointerEvents = "none"; // que no sea editable

        // Add mirror element to container
        container.appendChild(mirror);

        // console.log(structuredClone(rect), structuredClone(workspaceDimensions))

        // Observador para mantenerlo sincronizado
        const observer = new MutationObserver(() => {
            const newClone = element.cloneNode(true);
            newClone.style.width = workspaceDimensions.width + "px";
            newClone.style.height = workspaceDimensions.height + "px";
            mirror.replaceWith(newClone);
            newClone.classList.add("thumbnail");
            newClone.style.width = workspaceDimensions.width + "px";
            newClone.style.height = workspaceDimensions.height + "px";
            newClone.style.transform = `scale(${scale})`;
            newClone.style.transformOrigin = "top left";
            newClone.style.position = "absolute";
            newClone.style.pointerEvents = "none";
            mirrorRef.current = newClone;
        });
        observer.observe(element, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
        });

        // truco para devolver referencia "viva"
        const mirrorRef = { current: container };
        return container;
    }, [projectData?.canvas_preset, pages, workspaceDimensions])

    const createMirrorImage = useCallback(async (element, targetWidth, outputType = "file", scale = 1.2) => {
        if (!projectData?.canvas_preset) return null;

        // Guardar estilos originales
        const prevDisplay = element.style.display;
        const prevVisibility = element.style.visibility;
        const prevOverflow = element.style.overflow;

        // Forzar visible
        element.style.display = "block";
        element.style.visibility = "visible";
        element.style.overflow = "visible";

        // Create temporary wrapper with thumbnail class
        const wrapper = document.createElement("div");
        wrapper.classList.add('thumbnail');
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = "top left"; // important
        wrapper.style.width = `${workspaceDimensions.width}px`;
        wrapper.style.height = `${workspaceDimensions.height}px`;
        wrapper.style.display = "inline-block";

        // Clonar el elemento dentro del wrapper
        const clone = element.cloneNode(true);
        wrapper.appendChild(clone);

        console.log(`Width: ${workspaceDimensions.width}\nHeight: workspaceDimensions.height`)

        document.body.style.overflow = 'hidden';
        document.body.appendChild(wrapper);

        let dataUrl;
        try {
            dataUrl = await htmlToImage.toPng(wrapper, {
                width: workspaceDimensions.width * scale,
                height: workspaceDimensions.height * scale,
                canvasWidth: workspaceDimensions.width * scale,
                canvasHeight: workspaceDimensions.height * scale,
            });
        } finally {
            // Restaurar estado original
            element.style.display = prevDisplay;
            element.style.visibility = prevVisibility;
            element.style.overflow = prevOverflow;

            document.body.removeChild(wrapper);
            document.body.style.overflow = 'auto';

        }

        if (outputType === "base64") {
            return dataUrl; // data:image/png;base64,...
        }

        if (outputType === "blob") {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        }

        if (outputType === "file") {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            return new File([blob], "mirror.png", { type: "image/png" });
        }

        throw new Error("outputType debe ser 'file', 'base64' o 'blob'");
    }, [projectData?.canvas_preset, workspaceDimensions]);

    const [mirrors, setMirrors] = useState({})
    const [mirrorsGenerated, setMirrorsGenerated] = useState(false)

    useEffect(() => {
        if (mirrorsGenerated) return

        const hasAtLeastOne = pages.find(({ cells }) => cells.find(({ elements }) => elements.some(({ content }) => (content ?? '').trim())))
        if (hasAtLeastOne) setMirrorsGenerated(true)

        pages.forEach(page => {
            let pageElement = document.getElementById(`page-${page.id}`);
            if (!pageElement) document.createElement('div', {
                width: 300,
                height: 200
            });

            const mirror = createMirrorElement(pageElement, 268);
            setMirrors(prev => ({
                ...prev,
                [page.id]: mirror.outerHTML
            }));

        });
    }, [projectData, workspaceDimensions, pages, mirrorsGenerated]);

    // State to track first save
    const [isFirstSave, setIsFirstSave] = useState(true);

    // Update mirror for current page when editing
    useEffect(() => {
        const currentPageData = pages[currentPage];
        if (!currentPageData) return;

        const main = document.getElementById(`page-${currentPageData.id}`);
        const mirror = createMirrorElement(main, 268);
        setMirrors(prev => ({ ...prev, [currentPageData.id]: mirror.outerHTML }));

        const interval = setTimeout(() => {
            if (isFirstSave) {
                // Skip first save and update flag
                setIsFirstSave(false);
            } else {
                // Save on subsequent changes
                saveProgressManually();
            }
        }, 3000);

        return () => clearTimeout(interval)
    }, [pages, currentPage, isFirstSave]);

    return (
        <DndProvider backend={HTML5Backend} className="!h-screen !w-screen overflow-hidden">
            {isLoading ? (
                <div className="h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold customtext-neutral-dark mb-2">Cargando Editor</h2>
                        <p className="customtext-neutral-dark">Preparando tu álbum personalizado...</p>
                    </div>
                </div>
            ) : loadError ? (
                <div className="h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                        <p className="customtext-neutral-dark mb-4">
                            {loadError}
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            ) : pages.length === 0 ? (
                <div className="h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                        <h2 className="text-xl font-semibold customtext-neutral-dark mb-2">Inicializando Editor</h2>
                        <p className="customtext-neutral-dark mb-4">
                            Generando páginas del álbum...
                        </p>
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-screen w-screen overflow-hidden bg-[#141b34] font-sans">
                    {/* CSS para permitir que las imágenes se extiendan más allá de los bordes en modo edición */}
                    <style>{`
                        /* Solo aplicar overflow visible en modo edición (no en preview ni captura) */
                        .editor-workspace:not(.preview-mode) [data-element-type="image"] {
                            overflow: visible !important;
                        }
                        
                        .editor-workspace:not(.preview-mode) [data-element-type="image"] > div {
                            overflow: visible !important;
                        }
                        
                        /* Mantener overflow hidden solo para el contenedor principal para evitar scroll */
                        .editor-workspace:not(.preview-mode) #page-${pages[currentPage]?.id} {
                            overflow: visible !important;
                        }
                        
                        /* En preview mode y captura, mantener overflow hidden para el resultado final */
                        .preview-mode [data-element-type="image"],
                        .capture-mode [data-element-type="image"] {
                            overflow: hidden !important;
                        }
                    `}</style>

                    {/* Book Preview Modal */}
                    <BookPreviewModal
                        isOpen={isBookPreviewOpen}
                        onRequestClose={() => {
                            setIsBookPreviewOpen(false);
                            // 🚀 RESET: Limpiar estados al cerrar modal
                            setAlbumLoadingState({
                                isLoading: false,
                                loadedImages: 0,
                                totalImages: 0,
                                message: ''
                            });
                            // 🎭 RESET: Limpiar modal de preparación
                            setAlbumPreparationModal({
                                isOpen: false,
                                phase: 'preparing',
                                progress: 0,
                                message: '',
                                subMessage: ''
                            });
                        }}
                        pages={(() => {
                            // ✅ VALIDACIÓN DE SEGURIDAD: Verificar que itemData existe
                            if (!itemData) {
                                console.warn('⚠️ [EDITOR-TO-MODAL] itemData no disponible, enviando todas las páginas');
                                const allPages = categorizedPages.cover.concat(categorizedPages.content, categorizedPages.final).map((page) => ({
                                    ...page,
                                    layout: layouts.find((l) => l.id === page.layout) || layouts[0],
                                }));
                                return organizeBookPages(allPages);
                            }

                            // ✅ FILTRAR PÁGINAS SEGÚN CONFIGURACIÓN DE CHECKBOXES
                            let enabledPages = [];

                            // Solo incluir portada si está habilitada
                            if (itemData.has_cover_image === true || itemData.has_cover_image === 1) {
                                enabledPages = enabledPages.concat(categorizedPages.cover);
                            }

                            // Siempre incluir páginas de contenido
                            enabledPages = enabledPages.concat(categorizedPages.content);

                            // Solo incluir contraportada si está habilitada
                            if (itemData.has_back_cover_image === true || itemData.has_back_cover_image === 1) {
                                enabledPages = enabledPages.concat(categorizedPages.final);
                            }



                            const pagesWithLayout = enabledPages.map((page) => ({
                                ...page,
                                layout: layouts.find((l) => l.id === page.layout) || layouts[0],
                            }));

                            // 🎯 ORGANIZAR PÁGINAS CON LÓGICA CORRECTA DE LIBRO
                            return organizeBookPages(pagesWithLayout);
                        })()}
                        pageThumbnails={(() => {
                            // ✅ VALIDACIÓN DE SEGURIDAD: Verificar que itemData existe
                            if (!itemData) {
                                console.warn('⚠️ [EDITOR-TO-MODAL] itemData no disponible para filtrar thumbnails');
                                return pageThumbnails;
                            }

                            // ✅ FILTRAR THUMBNAILS SEGÚN PÁGINAS HABILITADAS
                            const filteredThumbnails = {};

                            // Obtener IDs de páginas habilitadas
                            let enabledPageIds = [];

                            if (itemData.has_cover_image === true || itemData.has_cover_image === 1) {
                                enabledPageIds = enabledPageIds.concat(categorizedPages.cover.map(p => p.id));
                            }

                            enabledPageIds = enabledPageIds.concat(categorizedPages.content.map(p => p.id));

                            if (itemData.has_back_cover_image === true || itemData.has_back_cover_image === 1) {
                                enabledPageIds = enabledPageIds.concat(categorizedPages.final.map(p => p.id));
                            }

                            // Filtrar thumbnails solo para páginas habilitadas
                            enabledPageIds.forEach(pageId => {
                                if (pageThumbnails[pageId]) {
                                    filteredThumbnails[pageId] = pageThumbnails[pageId];
                                }
                            });



                            return filteredThumbnails;
                        })()}
                        workspaceDimensions={workspaceDimensions}
                        getCurrentLayout={(page) => {
                            if (!page) return layouts[0];
                            return layouts.find((l) => l.id === page.layout) || layouts[0];
                        }}
                        presetData={presetData}
                        addAlbumToCart={addAlbumToCart}
                        projectData={projectData}
                        itemData={itemData}
                        // 🎯 NUEVO: Tipo de contenido inteligente
                        contentType={contentType}
                        categorizedPages={categorizedPages}
                        // 🚀 NUEVO: Estado de carga para mostrar animación
                        albumLoadingState={albumLoadingState}
                    />

                    {/* 🎭 MODAL DE PREPARACIÓN: Experiencia única para el cliente */}
                    {albumPreparationModal.isOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-500">
                            <div className="bg-white rounded-3xl shadow-2xl p-8 min-w-96 max-w-96 mx-4 text-center relative overflow-hidden animate-in zoom-in duration-500">
                                {/* Fondo animado con partículas flotantes */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 opacity-60"></div>

                                {/* Efectos de partículas flotantes */}
                                <div className="absolute inset-0">
                                    <div className="absolute top-4 left-4 w-2 h-2 bg-purple-300 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s' }}></div>
                                    <div className="absolute top-8 right-6 w-1 h-1 bg-blue-300 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}></div>
                                    <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }}></div>
                                    <div className="absolute bottom-4 right-4 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1.5s' }}></div>
                                </div>

                                {/* Contenido */}
                                <div className="relative z-10">
                                    {/* Icono principal animado con glow effect */}
                                    <div className="mb-6 relative">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl relative">
                                            {/* Glow effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-ping opacity-20"></div>
                                            <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse"></div>

                                            {/* Icono del libro */}
                                            <svg className="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>

                                        {/* Anillo de progreso mejorado */}
                                        <div className="absolute inset-0 w-24 h-24 mx-auto">
                                            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                                                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200" />
                                                <circle
                                                    cx="48" cy="48" r="44"
                                                    stroke="url(#progressGradient)"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${2 * Math.PI * 44}`}
                                                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - albumPreparationModal.progress / 100)}`}
                                                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                                                />
                                                <defs>
                                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                                                        <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Mensaje principal con efecto de typing */}
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 animate-pulse">
                                        {albumPreparationModal.message}
                                    </h2>

                                    {/* Submensaje */}
                                    <p className="text-gray-600 mb-6 text-base leading-relaxed">
                                        {albumPreparationModal.subMessage}
                                    </p>

                                    {/* Barra de progreso con glow */}
                                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out relative"
                                            style={{ width: `${albumPreparationModal.progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer"></div>
                                        </div>
                                    </div>

                                    {/* Porcentaje con animación */}
                                    <p className="text-lg font-bold text-purple-600 mb-4">
                                        {albumPreparationModal.progress}%
                                    </p>


                                </div>

                                {/* CSS para efectos adicionales */}
                                <style jsx>{`
                                    @keyframes shimmer {
                                        0% { transform: translateX(-100%) skewX(-12deg); }
                                        100% { transform: translateX(200%) skewX(-12deg); }
                                    }
                                    .animate-shimmer {
                                        animation: shimmer 2s infinite;
                                    }
                                `}</style>
                            </div>
                        </div>
                    )}

                    {/* ✅ Navigation Bar (Header) */}
                    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-lg flex items-center px-6 z-20 border-b border-gray-200">
                        <div className="w-full flex items-center justify-between">
                            {/* Left section */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => window.history.back()}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-[#040404]"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                    <span className="font-medium">Volver</span>
                                </button>

                                <div className="h-6 w-px bg-gray-300"></div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={undo}
                                        disabled={historyIndex <= 0}
                                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Undo2 className="h-4 w-4 text-[#040404]" />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={historyIndex >= history.length - 1}
                                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Redo2 className="h-4 w-4 text-[#040404]" />
                                    </button>
                                </div>
                            </div>

                            {/* Center section */}
                            <div className="flex-1 max-w-md mx-8">
                                <input
                                    type="text"
                                    value={projectData?.name || "Álbum Sin Título"}
                                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                                    className="w-full text-center text-lg font-bold text-[#040404] bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-[#af5cb8] focus:bg-white rounded-lg px-4 py-2 transition-all"
                                    placeholder="Nombre del diseño"
                                />
                            </div>

                            {/* Right section */}
                            <div id="toolbar-actions" className="flex items-center gap-4">
                                {/* Cola de guardado indicator */}
                                {(saveQueue.length > 0 || isProcessingQueue) && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                                        {isProcessingQueue ? (
                                            <>
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                                <span>Cola: {saveQueue.length}</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                <SaveIndicator
                                    saveStatus={autoSave.saveStatus}
                                    lastSaved={autoSave.lastSaved}
                                    lastAutoSaved={autoSave.lastAutoSaved}
                                    hasUnsavedChanges={autoSaveState.hasUnsavedChanges || Boolean(pageChanges instanceof Map && pageChanges.has(currentPage))}
                                    isOnline={autoSave.isOnline}
                                    saveError={autoSave.saveError}
                                    onManualSave={saveProgressManually}
                                    saveQueueSize={saveQueue.length}
                                    isProcessingQueue={isProcessingQueue}
                                    pageChangesCount={pageChanges instanceof Map ? pageChanges.size : 0}
                                />

                                {/* Debug: Botón para procesar cola manualmente */}
                                {saveQueue.length > 0 && (
                                    <button
                                        onClick={() => {
                                            processSaveQueue();
                                        }}
                                        className="flex items-center gap-2 text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Save className="h-3 w-3" />
                                        Procesar Cola
                                    </button>
                                )}


                                <Button
                                    id="preview-button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        try {
                                            // Show initial preparation modal
                                            setAlbumPreparationModal({
                                                isOpen: true,
                                                phase: 'saving',
                                                progress: 0,
                                                message: '💾 Guardando cambios',
                                                subMessage: 'Asegurando que todo esté actualizado...'
                                            });

                                            // Save current progress
                                            try {
                                                await saveProgressManually();
                                                setAlbumPreparationModal(prev => ({
                                                    ...prev,
                                                    progress: 15,
                                                    message: '✅ Cambios guardados',
                                                    subMessage: 'Preparando vista previa...'
                                                }));
                                                await new Promise(resolve => setTimeout(resolve, 500));
                                            } catch (saveError) {
                                                console.error('❌ [AUTO-SAVE] Error al guardar:', saveError);
                                                setAlbumPreparationModal(prev => ({
                                                    ...prev,
                                                    progress: 10,
                                                    message: '⚠️ Guardado parcial',
                                                    subMessage: 'Continuando con vista previa...'
                                                }));
                                                await new Promise(resolve => setTimeout(resolve, 300));
                                            }

                                            // Generate thumbnails for each page
                                            const thumbnailPromises = [];
                                            const pdfThumbnails = {};

                                            // Update modal to thumbnail generation phase
                                            setAlbumPreparationModal(prev => ({
                                                ...prev,
                                                phase: 'processing',
                                                progress: 30,
                                                message: '📸 Generando miniaturas',
                                                subMessage: 'Procesando páginas...'
                                            }));

                                            // Process each page
                                            // Process thumbnails sequentially to avoid memory issues
                                            let pageCounter = 0;
                                            for (const page of pages) {
                                                try {
                                                    // Create mirror image and get blob URI
                                                    const mainElement = document.getElementById(`page-${page.id}`)
                                                    const thumbnail = await createMirrorImage(mainElement, 1000, 'blob');
                                                    pdfThumbnails[page.id] = thumbnail;

                                                    // Calculate and update progress
                                                    const progress = 30 + Math.round((pageCounter + 1) / pages.length * 50);
                                                    setAlbumPreparationModal(prev => ({
                                                        ...prev,
                                                        progress,
                                                        subMessage: `Procesando página ${pageCounter + 1} de ${pages.length}...`
                                                    }));

                                                    // Add small delay between pages to prevent UI freezing
                                                    await new Promise(resolve => setTimeout(resolve, 100));
                                                    pageCounter++;
                                                } catch (error) {
                                                    console.error(`Error processing page ${pageCounter}:`, error);
                                                    // Continue with next page even if current fails
                                                    continue;
                                                }
                                            }

                                            // Ensure all thumbnails are properly processed
                                            if (Object.keys(pdfThumbnails).length !== pages.length) {
                                                console.warn('Some thumbnails failed to generate');
                                            }

                                            console.log(pdfThumbnails)

                                            // Show completion message
                                            const readyMessages = {
                                                album: { message: '📖 ¡Tu álbum está listo!', sub: 'Experiencia completa de lectura preparada' },
                                                catalog: { message: '📑 ¡Tu catálogo está listo!', sub: 'Navegación profesional activada' },
                                                booklet: { message: '📋 ¡Tu folleto está listo!', sub: 'Formato profesional completado' },
                                                card: { message: '🎨 ¡Tu diseño está listo!', sub: 'Vista previa perfecta creada' }
                                            };

                                            const ready = readyMessages[contentType.type];
                                            setAlbumPreparationModal(prev => ({
                                                ...prev,
                                                phase: 'ready',
                                                progress: 100,
                                                message: ready.message,
                                                subMessage: ready.sub
                                            }));

                                            await new Promise(resolve => setTimeout(resolve, 1000));

                                            // Close preparation modal and update thumbnails
                                            setAlbumPreparationModal(prev => ({
                                                ...prev,
                                                isOpen: false
                                            }));

                                            console.log(pdfThumbnails)

                                            setPageThumbnails(prev => ({
                                                ...prev,
                                                ...pdfThumbnails
                                            }));

                                            // Open preview modal
                                            setTimeout(() => {
                                                setIsBookPreviewOpen(true);
                                            }, 300);

                                        } catch (error) {
                                            console.error(`❌ [${contentType.type.toUpperCase()}-EXPERIENCE] Error en experiencia:`, error);

                                            setAlbumPreparationModal(prev => ({
                                                ...prev,
                                                message: '⚠️ Ups, algo salió mal',
                                                subMessage: 'Intentando nuevamente...',
                                                progress: 0
                                            }));

                                            setTimeout(() => {
                                                setAlbumPreparationModal(prev => ({
                                                    ...prev,
                                                    isOpen: false
                                                }));
                                            }, 2000);
                                        }
                                    }}
                                    disabled={albumPreparationModal.isOpen}
                                    icon={<Book className="h-4 w-4" />}
                                >
                                    {albumPreparationModal.isOpen ? `Creando ${contentType.name.toLowerCase()}...` : contentType.description}
                                </Button>

                                {/* Botón de Ayuda/Guía con indicador para usuarios nuevos */}
                                <button
                                    onClick={() => {
                                        console.log('🎯 [MANUAL-TOUR] Usuario solicitó tour manual');
                                        startTour();
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-[#040404] border border-gray-200 relative"
                                    title="Inicia la guía paso a paso del editor"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Ayuda</span>

                                    {/* Indicador pulsante para usuarios nuevos */}
                                    {(() => {
                                        const hasSeenTour = localStorage.getItem('bananalab_editor_tour_completed');
                                        const userId = projectData?.user_id || 'anonymous';
                                        const userTourKey = `bananalab_editor_tour_user_${userId}`;
                                        const hasUserSeenTour = localStorage.getItem(userTourKey);

                                        // Solo mostrar indicador si el usuario NO ha visto el tour
                                        if (!hasSeenTour && !hasUserSeenTour) {
                                            return (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                                                    <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </button>



                            </div>
                        </div>
                    </header>


                    {/* Main Layout */}
                    <div className={`flex h-full ${selectedElement ? 'pt-[60px]' : 'pt-16'}`}>
                        {/* ✅ Left Sidebar - Vertical Canva Style */}
                        <div className="flex">
                            {/* Icon Navigation */}
                            <div className="w-20 bg-[#f7edfa] border-r border-gray-200 flex flex-col items-center py-6 space-y-2">
                                <button
                                    data-tab="pages"
                                    onClick={() => setActiveTab('pages')}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all w-16 h-16 ${activeTab === 'pages'
                                        ? 'bg-[#af5cb8] text-white shadow-md'
                                        : 'text-[#040404] hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <Book className="h-6 w-6" />
                                    <span className="text-xs font-medium">Páginas</span>
                                </button>

                                <button
                                    data-tab="templates"
                                    onClick={() => setActiveTab('templates')}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all w-16 h-16 ${activeTab === 'templates'
                                        ? 'bg-[#af5cb8] text-white shadow-md'
                                        : 'text-[#040404] hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <Layout className="h-6 w-6" />
                                    <span className="text-xs font-medium">Diseños</span>
                                </button>

                                <button
                                    data-tab="panel"
                                    onClick={() => setActiveTab('panel')}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all w-16 h-16 ${activeTab === 'panel'
                                        ? 'bg-[#af5cb8] text-white shadow-md'
                                        : 'text-[#040404] hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <Layers className="h-6 w-6" />
                                    <span className="text-xs font-medium">Capas</span>
                                </button>

                                <button
                                    data-tab="text"
                                    onClick={() => setActiveTab('text')}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all w-16 h-16 ${activeTab === 'text'
                                        ? 'bg-[#af5cb8] text-white shadow-md'
                                        : 'text-[#040404] hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <Type className="h-6 w-6" />
                                    <span className="text-xs font-medium">Textos</span>
                                </button>

                                <button
                                    data-tab="filters"
                                    onClick={() => setActiveTab('filters')}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all w-16 h-16 ${activeTab === 'filters'
                                        ? 'bg-[#af5cb8] text-white shadow-md'
                                        : 'text-[#040404] hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <Filter className="h-6 w-6" />
                                    <span className="text-xs font-medium">Filtros</span>
                                </button>

                            </div>

                            {/* Content Panel */}
                            <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
                                {/* Panel Header */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold text-[#040404] capitalize">
                                                {activeTab === 'templates' && 'Templates'}
                                                {activeTab === 'images' && 'Images'}
                                                {activeTab === 'text' && 'Text'}
                                                {activeTab === 'shapes' && 'Shapes'}
                                                {activeTab === 'stickers' && 'Stickers'}
                                                {activeTab === 'pages' && 'Pages'}
                                                {activeTab === 'panel' && 'Layers Panel'}
                                                {activeTab === 'filters' && 'Filtros'}
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                {activeTab === 'templates' && 'Choose a template to get started'}
                                                {activeTab === 'images' && 'Search for images'}
                                                {activeTab === 'text' && 'Add and edit text'}
                                                {activeTab === 'shapes' && 'Add shapes and graphics'}
                                                {activeTab === 'stickers' && 'Add fun stickers'}
                                                {activeTab === 'pages' && 'Manage your pages'}
                                                {activeTab === 'panel' && 'Organize layers and z-index'}
                                                {activeTab === 'filters' && 'Aplicar efectos y filtros a elementos'}
                                            </p>
                                        </div>
                                        <button className="p-1 hover:bg-gray-100 rounded">
                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>



                                {/* Panel Content */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {activeTab === 'templates' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Layout className="h-5 w-5 text-[#af5cb8]" />
                                                <h3 className="font-semibold text-[#040404]">Page Layouts</h3>
                                            </div>
                                            <LayoutSelector
                                                currentLayoutId={pages[currentPage]?.layout}
                                                onLayoutChange={changeLayout}
                                            />
                                        </div>
                                    )}





                                    {activeTab === 'images' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <ImageIcon className="h-5 w-5 text-[#af5cb8]" />
                                                <h3 className="font-semibold text-[#040404]">Imágenes del Proyecto</h3>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {projectImages.length} imagen{projectImages.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <ProjectImageGallery
                                                images={projectImages}
                                                onImageSelect={addImageFromGallery}
                                                isLoading={projectImagesLoading}
                                            />
                                        </div>
                                    )}

                                    {activeTab === 'text' && (
                                        <div id="elements-panel" className="space-y-6">


                                            {/* Text Type Buttons */}
                                            <div className="space-y-2">
                                                {/* Heading Button */}
                                                <button
                                                    onClick={() => handleAddText('heading')}
                                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-[#af5cb8] hover:bg-gray-50 transition-all duration-200 text-left group"
                                                >
                                                    <div className="flex items-center gap-3">

                                                        <div className="flex-1">
                                                            <p className="font-bold text-gray-900 text-2xl leading-tight">Título Principal</p>
                                                            <p className="text-gray-500 text-xs mt-1">32px, Bold</p>
                                                        </div>
                                                        <div className="text-gray-400 group-hover:text-[#af5cb8] transition-colors">
                                                            <Plus className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Subheading Button */}
                                                <button
                                                    onClick={() => handleAddText('subheading')}
                                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-[#af5cb8] hover:bg-gray-50 transition-all duration-200 text-left group"
                                                >
                                                    <div className="flex items-center gap-3">

                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-800 text-lg leading-tight">Subtítulo</p>
                                                            <p className="text-gray-500 text-xs mt-1">24px, Semi-bold</p>
                                                        </div>
                                                        <div className="text-gray-400 group-hover:text-[#af5cb8] transition-colors">
                                                            <Plus className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Body Text Button */}
                                                <button
                                                    onClick={() => handleAddText('body')}
                                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-[#af5cb8] hover:bg-gray-50 transition-all duration-200 text-left group"
                                                >
                                                    <div className="flex items-center gap-3">

                                                        <div className="flex-1">
                                                            <p className="font-normal text-gray-900 text-base leading-tight">Texto Normal</p>
                                                            <p className="text-gray-500 text-xs mt-1">16px, Normal</p>
                                                        </div>
                                                        <div className="text-gray-400 group-hover:text-[#af5cb8] transition-colors">
                                                            <Plus className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Text Editing Section */}
                                            {activeTab === "text" && selectedElement && getSelectedElement()?.type === "text" && (
                                                <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="h-10 w-10 bg-[#af5cb8] rounded-xl flex items-center justify-center">
                                                            <Pencil className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-[#040404] text-lg">Editar Texto</h4>
                                                            <p className="text-gray-600 text-sm">Personaliza el formato y estilo</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {/* Quick Format Buttons */}
                                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-gray-700 mr-2">Formato:</span>
                                                            <button
                                                                onClick={() => {
                                                                    const element = getSelectedElement();
                                                                    updateElementInCell(selectedCell, selectedElement, {
                                                                        style: {
                                                                            ...element.style,
                                                                            fontWeight: element.style.fontWeight === 'bold' ? 'normal' : 'bold'
                                                                        }
                                                                    });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${getSelectedElement()?.style?.fontWeight === 'bold'
                                                                    ? 'bg-[#af5cb8] text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                B
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const element = getSelectedElement();
                                                                    updateElementInCell(selectedCell, selectedElement, {
                                                                        style: {
                                                                            ...element.style,
                                                                            fontStyle: element.style.fontStyle === 'italic' ? 'normal' : 'italic'
                                                                        }
                                                                    });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-md text-sm italic transition-colors ${getSelectedElement()?.style?.fontStyle === 'italic'
                                                                    ? 'bg-[#af5cb8] text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                I
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const element = getSelectedElement();
                                                                    updateElementInCell(selectedCell, selectedElement, {
                                                                        style: {
                                                                            ...element.style,
                                                                            textDecoration: element.style.textDecoration === 'underline' ? 'none' : 'underline'
                                                                        }
                                                                    });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-md text-sm underline transition-colors ${getSelectedElement()?.style?.textDecoration === 'underline'
                                                                    ? 'bg-[#af5cb8] text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                U
                                                            </button>
                                                        </div>

                                                        {/* Font Family */}
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-gray-700 block mb-2">Tipografía:</span>
                                                            <div className="relative">
                                                                <select
                                                                    value={getSelectedElement()?.style?.fontFamily || 'Arial'}
                                                                    onChange={(e) => {
                                                                        const element = getSelectedElement();
                                                                        updateElementInCell(selectedCell, selectedElement, {
                                                                            style: {
                                                                                ...element.style,
                                                                                fontFamily: e.target.value
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#af5cb8] focus:border-transparent appearance-none cursor-pointer hover:border-[#af5cb8] transition-colors"
                                                                >
                                                                    <option value="Arial">Arial</option>
                                                                    <option value="Times New Roman">Times New Roman</option>
                                                                    <option value="Helvetica">Helvetica</option>
                                                                    <option value="Georgia">Georgia</option>
                                                                    <option value="Verdana">Verdana</option>
                                                                    <option value="Courier New">Courier New</option>
                                                                    <option value="Impact">Impact</option>
                                                                    <option value="Comic Sans MS">Comic Sans MS</option>
                                                                    <option value="Trebuchet MS">Trebuchet MS</option>
                                                                    <option value="Tahoma">Tahoma</option>
                                                                    <option value="Palatino">Palatino</option>
                                                                    <option value="Garamond">Garamond</option>
                                                                    <option value="Bookman">Bookman</option>
                                                                    <option value="Avant Garde">Avant Garde</option>
                                                                    <option value="Calibri">Calibri</option>
                                                                    <option value="Cambria">Cambria</option>
                                                                    <option value="Candara">Candara</option>
                                                                    <option value="Century Gothic">Century Gothic</option>
                                                                    <option value="Franklin Gothic">Franklin Gothic</option>
                                                                    <option value="Futura">Futura</option>
                                                                    <option value="Gill Sans">Gill Sans</option>
                                                                    <option value="Lucida Grande">Lucida Grande</option>
                                                                    <option value="Optima">Optima</option>
                                                                    <option value="Segoe UI">Segoe UI</option>
                                                                    <option value="Roboto">Roboto</option>
                                                                    <option value="Open Sans">Open Sans</option>
                                                                    <option value="Lato">Lato</option>
                                                                    <option value="Montserrat">Montserrat</option>
                                                                    <option value="Poppins">Poppins</option>
                                                                    <option value="Nunito">Nunito</option>
                                                                    <option value="Inter">Inter</option>
                                                                </select>
                                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Font Size */}
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-gray-700 block mb-2">Tamaño:</span>
                                                            <div className="relative">
                                                                <select
                                                                    value={getSelectedElement()?.style?.fontSize || '16px'}
                                                                    onChange={(e) => {
                                                                        const element = getSelectedElement();
                                                                        updateElementInCell(selectedCell, selectedElement, {
                                                                            style: {
                                                                                ...element.style,
                                                                                fontSize: e.target.value
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#af5cb8] focus:border-transparent appearance-none cursor-pointer hover:border-[#af5cb8] transition-colors"
                                                                >
                                                                    <option value="8px">8px</option>
                                                                    <option value="10px">10px</option>
                                                                    <option value="12px">12px</option>
                                                                    <option value="14px">14px</option>
                                                                    <option value="16px">16px</option>
                                                                    <option value="18px">18px</option>
                                                                    <option value="20px">20px</option>
                                                                    <option value="22px">22px</option>
                                                                    <option value="24px">24px</option>
                                                                    <option value="28px">28px</option>
                                                                    <option value="32px">32px</option>
                                                                    <option value="36px">36px</option>
                                                                    <option value="40px">40px</option>
                                                                    <option value="44px">44px</option>
                                                                    <option value="48px">48px</option>
                                                                    <option value="56px">56px</option>
                                                                    <option value="64px">64px</option>
                                                                    <option value="72px">72px</option>
                                                                    <option value="80px">80px</option>
                                                                    <option value="96px">96px</option>
                                                                </select>
                                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Text Color */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-sm font-medium text-gray-700 block mb-2">Color:</span>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="color"
                                                                        value={getSelectedElement()?.style?.color || '#000000'}
                                                                        onChange={(e) => {
                                                                            const element = getSelectedElement();
                                                                            updateElementInCell(selectedCell, selectedElement, {
                                                                                style: {
                                                                                    ...element.style,
                                                                                    color: e.target.value
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer hover:border-[#af5cb8] transition-colors"
                                                                    />
                                                                    <span className="text-xs text-gray-600 font-mono">
                                                                        {getSelectedElement()?.style?.color || '#000000'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Background Color */}
                                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-sm font-medium text-gray-700 block mb-2">Fondo:</span>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="color"
                                                                        value={getSelectedElement()?.style?.backgroundColor || '#ffffff'}
                                                                        onChange={(e) => {
                                                                            const element = getSelectedElement();
                                                                            updateElementInCell(selectedCell, selectedElement, {
                                                                                style: {
                                                                                    ...element.style,
                                                                                    backgroundColor: e.target.value
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer hover:border-[#af5cb8] transition-colors"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const element = getSelectedElement();
                                                                            updateElementInCell(selectedCell, selectedElement, {
                                                                                style: {
                                                                                    ...element.style,
                                                                                    backgroundColor: 'transparent'
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                                                    >
                                                                        🚫
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Text Alignment */}
                                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-gray-700 w-20">Alinear:</span>
                                                            <div className="flex gap-1">
                                                                {['left', 'center', 'right', 'justify'].map((align) => (
                                                                    <button
                                                                        key={align}
                                                                        onClick={() => {
                                                                            const element = getSelectedElement();
                                                                            updateElementInCell(selectedCell, selectedElement, {
                                                                                style: {
                                                                                    ...element.style,
                                                                                    textAlign: align
                                                                                }
                                                                            });
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${getSelectedElement()?.style?.textAlign === align
                                                                            ? 'bg-[#af5cb8] text-white'
                                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                                            }`}
                                                                    >
                                                                        {align === 'left' && '⬅'}
                                                                        {align === 'center' && '⬌'}
                                                                        {align === 'right' && '➡'}
                                                                        {align === 'justify' && '⬍'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Line Height */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-sm font-medium text-gray-700 block mb-2">Espaciado:</span>
                                                                <div className="relative">
                                                                    <select
                                                                        value={getSelectedElement()?.style?.lineHeight || '1.5'}
                                                                        onChange={(e) => {
                                                                            const element = getSelectedElement();
                                                                            updateElementInCell(selectedCell, selectedElement, {
                                                                                style: {
                                                                                    ...element.style,
                                                                                    lineHeight: e.target.value
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#af5cb8] focus:border-transparent appearance-none cursor-pointer hover:border-[#af5cb8] transition-colors"
                                                                    >
                                                                        <option value="1">1.0</option>
                                                                        <option value="1.1">1.1</option>
                                                                        <option value="1.2">1.2</option>
                                                                        <option value="1.3">1.3</option>
                                                                        <option value="1.4">1.4</option>
                                                                        <option value="1.5">1.5</option>
                                                                        <option value="1.6">1.6</option>
                                                                        <option value="1.8">1.8</option>
                                                                        <option value="2">2.0</option>
                                                                        <option value="2.2">2.2</option>
                                                                        <option value="2.5">2.5</option>
                                                                        <option value="3">3.0</option>
                                                                    </select>
                                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Letter Spacing */}
                                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-sm font-medium text-gray-700 block mb-2">Letras:</span>
                                                                <div className="relative">
                                                                    <select
                                                                        value={getSelectedElement()?.style?.letterSpacing || 'normal'}
                                                                        onChange={(e) => {
                                                                            const element = getSelectedElement();
                                                                            updateElementInCell(selectedCell, selectedElement, {
                                                                                style: {
                                                                                    ...element.style,
                                                                                    letterSpacing: e.target.value
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#af5cb8] focus:border-transparent appearance-none cursor-pointer hover:border-[#af5cb8] transition-colors"
                                                                    >
                                                                        <option value="-3px">-3px</option>
                                                                        <option value="-2px">-2px</option>
                                                                        <option value="-1px">-1px</option>
                                                                        <option value="normal">Normal</option>
                                                                        <option value="0.5px">0.5px</option>
                                                                        <option value="1px">1px</option>
                                                                        <option value="1.5px">1.5px</option>
                                                                        <option value="2px">2px</option>
                                                                        <option value="3px">3px</option>
                                                                        <option value="4px">4px</option>
                                                                        <option value="5px">5px</option>
                                                                    </select>
                                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Text Effects */}
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-gray-700 block mb-2">Efectos:</span>
                                                            <div className="flex gap-2 flex-wrap">

                                                                <button
                                                                    onClick={() => {
                                                                        const element = getSelectedElement();
                                                                        updateElementInCell(selectedCell, selectedElement, {
                                                                            style: {
                                                                                ...element.style,
                                                                                textTransform: element.style.textTransform === 'uppercase' ? 'none' : 'uppercase'
                                                                            }
                                                                        });
                                                                    }}
                                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${getSelectedElement()?.style?.textTransform === 'uppercase'
                                                                        ? 'bg-[#af5cb8] text-white shadow-sm'
                                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-[#af5cb8]'
                                                                        }`}
                                                                >
                                                                    <span className="text-xs font-black">AA</span>
                                                                    MAYÚS
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const element = getSelectedElement();
                                                                        updateElementInCell(selectedCell, selectedElement, {
                                                                            style: {
                                                                                ...element.style,
                                                                                textTransform: element.style.textTransform === 'lowercase' ? 'none' : 'lowercase'
                                                                            }
                                                                        });
                                                                    }}
                                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${getSelectedElement()?.style?.textTransform === 'lowercase'
                                                                        ? 'bg-[#af5cb8] text-white shadow-sm'
                                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-[#af5cb8]'
                                                                        }`}
                                                                >
                                                                    <span className="text-xs font-normal">aa</span>
                                                                    minús
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Opacity */}
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium text-gray-700">Opacidad:</span>
                                                                <span className="text-sm font-bold text-[#af5cb8]">
                                                                    {Math.round((getSelectedElement()?.style?.opacity || 1) * 100)}%
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="1"
                                                                step="0.1"
                                                                value={getSelectedElement()?.style?.opacity || '1'}
                                                                onChange={(e) => {
                                                                    const element = getSelectedElement();
                                                                    updateElementInCell(selectedCell, selectedElement, {
                                                                        style: {
                                                                            ...element.style,
                                                                            opacity: e.target.value
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#af5cb8] slider"
                                                                style={{
                                                                    background: `linear-gradient(to right, #af5cb8 0%, #af5cb8 ${(getSelectedElement()?.style?.opacity || 1) * 100}%, #e5e7eb ${(getSelectedElement()?.style?.opacity || 1) * 100}%, #e5e7eb 100%)`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                    {activeTab === 'pages' && (
                                        <div id="pages-panel" className="space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Book className="h-5 w-5 text-[#af5cb8]" />
                                                    <h3 className="font-semibold text-[#040404]">Pages</h3>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {pages.length} total
                                                    </span>
                                                </div>

                                            </div>

                                            {/* ⚡ Indicador de progreso de thumbnail individual */}
                                            {thumbnailProgress && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        <span className="text-sm font-medium text-blue-800">
                                                            Generando thumbnail...
                                                        </span>
                                                        <span className="text-xs text-blue-600">
                                                            {thumbnailProgress.percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${thumbnailProgress.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        {thumbnailProgress.message || `Página: ${thumbnailProgress.pageId || 'actual'}`}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Mostrar estado de carga si las páginas aún no se han cargado */}
                                            {pages.length === 0 ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                                        <p className="text-sm text-gray-500">Cargando páginas...</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Cover section - Solo mostrar si hay páginas de cover */}
                                                    {categorizedPages.cover.length > 0 && (
                                                        <div>
                                                            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5"></div>
                                                                Cover
                                                            </div>
                                                            {categorizedPages.cover.map((page, index) => {
                                                                return <div
                                                                    key={page.id}
                                                                    id={`th-${page.id}`}
                                                                    className={`relative group flex flex-col cursor-pointer transition-all duration-200 transform 
                                                                    ${currentPage === pages.indexOf(page)
                                                                            ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                                            : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                                                                    mb-2`}
                                                                    onClick={() => handlePageChange(pages.indexOf(page))}
                                                                >
                                                                    <div className="relative bg-purple-50 overflow-hidden w-full h-auto" dangerouslySetInnerHTML={{ __html: mirrors[page.id] }} />
                                                                    <span className="absolute top-0 left-0 right-0 bottom-0 bg-transparent z-10"></span>
                                                                </div>
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Content pages */}
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></div>
                                                            Content Pages
                                                        </div>
                                                        <div className="space-y-2">
                                                            {categorizedPages.content.map((page, index) => {
                                                                return <div
                                                                    key={page.id}
                                                                    className={`relative group flex flex-col cursor-pointer transition-all duration-200 transform 
                                                                    ${currentPage === pages.indexOf(page)
                                                                            ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                                            : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                                                                    mb-1`}
                                                                    onClick={() => handlePageChange(pages.indexOf(page))}
                                                                >
                                                                    <div className="relative bg-purple-50 overflow-hidden w-full h-auto" dangerouslySetInnerHTML={{ __html: mirrors[page.id] }} />
                                                                    <div className="absolute top-1 left-1 bg-white/90 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow-md border">{index + 1}</div>
                                                                    <span className="absolute top-0 left-0 right-0 bottom-0 bg-transparent z-10"></span>
                                                                </div>
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Final page - Solo mostrar si hay páginas de back cover */}
                                                    {categorizedPages.final.length > 0 && (
                                                        <div>
                                                            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></div>
                                                                Back Cover
                                                            </div>
                                                            {categorizedPages.final.map((page, index) => {
                                                                return <div
                                                                    key={page.id}
                                                                    className={`relative group flex flex-col cursor-pointer transition-all duration-200 transform 
                                                                    ${currentPage === pages.indexOf(page)
                                                                            ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                                            : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                                                                    mb-2`}
                                                                    onClick={() => handlePageChange(pages.indexOf(page))}
                                                                >
                                                                    <div className="relative bg-purple-50 overflow-hidden w-full h-auto" dangerouslySetInnerHTML={{ __html: mirrors[page.id] }} />
                                                                    <span className="absolute top-0 left-0 right-0 bottom-0 bg-transparent z-10"></span>
                                                                </div>
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'panel' && (
                                        <div className="space-y-4">


                                            <LayerPanel
                                                pages={pages}
                                                currentPage={currentPage}
                                                selectedCell={selectedCell}
                                                selectedElement={selectedElement}
                                                onSelectCell={setSelectedCell}
                                                onSelectElement={setSelectedElement}
                                                onUpdateElement={(cellId, elementId, updates) => {
                                                    updateElementInCell(cellId, elementId, updates);
                                                }}
                                                onDeleteElement={(cellId, elementId) => {
                                                    deleteElementFromCell(cellId, elementId);
                                                }}
                                                onMoveElement={(cellId, elementId, direction) => {
                                                    moveElementInCell(cellId, elementId, direction);
                                                }}
                                            />
                                        </div>
                                    )}



                                    {activeTab === "filters" && (
                                        <div id="properties-panel" className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Filter className="h-5 w-5 text-[#af5cb8]" />
                                                <h3 className="font-semibold text-[#040404]">Filters</h3>
                                            </div>

                                            {(() => {
                                                const currentElement = getSelectedElement();
                                                return currentElement && currentElement.type === "image" ? (
                                                    <>
                                                        {currentElement.type === "image" && (
                                                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <ImageIcon className="h-4 w-4 text-[#af5cb8]" />
                                                                    <span className="text-sm font-medium">Selected Image</span>
                                                                </div>
                                                                <div className="w-full h-16 rounded-md overflow-hidden bg-gray-200">
                                                                    <img
                                                                        src={currentElement.content}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {currentElement.type === "image" && (
                                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                <h4 className="font-medium text-[#040404] mb-3">Masks</h4>
                                                                <MaskSelector
                                                                    selectedMask={currentElement.mask || "none"}
                                                                    onSelect={(maskId) => {
                                                                        updateElementInCell(
                                                                            selectedCell,
                                                                            selectedElement,
                                                                            { mask: maskId }
                                                                        );
                                                                    }}
                                                                    availableMasks={imageMasks.map(m => m.id)}
                                                                    selectedImage={currentElement}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                            <h4 className="font-medium text-[#040404] mb-3">Filters & Effects</h4>
                                                            <FilterControls
                                                                filters={currentElement.filters || {}}
                                                                onFilterChange={(newFilters) => {

                                                                    // 1. Actualizar elemento inmediatamente
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        { filters: newFilters }
                                                                    );
                                                                }}
                                                                selectedElement={currentElement}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 px-4 bg-white rounded-lg border border-gray-200">
                                                        <div className="bg-gray-100 p-4 rounded-lg mb-3 inline-block">
                                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                        <h4 className="text-sm font-medium text-[#040404] mb-2">
                                                            Select an image to apply filters
                                                        </h4>
                                                        <p className="text-xs text-gray-600">
                                                            {getSelectedElement() ?
                                                                'Filters are only available for image elements' :
                                                                'Click on an image element in your canvas to access filters and effects'
                                                            }
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}


                                </div>
                            </div>
                        </div>

                        {/* Main canvas area */}
                        <main className="flex-1 flex flex-col h-full">

                            <div id="quick-actions-bar" className="bg-white border-b px-4 py-2 flex items-center justify-between">


                                <>
                                    {/* Left side - History controls */}
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            {/* Botones de control de página */}

                                            <button
                                                onClick={() => setActiveTab('templates')}
                                                className="bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg shadow-md text-sm font-medium flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg"
                                            >
                                                <Layout className="h-4 w-4" />
                                                Diseño de página
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('panel')}
                                                className="bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg shadow-md text-sm font-medium flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg"
                                            >
                                                <Layers className="h-4 w-4" />
                                                Superponer objetos
                                            </button>

                                        </div>

                                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

                                        {/* Quick add tools */}
                                        <div className="flex space-x-1">

                                            <Button
                                                variant="ghost"
                                                tooltip="Añadir Imagen"
                                                onClick={() => imageInputRef.current && imageInputRef.current.click()}
                                            >
                                                <ImageIcon className="w-5 h-5" />
                                            </Button>

                                            <input
                                                type="file"
                                                ref={imageInputRef}
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                accept="image/*"
                                            />


                                        </div>

                                        {selectedElement && (
                                            <div className="flex space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (selectedElement && selectedCell) {
                                                            const element = getSelectedElement();
                                                            if (element) {
                                                                const duplicateElement = {
                                                                    ...element,
                                                                    id: `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                                                    position: {
                                                                        x: element.position.x + 0.05,
                                                                        y: element.position.y + 0.05
                                                                    }
                                                                };
                                                                addElementToCell(selectedCell, duplicateElement);
                                                            }
                                                        }
                                                    }}
                                                    className="h-8 px-2"
                                                    icon={<Copy className="h-4 w-4" />}
                                                >
                                                    Duplicar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (selectedElement && selectedCell) {
                                                            deleteElementFromCell(selectedCell, selectedElement);
                                                        }
                                                    }}
                                                    className="h-8 px-2 text-red-600 hover:text-white"
                                                    icon={<Trash2 className="h-4 w-4" />}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        )}




                                    </div>





                                </>

                            </div>


                            {/* Canvas workspace - centered */}
                            <div id="editor-workspace" className={`editor-workspace flex-1 relative flex items-center justify-center p-6 overflow-hidden bg-gray-100 ${previewMode ? 'preview-mode' : ''}`}>
                                {pages.map((page, pageIndex) => {
                                    // Get layout directly from layouts array
                                    const layout = layouts.find(l => l.id === page.layout) || layouts[0];
                                    const isComplexLayout = layout.cellStyles && Object.values(layout.cellStyles).some(style =>
                                        style.includes('col-span-') || style.includes('row-span-')
                                    );
                                    const currentLayout = {
                                        ...layout,
                                        isComplex: isComplexLayout,
                                        pageId: page.id
                                    };

                                    return (
                                        <div key={page.id} hidden={currentPage !== pageIndex}>
                                            {previewMode ? (
                                                <div className="bg-white rounded-lg shadow-lg">
                                                    <div
                                                        className="overflow-hidden"
                                                        style={{
                                                            width: workspaceDimensions.width,
                                                            height: workspaceDimensions.height,
                                                        }}
                                                    >
                                                        <div
                                                            id={`page-${page.id}`}
                                                            className={`grid ${currentLayout.template} gap-6`}
                                                            style={{ width: '100%', height: '100%' }}
                                                        >
                                                            {page.cells.map((cell, idx) => {
                                                                const cellDimensions = calculateCellDimensions(currentLayout, idx, workspaceDimensions);

                                                                return (
                                                                    <EditableCell
                                                                        key={cell.id}
                                                                        id={cell.id}
                                                                        elements={cell.elements.filter(el => !el.locked)}
                                                                        workspaceSize={cellDimensions}
                                                                        cellStyle={currentLayout.cellStyles?.[page.cells.indexOf(cell)]}
                                                                        selectedElement={selectedCell === cell.id ? selectedElement : null}
                                                                        onSelectElement={handleSelectElement}
                                                                        onAddElement={(element, cellId) => addElementToCell(cellId, element)}
                                                                        onUpdateElement={(elementId, updates, isDuplicate) =>
                                                                            updateElementInCell(cell.id, elementId, updates, isDuplicate)}
                                                                        onDeleteElement={(elementId) => deleteElementFromCell(cell.id, elementId)}
                                                                        availableMasks={currentLayout.maskCategories.flatMap((cat) => cat.masks)}
                                                                        projectData={projectData}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    id={`page-${page.id}`}
                                                    className="shadow-xl overflow-hidden"
                                                    style={{
                                                        width: workspaceDimensions.width,
                                                        height: workspaceDimensions.height,
                                                        position: 'relative',
                                                        backgroundColor: page?.backgroundColor || '#ffffff',
                                                        backgroundImage: page?.backgroundImage ? `url(${page.backgroundImage})` : 'none',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        backgroundRepeat: 'no-repeat'
                                                    }}
                                                >
                                                    {/* Background layer */}
                                                    {(() => {
                                                        if (page?.backgroundImage) {
                                                            return (
                                                                <img
                                                                    src={page.backgroundImage}
                                                                    alt="background"
                                                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                                                    style={{
                                                                        zIndex: 1,
                                                                    }}
                                                                />
                                                            );
                                                        } else if (page?.backgroundColor) {
                                                            return (
                                                                <div
                                                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                                                    style={{
                                                                        backgroundColor: page.backgroundColor,
                                                                        zIndex: 1,
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* Editable cells layer */}
                                                    <div
                                                        className={`grid ${currentLayout.template}`}
                                                        style={{
                                                            position: 'relative',
                                                            zIndex: 10,
                                                            width: '100%',
                                                            height: '100%',
                                                            boxSizing: 'border-box',
                                                            gap: currentLayout.style?.gap || '16px',
                                                            padding: currentLayout.style?.padding || '16px'
                                                        }}
                                                    >
                                                        {page.cells.map((cell) => (
                                                            <EditableCell
                                                                key={cell.id}
                                                                id={cell.id}
                                                                elements={cell.elements.filter(el => !el.locked)}
                                                                workspaceSize={workspaceDimensions}
                                                                cellStyle={currentLayout.cellStyles?.[page.cells.indexOf(cell)]}
                                                                selectedElement={selectedCell === cell.id ? selectedElement : null}
                                                                onSelectElement={handleSelectElement}
                                                                onAddElement={(element, cellId) => addElementToCell(cellId, element)}
                                                                onUpdateElement={(elementId, updates, isDuplicate) =>
                                                                    updateElementInCell(cell.id, elementId, updates, isDuplicate)}
                                                                onDeleteElement={(elementId) => deleteElementFromCell(cell.id, elementId)}
                                                                availableMasks={currentLayout.maskCategories.flatMap((cat) => cat.masks)}
                                                                projectData={projectData}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </main>
                    </div>
                </div>
            )}
            <Toaster />
        </DndProvider>
    );
}
