import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Plane } from '@react-three/drei'
import * as THREE from 'three'

interface RippleUniforms {
  time: { value: number }
  rippleCenter: { value: THREE.Vector2 }
  rippleStrength: { value: number }
  rippleTime: { value: number }
  resolution: { value: THREE.Vector2 }
}

// Realistic water vertex shader
const vertexShader = `
  uniform float time;
  uniform vec2 rippleCenter;
  uniform float rippleStrength;
  uniform float rippleTime;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vElevation;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Gentle ambient waves for realistic water movement
    float wave1 = sin(position.x * 0.02 + time * 0.3) * 0.003;
    float wave2 = sin(position.z * 0.015 + time * 0.25) * 0.002;
    float wave3 = sin((position.x + position.z) * 0.01 + time * 0.15) * 0.001;
    
    // Cross waves for more realistic water
    float wave4 = sin(position.x * 0.025 - time * 0.2) * 0.0015;
    float wave5 = sin(position.z * 0.03 + time * 0.35) * 0.001;
    
    float elevation = wave1 + wave2 + wave3 + wave4 + wave5;
    
    // Ripple effect from click
    if (rippleStrength > 0.0) {
      // Convert normalized click position (0-1) to world coordinates
      // The plane is 60x60 units, so we map from -30 to +30
      vec2 clickWorldPos = (rippleCenter - 0.5) * 60.0;
      
      // Current vertex position in world space (XZ plane)
      vec2 currentPos = position.xz;
      
      // Calculate actual 2D distance for perfect circles
      float distanceFromClick = length(currentPos - clickWorldPos);
      
      // Ripple parameters for 1.5 second total duration
      float rippleSpeed = 20.0; // Faster expansion to cover more area
      float rippleWidth = 2.0;   // Width of each ring
      
      // Three concentric rings with staggered timing
      float ripple1Radius = rippleTime * rippleSpeed;
      float ripple1 = 0.0;
      if (ripple1Radius > 0.0) {
        float ring1Edge = abs(distanceFromClick - ripple1Radius);
        ripple1 = 1.0 - smoothstep(0.0, rippleWidth, ring1Edge);
      }
      
      // Second ring starts after 0.5s
      float ripple2Radius = max(0.0, (rippleTime - 0.5) * rippleSpeed);
      float ripple2 = 0.0;
      if (ripple2Radius > 0.0) {
        float ring2Edge = abs(distanceFromClick - ripple2Radius);
        ripple2 = 1.0 - smoothstep(0.0, rippleWidth, ring2Edge);
      }
      
      // Third ring starts after 1.0s
      float ripple3Radius = max(0.0, (rippleTime - 1.0) * rippleSpeed);
      float ripple3 = 0.0;
      if (ripple3Radius > 0.0) {
        float ring3Edge = abs(distanceFromClick - ripple3Radius);
        ripple3 = 1.0 - smoothstep(0.0, rippleWidth, ring3Edge);
      }
      
      // Combine all ripples with decay
      float distanceDecay = 1.0 / (1.0 + distanceFromClick * 0.02);
      float timeDecay = 1.0 - (rippleTime / 1.5); // Linear decay over 1.5s
      timeDecay = max(0.0, timeDecay);
      
      // Combine rings with decreasing intensity
      float totalRipple = (ripple1 + ripple2 * 0.7 + ripple3 * 0.5) * distanceDecay * timeDecay * rippleStrength;
      
      // Apply ripple to elevation
      elevation += totalRipple * 0.02;
    }
    
    vec3 newPosition = position;
    newPosition.y += elevation;
    vElevation = elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

// Realistic water fragment shader
const fragmentShader = `
  uniform float time;
  uniform vec2 rippleCenter;
  uniform float rippleStrength;
  uniform float rippleTime;
  uniform vec2 resolution;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vElevation;
  
  void main() {
    // Realistic water colors with depth gradient
    vec3 deepWater = vec3(0.05, 0.15, 0.4);    // Very deep blue
    vec3 midWater = vec3(0.1, 0.25, 0.55);     // Medium blue
    vec3 surfaceWater = vec3(0.2, 0.4, 0.7);   // Lighter surface blue
    vec3 shallowWater = vec3(0.3, 0.5, 0.8);   // Shallow water
    
    // Complex depth gradient for realistic water appearance
    float depth = vUv.y;
    vec3 waterColor;
    
    if (depth < 0.3) {
      // Surface to mid water
      waterColor = mix(shallowWater, surfaceWater, depth / 0.3);
    } else if (depth < 0.7) {
      // Mid to deeper water
      waterColor = mix(surfaceWater, midWater, (depth - 0.3) / 0.4);
    } else {
      // Deep water
      waterColor = mix(midWater, deepWater, (depth - 0.7) / 0.3);
    }
    
    // Horizontal water lines for realistic appearance
    float lines1 = sin(vUv.y * 80.0 + time * 0.2) * 0.008;
    float lines2 = sin(vUv.y * 150.0 + time * 0.15) * 0.005;
    float lines3 = sin(vUv.y * 300.0 + time * 0.1) * 0.003;
    
    // Horizontal drift for water movement
    float horizontalShift = time * 0.02;
    lines1 += sin((vUv.x + horizontalShift) * 20.0) * 0.003;
    lines2 += sin((vUv.x + horizontalShift * 0.8) * 40.0) * 0.002;
    lines3 += sin((vUv.x + horizontalShift * 0.6) * 60.0) * 0.001;
    
    float linePattern = lines1 + lines2 + lines3;
    
    // Apply line pattern for water texture
    waterColor += vec3(linePattern * 0.15);
    
    // Surface reflections and highlights
    float reflection = smoothstep(-0.001, 0.001, vElevation) * 0.12;
    waterColor += vec3(reflection);
    
    // Add subtle foam/highlights at surface
    if (depth < 0.1) {
      float foam = (1.0 - depth / 0.1) * 0.05;
      waterColor += vec3(foam);
    }
    
    // Ripple highlights
    if (rippleStrength > 0.0) {
      // Same coordinate mapping as vertex shader
      vec2 clickWorldPos = (rippleCenter - 0.5) * 60.0;
      vec2 currentPos = vPosition.xz;
      float distanceFromClick = length(currentPos - clickWorldPos);
      
      // Same parameters as vertex shader
      float rippleSpeed = 20.0;
      float rippleWidth = 2.0;
      
      // Three highlight rings matching vertex shader
      float ripple1Radius = rippleTime * rippleSpeed;
      float highlight1 = 0.0;
      if (ripple1Radius > 0.0) {
        float ring1Edge = abs(distanceFromClick - ripple1Radius);
        highlight1 = 1.0 - smoothstep(0.0, rippleWidth, ring1Edge);
      }
      
      float ripple2Radius = max(0.0, (rippleTime - 0.5) * rippleSpeed);
      float highlight2 = 0.0;
      if (ripple2Radius > 0.0) {
        float ring2Edge = abs(distanceFromClick - ripple2Radius);
        highlight2 = 1.0 - smoothstep(0.0, rippleWidth, ring2Edge);
      }
      
      float ripple3Radius = max(0.0, (rippleTime - 1.0) * rippleSpeed);
      float highlight3 = 0.0;
      if (ripple3Radius > 0.0) {
        float ring3Edge = abs(distanceFromClick - ripple3Radius);
        highlight3 = 1.0 - smoothstep(0.0, rippleWidth, ring3Edge);
      }
      
      // Same decay as vertex shader
      float distanceDecay = 1.0 / (1.0 + distanceFromClick * 0.02);
      float timeDecay = 1.0 - (rippleTime / 1.5);
      timeDecay = max(0.0, timeDecay);
      
      float totalHighlight = (highlight1 + highlight2 * 0.7 + highlight3 * 0.5) * distanceDecay * timeDecay * rippleStrength;
      
      waterColor += vec3(totalHighlight * 0.4);
    }
    
    // Clamp to realistic water color range
    waterColor = clamp(waterColor, vec3(0.05, 0.15, 0.4), vec3(0.4, 0.6, 0.9));
    
    gl_FragColor = vec4(waterColor, 1.0);
  }
