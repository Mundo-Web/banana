import{j as e}from"./AboutSimple-Cf8x2fCZ.js";import{r as n}from"./index-BH53Isel.js";import{S as h,a as v}from"./BlogCarousel-BcMdR14t.js";import{N as y}from"./navigation-8XRQbJaH.js";import{P as j}from"./pagination-BlBBVkNx.js";import{G as N}from"./grid-BZ4EKnFQ.js";/* empty css               */import"./BlogCarrusel-B3SD0Iql.js";import"./ProductMakita-BWUynGjS.js";import"./Strengths-Ym4uqnVf.js";import{C as k}from"./CardProductBananaLab-Bym-0mMT.js";import{a as E}from"./adjustTextColor-DJKJvkxA.js";import{C as P}from"./chevron-left-B2s3ZsB7.js";import{C as R}from"./chevron-right-Ckt5D2ka.js";import"./index-yBjzXJbu.js";import"./create-element-if-not-defined-ubJ3ncqT.js";import"./ProductCard-B4Ag8Mdr.js";import"./ItemsRest-DmQAXZCN.js";import"./main-Byrjfx4U.js";import"./___vite-browser-external_commonjs-proxy-0zb4Agf2.js";import"./BasicRest-DByHAxxD.js";import"./index-BJa4kPFi.js";import"./index-fRpqIG3j.js";import"./index-B6ujFmsw.js";import"./HeaderSearch-BLPm48RP.js";import"./PaymentModal-lELjrGc2.js";import"./index-Chjiymov.js";import"./CartItemRow-aLzOG3-9.js";import"./Number2Currency-e57Tgsuk.js";import"./tippy-react.esm-_w2ZiBvC.js";import"./proxy-BdCOtp7i.js";import"./trash-2-DK1wnsDn.js";import"./createLucideIcon-Cy5Ya80P.js";import"./plus-Bot15Khs.js";import"./index-CDbJJs-a.js";import"./CartModalBananaLab-D1KFXrRb.js";/* empty css              */import"./shopping-bag-CoWGrL8C.js";import"./x-DBMwyD6F.js";import"./shopping-cart-CZEUxbmv.js";import"./arrow-right-DR00rP9v.js";import"./heart-ChuvJi-4.js";import"./circle-check-big-D6DM3vPb.js";const be=({items:o,data:i,setCart:u,cart:g,setFavorites:f,favorites:x})=>{const[r,b]=n.useState(null),s=n.useRef(null),l=n.useRef(null),p=n.useRef(null),m=n.useRef(null);return n.useEffect(()=>{[s,l,p,m].forEach(t=>{t.current&&E(t.current)})},[]),n.useEffect(()=>{if(!r)return;const t=()=>{setTimeout(()=>{if(!r||!r.navigation)return;const a=window.innerWidth>=768,c=a?s.current:p.current,d=a?l.current:m.current;if(c&&d){r.params.navigation.prevEl=c,r.params.navigation.nextEl=d;try{r.navigation.destroy(),r.navigation.init(),r.navigation.update()}catch(w){console.warn("Swiper navigation update failed:",w)}}},50)};return window.addEventListener("resize",t),t(),()=>window.removeEventListener("resize",t)},[r]),e.jsx(e.Fragment,{children:o&&o.length>0&&e.jsxs("section",{className:"pt-6 pb-0 font-paragraph lg:py-4 2xl:py-8",children:[e.jsxs("div",{className:"mx-auto px-primary 2xl:px-0 2xl:max-w-7xl",children:[e.jsxs("div",{className:"md:flex justify-between items-center customborder-neutral-dark",children:[e.jsx("h2",{className:"text-[32px] leading-9 font-semibold mb-2 md:mb-0",children:i==null?void 0:i.title}),e.jsx("a",{href:i==null?void 0:i.link_catalog,className:"hidden lg:flex bg-white customtext-primary border border-primary transition-all duration-300 justify-center flex-row items-center gap-3 px-10 py-3 text-base rounded-full tracking-wide font-bold cursor-pointer hover:opacity-90 lg:bg-primary",children:(i==null?void 0:i.text_button)||"Ver más recomendaciones"})]}),e.jsxs("div",{className:"relative lg:px-10",children:[o&&o.length>0&&e.jsx(h,{modules:[y,N,j],navigation:{prevEl:null,nextEl:null,enabled:!0},pagination:{clickable:!0,dynamicBullets:!1},slidesPerView:2,spaceBetween:10,grid:{fill:"row",rows:1},loop:!0,onSwiper:t=>{setTimeout(()=>{const a=window.innerWidth>=768;t.params.navigation.prevEl=a?s.current:p.current,t.params.navigation.nextEl=a?l.current:m.current,t.navigation.destroy(),t.navigation.init(),t.navigation.update(),b(t)},100)},breakpoints:{320:{slidesPerView:1.2,spaceBetween:10},480:{slidesPerView:1.5,spaceBetween:10},640:{slidesPerView:2,spaceBetween:10},768:{slidesPerView:3,grid:{rows:1},spaceBetween:0,pagination:{enabled:!1}},1024:{slidesPerView:4,grid:{rows:1},spaceBetween:0,pagination:{enabled:!1}},1280:{slidesPerView:4,grid:{rows:1},spaceBetween:0,pagination:{enabled:!1}}},className:"md:h-[520px] md:max-h-[520px] lg:!flex lg:items-center lg:justify-center animate-fadeIn product-swiper-mobile",children:o.map((t,a)=>e.jsx(v,{className:"mb-4 lg:mb-0 px-1 py-2 md:p-0 !h-full lg:!flex lg:items-center lg:justify-center animate-slideIn",children:e.jsx(k,{product:t,setCart:u,cart:g,data:i,setFavorites:f,favorites:x})},`${t.id||a}`))}),e.jsxs("div",{className:"hidden md:block",children:[e.jsx("button",{ref:s,className:"absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-lg shadow-lg transition-all duration-300 bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transform hover:-translate-x-1","aria-label":"Productos anteriores",children:e.jsx(P,{width:"1.2rem",className:"animate-pulse"})}),e.jsx("button",{ref:l,className:"absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-lg shadow-lg transition-all duration-300 bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transform hover:translate-x-1","aria-label":"Siguientes productos",children:e.jsx(R,{width:"1.2rem",className:"animate-pulse"})})]})]})]}),e.jsx("style",{jsx:"true",children:`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-in;
                }
                .animate-slideIn {
                    animation: slideIn 0.5s ease-out;
                }
                
                /* Mobile Pagination Styles */
                .product-swiper-mobile .swiper-pagination {
                    position: static !important;
                    margin-top: 20px !important;
                    text-align: center;
                }
                
                /* Hide pagination on desktop */
                @media (min-width: 768px) {
                    .product-swiper-mobile .swiper-pagination {
                        display: none !important;
                    }
                }
                
                /* Custom bullet styles */
                .product-swiper-mobile .swiper-pagination-bullet {
                    width: 12px !important;
                    height: 12px !important;
                    background: rgba(0, 0, 0, 0.2) !important;
                    opacity: 1 !important;
                    margin: 0 6px !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                    cursor: pointer !important;
                    border: 2px solid transparent !important;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                }
                
                .product-swiper-mobile .swiper-pagination-bullet:hover {
                    transform: scale(1.1) !important;
                    background: rgba(0, 0, 0, 0.4) !important;
                }
                
                .product-swiper-mobile .swiper-pagination-bullet-active {
                    background: #af5cb8 !important;
                    transform: scale(1.3) !important;
                    border-color: #af5cb8 !important;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
                }
            `})]})})};export{be as default};
