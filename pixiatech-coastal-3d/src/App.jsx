import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowDown, ChevronDown, MonitorUp, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x-a)/(b-a), 0, 1); return t*t*(3-2*t); };

function Building({ position, scale, color, screen=false, videoTexture }) {
  const mat = useRef();
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.48} roughness={0.34} />
      </mesh>
      {/* Small repeating windows add a readable architectural rhythm without a huge mesh. */}
      {Array.from({length: 4}, (_, row) => Array.from({length: 3}, (_, col) => (
        <mesh key={`${row}-${col}`} position={[-0.29 + col*0.29, -0.34 + row*0.22, 0.505]}>
          <planeGeometry args={[0.12, 0.09]} />
          <meshStandardMaterial color={screen ? '#14283a' : (row % 2 ? '#b5d5e7' : '#54748b')} emissive={screen ? '#081b2a' : '#152b3b'} emissiveIntensity={0.45} roughness={0.28} />
        </mesh>
      )))}
      {screen && (
        <mesh position={[0, 0.05, 0.512]}>
          <planeGeometry args={[0.82, 0.462]} />
          <meshBasicMaterial map={videoTexture || undefined} color={videoTexture ? '#ffffff' : '#32b9ff'} toneMapped={false} />
        </mesh>
      )}
      {screen && !videoTexture && (
        <mesh position={[0, 0.05, 0.514]}>
          <planeGeometry args={[0.82, 0.462]} />
          <meshBasicMaterial color="#07182a" />
        </mesh>
      )}
      {screen && !videoTexture && <ScreenGraphics />}
    </group>
  );
}

function ScreenGraphics() {
  const ref = useRef();
  useFrame(({ clock }) => { if (ref.current) ref.current.material.opacity = 0.72 + Math.sin(clock.elapsedTime*1.2)*0.12; });
  return (
    <group position={[0,0.05,0.518]}>
      <mesh ref={ref}>
        <planeGeometry args={[0.82,0.462]} />
        <meshBasicMaterial color="#08a9e8" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.06,0.015,0.002]}>
        <planeGeometry args={[0.66,0.07]} />
        <meshBasicMaterial color="#f6a65a" />
      </mesh>
      <mesh position={[-0.04,-0.085,0.003]} rotation={[0,0,-0.25]}>
        <planeGeometry args={[0.86,0.035]} />
        <meshBasicMaterial color="#d9f7ff" />
      </mesh>
    </group>
  );
}

function City({ videoTexture, progress }) {
  const buildings = React.useMemo(() => {
    const list = [];
    let seed = 92841;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed-1)/2147483646; };
    for (let i=0; i<110; i++) {
      const x = (rand()-0.5)*34;
      const z = -3 - rand()*24;
      if (Math.abs(x) < 2.4 && z < -7 && z > -18) continue;
      const h = 1.2 + rand()*5.6;
      list.push({ key:i, x, z, h, w:0.65+rand()*1.6, d:0.65+rand()*1.3, color:['#314658','#526777','#293b4c','#6d7f8b','#3c5364'][Math.floor(rand()*5)] });
    }
    return list;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.08,0]} receiveShadow>
        <planeGeometry args={[100,100]} />
        <meshStandardMaterial color="#172b34" roughness={0.92} />
      </mesh>
      {/* Waterfront / sea behind skyline */}
      <mesh position={[0,0.05,-30]}>
        <planeGeometry args={[100,32]} />
        <meshStandardMaterial color="#1b6985" metalness={0.18} roughness={0.38} />
      </mesh>
      {Array.from({length:18},(_,i)=><mesh key={i} position={[-22+i*2.6,0.025,-23]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.1,0.035]} /><meshBasicMaterial color={i%3===0?'#7ed7e8':'#356f82'} />
      </mesh>)}
      {buildings.map(b=><Building key={b.key} position={[b.x,b.h/2-0.02,b.z]} scale={[b.w,b.h,b.d]} color={b.color} />)}
      {/* Hero tower with a landscape 16:9 screen facing the camera */}
      <group position={[0,0,-10]}>
        <Building position={[0,3.6,0]} scale={[3.15,7.2,1.35]} color="#263e50" />
        <mesh position={[0,3.75,0.69]}>
          <planeGeometry args={[2.12,1.1925]} />
          <meshBasicMaterial color="#081522" />
        </mesh>
        <mesh position={[0,3.75,0.705]}>
          <planeGeometry args={[2.04,1.1475]} />
          <meshBasicMaterial map={videoTexture || undefined} color={videoTexture ? '#ffffff' : '#08a9e8'} toneMapped={false} />
        </mesh>
        {!videoTexture && <group position={[0,3.75,0.71]}>
          <mesh rotation={[0,0,-0.17]} position={[0,0.12,0]}><planeGeometry args={[2.0,0.17]} /><meshBasicMaterial color="#6ae2ff" /></mesh>
          <mesh rotation={[0,0,0.12]} position={[0,-0.22,0.001]}><planeGeometry args={[2.0,0.12]} /><meshBasicMaterial color="#f7a65c" /></mesh>
        </group>}
      </group>
      {/* Harbor cranes and piers */}
      {[-8,-5,5,8].map((x,i)=><group key={i} position={[x,0.02,-20]}>
        <mesh position={[0,1.1,0]}><boxGeometry args={[0.12,2.2,0.12]} /><meshStandardMaterial color="#d59b56" metalness={0.5}/></mesh>
        <mesh position={[0.8,2.1,0]}><boxGeometry args={[1.7,0.09,0.09]} /><meshStandardMaterial color="#d59b56" metalness={0.5}/></mesh>
      </group>)}
      <RoadTraffic />
      {/* A restrained shoreline and pier silhouette */}
      <mesh position={[0,0.03,-18]}><boxGeometry args={[24,0.12,2.5]} /><meshStandardMaterial color="#697783" /></mesh>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[-9+i*2.25,0.13,-18]}><boxGeometry args={[0.12,0.12,2.7]} /><meshStandardMaterial color="#9aa8b0" /></mesh>)}
    </group>
  );
}

