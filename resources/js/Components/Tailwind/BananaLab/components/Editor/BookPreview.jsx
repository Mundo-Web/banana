import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "react-modal";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import HTMLFlipBook from "react-pageflip";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Global from "../../../../../Utils/Global";
import { layouts } from '../../constants/layouts';
// Import pdf-lib dynamically
import * as PDFLib from 'pdf-lib';

// Estilos para el modal
const customStyles = {
    content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        padding: "0",
        border: "none",
        background: "none",
        overflow: "visible",
    },
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
    },
};

// Estilos CSS adicionales para eliminar márgenes del flipbook y mantener nitidez nativa
const flipbookStyles = `
    .stf__wrapper {
        margin: 0 !important;
        padding: 0 !important;
    }
    .stf__block {
        margin: 0 !important;
        padding: 0 !important;
    }
    .stf__page {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
    }
    .page-container img {
        display: block;
        margin: 0;
        padding: 0;
        border: none;
        outline: none;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: high-quality !important;
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
        -ms-interpolation-mode: bicubic !important;
    }
    .page-container {
        -webkit-font-smoothing: subpixel-antialiased !important;
        -moz-osx-font-smoothing: auto !important;
    }
`;

Modal.setAppElement('#app'); // Configurar elemento raíz para accesibilidad

