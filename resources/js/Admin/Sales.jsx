import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import BaseAdminto from "@Adminto/Base";
import CreateReactScript from "../Utils/CreateReactScript";
import Table from "../Components/Adminto/Table";
import DxButton from "../Components/dx/DxButton";
import ReactAppend from "../Utils/ReactAppend";
import Swal from "sweetalert2";
import SalesRest from "../Actions/Admin/SalesRest";
import Global from "../Utils/Global";
import Number2Currency from "../Utils/Number2Currency";
import Modal from "../Components/Adminto/Modal";
import Tippy from "@tippyjs/react";
import SaleStatusesRest from "../Actions/Admin/SaleStatusesRest";
import SaleExportRest from "../Actions/Admin/SaleExportRest";
import * as XLSX from 'xlsx';
import SelectFormGroup from "../Components/Adminto/form/SelectFormGroup";
import { renderToString } from "react-dom/server";

const salesRest = new SalesRest();
const saleStatusesRest = new SaleStatusesRest();
const saleExportRest = new SaleExportRest();

const Sales = ({ statuses = [] }) => {
    const gridRef = useRef();
    const notifyClientRef = useRef()
    const modalRef = useRef();

    const [saleLoaded, setSaleLoaded] = useState(null);
    const [saleStatuses, setSaleStatuses] = useState([]);
    const [statusLoading, setStatusLoading] = useState(false);

    // Agregar estilos personalizados para el select
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .select2-container--default .select2-results__option {
                padding: 4px !important;
                background: white !important;
            }
            .select2-container--default .select2-results__option--highlighted[aria-selected] {
                background-color: #f8f9fa !important;
            }
            .select2-container--default .select2-results__option:hover {
                background-color: #f8f9fa !important;
            }
            .select2-container--default .select2-selection--single {
                border: 1px solid #e3ebf0 !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const onStatusChange = async (e, sale) => {
        console.log({ sale, saleLoaded })
        const status = statuses.find((s) => s.id == e.target.value)
        if (status.reversible == 0) {
            const { isConfirmed } = await Swal.fire({
                title: "Cambiar estado",
                text: `¿Estas seguro de cambiar el estado a ${status.name}?\nEsta acción no se puede revertir`,
                icon: "warning",
                showCancelButton: true,
            })
            if (!isConfirmed) return;
        }

        setStatusLoading(true)
        const result = await salesRest.save({
            id: sale.id,
            status_id: status.id,
            notify_client: notifyClientRef.current.checked
        });
        setStatusLoading(false)
        if (!result) return;

        const newSale = await salesRest.get(sale.id);
        setSaleLoaded(newSale.data);

        // Cargar el historial de estados usando la nueva API
        const statusHistory = await saleStatusesRest.bySale(sale.id);
        if (statusHistory) {
            setSaleStatuses(statusHistory);
        } else {
            setSaleStatuses([]);
        }

        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onDeleteClicked = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: "Anular pedido",
            text: "¿Estas seguro de anular este pedido?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si, anular",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;
        const result = await salesRest.delete(id);
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onModalOpen = async (saleId) => {
        notifyClientRef.current.checked = true
        const newSale = await salesRest.get(saleId);
        console.log("Sale data loaded:", newSale.data); // Debug: ver todos los datos que llegan
        console.log("Status data:", newSale.data.status); // Debug: ver estado específico
        console.log("Status reversible:", newSale.data.status?.reversible); // Debug: ver reversible
        console.log("All statuses:", statuses); // Debug: ver todos los estados disponibles
        setSaleLoaded(newSale.data);

        // Cargar el historial de estados usando la nueva API
        const statusHistory = await saleStatusesRest.bySale(saleId);
        if (statusHistory) {
            setSaleStatuses(statusHistory);
        } else {
            setSaleStatuses([]);
        }

        $(modalRef.current).modal("show");
    };

    const [exportFilters, setExportFilters] = useState({
        startDate: '',
        endDate: '',
        status: ''
    });

    const showExportModal = () => {
        Swal.fire({
            title: '<div style="display: flex; align-items: center; justify-content: center; gap: 12px; color: #2c3e50;"><i class="fas fa-file-excel" style="color: #1e7e34; font-size: 28px;"></i><span style="font-weight: 600;">Exportar Ventas a Excel</span></div>',
            html: `
                <div style="padding: 25px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
                    
                   
                    
                    <!-- Formulario de Fechas -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
                        
                        <!-- Fecha Inicio -->
                        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border-left: 4px solid #28a745;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #495057; font-size: 14px;">
                                <i class="fas fa-play-circle" style="color: #28a745; margin-right: 8px;"></i>
                                Fecha de Inicio
                            </label>
                            <input 
                                type="date" 
                                id="startDate" 
                                style="
                                    width: 100%; 
                                    padding: 12px 16px; 
                                    border: 2px solid #e9ecef; 
                                    border-radius: 8px; 
                                    font-size: 14px; 
                                    transition: all 0.3s ease;
                                    background: #ffffff;
                                    color: #495057;
                                    font-family: inherit;
                                " 
                                onFocus="this.style.borderColor='#28a745'; this.style.boxShadow='0 0 0 3px rgba(40, 167, 69, 0.15)'; this.style.transform='translateY(-1px)'"
                                onBlur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.style.transform='translateY(0)'"
                            >
                        </div>
                        
                        <!-- Fecha Fin -->
                        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border-left: 4px solid #dc3545;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #495057; font-size: 14px;">
                                <i class="fas fa-stop-circle" style="color: #dc3545; margin-right: 8px;"></i>
                                Fecha de Fin
                            </label>
                            <input 
                                type="date" 
                                id="endDate" 
                                style="
                                    width: 100%; 
                                    padding: 12px 16px; 
                                    border: 2px solid #e9ecef; 
                                    border-radius: 8px; 
                                    font-size: 14px; 
                                    transition: all 0.3s ease;
                                    background: #ffffff;
                                    color: #495057;
                                    font-family: inherit;
                                " 
                                onFocus="this.style.borderColor='#dc3545'; this.style.boxShadow='0 0 0 3px rgba(220, 53, 69, 0.15)'; this.style.transform='translateY(-1px)'"
                                onBlur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.style.transform='translateY(0)'"
                            >
                        </div>
                    </div>
                    
                  
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-file-excel"></i> Exportar Excel',
            cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            width: '650px',
            preConfirm: () => {
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;

                // Validación básica
                if (startDate && endDate && startDate > endDate) {
                    Swal.showValidationMessage('La fecha de inicio no puede ser mayor a la fecha fin');
                    return false;
                }

                return {
                    startDate,
                    endDate,
                    status: '' // Siempre vacío ya que no hay filtro de estado
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const filters = result.value;
                exportToExcel(filters);
            }
        });
    };

    const exportToExcel = async (filters = {}) => {
        try {
            // Mostrar indicador de carga
            Swal.fire({
                title: 'Exportando datos...',
                text: 'Por favor espere mientras se preparan los datos para exportación',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Preparar parámetros para la consulta
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.status) params.append('status', filters.status);

            // Obtener datos completos desde el controlador especializado
            const url = `/api/admin/sales/export-data${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al obtener los datos');
            }

            const salesData = data.data;

            if (salesData.length === 0) {
                Swal.fire({
                    title: "Sin datos",
                    text: `No hay ventas para exportar con los filtros seleccionados.
                           ${filters.startDate ? `\nFecha inicio: ${filters.startDate}` : ''}
                           ${filters.endDate ? `\nFecha fin: ${filters.endDate}` : ''}
                           ${filters.status ? `\nEstado filtrado: ${saleStatuses.find(s => s.id == filters.status)?.name || 'Desconocido'}` : ''}`,
                    icon: "info"
                });
                return;
            }

            // Formatear datos para Excel
            const excelData = salesData.map(sale => ({
                'ID_PEDIDO': sale.correlative_code,
                'FECHA': sale.created_at,
                'ESTADO': sale.status_name,
                'CLIENTE_NOMBRES': sale.fullname,
                'CLIENTE_EMAIL': sale.email,
                'CLIENTE_TELEFONO': sale.phone,
                'TIPO_DOCUMENTO': sale.document_type,
                'NUMERO_DOCUMENTO': sale.document,
                'RAZON_SOCIAL': sale.business_name,
                'TIPO_COMPROBANTE': sale.invoice_type,
                'METODO_PAGO': sale.payment_method,
                'ID_TRANSACCION': sale.culqi_charge_id,
                'ESTADO_PAGO': sale.payment_status,
                'TIPO_ENTREGA': sale.delivery_type,
                'DIRECCION_ENTREGA': sale.full_address,
                'TIENDA_RETIRO': sale.store_name,
                'DIRECCION_TIENDA': sale.store_address,
                'TELEFONO_TIENDA': sale.store_phone,
                'HORARIO_TIENDA': sale.store_schedule,
                'REFERENCIA': sale.reference,
                'COMENTARIO': sale.comment,
                'UBIGEO': sale.ubigeo,
                'PRODUCTOS': sale.products_formatted,
                'CANTIDAD_PRODUCTOS': sale.products_count,
                'CANTIDAD_TOTAL': sale.products_total_quantity,
                'SUBTOTAL': sale.subtotal,
                'COSTO_ENVIO': sale.delivery_cost,
                'DESCUENTO_PAQUETE': sale.bundle_discount,
                'DESCUENTO_RENOVACION': sale.renewal_discount,
                'DESCUENTO_CUPON': sale.coupon_discount,
                'CODIGO_CUPON': sale.coupon_code,
                'DESCUENTO_PROMOCION': sale.promotion_discount,
                'PROMOCIONES_APLICADAS': sale.applied_promotions,
                'TOTAL_FINAL': sale.total_amount
            }));

            // Crear libro de Excel
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Configurar ancho de columnas optimizado
            const columnWidths = [
                { wch: 15 }, // ID_PEDIDO
                { wch: 18 }, // FECHA
                { wch: 12 }, // ESTADO
                { wch: 25 }, // CLIENTE_NOMBRES
                { wch: 30 }, // CLIENTE_EMAIL
                { wch: 15 }, // CLIENTE_TELEFONO
                { wch: 15 }, // TIPO_DOCUMENTO
                { wch: 15 }, // NUMERO_DOCUMENTO
                { wch: 30 }, // RAZON_SOCIAL
                { wch: 15 }, // TIPO_COMPROBANTE
                { wch: 15 }, // METODO_PAGO
                { wch: 20 }, // ID_TRANSACCION
                { wch: 15 }, // ESTADO_PAGO
                { wch: 15 }, // TIPO_ENTREGA
                { wch: 50 }, // DIRECCION_ENTREGA
                { wch: 25 }, // TIENDA_RETIRO
                { wch: 30 }, // DIRECCION_TIENDA
                { wch: 15 }, // TELEFONO_TIENDA
                { wch: 20 }, // HORARIO_TIENDA
                { wch: 20 }, // REFERENCIA
                { wch: 30 }, // COMENTARIO
                { wch: 10 }, // UBIGEO
                { wch: 60 }, // PRODUCTOS
                { wch: 10 }, // CANTIDAD_PRODUCTOS
                { wch: 10 }, // CANTIDAD_TOTAL
                { wch: 12 }, // SUBTOTAL
                { wch: 12 }, // COSTO_ENVIO
                { wch: 15 }, // DESCUENTO_PAQUETE
                { wch: 18 }, // DESCUENTO_RENOVACION
                { wch: 15 }, // DESCUENTO_CUPON
                { wch: 15 }, // CODIGO_CUPON
                { wch: 18 }, // DESCUENTO_PROMOCION
                { wch: 40 }, // PROMOCIONES_APLICADAS
                { wch: 12 }  // TOTAL_FINAL
            ];

            worksheet['!cols'] = columnWidths;

            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas_Facturacion');

            // Generar nombre del archivo con información de filtros
            let filename = 'ventas_facturacion';
            if (filters.startDate || filters.endDate) {
                filename += '_' + (filters.startDate || 'inicio') + '_al_' + (filters.endDate || 'fin');
            }
            if (filters.status) {
                const statusName = saleStatuses.find(s => s.id == filters.status)?.name || 'estado';
                filename += '_' + statusName.toLowerCase().replace(/\s+/g, '_');
            }
            filename += '_' + moment().format('YYYY-MM-DD_HH-mm') + '.xlsx';

            // Descargar archivo
            XLSX.writeFile(workbook, filename);

            // Mostrar mensaje de éxito con estadísticas detalladas
            let filterInfo = '';
            if (filters.startDate) filterInfo += `\n📅 Desde: ${filters.startDate}`;
            if (filters.endDate) filterInfo += `\n📅 Hasta: ${filters.endDate}`;
            if (filters.status) {
                const statusName = saleStatuses.find(s => s.id == filters.status)?.name;
                filterInfo += `\n📊 Estado: ${statusName}`;
            }

            Swal.fire({
                title: '<div style="display: flex; align-items: center; justify-content: center; gap: 12px; color: #155724;"><i class="fas fa-check-circle" style="color: #28a745; font-size: 28px;"></i><span style="font-weight: 600;">¡Exportación Exitosa!</span></div>',
                html: `
                    <div style="
                        background: linear-gradient(135deg, #d4edda 0%, #f8f9fa 100%);
                        border-radius: 16px;
                        padding: 25px;
                        margin: 20px 0;
                        border-left: 5px solid #28a745;
                        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.15);
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    ">
                        <!-- Estadísticas principales -->
                        <div style="
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 20px; 
                            margin-bottom: 20px;
                        ">
                            <!-- Total exportado -->
                            <div style="
                                background: white;
                                padding: 18px;
                                border-radius: 12px;
                                text-align: center;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                                border-top: 3px solid #17a2b8;
                            ">
                                <div style="color: #17a2b8; font-size: 24px; margin-bottom: 8px;">
                                    <i class="fas fa-chart-bar"></i>
                                </div>
                                <div style="font-size: 28px; font-weight: bold; color: #2c3e50; margin-bottom: 4px;">
                                    ${salesData.length}
                                </div>
                                <div style="font-size: 13px; color: #6c757d; font-weight: 500;">
                                    Ventas Exportadas
                                </div>
                            </div>
                            
                            <!-- Archivo generado -->
                            <div style="
                                background: white;
                                padding: 18px;
                                border-radius: 12px;
                                text-align: center;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                                border-top: 3px solid #28a745;
                            ">
                                <div style="color: #28a745; font-size: 24px; margin-bottom: 8px;">
                                    <i class="fas fa-file-excel"></i>
                                </div>
                                <div style="font-size: 12px; font-weight: bold; color: #2c3e50; margin-bottom: 4px; word-break: break-all;">
                                    ${filename}
                                </div>
                                <div style="font-size: 13px; color: #6c757d; font-weight: 500;">
                                    Archivo Excel
                                </div>
                            </div>
                        </div>
                        
                        ${filterInfo ? `
                        <!-- Información de filtros -->
                        <div style="
                            background: white;
                            padding: 18px;
                            border-radius: 12px;
                            border-left: 4px solid #ffc107;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        ">
                            <div style="
                                display: flex; 
                                align-items: center; 
                                margin-bottom: 12px;
                                color: #856404;
                                font-weight: 600;
                                font-size: 15px;
                            ">
                                <i class="fas fa-filter" style="margin-right: 10px; color: #ffc107;"></i>
                                Filtros Aplicados
                            </div>
                            <div style="
                                font-size: 14px; 
                                color: #495057; 
                                line-height: 1.6;
                                background: #fff8e1;
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid #ffeaa7;
                            ">
                                ${filterInfo.replace(/\n/g, '<br/>')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <!-- Mensaje de confirmación -->
                        <div style="
                            text-align: center;
                            margin-top: 20px;
                            padding: 15px;
                            background: rgba(40, 167, 69, 0.1);
                            border-radius: 10px;
                            border: 1px solid rgba(40, 167, 69, 0.2);
                        ">
                            <div style="color: #155724; font-size: 15px; font-weight: 500;">
                                <i class="fas fa-download" style="margin-right: 8px;"></i>
                                El archivo se ha descargado exitosamente
                            </div>
                        </div>
                    </div>
                `,
                icon: "success",
                confirmButtonText: '<i class="fas fa-thumbs-up"></i> ¡Perfecto!',
                confirmButtonColor: '#28a745',
                timer: 8000,
                timerProgressBar: true,
                width: '700px'
            });

        } catch (error) {
            console.error('Error al exportar:', error);
            Swal.fire({
                title: "Error en la exportación",
                text: error.message || "No se pudo exportar los datos. Intente nuevamente.",
                icon: "error"
            });
        }
    };

    useEffect(() => {
        if (!saleLoaded) return
        saleStatusesRest.bySale(saleLoaded.id).then((data) => {
            if (data) setSaleStatuses(data)
            else setSaleStatuses([])
        })
    }, [saleLoaded]);

    const statusTemplate = (e) => {
        const data = $(e.element).data('status')
        if (!e.id) return

        const baseColor = data?.color || "#333";
        const element = $(renderToString(
            <span
                title={data?.description || ''}
                className="d-flex align-items-center"
                style={{
                    color: baseColor,
                    padding: "4px 8px",
                    fontSize: "14px",
                    fontWeight: "500"
                }}
            >
                <i
                    className={`${data?.icon || 'mdi mdi-circle'} me-2`}
                    style={{
                        color: baseColor,
                        fontSize: "12px"
                    }}
                ></i>
                {e.text}
            </span>
        ));

        return element;
    }

    const subtotalReal = saleLoaded?.details?.reduce((sum, detail) => sum + (detail.price * detail.quantity), 0) || 0;

    // El subtotalReal ya incluye IGV, necesitamos extraer el subtotal sin IGV
    const subtotalWithoutIGV = parseFloat((subtotalReal / 1.18).toFixed(2));

    // Calcular subtotal sin IGV después de descuentos
    const totalDiscounts = Number(saleLoaded?.promotion_discount || 0) +
        Number(saleLoaded?.coupon_discount || 0) +
        Number(saleLoaded?.bundle_discount || 0) +
        Number(saleLoaded?.renewal_discount || 0);

    const subtotalAfterDiscounts = Math.max(0, subtotalWithoutIGV - totalDiscounts);

    // Calcular IGV (18% sobre subtotal después de descuentos)
    const igvAmount = parseFloat((subtotalAfterDiscounts * 0.18).toFixed(2));

    // Calcular total final: subtotal después de descuentos + IGV + envío
    const totalAmount = parseFloat((subtotalAfterDiscounts + igvAmount + Number(saleLoaded?.delivery || 0)).toFixed(2));

    return (
        <>

            <Table
                gridRef={gridRef}
                title="Pedidos"
                rest={salesRest}
                toolBar={(container) => {
                    container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "exportxlsx",
                            text: "Exportar para Facturación",
                            hint: "Exportar datos completos para facturador",
                            onClick: showExportModal,
                            type: "normal",
                            stylingMode: "outlined"
                        },
                    });
                    container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "refresh",
                            hint: "Refrescar tabla",
                            onClick: () =>
                                $(gridRef.current)
                                    .dxDataGrid("instance")
                                    .refresh(),
                        },
                    });
                }}
                columns={[
                    {
                        dataField: "id",
                        caption: "ID",
                        visible: false,
                    },
                    {
                        dataField: "name",
                        caption: "Orden",
                        width: "250px",
                        cellTemplate: (container, { data }) => {
                            container.css("cursor", "pointer");
                            container.on("click", () => {
                                onModalOpen(data.id);
                            });
                            ReactAppend(
                                container,
                                <p className="mb-0" style={{ width: "100%" }}>
                                    <b className="d-block">
                                        {data.name} {data.lastname}
                                    </b>
                                    <small
                                        className="text-nowrap text-muted"
                                        style={{
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitBoxOrient: "vertical",
                                            WebkitLineClamp: 2,
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        #{Global.APP_CORRELATIVE}-{data.code}
                                    </small>
                                </p>
                            );
                        },
                    },
                    {
                        dataField: "created_at",
                        caption: "Fecha",
                        dataType: "date",
                        sortOrder: "desc",
                        cellTemplate: (container, { data }) => {
                            // container.text(moment(data.created_at).fromNow())
                            container.text(moment(data.created_at).subtract(5, 'hours').format("LLL"));
                        },
                    },
                    {
                        dataField: "status.name",
                        caption: "Estado",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <span
                                    className="badge rounded-pill"
                                    style={{
                                        backgroundColor: data.status.color
                                            ? `${data.status.color}2e`
                                            : "#3333332e",
                                        color: data.status.color ?? "#333",
                                    }}
                                >
                                    {data.status.name}
                                </span>
                            );
                        },
                    },

                    {
                        dataField: "amount",
                        caption: "Total",
                        dataType: "number",
                        cellTemplate: (container, { data }) => {

                            container.text(`S/. ${Number2Currency(data?.amount)}`);
                        },
                    },
                    {
                        caption: "Acciones",
                        cellTemplate: (container, { data }) => {
                            container.append(
                                DxButton({
                                    className: "btn btn-xs btn-light",
                                    title: "Ver pedido",
                                    icon: "fa fa-eye",
                                    onClick: () => onModalOpen(data.id),
                                })
                            );
                            container.append(
                                DxButton({
                                    className: "btn btn-xs btn-soft-danger",
                                    title: "Anular pedido",
                                    icon: "fa fa-trash",
                                    onClick: () => onDeleteClicked(data.id),
                                })
                            );
                        },
                        allowFiltering: false,
                        allowExporting: false,
                    },
                ]}
            />
            <Modal
                modalRef={modalRef}
                title={`Detalles del pedido #${Global.APP_CORRELATIVE}-${saleLoaded?.code}`}
                size="xl"
                bodyStyle={{
                    backgroundColor: "#ebeff2",
                }}
                hideButtonSubmit
            >
                <div className="row">
                    <div className="col-md-8">
                        <div className="card">
                            <div className="card-header p-2">
                                <h5 className="card-title mb-0">
                                    Detalles de Venta
                                </h5>
                            </div>
                            <div className="card-body p-2">
                                <table className="table table-borderless table-sm mb-0">
                                    <tbody>
                                        {saleLoaded?.payment_method && (
                                            <tr>
                                                <th>Método de pago:</th>
                                                <td>{saleLoaded?.payment_method}</td>
                                            </tr>
                                        )}
                                        {saleLoaded?.culqi_charge_id && (
                                            <tr>
                                                <th>ID de transacción:</th>
                                                <td>{saleLoaded?.culqi_charge_id}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <th>Nombres:</th>
                                            <td>{saleLoaded?.fullname}</td>
                                        </tr>
                                        <tr>
                                            <th>Email:</th>
                                            <td>{saleLoaded?.email}</td>
                                        </tr>
                                        <tr>
                                            <th>Teléfono:</th>
                                            <td>{saleLoaded?.phone}</td>
                                        </tr>
                                        {(saleLoaded?.document_type || saleLoaded?.documentType) && (
                                            <tr>
                                                <th>Tipo de documento:</th>
                                                <td>{saleLoaded?.document_type || saleLoaded?.documentType}</td>
                                            </tr>
                                        )}
                                        {saleLoaded?.document && (
                                            <tr>
                                                <th>Número de documento:</th>
                                                <td>{saleLoaded?.document}</td>
                                            </tr>
                                        )}

                                        {saleLoaded?.delivery_type && (
                                            <tr>
                                                <th>Tipo de entrega:</th>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {saleLoaded?.delivery_type === 'store_pickup' ? 'Retiro en Tienda' :
                                                            saleLoaded?.delivery_type === 'free' ? 'Envío Gratis' :
                                                                saleLoaded?.delivery_type === 'express' ? 'Envío Express' :
                                                                    saleLoaded?.delivery_type === 'standard' ? 'Envío Estándar' :
                                                                        saleLoaded?.delivery_type === 'agency' ? 'Entrega en Agencia' :
                                                                            saleLoaded?.delivery_type}
                                                    </span>
                                                </td>
                                            </tr>
                                        )}

                                        {saleLoaded?.delivery_type === 'store_pickup' && saleLoaded?.store && (
                                            <tr>
                                                <th>Tienda para retiro:</th>
                                                <td>
                                                    <strong>{saleLoaded?.store?.name}</strong>
                                                    <small className="text-muted d-block">
                                                        {saleLoaded?.store?.address}
                                                        {saleLoaded?.store?.district && (
                                                            <>, {saleLoaded?.store?.district}</>
                                                        )}
                                                        {saleLoaded?.store?.province && (
                                                            <>, {saleLoaded?.store?.province}</>
                                                        )}
                                                    </small>
                                                    {saleLoaded?.store?.phone && (
                                                        <small className="text-info d-block">
                                                            📞 {saleLoaded?.store?.phone}
                                                        </small>
                                                    )}
                                                    {saleLoaded?.store?.schedule && (
                                                        <small className="text-success d-block">
                                                            🕒 {saleLoaded?.store?.schedule}
                                                        </small>
                                                    )}
                                                </td>
                                            </tr>
                                        )}

                                        {saleLoaded?.delivery_type && saleLoaded?.delivery_type !== 'store_pickup' && (
                                            <tr>
                                                <th>Dirección de entrega:</th>
                                                <td>
                                                    {saleLoaded?.address}{" "}
                                                    {saleLoaded?.number}
                                                    <small className="text-muted d-block">
                                                        {saleLoaded?.district},{" "}
                                                        {saleLoaded?.province},{" "}
                                                        {saleLoaded?.department}
                                                        , {saleLoaded?.country}{" "}
                                                        {saleLoaded?.zip_code && (
                                                            <>
                                                                -{" "}
                                                                {
                                                                    saleLoaded?.zip_code
                                                                }
                                                            </>
                                                        )}
                                                    </small>
                                                </td>
                                            </tr>
                                        )}

                                        {saleLoaded?.reference && (
                                            <tr>
                                                <th>Referencia:</th>
                                                <td>{saleLoaded?.reference}</td>
                                            </tr>
                                        )}

                                        {saleLoaded?.comment && (
                                            <tr>
                                                <th>Comentario:</th>
                                                <td>{saleLoaded?.comment}</td>
                                            </tr>
                                        )}

                                        {saleLoaded?.coupon_code && (
                                            <tr>
                                                <th>Cupón aplicado:</th>
                                                <td>
                                                    <span className="badge bg-success">
                                                        {saleLoaded?.coupon_code}
                                                    </span>
                                                    <small className="text-success d-block">
                                                        Descuento: S/ {Number2Currency(saleLoaded?.coupon_discount || 0)}
                                                    </small>
                                                </td>
                                            </tr>
                                        )}

                                        {/* Mostrar descuentos automáticos si existen */}
                                        {(saleLoaded?.applied_promotions || saleLoaded?.promotion_discount > 0) && (
                                            <tr>
                                                <th>Promociones automáticas:</th>
                                                <td>
                                                    {saleLoaded?.applied_promotions && (() => {
                                                        try {
                                                            const promotions = typeof saleLoaded.applied_promotions === 'string'
                                                                ? JSON.parse(saleLoaded.applied_promotions)
                                                                : saleLoaded.applied_promotions;

                                                            if (Array.isArray(promotions) && promotions.length > 0) {
                                                                return promotions.map((promo, index) => (
                                                                    <div key={index} className="mb-2">
                                                                        <span className="badge bg-primary me-2">
                                                                            {promo.rule_name || promo.name || 'Promoción automática'}
                                                                        </span>
                                                                        <small className="text-primary d-block">
                                                                            {promo.description || 'Descuento por promoción especial'}
                                                                        </small>
                                                                        <small className="text-success d-block">
                                                                            Descuento: S/ {Number2Currency(promo.discount_amount || promo.amount || 0)}
                                                                        </small>
                                                                        {promo.free_items && promo.free_items.length > 0 && (
                                                                            <small className="text-info d-block">
                                                                                Productos gratis: {promo.free_items.map(item => item.name || item.item_name).join(', ')}
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                ));
                                                            }
                                                        } catch (e) {
                                                            console.error('Error parsing applied_promotions:', e);
                                                            return null;
                                                        }
                                                    })()}

                                                    {saleLoaded?.promotion_discount > 0 && (
                                                        <div className="mt-2 pt-2 border-top">
                                                            <strong className="text-primary">
                                                                Total descuentos automáticos: S/ {Number2Currency(saleLoaded?.promotion_discount || 0)}
                                                            </strong>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}

                                        {saleLoaded?.invoiceType && (
                                            <tr>
                                                <th>{saleLoaded?.invoiceType}:</th>
                                                <td>{saleLoaded?.documentType} - {saleLoaded?.document} <br></br> {saleLoaded?.document && (saleLoaded?.businessName)}</td>
                                            </tr>
                                        )}

                                        {saleLoaded?.payment_proof && (
                                            <tr>
                                                <th>Comprobante de pago:</th>
                                                <td>
                                                    <Tippy
                                                        content="Ver comprobante de pago"
                                                        placement="top"
                                                    >
                                                        <a
                                                            href={`/storage/images/sale/${saleLoaded?.payment_proof}`}
                                                            target="_blank"
                                                        >
                                                            <img
                                                                src={`/storage/images/sale/${saleLoaded?.payment_proof}`}
                                                                alt="Comprobante de pago"
                                                                className="img-thumbnail"
                                                                style={{
                                                                    maxWidth:
                                                                        "150px",
                                                                    cursor: "pointer",
                                                                }}
                                                            />
                                                        </a>
                                                    </Tippy>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header p-2">
                                <h5 className="card-title mb-0">Artículos</h5>
                            </div>
                            <div className="card-body p-2 table-responsive">
                                <table className="table table-striped table-bordered table-sm table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th className="w-20">Imagen</th>
                                            <th>Nombre</th>
                                            <th>Precio</th>
                                            <th>Cantidad</th>
                                            <th>Subtotal</th>
                                            <th>PDF</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleLoaded?.details?.map(
                                            (detail, index) => {
                                                const quantity =
                                                    (detail.quantity * 100) /
                                                    100;
                                                const totalPrice =
                                                    detail.price *
                                                    detail.quantity;
                                                return (
                                                    <tr key={index}>
                                                        <td className="max-w-20 p-0">
                                                            {detail.image ? (
                                                                <img
                                                                    className="object-scale-down mx-auto block"
                                                                    src={`/storage/images/item/${detail.image}`}
                                                                    alt={detail.name}
                                                                    style={{
                                                                        height: '5rem',
                                                                        width: '5rem',
                                                                        objectFit: 'scale-down',
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </td>
                                                        <td>
                                                            {detail.name}
                                                        </td>
                                                        <td align="right">
                                                            <span className="text-nowrap">
                                                                S/{" "}
                                                                {Number2Currency(
                                                                    detail.price
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td align="center">
                                                            {quantity}
                                                        </td>
                                                        <td align="right">
                                                            <span className="text-nowrap">
                                                                S/{" "}
                                                                {Number2Currency(
                                                                    totalPrice
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td align="center">
                                                            {(() => {
                                                                // Debug: Mostrar los datos que tenemos
                                                                console.log("🔍 Debug PDF - Detail data:", {
                                                                    item_id: detail.item_id,
                                                                    colors: detail.colors,
                                                                    name: detail.name
                                                                });

                                                                // Buscar project_id en colors (para álbumes personalizados)
                                                                let projectId = null;
                                                                let colorData = null;

                                                                if (detail.colors) {
                                                                    try {
                                                                        // Si colors es JSON, parsearlo
                                                                        if (detail.colors.startsWith('{') || detail.colors.startsWith('[')) {
                                                                            colorData = JSON.parse(detail.colors);
                                                                            projectId = colorData.project_id || colorData.canvas_project_id;
                                                                            console.log("🎨 Debug - Parsed colors:", colorData);
                                                                        } else {
                                                                            // Si colors es string simple y parece ser un UUID, usarlo como project_id
                                                                            if (detail.colors.length > 10 && detail.colors.includes('-')) {
                                                                                projectId = detail.colors;
                                                                                console.log("🎨 Debug - Using colors as project_id:", projectId);
                                                                            }
                                                                        }
                                                                    } catch (e) {
                                                                        console.warn("⚠️ Error parsing colors:", e);
                                                                        // Si no es JSON válido pero parece UUID, usarlo
                                                                        if (detail.colors.length > 10 && detail.colors.includes('-')) {
                                                                            projectId = detail.colors;
                                                                        }
                                                                    }
                                                                }

                                                                console.log("🆔 Debug - Final project_id:", projectId);

                                                                // Si tenemos project_id y es diferente del item_id, es un álbum personalizado
                                                                if (projectId && projectId !== detail.item_id && projectId !== 'null') {
                                                                    return (
                                                                        <a
                                                                            href={`/storage/images/pdf/${projectId}/${projectId}.pdf`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                                                                            title={`Descargar PDF personalizado (ID: ${projectId})`}
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '30px'
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                console.log("🔗 Intentando abrir PDF personalizado:", projectId);

                                                                                // Verificar si el archivo del proyecto existe
                                                                                const checkUrl = `/storage/images/pdf/${projectId}/${projectId}.pdf`;
                                                                                fetch(checkUrl, { method: 'HEAD' })
                                                                                    .then(response => {
                                                                                        console.log("📁 Response para PDF personalizado:", response.status);
                                                                                        if (response.ok) {
                                                                                            // Si existe, abrir el PDF del proyecto
                                                                                            window.open(checkUrl, '_blank');
                                                                                        } else {
                                                                                            console.log("❌ PDF personalizado no encontrado, intentando con item_id:", detail.item_id);
                                                                                            // Si no existe, intentar con item_id
                                                                                            const fallbackUrl = `/storage/images/pdf/${detail.item_id}/${detail.item_id}.pdf`;
                                                                                            fetch(fallbackUrl, { method: 'HEAD' })
                                                                                                .then(fallbackResponse => {
                                                                                                    console.log("📁 Response para PDF template:", fallbackResponse.status);
                                                                                                    if (fallbackResponse.ok) {
                                                                                                        window.open(fallbackUrl, '_blank');
                                                                                                    } else {
                                                                                                        Swal.fire({
                                                                                                            title: 'PDF no encontrado',
                                                                                                            html: `
                                                                                                                <p>El archivo PDF para este álbum no está disponible.</p>
                                                                                                                <br>
                                                                                                                <small class="text-muted">
                                                                                                                    <strong>Debug Info:</strong><br>
                                                                                                                    Project ID: ${projectId}<br>
                                                                                                                    Item ID: ${detail.item_id}<br>
                                                                                                                    Colors: ${detail.colors}
                                                                                                                </small>
                                                                                                            `,
                                                                                                            icon: 'warning',
                                                                                                            confirmButtonText: 'Entendido'
                                                                                                        });
                                                                                                    }
                                                                                                })
                                                                                                .catch((err) => {
                                                                                                    console.error("❌ Error checking fallback:", err);
                                                                                                    Swal.fire({
                                                                                                        title: 'Error',
                                                                                                        text: 'No se pudo verificar la disponibilidad del PDF.',
                                                                                                        icon: 'error',
                                                                                                        confirmButtonText: 'Entendido'
                                                                                                    });
                                                                                                });
                                                                                        }
                                                                                    })
                                                                                    .catch((err) => {
                                                                                        console.error("❌ Error checking main PDF:", err);
                                                                                        Swal.fire({
                                                                                            title: 'Error',
                                                                                            text: 'No se pudo verificar la disponibilidad del PDF.',
                                                                                            icon: 'error',
                                                                                            confirmButtonText: 'Entendido'
                                                                                        });
                                                                                    });
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-file-pdf" style={{ fontSize: '16px', color: '#dc3545' }}></i>
                                                                        </a>
                                                                    );
                                                                }

                                                                // Si no hay project_id válido, mostrar mensaje de no disponible para álbumes
                                                                if (detail.name && (detail.name.toLowerCase().includes('álbum') || detail.name.toLowerCase().includes('album'))) {
                                                                    return (
                                                                        <button
                                                                            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                                                                            title="PDF no disponible - Álbum sin personalizar"
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '30px',
                                                                                cursor: 'not-allowed'
                                                                            }}
                                                                            onClick={() => {
                                                                                Swal.fire({
                                                                                    title: 'PDF no disponible',
                                                                                    html: `
                                                                                        <p>Este álbum no tiene un PDF personalizado generado.</p>
                                                                                        <br>
                                                                                        <small class="text-muted">
                                                                                            <strong>Debug Info:</strong><br>
                                                                                            Item ID: ${detail.item_id}<br>
                                                                                            Colors: ${detail.colors || 'N/A'}<br>
                                                                                            Project ID: ${projectId || 'No encontrado'}
                                                                                        </small>
                                                                                    `,
                                                                                    icon: 'info',
                                                                                    confirmButtonText: 'Entendido'
                                                                                });
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-file-pdf" style={{ fontSize: '16px', color: '#6c757d' }}></i>
                                                                        </button>
                                                                    );
                                                                }

                                                                // Para productos que no son álbumes, intentar con item_id
                                                                if (detail.item_id) {
                                                                    return (
                                                                        <a
                                                                            href={`/storage/images/pdf/${detail.item_id}/${detail.item_id}.pdf`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                                                                            title="Descargar PDF del producto"
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '30px'
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                const checkUrl = `/storage/images/pdf/${detail.item_id}/${detail.item_id}.pdf`;
                                                                                fetch(checkUrl, { method: 'HEAD' })
                                                                                    .then(response => {
                                                                                        if (response.ok) {
                                                                                            window.open(checkUrl, '_blank');
                                                                                        } else {
                                                                                            Swal.fire({
                                                                                                title: 'PDF no encontrado',
                                                                                                text: 'El archivo PDF para este producto no está disponible.',
                                                                                                icon: 'warning',
                                                                                                confirmButtonText: 'Entendido'
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                    .catch(() => {
                                                                                        Swal.fire({
                                                                                            title: 'Error',
                                                                                            text: 'No se pudo verificar la disponibilidad del PDF.',
                                                                                            icon: 'error',
                                                                                            confirmButtonText: 'Entendido'
                                                                                        });
                                                                                    });
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-file-pdf" style={{ fontSize: '16px' }}></i>
                                                                        </a>
                                                                    );
                                                                }

                                                                // Si no hay ni project_id ni item_id
                                                                return <span className="text-muted">-</span>;
                                                            })()}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header p-2">
                                <h5 className="card-title mb-0">Resumen</h5>
                            </div>
                            <div className="card-body p-2">
                                <div className="d-flex justify-content-between">
                                    <b>Subtotal:</b>
                                    <span>
                                        S/{" "}
                                        {Number2Currency(subtotalWithoutIGV)}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <b>IGV:</b>
                                    <span>
                                        S/{" "}
                                        {Number2Currency(igvAmount)}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <b>Envío:</b>
                                    <span>
                                        S/{" "}
                                        {Number2Currency(saleLoaded?.delivery)}
                                    </span>
                                </div>

                                {/* Mostrar descuentos automáticos en el resumen */}
                                {saleLoaded?.promotion_discount > 0 && (
                                    <div className="d-flex justify-content-between text-primary">
                                        <b>Descuentos automáticos:</b>
                                        <span>
                                            - S/{" "}
                                            {Number2Currency(saleLoaded?.promotion_discount)}
                                        </span>
                                    </div>
                                )}

                                {saleLoaded?.coupon_discount > 0 && (
                                    <div className="d-flex justify-content-between text-success">
                                        <b>Descuento por cupón:</b>
                                        <span>
                                            - S/{" "}
                                            {Number2Currency(saleLoaded?.coupon_discount)}
                                        </span>
                                    </div>
                                )}

                                {/* Mostrar otros descuentos si existen */}
                                {saleLoaded?.bundle_discount > 0 && (
                                    <div className="d-flex justify-content-between text-info">
                                        <b>Descuento por paquete:</b>
                                        <span>
                                            - S/{" "}
                                            {Number2Currency(saleLoaded?.bundle_discount)}
                                        </span>
                                    </div>
                                )}

                                {saleLoaded?.renewal_discount > 0 && (
                                    <div className="d-flex justify-content-between text-warning">
                                        <b>Descuento por renovación:</b>
                                        <span>
                                            - S/{" "}
                                            {Number2Currency(saleLoaded?.renewal_discount)}
                                        </span>
                                    </div>
                                )}

                                <hr className="my-2" />
                                <div className="d-flex justify-content-between">
                                    <b>Total:</b>
                                    <span>
                                        <strong>
                                            S/ {Number2Currency(totalAmount)}
                                        </strong>
                                    </span>
                                </div>

                                {/* Mostrar desglose de cómo se calculó el total */}
                                <small className="text-muted mt-2 d-block">
                                    <strong>Cálculo:</strong>
                                    {Number2Currency(subtotalAfterDiscounts)} (subtotal después de descuentos)
                                    + {Number2Currency(igvAmount)} (IGV 18%)
                                    + {Number2Currency(saleLoaded?.delivery)} (envío)
                                    = S/ {Number2Currency(totalAmount)}
                                </small>
                                <small className="text-muted d-block">
                                    <strong>Desglose:</strong> S/ {Number2Currency(subtotalReal)} (productos con IGV)
                                    → S/ {Number2Currency(subtotalWithoutIGV)} (subtotal sin IGV)
                                    {saleLoaded?.promotion_discount > 0 && ` - ${Number2Currency(saleLoaded?.promotion_discount)} (promociones)`}
                                    {saleLoaded?.coupon_discount > 0 && ` - ${Number2Currency(saleLoaded?.coupon_discount)} (cupón)`}
                                    {saleLoaded?.bundle_discount > 0 && ` - ${Number2Currency(saleLoaded?.bundle_discount)} (paquete)`}
                                    {saleLoaded?.renewal_discount > 0 && ` - ${Number2Currency(saleLoaded?.renewal_discount)} (renovación)`}
                                    → S/ {Number2Currency(subtotalAfterDiscounts)} (subtotal final)
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card">
                            <div className="card-header p-2">
                                <h5 className="card-title mb-0">Estado</h5>
                            </div>
                            <div className="card-body p-2 position-relative" id="statusSelectContainer">
                                {statusLoading && (
                                    <div className="position-absolute d-flex align-items-center justify-content-center" style={{
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        zIndex: 1,
                                        backgroundColor: 'rgba(255, 255, 255, 0.125)',
                                        backdropFilter: 'blur(2px)',
                                        cursor: 'not-allowed'
                                    }}>
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <SelectFormGroup label='Estado actual' dropdownParent='#statusSelectContainer' minimumResultsForSearch={-1} templateResult={statusTemplate} templateSelection={statusTemplate} onChange={(e) => onStatusChange(e, saleLoaded)} value={saleLoaded?.status_id} changeWith={[saleLoaded]} disabled={statusLoading || saleLoaded?.status?.reversible == 0}>
                                        {statuses.map((status, index) => {
                                            return (
                                                <option key={index} value={status.id} data-status={JSON.stringify(status)}>
                                                    {status.name}
                                                </option>
                                            );
                                        })}
                                    </SelectFormGroup>
                                </div>
                                {/* <div className="mb-2">
                                    <label
                                        htmlFor="statusSelect"
                                        className="form-label"
                                    >
                                        Estado Actual
                                    </label>
                                    <select
                                        className="form-select"
                                        id="statusSelect"
                                        value={saleLoaded?.status_id}
                                        onChange={onStatusChange}
                                        disabled={saleLoaded?.status?.reversible == 0}
                                    >
                                        {statuses.map((status, index) => {
                                            return (
                                                <option value={status.id}>
                                                    {status.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div> */}
                                <div className="form-check" style={{
                                    cursor: saleLoaded?.status?.reversible == 0 ? 'not-allowed' : 'pointer'
                                }}>
                                    <input
                                        ref={notifyClientRef}
                                        className="form-check-input"
                                        type="checkbox"
                                        id="notifyClient"
                                        defaultChecked
                                        disabled={saleLoaded?.status?.reversible == 0}
                                        style={{
                                            cursor: saleLoaded?.status?.reversible == 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="notifyClient" style={{
                                        cursor: saleLoaded?.status?.reversible == 0 ? 'not-allowed' : 'pointer'
                                    }}>
                                        Notificar al cliente
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header p-2">
                                <h5 className="card-title mb-0">
                                    Cambios de Estado
                                </h5>
                            </div>
                            <div className="card-body p-2 d-flex flex-column gap-1">
                                {saleStatuses?.map((ss, index) => {
                                    // Buscar el color del estado desde la lista de estados disponibles
                                    const statusData = statuses.find(s => s.id === ss.status_id || s.name === ss.name);
                                    const statusColor = statusData?.color || ss.color || "#333";

                                    return (
                                        <article
                                            key={index}
                                            className="border py-1 px-2 ms-3"
                                            style={{
                                                position: "relative",
                                                borderRadius:
                                                    "16px 4px 4px 16px",
                                                backgroundColor: statusColor
                                                    ? `${statusColor}2e`
                                                    : "#3333332e",
                                            }}
                                        >
                                            <i
                                                className={`${ss.icon || statusData?.icon || 'mdi mdi-circle'} left-2`}
                                                style={{
                                                    color: statusColor,
                                                    position: "absolute",
                                                    left: "-25px",
                                                    top: "50%",
                                                    transform:
                                                        "translateY(-50%)",
                                                }}
                                            ></i>
                                            <b
                                                style={{
                                                    color: statusColor,
                                                }}
                                            >
                                                {ss?.name}
                                            </b>
                                            <small className="d-block text-truncate">
                                                {ss?.user_name}{" "}
                                                {ss?.user_lastname}
                                            </small>
                                            <small className="d-block text-muted">
                                                {moment(ss.created_at).format(
                                                    "YYYY-MM-DD HH:mm"
                                                )}
                                            </small>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <BaseAdminto {...properties} title="Pedidos">
            <Sales {...properties} />
        </BaseAdminto>
    );
});
