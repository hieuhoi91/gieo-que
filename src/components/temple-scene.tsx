"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import {
  Component,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type PointLight,
} from "three";
import { useFrame } from "@react-three/fiber";

export type RoomId =
  | "fortune-sticks"
  | "yin-yang"
  | "iching"
  | "daily-fortune"
  | "love-fortune"
  | "career-fortune";

export type SceneKind = "welcome" | "gate" | "main-hall" | "courtyard" | "room";
export type DrawPhase = "idle" | "shaking" | "falling" | "focused" | "error";

type Room = {
  id: RoomId;
  name: string;
  symbol: string;
};

const wood = "#604833";
const darkWood = "#392f25";
const roof = "#30493c";
const stone = "#a9a28d";
const gold = "#b9945d";
let cachedWebglAvailability: boolean | undefined;

const roomPositions: Array<[number, number, number]> = [
  [-5.5, 0, -4],
  [0, 0, -5],
  [5.5, 0, -4],
  [-5.5, 0, 3],
  [0, 0, 5],
  [5.5, 0, 3],
];
const treePositions: Array<[number, number, number]> = [
  [-10, 0, -5],
  [10, 0, -5],
  [-10, 0, 5],
  [10, 0, 5],
];
const roomAccents = ["#a44732", "#315944", "#514c73", "#b06d31", "#9d5061", "#475e83"];
const roomRoofColors = ["#30493c", "#745039", "#4b4969", "#536744", "#814755", "#425d78"];
const roomsIndex: Record<RoomId, number> = {
  "fortune-sticks": 0,
  "yin-yang": 1,
  iching: 2,
  "daily-fortune": 3,
  "love-fortune": 4,
  "career-fortune": 5,
};
type InteriorTheme = {
  wall: string;
  floor: string;
  column: string;
  gold: string;
  light: string;
};
const interiorThemes: Record<RoomId, InteriorTheme> = {
  "fortune-sticks": { wall: "#5b4b37", floor: "#716552", column: "#754631", gold: "#b9945d", light: "#f4c778" },
  "yin-yang": { wall: "#3d493e", floor: "#596255", column: "#425a4a", gold: "#b9a36e", light: "#d9c58d" },
  iching: { wall: "#3c3a50", floor: "#555164", column: "#504b68", gold: "#c5a96c", light: "#cfb880" },
  "daily-fortune": { wall: "#716249", floor: "#8a7b5c", column: "#8c6941", gold: "#d2b778", light: "#ffe0a2" },
  "love-fortune": { wall: "#63434a", floor: "#806066", column: "#9b5960", gold: "#d7b27c", light: "#ffd1b6" },
  "career-fortune": { wall: "#394959", floor: "#586878", column: "#486075", gold: "#c6aa75", light: "#e5d19c" },
};

function getWebglAvailability(): boolean {
  if (cachedWebglAvailability !== undefined) {
    return cachedWebglAvailability;
  }
  const canvas = document.createElement("canvas");
  cachedWebglAvailability = Boolean(
    canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
  );
  const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return cachedWebglAvailability;
}

function subscribeToWebglAvailability() {
  return () => {};
}

function subscribeToReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ResponsiveCamera({ scene }: { scene: SceneKind }) {
  const { width } = useThree((state) => state.size);
  const isMobile = width < 760;
  const isCourtyard = scene === "courtyard" || scene === "welcome";
  const position = isCourtyard
    ? [0, isMobile ? 15 : 9, isMobile ? 24 : 17] as [number, number, number]
    : scene === "room"
      ? [0, isMobile ? 5.5 : 4.8, isMobile ? 12 : 10.5] as [number, number, number]
      : [0, isMobile ? 6.5 : 5.3, isMobile ? 14 : 12.5] as [number, number, number];

  return (
    <PerspectiveCamera
      makeDefault
      fov={isCourtyard ? (isMobile ? 68 : 48) : (isMobile ? 53 : 42)}
      position={position}
    />
  );
}

export default function TempleScene({
  scene,
  roomId,
  rooms,
  incenseCount,
  incenseSticks,
  incenseAnimating,
  onOfferIncense,
  onIncensePlaced,
  drawPhase,
  drawNumber,
  onDrawFortuneStick,
  onRunRoomActivity,
  coinValues,
  lineValues,
  onEnterRoom,
}: {
  scene: SceneKind;
  roomId?: RoomId;
  rooms: Room[];
  incenseCount: number;
  incenseSticks: Array<"available" | "flying" | "placed">;
  incenseAnimating: boolean;
  onOfferIncense: (index: number) => void;
  onIncensePlaced: (index: number) => void;
  drawPhase: DrawPhase;
  drawNumber?: number;
  coinValues?: number[];
  lineValues?: number[];
  onDrawFortuneStick: () => void;
  onRunRoomActivity: () => void;
  onEnterRoom: (roomId: RoomId) => void;
}) {
  const [contextLost, setContextLost] = useState(false);
  const webglAvailable = useSyncExternalStore(
    subscribeToWebglAvailability,
    getWebglAvailability,
    () => null,
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    () => false,
  );
  const camera = useMemo(() => {
    if (scene === "courtyard" || scene === "welcome") {
      return { position: [0, 11, 19] as [number, number, number], fov: 43 };
    }
    if (scene === "room") {
      return { position: [0, 4.8, 10.5] as [number, number, number], fov: 42 };
    }
    return { position: [0, 5.3, 12.5] as [number, number, number], fov: 42 };
  }, [scene]);

  if (webglAvailable === null) {
    return <div className="scene-loading" role="status">Đang chuẩn bị không gian 3D…</div>;
  }

  if (!webglAvailable) {
    return (
      <div className="scene-fallback" role="status">
        <span aria-hidden="true">安</span>
        <p>Thiết bị chưa hỗ trợ WebGL. Bạn vẫn có thể chọn phòng bằng danh sách trên màn hình.</p>
      </div>
    );
  }

  if (contextLost) {
    return (
      <div className="scene-fallback" role="alert">
        <span aria-hidden="true">安</span>
        <p>Đồ họa 3D bị gián đoạn. Bạn vẫn có thể chọn phòng bằng danh sách trên màn hình.</p>
      </div>
    );
  }

  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={camera}
        dpr={[1, 1.5]}
        frameloop={
          drawPhase === "shaking" || drawPhase === "falling"
            || (scene === "main-hall" && (incenseAnimating || (incenseCount > 0 && !prefersReducedMotion)))
            ? "always"
            : "demand"
        }
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            setContextLost(true);
          }, { once: true });
        }}
        shadows="basic"
      >
        <color attach="background" args={["#d7d0bc"]} />
        <fog attach="fog" args={["#d7d0bc", 18, 42]} />
        <ambientLight intensity={1.6} />
        <directionalLight
          castShadow
          intensity={2.2}
          position={[-7, 12, 8]}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight color="#f4d49b" intensity={30} position={[0, 5, 1]} distance={18} />
        <ResponsiveCamera scene={scene} />

        {scene === "courtyard" || scene === "welcome" ? (
          <Courtyard rooms={rooms} onEnterRoom={onEnterRoom} />
        ) : scene === "room" ? (
          <RoomInterior
            coinValues={coinValues}
            drawPhase={drawPhase}
            drawNumber={drawNumber}
            lineValues={lineValues}
            onDrawFortuneStick={onDrawFortuneStick}
            onRunRoomActivity={onRunRoomActivity}
            roomId={roomId ?? "fortune-sticks"}
          />
        ) : (
          <EntryScene
            incenseSticks={incenseSticks}
            onOfferIncense={onOfferIncense}
            onIncensePlaced={onIncensePlaced}
            prefersReducedMotion={prefersReducedMotion}
            scene={scene}
          />
        )}

        <OrbitControls
          enableDamping={false}
          enablePan={false}
          maxDistance={scene === "courtyard" ? 27 : 18}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={scene === "courtyard" ? 12 : 7}
          target={scene === "room" ? [0, 1, 0] : [0, 1.3, 0]}
        />
      </Canvas>
    </CanvasErrorBoundary>
  );
}

type CanvasErrorBoundaryState = { failed: boolean };

