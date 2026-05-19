import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface VoiceOrbProps {
  userVolume: number;
  modelVolume: number;
  isMuted: boolean;
  status?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ userVolume, modelVolume, isMuted, status }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef({ 
    time: 0, 
    user: 0, 
    model: 0, 
    muted: false, 
    shapeIndex: 0, 
    transition: 0,
    hue: 240,
    connecting: false,
    status: 'idle'
  });

  useEffect(() => {
    scrollRef.current.user = userVolume;
    scrollRef.current.model = modelVolume;
    scrollRef.current.connecting = status === 'connecting';
    (scrollRef.current as any).status = status;
    if (scrollRef.current.muted !== isMuted) {
        scrollRef.current.muted = isMuted;
        scrollRef.current.transition = 0;
    }
  }, [userVolume, modelVolume, isMuted, status]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // ... (rest of the setup)

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
    const posEntrance = new Float32Array(particlesCount * 3);
    const posExit = new Float32Array(particlesCount * 3);
    const posSphere = new Float32Array(particlesCount * 3);
    
    // 1. TEXTS (10)
    const texts = ['ASTRAZ', 'VOICE', 'CORE', 'MIND', 'FLOW', 'NEURAL', 'SYNCED', 'REAL-TIME', 'ADAPTIVE', 'SMART'];
    const posTexts = texts.map(() => new Float32Array(particlesCount * 3));
    
    // 2. SHAPES (10)
    const posCube = new Float32Array(particlesCount * 3);
    const posRing = new Float32Array(particlesCount * 3);
    const posHeart = new Float32Array(particlesCount * 3);
    const posHelix = new Float32Array(particlesCount * 3);
    const posTorus = new Float32Array(particlesCount * 3);
    const posStar = new Float32Array(particlesCount * 3);
    const posSpiral = new Float32Array(particlesCount * 3);
    const posSphereGrid = new Float32Array(particlesCount * 3);
    const posPyramid = new Float32Array(particlesCount * 3);
    const posCapsule = new Float32Array(particlesCount * 3);
    const shapePositions = [posCube, posRing, posHeart, posHelix, posTorus, posStar, posSpiral, posSphereGrid, posPyramid, posCapsule];

    // 3. SENTENCES (10)
    const sentences = [
        'HOW CAN I HELP?', 'I AM LISTENING...', 'TALK TO ME', 'WHAT IS ON YOUR MIND?', 
        'READY FOR INPUT', 'AWAITING YOUR VOICE', 'SYSTEMS ARE ACTIVE', 
        'SYNCING YOUR THOUGHTS', 'VOICE LINK ESTABLISHED', 'PROCESSING NEURAL DATA'
    ];
    const posSentences = sentences.map(() => new Float32Array(particlesCount * 3));

    // 4. OTHER ELEMENTS (10)
    const posCross = new Float32Array(particlesCount * 3);
    const posOcta = new Float32Array(particlesCount * 3);
    const posWave = new Float32Array(particlesCount * 3);
    const posGrid = new Float32Array(particlesCount * 3);
    const posOrbit = new Float32Array(particlesCount * 3);
    const posGalaxy = new Float32Array(particlesCount * 3);
    const posAtom = new Float32Array(particlesCount * 3);
    const posKnot = new Float32Array(particlesCount * 3);
    const posPulse = new Float32Array(particlesCount * 3);
    const posDna = new Float32Array(particlesCount * 3);
    const otherPositions = [posCross, posOcta, posWave, posGrid, posOrbit, posGalaxy, posAtom, posKnot, posPulse, posDna];

    // Canvas helper to generate text positions - Centered & Scaled
    const sampleText = (text: string, array: Float32Array, customScale?: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600; 
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.font = `bold ${text.length > 10 ? 36 : 60}px Inter, sans-serif`; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 300, 50);

        const data = ctx.getImageData(0, 0, 600, 100).data;
        const coords = [];
        for (let y = 0; y < 100; y++) {
            for (let x = 0; x < 600; x++) {
                if (data[(y * 600 + x) * 4] > 128) {
                    coords.push({ x, y });
                }
            }
        }

        const scale = customScale || (text.length > 15 ? 45 : 30); 
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const p = coords[i % coords.length] || { x: 300, y: 50 };
            array[i3] = (p.x - 300) / scale + (Math.random() - 0.5) * 0.02;
            array[i3 + 1] = (50 - p.y) / scale + (Math.random() - 0.5) * 0.02;
            array[i3 + 2] = (Math.random() - 0.5) * 0.02;
        }
    };

    // Populate positions
    texts.forEach((t, i) => sampleText(t, posTexts[i]));
    sentences.forEach((s, i) => sampleText(s, posSentences[i]));

    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        
        // Entrance: 8 Corners of the universe - Extended for large screens
        const cornerX = Math.random() > 0.5 ? 60 : -60;
        const cornerY = Math.random() > 0.5 ? 60 : -60;
        const cornerZ = Math.random() > 0.5 ? 60 : -60;
        posEntrance[i3] = cornerX + (Math.random() - 0.5) * 20;
        posEntrance[i3 + 1] = cornerY + (Math.random() - 0.5) * 20;
        posEntrance[i3 + 2] = cornerZ + (Math.random() - 0.5) * 20;

        // Exit: Spherical Explosion - Extended for large screens
        const exTheta = Math.random() * Math.PI * 2;
        const exPhi = Math.acos((Math.random() * 2) - 1);
        const exR = 80; 
        posExit[i3] = exR * Math.sin(exPhi) * Math.cos(exTheta);
        posExit[i3 + 1] = exR * Math.sin(exPhi) * Math.sin(exTheta);
        posExit[i3 + 2] = exR * Math.cos(exPhi);

        // Sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 2.0; 
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

        // Helix
        const hT = (i / particlesCount) * Math.PI * 8;
        const hR = 2.5;
        posHelix[i3] = hR * Math.cos(hT);
        posHelix[i3 + 1] = (i / particlesCount) * 8 - 4;
        posHelix[i3 + 2] = hR * Math.sin(hT);

        // Torus
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const tR = 3;
        const tr = 1;
        posTorus[i3] = (tR + tr * Math.cos(v)) * Math.cos(u);
        posTorus[i3 + 1] = (tR + tr * Math.cos(v)) * Math.sin(u);
        posTorus[i3 + 2] = tr * Math.sin(v);

        // Star
        const starP = 5;
        const starT = Math.random() * Math.PI * 2;
        const starR = (Math.abs(Math.cos(starP * starT / 2)) + 1) * 1.5;
        posStar[i3] = starR * Math.cos(starT);
        posStar[i3 + 1] = starR * Math.sin(starT);
        posStar[i3 + 2] = (Math.random() - 0.5) * 0.2;

        // Spiral
        const spiralT = (i / particlesCount) * Math.PI * 12;
        const spiralR = (i / particlesCount) * 4;
        posSpiral[i3] = spiralR * Math.cos(spiralT);
        posSpiral[i3 + 1] = spiralR * Math.sin(spiralT);
        posSpiral[i3 + 2] = (Math.random() - 0.5) * 0.1;

        // Sphere Grid
        const gridAng1 = Math.random() * Math.PI * 2;
        const gridAng2 = Math.random() * Math.PI * 2;
        const gridR = 3;
        posSphereGrid[i3] = gridR * Math.sin(gridAng2) * Math.cos(gridAng1);
        posSphereGrid[i3 + 1] = gridR * Math.sin(gridAng2) * Math.sin(gridAng1);
        posSphereGrid[i3 + 2] = gridR * Math.cos(gridAng2);

        // Pyramid
        const pY = (Math.random() - 0.5) * 4;
        const pR = (2 - pY/2) * (Math.random() > 0.5 ? 1 : -1);
        posPyramid[i3] = pR;
        posPyramid[i3+1] = pY;
        posPyramid[i3+2] = (2 - pY/2) * (Math.random() > 0.5 ? 1 : -1);

        // Capsule
        const capTheta = Math.random() * Math.PI * 2;
        const capZ = (Math.random() - 0.5) * 4;
        const capR = 1.5;
        posCapsule[i3] = capR * Math.cos(capTheta);
        posCapsule[i3+1] = capR * Math.sin(capTheta);
        posCapsule[i3+2] = capZ;

        // Simple geometries for "Other Elements"
        posCross[i3] = i % 2 === 0 ? (Math.random() - 0.5) * 6 : 0;
        posCross[i3+1] = i % 2 === 1 ? (Math.random() - 0.5) * 6 : 0;
        posCross[i3+2] = (Math.random() - 0.5) * 0.2;

        posOcta[i3] = Math.sin(i) * 3;
        posOcta[i3+1] = Math.cos(i) * 3;
        posOcta[i3+2] = Math.tan(i) * 1;

        posWave[i3] = (i / particlesCount) * 10 - 5;
        posWave[i3+1] = Math.sin(i / 100) * 2;
        posWave[i3+2] = Math.cos(i / 100) * 2;

        posGrid[i3] = Math.floor(Math.random() * 5) - 2;
        posGrid[i3+1] = Math.floor(Math.random() * 5) - 2;
        posGrid[i3+2] = Math.floor(Math.random() * 5) - 2;

        posOrbit[i3] = Math.cos(i) * (3 + Math.sin(i*0.1));
        posOrbit[i3+1] = Math.sin(i) * (3 + Math.sin(i*0.1));
        posOrbit[i3+2] = Math.sin(i*0.05) * 2;

        posGalaxy[i3] = Math.pow(Math.random(), 0.5) * 5 * Math.cos(Math.random() * 20);
        posGalaxy[i3+1] = Math.pow(Math.random(), 0.5) * 5 * Math.sin(Math.random() * 20);
        posGalaxy[i3+2] = (Math.random() - 0.5) * 1;

        posAtom[i3] = Math.sin(i * 0.1) * 3 * Math.cos(i * 0.5);
        posAtom[i3+1] = Math.sin(i * 0.1) * 3 * Math.sin(i * 0.5);
        posAtom[i3+2] = Math.cos(i * 0.1) * 3;

        posKnot[i3] = Math.sin(i) + 2 * Math.sin(2 * i);
        posKnot[i3+1] = Math.cos(i) - 2 * Math.cos(2 * i);
        posKnot[i3+2] = -Math.sin(3 * i);

        posPulse[i3] = (Math.random() - 0.5) * 10;
        posPulse[i3+1] = Math.exp(-Math.pow(posPulse[i3], 2)) * 5;
        posPulse[i3+2] = (Math.random() - 0.5) * 0.5;

        posDna[i3] = Math.cos(i * 0.1) * 2;
        posDna[i3+1] = i / 100 - 4;
        posDna[i3+2] = Math.sin(i * 0.1) * 2;

        posCurrent[i3] = posEntrance[i3];
        posCurrent[i3 + 1] = posEntrance[i3+1];
        posCurrent[i3 + 2] = posEntrance[i3+2];
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
    let localStatus = status;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      scrollRef.current.time += 0.015;
      const { time, user, model, muted, shapeIndex } = scrollRef.current;
      const currentStatus = scrollRef.current.status;
      const vol = Math.max(user, model);
      
      const positions = geometry.attributes.position.array as Float32Array;
      const colorAttr = geometry.attributes.color.array as Float32Array;

      // Responsive overall scale
      const isMobile = window.innerWidth < 768;
      const responsiveScale = (containerRef.current ? Math.min(containerRef.current.clientWidth, 800) / 850 : 1) * (isMobile ? 1.07 : 1);

      // Phase & Shape Management
      let lerpSpeed = 0.15;
      let isExploding = false;
      const t = scrollRef.current.transition;
      const si = scrollRef.current.shapeIndex;

      if (currentStatus === 'connecting') {
          lerpSpeed = 0.05;
          isExploding = true;
          points.scale.set(responsiveScale * (Math.sin(time*10)*0.1+1), responsiveScale * (Math.sin(time*10)*0.1+1), responsiveScale * (Math.sin(time*10)*0.1+1));
      } else if (currentStatus === 'connected') {
          // Sync transition for muted states
          if (muted || vol < 0.02) {
              shapeTimer += 0.01;
              if (shapeTimer > 3.0) { 
                  shapeTimer = 0;
                  scrollRef.current.shapeIndex = (scrollRef.current.shapeIndex + 1) % 40;
              }
              scrollRef.current.transition = THREE.MathUtils.lerp(scrollRef.current.transition, 1, 0.03);
          } else {
              scrollRef.current.transition = THREE.MathUtils.lerp(scrollRef.current.transition, 0, 0.1);
          }
          points.scale.set(responsiveScale, responsiveScale, responsiveScale);
          lerpSpeed = 0.15;
      } else {
          lerpSpeed = 0.25; // Faster exit animation
          isExploding = true;
          points.scale.set(responsiveScale, responsiveScale, responsiveScale);
      }

      // Smooth interpolation for size
      const baseSize = isMobile ? 0.057 : 0.053; 
      material.uniforms.size.value = THREE.MathUtils.lerp(baseSize + vol * 0.08, baseSize * 0.95, t);

      // Rotation handles: Smoother and more dynamic for all states
      const isFlat = (si % 4 === 0 || si % 4 === 2) && t > 0.5 && currentStatus === 'connected';
      const isSpeaking = vol > 0.02 && currentStatus === 'connected';
      
      // Muted elements should have a gentle idle orbit
      let targetRY = points.rotation.y + 0.005;
      let targetRX = points.rotation.x + 0.002;

      if (isFlat) {
          // Flat elements face user but wobble subtly
          targetRY = Math.sin(time * 0.2) * 0.15;
          targetRX = Math.cos(time * 0.15) * 0.1;
      } else if (isSpeaking) {
          // Reactive but stable for speech
          targetRY = 0;
          targetRX = 0;
      } else if (isExploding) {
          // No rotation during entrance/exit
          targetRY = 0;
          targetRX = 0;
      } else if (currentStatus === 'connected') {
          // Dynamic spin for 3D shapes
          targetRY = points.rotation.y + 0.008 + (muted ? 0 : vol * 0.08);
          targetRX = points.rotation.x + 0.004 + (muted ? 0 : vol * 0.03);
      }
      
      points.rotation.y = THREE.MathUtils.lerp(points.rotation.y, targetRY, isFlat ? 0.05 : 0.1);
      points.rotation.x = THREE.MathUtils.lerp(points.rotation.x, targetRX, 0.05);

      scrollRef.current.hue = (scrollRef.current.hue + 0.1) % 360;
      const baseColor = new THREE.Color().setHSL(scrollRef.current.hue / 360, 0.7, 0.6);

      // Determine active target shape array - NEW Alternating Sequence
      // Categories: Text (0), Shape (1), Sentence (2), Other (3)
      let activeTarget: Float32Array;
      if (currentStatus === 'connecting') activeTarget = posEntrance;
      else if (currentStatus === 'connected') {
          const cat = si % 4;
          const idx = Math.floor(si / 4);
          if (cat === 0) activeTarget = posTexts[idx];
          else if (cat === 1) activeTarget = shapePositions[idx];
          else if (cat === 2) activeTarget = posSentences[idx];
          else activeTarget = otherPositions[idx];
      } else activeTarget = posExit;

      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        
        let tx = posSphere[i3];
        let ty = posSphere[i3 + 1];
        let tz = posSphere[i3 + 2];

        // Transitions using t with elastic feel
        if (currentStatus === 'connected') {
            tx = THREE.MathUtils.lerp(tx, activeTarget[i3], t);
            ty = THREE.MathUtils.lerp(ty, activeTarget[i3 + 1], t);
            tz = THREE.MathUtils.lerp(tz, activeTarget[i3 + 2], t);
        } else if (currentStatus === 'connecting') {
            // Smoothly move from entrance to sphere
            tx = THREE.MathUtils.lerp(activeTarget[i3], tx, Math.min(time * 0.5, 1));
            ty = THREE.MathUtils.lerp(activeTarget[i3 + 1], ty, Math.min(time * 0.5, 1));
            tz = THREE.MathUtils.lerp(activeTarget[i3 + 2], tz, Math.min(time * 0.5, 1));
        } else {
            // Rapid dispersal for exit
            tx = THREE.MathUtils.lerp(positions[i3], activeTarget[i3], lerpSpeed);
            ty = THREE.MathUtils.lerp(positions[i3+1], activeTarget[i3+1], lerpSpeed);
            tz = THREE.MathUtils.lerp(positions[i3+2], activeTarget[i3+2], lerpSpeed);
        }

        // Expansion logic
        if (currentStatus === 'connected' && t < 0.1) {
            const expansionFactor = 1 + (vol * 0.88) + Math.sin(time * 2) * 0.1;
            tx *= expansionFactor;
            ty *= expansionFactor;
            tz *= expansionFactor;
        }

        const noise = Math.sin(time * 3 + tx + ty) * 0.04;
        positions[i3] = THREE.MathUtils.lerp(positions[i3], tx + noise, lerpSpeed);
        positions[i3+1] = THREE.MathUtils.lerp(positions[i3+1], ty + noise, lerpSpeed);
        positions[i3+2] = THREE.MathUtils.lerp(positions[i3+2], tz + noise, lerpSpeed);

        // Color logic
        if (currentStatus === 'connecting') {
            const p = Math.sin(time * 10) * 0.3 + 0.7;
            colorAttr[i3] = 0.6 * p; colorAttr[i3+1] = 0.8 * p; colorAttr[i3+2] = 1.0;
        } else if (muted) {
            colorAttr[i3] = 0.4; colorAttr[i3+1] = 0.5; colorAttr[i3+2] = 0.9;
        } else if (model > 0.05) {
            colorAttr[i3] = 0.1; colorAttr[i3+1] = 1.0; colorAttr[i3+2] = 0.7;
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