`

interface WaterPlaneProps {
  rippleCenter: THREE.Vector2
  rippleStrength: number
  rippleTime: number
}

function WaterPlane({ rippleCenter, rippleStrength, rippleTime }: WaterPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo<RippleUniforms>(() => ({
    time: { value: 0 },
    rippleCenter: { value: rippleCenter },
    rippleStrength: { value: rippleStrength },
    rippleTime: { value: rippleTime },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  }), [])

  useFrame((state) => {
    if (meshRef.current && uniforms) {
      uniforms.time.value = state.clock.elapsedTime
      uniforms.rippleCenter.value.copy(rippleCenter)
      uniforms.rippleStrength.value = rippleStrength
      uniforms.rippleTime.value = rippleTime
      uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
    }
  })

  return (
    <Plane ref={meshRef} args={[60, 60, 256, 256]} rotation={[-Math.PI / 2, 0, 0]}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={false}
        side={THREE.DoubleSide}
      />
    </Plane>
  )
}

interface CameraControllerProps {
  targetZ: number
}

function CameraController({ targetZ }: CameraControllerProps) {
  const { camera } = useThree()
  
  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.02)
  })
  
  return null
}

// Fallback component for when WebGL fails
function WaterFallback({ className }: { className: string }) {
  return (
    <div 
      className={`${className} relative overflow-hidden`}
      style={{
        background: `
          linear-gradient(180deg, 
            #4A90E2 0%, 
            #2E5BBA 25%, 
            #1E40AF 50%, 
            #1E3A8A 75%, 
            #0F172A 100%
          )
        `
      }}
    >
      {/* Animated horizontal lines to simulate water */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-white/20"
            style={{
              top: `${(i * 3) + 5}%`,
              animationDelay: `${i * 0.1}s`,
              animation: `waterLines 4s ease-in-out infinite`
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes waterLines {
          0%, 100% { transform: translateX(0px); opacity: 0.2; }
          50% { transform: translateX(15px); opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

interface HeroCanvasProps {
  className?: string
  rippleCenter?: [number, number]
  rippleStrength?: number
  rippleTime?: number
  cameraZ?: number
  reducedMotion?: boolean
}

export function HeroCanvas({ 
  className = '',
  rippleCenter = [0.5, 0.5],
  rippleStrength = 0,
  rippleTime = 0,
  cameraZ = 15,
  reducedMotion = false
}: HeroCanvasProps) {
  const rippleCenterVector = useMemo(() => 
    new THREE.Vector2(rippleCenter[0], rippleCenter[1]), 
    [rippleCenter]
  )

  // If reduced motion is enabled, show fallback
  if (reducedMotion) {
    return <WaterFallback className={className} />
  }

  return (
    <div className={`${className}`} style={{ 
      width: '100vw', 
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1
    }}>
      <Canvas
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
        }}
        camera={{ 
          position: [0, 12, cameraZ], 
          fov: 60,
          aspect: window.innerWidth / window.innerHeight,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true, 
          alpha: false,
          preserveDrawingBuffer: false
        }}
        onCreated={({ gl, size }) => {
          gl.setSize(size.width, size.height)
          gl.setClearColor('#0D2A5C') // Darker blue background
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
        fallback={<WaterFallback className="w-full h-full" />}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 20, 10]} 
            intensity={0.4}
            color="#ffffff"
          />
          
          <WaterPlane 
            rippleCenter={rippleCenterVector}
            rippleStrength={rippleStrength}
            rippleTime={rippleTime}
          />
          
          <CameraController targetZ={cameraZ} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default HeroCanvas