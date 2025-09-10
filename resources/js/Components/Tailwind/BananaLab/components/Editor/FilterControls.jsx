import { useState, useEffect } from "react";
import { Sliders, Palette, Layers, Settings, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../UI/Button";
import Slider from "../UI/Slider";
import { FilterPresets } from "./FilterPresets";
import { AdvancedSettings } from "./AdvancedSettings";

export const FilterControls = ({ filters = {}, onFilterChange, selectedElement }) => {
    const [activeFilterTab, setActiveFilterTab] = useState("basic");
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        color: true,
        transform: false,
        advanced: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Default filter values - solo aplicar defaults para valores undefined
    const defaultFilters = {
        brightness: filters.brightness ?? 100,
        contrast: filters.contrast ?? 100,
        saturation: filters.saturation ?? 100,
        tint: filters.tint ?? 0,
        hue: filters.hue ?? 0,
        blur: filters.blur ?? 0,
        scale: filters.scale ?? 1,
        rotate: filters.rotate ?? 0,
        opacity: filters.opacity ?? 100,
        blendMode: filters.blendMode ?? "normal",
        flipHorizontal: filters.flipHorizontal ?? false,
        flipVertical: filters.flipVertical ?? false,
    };

    const updateFilter = (key, value) => {
        const newFilters = {
            ...defaultFilters,
            [key]: value
        };
        // console.log('🎨 [FilterControls] Actualizando filtro:', { key, value, newFilters });
        
        // 🚨 SOLUCIÓN CRÍTICA: Limpiar caché de thumbnails antes de aplicar el filtro
        if (window.FORCE_THUMBNAIL_REGENERATION) {
            // console.log('🧨 [EMERGENCIA] Limpiando caché y forzando regeneración por cambio en: ' + key);
            if (window.thumbnailCache) window.thumbnailCache = {};
        }
        
        // Llamar al callback original
        onFilterChange(newFilters);
        
        // 🚨 SOLUCIÓN CRÍTICA: Forzar regeneración después de aplicar el filtro
        if (window.FORCE_THUMBNAIL_REGENERATION && window.forceRegenerateThumbnail) {
            setTimeout(() => {
                // console.log('🚀 [EMERGENCIA] Ejecutando regeneración forzada después de cambio en: ' + key);
                try {
                    // Permitir explícitamente esta regeneración
                    if (window._allowNextRegeneration) {
                        window._allowNextRegeneration();
                    }
                    window.forceRegenerateThumbnail();
                    
                    // 🔒 BLOQUEO DEFINITIVO: Después de regenerar, activar protección permanente
                    setTimeout(() => {
                        if (window.lockThumbnailsForever) {
                            console.log('🔒 [AUTO-PROTECCIÓN] Activando bloqueo permanente después de regenerar');
                            window.lockThumbnailsForever();
                        }
                    }, 500);
                } catch (error) {
                    console.error('Error al regenerar thumbnail:', error);
                }
            }, 100);
        }
    };

    const resetFilters = () => {
        const resetValues = {
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
            flipHorizontal: false,
            flipVertical: false
        };
        
        // 🚨 SOLUCIÓN CRÍTICA: Limpiar caché al resetear filtros
        if (window.FORCE_THUMBNAIL_REGENERATION) {
            console.log('🧨 [EMERGENCIA-RESET] Limpiando caché y forzando regeneración al resetear todos los filtros');
            if (window.thumbnailCache) window.thumbnailCache = {};
        }
        
        // Aplicar cambios
        onFilterChange(resetValues);
        
        // 🚨 SOLUCIÓN CRÍTICA: Forzar regeneración tras reseteo
        if (window.FORCE_THUMBNAIL_REGENERATION && window.forceRegenerateThumbnail) {
            setTimeout(() => {
                console.log('🚀 [EMERGENCIA-RESET] Ejecutando regeneración forzada después de resetear filtros');
                try {
                    window.forceRegenerateThumbnail();
                } catch (error) {
                    console.error('Error al regenerar thumbnail después de reset:', error);
                }
            }, 100);
        }
    };    const filterTabs = [
        { id: "basic", label: "Básico", icon: Sliders },
        ...(selectedElement?.type === "image" ? [{ id: "presets", label: "Presets", icon: Palette }] : []),
        { id: "advanced", label: "Avanzado", icon: Settings }
    ];

    // Reset to basic tab if presets are not available and current tab is presets
    useEffect(() => {
        if (activeFilterTab === "presets" && selectedElement?.type !== "image") {
            setActiveFilterTab("basic");
        }
    }, [selectedElement?.type, activeFilterTab]);

    return (
        <div className="space-y-3">
            {/* Filter tabs - formato vertical compacto */}
            <div className="grid grid-cols-1 gap-1 bg-gray-100 rounded-lg p-1">
                {filterTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilterTab(tab.id)}
                            className={`flex items-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                                activeFilterTab === tab.id
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Reset button - más compacto */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-700">
                        {activeFilterTab === "basic" && "Básico"}
                        {activeFilterTab === "presets" && "Presets"}
                        {activeFilterTab === "advanced" && "Avanzado"}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-xs h-6 px-2"
                    icon={<RotateCcw className="h-3 w-3" />}
                >
                    Reset
                </Button>
            </div>

            {/* Filter content */}
            <div className="space-y-3">
                {activeFilterTab === "basic" && (
                    <div className="space-y-3">
                        {/* Basic adjustments */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-700">Ajustes básicos</span>
                                <button
                                    onClick={() => toggleSection("basic")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedSections.basic ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                            </div>
                            
                            {expandedSections.basic && (
                                <div className="space-y-2">
                                    <Slider
                                        label="Brillo"
                                        value={defaultFilters.brightness}
                                        onChange={(value) => updateFilter("brightness", value)}
                                        min={0}
                                        max={200}
                                        step={1}
                                        unit="%"
                                    />
                                    <Slider
                                        label="Contraste"
                                        value={defaultFilters.contrast}
                                        onChange={(value) => updateFilter("contrast", value)}
                                        min={0}
                                        max={200}
                                        step={1}
                                        unit="%"
                                    />
                                    <Slider
                                        label="Saturación"
                                        value={defaultFilters.saturation}
                                        onChange={(value) => updateFilter("saturation", value)}
                                        min={0}
                                        max={200}
                                        step={1}
                                        unit="%"
                                    />
                                    <Slider
                                        label="Opacidad"
                                        value={defaultFilters.opacity}
                                        onChange={(value) => updateFilter("opacity", value)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        unit="%"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Color adjustments */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-700">Color</span>
                                <button
                                    onClick={() => toggleSection("color")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedSections.color ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                            </div>
                            
                            {expandedSections.color && (
                                <div className="space-y-2">
                                    <Slider
                                        label="Matiz"
                                        value={defaultFilters.hue}
                                        onChange={(value) => updateFilter("hue", value)}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        unit="°"
                                    />
                                    <Slider
                                        label="Tinte sepia"
                                        value={defaultFilters.tint}
                                        onChange={(value) => updateFilter("tint", value)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        unit="%"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Transform */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-700">Transformar</span>
                                <button
                                    onClick={() => toggleSection("transform")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedSections.transform ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                            </div>
                            
                            {expandedSections.transform && (
                                <div className="space-y-2">
                                    <Slider
                                        label="Escala"
                                        value={defaultFilters.scale}
                                        onChange={(value) => updateFilter("scale", value)}
                                        min={0.1}
                                        max={3}
                                        step={0.1}
                                        unit="x"
                                    />
                                    <Slider
                                        label="Rotación"
                                        value={defaultFilters.rotate}
                                        onChange={(value) => updateFilter("rotate", value)}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        unit="°"
                                    />
                                    <Slider
                                        label="Desenfoque"
                                        value={defaultFilters.blur}
                                        onChange={(value) => updateFilter("blur", value)}
                                        min={0}
                                        max={20}
                                        step={0.5}
                                        unit="px"
                                    />
                                    
                                    {/* Flip controls */}
                                    <div className="grid grid-cols-2 gap-1">
                                        <Button
                                            variant={defaultFilters.flipHorizontal ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateFilter("flipHorizontal", !defaultFilters.flipHorizontal)}
                                            className="text-xs h-7"
                                        >
                                            Voltear H
                                        </Button>
                                        <Button
                                            variant={defaultFilters.flipVertical ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateFilter("flipVertical", !defaultFilters.flipVertical)}
                                            className="text-xs h-7"
                                        >
                                            Voltear V
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeFilterTab === "presets" && (
                    <FilterPresets
                        onSelectPreset={(presetFilters) => {
                            // 🚨 SOLUCIÓN CRÍTICA: Limpiar caché al aplicar presets
                            if (window.FORCE_THUMBNAIL_REGENERATION) {
                                console.log('🧨 [EMERGENCIA-PRESET] Limpiando caché y forzando regeneración al aplicar preset');
                                if (window.thumbnailCache) window.thumbnailCache = {};
                            }
                            
                            // Aplicar preset
                            onFilterChange({ ...defaultFilters, ...presetFilters });
                            
                            // 🚨 SOLUCIÓN CRÍTICA: Forzar regeneración tras aplicar preset
                            if (window.FORCE_THUMBNAIL_REGENERATION && window.forceRegenerateThumbnail) {
                                setTimeout(() => {
                                    console.log('🚀 [EMERGENCIA-PRESET] Ejecutando regeneración forzada después de aplicar preset');
                                    try {
                                        window.forceRegenerateThumbnail();
                                    } catch (error) {
                                        console.error('Error al regenerar thumbnail después de aplicar preset:', error);
                                    }
                                }, 100);
                            }
                        }}
                        selectedImage={selectedElement || null}
                    />
                )}

                {activeFilterTab === "advanced" && (
                    <AdvancedSettings
                        filters={defaultFilters}
                        onFilterChange={onFilterChange}
                        selectedElement={selectedElement}
                    />
                )}
            </div>
        </div>
    );
};

export default FilterControls;