class CanvasErrorBoundary extends Component<{ children: ReactNode }, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unable to initialize the 3D scene.", error);
    console.error("3D scene component stack:", info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="scene-fallback" role="alert">
          <span aria-hidden="true">安</span>
          <p>Không thể khởi tạo đồ họa 3D. Bạn vẫn có thể chọn phòng bằng danh sách trên màn hình.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Courtyard({
  rooms,
  onEnterRoom,
}: {
  rooms: Room[];
  onEnterRoom: (roomId: RoomId) => void;
}) {
  return (
    <group>
      <mesh position={[-12, 1, -22]} scale={[1.8, 0.72, 0.55]}>
        <sphereGeometry args={[6, 20, 12]} />
        <meshStandardMaterial color="#83917d" roughness={1} />
      </mesh>
      <mesh position={[12, 0.5, -24]} scale={[2.1, 0.68, 0.6]}>
        <sphereGeometry args={[6, 20, 12]} />
        <meshStandardMaterial color="#778875" roughness={1} />
      </mesh>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.18}>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#a6a18e" roughness={0.96} />
      </mesh>
      <CourtyardTiles />
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.1, 0]}>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#75806d" roughness={0.84} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]}>
        <ringGeometry args={[2.75, 2.9, 64]} />
        <meshStandardMaterial color={gold} roughness={0.66} />
      </mesh>
      <Temple position={[0, 0, -11]} scale={1.25} />
      {rooms.map((room, index) => (
        <group key={room.id} position={roomPositions[index]} scale={0.58}>
          <Temple accent={roomAccents[index]} roofColor={roomRoofColors[index]} />
          <mesh
            castShadow
            position={[0, 1.15, 2.2]}
            onClick={(event) => {
              event.stopPropagation();
              onEnterRoom(room.id);
            }}
          >
            <boxGeometry args={[4.2, 3.8, 0.55]} />
            <meshBasicMaterial colorWrite={false} depthWrite={false} transparent opacity={0} />
          </mesh>
          <pointLight color="#f6c875" intensity={6} distance={5} position={[-2.2, 1.5, 1]} />
          <pointLight color="#f6c875" intensity={6} distance={5} position={[2.2, 1.5, 1]} />
        </group>
      ))}
      <Pond />
      {treePositions.map((position) => (
        <PineTree key={position.join(",")} position={position} />
      ))}
      <Lantern position={[-4.5, 0, 0.4]} />
      <Lantern position={[4.5, 0, 0.4]} />
    </group>
  );
}

function CourtyardTiles() {
  const tiles = useMemo(() => {
    const result: Array<[number, number, string]> = [];
    for (let x = -6; x <= 6; x += 1) {
      for (let z = -6; z <= 6; z += 1) {
        result.push([x, z, (x + z) % 2 === 0 ? "#b9b19c" : "#b2aa95"]);
      }
    }
    return result;
  }, []);

  return (
    <group>
      {tiles.map(([x, z, color]) => (
        <mesh
          key={`${x}-${z}`}
          receiveShadow
          position={[x * 1.18, -0.08, z * 1.18]}
        >
          <boxGeometry args={[1.14, 0.09, 1.14]} />
          <meshStandardMaterial color={color} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function EntryScene({
  scene,
  incenseSticks,
  onOfferIncense,
  onIncensePlaced,
  prefersReducedMotion,
}: {
  scene: "gate" | "main-hall";
  incenseSticks: Array<"available" | "flying" | "placed">;
  onOfferIncense: (index: number) => void;
  onIncensePlaced: (index: number) => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.17}>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color="#a6a18e" roughness={0.96} />
      </mesh>
      {scene === "gate" ? (
        <Gate />
      ) : (
        <>
          <Temple scale={1.35} />
          <Altar />
          <IncenseBowl position={[0, 1.12, 5.25]} prefersReducedMotion={prefersReducedMotion} sticks={incenseSticks} />
          <IncenseOfferings
            onOffer={onOfferIncense}
            onPlaced={onIncensePlaced}
            prefersReducedMotion={prefersReducedMotion}
            sticks={incenseSticks}
          />
        </>
      )}
      <Lantern position={[-4, 0, 1]} />
      <Lantern position={[4, 0, 1]} />
      <mesh receiveShadow position={[0, 0.01, 7]}>
        <boxGeometry args={[1.2, 0.025, 12]} />
        <meshStandardMaterial color="#d1c9b3" roughness={1} />
      </mesh>
    </group>
  );
}

function Gate() {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[12, 1, 2.3]} />
        <meshStandardMaterial color={stone} roughness={0.88} />
      </mesh>
      {[-4, 0, 4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 3, 0]}>
            <boxGeometry args={[0.55, 5.2, 0.7]} />
            <meshStandardMaterial color={wood} roughness={0.78} />
          </mesh>
          <mesh castShadow position={[0, 5.65, 0]}>
            <boxGeometry args={[0.8, 0.28, 1]} />
            <meshStandardMaterial color={gold} metalness={0.35} roughness={0.48} />
          </mesh>
        </group>
      ))}
      <Roof position={[0, 6, 0]} width={13} depth={4.2} height={1.35} />
      <Roof position={[-4, 4.8, 0]} width={4.6} depth={3.5} height={0.85} />
      <Roof position={[4, 4.8, 0]} width={4.6} depth={3.5} height={0.85} />
      <mesh castShadow position={[0, 2.2, 0]}>
        <boxGeometry args={[3.35, 3.3, 0.35]} />
        <meshStandardMaterial color={darkWood} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.05, 0.2]}>
        <boxGeometry args={[2.45, 1.35, 0.08]} />
        <meshStandardMaterial color="#796347" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 2.1]}>
        <boxGeometry args={[10, 0.72, 1.2]} />
        <meshStandardMaterial color="#92866d" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Temple({
  position = [0, 0, 0],
  scale = 1,
  accent = "#a44732",
  roofColor = roof,
}: {
  position?: [number, number, number];
  scale?: number;
  accent?: string;
  roofColor?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[6.1, 0.35, 5.2]} />
        <meshStandardMaterial color="#857c68" roughness={0.93} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.57, 0]}>
        <boxGeometry args={[5.65, 0.16, 4.75]} />
        <meshStandardMaterial color="#b4a88c" roughness={0.84} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.88, 0]}>
        <boxGeometry args={[4.7, 0.5, 3.8]} />
        <meshStandardMaterial color="#6e5942" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.15, -1.72]}>
        <boxGeometry args={[4.3, 1.45, 0.16]} />
        <meshStandardMaterial color="#725b42" roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 2.13, 1.13, -0.15]}>
          <boxGeometry args={[0.15, 1.35, 3.1]} />
          <meshStandardMaterial color="#846646" roughness={0.88} />
        </mesh>
      ))}
      {[-2, 0, 2].flatMap((x) => [-1.52, 1.45].map((z) => (
        <group key={`${x}-${z}`}>
          <mesh castShadow position={[x, 1.72, z]}>
            <cylinderGeometry args={[0.12, 0.16, 2.25, 12]} />
            <meshStandardMaterial color={accent} roughness={0.74} />
          </mesh>
          <mesh castShadow position={[x, 0.66, z]}>
            <boxGeometry args={[0.43, 0.18, 0.43]} />
            <meshStandardMaterial color="#938269" roughness={0.84} />
          </mesh>
          <mesh castShadow position={[x, 2.83, z]}>
            <boxGeometry args={[0.42, 0.14, 0.42]} />
            <meshStandardMaterial color={gold} roughness={0.55} metalness={0.24} />
          </mesh>
        </group>
      )))}
      <mesh castShadow position={[0, 2.87, 0]}>
        <boxGeometry args={[5.05, 0.34, 4.25]} />
        <meshStandardMaterial color={darkWood} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 1.38, 1.53]}>
        <boxGeometry args={[1.62, 1.36, 0.1]} />
        <meshStandardMaterial color="#302a21" roughness={0.94} />
      </mesh>
      {[-0.82, 0, 0.82].map((x) => (
        <mesh key={x} castShadow position={[x, 1.62, 1.62]}>
          <boxGeometry args={[0.08, 1.18, 0.08]} />
          <meshStandardMaterial color={gold} roughness={0.6} metalness={0.22} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.14, 1.64]}>
        <boxGeometry args={[1.18, 0.58, 0.12]} />
        <meshStandardMaterial color="#332d23" roughness={0.76} />
      </mesh>
      <mesh castShadow position={[0, 3.14, 1.72]}>
        <boxGeometry args={[0.78, 0.045, 0.035]} />
        <meshStandardMaterial color={gold} roughness={0.45} metalness={0.36} />
      </mesh>
      <mesh castShadow position={[0, 2.28, 1.69]}>
        <boxGeometry args={[3.1, 0.16, 0.18]} />
        <meshStandardMaterial color={darkWood} roughness={0.82} />
      </mesh>
      <Roof position={[0, 3.17, 0]} width={7.2} depth={6.35} height={1.3} color={roofColor} />
      <Roof position={[0, 3.72, -0.1]} width={4.5} depth={3.9} height={0.85} color={roofColor} />
      <mesh castShadow position={[0, 4.82, -0.1]}>
        <cylinderGeometry args={[0.08, 0.18, 0.48, 8]} />
        <meshStandardMaterial color={gold} metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 5.09, -0.1]}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <meshStandardMaterial color={gold} metalness={0.52} roughness={0.4} />
      </mesh>
      <Stairway />
    </group>
  );
}