function RoadTraffic() {
  const cars = useRef([]);
  const lanes = React.useMemo(()=>Array.from({length:16},(_,i)=>({
    x: -9 + (i%4)*6,
    z: 1 + Math.floor(i/4)*1.25,
    speed: (i%2===0?1:-1)*(0.65+(i%5)*0.16),
    color: ['#d8e2e8','#e4a05a','#416b91','#b94f49','#202c37'][i%5]
  })),[]);
  useFrame((_, delta)=>{
    cars.current.forEach((obj,i)=>{
      if (!obj) return;
      const lane=lanes[i];
      obj.position.x += lane.speed*delta;
      if(obj.position.x>15) obj.position.x=-15;
      if(obj.position.x< -15) obj.position.x=15;
    });
  });
  return <group>{lanes.map((c,i)=><mesh key={i} ref={el=>cars.current[i]=el} position={[c.x,0.13,c.z]} rotation={[0, c.speed<0?Math.PI:0, 0]} castShadow>
    <boxGeometry args={[0.78,0.22,0.38]} /><meshStandardMaterial color={c.color} metalness={0.4} roughness={0.34}/>
    <mesh position={[0,0.01,0.195]}><boxGeometry args={[0.35,0.1,0.012]}/><meshStandardMaterial color="#a9d9ed" metalness={0.3}/></mesh>
  </mesh>)}</group>;
}

function PixelField({ progress }) {
  const group = useRef();
  const { camera } = useThree();
  const points = React.useMemo(()=>{
    const a=[];
    for(let i=0;i<1900;i++){
      a.push((Math.random()-0.5)*12,(Math.random()-0.5)*7,(Math.random()-0.5)*1.2);
    }
    return new Float32Array(a);
  },[]);
  return <group ref={group} position={[0,0,-0.9]} visible={progress>0.76}>
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[points,3]}/></bufferGeometry>
      <pointsMaterial size={0.018} color="#7adfff" sizeAttenuation transparent opacity={smooth(0.76,0.9,progress)} />
    </points>
  </group>;
}

function CameraRig({ progress }) {
  const { camera } = useThree();
  useFrame(()=>{
    // One continuous forward move. Screen remains on the central camera axis.
    const p = clamp(progress,0,1);
    const z = THREE.MathUtils.lerp(13, -8.7, smooth(0,0.94,p));
    const y = THREE.MathUtils.lerp(5.3, 3.9, smooth(0,0.72,p));
    camera.position.set(0, y, z);
    camera.lookAt(0,3.75,-10);
    camera.fov = THREE.MathUtils.lerp(44, 37, smooth(0.72,1,p));
    camera.updateProjectionMatrix();
  });
  return null;
}

