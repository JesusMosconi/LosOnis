import type {MetadataRoute} from "next";
export default function manifest():MetadataRoute.Manifest{return {name:"Los Onis",short_name:"Los Onis",description:"Gestión del taller Los Onis",start_url:"/",display:"standalone",background_color:"#f8f9ff",theme_color:"#004ac6",icons:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"}]}}