function Roof({
  position,
  width,
  depth = width * 0.8,
  height = 0.65,
  color = roof,
}: {
  position: [number, number, number];
  width: number;
  depth?: number;
  height?: number;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const segments = 24;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
      const z = (zIndex / segments) * 2 - 1;
      for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
        const x = (xIndex / segments) * 2 - 1;
        const hip = Math.max(Math.abs(z), Math.max(0, (Math.abs(x) - 0.42) * 1.73));
        const eaveLift = 0.12 * (Math.abs(x) ** 8 + Math.abs(z) ** 8);
        vertices.push(x * width / 2, height * (1 - hip + eaveLift), z * depth / 2);
      }
    }
    for (let zIndex = 0; zIndex < segments; zIndex += 1) {
      for (let xIndex = 0; xIndex < segments; xIndex += 1) {
        const topLeft = zIndex * (segments + 1) + xIndex;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + segments + 1;
        const bottomRight = bottomLeft + 1;
        indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
      }
    }
    const roofGeometry = new BufferGeometry();
    roofGeometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    roofGeometry.setIndex(indices);
    roofGeometry.computeVertexNormals();
    return roofGeometry;
  }, [depth, height, width]);

  return (
    <group position={position}>
      <mesh castShadow geometry={geometry}>
        <meshStandardMaterial color={color} roughness={0.78} side={DoubleSide} />
      </mesh>
      <mesh castShadow position={[0, height * 0.05, depth / 2]}>
        <boxGeometry args={[width + 0.22, 0.16, 0.2]} />
        <meshStandardMaterial color={darkWood} roughness={0.76} />
      </mesh>
      <mesh castShadow position={[0, height * 0.05, -depth / 2]}>
        <boxGeometry args={[width + 0.22, 0.16, 0.2]} />
        <meshStandardMaterial color={darkWood} roughness={0.76} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * width / 2, height * 0.05, 0]}>
          <boxGeometry args={[0.2, 0.16, depth]} />
          <meshStandardMaterial color={darkWood} roughness={0.76} />
        </mesh>
      ))}
      <mesh castShadow position={[0, height * 0.94, 0]}>
        <boxGeometry args={[width * 0.72, 0.1, 0.14]} />
        <meshStandardMaterial color="#75846b" roughness={0.62} />
      </mesh>
    </group>
  );
}

function Stairway() {
  return (
    <group position={[0, 0, 2.82]}>
      {[0, 1, 2].map((step) => (
        <mesh key={step} castShadow receiveShadow position={[0, 0.13 + step * 0.14, step * 0.48]}>
          <boxGeometry args={[3.45 - step * 0.18, 0.26, 0.58]} />
          <meshStandardMaterial color={step === 2 ? "#a99c80" : "#8a806b"} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.6, 8]} />
        <meshStandardMaterial color={darkWood} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[0.58, 0.68, 0.58]} />
        <meshStandardMaterial
          color="#d18d43"
          emissive="#a95c1d"
          emissiveIntensity={0.38}
          roughness={0.58}
        />
      </mesh>
      <mesh castShadow position={[0, 2.2, 0]}>
        <coneGeometry args={[0.48, 0.2, 4]} />
        <meshStandardMaterial color={darkWood} roughness={0.75} />
      </mesh>
      <pointLight color="#ffd18a" intensity={2.5} distance={5} position={[0, 1.8, 0]} />
    </group>
  );
}

function PineTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} scale={0.58}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 1.6, 7]} />
        <meshStandardMaterial color="#584735" roughness={0.92} />
      </mesh>
      {[1.4, 2.2, 3].map((height, index) => (
        <mesh key={height} castShadow position={[0, height, 0]}>
          <coneGeometry args={[1.15 - index * 0.23, 1.6, 7]} />
          <meshStandardMaterial color={index === 0 ? "#405a47" : "#516c55"} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function Pond() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh receiveShadow rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.45, 48]} />
        <meshStandardMaterial color="#647c78" metalness={0.18} roughness={0.32} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          rotation-x={-Math.PI / 2}
          position={[0, 0.04 + index * 0.015, 0]}
        >
          <ringGeometry args={[0.7 + index * 0.42, 0.73 + index * 0.42, 48]} />
          <meshStandardMaterial color="#c0ad7d" roughness={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function Altar() {
  return (
    <group position={[0, 0, 5.25]}>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[2.8, 0.18, 1.05]} />
        <meshStandardMaterial color={wood} roughness={0.76} />
      </mesh>
      {[-1.08, 1.08].map((x) => (
        <mesh key={x} castShadow position={[x, 0.55, 0]}>
          <boxGeometry args={[0.18, 0.9, 0.75]} />
          <meshStandardMaterial color={darkWood} roughness={0.82} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.38, -0.12]}>
        <boxGeometry args={[1.1, 0.45, 0.08]} />
        <meshStandardMaterial color={gold} metalness={0.25} roughness={0.62} />
      </mesh>
      <pointLight color="#f5c783" intensity={6} distance={5} position={[0, 1.8, 0.3]} />
    </group>
  );
}

function IncenseOfferings({
  sticks,
  prefersReducedMotion,
  onOffer,
  onPlaced,
}: {
  sticks: Array<"available" | "flying" | "placed">;
  prefersReducedMotion: boolean;
  onOffer: (index: number) => void;
  onPlaced: (index: number) => void;
}) {
  const incenseRefs = useRef<Array<Group | null>>([]);
  const startedAt = useRef<Array<number | null>>([null, null, null]);
  const completed = useRef([false, false, false]);
  const startX = [-0.72, 0, 0.72];
  const landingX = [-0.11, 0, 0.11];

  useFrame(({ clock }) => {
    sticks.forEach((state, index) => {
      const incense = incenseRefs.current[index];
      if (!incense) return;
      if (state !== "flying") {
        if (state === "available") {
          incense.position.set(startX[index], 1.62, 3.05);
          incense.rotation.set(0, 0, 0);
          incense.visible = true;
        } else {
          incense.visible = false;
        }
        return;
      }

      if (startedAt.current[index] === null) {
        startedAt.current[index] = clock.elapsedTime;
        completed.current[index] = false;
      }
      const duration = prefersReducedMotion ? 0.25 : 0.95;
      const progress = Math.min((clock.elapsedTime - startedAt.current[index]!) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      incense.position.set(
        startX[index] + (landingX[index] - startX[index]) * eased,
        1.62 + (1.76 - 1.62) * eased + Math.sin(progress * Math.PI) * 0.5,
        5.65 + (5.25 - 5.65) * eased,
      );
      incense.rotation.set(
        Math.sin(progress * Math.PI) * 0.35 * (index % 2 === 0 ? 1 : -1),
        0,
        Math.sin(progress * Math.PI) * 0.2,
      );
      if (progress === 1 && !completed.current[index]) {
        completed.current[index] = true;
        onPlaced(index);
      }
    });
  });

  return (
    <group>
      {sticks.map((state, index) => (
        <group
          key={index}
          ref={(group) => { incenseRefs.current[index] = group; }}
          position={[startX[index], 1.62, 5.65]}
          visible={state !== "placed"}
          onClick={(event) => {
            event.stopPropagation();
            if (state === "available") onOffer(index);
          }}
          onPointerOver={() => {
            if (state === "available") document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => { document.body.style.cursor = ""; }}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.92, 8]} />
            <meshStandardMaterial
              color="#d5bc87"
              emissive={state === "flying" ? "#b35b25" : "#000000"}
              emissiveIntensity={state === "flying" ? 0.65 : 0}
            />
          </mesh>
          <mesh position={[0, 0.47, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial color="#ffad4d" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 1.2, 8]} />
            <meshBasicMaterial color="#ffffff" colorWrite={false} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function IncenseBowl({
  position,
  sticks,
  prefersReducedMotion,
}: {
  position: [number, number, number];
  sticks: Array<"available" | "flying" | "placed">;
  prefersReducedMotion: boolean;
}) {
  const litCount = sticks.filter((stick) => stick === "placed").length;
  const smokePuffs = useRef<Array<Mesh | null>>([]);
  const smokeMaterials = useRef<Array<MeshStandardMaterial | null>>([]);
  const ember = useRef<Mesh>(null);
  const glow = useRef<PointLight>(null);
  const startedAt = useRef<number | null>(null);
  const smokeSeeds = useMemo(
    () => Array.from({ length: 15 }, (_, index) => ({
      phase: index / 15,
      drift: (index % 3) - 1,
      size: 0.72 + (index % 4) * 0.12,
    })),
    [],
  );

  useFrame(({ clock }) => {
    if (litCount === 0) {
      startedAt.current = null;
      return;
    }
    if (startedAt.current === null) startedAt.current = clock.elapsedTime;
    const elapsedSinceIgnition = clock.elapsedTime - startedAt.current;

    if (ember.current && glow.current && !prefersReducedMotion) {
      const flicker = 0.9 + Math.sin(clock.elapsedTime * 18) * 0.08 + Math.sin(clock.elapsedTime * 31) * 0.04;
      ember.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 16) * 0.1);
      glow.current.intensity = (0.8 + litCount * 0.45) * flicker;
    }

    if (prefersReducedMotion) return;
    smokeSeeds.forEach((seed, index) => {
      const puff = smokePuffs.current[index];
      const material = smokeMaterials.current[index];
      if (!puff || !material) return;
      const progress = (elapsedSinceIgnition * 0.22 + seed.phase) % 1;
      const fadeIn = Math.min(progress * 5, 1);
      const fadeOut = Math.min((1 - progress) * 2.8, 1);
      const activePuff = index < litCount * 5;
      const opacity = activePuff ? Math.max(0, fadeIn * fadeOut) * Math.min(litCount * 0.11, 0.27) : 0;
      const sway = Math.sin(clock.elapsedTime * 1.8 + index * 1.7);
      puff.position.set(seed.drift * progress * 0.2 + sway * 0.11, 1.05 + progress * 1.1, Math.cos(clock.elapsedTime + index) * 0.045);
      puff.scale.set(
        (0.055 + progress * 0.16) * seed.size,
        (0.12 + progress * 0.3) * seed.size,
        (0.05 + progress * 0.14) * seed.size,
      );
      material.opacity = Math.min(opacity * 0.95, 0.18);
    });
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.29, 0.18, 16]} />
        <meshStandardMaterial color="#654a30" metalness={0.62} roughness={0.42} />
      </mesh>
      <mesh castShadow position-y={0.3}>
        <cylinderGeometry args={[0.4, 0.28, 0.42, 16, 1, false]} />
        <meshStandardMaterial color="#93683b" metalness={0.62} roughness={0.4} />
      </mesh>
      <mesh position-y={0.52}>
        <torusGeometry args={[0.39, 0.055, 8, 24]} />
        <meshStandardMaterial color="#c19a5e" metalness={0.68} roughness={0.34} />
      </mesh>
      <mesh position-y={0.37}>
        <cylinderGeometry args={[0.32, 0.32, 0.035, 16]} />
        <meshStandardMaterial color="#35291d" roughness={0.96} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.42, 0.32, 0]} castShadow>
          <sphereGeometry args={[0.095, 10, 8]} />
          <meshStandardMaterial color="#b1884e" metalness={0.64} roughness={0.4} />
        </mesh>
      ))}
      <mesh position-y={-0.1}>
        <cylinderGeometry args={[0.1, 0.14, 0.12, 12]} />
        <meshStandardMaterial color="#b1884e" metalness={0.64} roughness={0.4} />
      </mesh>
      {sticks.map((state, index) => state === "placed" && (
        <group key={index} position={[(index - 1) * 0.075, 0, 0]}>
          <mesh position={[0, 0.64, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.1, 6]} />
            <meshStandardMaterial color="#d4bd91" />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#ffad4d" />
          </mesh>
        </group>
      ))}
      {litCount > 0 && (
        <mesh ref={ember} position={[0, 1.22, 0]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshBasicMaterial color="#ffd37a" />
        </mesh>
      )}
      {litCount > 0 && (
        <>
          <pointLight ref={glow} color="#ff9d50" intensity={1.1} distance={3} position={[0, 1.3, 0]} />
          {smokeSeeds.map((seed, index) => (
            <mesh
              key={index}
              ref={(mesh) => { smokePuffs.current[index] = mesh; }}
              position={[0, prefersReducedMotion ? 1.45 + seed.phase * 0.35 : 1.05, 0]}
              scale={prefersReducedMotion ? (index < litCount * 5 ? 0.13 + seed.size * 0.08 : 0.001) : 0.001}
            >
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial
                ref={(material) => { smokeMaterials.current[index] = material; }}
                color="#d8d5cc"
                transparent
                opacity={prefersReducedMotion && index < litCount * 5 ? 0.09 : 0}
                depthWrite={false}
                roughness={1}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function RoomInterior({
  roomId,
  drawNumber,
  drawPhase,
  coinValues,
  lineValues,
  onDrawFortuneStick,
  onRunRoomActivity,
}: {
  roomId: RoomId;
  drawNumber?: number;
  drawPhase: DrawPhase;
  coinValues?: number[];
  lineValues?: number[];
  onDrawFortuneStick: () => void;
  onRunRoomActivity: () => void;
}) {
  const theme = interiorThemes[roomId];
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.1}>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color={theme.floor} roughness={0.95} />
      </mesh>
      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} receiveShadow position={[-5 + index, -0.02, 0]}>
          <boxGeometry args={[0.035, 0.012, 8.5]} />
          <meshStandardMaterial color="#97866a" roughness={0.9} />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 3.2, -4.15]}>
        <boxGeometry args={[12, 6.4, 0.45]} />
        <meshStandardMaterial color={theme.wall} roughness={0.93} />
      </mesh>
      {[-5.7, 5.7].map((x) => (
        <mesh key={x} receiveShadow position={[x, 3, 0]}>
          <boxGeometry args={[0.42, 6, 8.5]} />
          <meshStandardMaterial color={theme.wall} roughness={0.91} />
        </mesh>
      ))}
      {[-4.9, 4.9].map((x) => (
        <group key={x}>
          <mesh castShadow position={[x, 2.82, 1.28]}>
            <cylinderGeometry args={[0.13, 0.17, 5.6, 12]} />
            <meshStandardMaterial color={theme.column} roughness={0.74} />
          </mesh>
          <mesh castShadow position={[x, 5.63, 1.28]}>
            <boxGeometry args={[0.52, 0.18, 0.52]} />
            <meshStandardMaterial color={gold} roughness={0.58} metalness={0.2} />
          </mesh>
        </group>
      ))}
      {[-1, 1].flatMap((side) => [-3, -1, 1, 3].map((z) => (
        <mesh key={`${side}-${z}`} castShadow position={[side * 5.28, 2.8, z]}>
          <cylinderGeometry args={[0.11, 0.14, 5.55, 10]} />
          <meshStandardMaterial color={theme.column} roughness={0.76} />
        </mesh>
      )))}
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={index} castShadow position={[0, 5.55, -3.2 + index * 1.05]}>
          <boxGeometry args={[11.3, 0.14, 0.18]} />
          <meshStandardMaterial color={theme.column} roughness={0.82} />
        </mesh>
      ))}
      <Roof position={[0, 5.75, -0.8]} width={13} depth={11} height={1.6} color={roomRoofColors[roomsIndex[roomId]]} />
      <mesh castShadow position={[0, 2.1, -3.89]}>
        <boxGeometry args={[8.4, 3.7, 0.1]} />
        <meshStandardMaterial color={theme.column} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 3.28, -3.81]}>
        <boxGeometry args={[2.8, 1.35, 0.08]} />
        <meshStandardMaterial color="#362c22" roughness={0.86} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.3, -1.5]}>
        <boxGeometry args={[7.8, 0.48, 4.3]} />
        <meshStandardMaterial color={theme.column} roughness={0.82} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.6, -1.5]}>
        <boxGeometry args={[7.2, 0.17, 3.9]} />
        <meshStandardMaterial color={theme.gold} roughness={0.76} />
      </mesh>
      <RoomDecor roomId={roomId} theme={theme} />
      <RoomObject
        coinValues={coinValues}
        drawPhase={drawPhase}
        drawNumber={drawNumber}
        lineValues={lineValues}
        onDrawFortuneStick={onDrawFortuneStick}
        onRunActivity={onRunRoomActivity}
        roomId={roomId}
      />
      <RoomLantern position={[-4.2, 0, -2.7]} color={theme.light} />
      <RoomLantern position={[4.2, 0, -2.7]} color={theme.light} />
    </group>
  );
}

