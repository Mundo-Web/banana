/**
 * Sistema de guardado para el editor de álbumes
 * Convierte imágenes base64 a archivos en el backend y guarda el progreso
 */

// Función para subir imagen base64 al backend
export const uploadImageToBackend = async (base64Data, elementId, projectId) => {
    try {
        console.log('📤 [SAVE] Subiendo imagen al backend:', elementId);
        
        // Extraer tipo de imagen y datos
        const [header, data] = base64Data.split(',');
        const mimeType = header.match(/data:image\/(\w+)/)?.[1] || 'png';

        
        const formData = new FormData();
        
        // Convertir base64 a blob
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: `image/${mimeType}` });
        
        formData.append('image', blob, `element_${elementId}.${mimeType}`);
        formData.append('project_id', projectId);
        formData.append('element_id', elementId);
        
        const response = await fetch(`/api/canvas/projects/upload-image`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Error al subir imagen al servidor');
        }
        
        const result = await response.json();
        console.log('✅ [SAVE] Imagen subida exitosamente:', result.url);
        return result.url;
        
    } catch (error) {
        console.error('❌ [SAVE] Error subiendo imagen:', error);
        throw error;
    }
};

// Función para procesar páginas y convertir imágenes base64 a URLs
export const processImagesForSave = async (pages, projectId) => {
    console.log('🔄 [SAVE] Procesando imágenes para guardado...');
    
    const processedPages = [];
    let totalImages = 0;
    let processedImages = 0;
    
    // Contar total de imágenes base64
    for (const page of pages) {
        for (const cell of page.cells || []) {
            for (const element of cell.elements || []) {
                if (element.type === 'image' && element.content?.startsWith('data:image/')) {
                    totalImages++;
                }
            }
        }
    }
    
    console.log(`📊 [SAVE] Total de imágenes base64 a procesar: ${totalImages}`);
    
    for (const page of pages) {
        const processedPage = { ...page };
        processedPage.cells = [];
        
        for (const cell of page.cells || []) {
            const processedCell = { ...cell };
            processedCell.elements = [];
            
            for (const element of cell.elements || []) {
                const processedElement = { ...element };
                
                
                if (element.type === 'image' && element.content?.startsWith('data:image/')) {
                    try {
                        // Subir imagen al backend
                        const imageUrl = await uploadImageToBackend(element.content, element.id, projectId);
                        processedElement.content = imageUrl;
                        processedElement.isUploaded = true;
                        processedImages++;
                        
                        console.log(`✅ [SAVE] Imagen ${processedImages}/${totalImages} procesada`);
                    } catch (error) {
                        console.error('❌ [SAVE] Error procesando imagen:', element.id, error);
                        // Mantener base64 como fallback
                        processedElement.uploadError = error.message;
                    }
                }
                
                processedCell.elements.push(processedElement);
            }
            
            processedPage.cells.push(processedCell);
        }
        
        processedPages.push(processedPage);
    }
    
    console.log(`✅ [SAVE] Procesamiento completado: ${processedImages}/${totalImages} imágenes subidas`);
    return processedPages;
};

// Función para guardar thumbnails como archivos
export const saveThumbnailsAsFiles = async (projectId, pageThumbnails) => {
    try {
        console.log(`🔍 [DEBUG] saveThumbnailsAsFiles llamada con:`, {
            projectId,
            thumbnailsCount: Object.keys(pageThumbnails).length
        });
        
        const thumbnailsToSave = [];
        
        for (const [pageId, thumbnailData] of Object.entries(pageThumbnails)) {
            console.log(`🔍 [DEBUG] Procesando thumbnail para página ${pageId}:`, {
                hasData: !!thumbnailData,
                isBase64: thumbnailData && thumbnailData.startsWith('data:image/'),
                dataLength: thumbnailData ? thumbnailData.length : 0
            });
            
            // Solo procesar thumbnails que son base64
            if (thumbnailData && thumbnailData.startsWith('data:image/')) {
                thumbnailsToSave.push({
                    page_id: pageId,
                    thumbnail_data: thumbnailData
                });
            }
        }
        
        if (thumbnailsToSave.length === 0) {
            console.log('ℹ️ [THUMBNAILS] No hay thumbnails base64 para guardar');
            return;
        }
        
        console.log(`🖼️ [THUMBNAILS] Guardando ${thumbnailsToSave.length} thumbnails como archivos...`);
        console.log(`🔍 [DEBUG] URL del endpoint: /api/thumbnails/${projectId}/save-as-files`);
        
        const response = await fetch(`/api/thumbnails/${projectId}/save-as-files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            credentials: 'include',
            body: JSON.stringify({ thumbnails: thumbnailsToSave })
        });
        
        console.log(`🔍 [DEBUG] Respuesta del servidor:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [THUMBNAILS] Error respuesta del servidor:', errorText);
            throw new Error(`Error al guardar thumbnails: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ [THUMBNAILS] Thumbnails guardados como archivos:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ [THUMBNAILS] Error guardando thumbnails:', error);
        throw error;
    }
};

// Función principal para guardar proyecto
export const saveProjectData = async (pages, projectData, itemData, presetData, workspaceDimensions, pageThumbnails, isAutoSave = false) => {
    try {
        if (!projectData?.id) {
            throw new Error('No se encontró el ID del proyecto');
        }
        
        console.log(`💾 [SAVE] Iniciando ${isAutoSave ? 'auto-guardado' : 'guardado manual'}...`);
        
        // Procesar imágenes si es guardado manual (subir al backend)
        let processedPages = pages;
        if (!isAutoSave) {
            processedPages = await processImagesForSave(pages, projectData.id);
        }
        
        // Preparar datos para enviar
        const saveData = {
            pages: processedPages,
            projectInfo: {
                id: projectData.id,
                item_id: itemData?.id,
                title: itemData?.title,
                preset_id: presetData?.id
            },
            workspace: {
                width: workspaceDimensions.width,
                height: workspaceDimensions.height,
                scale: workspaceDimensions.scale
            },
            meta: {
                savedAt: new Date().toISOString(),
                version: '2.0',
                isAutoSave: isAutoSave,
                totalPages: pages.length
            }
        };
        
        const endpoint = isAutoSave ? 'save-progress' : 'save';
        
        const response = await fetch(`/api/canvas/projects/${projectData.id}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                design_data: saveData,
                thumbnails: pageThumbnails 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al guardar el proyecto');
        }
        
        const result = await response.json();
        console.log(`✅ [SAVE] ${isAutoSave ? 'Auto-guardado' : 'Guardado'} exitoso:`, result);
        
        // Si es guardado manual y tenemos thumbnails, guardarlos como archivos
        if (!isAutoSave && pageThumbnails && Object.keys(pageThumbnails).length > 0) {
            console.log('🖼️ [SAVE] Guardando thumbnails como archivos...');
            try {
                await saveThumbnailsAsFiles(projectData.id, pageThumbnails);
                console.log('✅ [SAVE] Thumbnails guardados como archivos');
            } catch (error) {
                console.warn('⚠️ [SAVE] Error guardando thumbnails como archivos:', error);
            }
        }
        
        return { success: true, data: result };
        
    } catch (error) {
        console.error(`❌ [SAVE] Error en ${isAutoSave ? 'auto-guardado' : 'guardado'}:`, error);
        return { success: false, error: error.message };
    }
};
