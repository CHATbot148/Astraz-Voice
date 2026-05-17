import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface VoiceOrbProps {
  userVolume: number;
  modelVolume: number;
  isMuted: boolean;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ userVolume, modelVolume, isMuted }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef({ 
    time: 0, 
    user: 0, 
    model: 0, 
    muted: false, 
    shapeIndex: 0, 
    transition: 0,
    hue: 240
  });

  useEffect(() => {
    scrollRef.current.user = userVolume;
    scrollRef.current.model = modelVolume;
    if (scrollRef.current.muted !== isMuted) {
        scrollRef.current.muted = isMuted;
        scrollRef.current.transition = 0;
    }
  }, [userVolume, modelVolume, isMuted]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 800;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    
    // Clear any existing content before appending to prevent double render
    if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);
    }

    const particlesCount = 8500; // Increased density by 10%
    const geometry = new THREE.BufferGeometry();
    
    // Position Targets
    const posCurrent = new Float32Array(particlesCount * 3);
    const posSphere = new Float32Array(particlesCount * 3);
    const posTextAura = new Float32Array(particlesCount * 3);
    const posTextVoice = new Float32Array(particlesCount * 3);
    const posTextMind = new Float32Array(particlesCount * 3);
    const posTextCore = new Float32Array(particlesCount * 3);
    const posTextFlow = new Float32Array(particlesCount * 3);
    const posHello = new Float32Array(particlesCount * 3);
    const posHelp = new Float32Array(particlesCount * 3);
    const posListen = new Float32Array(particlesCount * 3);
    
    const posCube = new Float32Array(particlesCount * 3);
    const posRing = new Float32Array(particlesCount * 3);
    const posHeart = new Float32Array(particlesCount * 3);

    // Canvas helper to generate text positions - Centered & Scaled
    const sampleText = (text: string, array: Float32Array, customScale?: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600; // Wider for sentences
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = 'white';
        // Reduced font size for better fit on all screens
        ctx.font = `bold ${text.length > 10 ? 44 : 64}px Inter, sans-serif`; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 300, 50);

        const data = ctx.getImageData(0, 0, 600, 100).data;
        const coords = [];
        let minX = 600, maxX = 0, minY = 100, maxY = 0;
        
        for (let y = 0; y < 100; y++) {
            for (let x = 0; x < 600; x++) {
                if (data[(y * 600 + x) * 4] > 128) {
                    coords.push({ x, y });
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const scale = customScale || (text.length > 10 ? 45 : 30); 

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const p = coords[i % coords.length];
            array[i3] = (p.x - centerX) / scale + (Math.random() - 0.5) * 0.02;
            array[i3 + 1] = (centerY - p.y) / scale + (Math.random() - 0.5) * 0.02;
            array[i3 + 2] = (Math.random() - 0.5) * 0.02;
        }
    };

    sampleText('AURA', posTextAura);
    sampleText('VOICE', posTextVoice);
    sampleText('MIND', posTextMind);
    sampleText('CORE', posTextCore);
    sampleText('FLOW', posTextFlow);
    sampleText('HELLO', posHello);
    sampleText('HOW CAN I HELP?', posHelp);
    sampleText('I AM LISTENING', posListen);

    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        
        // Sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const isMobile = window.innerWidth < 768;
        const baseR = 2.0;
        const r = isMobile ? baseR * 1.07 : baseR; 
        posSphere[i3] = r * Math.sin(phi) * Math.cos(theta);
        posSphere[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posSphere[i3 + 2] = r * Math.cos(phi);

        // Cube
        posCube[i3] = (Math.random() - 0.5) * 4;
        posCube[i3 + 1] = (Math.random() - 0.5) * 4;
        posCube[i3 + 2] = (Math.random() - 0.5) * 4;

        // Ring
        const ringAngle = Math.random() * Math.PI * 2;
        const ringR = 3.5;
        posRing[i3] = ringR * Math.cos(ringAngle);
        posRing[i3 + 1] = ringR * Math.sin(ringAngle);
        posRing[i3 + 2] = (Math.random() - 0.5) * 0.2;

        // Heart
        const htAngle = Math.random() * Math.PI * 2;
        const heartX = 16 * Math.pow(Math.sin(htAngle), 3);
        const heartY = 13 * Math.cos(htAngle) - 5 * Math.cos(2*htAngle) - 2 * Math.cos(3*htAngle) - Math.cos(4*htAngle);
        posHeart[i3] = heartX / 6;
        posHeart[i3 + 1] = heartY / 6;
        posHeart[i3 + 2] = (Math.random() - 0.5) * 0.1;

        posCurrent[i3] = posSphere[i3];
        posCurrent[i3 + 1] = posSphere[i3+1];
        posCurrent[i3 + 2] = posSphere[i3+2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posCurrent, 3));
    const colors = new Float32Array(particlesCount * 3);
    for(let i=0; i<particlesCount; i++) {
        colors[i*3] = 0.5;
        colors[i*3+1] = 0.6;
        colors[i*3+2] = 1.0;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const vertexShader = `
      attribute vec3 color;
      varying vec3 vColor;
      uniform float size;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        // Sharper, perfectly round particles
        float alpha = (1.0 - smoothstep(0.4, 0.5, r)) * 1.0; 
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        size: { value: 0.053 }, // Increased by another 15% (0.046 * 1.15)
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    let shapeTimer = 0;
    const shapes = [
      posTextAura, posCube, posHello, posRing, posTextVoice, 
      posHeart, posHelp, posTextMind, posTextFlow, posListen
    ];

    const animate = () => {
      frame = requestAnimationFrame(animate);
      scrollRef.current.time += 0.015;
      const { time, user, model, muted, shapeIndex } = scrollRef.current;
      const vol = Math.max(user, model);
      
      const positions = geometry.attributes.position.array as Float32Array;
      const colorAttr = geometry.attributes.color.array as Float32Array;

      // When muted, we cycle through complex shapes
      // When talking, we prioritize expansion/contraction
      if (muted || vol < 0.02) {
          shapeTimer += 0.01;
          if (shapeTimer > 3.0) { 
              shapeTimer = 0;
              scrollRef.current.shapeIndex = (scrollRef.current.shapeIndex + 1) % shapes.length;
          }
          scrollRef.current.transition = THREE.MathUtils.lerp(scrollRef.current.transition, 1, 0.03);
      } else {
          // Rapidly transition back to expansion mode when talking
          scrollRef.current.transition = THREE.MathUtils.lerp(scrollRef.current.transition, 0, 0.1);
          shapeTimer = 0;
      }

      const t = scrollRef.current.transition;
      const currentTarget = shapes[shapeIndex];

      // Responsive overall scale based on container width
      const isMobile = window.innerWidth < 768;
      const responsiveScale = (containerRef.current ? Math.min(containerRef.current.clientWidth, 800) / 850 : 1) * (isMobile ? 1.07 : 1);
      points.scale.set(responsiveScale, responsiveScale, responsiveScale);

      // Smooth interpolation for size - Ensuring they stay visible and vibrant when muted
      const baseSize = isMobile ? 0.057 : 0.053; // 7% boost on mobile (0.053 * 1.07 approx)
      material.uniforms.size.value = THREE.MathUtils.lerp(baseSize + vol * 0.08, baseSize * 0.95, t);

      // Rotation handles: Lock rotation when showing flat maps/text or when speaking
      const isFlat = [0, 2, 4, 6, 7, 8, 9].includes(shapeIndex); 
      const isSpeaking = vol > 0.02;
      
      const targetRY = (isFlat && t > 0.5) || isSpeaking ? 0 : points.rotation.y + 0.005 + (muted ? 0 : vol * 0.05);
      points.rotation.y = THREE.MathUtils.lerp(points.rotation.y, targetRY, (isFlat && t > 0.5) || isSpeaking ? 0.05 : 1);
      
      const targetRX = (isFlat && t > 0.5) || isSpeaking ? 0 : points.rotation.x + 0.002;
      points.rotation.x = THREE.MathUtils.lerp(points.rotation.x, targetRX, (isFlat && t > 0.5) || isSpeaking ? 0.05 : 1);

      scrollRef.current.hue = (scrollRef.current.hue + 0.1) % 360;
      const baseColor = new THREE.Color().setHSL(scrollRef.current.hue / 360, 0.7, 0.6);

      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        
        let tx = posSphere[i3];
        let ty = posSphere[i3+1];
        let tz = posSphere[i3+2];

        // Apply Expansion/Shrinking Logic (Radial Flow) - RESTRAINED (20% reduction in expansion: 1.1 -> 0.88)
        const breath = Math.sin(time * 2) * 0.1;
        const expansionFactor = 1 + (vol * 0.88) + breath;
        tx *= expansionFactor;
        ty *= expansionFactor;
        tz *= expansionFactor;

        // Transition to static complex shapes if idle/muted
        if (t > 0.01) {
            tx = THREE.MathUtils.lerp(tx, currentTarget[i3], t);
            ty = THREE.MathUtils.lerp(ty, currentTarget[i3+1], t);
            tz = THREE.MathUtils.lerp(tz, currentTarget[i3+2], t);
        }

        const noise = Math.sin(time * 3 + tx + ty) * 0.04;
        
        positions[i3] = THREE.MathUtils.lerp(positions[i3], tx + noise, 0.15);
        positions[i3+1] = THREE.MathUtils.lerp(positions[i3+1], ty + noise, 0.15);
        positions[i3+2] = THREE.MathUtils.lerp(positions[i3+2], tz + noise, 0.15);

        // Color Logic: Indigo for UI, Emerald for Model, User for Dynamic Hue
        // FIX: Ensure colors stay vibrant and visible even when muted
        if (muted) {
            colorAttr[i3] = 0.4; colorAttr[i3+1] = 0.5; colorAttr[i3+2] = 0.9; // Brighter Indigo for muted
        } else if (model > 0.05) {
            colorAttr[i3] = 0.1; colorAttr[i3+1] = 1.0; colorAttr[i3+2] = 0.7; // Brighter Emerald
        } else if (user > 0.05) {
            colorAttr[i3] = baseColor.r; colorAttr[i3+1] = baseColor.g; colorAttr[i3+2] = baseColor.b;
        } else {
            colorAttr[i3] = 0.3; colorAttr[i3+1] = 0.4; colorAttr[i3+2] = 0.8;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);
    };


    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center pointer-events-none" />;
};


