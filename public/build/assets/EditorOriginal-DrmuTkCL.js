import{j as e}from"./AboutSimple-Cf8x2fCZ.js";import{R as x,r as s}from"./index-BH53Isel.js";import"./thumbnailGenerator-GSue5zvm.js";import"./dataUrlToBlobUrl-D3JvlFJz.js";import"./EditorLayout-sjupmr7W.js";import"./PDFButton-DB3JQIph.js";import"./index-BJa4kPFi.js";import"./main-Byrjfx4U.js";import{u as j}from"./EditorMain-Dm4CRGxS.js";import"./BookPreview-MdSUIKhW.js";import"./thumbnailGenerator-C286CMGm.js";import{B as N}from"./book-BuHIVa2d.js";import{I as v}from"./image-BEA0kkBS.js";import{P as k}from"./plus-Bot15Khs.js";import"./index-yBjzXJbu.js";import"./preload-helper-BfFHrpNk.js";import"./typeof-QjJsDpFa.js";import"./index-fRpqIG3j.js";import"./index-B6ujFmsw.js";import"./___vite-browser-external_commonjs-proxy-0zb4Agf2.js";import"./index-BSWw-p5k.js";import"./createLucideIcon-Cy5Ya80P.js";import"./copy-6OEekgvq.js";import"./trash-2-DK1wnsDn.js";import"./TextElement-CTWCUpKD.js";import"./upload-qgEr5bIl.js";import"./PaymentModal-lELjrGc2.js";import"./index-Chjiymov.js";import"./x-DBMwyD6F.js";import"./chevron-left-B2s3ZsB7.js";import"./chevron-right-Ckt5D2ka.js";const I=`
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
`;if(typeof document<"u"){const a=document.createElement("style");a.textContent=I,document.head.appendChild(a)}x.memo(({pageId:a,thumbnail:t,altText:l,type:p})=>{const[r,o]=s.useState(!1),[m,d]=s.useState(!1);if(t&&!m)return e.jsxs("div",{className:"relative w-full h-full",children:[!r&&e.jsx("div",{className:"absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center",children:e.jsx("div",{className:"w-8 h-8 bg-gray-300 rounded"})}),e.jsx("img",{src:t,alt:l,className:`w-full h-full object-contain transition-opacity duration-200 ${r?"opacity-100":"opacity-0"}`,onLoad:()=>o(!0),onError:()=>d(!0),loading:"lazy",decoding:"async",style:{imageRendering:"optimizeQuality"}}),!1]});const c=p==="cover"||p==="final"?N:()=>e.jsx("div",{className:"grid grid-cols-2 gap-0.5 w-8 h-8",children:Array.from({length:4}).map((g,i)=>e.jsx("div",{className:"bg-gray-300 rounded-sm"},i))});return e.jsx("div",{className:"w-full h-full flex items-center justify-center bg-gray-100",children:e.jsxs("div",{className:"text-center text-gray-400",children:[e.jsx(c,{className:"w-8 h-8 mx-auto mb-1"}),e.jsx("span",{className:"text-xs",children:"Generando..."})]})})},(a,t)=>a.pageId===t.pageId&&a.thumbnail===t.thumbnail&&a.altText===t.altText&&a.type===t.type);x.memo(({images:a,onImageSelect:t,isLoading:l})=>{const p=x.memo(({image:r})=>{const[o,m]=s.useState(!1),[d,c]=s.useState(!1),[g,i]=s.useState(!1),[{isDragging:b},u]=j(()=>({type:"PROJECT_IMAGE",item:{type:"PROJECT_IMAGE",imageUrl:r.url},collect:n=>({isDragging:!!n.isDragging()}),end:()=>{setTimeout(()=>i(!1),100)}})),f=r.thumbnail_url||r.url,h=r.url,y=n=>{i(!0),setTimeout(()=>i(!1),500)},w=n=>{if(g||b)return n.preventDefault(),n.stopPropagation(),!1;t(h)};return e.jsxs("div",{ref:u,className:`relative group cursor-pointer bg-gray-50 rounded-lg overflow-hidden border-2 border-transparent hover:border-[#af5cb8] transition-all duration-200 ${b?"opacity-50 scale-95":""}`,onMouseDown:y,onClick:w,children:[e.jsxs("div",{className:"aspect-square relative",children:[!o&&!d&&e.jsx("div",{className:"absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center",children:e.jsx("div",{className:"w-6 h-6 border-2 border-[#af5cb8] border-t-transparent rounded-full animate-spin"})}),d?e.jsx("div",{className:"absolute inset-0 bg-gray-100 flex items-center justify-center",children:e.jsxs("div",{className:"text-center text-gray-500",children:[e.jsx(v,{className:"h-6 w-6 mx-auto mb-1"}),e.jsx("p",{className:"text-xs",children:"Error al cargar"})]})}):e.jsx("img",{src:f,alt:r.filename||"Project image",className:`w-full h-full object-cover transition-opacity duration-300 ${o?"opacity-100":"opacity-0"}`,loading:"lazy",onLoad:()=>m(!0),onError:()=>c(!0)})]}),e.jsx("div",{className:"absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center",children:e.jsx("div",{className:"opacity-0 group-hover:opacity-100 transition-opacity duration-200",children:e.jsx("div",{className:"bg-white rounded-full p-2 shadow-md",children:e.jsx(k,{className:"h-4 w-4 text-[#af5cb8]"})})})}),e.jsx("div",{className:"absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200",children:r.has_thumbnail?"Optimizada":"Arrastra o haz clic"}),r.has_thumbnail&&e.jsx("div",{className:"absolute top-2 left-2 bg-green-500 rounded-full w-2 h-2"})]})});return l?e.jsx("div",{className:"grid grid-cols-2 gap-3",children:Array.from({length:6}).map((r,o)=>e.jsx("div",{className:"aspect-square bg-gray-100 rounded-lg animate-pulse"},o))}):a.length===0?e.jsxs("div",{className:"text-center py-8",children:[e.jsx(v,{className:"h-12 w-12 text-gray-400 mx-auto mb-4"}),e.jsx("p",{className:"text-sm text-gray-600 mb-2",children:"No hay imágenes en este proyecto"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Sube una imagen para empezar"})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"grid grid-cols-2 gap-3",children:a.map((r,o)=>e.jsx(p,{image:r},`${r.id||r.url}-${o}`))}),e.jsx("div",{className:"text-center",children:e.jsxs("p",{className:"text-xs text-gray-500",children:[a.filter(r=>r.has_thumbnail).length," de ",a.length," imágenes optimizadas"]})})]})});