function RoomDecor({ roomId, theme }: { roomId: RoomId; theme: InteriorTheme }) {
  if (roomId === "fortune-sticks") {
    return (
      <group>
        <mesh castShadow position={[-3.7, 2.45, -2.95]}>
          <boxGeometry args={[1.15, 2.25, 0.3]} />
          <meshStandardMaterial color="#493a2d" roughness={0.78} />
        </mesh>
        {[0, 1, 2, 3, 4].map((row) => (
          <mesh key={row} castShadow position={[-3.7, 1.65 + row * 0.35, -2.77]}>
            <boxGeometry args={[0.78, 0.035, 0.045]} />
            <meshStandardMaterial color={row % 2 ? "#d7c292" : theme.gold} roughness={0.76} />
          </mesh>
        ))}
        <mesh castShadow position={[3.7, 2.45, -2.95]}>
          <boxGeometry args={[1.15, 2.25, 0.3]} />
          <meshStandardMaterial color="#493a2d" roughness={0.78} />
        </mesh>
        {[0, 1, 2, 3, 4].map((row) => (
          <mesh key={row} castShadow position={[3.7, 1.65 + row * 0.35, -2.77]}>
            <boxGeometry args={[0.78, 0.035, 0.045]} />
            <meshStandardMaterial color={row % 2 ? "#d7c292" : theme.gold} roughness={0.76} />
          </mesh>
        ))}
      </group>
    );
  }

  if (roomId === "yin-yang") {
    return (
      <group>
        <YinYangEmblem theme={theme} />
        <DecorScreen position={[-4.55, 0, -0.75]} color="#405246" />
        <DecorScreen position={[4.55, 0, -0.75]} color="#405246" />
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 3.35, 0, -2.5]}>
            <mesh castShadow position={[0, 0.58, 0]}>
              <cylinderGeometry args={[0.36, 0.42, 0.22, 16]} />
              <meshStandardMaterial color="#617565" roughness={0.62} />
            </mesh>
            <mesh castShadow position={[0, 0.91, 0]}>
              <sphereGeometry args={[0.25, 16, 12]} />
              <meshStandardMaterial color="#8c9a7d" roughness={0.78} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (roomId === "iching") {
    return (
      <group>
        <mesh castShadow position={[0, 3.3, -3.72]}>
          <boxGeometry args={[4.4, 3.4, 0.12]} />
          <meshStandardMaterial color="#2e2c3c" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 3.3, -3.63]}>
          <boxGeometry args={[3.85, 2.85, 0.07]} />
          <meshStandardMaterial color="#ddd0ae" roughness={0.92} />
        </mesh>
        {[-1.15, -0.75, -0.35, 0.05, 0.45, 0.85].map((y, index) => (
          <group key={y} position={[0, 3.3 + y, -3.57]}>
            <mesh position={[-0.22, 0, 0]}>
              <boxGeometry args={[1.24, 0.1, 0.035]} />
              <meshStandardMaterial color={index % 2 ? "#514b3d" : theme.column} />
            </mesh>
            {index % 2 === 0 && (
              <mesh position={[0.82, 0, 0]}>
                <boxGeometry args={[1.24, 0.1, 0.035]} />
                <meshStandardMaterial color={theme.column} />
              </mesh>
            )}
          </group>
        ))}
        <Bookcase position={[-4.2, 0, -2.5]} color="#3e3a50" />
        <Bookcase position={[4.2, 0, -2.5]} color="#3e3a50" />
        <ScrollRoll position={[-3.3, 1.42, 0.3]} color={theme.gold} />
        <ScrollRoll position={[3.3, 1.42, 0.3]} color={theme.gold} />
      </group>
    );
  }

  if (roomId === "daily-fortune") {
    return (
      <group>
        <mesh position={[0, 3.6, -3.62]}>
          <circleGeometry args={[1.55, 48]} />
          <meshStandardMaterial color="#d9c292" emissive="#a37b3c" emissiveIntensity={0.22} />
        </mesh>
        <mesh position={[0, 3.6, -3.56]}>
          <ringGeometry args={[1.62, 1.75, 48]} />
          <meshStandardMaterial color={theme.gold} metalness={0.3} roughness={0.55} />
        </mesh>
        {Array.from({ length: 16 }, (_, index) => {
          const angle = (index / 16) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * 2.05, 3.6 + Math.sin(angle) * 2.05, -3.58]}
              rotation-z={angle}
            >
              <boxGeometry args={[0.46, 0.045, 0.04]} />
              <meshStandardMaterial color={theme.gold} roughness={0.54} />
            </mesh>
          );
        })}
        <mesh castShadow position={[-3.7, 2.65, -2.85]}>
          <boxGeometry args={[1.1, 3.2, 0.22]} />
          <meshStandardMaterial color="#c9b17a" roughness={0.82} />
        </mesh>
        <mesh castShadow position={[3.7, 2.65, -2.85]}>
          <boxGeometry args={[1.1, 3.2, 0.22]} />
          <meshStandardMaterial color="#c9b17a" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.98, 1.35]}>
          <boxGeometry args={[3.2, 0.08, 0.035]} />
          <meshStandardMaterial color={theme.gold} roughness={0.64} />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh key={index} castShadow position={[-0.8 + index * 0.4, 1.13, 1.35]}>
            <cylinderGeometry args={[0.035, 0.035, 0.26, 8]} />
            <meshStandardMaterial color="#73543a" roughness={0.72} />
          </mesh>
        ))}
      </group>
    );
  }

  if (roomId === "love-fortune") {
    return (
      <group>
        <DecorScreen position={[-4.55, 0, -0.7]} color="#754954" />
        <DecorScreen position={[4.55, 0, -0.7]} color="#754954" />
        <mesh position={[0, 3.5, -3.61]}>
          <circleGeometry args={[1.34, 48]} />
          <meshStandardMaterial color="#e1c49b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 3.5, -3.53]}>
          <torusGeometry args={[1.28, 0.09, 12, 48]} />
          <meshStandardMaterial color="#a95c61" roughness={0.58} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 2.6, 0, -2.45]}>
            <mesh castShadow position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.37, 0.48, 0.86, 18]} />
              <meshStandardMaterial color={side < 0 ? "#a95c61" : "#b48355"} roughness={0.52} />
            </mesh>
            <mesh castShadow position={[0, 1.18, 0]}>
              <sphereGeometry args={[0.16, 12, 10]} />
              <meshStandardMaterial color="#63724d" roughness={0.7} />
            </mesh>
            {[-1, 0, 1].map((leaf) => (
              <mesh key={leaf} castShadow position={[leaf * 0.18, 1.42 + Math.abs(leaf) * 0.08, 0]}>
                <sphereGeometry args={[0.18, 12, 8]} />
                <meshStandardMaterial color={leaf === 0 ? "#d4a19a" : "#b98775"} roughness={0.65} />
              </mesh>
            ))}
          </group>
        ))}
        <PairedRings />
      </group>
    );
  }

  return (
    <group>
      <Bookcase position={[-4.25, 0, -2.65]} color="#3b4d60" />
      <Bookcase position={[4.25, 0, -2.65]} color="#3b4d60" />
      <mesh castShadow position={[0, 3.35, -3.68]}>
        <boxGeometry args={[4.6, 2.8, 0.12]} />
        <meshStandardMaterial color="#d5c59f" roughness={0.86} />
      </mesh>
      <ScrollRoll position={[-1.4, 2.7, -3.55]} color="#8e6e44" />
      <ScrollRoll position={[1.4, 2.7, -3.55]} color="#8e6e44" />
      <Abacus position={[0, 0.78, 0.95]} />
      <BrushHolder position={[-2.65, 0.76, 0.78]} color={theme.column} />
      <mesh castShadow position={[2.45, 0.88, 0.85]} rotation-z={-0.12}>
        <boxGeometry args={[1.05, 0.08, 0.8]} />
        <meshStandardMaterial color="#e1d3b1" roughness={0.93} />
      </mesh>
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} castShadow position={[2.45 + x, 0.96, 0.82]} rotation-z={-0.12}>
          <boxGeometry args={[0.025, 0.01, 0.55]} />
          <meshStandardMaterial color="#8f7048" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function YinYangEmblem({ theme }: { theme: InteriorTheme }) {
  return (
    <group position={[0, 3.45, -3.57]}>
      <mesh>
        <circleGeometry args={[1.58, 48]} />
        <meshStandardMaterial color="#d7c99f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <torusGeometry args={[1.63, 0.09, 10, 48]} />
        <meshStandardMaterial color={theme.gold} roughness={0.52} metalness={0.25} />
      </mesh>
      <mesh position={[-0.36, 0, 0.06]}>
        <circleGeometry args={[0.73, 32, 0, Math.PI]} />
        <meshStandardMaterial color="#28352e" side={DoubleSide} />
      </mesh>
      <mesh position={[0.36, 0, 0.06]} rotation-z={Math.PI}>
        <circleGeometry args={[0.73, 32, 0, Math.PI]} />
        <meshStandardMaterial color="#28352e" side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.36, 0.07]}>
        <circleGeometry args={[0.36, 28]} />
        <meshStandardMaterial color="#28352e" />
      </mesh>
      <mesh position={[0, -0.36, 0.08]}>
        <circleGeometry args={[0.36, 28]} />
        <meshStandardMaterial color="#d7c99f" />
      </mesh>
      <mesh position={[0, 0.36, 0.09]}>
        <circleGeometry args={[0.09, 20]} />
        <meshBasicMaterial color="#d7c99f" />
      </mesh>
      <mesh position={[0, -0.36, 0.1]}>
        <circleGeometry args={[0.09, 20]} />
        <meshBasicMaterial color="#28352e" />
      </mesh>
    </group>
  );
}

