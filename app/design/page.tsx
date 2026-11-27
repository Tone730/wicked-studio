"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Layer = { id: string; type: "rect" | "ellipse" | "text" | "image" | "path"; name: string; x: number; y: number; w: number; h: number; fill: string; stroke: string; strokeWidth: number; text?: string; fontSize?: number; fontFamily?: string; src?: string; points?: string; opacity: number; hidden?: boolean };
type Tool = "select" | "rect" | "ellipse" | "text" | "image" | "draw";
const W = 960, H = 600;
const uid = () => Math.random().toString(36).slice(2, 10);
const initial: Layer[] = [{ id: "background", type: "rect", name: "Background", x: 0, y: 0, w: W, h: H, fill: "#171323", stroke: "none", strokeWidth: 0, opacity: 1 }];
export default function DesignStudio() {
  const [layers, setLayers] = useState<Layer[]>(initial);
  const [selected, setSelected] = useState("background");
  const [tool, setTool] = useState<Tool>("select");
  const [fill, setFill] = useState("#a78bfa");
  const [stroke, setStroke] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [textValue, setTextValue] = useState("WICKED");
  const [fontSize, setFontSize] = useState(72);
  const [zoom, setZoom] = useState(75);
  const [history, setHistory] = useState<Layer[][]>([]);
  const [future, setFuture] = useState<Layer[][]>([]);
  const [drag, setDrag] = useState<{id:string; x:number;y:number; ox:number;oy:number; before:Layer[]; saved:boolean}|null>(null);
  const [status, setStatus] = useState("Ready · changes stay in this browser");
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = layers.find(l => l.id === selected);
  const push = (next: Layer[]) => { setHistory(h => [...h.slice(-39), layers]); setFuture([]); setLayers(next); };
  const patch = (id: string, changes: Partial<Layer>) => push(layers.map(l => l.id === id ? { ...l, ...changes } : l));
  const point = (e: Pick<ReactPointerEvent<SVGSVGElement>, "clientX" | "clientY">) => { const r = svgRef.current!.getBoundingClientRect(); return { x: (e.clientX-r.left)*W/r.width, y:(e.clientY-r.top)*H/r.height }; };
  const add = (type: "rect"|"ellipse"|"text", x= W/2-100, y=H/2-60) => {
    const l: Layer = { id:uid(), type, name:type==="text"?"Text":type==="rect"?"Rectangle":"Ellipse", x, y, w:type==="text"?360:200, h:type==="text"?100:120, fill, stroke, strokeWidth, text:type==="text"?textValue:"", fontSize, fontFamily:"Arial", opacity:1 };
    push([...layers,l]); setSelected(l.id); setTool("select"); setStatus(l.name+" added · drag it on the canvas");
  };
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool === "image") { fileRef.current?.click(); return; }
    const p=point(e);
    if (tool === "rect" || tool === "ellipse" || tool === "text") { add(tool,p.x-100,p.y-50); return; }
    if (tool === "draw") { const l:Layer={id:uid(),type:"path",name:"Brush stroke",x:0,y:0,w:W,h:H,fill:"none",stroke:fill,strokeWidth:Math.max(2,strokeWidth*3),points:`M ${p.x} ${p.y}`,opacity:1}; push([...layers,l]); setSelected(l.id); setDrag({id:l.id,x:p.x,y:p.y,ox:0,oy:0,before:layers,saved:true}); return; }
    if (e.target === svgRef.current) setSelected("");
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if(!drag)return; const p=point(e);
    setLayers(ls=>ls.map(l=>l.id===drag.id?(l.type==="path"?{...l,points:(l.points||"")+ ` L ${p.x} ${p.y}`}:{...l,x:drag.ox+p.x-drag.x,y:drag.oy+p.y-drag.y}):l));
  };
  const finishDrag=()=>{ if(drag){if(!drag.saved){setHistory(h=>[...h.slice(-39),drag.before]);setFuture([]);}setDrag(null);} };
  const importImage = async (f?:File) => { if(!f)return; const src=await new Promise<string>((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=()=>no(r.error);r.readAsDataURL(f)}); const im=new Image(); im.onload=()=>{const scale=Math.min(420/im.width,320/im.height,1);const l:Layer={id:uid(),type:"image",name:f.name,x:W/2-im.width*scale/2,y:H/2-im.height*scale/2,w:im.width*scale,h:im.height*scale,fill:"none",stroke:"none",strokeWidth:0,src,opacity:1};push([...layers,l]);setSelected(l.id);setTool("select");setStatus("Image imported · drag to position and use properties to resize")};im.src=src; };
  const undo=()=>{if(!history.length)return;setFuture(f=>[layers,...f]);setLayers(history[history.length-1]);setHistory(h=>h.slice(0,-1));setStatus("Undo");};
  const redo=()=>{if(!future.length)return;setHistory(h=>[...h,layers]);setLayers(future[0]);setFuture(f=>f.slice(1));setStatus("Redo");};
  const save=()=>{const data={format:"wicked-design-project",version:1,width:W,height:H,layers};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"}));a.download="wicked-design.wickedproject";a.click();setStatus("Editable project downloaded");};
  const open=async(f?:File)=>{if(!f)return;try{const d=JSON.parse(await f.text());if(d.format!=="wicked-design-project"||!Array.isArray(d.layers))throw Error();setLayers(d.layers);setSelected(d.layers.length ? d.layers[d.layers.length-1].id : "");setHistory([]);setFuture([]);setStatus("Project opened · "+d.layers.length+" layers")}catch{setStatus("That project file could not be opened")}};
  const exportPng=async()=>{const svg=svgRef.current;if(!svg)return;const clone=svg.cloneNode(true) as SVGSVGElement;clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("width",String(W));clone.setAttribute("height",String(H));clone.querySelectorAll("[data-ui]").forEach(n=>n.remove());const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml"});const url=URL.createObjectURL(blob);const im=new Image();im.onload=()=>{const c=document.createElement("canvas");c.width=W;c.height=H;const ctx=c.getContext("2d");ctx?.drawImage(im,0,0);URL.revokeObjectURL(url);c.toBlob(b=>{if(!b)return;const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="wicked-design.png";a.click();setStatus("PNG exported")})};im.onerror=()=>{URL.revokeObjectURL(url);setStatus("PNG export failed")};im.src=url;};
  const moveLayer=(id:string,dir:number)=>{const i=layers.findIndex(l=>l.id===id),j=i+dir;if(i<0||j<0||j>=layers.length)return;const a=[...layers];[a[i],a[j]]=[a[j],a[i]];push(a)};
  const shown=useMemo(()=>layers.filter(l=>!l.hidden),[layers]);
  const tools: [Tool,string][]=[["select","Select / Move"],["rect","Rectangle"],["ellipse","Ellipse"],["text","Text"],["image","Import image"],["draw","Freehand"]];
  return <main className="designApp"><header className="designHeader"><a href="/dashboard">← Dashboard</a><div><b>WICKED STUDIO</b><small>DESIGN & COMPOSITING WORKSPACE</small></div><span>{status}</span></header>
    <div className="designActions"><div>{tools.map(([id,label])=><button key={id} className={tool===id?"active":""} onClick={()=>id==="image"?fileRef.current?.click():setTool(id)}>{label}</button>)}</div><div><button onClick={undo} disabled={!history.length}>↶ Undo</button><button onClick={redo} disabled={!future.length}>↷ Redo</button><button onClick={()=>fileRef.current?.click()}>＋ Image</button><button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept=".wickedproject,.json";i.onchange=()=>open(i.files?.[0]);i.click()}}>Open</button><button onClick={save}>Save project</button><button className="primary" onClick={exportPng}>Export PNG</button></div></div>
    <div className="designLayout"><aside className="designPanel"><h3>TOOLS & STYLE</h3><label>Fill <input type="color" value={fill} onChange={e=>setFill(e.target.value)}/></label><label>Stroke <input type="color" value={stroke} onChange={e=>setStroke(e.target.value)}/></label><label>Stroke width <input type="range" min="0" max="24" value={strokeWidth} onChange={e=>setStrokeWidth(+e.target.value)}/></label><label>Text content <input value={textValue} onChange={e=>setTextValue(e.target.value)}/></label><label>Font size <input type="range" min="12" max="160" value={fontSize} onChange={e=>setFontSize(+e.target.value)}/></label><div className="designQuick"><button onClick={()=>add("text")}>＋ Add text</button><button onClick={()=>add("rect")}>＋ Add shape</button><button onClick={()=>add("ellipse")}>＋ Add circle</button></div><hr/><h3>SELECTED OBJECT</h3>{current?<><b className="designSelected">{current.name}</b><label>Position X <input type="number" value={Math.round(current.x)} onChange={e=>patch(current.id,{x:+e.target.value})}/></label><label>Position Y <input type="number" value={Math.round(current.y)} onChange={e=>patch(current.id,{y:+e.target.value})}/></label><label>Width <input type="number" min="1" value={Math.round(current.w)} onChange={e=>patch(current.id,{w:Math.max(1,+e.target.value)})}/></label><label>Height <input type="number" min="1" value={Math.round(current.h)} onChange={e=>patch(current.id,{h:Math.max(1,+e.target.value)})}/></label><label>Opacity <input type="range" min="0" max="1" step=".05" value={current.opacity} onChange={e=>patch(current.id,{opacity:+e.target.value})}/></label><div className="designQuick"><button onClick={()=>patch(current.id,{fill})}>Apply fill</button><button onClick={()=>patch(current.id,{stroke,strokeWidth})}>Apply stroke</button><button onClick={()=>push([...layers,{...current,id:uid(),name:current.name+" copy",x:current.x+20,y:current.y+20}])}>Duplicate</button><button onClick={()=>push(layers.filter(l=>l.id!==current.id))}>Delete</button></div></>:<p>Select an object on the canvas to edit its properties.</p>}</aside>
    <section className="designStage"><div className="designStageTop"><b>ARTBOARD · 960 × 600</b><label>Zoom <input type="range" min="25" max="125" step="5" value={zoom} onChange={e=>setZoom(+e.target.value)}/>{zoom}%</label></div><div className="designCanvasScroll"><svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W*zoom/100} height={H*zoom/100} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={finishDrag} onPointerLeave={finishDrag} style={{touchAction:"none",background:"#171323",maxWidth:"none"}}>{shown.map(l=><g key={l.id} opacity={l.opacity} onPointerDown={e=>{if(tool!=="select")return;e.stopPropagation();setSelected(l.id);const p=point(e);setDrag({id:l.id,x:p.x,y:p.y,ox:l.x,oy:l.y,before:layers,saved:false});}} style={{cursor:tool==="select"?"move":"crosshair"}}>{l.type==="rect"?<rect x={l.x} y={l.y} width={l.w} height={l.h} fill={l.fill} stroke={l.stroke} strokeWidth={l.strokeWidth}/>:l.type==="ellipse"?<ellipse cx={l.x+l.w/2} cy={l.y+l.h/2} rx={l.w/2} ry={l.h/2} fill={l.fill} stroke={l.stroke} strokeWidth={l.strokeWidth}/>:l.type==="text"?<text x={l.x} y={l.y+l.fontSize!} fill={l.fill} stroke={l.stroke} strokeWidth={l.strokeWidth} fontSize={l.fontSize} fontFamily={l.fontFamily} fontWeight="700">{l.text}</text>:l.type==="image"?<image href={l.src} x={l.x} y={l.y} width={l.w} height={l.h} preserveAspectRatio="none"/>:<path d={l.points} fill="none" stroke={l.stroke} strokeWidth={l.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />}{selected===l.id&&<rect data-ui="true" x={l.x-3} y={l.y-3} width={l.w+6} height={l.h+6} fill="none" stroke="#f0abfc" strokeDasharray="6 4" pointerEvents="none"/>}</g>)}</svg></div><p>Choose a tool, tap the artboard to add an object, then select and drag it. All imported images stay on your device.</p></section>
    <aside className="designPanel designLayers"><h3>LAYERS · {layers.length}</h3>{[...layers].reverse().map(l=><div className={selected===l.id?"layerRow chosen":"layerRow"} key={l.id}><button onClick={()=>setSelected(l.id)}>{l.type==="text"?"T":l.type==="image"?"▧":l.type==="ellipse"?"◯":l.type==="path"?"〰":"▱"} {l.name}</button><button title="Move up" onClick={()=>moveLayer(l.id,1)}>↑</button><button title="Move down" onClick={()=>moveLayer(l.id,-1)}>↓</button><button title="Hide layer" onClick={()=>patch(l.id,{hidden:!l.hidden})}>{l.hidden?"○":"●"}</button></div>)}<p>Top layers render above lower layers. Select a layer to edit it.</p></aside></div>
    <input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>{importImage(e.target.files?.[0]);e.target.value=""}}/><footer>Wicked Studio Design Workspace · Native SVG editing · Local project files · No account or API key required</footer>
  </main>;
}