const BookPreviewModal = ({
    isOpen,
    onRequestClose,
    pages,
    pageThumbnails = {},
    addAlbumToCart,
    workspaceDimensions = { width: 800, height: 600 },
    projectData = null,
    itemData = null,
    // 🎯 NUEVO: Tipo de contenido inteligente
    contentType = { type: 'album', name: 'Álbum', description: 'Vista de Álbum', icon: '📖' },
    albumLoadingState = { isLoading: false, loadedImages: 0, totalImages: 0, message: '' }
}) => {

    const [currentPage, setCurrentPage] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [generatedThumbnails, setGeneratedThumbnails] = useState({});
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
    const [pdfGenerated, setPdfGenerated] = useState(false);
    const [pdfGenerationInProgress, setPdfGenerationInProgress] = useState(false); // 🔧 NUEVO: Prevenir múltiples generaciones
    const [albumPreparationModal, setAlbumPreparationModal] = useState({
        isOpen: false,
        message: "Iniciando proceso...",
        subMessage: "Estamos preparando tu álbum",
        progress: 0
    });
    const flipBook = useRef();

    // 🔧 NUEVA FUNCIÓN CON FLUJO CORRECTO: PDF PRIMERO, LUEGO CARRITO, LUEGO REDIRECT
    const handlePurchaseWithCorrectFlow = async () => {
        if (isProcessing) return;

        // 🚀 INMEDIATAMENTE establecer estado de procesamiento y mostrar modal
        setIsProcessing(true);
        setAlbumPreparationModal({
            isOpen: true,
            message: "🎯 Procesando tu álbum...",
            subMessage: "Iniciando el proceso de compra",
            progress: 5
        });

        // 🎭 Dar un momento para que el modal aparezca visualmente
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // 📋 PASO INICIAL: Verificaciones
            setAlbumPreparationModal({
                isOpen: true,
                message: "🔍 Verificando proyecto...",
                subMessage: "Validando información del álbum",
                progress: 10
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Verificar que tenemos datos del proyecto
            if (!projectData?.id) {
                console.error('❌ No hay datos del proyecto');
                setAlbumPreparationModal({ isOpen: false, message: "", subMessage: "", progress: 0 });
                alert('Error: No se encontró información del proyecto.');
                return;
            }

            // Verificar que la función addAlbumToCart esté disponible
            if (typeof addAlbumToCart !== 'function') {
                console.error('❌ addAlbumToCart no es una función');
                setAlbumPreparationModal({ isOpen: false, message: "", subMessage: "", progress: 0 });
                alert('Error: Función de carrito no disponible. Inténtelo nuevamente.');
                return;
            }

            // ✅ Verificaciones completadas
            setAlbumPreparationModal({
                isOpen: true,
                message: "✅ Proyecto verificado",
                subMessage: "Preparando tu álbum para la compra",
                progress: 20
            });

            await new Promise(resolve => setTimeout(resolve, 400));

            // 🔧 PASO 1: GENERAR PDF PRIMERO y esperar confirmación del backend
            let pdfSuccess = false;
            if (!pdfGenerated && !pdfGenerationInProgress) {
                console.log('📄 [PURCHASE] PASO 1: Generando PDF para compra...');

                setAlbumPreparationModal({
                    isOpen: true,
                    message: "📄 Generando PDF...",
                    subMessage: "Creando el archivo de tu álbum",
                    progress: 30
                });

                pdfSuccess = await generatePDFSilently();
                console.log('📄 [PURCHASE] Resultado de generatePDFSilently:', pdfSuccess);

                if (!pdfSuccess) {
                    console.error('❌ [PURCHASE] PDF no se pudo generar o subir correctamente');
                    setAlbumPreparationModal({
                        isOpen: true,
                        message: "❌ Error en PDF",
                        subMessage: "No pudimos generar el archivo",
                        progress: 30
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setAlbumPreparationModal({ isOpen: false, message: "", subMessage: "", progress: 0 });
                    alert('Error: No se pudo generar el PDF del álbum. Por favor, inténtelo nuevamente.');
                    return;
                }

                console.log('✅ [PURCHASE] PDF generado y subido exitosamente al servidor');
                setAlbumPreparationModal({
                    isOpen: true,
                    message: "🎉 PDF creado exitosamente",
                    subMessage: "Archivo listo en el servidor",
                    progress: 65
                });
            } else {
                console.log('📄 [PURCHASE] PDF ya disponible, procediendo...');
                pdfSuccess = true;
                setAlbumPreparationModal({
                    isOpen: true,
                    message: "📄 PDF ya disponible",
                    subMessage: "Archivo encontrado en el servidor",
                    progress: 65
                });
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            // 🔧 PASO 2: SOLO DESPUÉS DE CONFIRMACIÓN DEL BACKEND, agregar al carrito
            setAlbumPreparationModal({
                isOpen: true,
                message: "🛒 Agregando al carrito...",
                subMessage: "Configurando tu pedido",
                progress: 75
            });

            console.log('🛒 [CART] PASO 2: PDF confirmado en servidor, agregando al carrito...');
            const cartResult = addAlbumToCart();

            let addedToCart;
            if (cartResult && typeof cartResult.then === 'function') {
                console.log('🛒 [CART] addAlbumToCart es async, esperando resultado...');
                addedToCart = await cartResult;
            } else {
                console.log('🛒 [CART] addAlbumToCart es sync, resultado inmediato:', cartResult);
                addedToCart = cartResult;
            }

            if (!addedToCart) {
                console.error('❌ No se pudo agregar al carrito');
                setAlbumPreparationModal({
                    isOpen: true,
                    message: "❌ Error en carrito",
                    subMessage: "No pudimos agregar el álbum",
                    progress: 75
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
                setAlbumPreparationModal({ isOpen: false, message: "", subMessage: "", progress: 0 });
                throw new Error('No se pudo agregar al carrito. El PDF se generó correctamente, pero hubo un problema con el carrito.');
            }

            console.log('✅ [PURCHASE] Álbum agregado exitosamente al carrito');

            // 🔧 PASO 3: SOLO DESPUÉS DE TODO LO ANTERIOR, redirigir
            setAlbumPreparationModal({
                isOpen: true,
                message: "🎉 ¡Álbum agregado al carrito!",
                subMessage: "Preparando redirección...",
                progress: 90
            });

            await new Promise(resolve => setTimeout(resolve, 800));

            setAlbumPreparationModal({
                isOpen: true,
                message: "✨ ¡Proceso completado!",
                subMessage: "Redirigiendo al carrito de compras",
                progress: 100
            });

            console.log('✅ [REDIRECT] Todo completado exitosamente, redirigiendo...');

            // Dar tiempo para mostrar el éxito antes de redirigir
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Cerrar modal y redirigir
            setAlbumPreparationModal({ isOpen: false, message: "", subMessage: "", progress: 0 });
            onRequestClose();
            window.location.href = '/cart';

        } catch (error) {
            console.error('❌ Error en proceso de compra:', error);
            setAlbumPreparationModal({
                isOpen: true,
                message: "❌ Error inesperado",
                subMessage: "Algo salió mal durante el proceso",
                progress: 0
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
            setAlbumPreparationModal({ isOpen: false, message: "", subMessage: "", progress: 0 });

            // Verificación de carrito y redirección de emergencia
            try {
                const cartKey = `${window.Global?.APP_CORRELATIVE || 'bananalab'}_cart`;
                const verifyCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                if (verifyCart.length > 0) {
                    console.log('✅ [RECOVERY] Producto encontrado en carrito, redirigiendo...');
                    onRequestClose();
                    setTimeout(() => {
                        window.location.href = '/cart';
                    }, 500);
                    return;
                }
            } catch (recoveryError) {
                console.error('❌ Error en recuperación:', recoveryError);
            }

            const userChoice = confirm(`Error: ${error.message}\n\n¿Desea intentar ir al carrito manualmente?`);
            if (userChoice) {
                window.location.href = '/cart';
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // 🔍 Exponer ID del proyecto para debugging
    useEffect(() => {
        if (projectData?.id) {
            window.currentProjectId = projectData.id;
            console.log('🔍 [DEBUG] Proyecto cargado:', projectData.id);
        }
    }, [projectData?.id]);

    // Función para generar PDF directamente en el frontend usando las imágenes del flipbook
    const generatePDFSilently = async () => {
        if (!projectData?.id) {
            console.warn('📄 [FRONTEND-PDF] No project loaded.');
            return false;
        }

        // 🔧 PREVENIR MÚLTIPLES GENERACIONES SIMULTÁNEAS
        if (pdfGenerationInProgress) {
            console.warn('⚠️ [FRONTEND-PDF] Generation already in progress, skipping duplicate call');
            return false;
        }

        setPdfGenerationInProgress(true);

        try {
            // Usar las mismas imágenes que estamos mostrando en el flipbook
            const imagesToUse = Object.keys(activeThumbnails).length > 0 ? activeThumbnails : generatedThumbnails;

            if (Object.keys(imagesToUse).length === 0) {
                console.warn('⚠️ [FRONTEND-PDF] No images available for PDF');
                return false;
            }

            // Create PDF document
            const pdfDoc = await PDFLib.PDFDocument.create();

            // Get ordered pages
            const bookPages = createBookPages();
            let pageCount = 1;

            // Calculate progress increment per page
            const totalPages = bookPages.length - 1;
            const progressStart = 30;
            const progressEnd = 60;
            const progressPerPage = (progressEnd - progressStart) / totalPages;

            for (const page of bookPages) {
                const imageUrl = imagesToUse[page.originalId || page.id];
                const pageIndex = bookPages.indexOf(page) + 1

                if (imageUrl) {
                    try {
                        let imageBytes;

                        // Handle blob URL vs base64 data URL
                        if (imageUrl.startsWith('blob:')) {
                            // For blob URLs, first convert to base64
                            const response = await fetch(imageUrl);
                            const blob = await response.blob();

                            // Convert blob to base64
                            const base64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });

                            // Convert base64 to bytes
                            const base64Data = base64.split(',')[1];
                            imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        } else {
                            // For regular URLs or base64
                            const response = await fetch(imageUrl);
                            const blob = await response.blob();
                            const arrayBuffer = await blob.arrayBuffer();
                            imageBytes = new Uint8Array(arrayBuffer);
                        }

                        // Try PNG first, fallback to JPG
                        let image;
                        try {
                            image = await pdfDoc.embedPng(imageBytes);
                        } catch (pngError) {
                            try {
                                image = await pdfDoc.embedJpg(imageBytes);
                            } catch (jpgError) {
                                throw new Error('Failed to embed image as PNG or JPG');
                            }
                        }

                        const dpi = projectData.canvas_preset.dpi
                        const pdfWidth = Math.round(((projectData.canvas_preset.width / 25.4) * dpi) / 2)
                        const pdfHeight = Math.round(((projectData.canvas_preset.height / 25.4) * dpi) / 2)

                        // Create new page with image dimensions
                        const pdfPage = pdfDoc.addPage([pdfWidth, pdfHeight]);

                        // Draw image on page using original dimensions
                        pdfPage.drawImage(image, {
                            x: 0,
                            y: 0,
                            width: pdfWidth,
                            height: pdfHeight
                        });

                        // Update progress modal for each page added
                        const currentProgress = progressStart + (progressPerPage * pageIndex);
                        setAlbumPreparationModal({
                            isOpen: true,
                            message: "📄 Generating PDF...",
                            subMessage: `Adding page ${pageIndex} of ${totalPages}`,
                            progress: Math.round(currentProgress)
                        });

                        pageCount++

                    } catch (imageError) {
                        console.warn(`⚠️ [FRONTEND-PDF] Error adding page ${pageIndex}:`, imageError);
                    }
                }
            }

            if (pageCount === 0) {
                console.error('❌ [FRONTEND-PDF] Could not add any pages to PDF');
                return false;
            }

            setAlbumPreparationModal({
                isOpen: true,
                message: "📄 Creating PDF...",
                subMessage: "Generating file for your album",
                progress: 60
            });

            // Generate PDF bytes
            const pdfBytes = await pdfDoc.save();

            // Convert to Blob
            // const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            // const pdfUrl = URL.createObjectURL(pdfBlob);
            // window.open(pdfUrl, '_blank');

            const pdfb64 = ArrayBufferToBase64(pdfBytes)

            // Update progress modal for upload phase
            setAlbumPreparationModal({
                isOpen: true,
                message: "📤 Uploading PDF to server...",
                subMessage: "Starting file transfer",
                progress: 61
            });

            // Upload PDF to server
            const uploadResult = await uploadPDFToServer(pdfb64);
            return uploadResult;

        } catch (error) {
            console.error('❌ [FRONTEND-PDF] Error generating PDF:', error);
            return false;
        } finally {
            setPdfGenerationInProgress(false);
        }
    };

    // Función para subir el PDF generado al servidor
    const uploadPDFToServer = async (pdfBase64) => {
        try {
            console.log('📤 [UPLOAD-PDF] Starting chunked PDF upload to server...');

            const logKey = `pdf_upload_log_${projectData.id}`;
            
            // Calculate base64 string length in bytes
            const base64Length = pdfBase64.length;
            const chunkSize = 25 * 1024 * 1024; // 25MB in bytes
            
            // Calculate number of chunks needed
            const totalChunks = Math.ceil(base64Length / chunkSize);
            
            console.log(`📦 [UPLOAD-PDF] Splitting into ${totalChunks} chunks`);
            
            localStorage.setItem(logKey, JSON.stringify({
                timestamp: new Date().toISOString(),
                step: 'starting_chunked_upload',
                totalSize: base64Length,
                chunks: totalChunks,
                projectId: projectData.id
            }));

            // Upload chunks sequentially
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, base64Length);
                const chunk = pdfBase64.slice(start, end);
                
                // Create text file with chunk content
                const chunkFile = new File([chunk], 'chunk.txt', {
                    type: 'text/plain'
                });
                
                const formData = new FormData();
                formData.append('pdf_chunk', chunkFile);
                formData.append('project_id', projectData.id);
                formData.append('chunk_number', i + 1); 
                formData.append('total_chunks', totalChunks);
                formData.append('is_last', (i === totalChunks - 1).toString());
                formData.append('pages_count', createBookPages().length);

                console.log(`📤 [UPLOAD-PDF] Uploading chunk ${i + 1}/${totalChunks}`);

                const response = await fetch(`/api/customer/projects/${projectData.id}/upload-pdf-chunk`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    console.error(`❌ [UPLOAD-PDF] Chunk ${i + 1} upload failed:`, errorData.message);
                    
                    localStorage.setItem(logKey, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        step: 'chunk_upload_error',
                        chunk: i + 1,
                        status: response.status,
                        error: errorData.message
                    }));
                    
                    return false;
                }

                console.log(`✅ [UPLOAD-PDF] Chunk ${i + 1} uploaded successfully`);
            }

            console.log('✅ [UPLOAD-PDF] All chunks uploaded successfully');
            
            localStorage.setItem(logKey, JSON.stringify({
                timestamp: new Date().toISOString(),
                step: 'upload_success',
                totalChunks: totalChunks
            }));

            setPdfGenerated(true);
            return true;

        } catch (error) {
            console.error('❌ [UPLOAD-PDF] Upload error:', error.message);

            localStorage.setItem(logKey, JSON.stringify({
                timestamp: new Date().toISOString(),
                step: 'exception',
                error: error.message,
                stack: error.stack
            }));

            return false;
        }
    };


    // Efectos de React
    useEffect(() => {
        if (isOpen) {

            // 🚀 SIEMPRE usar los thumbnails enviados desde Editor.jsx
            // NO generar nuevos thumbnails aquí para evitar problemas de rendimiento
            if (Object.keys(pageThumbnails).length > 0) {
                setGeneratedThumbnails(pageThumbnails);
                console.log('🖼️ [BOOK-PREVIEW] Thumbnails cargados:', Object.keys(pageThumbnails).length);
            } else {
                // Solo usar placeholders, no generar thumbnails
                setGeneratedThumbnails({});
                console.log('📄 [BOOK-PREVIEW] Sin thumbnails, usando placeholders');
            }

            // � REMOVIDO: No generar PDF automáticamente aquí para evitar duplicados
            // La generación de PDF solo debe ocurrir cuando el usuario hace clic en "Comprar ahora"
            console.log('📖 [BOOK-PREVIEW] Modal abierto, inicializando estado...');
            console.log('📄 [BOOK-PREVIEW] ProjectData ID:', projectData?.id);
        }
    }, [isOpen, pageThumbnails]);

    useEffect(() => {
        if (!isOpen) {
            setGeneratedThumbnails({});
            // 🔧 RESETEAR Estados de PDF al cerrar modal
            setPdfGenerated(false);
            setPdfGenerationInProgress(false);
            setIsProcessing(false);
            console.log('🔄 [BOOK-PREVIEW] Modal cerrado, estados reseteados');
        }
    }, [isOpen]);


    // Usar thumbnails en este orden de prioridad:
    // 1. Thumbnails proporcionados (de Editor.jsx)
    // 2. Thumbnails generados localmente
    const activeThumbnails = Object.keys(pageThumbnails).length > 0 ?
        pageThumbnails :
        generatedThumbnails;

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={onRequestClose}
                style={customStyles}
                contentLabel="Vista previa del álbum"
                ariaHideApp={true}
                shouldCloseOnOverlayClick={true}
                shouldCloseOnEsc={true}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 id="modal-title" className="text-xl font-bold">Vista previa del álbum</h2>
                        <button
                            onClick={onRequestClose}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Cerrar vista previa"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p id="modal-description" className="text-gray-600">No hay páginas disponibles para mostrar.</p>
                </div>
            </Modal>
        );
    }

    const goToPrevPage = () => {
        if (flipBook.current) {
            flipBook.current.pageFlip().flipPrev();
        }
    };
    const goToNextPage = () => {
        if (flipBook.current) {
            flipBook.current.pageFlip().flipNext();
        }
    };

    // Usar las dimensiones reales del workspace para calcular la proporción exacta
    const workspaceAspectRatio = workspaceDimensions.width / workspaceDimensions.height;

    // Tamaño base para la preview usando la proporción real del workspace
    const previewBaseWidht = 600;
    const previewHeight = previewBaseWidht;
    const previewWidth = Math.round(previewHeight * workspaceAspectRatio);

    // ✅ FUNCIÓN PARA FILTRAR PÁGINAS SEGÚN CONFIGURACIÓN
    const getEnabledPages = () => {
        // Verificar qué páginas están habilitadas según la configuración
        const hasCover = itemData?.has_cover_image === true || itemData?.has_cover_image === 1;
        const hasBackCover = itemData?.has_back_cover_image === true || itemData?.has_back_cover_image === 1;



        // Filtrar páginas según configuración
        const enabledPages = pages.filter(page => {
            if (page.type === 'cover' && !hasCover) {
                return false;
            }
            if (page.type === 'final' && !hasBackCover) {
                return false;
            }
            // Siempre incluir páginas de contenido
            return true;
        });



        return enabledPages;
    };

    // Función para organizar páginas como libro real con frente y reverso
    const createBookPages = () => {
        const enabledPages = getEnabledPages();

        // ✅ Si no hay páginas válidas, retornar array vacío
        if (enabledPages.length === 0) {
            console.warn('⚠️ [BOOK-PAGES] No hay páginas válidas para mostrar');
            return [];
        }

        // ✅ CREAR PÁGINAS PARA HTMLFlipBook
        // Cada página será individual (sin duplicados de reverso)
        const bookPages = enabledPages.map((page, index) => {
            // 🎯 CALCULAR TÍTULO INTELIGENTE
            let pageTitle = '';

            if (page.type === 'cover') {
                pageTitle = 'Portada';
            } else if (page.type === 'final') {
                pageTitle = 'Contraportada';
            } else if (page.type === 'content') {
                // Para páginas de contenido, usar su número real o calcular basado en su posición
                const contentPageNumber = page.pageNumber || (index + 1);
                pageTitle = `Página ${contentPageNumber}`;
            } else {
                pageTitle = `Página ${index + 1}`;
            }

            return {
                ...page,
                id: `${page.id}-display`,
                originalId: page.id,
                displayIndex: index,
                pageType: page.type,
                pageTitle: pageTitle,
                originalPageNumber: page.pageNumber // Preservar número original
            };
        });



        return bookPages;
    };

    const bookPages = createBookPages();

    // ✅ CONFIGURACIÓN INTELIGENTE: Determinar si tenemos portada para configurar HTMLFlipBook
    const hasRealCover = bookPages.length > 0 && bookPages[0]?.pageType === 'cover';
    const contentOnlyMode = bookPages.length > 0 && !hasRealCover &&
        !bookPages.some(p => p.pageType === 'final');

    // Si no hay páginas, mostrar mensaje
    if (bookPages.length === 0) {
        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={onRequestClose}
                style={customStyles}
                contentLabel="Vista previa del álbum"
                ariaHideApp={true}
                shouldCloseOnOverlayClick={true}
                shouldCloseOnEsc={true}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 id="modal-title" className="text-xl font-bold">Vista previa del {contentType.name.toLowerCase()}</h2>
                        <button
                            onClick={onRequestClose}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Cerrar vista previa"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p id="modal-description" className="text-gray-600">
                        No hay páginas habilitadas para mostrar. Verifique la configuración de portada y contraportada.
                    </p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel={`Vista previa del ${contentType.name.toLowerCase()}`}
            ariaHideApp={true}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            {/* Inyectar estilos CSS para eliminar márgenes */}
            <style dangerouslySetInnerHTML={{ __html: flipbookStyles }} />

            {/* Overlay de carga */}
            {(isGeneratingThumbnails || isGeneratingPDF || albumLoadingState.isLoading) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-md mx-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>

                        {/* 🚀 NUEVA ANIMACIÓN: Progreso específico para carga de álbum */}
                        {albumLoadingState.isLoading ? (
                            <>
                                <p className="text-gray-700 text-center">
                                    {albumLoadingState.message || 'Cargando álbum...'}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${albumLoadingState.totalImages > 0
                                                ? (albumLoadingState.loadedImages / albumLoadingState.totalImages) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {albumLoadingState.loadedImages} de {albumLoadingState.totalImages} imágenes
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-700">
                                    {isGeneratingPDF
                                        ? 'Preparando álbum...'
                                        : 'Cargando vistas previas...'
                                    }
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Procesando contenido
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl">
                {/* Título del modal (oculto visualmente pero accesible) */}
                <h2 id="modal-title" className="sr-only">Vista previa del {contentType.name.toLowerCase()}</h2>
                <p id="modal-description" className="sr-only">
                    Navegue por las páginas de su {contentType.name.toLowerCase()} usando los controles de navegación o teclado.
                    Puede cerrar esta ventana presionando Escape o el botón de cerrar.
                </p>

                {/* Botón de cerrar */}
                <button
                    onClick={onRequestClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow z-10"
                    aria-label={`Cerrar vista previa del ${contentType.name.toLowerCase()}`}
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Controles de navegación */}
                <div className="flex items-center justify-center gap-8 mb-6 mt-2">
                    <button
                        onClick={goToPrevPage}
                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow transition-colors"
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <div className="flex items-center">
                        <span className="flex items-center text-gray-700 text-base font-medium px-4 py-2 bg-gray-50 rounded-lg" aria-live="polite">
                            {(() => {
                                const currentPageData = bookPages[currentPage];
                                if (!currentPageData) return 'Cargando...';

                                // 🔍 DEBUG: Log datos de la página actual


                                // Usar el título generado
                                return currentPageData.pageTitle || `Página ${currentPage + 1}`;
                            })()}
                            <span className="mx-2 text-gray-400">•</span>
                            {currentPage + 1} / {bookPages.length} páginas
                            {contentOnlyMode && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    Solo contenido
                                </span>
                            )}
                        </span>


                    </div>

                    <button
                        onClick={goToNextPage}
                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow transition-colors"
                        aria-label="Página siguiente"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* Flipbook visual: thumbnails con efecto page flip como libro real */}
                <div className="flex items-center justify-center">
                    <HTMLFlipBook
                        ref={flipBook}
                        width={previewWidth}
                        height={previewHeight}
                        size="stretch"
                        minWidth={previewWidth * 0.7}
                        maxWidth={previewWidth * 1.3}
                        minHeight={previewHeight * 0.7}
                        maxHeight={previewHeight * 1.3}
                        maxShadowOpacity={0.3}
                        showCover={hasRealCover}
                        mobileScrollSupport={true}
                        onFlip={(e) => setCurrentPage(e.data)}
                        className="shadow-xl"
                        usePortrait={false}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={600}
                        useMouseEvents={true}
                        swipeDistance={50}
                        showPageCorners={!contentOnlyMode}
                        disableFlipByClick={false}
                        autoSize={contentOnlyMode}
                        style={{
                            margin: 0,
                            padding: 0
                        }}
                    >
                        {bookPages.map((page, pageIdx) => {
                            // 🔧 DEBUG: Log para verificar thumbnails disponibles para cada página
                            const thumbnailKey = page.originalId || page.id;
                            const hasThumbnail = !!activeThumbnails[thumbnailKey];

                            // console.log(`Página ${pageIdx + 1}:`, page)

                            return (
                                <div
                                    key={`page-${pageIdx}`}
                                    id={`page-${page.originalId || page.id}`}
                                    className="page-container"
                                    style={{
                                        width: previewWidth,
                                        height: previewHeight,
                                        margin: 0,
                                        padding: 0,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#ffffff'
                                    }}
                                >
                                    {/* Página individual */}
                                    <div className={`border-2 ${pageIdx % 2 ? 'rounded-l-xl' : 'rounded-r-xl'} overflow-hidden`} style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {page.isBlankPage ? (
                                            // 📄 PÁGINA EN BLANCO: Para correcto posicionamiento de tapas
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#ffffff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#f3f4f6',
                                                fontSize: '14px',
                                                fontStyle: 'italic'
                                            }}>
                                                {/* 🎯 NUEVO: Mostrar logo si está disponible */}
                                                {page.hasLogo && page.logoUrl ? (
                                                    <img
                                                        src={page.logoUrl}
                                                        alt="Logo"
                                                        style={{
                                                            maxWidth: '120px',
                                                            maxHeight: '120px',
                                                            objectFit: 'contain',
                                                            opacity: 0.8,
                                                            filter: 'grayscale(20%)'
                                                        }}
                                                        onError={(e) => {
                                                            console.warn('⚠️ [BOOK-PREVIEW] Error cargando logo:', page.logoUrl);
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    // Página en blanco sin logo
                                                    null
                                                )}
                                            </div>
                                        ) : activeThumbnails[page.originalId || page.id] ? (
                                            // Página con contenido usando thumbnails disponibles
                                            <img
                                                src={activeThumbnails[page.originalId || page.id]}
                                                alt={page.pageTitle || `Página ${pageIdx + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                    margin: 0,
                                                    padding: 0,
                                                    border: 'none',
                                                    imageRendering: 'auto',
                                                    backgroundColor: '#ffffff',
                                                    WebkitBackfaceVisibility: 'hidden',
                                                    backfaceVisibility: 'hidden',
                                                    WebkitTransform: 'translateZ(0)',
                                                    transform: 'translateZ(0)'
                                                }}
                                            />
                                        ) : (
                                            // Placeholder inline si no hay thumbnail
                                            <InlinePlaceholder page={page} pageIdx={pageIdx} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </HTMLFlipBook>
                </div>
            </div>
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-2xl mx-auto">

                {/* Botón Comprar ahora */}
                <button
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold shadow transition flex items-center justify-center ${isProcessing
                        ? 'bg-purple-400 text-white cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                    onClick={handlePurchaseWithCorrectFlow}
                    disabled={isProcessing || isGeneratingPDF}
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Agregando al carrito...
                        </>
                    ) : (
                        'Comprar ahora'
                    )}
                </button>
                <button
                    className="flex-1 py-3 px-4 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                    onClick={onRequestClose}
                    disabled={isProcessing || isGeneratingPDF}
                >
                    Continuar editando
                </button>
            </div>

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
        </Modal>
    );
};

// Componente para placeholder inline simple
const InlinePlaceholder = ({ page, pageIdx }) => {
    // Usar los nuevos campos del objeto page con prioridad
    const pageTitle = page.pageTitle ||
        (page.type === 'content' ? `Página ${page.originalPageNumber || page.pageNumber || pageIdx + 1}` :
            page.type === 'cover' ? 'Portada' :
                page.type === 'final' ? 'Contraportada' :
                    `Página ${pageIdx + 1}`);

    const pageType = page.pageType || page.type || 'content';

    let pageIcon = '';

    switch (pageType) {
        case 'cover':
            pageIcon = '📚';
            break;
        case 'final':
            pageIcon = '📖';
            break;
        case 'content':
            pageIcon = '📄';
            break;
        default:
            pageIcon = '📄';
    }



    return (
        <div
            className="flex flex-col items-center justify-center w-full h-full bg-gray-50 border-2 border-gray-200 rounded-lg"
            style={{ minHeight: '400px' }}
        >
            <div className="text-6xl mb-4">{pageIcon}</div>
            <div className="text-lg font-semibold text-gray-700 mb-2">{pageTitle}</div>
            <div className="text-sm text-gray-500">Vista previa</div>
            {page.layout && (
                <div className="text-xs text-gray-400 mt-2">
                    Layout: {page.layout.name || 'Personalizado'}
                </div>
            )}
            {/* 🔍 DEBUG: Mostrar información adicional en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                    <div>ID: {page.originalId || page.id}</div>
                    <div>Tipo: {pageType}</div>
                    <div>Página #: {page.originalPageNumber || page.pageNumber || 'N/A'}</div>
                </div>
            )}
        </div>
    );
};

// --- INICIO: Función exportable para thumbnails fieles ---
async function generateHighQualityThumbnails({ pages, workspaceDimensions, presetData }) {
    const newThumbnails = {};
    const scale = 2; // Reducir la escala para mejor rendimiento

    // Función para dibujar imagen manteniendo la relación de aspecto
    function drawImageCover(ctx, img, dx, dy, dWidth, dHeight) {
        if (!img || !ctx) {
            console.warn('⚠️ No se puede dibujar: contexto o imagen no válidos');
            return;
        }

        const sWidth = img.width;
        const sHeight = img.height;

        if (sWidth === 0 || sHeight === 0) {
            console.warn('⚠️ Imagen con dimensiones cero:', { sWidth, sHeight });
            return;
        }

        // Asegurarse de que las dimensiones de destino sean válidas
        if (dWidth <= 0 || dHeight <= 0) {
            console.warn('⚠️ Dimensiones de destino inválidas:', { dWidth, dHeight });
            return;
        }

        // Calcular relación de aspecto
        const dRatio = dWidth / dHeight;
        const sRatio = sWidth / sHeight;

        // Calcular el área de recorte (source) para mantener la relación de aspecto
        let sx, sy, sw, sh;

        if (dRatio > sRatio) {
            // La imagen es más ancha que el área de destino
            sw = sWidth;
            sh = sw / dRatio;
            sx = 0;
            sy = (sHeight - sh) / 2;
        } else {
            // La imagen es más alta que el área de destino
            sh = sHeight;
            sw = sh * dRatio;
            sx = (sWidth - sw) / 2;
            sy = 0;
        }

        try {
            // Dibujar la imagen con las coordenadas y dimensiones calculadas
            ctx.save();
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img,
                Math.max(0, sx),
                Math.max(0, sy),
                Math.min(sw, sWidth - sx),
                Math.min(sh, sHeight - sy),
                dx,
                dy,
                dWidth,
                dHeight
            );
            ctx.restore();
        } catch (e) {
            console.error('❌ Error al dibujar imagen:', e);
            console.error('Detalles:', {
                source: { x: sx, y: sy, width: sw, height: sh },
                dest: { x: dx, y: dy, width: dWidth, height: dHeight },
                imgSize: { width: sWidth, height: sHeight }
            });
        }
    }
    for (const page of pages) {
        try {
            const customCanvas = document.createElement('canvas');
            const customCtx = customCanvas.getContext('2d', { willReadFrequently: true });

            // Calcular dimensiones del canvas basadas en el workspace
            // Usar escala 1:1 para evitar problemas de redondeo
            customCanvas.width = workspaceDimensions.width;
            customCanvas.height = workspaceDimensions.height;

            // No aplicar escala aquí, manejaremos el escalado después
            customCtx.scale(1, 1);
            customCtx.imageSmoothingEnabled = true;
            customCtx.imageSmoothingQuality = 'high';
            customCtx.textRendering = 'geometricPrecision';
            customCtx.webkitImageSmoothingEnabled = true;
            customCtx.mozImageSmoothingEnabled = true;
            customCtx.msImageSmoothingEnabled = true;

            // --- Renderizar background layer igual que en el workspace ---
            let bgUrl = null;
            if (page.type === 'cover' && presetData?.cover_image) {
                bgUrl = presetData.cover_image.startsWith('http')
                    ? presetData.cover_image
                    : `/storage/images/item_preset/${presetData.cover_image}`;
            } else if (page.type === 'content' && presetData?.content_layer_image) {
                bgUrl = presetData.content_layer_image.startsWith('http')
                    ? presetData.content_layer_image
                    : `/storage/images/item_preset/${presetData.content_layer_image}`;
            } else if (page.type === 'final' && presetData?.final_layer_image) {
                bgUrl = presetData.final_layer_image.startsWith('http')
                    ? presetData.final_layer_image
                    : `/storage/images/item_preset/${presetData.final_layer_image}`;
            }

            // Si no hay fondo, usar blanco
            if (!bgUrl) {
                customCtx.fillStyle = '#ffffff';
                customCtx.fillRect(0, 0, workspaceDimensions.width, workspaceDimensions.height);
            }
            if (bgUrl) {
                const bgImg = new window.Image();
                bgImg.crossOrigin = 'anonymous';
                bgImg.src = bgUrl;
                await new Promise((resolve, reject) => {
                    if (bgImg.complete) return resolve();
                    bgImg.onload = resolve;
                    bgImg.onerror = reject;
                });
                drawImageCover(customCtx, bgImg, 0, 0, workspaceDimensions.width, workspaceDimensions.height);
            } else {
                // Si no hay background, fondo blanco
                customCtx.fillStyle = '#ffffff';
                customCtx.fillRect(0, 0, workspaceDimensions.width, workspaceDimensions.height);
            }
            console.log("AQUI LA PAGINA", page)
            // --- Fin background layer ---
            if (page.cells && Array.isArray(page.cells)) {
                // Ordenar celdas por posición (Y, luego X) para renderizado consistente
                const sortedCells = [...page.cells].sort((a, b) => {
                    const aY = a.position?.y || 0;
                    const bY = b.position?.y || 0;
                    if (aY !== bY) return aY - bY;
                    return (a.position?.x || 0) - (b.position?.x || 0);
                });

                for (const cell of sortedCells) {
                    if (!cell || !cell.elements) continue;

                    // Calcular dimensiones de la celda
                    const cellWidth = cell.size?.width || workspaceDimensions.width;
                    const cellHeight = cell.size?.height || workspaceDimensions.height;
                    const cellX = cell.position?.x || 0;
                    const cellY = cell.position?.y || 0;

                    if (!cell.size) {
                        console.warn('⚠️ cell.size no definido, usando tamaño workspace', cell);
                    }

                    // Ordenar elementos por zIndex
                    const sortedElements = [...(cell.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

                    for (const element of sortedElements) {
                        // Filtro robusto: ignorar imágenes base del layout (background duplicado)
                        if (
                            element.type === 'image' && (
                                element.id === 'cover-base' ||
                                element.id === 'final-base' ||
                                (typeof element.id === 'string' && element.id.startsWith('content-base-'))
                            )
                        ) {
                            continue;
                        }

                        // Solo renderizar elementos de tipo 'image' y 'text'
                        if (!element || (element.type !== 'image' && element.type !== 'text') || !element.content) continue;

                        if (element.type === 'image') {
                            try {
                                const img = new Image();
                                img.crossOrigin = 'anonymous';

                                // Cargar la imagen
                                await new Promise((resolve, reject) => {
                                    img.onload = resolve;
                                    img.onerror = reject;
                                    img.src = element.content;
                                });

                                // Calcular posición y tamaño relativos a la celda
                                // Las posiciones y tamaños pueden venir en píxeles o como fracción (0-1)
                                const isRelativeX = element.position?.x !== undefined && Math.abs(element.position.x) <= 1;
                                const isRelativeY = element.position?.y !== undefined && Math.abs(element.position.y) <= 1;
                                const isRelativeWidth = element.size?.width !== undefined && element.size.width <= 1;
                                const isRelativeHeight = element.size?.height !== undefined && element.size.height <= 1;

                                // Calcular posición absoluta en píxeles
                                const elX = isRelativeX ? element.position.x * cellWidth : (element.position?.x || 0);
                                const elY = isRelativeY ? element.position.y * cellHeight : (element.position?.y || 0);

                                // Calcular dimensiones en píxeles
                                const elW = isRelativeWidth ? element.size.width * cellWidth : (element.size?.width || cellWidth);
                                const elH = isRelativeHeight ? element.size.height * cellHeight : (element.size?.height || cellHeight);

                                // Posición absoluta en la página (ajustada por la posición de la celda)
                                const dx = cellX + elX;
                                const dy = cellY + elY;



                                // Dibujar la imagen con las coordenadas y dimensiones calculadas
                                drawImageCover(customCtx, img, dx, dy, elW, elH);

                            } catch (error) {
                                console.error('Error al cargar imagen:', error, element);
                            }
                        }
                    }
                }
            }
            // Crear el thumbnail con tamaño fijo manteniendo relación de aspecto
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailCtx = thumbnailCanvas.getContext('2d');

            // Tamaño máximo del thumbnail
            const maxThumbnailSize = 900;
            let thumbWidth, thumbHeight;

            // Calcular dimensiones manteniendo la relación de aspecto
            if (workspaceDimensions.width > workspaceDimensions.height) {
                thumbWidth = Math.min(maxThumbnailSize, workspaceDimensions.width);
                thumbHeight = (thumbWidth / workspaceDimensions.width) * workspaceDimensions.height;
            } else {
                thumbHeight = Math.min(maxThumbnailSize, workspaceDimensions.height);
                thumbWidth = (thumbHeight / workspaceDimensions.height) * workspaceDimensions.width;
            }

            // Asegurar valores enteros
            thumbWidth = Math.round(thumbWidth);
            thumbHeight = Math.round(thumbHeight);

            // Configurar canvas del thumbnail
            thumbnailCanvas.width = thumbWidth;
            thumbnailCanvas.height = thumbHeight;

            // Configurar calidad de renderizado
            thumbnailCtx.imageSmoothingEnabled = true;
            thumbnailCtx.imageSmoothingQuality = 'high';
            thumbnailCtx.webkitImageSmoothingEnabled = true;
            thumbnailCtx.mozImageSmoothingEnabled = true;
            thumbnailCtx.msImageSmoothingEnabled = true;

            // Dibujar el contenido escalado al tamaño del thumbnail
            thumbnailCtx.drawImage(
                customCanvas,
                0, 0, customCanvas.width, customCanvas.height,
                0, 0, thumbWidth, thumbHeight
            );

            // Convertir a base64
            newThumbnails[page.id] = thumbnailCanvas.toDataURL('image/png', 0.92);
        } catch (error) {
            console.error(`❌ Error generando thumbnail para página ${page.id}:`, error);
            newThumbnails[page.id] = null;
        }
    }
    return newThumbnails;
}

// 🔧 Función helper para revisar logs persistentes del PDF
window.checkPDFUploadLogs = function (projectId) {
    const logKey = `pdf_upload_log_${projectId}`;
    const logs = localStorage.getItem(logKey);
    if (logs) {
        console.log('📋 [PDF-LOGS] Logs encontrados para proyecto', projectId, ':', JSON.parse(logs));
        return JSON.parse(logs);
    } else {
        console.log('📋 [PDF-LOGS] No hay logs para proyecto', projectId);
        return null;
    }
};

// 🔧 Función helper para limpiar logs antiguos
window.clearPDFUploadLogs = function (projectId) {
    const logKey = `pdf_upload_log_${projectId}`;
    localStorage.removeItem(logKey);
    console.log('🧹 [PDF-LOGS] Logs limpiados para proyecto', projectId);
};

// 🔧 Función helper para test rápido de PDF
window.testPDFGeneration = function (force = false) {
    console.log('🧪 [TEST-PDF] Iniciando test de generación de PDF...');

    // Obtener el componente BookPreview actual
    const bookPreviewElement = document.querySelector('[data-component="book-preview"]');
    if (!bookPreviewElement) {
        console.error('❌ [TEST-PDF] No se encontró elemento BookPreview');
        return;
    }

    // Simular la generación del PDF (esto deberías hacerlo desde dentro del componente)
    console.log('🧪 [TEST-PDF] Para probar, agrega un proyecto al carrito o ejecuta desde dentro del componente');
    console.log('🧪 [TEST-PDF] ID del proyecto actual:', window.currentProjectId || 'No definido');
};

// --- FIN: Función exportable para thumbnails fieles ---

export { generateHighQualityThumbnails };
export default BookPreviewModal;
