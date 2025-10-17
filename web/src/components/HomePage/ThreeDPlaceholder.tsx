'use client'

import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useRef } from 'react'
import logo from '../../../public/Logo-icon.png'

function RotatingMesh() {
    const groupRef = useRef<THREE.Group>(null!)
    const texture = useLoader(THREE.TextureLoader, logo.src)

    // Rotasi grup supaya mesh & logo muter bareng
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.01
        }
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <icosahedronGeometry args={[2.5, 2]} />
                <meshStandardMaterial color="#14b8a6" wireframe />
            </mesh>

            <mesh>
                <planeGeometry args={[1.5, 1.5]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    )
}

export default function ThreeDPlaceholder() {
    return (
        <Canvas style={{ height: '100%', width: '100%' }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <RotatingMesh />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
        </Canvas>
    )
}
