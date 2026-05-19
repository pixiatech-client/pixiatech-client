import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useVideoTexture, OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Monitor, Grid, Layout as LayoutIcon, Settings, RotateCcw, Layout, Sun, Moon } from "lucide-react";

interface Screen3DProps {
  width: number;
  height: number;
  isCurved: boolean;
  curveLeft: number;
  curveRight: number;
  envColor: string;
  gridColor: string;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  videoUrl?: string;
}

function Dalle({ position, args, texture, uvOffset, uvScale, isPlaying }: { position: [number, number, number], args: [number, number], texture: THREE.Texture | null, uvOffset: [number, number], uvScale: [number, number], isPlaying: boolean }) {
  const DEPTH = 0.15; // Reduced thickness to 15cm as requested
  
  const geometry = React.useMemo(() => {
    const geo = new THREE.BoxGeometry(args[0], args[1], DEPTH);
    const uvs = geo.attributes.uv;
    for (let i = 16; i < 20; i++) {
        const u = uvs.getX(i);
        const v = uvs.getY(i);
        uvs.setXY(i, u * uvScale[0] + uvOffset[0], v * uvScale[1] + uvOffset[1]);
    }
    return geo;
  }, [args, uvOffset, uvScale]);

  const materials = React.useMemo(() => {
    const blackMaterial = new THREE.MeshStandardMaterial({ 
      color: "#050505", 
      roughness: 0.9, 
      metalness: 0.1 
    });
    
    const ledMaterial = new THREE.MeshBasicMaterial({
      color: texture && isPlaying ? "#ffffff" : "#050505",
      map: texture && isPlaying ? texture : null,
    });

    return [
      blackMaterial, // right
      blackMaterial, // left
      blackMaterial, // top
      blackMaterial, // bottom
      ledMaterial,   // front
      blackMaterial  // back
    ];
  }, [texture, isPlaying]);

  return (
    <group position={position}>
      <mesh geometry={geometry} material={materials} castShadow receiveShadow />
    </group>
  );
}

function HumanSilhouette({ position, isDarkMode = false }: { position: [number, number, number], isDarkMode?: boolean }) {
  const bodyColor = isDarkMode ? "#ffffff" : "#020617";
  const secondaryColor = isDarkMode ? "#94a3b8" : "#334155";
  
  return (
    <group position={position}>
      <mesh position={[0, 1.74, 0]} castShadow>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial 
          color={bodyColor} 
          roughness={0.2} 
          metalness={isDarkMode ? 0.8 : 0.1}
          transparent={isDarkMode}
          opacity={isDarkMode ? 0.9 : 1}
        />
      </mesh>
      
      <mesh position={[0, 1.66, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.04, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} />
      </mesh>

      <group position={[0, 1.38, 0]}>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.07, 0.3, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.6, 12]} />
          <meshStandardMaterial color={bodyColor} roughness={0.3} />
        </mesh>
      </group>

      <group position={[-0.22, 1.58, 0]} rotation={[0, 0.1, 0.1]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0.02, -0.45, 0.05]} rotation={[0.4, 0, 0]} castShadow>
          <capsuleGeometry args={[0.038, 0.25, 4, 8]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      </group>

      <group position={[0.22, 1.58, 0]} rotation={[0, -0.1, -0.1]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[-0.02, -0.45, 0.05]} rotation={[0.4, 0, 0]} castShadow>
          <capsuleGeometry args={[0.038, 0.25, 4, 8]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      </group>

      <group position={[0, 0.85, 0]}>
        <mesh position={[-0.09, -0.4, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.85, 4, 12]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0.09, -0.4, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.85, 4, 12]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      </group>

      <mesh position={[-0.09, 0.03, 0.08]} castShadow>
        <boxGeometry args={[0.07, 0.05, 0.18]} />
        <meshStandardMaterial color={secondaryColor} />
      </mesh>
      <mesh position={[0.09, 0.03, 0.08]} castShadow>
        <boxGeometry args={[0.07, 0.05, 0.18]} />
        <meshStandardMaterial color={secondaryColor} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial 
          color="black" 
          transparent={true} 
          opacity={isDarkMode ? 0.3 : 0.1} 
        />
      </mesh>
      
      <group position={[0.9, 0, 0]}>
        <DimensionLine 
          start={new THREE.Vector3(0, 0, 0)} 
          end={new THREE.Vector3(0, 1.83, 0)} 
          label="1.83 M" 
          color="#1e293b"
          isDarkMode={isDarkMode}
        />
      </group>
    </group>
  );
}

