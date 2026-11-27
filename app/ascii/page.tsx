"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Source={url:string;kind:"image"|"video";name:string};
const CHARSETS:Record<string,string>={
 classic:"@%#*+=-:. ",dense:"$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^.`' ",
 blocks:"█▓▒░ ",minimal:"@#:. ",binary:"10",dots:"●•· ",matrix:"アカサタナハマヤラワ012345789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+=-:"
};
export default function AsciiStudio(){
 const [source,setSource]=useState<Source|null>(null),[width,setWidth]=useState(120),[fontSize,setFontSize]=useState(10),[font,setFont]=useState("monospace"),[charset,setCharset]=useState("classic"),[customChars,setCustomChars]=useState("WICKED@#:. "),[colorMode,setColorMode]=useState("mono"),[fg,setFg]=useState("#e8dcff"),[bg,setBg]=useState("#09070e"),[brightness,setBrightness]=useState(0),[contrast,setContrast]=useState(100),[detail,setDetail]=useState(1),[invert,setInvert]=useState(false),[dither,setDither]=useState(false),[fit,setFit]=useState("contain"),[playing,setPlaying]=useState(false),[recording,setRecording]=useState(false),[videoTime,setVideoTime]=useState(0),[videoDuration,setVideoDuration]=useState(0),[status,setStatus]=useState("Choose an image or video to start"),[copied,setCopied]=useState(false);
 const canvasRef=useRef<HTMLCanvasElement>(null),sourceCanvas=useRef<HTMLCanvasElement|null>(null),imageRef=useRef<HTMLImageElement|null>(null),videoRef=useRef<HTMLVideoElement|null>(null),fileRef=useRef<HTMLInputElement>(null),videoFileRef=useRef<HTMLInputElement>(null),textRef=useRef(""),raf=useRef(0),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]);
 const chars=charset==="custom"?customChars:(CHARSETS[charset]||CHARSETS.classic);
 const draw=useCallback((media:HTMLImageElement|HTMLVideoElement)=>{
  const out=canvasRef.current;if(!out)return;
  const sw=media instanceof HTMLVideoElement?media.videoWidth:media.naturalWidth,sh=media instanceof HTMLVideoElement?media.videoHeight:media.naturalHeight;
  if(!sw||!sh)return;
  const cols=Math.max(20,Math.min(300,width)),rows=Math.max(1,Math.round(cols*sh/sw*.55/detail)),cellW=fontSize*.62,cellH=fontSize*1.25;
  const w=Math.round(cols*cellW),h=Math.round(rows*cellH);out.width=w;out.height=h;
  const sample=document.createElement("canvas");sample.width=cols;sample.height=rows;
  const sc=sample.getContext("2d",{willReadFrequently:true});const ctx=out.getContext("2d");if(!sc||!ctx)return;
  if(fit==="stretch")sc.drawImage(media,0,0,cols,rows);else{sc.fillStyle=bg;sc.fillRect(0,0,cols,rows);const scale=(fit==="cover"?Math.max(cols/sw,rows/sh):Math.min(cols/sw,rows/sh));const dw=sw*scale,dh=sh*scale;sc.drawImage(media,(cols-dw)/2,(rows-dh)/2,dw,dh);}const pixels=sc.getImageData(0,0,cols,rows).data;
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.font=fontSize+"px "+font;ctx.textBaseline="top";
  const ramp=chars||CHARSETS.classic;let output="";
  const lum=new Float32Array(cols*rows);
  for(let i=0;i<cols*rows;i++){const p=i*4;let l=.2126*pixels[p]+.7152*pixels[p+1]+.0722*pixels[p+2];l=Math.max(0,Math.min(255,((l-128)*(contrast/100)+128+brightness)));lum[i]=l;}
  const matrix=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  for(let y=0;y<rows;y++){let line="";for(let x=0;x<cols;x++){
   let l=lum[y*cols+x];if(dither){const threshold=(matrix[y%4][x%4]/16-.5)*42;l=Math.max(0,Math.min(255,l+threshold));}
   if(invert)l=255-l;
   const index=Math.max(0,Math.min(ramp.length-1,Math.round((1-l/255)*(ramp.length-1))));const ch=ramp[index]||" ";
   line+=ch;
   if(colorMode==="color")ctx.fillStyle="rgb("+pixels[(y*cols+x)*4]+","+pixels[(y*cols+x)*4+1]+","+pixels[(y*cols+x)*4+2]+")";
   else if(colorMode==="green")ctx.fillStyle="#65ff9a";
   else if(colorMode==="amber")ctx.fillStyle="#ffbd59";
   else ctx.fillStyle=fg;
   ctx.fillText(ch,x*cellW,y*cellH);
  }output+=line+"\n";}
  textRef.current=output;sourceCanvas.current=sample;
 },[width,fontSize,font,chars,colorMode,fg,bg,brightness,contrast,detail,invert,dither,fit]);
 const renderCurrent=useCallback(()=>{if(source?.kind==="image"&&imageRef.current)draw(imageRef.current);if(source?.kind==="video"&&videoRef.current)draw(videoRef.current)},[source,draw]);
 useEffect(()=>{renderCurrent()},[renderCurrent]);
 useEffect(()=>{if(!playing||source?.kind!=="video")return;const tick=()=>{renderCurrent();if(videoRef.current&&!videoRef.current.paused)raf.current=requestAnimationFrame(tick)};raf.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf.current)},[playing,source,renderCurrent]);
 useEffect(()=>()=>{if(source?.url)URL.revokeObjectURL(source.url);cancelAnimationFrame(raf.current);recorder.current?.stop()},[source?.url]);
 const load=(file?:File,kind:"image"|"video"="image")=>{if(!file)return;const url=URL.createObjectURL(file);setSource({url,kind,name:file.name});setPlaying(false);setStatus("Loaded "+file.name);if(kind==="image"){const im=new Image();im.onload=()=>{imageRef.current=im;draw(im)};im.onerror=()=>setStatus("This image could not be opened");im.src=url;}else{const v=videoRef.current;if(v){v.src=url;v.onloadedmetadata=()=>{draw(v);setStatus("Video ready · press Play to convert frames live")};}}};
 const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)};
 const exportPng=()=>{const c=canvasRef.current;if(!c)return;c.toBlob(b=>{if(b)download(b,"wicked-ascii.png")},"image/png")};
 const exportText=()=>download(new Blob([textRef.current],{type:"text/plain;charset=utf-8"}),"wicked-ascii.txt");
 const copyText=async()=>{try{await navigator.clipboard.writeText(textRef.current);setCopied(true);setStatus("ASCII copied to clipboard");setTimeout(()=>setCopied(false),1600)}catch{setStatus("Clipboard unavailable in this browser; use Download TXT instead")}};
 const toggleRecord=()=>{const c=canvasRef.current;if(!c||!("MediaRecorder"in window)||!c.captureStream){setStatus("Video recording is not supported in this browser");return;}if(recording){recorder.current?.stop();setRecording(false);setStatus("Finishing video export…");return;}const stream=c.captureStream(15);let mime="video/webm";if(!MediaRecorder.isTypeSupported(mime))mime="";try{const mr=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks.current=[];mr.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};mr.onstop=()=>{const blob=new Blob(chunks.current,{type:mr.mimeType||"video/webm"});download(blob,"wicked-ascii-video.webm");stream.getTracks().forEach(t=>t.stop());setStatus("ASCII video exported")};mr.start();recorder.current=mr;setRecording(true);setStatus("Recording ASCII video · stop to export");}catch{setStatus("Video recording could not start on this device");}};
 const clear=()=>{setSource(null);imageRef.current=null;setPlaying(false);setStatus("Choose an image or video to start");const c=canvasRef.current;if(c){c.width=800;c.height=450;c.getContext("2d")?.clearRect(0,0,c.width,c.height)}textRef.current=""};
 return <main className="asciiApp">
  <header className="asciiHeader"><a href="/dashboard">← Workspace</a><div><b>WICKED STUDIO</b><small>ASCII ART & VIDEO STUDIO</small></div><span>Local processing · No AI key</span></header>
  <section className="asciiIntro"><p className="eyebrow">IMAGE · VIDEO · TEXT EXPORT</p><h1>Turn pixels into <em>characters.</em></h1><p>Convert photos and video into editable ASCII art. Tune the character map, density, tone and color, then export your result.</p><div className="asciiImport"><button className="primary" onClick={()=>fileRef.current?.click()}>＋ Choose image</button><button onClick={()=>videoFileRef.current?.click()}>Choose video</button><button onClick={clear}>Clear</button><span>{source?.name||"PNG · JPG · WEBP · MP4 · MOV (browser-supported formats)"}</span></div></section>
  <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{load(e.target.files?.[0],"image");e.currentTarget.value=""}}/>
  <input ref={videoFileRef} hidden type="file" accept="video/*" onChange={e=>{load(e.target.files?.[0],"video");e.currentTarget.value=""}}/>
  <div className="asciiLayout"><section className="asciiStage"><div className="asciiStageHead"><b>LIVE ASCII OUTPUT</b><span>{source?source.kind.toUpperCase()+" · "+width+" COLUMNS":"Waiting for media"}</span></div><div className="asciiCanvasWrap">{source?.kind==="video"&&<video ref={videoRef} src={source.url} playsInline muted loop onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>{setVideoTime(e.currentTarget.currentTime);renderCurrent()}} onLoadedMetadata={e=>{setVideoDuration(e.currentTarget.duration);renderCurrent()}} onLoadedData={renderCurrent}/>}<canvas ref={canvasRef} aria-label="Live ASCII art preview"/></div><div className="asciiVideoScrub">{source?.kind==="video"&&<><span>{videoTime.toFixed(1)}s</span><input aria-label="Seek video" type="range" min="0" max={Math.max(.1,videoDuration)} step=".1" value={Math.min(videoTime,videoDuration||0)} onChange={e=>{const v=videoRef.current;if(v)v.currentTime=+e.target.value}}/><span>{videoDuration.toFixed(1)}s</span></>}</div><div className="asciiActions"><button onClick={exportPng} disabled={!source}>Export PNG</button><button onClick={exportText} disabled={!source}>Download TXT</button><button onClick={copyText} disabled={!source}>{copied?"Copied!":"Copy ASCII"}</button>{source?.kind==="video"&&<><button onClick={()=>{const v=videoRef.current;if(!v)return;if(v.paused)void v.play();else v.pause()}}>{playing?"Pause video":"▶ Play video"}</button><button className="primary" onClick={toggleRecord} disabled={!source}>{recording?"Stop & export video":"Record ASCII video"}</button></>}</div><p className="asciiStatus">{status}</p></section>
  <aside className="asciiControls"><h3>CONVERSION CONTROLS</h3>
   <label>Character set<select value={charset} onChange={e=>setCharset(e.target.value)}><option value="classic">Classic ASCII</option><option value="dense">Dense detail</option><option value="blocks">Block characters</option><option value="minimal">Minimal</option><option value="binary">Binary 1 / 0</option><option value="dots">Dots</option><option value="matrix">Matrix / Katakana style</option><option value="custom">Custom characters</option></select></label>
   {charset==="custom"&&<label>Custom character ramp<input value={customChars} onChange={e=>setCustomChars(e.target.value)} maxLength={160}/></label>}
   <label>Output width <strong>{width} columns</strong><input type="range" min="30" max="240" step="5" value={width} onChange={e=>setWidth(+e.target.value)}/></label>
   <label>Character size <strong>{fontSize}px</strong><input type="range" min="6" max="18" value={fontSize} onChange={e=>setFontSize(+e.target.value)}/></label>
   <label>Image fitting<select value={fit} onChange={e=>setFit(e.target.value)}><option value="contain">Contain</option><option value="cover">Cover / crop</option><option value="stretch">Stretch</option></select></label>\n   <label>Font<select value={font} onChange={e=>setFont(e.target.value)}><option value="monospace">Monospace</option><option value="Courier New">Courier New</option><option value="ui-monospace">System Mono</option></select></label>
   <label>Detail / aspect <strong>{detail.toFixed(1)}×</strong><input type="range" min=".6" max="1.6" step=".1" value={detail} onChange={e=>setDetail(+e.target.value)}/></label>
   <label>Brightness <strong>{brightness}</strong><input type="range" min="-100" max="100" value={brightness} onChange={e=>setBrightness(+e.target.value)}/></label>
   <label>Contrast <strong>{contrast}%</strong><input type="range" min="0" max="220" value={contrast} onChange={e=>setContrast(+e.target.value)}/></label>
   <label>Color mode<select value={colorMode} onChange={e=>setColorMode(e.target.value)}><option value="mono">Single color</option><option value="color">Original image colors</option><option value="green">Terminal green</option><option value="amber">Retro amber</option></select></label>
   {colorMode==="mono"&&<label>Text color<input type="color" value={fg} onChange={e=>setFg(e.target.value)}/></label>}
   <label>Background<input type="color" value={bg} onChange={e=>setBg(e.target.value)}/></label>
   <label className="asciiCheck"><input type="checkbox" checked={invert} onChange={e=>setInvert(e.target.checked)}/> Invert luminance</label>
   <label className="asciiCheck"><input type="checkbox" checked={dither} onChange={e=>setDither(e.target.checked)}/> Ordered dithering</label>
   <div className="asciiPreset"><b>QUICK PRESETS</b><div><button onClick={()=>{setCharset("classic");setColorMode("mono");setFg("#e8dcff");setBg("#09070e");setWidth(120);setContrast(100);setBrightness(0);setInvert(false)}}>Classic</button><button onClick={()=>{setCharset("matrix");setColorMode("green");setBg("#020b05");setWidth(150);setContrast(140)}}>Matrix</button><button onClick={()=>{setCharset("blocks");setColorMode("color");setBg("#050505");setWidth(160)}}>Color blocks</button><button onClick={()=>{setCharset("binary");setColorMode("green");setBg("#020b05");setWidth(130)}}>Binary</button></div></div>
   <p>Large output widths and video processing use more device memory. For best results, start around 100–140 columns.</p>
  </aside></div>
  <footer className="asciiFooter">Wicked Studio ASCII Studio · Image and video conversion runs on your device. Video export uses browser MediaRecorder support.</footer>
 </main>;
}