function Scene({ progress, videoTexture, reducedMotion }) {
  return <>
    <color attach="background" args={['#a9c7d5']} />
    <fog attach="fog" args={['#a9c7d5', 22, 62]} />
    <ambientLight intensity={1.15} />
    <directionalLight position={[-8,14,9]} intensity={2.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <hemisphereLight args={['#d6f1ff','#253442',0.9]} />
    <Suspense fallback={null}>
      <City videoTexture={videoTexture} progress={progress} />
      <PixelField progress={progress} />
      <CameraRig progress={reducedMotion ? 0 : progress} />
      <Environment preset="city" />
    </Suspense>
  </>;
}

export default function App() {
  const [progress,setProgress] = useState(0);
  const [videoUrl,setVideoUrl] = useState('');
  const [reducedMotion,setReducedMotion] = useState(false);
  const [muted,setMuted] = useState(true);
  const videoRef = useRef(null);
  const scrollRef = useRef(null);
  const [mobile,setMobile] = useState(false);
  useEffect(()=>{
    const onScroll=()=>{
      const el=scrollRef.current;
      if(!el) return;
      const rect=el.getBoundingClientRect();
      const distance=Math.max(1,el.offsetHeight-window.innerHeight);
      setProgress(clamp(-rect.top/distance,0,1));
    };
    const onResize=()=>setMobile(window.innerWidth<720);
    onScroll(); onResize();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onResize);
    return ()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);};
  },[]);
  useEffect(()=>{
    if(!videoRef.current) return;
    if(videoUrl) {
      const texture=new THREE.VideoTexture(videoRef.current);
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.minFilter=THREE.LinearFilter;
      texture.magFilter=THREE.LinearFilter;
      // Store texture on window only for the simple demo's scene bridge.
      window.__pxtVideoTexture = texture;
      const tick=setInterval(()=>window.dispatchEvent(new Event('pxt-video-ready')),250);
      return ()=>clearInterval(tick);
    }
  },[videoUrl]);
  const [videoTexture,setVideoTexture] = useState(null);
  useEffect(()=>{
    const handler=()=>setVideoTexture(window.__pxtVideoTexture || null);
    window.addEventListener('pxt-video-ready',handler);
    return ()=>window.removeEventListener('pxt-video-ready',handler);
  },[]);
  const chooseVideo=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
  };
  const reset=()=>{window.scrollTo({top:0,behavior:'smooth'});setReducedMotion(false);};
  return <main>
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();reset();}}><span className="brand-mark">P</span><span>PIXIA<span className="brand-light">TECH</span></span></a>
      <div className="top-meta"><span className="live-dot"/> INTERACTIVE EXPERIENCE <span className="meta-sep">/</span> CONCEPT 01</div>
      <label className="upload-btn"><MonitorUp size={16}/><span>Changer la vidéo</span><input type="file" accept="video/*" onChange={chooseVideo}/></label>
    </header>
    <section className="intro">
      <div className="eyebrow"><span>01</span><i/> ONE PIXEL TO THE CITY</div>
      <h1>Un pixel.<br/><em>Une ville entière.</em></h1>
      <p>Une expérience de zoom avant contrôlée par le scroll, du paysage côtier jusqu'à la surface d'un écran LED.</p>
      <a className="scroll-cue" href="#experience"><span className="scroll-icon"><ArrowDown size={17}/></span> FAITES DÉFILER POUR EXPLORER</a>
    </section>
    <section className="experience" id="experience" ref={scrollRef}>
      <div className="sticky-stage">
        <Canvas shadows dpr={mobile?[1,1.35]:[1,1.7]} camera={{position:[0,5.3,13],fov:44}} gl={{antialias:!mobile, alpha:false, powerPreference:'high-performance'}} fallback={<div className="fallback">La scène 3D n'est pas prise en charge par ce navigateur.</div>}>
          <Scene progress={progress} videoTexture={videoTexture} reducedMotion={reducedMotion}/>
        </Canvas>
        <div className="scene-vignette"/>
        <div className="scene-caption">
          <span className="scene-kicker">PIXIATECH / COASTAL METROPOLIS</span>
          <h2>{progress<0.22?'La ville en perspective':progress<0.52?'Un écran au cœur de la ville':progress<0.78?'Approche de la surface LED':'À l’échelle du pixel'}</h2>
          <p>{progress<0.22?'Une vue frontale sur une métropole mondiale.':progress<0.52?'La caméra avance sur un axe central, l’écran reste dans le cadre.':progress<0.78?'Les détails de l’écran deviennent visibles.':'Le voyage atteint la surface lumineuse.'}</p>
        </div>
        <div className="progress-ui"><span>SCROLL JOURNEY</span><div className="progress-track"><i style={{transform:`scaleX(${progress})`}}/></div><span>{String(Math.round(progress*100)).padStart(2,'0')}%</span></div>
        <button className="reset-btn" onClick={reset} aria-label="Recommencer l'expérience"><RotateCcw size={15}/></button>
        <div className="stage-note"><span className="live-dot"/> {videoUrl?'VIDÉO PERSONNALISÉE':'DÉMO 3D'} <span className="meta-sep">·</span> {mobile?'MOBILE QUALITY':'REAL-TIME RENDER'}</div>
      </div>
    </section>
    <section className="outro">
      <div className="eyebrow"><span>02</span><i/> BUILT FOR PIXIATECH</div>
      <h2>La technologie<br/><em>prend de la hauteur.</em></h2>
      <p>Prototype interactif React + Three.js. Les voitures circulent en continu et le défilement pilote le travelling avant.</p>
      <div className="feature-row"><span>01 / CAMÉRA AXIALE</span><span>02 / TRAFIC ANIMÉ</span><span>03 / ÉCRAN 16:9</span><span>04 / VIDÉO PERSONNALISABLE</span></div>
      <button className="primary-btn" onClick={reset}>Revoir l'expérience <ChevronDown size={16}/></button>
    </section>
    <footer><span>© PIXIATECH — CONCEPT INTERACTIF</span><span>REACT / THREE.JS / WEBGL</span></footer>
    <video ref={videoRef} src={videoUrl || undefined} muted={muted} loop playsInline autoPlay style={{display:'none'}} onLoadedData={e=>{e.currentTarget.play().catch(()=>{});}}/>
  </main>;
}