function DimensionLine({ start, end, label, color = "#1e293b", isDarkMode = false }: { start: THREE.Vector3, end: THREE.Vector3, label: string, color?: string, isDarkMode?: boolean }) {
  const lineRef = useRef<THREE.BufferGeometry>(null);
  
  React.useEffect(() => {
    if (lineRef.current) {
      lineRef.current.setFromPoints([start, end]);
    }
  }, [start, end]);
  
  return (
    <group>
      <line>
        <bufferGeometry ref={lineRef} attach="geometry" />
        <lineBasicMaterial attach="material" color={isDarkMode ? "#ffffff" : color} transparent opacity={0.6} linewidth={2} />
      </line>
      <mesh position={[start.x, start.y, start.z]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color={isDarkMode ? "#ffffff" : color} />
      </mesh>
      <mesh position={[end.x, end.y, end.z]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color={isDarkMode ? "#ffffff" : color} />
      </mesh>
      
      <Html 
        position={[(start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2]} 
        center 
        distanceFactor={10}
      >
        <div className={`px-2 py-1 backdrop-blur-md border rounded text-[8px] font-black whitespace-nowrap shadow-xl italic tracking-tighter uppercase transition-all hover:scale-110 ${
          isDarkMode 
          ? "bg-white border-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
          : "bg-white/90 border-white text-slate-900 shadow-lg shadow-black/5"
        }`}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function Screen({ width, height, isCurved, curveLeft, curveRight, isDarkMode, videoUrl }: Screen3DProps & { isDarkMode: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = React.useState<THREE.VideoTexture | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const startVideo = React.useCallback(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    
    const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
    const resolvedUrl = isYouTube 
      ? '/youtube-video.mp4' 
      : (videoUrl || 'https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.firebasestorage.app/o/uploads%2F1765799832313_Devis%20Ecran.mp4?alt=media&token=99eec72d-0dab-4adb-bf36-061263381e09');

    video.src = resolvedUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const handleSuccess = () => {
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = true; 
      setTexture(tex);
      setIsPlaying(true);
      setHasError(false);
    };

    video.addEventListener('canplay', handleSuccess);
    video.addEventListener('playing', handleSuccess);
    
    video.play().catch((err) => {
      console.warn("Retrying with backup source due to:", err.message);
      if (video.src !== 'https://vjs.zencdn.net/v/oceans.mp4') {
        video.src = 'https://vjs.zencdn.net/v/oceans.mp4';
        video.play().catch(() => setHasError(true));
      }
    });

    return video;
  }, [videoUrl]);

  React.useEffect(() => {
    const v = startVideo();
    return () => {
      v.pause();
      v.src = '';
      v.load();
    };
  }, [startVideo]);

  const DALLE_SIZE = 0.5;

  const renderCurvedScreen = () => {
    const modulesX = Math.ceil(width / DALLE_SIZE);
    const actualDalleW = width / modulesX;
    const modulesY = Math.ceil(height / DALLE_SIZE);
    const actualDalleH = height / modulesY;

    const columns = [];
    let currentX = 0;
    let currentZ = 0;
    
    const wingW = width * 0.25;
    const centerW = width * 0.5;
    const lCols = Math.ceil(wingW / actualDalleW);
    const rCols = Math.ceil(wingW / actualDalleW);

    let currentAngle = isCurved ? -THREE.MathUtils.degToRad(curveLeft * 2) : 0;

    for (let ix = 0; ix < modulesX; ix++) {
      const xPosTexture = ix * actualDalleW;
      let angleStep = 0;

      if (isCurved) {
        if (xPosTexture < wingW) {
          angleStep = THREE.MathUtils.degToRad(curveLeft * 2) / lCols;
        } else if (xPosTexture >= wingW + centerW) {
          angleStep = -THREE.MathUtils.degToRad(curveRight * 2) / rCols;
        }
      }

      const tiles = [];
      for (let iy = 0; iy < modulesY; iy++) {
        const uvOffsetX = (ix * actualDalleW) / width;
        const uvOffsetY = (iy * actualDalleH) / height;
        const uvScaleX = actualDalleW / width;
        const uvScaleY = actualDalleH / height;

        tiles.push(
          <Dalle 
            key={`${ix}-${iy}`}
            position={[0, (iy * actualDalleH) + (actualDalleH / 2), 0]}
            args={[actualDalleW, actualDalleH]}
            texture={texture}
            uvOffset={[uvOffsetX, uvOffsetY]}
            uvScale={[uvScaleX, uvScaleY]}
            isPlaying={isPlaying}
          />
        );
      }

      columns.push(
        <group key={`col-${ix}`} position={[currentX, 0, currentZ]} rotation={[0, currentAngle, 0]}>
          {tiles}
        </group>
      );

      currentX += Math.cos(currentAngle) * actualDalleW;
      currentZ -= Math.sin(currentAngle) * actualDalleW;
      currentAngle += angleStep;
    }

    return (
      <group position={[-currentX / 2, 0, -currentZ / 2]}>
        {columns}
        
        <DimensionLine 
          start={new THREE.Vector3(0, height + 0.5, 0)} 
          end={new THREE.Vector3(currentX, height + 0.5, currentZ)} 
          label={`LARGEUR: ${width.toFixed(2)} M`} 
          color="#1e293b"
          isDarkMode={isDarkMode}
        />
        
        <DimensionLine 
          start={new THREE.Vector3(-0.9, 0, 0)} 
          end={new THREE.Vector3(-0.9, height, 0)} 
          label={`HAUTEUR: ${height.toFixed(2)} M`} 
          color="#1e293b"
          isDarkMode={isDarkMode}
        />
      </group>
    );
  };

  return (
    <group ref={meshRef}>
      {renderCurvedScreen()}
      <HumanSilhouette position={[width / 2 + 1.2, 0, 0.5]} isDarkMode={isDarkMode} />
    </group>
  );
}

function MouseIcon({ highlight, isDarkMode = false }: { highlight: 'left' | 'right' | 'wheel', isDarkMode?: boolean }) {
  const mainColor = isDarkMode ? "white" : "black";
  const contrastColor = isDarkMode ? "black" : "white";
  
  return (
    <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm scale-110">
      <rect x="2" y="2" width="20" height="32" rx="10" fill={mainColor} stroke={mainColor} strokeWidth="1" />
      <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V16H2V12Z" fill={mainColor} />
      <path 
        d="M12 2C6.47715 2 2 6.47715 2 12V16H12V2Z" 
        fill={highlight === 'left' ? "#3B82F6" : "transparent"} 
        stroke={highlight === 'left' ? "#3B82F6" : isDarkMode ? "#ddd" : "#333"} 
        strokeWidth="0.5"
      />
      <path 
        d="M12 2C17.5228 2 22 6.47715 22 12V16H12V2Z" 
        fill={highlight === 'right' ? "#A855F7" : "transparent"} 
        stroke={highlight === 'right' ? "#A855F7" : isDarkMode ? "#ddd" : "#333"} 
        strokeWidth="0.5"
      />
      <line x1="12" y1="2" x2="12" y2="16" stroke={contrastColor} strokeWidth="0.5" strokeOpacity="0.2" />
      <line x1="2" y1="16" x2="22" y2="16" stroke={contrastColor} strokeWidth="0.5" strokeOpacity="0.2" />
      <rect 
        x="10" y="7" width="4" height="8" rx="2" 
        fill={highlight === 'wheel' ? "#C6FF00" : isDarkMode ? "#eee" : "#222"} 
        stroke={highlight === 'wheel' ? "#C6FF00" : isDarkMode ? "#ddd" : "#444"} 
        strokeWidth="1" 
      />
    </svg>
  );
}

export default function ScreenViewer(props: Screen3DProps) {
  const { envColor, gridColor, isCurved, isDarkMode, setIsDarkMode } = props;
  const controlsRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (controlsRef.current) {
      const maxDim = Math.max(props.width, props.height);
      const zoomBase = maxDim * 1.5;
      const heightOffset = props.height * 0.45;

      if (!isCurved) {
        controlsRef.current.object.position.set(zoomBase * 0.6, zoomBase * 0.35, zoomBase * 0.9);
        controlsRef.current.target.set(0, heightOffset, 0);
      } else {
        controlsRef.current.object.position.set(zoomBase * 0.7, zoomBase * 0.45, zoomBase * 1.0);
        controlsRef.current.target.set(0, heightOffset, 0);
      }
      
      controlsRef.current.update();
    }
  }, [isCurved, props.width, props.height]);
  
  const currentEnv = isDarkMode ? "#020617" : envColor;
  const currentGrid = isDarkMode ? "#1e293b" : gridColor;

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-inner group" style={{ background: currentEnv }}>
      <Canvas shadows gl={{ antialias: true, logarithmicDepthBuffer: true }} style={{ background: currentEnv }}>
        <PerspectiveCamera makeDefault position={[14, 8, 20]} fov={40} />
        <OrbitControls 
          ref={controlsRef}
          enablePan={true} 
          enableZoom={true} 
          minDistance={1} 
          maxDistance={50} 
          maxPolarAngle={Math.PI / 1.5}
        />
        
        <ambientLight intensity={isDarkMode ? 0.4 : 1} />
        <directionalLight position={[10, 20, 10]} intensity={isDarkMode ? 0.8 : 1.5} castShadow />
        <pointLight position={[-15, 10, 15]} intensity={isDarkMode ? 1.5 : 1} color="#c6ff00" />
        
        <Suspense fallback={null}>
          <Screen {...props} isDarkMode={isDarkMode} />
        </Suspense>

        <group position={[0, -0.01, 0]}>
          <gridHelper args={[100, 100, currentGrid, currentGrid]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={isDarkMode ? 0.3 : 0.15} />
          </mesh>
        </group>
        
        <Suspense fallback={null}>
          <Environment preset={isDarkMode ? "night" : "studio"} />
        </Suspense>
        
        <ContactShadows resolution={1024} scale={20} blur={2} opacity={isDarkMode ? 0.6 : 0.2} far={1.5} color="#000000" />
      </Canvas>

      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <span className={`text-[10px] uppercase tracking-[0.4em] font-black transition-colors duration-300 ${isDarkMode ? "text-[#c6ff00]" : "text-slate-500"}`}>Simulateur 3D</span>
        <div className={`h-0.5 w-16 rounded-full transition-colors duration-300 ${isDarkMode ? "bg-[#c6ff00]/40" : "bg-slate-300"}`} />
      </div>

      <div className="absolute top-8 right-8">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDarkMode 
            ? "bg-slate-900/80 backdrop-blur-md border border-white/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]" 
            : "bg-white/80 backdrop-blur-md border border-white/50 text-orange-400 shadow-xl"
          }`}
        >
          {isDarkMode ? <Moon className="w-6 h-6 fill-blue-400/20" /> : <Sun className="w-6 h-6 fill-orange-400/20" />}
        </button>
      </div>

      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-10 px-12 py-6 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-full border transition-all duration-700 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 ${
        isDarkMode 
        ? "bg-slate-950/95 border-white/10 text-white" 
        : "bg-white/95 border-slate-200 text-slate-900"
      }`}>
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 scale-90">
            <MouseIcon highlight="left" isDarkMode={isDarkMode} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] leading-none mb-1 opacity-40">Souris Gauche</span>
            <span className="text-xs font-black uppercase tracking-tight">Déplacer</span>
          </div>
        </div>
        
        <div className={`w-px h-8 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
        
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 scale-90">
            <MouseIcon highlight="right" isDarkMode={isDarkMode} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] leading-none mb-1 opacity-40">Souris Droit</span>
            <span className="text-xs font-black uppercase tracking-tight">Tourner</span>
          </div>
        </div>
        
        <div className={`w-px h-8 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
        
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 scale-90">
            <MouseIcon highlight="wheel" isDarkMode={isDarkMode} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] leading-none mb-1 opacity-40">Molette</span>
            <span className="text-xs font-black uppercase tracking-tight">Zoomer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