function DecorScreen({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[0.12, 3.6, 1.7]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh key={index} position={[0.075, 0.4 + index * 0.55, 0]}>
          <boxGeometry args={[0.035, 0.035, 1.4]} />
          <meshStandardMaterial color="#cfb681" roughness={0.58} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[0.24, 0.2, 1.95]} />
        <meshStandardMaterial color="#544336" roughness={0.78} />
      </mesh>
    </group>
  );
}

function Bookcase({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.75, 0]}>
        <boxGeometry args={[1.42, 3.5, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((row) => (
        <group key={row}>
          <mesh castShadow position={[0, 0.55 + row * 0.78, 0.24]}>
            <boxGeometry args={[1.5, 0.09, 0.54]} />
            <meshStandardMaterial color="#342d28" roughness={0.76} />
          </mesh>
          {[-0.48, -0.16, 0.16, 0.48].map((x, bookIndex) => (
            <mesh
              key={x}
              castShadow
              position={[x, 0.88 + row * 0.78, 0.24]}
              rotation-z={(bookIndex % 2 ? 1 : -1) * 0.06}
            >
              <boxGeometry args={[0.22, 0.58 + (bookIndex % 2) * 0.12, 0.25]} />
              <meshStandardMaterial color={["#a6754e", "#c5ad7c", "#745247", "#7d8060"][bookIndex]} roughness={0.82} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function ScrollRoll({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.36, 0.95, 0.1]} />
        <meshStandardMaterial color="#e0d1ab" roughness={0.9} />
      </mesh>
      {[-0.49, 0.49].map((y) => (
        <mesh key={y} castShadow position={[0, y, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.48, 12]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[0.035, 0.68, 0.015]} />
        <meshStandardMaterial color="#8e4637" roughness={0.72} />
      </mesh>
    </group>
  );
}

function PairedRings() {
  return (
    <group position={[0, 1.5, -1.5]}>
      {[-0.32, 0.32].map((x, index) => (
        <mesh key={x} castShadow position={[x, 0.58, 0]} rotation-x={Math.PI / 2} rotation-y={index ? 0.35 : -0.35}>
          <torusGeometry args={[0.55, 0.1, 14, 36]} />
          <meshStandardMaterial color={index ? "#b77a51" : "#d1b879"} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Abacus({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.08, 0.72]} />
        <meshStandardMaterial color="#704b34" roughness={0.72} />
      </mesh>
      {[-0.65, -0.32, 0, 0.32, 0.65].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.37, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.66, 6]} />
            <meshStandardMaterial color="#c3a66e" roughness={0.56} />
          </mesh>
          {[-0.19, 0.02, 0.23].map((y, index) => (
            <mesh key={y} position={[x, y + 0.08, 0]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color={index === 0 ? "#a64f38" : "#bca36e"} roughness={0.48} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function BrushHolder({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.4, 16]} />
        <meshStandardMaterial color={color} roughness={0.52} />
      </mesh>
      {[-0.11, 0, 0.11].map((x) => (
        <mesh key={x} castShadow position={[x, 0.75 + Math.abs(x) * 0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.035, 1, 7]} />
          <meshStandardMaterial color="#352c23" roughness={0.64} />
        </mesh>
      ))}
    </group>
  );
}

function RoomLantern({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 1.6, 8]} />
        <meshStandardMaterial color={darkWood} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[0.55, 0.72, 0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.58} />
      </mesh>
      <mesh castShadow position={[0, 2.25, 0]}>
        <coneGeometry args={[0.46, 0.22, 4]} />
        <meshStandardMaterial color={darkWood} roughness={0.75} />
      </mesh>
      <pointLight color={color} intensity={3} distance={5} position={[0, 1.8, 0]} />
    </group>
  );
}

function FortuneUrn({ phase, onDraw }: { phase: DrawPhase; onDraw: () => void }) {
  const urn = useRef<Group>(null);
  const sticks = useRef<Group>(null);
  const stickRefs = useRef<Array<Group | null>>([]);
  const activePhase = useRef(phase);
  const canDraw = phase === "idle" || phase === "error";
  const stickLayout = Array.from({ length: 17 }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 0.19 * Math.sqrt((index + 0.5) / 17);
    const spread = 0.13 + ((index * 7) % 9) * 0.018;
    const length = 1.28 + ((index * 5) % 7) * 0.035;
    return {
      position: [Math.cos(angle) * radius, 0.52, Math.sin(angle) * radius] as [number, number, number],
      rotation: [-Math.sin(angle) * spread, 0, Math.cos(angle) * spread] as [number, number, number],
      length,
      phase: index * 1.73,
    };
  });

  useFrame(({ clock }) => {
    if (!urn.current) return;
    if (phase !== activePhase.current) {
      activePhase.current = phase;
      urn.current.rotation.set(0, 0, 0);
      urn.current.position.set(0, 0, 0);
    }
    if (phase === "shaking") {
      const time = clock.elapsedTime;
      const swing = Math.sin(time * 26);
      urn.current.rotation.z = swing * 0.14;
      urn.current.rotation.x = Math.cos(time * 21) * 0.1;
      urn.current.position.x = Math.sin(time * 26) * 0.055;
      urn.current.position.y = Math.abs(swing) * 0.035;
    }
    stickRefs.current.forEach((stick, index) => {
      if (!stick) return;
      const layout = stickLayout[index];
      const time = clock.elapsedTime;
      if (phase === "shaking") {
        const wobble = Math.sin(time * (24 + (index % 5) * 2.8) + layout.phase);
        const rattle = Math.cos(time * (29 + (index % 4) * 3.1) + layout.phase * 1.7);
        stick.position.set(
          layout.position[0] + wobble * 0.018,
          layout.position[1] + Math.abs(rattle) * (0.012 + (index % 3) * 0.006),
          layout.position[2] + rattle * 0.018,
        );
        stick.rotation.set(
          layout.rotation[0] + rattle * 0.055,
          Math.sin(time * 17 + layout.phase) * 0.035,
          layout.rotation[2] + wobble * 0.065,
        );
      } else {
        stick.position.set(...layout.position);
        stick.rotation.set(...layout.rotation);
      }
    });
  });

  const startDraw = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (canDraw) onDraw();
  };

  return (
    <group
      ref={urn}
      onClick={startDraw}
      onPointerOver={() => {
        if (canDraw) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.56, 0.58, 0.16, 32]} />
        <meshStandardMaterial color="#493526" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.52, 0.49, 0.16, 32]} />
        <meshStandardMaterial color="#b9945d" metalness={0.46} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.54, 0.44, 0.98, 32, 1, true]} />
        <meshStandardMaterial color="#8c3f28" roughness={0.48} metalness={0.08} side={DoubleSide} />
      </mesh>
      {[0.34, 1.15, 1.31, 1.4].map((y) => (
        <mesh key={y} castShadow position={[0, y, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[y === 1.4 ? 0.58 : y === 1.31 ? 0.55 : 0.5, y > 1.3 ? 0.035 : 0.025, 8, 32]} />
          <meshStandardMaterial color={gold} roughness={0.36} metalness={0.58} />
        </mesh>
      ))}
      <mesh position={[0, 1.27, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.025, 32]} />
        <meshStandardMaterial color="#241d18" roughness={0.94} />
      </mesh>
      <group ref={sticks}>
        {stickLayout.map((layout, index) => (
          <group
            key={index}
            ref={(group) => { stickRefs.current[index] = group; }}
            position={layout.position}
            rotation={layout.rotation}
          >
            <mesh castShadow position={[0, layout.length / 2, 0]}>
              <cylinderGeometry args={[0.021, 0.024, layout.length, 7]} />
              <meshStandardMaterial
                color={index % 3 === 0 ? "#f0dfb6" : "#d0ad6d"}
                roughness={0.65}
              />
            </mesh>
            <mesh position={[0, layout.length - 0.085, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.12, 7]} />
              <meshStandardMaterial color="#a44732" roughness={0.72} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh castShadow position={[0, 0.75, 0.49]}>
        <boxGeometry args={[0.68, 0.5, 0.055]} />
        <meshStandardMaterial color="#b9945d" metalness={0.46} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.75, 0.523]}>
        <boxGeometry args={[0.55, 0.37, 0.015]} />
        <meshStandardMaterial color="#733722" roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.75, 0.535]}>
        <circleGeometry args={[0.115, 24]} />
        <meshStandardMaterial color="#d6b875" metalness={0.42} roughness={0.44} />
      </mesh>
      <mesh position={[0, 0.75, 0.547]}>
        <circleGeometry args={[0.075, 24]} />
        <meshStandardMaterial color="#8c3f28" roughness={0.55} />
      </mesh>
      {[-0.37, 0.37].map((x) => (
        <mesh key={x} position={[x, 0.72, 0.42]}>
          <boxGeometry args={[0.035, 0.62, 0.025]} />
          <meshStandardMaterial color="#c9a660" metalness={0.4} roughness={0.42} />
        </mesh>
      ))}
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} castShadow position={[x, 0.55, 0.49]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial color="#d7b56e" metalness={0.62} roughness={0.36} />
        </mesh>
      ))}
      <mesh
        onClick={startDraw}
        position={[0, 0.85, 0]}
      >
        <cylinderGeometry args={[0.8, 0.8, 1.9, 20]} />
        <meshBasicMaterial color="#ffffff" colorWrite={false} depthWrite={false} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function FallingFortuneStick({ number, phase }: { number?: number; phase: DrawPhase }) {
  const stick = useRef<Group>(null);
  const startedAt = useRef(0);
  const lastPhase = useRef(phase);

  useFrame(({ clock }) => {
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      startedAt.current = clock.elapsedTime;
    }
    if (phase !== "falling" || !stick.current) return;
    const progress = Math.min((clock.elapsedTime - startedAt.current) / 0.95, 1);
    const eased = 1 - (1 - progress) ** 3;
    stick.current.position.set(eased * 0.9, 2.05 * (1 - progress) + 0.62 * Math.sin(Math.PI * progress), 0.05 + eased * 1.05);
    stick.current.rotation.set(-progress * Math.PI * 0.48, progress * 0.28, progress * Math.PI * 0.68);
  });

  if (phase !== "falling" || number === undefined) return null;

  return (
    <group ref={stick} position={[0, 2.45, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.18, 1.55, 0.07]} />
        <meshStandardMaterial color="#ead7a8" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.61, 0.042]}>
        <boxGeometry args={[0.12, 0.035, 0.018]} />
        <meshStandardMaterial color="#a44931" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.61, 0.042]}>
        <boxGeometry args={[0.12, 0.035, 0.018]} />
        <meshStandardMaterial color="#a44931" roughness={0.7} />
      </mesh>
    </group>
  );
}

