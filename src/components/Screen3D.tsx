import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useVideoTexture, OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Monitor, Grid, Layout as LayoutIcon, Settings, RotateCcw, Layout, Sun, Moon, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

interface Screen3DProps {
  width: number;
  height: number;
  isCurved: boolean;
  is360?: boolean;
  diameter?: number;
  curveLeft: number;
  curveRight: number;
  envColor: string;
  gridColor: string;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  videoUrl?: string;
  t: any;
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

function HumanSilhouette({ 
  position, 
  isDarkMode = false,
  onDragStart,
  onDrag,
  onDragEnd
}: { 
  position: [number, number, number], 
  isDarkMode?: boolean,
  onDragStart?: () => void,
  onDrag?: (pos: [number, number, number]) => void,
  onDragEnd?: () => void
}) {
  const [dragging, setDragging] = React.useState(false);
  const planeXZ = React.useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersection = React.useMemo(() => new THREE.Vector3(), []);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setDragging(true);
    if (onDragStart) onDragStart();
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: any) => {
    if (!dragging) return;
    e.stopPropagation();
    e.ray.intersectPlane(planeXZ, intersection);
    if (onDrag) {
      onDrag([intersection.x, 0, intersection.z]);
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    setDragging(false);
    if (onDragEnd) onDragEnd();
    e.target.releasePointerCapture(e.pointerId);
  };

  const [hovered, setHovered] = React.useState(false);
  React.useEffect(() => {
    document.body.style.cursor = hovered ? (dragging ? 'grabbing' : 'grab') : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragging]);

  const bodyColor = isDarkMode ? "#ffffff" : "#020617";
  const secondaryColor = isDarkMode ? "#94a3b8" : "#334155";
  
  return (
    <group 
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
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
      
      <group position={[0.3, 0, 0]}>
        <DimensionLine 
          start={new THREE.Vector3(0, 0, 0)} 
          end={new THREE.Vector3(0, 1.83, 0)} 
          label="1.83 M" 
          color="#1e293b"
          isDarkMode={isDarkMode}
          occlude={true}
        />
      </group>
    </group>
  );
}

function DimensionLine({ 
  start, 
  end, 
  label, 
  color = "#1e293b", 
  isDarkMode = false,
  occlude = false
}: { 
  start: THREE.Vector3, 
  end: THREE.Vector3, 
  label: string, 
  color?: string, 
  isDarkMode?: boolean,
  occlude?: boolean
}) {
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
        position={[(start.x + end.x) / 2, ((start.y + end.y) / 2) + 0.05, (start.z + end.z) / 2]} 
        center
        occlude={occlude ? 'blending' : undefined}
      >
        <div className={`px-2.5 py-1 backdrop-blur-md border rounded-lg text-[10px] font-black whitespace-nowrap shadow-md italic tracking-wide uppercase transition-all hover:scale-105 ${
          isDarkMode 
          ? "bg-slate-950/80 border-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
          : "bg-white/90 border-slate-200 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        }`}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function Screen({ 
  width, 
  height, 
  isCurved, 
  is360 = false, 
  diameter = 1.0, 
  cabinetAngle = 0, 
  curveLeft, 
  curveRight, 
  isDarkMode, 
  videoUrl,
  setControlsEnabled
}: Screen3DProps & { 
  isDarkMode: boolean; 
  cabinetAngle?: number; 
  setControlsEnabled: (val: boolean) => void;
}) {
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

  // 360 mode parameters (dynamic or locked standard angles)
  const { modulesX: modulesX_360, R: R_360, angleStep: angleStep_360 } = React.useMemo(() => {
    const angle = cabinetAngle || 0;
    if (angle !== 0) {
      const absAngle = Math.abs(angle);
      const modulesX = 360 / absAngle;
      const theta = (absAngle * Math.PI) / 180;
      const R = 0.5 / (2 * Math.sin(theta / 2));
      return { modulesX, R, angleStep: theta * Math.sign(angle) };
    } else {
      const modulesX = Math.round((Math.PI * diameter) / 0.5);
      const angleStep = (2 * Math.PI) / modulesX;
      const R = 0.5 / (2 * Math.sin(angleStep / 2));
      return { modulesX, R, angleStep };
    }
  }, [cabinetAngle, diameter]);

  const modulesY_360 = Math.ceil(height / 0.5);
  const actualDalleH_360 = height / modulesY_360;
  const isConvex_360 = cabinetAngle <= 0; // Auto (0) and negative angles are convex

  // Track dynamic position of the human silhouette for dragging
  const defaultHumanPos = React.useMemo<[number, number, number]>(() => {
    return is360 
      ? (cabinetAngle > 0 ? [0, 0, 0] : [R_360 + 1.2, 0, 0]) 
      : [width / 2 + 1.2, 0, 0.5];
  }, [is360, cabinetAngle, width, R_360]);

  const [humanPos, setHumanPos] = React.useState<[number, number, number]>([0, 0, 0]);

  React.useEffect(() => {
    setHumanPos(defaultHumanPos);
  }, [defaultHumanPos]);

  // Shared backing cabinet geometry (extruded arc segment)
  const cabinetGeometry = React.useMemo(() => {
    if (!is360) return null;
    const depth = 0.12; // 12cm thickness
    const hCabinet = actualDalleH_360;
    const aLen = Math.abs(angleStep_360);
    
    const R_front = R_360;
    const R_back = isConvex_360 ? (R_360 - depth) : (R_360 + depth);
    
    const shape = new THREE.Shape();
    const halfAngle = aLen / 2;
    const startAngle = -halfAngle;
    const endAngle = halfAngle;
    
    // Front face (LED screen side)
    shape.absarc(0, 0, R_front, startAngle, endAngle, false);
    // Side wall 1
    shape.lineTo(R_back * Math.cos(endAngle), R_back * Math.sin(endAngle));
    // Back face (Frame side)
    shape.absarc(0, 0, R_back, endAngle, startAngle, true);
    // Side wall 2
    shape.closePath();
    
    const extrudeSettings = {
      depth: hCabinet,
      bevelEnabled: false,
      steps: 1
    };
    
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Extrude builds along Z, so rotate to align vertically along Y
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, -hCabinet / 2, 0); // Center vertically
    return geom;
  }, [is360, R_360, actualDalleH_360, angleStep_360, isConvex_360]);

  const cabinetMaterial = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isDarkMode ? "#0f172a" : "#334155",
      roughness: 0.5,
      metalness: 0.8
    });
  }, [isDarkMode]);

  const ledMaterial = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: texture && isPlaying ? "#ffffff" : "#111111",
      map: texture && isPlaying ? texture : null,
      emissive: texture && isPlaying ? "#ffffff" : "#000000",
      emissiveMap: texture && isPlaying ? texture : null,
      emissiveIntensity: isDarkMode ? 0.8 : 1.2,
      roughness: 0.25,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
  }, [texture, isPlaying, isDarkMode]);

  const renderCurvedScreen = () => {
    const modulesX = Math.ceil(width / DALLE_SIZE);
    const actualDalleW = width / modulesX;
    const modulesY = Math.ceil(height / DALLE_SIZE);
    const actualDalleH = height / modulesY;

    const columns = [];
    let currentX = 0;
    let currentZ = 0;
    
    const wingCols = Math.round(modulesX * 0.25);

    let currentAngle = isCurved ? -THREE.MathUtils.degToRad(curveLeft * 2) : 0;

    for (let ix = 0; ix < modulesX; ix++) {
      let angleStep = 0;

      if (isCurved && wingCols > 0) {
        if (ix < wingCols) {
          angleStep = THREE.MathUtils.degToRad(curveLeft * 2) / wingCols;
        } else if (ix >= modulesX - wingCols) {
          angleStep = -THREE.MathUtils.degToRad(curveRight * 2) / wingCols;
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
          occlude={true}
        />
        
        <DimensionLine 
          start={new THREE.Vector3(-0.9, 0, 0)} 
          end={new THREE.Vector3(-0.9, height, 0)} 
          label={`HAUTEUR: ${height.toFixed(2)} M`} 
          color="#1e293b"
          isDarkMode={isDarkMode}
          occlude={true}
        />
      </group>
    );
  };

  const renderCylindricalScreen = () => {
    // Generate angles for columns
    const columns = [];
    for (let ix = 0; ix < modulesX_360; ix++) {
      columns.push(ix * angleStep_360);
    }

    // Offset the screen radius slightly to prevent z-fighting with the front faces of backing cabinets
    const screenRadius = isConvex_360 ? (R_360 + 0.002) : (R_360 - 0.002);

    return (
      <group position={[0, 0, 0]}>
        {/* Render backing cabinet frames gapless */}
        {cabinetGeometry && columns.map((colAngle, ix) => (
          <group key={`col-${ix}`} rotation={[0, colAngle, 0]}>
            {Array.from({ length: modulesY_360 }).map((_, iy) => (
              <mesh
                key={`cab-${ix}-${iy}`}
                geometry={cabinetGeometry}
                material={cabinetMaterial}
                position={[0, (iy * actualDalleH_360) + (actualDalleH_360 / 2), 0]}
                castShadow
                receiveShadow
              />
            ))}
          </group>
        ))}

        {/* Render a single seamless Cylinder for the LED screens with emissive glowing materials */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry 
            args={[
              screenRadius, // radiusTop
              screenRadius, // radiusBottom
              height,       // height
              modulesX_360 * 8, // radialSegments for round smooth geometry
              1,            // heightSegments
              true          // openEnded
            ]} 
          />
          <primitive object={ledMaterial} attach="material" />
        </mesh>

        <DimensionLine 
          start={new THREE.Vector3(-R_360, height + 0.5, 0)} 
          end={new THREE.Vector3(R_360, height + 0.5, 0)} 
          label={`DIAMÈTRE: ${(R_360 * 2).toFixed(2)} M`} 
          color="#1e293b"
          isDarkMode={isDarkMode}
          occlude={false}
        />
        
        <DimensionLine 
          start={new THREE.Vector3(-R_360 - 0.4, 0, 0)} 
          end={new THREE.Vector3(-R_360 - 0.4, height, 0)} 
          label={`HAUTEUR: ${height.toFixed(2)} M`} 
          color="#1e293b"
          isDarkMode={isDarkMode}
          occlude={true}
        />
      </group>
    );
  };

  return (
    <group ref={meshRef}>
      {is360 ? renderCylindricalScreen() : renderCurvedScreen()}
      <HumanSilhouette 
        position={humanPos} 
        isDarkMode={isDarkMode} 
        onDragStart={() => setControlsEnabled(false)}
        onDrag={(pos) => setHumanPos(pos)}
        onDragEnd={() => setControlsEnabled(true)}
      />
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

export default function ScreenViewer(props: Screen3DProps & { cabinetAngle?: number }) {
  const { envColor, gridColor, isCurved, is360 = false, diameter = 1.0, cabinetAngle = 0, isDarkMode, setIsDarkMode } = props;
  const controlsRef = React.useRef<any>(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const [controlsEnabled, setControlsEnabled] = React.useState(true);

  const lastModeRef = React.useRef<string>("");
  const propsRef = React.useRef({ diameter, width: props.width, height: props.height, cabinetAngle });
  
  React.useEffect(() => {
    propsRef.current = { diameter, width: props.width, height: props.height, cabinetAngle };
  });

  React.useEffect(() => {
    const currentMode = `${is360 ? "360" : isCurved ? "curved" : "flat"}`;
    const modeChanged = lastModeRef.current !== currentMode;
    
    if (modeChanged) {
      lastModeRef.current = currentMode;
    }

    const updateCamera = () => {
      if (controlsRef.current && (modeChanged || lastModeRef.current === currentMode)) {
        const currentProps = propsRef.current;
        let actualDiameter = currentProps.diameter;
        if (is360 && currentProps.cabinetAngle !== 0) {
          const absAngle = Math.abs(currentProps.cabinetAngle);
          const theta = (absAngle * Math.PI) / 180;
          const R = 0.5 / (2 * Math.sin(theta / 2));
          actualDiameter = R * 2;
        }
        
        const maxDim = is360 
          ? Math.max(actualDiameter, currentProps.height) 
          : Math.max(currentProps.width, currentProps.height);
          
        const zoomFactor = is360 ? 2.5 : 1.25; // Standard flat zoom is 1.25, 360 cylindrical gets 2.5 for wide view
        const zoomBase = maxDim * zoomFactor;
        const heightOffset = currentProps.height / 2;

        // Position camera to view the model from a nice angle
        controlsRef.current.object.position.set(-zoomBase * 0.6, zoomBase * 0.4, zoomBase * 1.2);
        controlsRef.current.target.set(0, heightOffset, 0);
        
        controlsRef.current.update();
      }
    };

    // Only run if the mode changed or it is the initial mount
    if (modeChanged) {
      updateCamera();
      const timer = setTimeout(updateCamera, 100);
      return () => clearTimeout(timer);
    }
  }, [is360, isCurved]);
  
  const currentEnv = isDarkMode ? "#020617" : envColor;
  const currentGrid = isDarkMode ? "#1e293b" : gridColor;

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-inner group" style={{ background: currentEnv }}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, logarithmicDepthBuffer: true }} style={{ background: currentEnv, position: 'relative', zIndex: 0 }}>
        <PerspectiveCamera makeDefault position={[22, 12, 32]} fov={35} />
        <OrbitControls 
          ref={controlsRef}
          enabled={controlsEnabled}
          enablePan={true} 
          enableZoom={true} 
          minDistance={1} 
          maxDistance={50} 
          maxPolarAngle={Math.PI / 1.5}
        />
        
        <ambientLight intensity={isDarkMode ? 0.4 : 1.2} />
        <directionalLight position={[10, 20, 10]} intensity={isDarkMode ? 0.8 : 1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-15, 10, 15]} intensity={isDarkMode ? 1.5 : 0.8} color="#c6ff00" />
        
        <Suspense fallback={null}>
          <Screen {...props} isDarkMode={isDarkMode} setControlsEnabled={setControlsEnabled} />
        </Suspense>

        <group position={[0, -0.01, 0]}>
          <gridHelper args={[100, 100, currentGrid, currentGrid]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={isDarkMode ? 0.3 : 0.05} />
          </mesh>
        </group>
        
        <Suspense fallback={null}>
          <Environment preset={isDarkMode ? "night" : "studio"} environmentIntensity={0.8} />
        </Suspense>
        
        <ContactShadows resolution={1024} scale={30} blur={2.5} opacity={isDarkMode ? 0.8 : 0.3} far={2.5} color="#000000" />
      </Canvas>

      <div className="absolute top-3 left-3 sm:top-8 sm:left-8 flex flex-col gap-1 pointer-events-none z-20 [transform:translateZ(0)]">
        <span className={`text-[8px] sm:text-[10px] uppercase tracking-[0.4em] font-black transition-colors duration-300 ${isDarkMode ? "text-[#c6ff00]" : "text-slate-500"}`}>{props.t('wizard.dimensions.simulator3D')}</span>
        <div className={`h-0.5 w-10 sm:w-16 rounded-full transition-colors duration-300 ${isDarkMode ? "bg-[#c6ff00]/40" : "bg-slate-300"}`} />
      </div>

      <div className="absolute top-3 right-3 sm:top-8 sm:right-8 flex flex-col gap-2 sm:gap-3 items-end z-20 [transform:translateZ(0)]">
        {/* Theme button */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto ${
            isDarkMode 
            ? "bg-slate-900/80 backdrop-blur-md border border-white/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]" 
            : "bg-white/80 backdrop-blur-md border border-white/50 text-orange-400 shadow-xl"
          }`}
        >
          {isDarkMode ? <Moon className="w-4 h-4 sm:w-6 sm:h-6 fill-blue-400/20" /> : <Sun className="w-4 h-4 sm:w-6 sm:h-6 fill-orange-400/20" />}
        </button>

        {/* Help toggle button */}
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto ${
            showHelp
              ? (isDarkMode ? "bg-[#c6ff00] text-black shadow-lg" : "bg-black text-[#c6ff00] shadow-lg")
              : (isDarkMode 
                  ? "bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white" 
                  : "bg-white/80 backdrop-blur-md border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xl")
          }`}
        >
          <HelpCircle className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 sm:gap-6 px-4 py-2 sm:px-6 sm:py-3.5 backdrop-blur-md shadow-xl rounded-2xl sm:rounded-full border z-[90] [transform:translateZ(0)] max-w-[95%] shrink-0 select-none ${
              isDarkMode 
              ? "bg-slate-950/90 border-white/10 text-white" 
              : "bg-white/90 border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0 scale-65 sm:scale-75">
                <MouseIcon highlight="left" isDarkMode={isDarkMode} />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 opacity-40">
                  {props.t('wizard.dimensions.mouseLeft')}
                </span>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">
                  {props.t('wizard.dimensions.move')}
                </span>
              </div>
            </div>
            
            <div className={`w-px h-5 sm:h-6 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0 scale-65 sm:scale-75">
                <MouseIcon highlight="right" isDarkMode={isDarkMode} />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 opacity-40">
                  {props.t('wizard.dimensions.mouseRight')}
                </span>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">
                  {props.t('wizard.dimensions.rotate')}
                </span>
              </div>
            </div>
            
            <div className={`w-px h-5 sm:h-6 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0 scale-65 sm:scale-75">
                <MouseIcon highlight="wheel" isDarkMode={isDarkMode} />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 opacity-40">
                  {props.t('wizard.dimensions.mouseWheel')}
                </span>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">
                  {props.t('wizard.dimensions.zoom')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

