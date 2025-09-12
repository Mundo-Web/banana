import{j as r}from"./AboutSimple-Cf8x2fCZ.js";import{R as d,r as n}from"./index-BH53Isel.js";import"./thumbnailGenerator-GSue5zvm.js";import"./dataUrlToBlobUrl-D3JvlFJz.js";import"./index-Bn4logZ0.js";import"./index-BJa4kPFi.js";import"./main-Byrjfx4U.js";import{u as j}from"./EditorMain-pmNS9bYK.js";import"./BookPreview-D8MypWGi.js";import"./thumbnailGenerator-C286CMGm.js";import{I as l}from"./image-BEA0kkBS.js";import{P as N}from"./plus-Bot15Khs.js";import"./index-yBjzXJbu.js";import"./PDFButton-B6_wMiFr.js";import"./preload-helper-BfFHrpNk.js";import"./typeof-QjJsDpFa.js";import"./index-fRpqIG3j.js";import"./index-B6ujFmsw.js";import"./___vite-browser-external_commonjs-proxy-0zb4Agf2.js";import"./index-BSWw-p5k.js";import"./createLucideIcon-Cy5Ya80P.js";import"./copy-6OEekgvq.js";import"./trash-2-DK1wnsDn.js";import"./TextElement-CTWCUpKD.js";import"./upload-qgEr5bIl.js";import"./PaymentModal-lELjrGc2.js";import"./index-Chjiymov.js";import"./x-DBMwyD6F.js";import"./chevron-left-B2s3ZsB7.js";import"./chevron-right-Ckt5D2ka.js";const k=`
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
`;if(typeof document<"u"){const a=document.createElement("style");a.textContent=k,document.head.appendChild(a)}d.memo(({images:a,onImageSelect:m,isLoading:c})=>{const x=d.memo(({image:e})=>{const[t,b]=n.useState(!1),[p,g]=n.useState(!1),[v,i]=n.useState(!1),[{isDragging:s},u]=j(()=>({type:"PROJECT_IMAGE",item:{type:"PROJECT_IMAGE",imageUrl:e.url},collect:o=>({isDragging:!!o.isDragging()}),end:()=>{setTimeout(()=>i(!1),100)}})),h=e.thumbnail_url||e.url,f=e.url,w=o=>{i(!0),setTimeout(()=>i(!1),500)},y=o=>{if(v||s)return o.preventDefault(),o.stopPropagation(),!1;m(f)};return r.jsxs("div",{ref:u,className:`relative group cursor-pointer bg-gray-50 rounded-lg overflow-hidden border-2 border-transparent hover:border-[#af5cb8] transition-all duration-200 ${s?"opacity-50 scale-95":""}`,onMouseDown:w,onClick:y,children:[r.jsxs("div",{className:"aspect-square relative",children:[!t&&!p&&r.jsx("div",{className:"absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center",children:r.jsx("div",{className:"w-6 h-6 border-2 border-[#af5cb8] border-t-transparent rounded-full animate-spin"})}),p?r.jsx("div",{className:"absolute inset-0 bg-gray-100 flex items-center justify-center",children:r.jsxs("div",{className:"text-center text-gray-500",children:[r.jsx(l,{className:"h-6 w-6 mx-auto mb-1"}),r.jsx("p",{className:"text-xs",children:"Error al cargar"})]})}):r.jsx("img",{src:h,alt:e.filename||"Project image",className:`w-full h-full object-cover transition-opacity duration-300 ${t?"opacity-100":"opacity-0"}`,loading:"lazy",onLoad:()=>b(!0),onError:()=>g(!0)})]}),r.jsx("div",{className:"absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center",children:r.jsx("div",{className:"opacity-0 group-hover:opacity-100 transition-opacity duration-200",children:r.jsx("div",{className:"bg-white rounded-full p-2 shadow-md",children:r.jsx(N,{className:"h-4 w-4 text-[#af5cb8]"})})})}),r.jsx("div",{className:"absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200",children:e.has_thumbnail?"Optimizada":"Arrastra o haz clic"}),e.has_thumbnail&&r.jsx("div",{className:"absolute top-2 left-2 bg-green-500 rounded-full w-2 h-2"})]})});return c?r.jsx("div",{className:"grid grid-cols-2 gap-3",children:Array.from({length:6}).map((e,t)=>r.jsx("div",{className:"aspect-square bg-gray-100 rounded-lg animate-pulse"},t))}):a.length===0?r.jsxs("div",{className:"text-center py-8",children:[r.jsx(l,{className:"h-12 w-12 text-gray-400 mx-auto mb-4"}),r.jsx("p",{className:"text-sm text-gray-600 mb-2",children:"No hay imágenes en este proyecto"}),r.jsx("p",{className:"text-xs text-gray-500",children:"Sube una imagen para empezar"})]}):r.jsxs("div",{className:"space-y-3",children:[r.jsx("div",{className:"grid grid-cols-2 gap-3",children:a.map((e,t)=>r.jsx(x,{image:e},`${e.id||e.url}-${t}`))}),r.jsx("div",{className:"text-center",children:r.jsxs("p",{className:"text-xs text-gray-500",children:[a.filter(e=>e.has_thumbnail).length," de ",a.length," imágenes optimizadas"]})})]})});