function ActivityTarget({
  roomId,
  onActivate,
  children,
}: {
  roomId: RoomId;
  onActivate: () => void;
  children: ReactNode;
}) {
  const pivotY = roomId === "daily-fortune" ? 1.2
    : roomId === "love-fortune" ? 1.18
      : roomId === "career-fortune" ? 1.08
        : roomId === "iching" ? 1.08
          : 1;

  return (
    <group
      position={[0, pivotY, -1.5]}
      onClick={(event) => {
        event.stopPropagation();
        onActivate();
      }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {children}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 2.4, 1.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function YinYangCoins({
  phase,
  coinValues,
  onActivate,
}: {
  phase: DrawPhase;
  coinValues?: number[];
  onActivate: () => void;
}) {
  const coins = useRef<Array<Group | null>>([]);
  const activePhase = useRef(phase);
  const startedAt = useRef(0);

  useFrame(({ clock }) => {
    if (phase !== activePhase.current) {
      activePhase.current = phase;
      startedAt.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startedAt.current;
    coins.current.forEach((coin, index) => {
      if (!coin) return;
      const baseX = index === 0 ? -0.58 : 0.58;
      if (phase === "shaking") {
        const spin = elapsed * 19 + index * Math.PI;
        coin.position.set(baseX + Math.sin(spin * 0.7) * 0.12, 0.1 + Math.abs(Math.sin(spin)) * 0.9, Math.cos(spin) * 0.12);
        coin.rotation.set(spin, Math.cos(spin) * 0.45, Math.sin(spin * 0.8) * 0.28);
      } else if (phase === "falling") {
        const progress = Math.min((clock.elapsedTime - startedAt.current) / 0.75, 1);
        const eased = 1 - (1 - progress) ** 3;
        const landingRotation = coinValues?.[index] === 0 ? Math.PI : 0;
        coin.position.set(baseX, 0.1 + (1 - eased) * 0.95, 0);
        coin.rotation.set(landingRotation * eased, 0, Math.sin(progress * Math.PI) * 0.12);
      } else {
        coin.position.set(baseX, 0.1, 0);
        coin.rotation.set(coinValues?.[index] === 0 ? Math.PI : 0, 0, 0);
      }
    });
  });

  return (
    <ActivityTarget onActivate={onActivate} roomId="yin-yang">
      <group>
        {[-0.58, 0.58].map((x, index) => (
          <group
            key={x}
            ref={(node) => { coins.current[index] = node; }}
            position={[x, 0.1, 0]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.4, 0.4, 0.13, 32]} />
              <meshStandardMaterial
                color={coinValues
                  ? (coinValues[index] === 1 ? "#c9974e" : "#d6c9a7")
                  : (index === 0 ? "#c9974e" : "#d6c9a7")}
                metalness={index === 0 ? 0.72 : 0.38}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}
      </group>
    </ActivityTarget>
  );
}

function IChingLines({
  phase,
  lineValues,
  onActivate,
}: {
  phase: DrawPhase;
  lineValues?: number[];
  onActivate: () => void;
}) {
  const lines = useRef<Array<Group | null>>([]);
  const activePhase = useRef(phase);
  const startedAt = useRef(0);

  useFrame(({ clock }) => {
    if (phase !== activePhase.current) {
      activePhase.current = phase;
      startedAt.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAt.current;
    lines.current.forEach((line, index) => {
      if (!line) return;
      const baseY = index * 0.31;
      if (phase === "shaking") {
        const motion = elapsed * 12 - index * 0.7;
        line.position.set(Math.sin(motion) * 0.12, baseY + Math.abs(Math.sin(motion)) * 0.24, 0);
        line.rotation.z = Math.sin(motion) * 0.12;
      } else {
        line.position.set(0, baseY, 0);
        line.rotation.set(0, 0, 0);
      }
    });
  });

  return (
    <ActivityTarget onActivate={onActivate} roomId="iching">
      <group>
        {Array.from({ length: 6 }, (_, index) => {
          const line = lineValues?.[index];
          const yang = line === undefined ? index % 2 === 1 : line === 7 || line === 9;
          return (
            <group
              key={index}
              ref={(node) => { lines.current[index] = node; }}
              position={[0, index * 0.31, 0]}
            >
              <mesh castShadow position={[-0.23, 0, 0]}>
                <boxGeometry args={[0.82, 0.11, 0.16]} />
                <meshStandardMaterial color={yang ? "#b9945d" : "#66523a"} />
              </mesh>
              {!yang && (
                <mesh castShadow position={[0.72, 0, 0]}>
                  <boxGeometry args={[0.82, 0.11, 0.16]} />
                  <meshStandardMaterial color="#66523a" />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </ActivityTarget>
  );
}

function DailyFortuneCard({ phase, onActivate }: { phase: DrawPhase; onActivate: () => void }) {
  const card = useRef<Group>(null);
  const activePhase = useRef(phase);
  const startedAt = useRef(0);

  useFrame(({ clock }) => {
    if (!card.current) return;
    if (phase !== activePhase.current) {
      activePhase.current = phase;
      startedAt.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAt.current;
    if (phase === "shaking") {
      card.current.rotation.y = Math.sin(elapsed * 7) * 0.9;
      card.current.position.y = Math.abs(Math.sin(elapsed * 6)) * 0.2;
      card.current.scale.setScalar(1 + Math.abs(Math.sin(elapsed * 6)) * 0.08);
    } else {
      card.current.rotation.set(0, 0, 0);
      card.current.position.set(0, 0, 0);
      card.current.scale.setScalar(1);
    }
  });

  return (
    <ActivityTarget onActivate={onActivate} roomId="daily-fortune">
      <group ref={card}>
        <mesh castShadow>
          <boxGeometry args={[1.35, 1.5, 0.18]} />
          <meshStandardMaterial color="#d9c79d" roughness={0.92} emissive="#a37b3c" emissiveIntensity={phase === "shaking" ? 0.45 : 0} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <torusGeometry args={[0.43, 0.035, 8, 32]} />
          <meshStandardMaterial color={gold} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </ActivityTarget>
  );
}

function LoveRings({ phase, onActivate }: { phase: DrawPhase; onActivate: () => void }) {
  const rings = useRef<Array<Group | null>>([]);
  const activePhase = useRef(phase);
  const startedAt = useRef(0);

  useFrame(({ clock }) => {
    if (phase !== activePhase.current) {
      activePhase.current = phase;
      startedAt.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAt.current;
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const side = index === 0 ? -1 : 1;
      if (phase === "shaking") {
        const sway = Math.sin(elapsed * 5 + index * Math.PI) * 0.18;
        ring.position.set(side * (0.28 - sway * 0.35), Math.abs(sway) * 0.45, index === 0 ? 0.12 : -0.12);
        ring.rotation.set(sway, sway * 0.5, side * sway);
      } else {
        ring.position.set(side * 0.28, 0, index === 0 ? 0.12 : -0.12);
        ring.rotation.set(0, 0, 0);
      }
    });
  });

  return (
    <ActivityTarget onActivate={onActivate} roomId="love-fortune">
      <group>
        {[-0.28, 0.28].map((x, index) => (
          <group
            key={x}
            ref={(node) => { rings.current[index] = node; }}
            position={[x, 0, index === 0 ? 0.12 : -0.12]}
          >
            <mesh castShadow>
              <torusGeometry args={[0.48, 0.085, 12, 32]} />
              <meshStandardMaterial color={index ? "#b98b60" : "#d4b77c"} metalness={0.38} roughness={0.42} />
            </mesh>
          </group>
        ))}
      </group>
    </ActivityTarget>
  );
}

function CareerScroll({ phase, onActivate }: { phase: DrawPhase; onActivate: () => void }) {
  const scroll = useRef<Group>(null);
  const activePhase = useRef(phase);
  const startedAt = useRef(0);

  useFrame(({ clock }) => {
    if (!scroll.current) return;
    if (phase !== activePhase.current) {
      activePhase.current = phase;
      startedAt.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAt.current;
    if (phase === "shaking") {
      scroll.current.rotation.z = Math.sin(elapsed * 12) * 0.08;
      scroll.current.rotation.y = Math.sin(elapsed * 6) * 0.18;
      scroll.current.scale.y = 0.25 + Math.min(elapsed / 1.2, 1) * 0.75;
    } else {
      scroll.current.rotation.set(0, 0, 0);
      scroll.current.scale.set(1, 1, 1);
    }
  });

  return (
    <ActivityTarget onActivate={onActivate} roomId="career-fortune">
      <group ref={scroll} position={[0, -0.57, 0]}>
        <mesh castShadow position={[0, 0.57, 0]} rotation-z={-0.17}>
          <boxGeometry args={[0.82, 1.14, 0.08]} />
          <meshStandardMaterial color="#e2d3ab" roughness={0.88} />
        </mesh>
        {[-0.25, 0, 0.25].map((y) => (
          <mesh key={y} position={[0, y + 0.57, 0.06]}>
            <boxGeometry args={[0.45, 0.035, 0.02]} />
            <meshStandardMaterial color={gold} />
          </mesh>
        ))}
      </group>
    </ActivityTarget>
  );
}

function RoomObject({
  roomId,
  drawNumber,
  drawPhase,
  coinValues,
  lineValues,
  onDrawFortuneStick,
  onRunActivity,
}: {
  roomId: RoomId;
  drawNumber?: number;
  drawPhase: DrawPhase;
  coinValues?: number[];
  lineValues?: number[];
  onDrawFortuneStick: () => void;
  onRunActivity: () => void;
}) {
  if (roomId === "fortune-sticks") {
    return (
      <group position={[0, 0.72, -1.5]}>
        <FortuneUrn phase={drawPhase} onDraw={onDrawFortuneStick} />
        <FallingFortuneStick number={drawNumber} phase={drawPhase} />
      </group>
    );
  }

  if (roomId === "yin-yang") {
    return <YinYangCoins coinValues={coinValues} onActivate={onRunActivity} phase={drawPhase} />;
  }

  if (roomId === "iching") {
    return <IChingLines lineValues={lineValues} onActivate={onRunActivity} phase={drawPhase} />;
  }

  if (roomId === "daily-fortune") {
    return <DailyFortuneCard onActivate={onRunActivity} phase={drawPhase} />;
  }

  if (roomId === "love-fortune") {
    return <LoveRings onActivate={onRunActivity} phase={drawPhase} />;
  }

  return <CareerScroll onActivate={onRunActivity} phase={drawPhase} />;
}
