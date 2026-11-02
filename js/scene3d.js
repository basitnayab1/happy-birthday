// 3D Scene Controller for Abuzar's Birthday Celebration
// Powered by Three.js & WebGL

class BirthdayScene {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        // Object collections
        this.balloons = [];
        this.candles = [];
        this.cakeGroup = null;
        this.giftGroup = null;
        this.giftLid = null;
        this.knife = null;
        this.cakeSlice = null;
        this.fireworks = [];
        this.smokeParticles = [];
        this.popFragments = [];
        this.partySpotlights = [];
        this.starField = null;

        // Interactive state
        this.isCandlesLit = true;
        this.isCakeCut = false;
        this.isGiftOpened = false;
        this.isPartyMode = false;
        this.balloonPopCount = 0;

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0614);
        this.scene.fog = new THREE.FogExp2(0x0a0614, 0.022);

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
        this.camera.position.set(0, 7.5, 17);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // 4. Controls setup
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't allow viewing strictly under floor
        this.controls.minDistance = 7;
        this.controls.maxDistance = 28;
        this.controls.target.set(0, 2.2, 0);
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.6;

        // 5. Build Environment & 3D Assets
        this.setupLighting();
        this.setupStarfield();
        this.setupPedestal();
        this.buildCake();
        this.buildBalloons();
        this.buildGiftBox();
        this.buildKnife();

        // 6. Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });

        // 7. Start render loop
        this.animate();
    }

    setupLighting() {
        // Ambient glow
        const ambientLight = new THREE.AmbientLight(0x38285c, 0.9);
        this.scene.add(ambientLight);

        // Main warm spotlight from above-front
        const mainSpot = new THREE.SpotLight(0xfff3e0, 2.8);
        mainSpot.position.set(5, 16, 10);
        mainSpot.angle = Math.PI / 4;
        mainSpot.penumbra = 0.4;
        mainSpot.castShadow = true;
        mainSpot.shadow.mapSize.width = 1024;
        mainSpot.shadow.mapSize.height = 1024;
        mainSpot.shadow.camera.near = 1;
        mainSpot.shadow.camera.far = 30;
        mainSpot.shadow.bias = -0.001;
        this.scene.add(mainSpot);

        // Rim fill light (Cyan / Purple aesthetic edge highlights)
        const rimLight1 = new THREE.DirectionalLight(0x00d4ff, 1.2);
        rimLight1.position.set(-10, 8, -8);
        this.scene.add(rimLight1);

        const rimLight2 = new THREE.DirectionalLight(0xff007f, 1.0);
        rimLight2.position.set(10, 6, -8);
        this.scene.add(rimLight2);

        // Party mode spotlights (created but dimmed initially)
        const partyColors = [0xff0055, 0x00ffcc, 0xffbb00, 0xaa00ff];
        partyColors.forEach((color, i) => {
            const spot = new THREE.PointLight(color, 0, 15);
            spot.position.set(
                Math.cos((i / 4) * Math.PI * 2) * 8,
                9,
                Math.sin((i / 4) * Math.PI * 2) * 8
            );
            this.scene.add(spot);
            this.partySpotlights.push(spot);
        });
    }

    setupStarfield() {
        const starCount = 1800;
        const starGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        const palette = [
            new THREE.Color(0xffd700), // Gold
            new THREE.Color(0x00ffff), // Cyan
            new THREE.Color(0xff66cc), // Pink
            new THREE.Color(0xffffff)  // White
        ];

        for (let i = 0; i < starCount; i++) {
            const radius = 25 + Math.random() * 45;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create glowing circular star texture programmatically
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);

        const starTexture = new THREE.CanvasTexture(canvas);

        const starMat = new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            map: starTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.starField = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starField);
    }

    setupPedestal() {
        const group = new THREE.Group();

        // 1. Pedestal top disc (Dark Obsidian Marble)
        const pedestalGeo = new THREE.CylinderGeometry(5.2, 5.8, 0.7, 64);
        const pedestalMat = new THREE.MeshStandardMaterial({
            color: 0x141026,
            roughness: 0.25,
            metalness: 0.85
        });
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal.position.y = -0.35;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        // 2. Glowing Neon Gold Ring on Pedestal Edge
        const ringGeo = new THREE.TorusGeometry(5.25, 0.08, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 1.2,
            metalness: 0.9,
            roughness: 0.1
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        group.add(ring);

        // 3. Subtle floor circle pattern underneath
        const floorGeo = new THREE.RingGeometry(5.6, 9.5, 64);
        const floorMat = new THREE.MeshBasicMaterial({
            color: 0x4f2b96,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.15
        });
        const floorRing = new THREE.Mesh(floorGeo, floorMat);
        floorRing.rotation.x = Math.PI / 2;
        floorRing.position.y = -0.68;
        group.add(floorRing);

        this.scene.add(group);
    }

    buildCake() {
        this.cakeGroup = new THREE.Group();

        // Tier materials
        const baseCakeMat = new THREE.MeshStandardMaterial({
            color: 0x2e1814, // Dark chocolate velvet
            roughness: 0.6,
            metalness: 0.1
        });
        const middleCakeMat = new THREE.MeshStandardMaterial({
            color: 0xd94b68, // Strawberry rose cream
            roughness: 0.45,
            metalness: 0.15
        });
        const topCakeMat = new THREE.MeshStandardMaterial({
            color: 0xfffae8, // Rich vanilla mascarpone
            roughness: 0.35,
            metalness: 0.1
        });
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x443000
        });
        const pearlMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.1
        });

        // TIER 1 (Bottom Tier)
        const t1Height = 1.4;
        const t1Radius = 3.2;
        const t1Geo = new THREE.CylinderGeometry(t1Radius, t1Radius, t1Height, 64);
        const t1Mesh = new THREE.Mesh(t1Geo, baseCakeMat);
        t1Mesh.position.y = t1Height / 2;
        t1Mesh.castShadow = true;
        t1Mesh.receiveShadow = true;
        this.cakeGroup.add(t1Mesh);

        // Frosting pearls around Tier 1 rim
        this.createFrostingPearls(t1Radius, t1Height, 32, pearlMat, this.cakeGroup);
        this.createFrostingPearls(t1Radius + 0.05, 0.05, 36, goldMat, this.cakeGroup);

        // TIER 2 (Middle Tier)
        const t2Height = 1.3;
        const t2Radius = 2.3;
        const t2Geo = new THREE.CylinderGeometry(t2Radius, t2Radius, t2Height, 64);
        const t2Mesh = new THREE.Mesh(t2Geo, middleCakeMat);
        t2Mesh.position.y = t1Height + t2Height / 2;
        t2Mesh.castShadow = true;
        t2Mesh.receiveShadow = true;
        this.cakeGroup.add(t2Mesh);

        // Frosting pearls around Tier 2 rim
        this.createFrostingPearls(t2Radius, t1Height + t2Height, 26, pearlMat, this.cakeGroup);

        // Gold ribbon wrap around Tier 2
        const t2RibbonGeo = new THREE.TorusGeometry(t2Radius + 0.02, 0.05, 16, 64);
        const t2Ribbon = new THREE.Mesh(t2RibbonGeo, goldMat);
        t2Ribbon.rotation.x = Math.PI / 2;
        t2Ribbon.position.y = t1Height + t2Height / 2;
        this.cakeGroup.add(t2Ribbon);

        // TIER 3 (Top Tier - Whole cake minus a slice)
        const t3Height = 1.1;
        const t3Radius = 1.4;
        const topY = t1Height + t2Height;

        // We create top tier with a sliceable segment
        // Main cake body: 300 degrees arc
        const sliceAngle = Math.PI * 0.28; // ~50 degrees slice
        const mainArcGeo = new THREE.CylinderGeometry(t3Radius, t3Radius, t3Height, 48, 1, false, sliceAngle, Math.PI * 2 - sliceAngle);
        const mainArcMesh = new THREE.Mesh(mainArcGeo, topCakeMat);
        mainArcMesh.position.y = topY + t3Height / 2;
        mainArcMesh.castShadow = true;
        mainArcMesh.receiveShadow = true;
        this.cakeGroup.add(mainArcMesh);

        // The separate slice (can be animated out during cake cut!)
        const sliceGeo = new THREE.CylinderGeometry(t3Radius, t3Radius, t3Height, 16, 1, false, 0, sliceAngle);
        this.cakeSlice = new THREE.Mesh(sliceGeo, topCakeMat);
        this.cakeSlice.position.y = topY + t3Height / 2;
        this.cakeSlice.castShadow = true;
        this.cakeGroup.add(this.cakeSlice);

        // Frosting pearls on top tier
        this.createFrostingPearls(t3Radius, topY + t3Height, 20, goldMat, this.cakeGroup);

        // Golden Badge on Tier 1 facing front: "ABUZAR - 2 NOV"
        this.createCakeNameBadge(t1Radius + 0.08, t1Height * 0.55);

        // CANDLES on Top Tier
        const candleCount = 5;
        const candleRadiusOrbit = 0.75;
        const candleMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.3
        });
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xff3366,
            metalness: 0.2,
            roughness: 0.4
        });

        for (let i = 0; i < candleCount; i++) {
            const angle = (i / candleCount) * Math.PI * 2;
            const cx = Math.cos(angle) * candleRadiusOrbit;
            const cz = Math.sin(angle) * candleRadiusOrbit;
            const candleBaseY = topY + t3Height;

            const candleGroup = new THREE.Group();
            candleGroup.position.set(cx, candleBaseY, cz);

            // Candle wax body
            const waxHeight = 0.9;
            const waxMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, waxHeight, 16),
                i % 2 === 0 ? candleMat : stripeMat
            );
            waxMesh.position.y = waxHeight / 2;
            waxMesh.castShadow = true;
            candleGroup.add(waxMesh);

            // Wick
            const wickMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8),
                new THREE.MeshBasicMaterial({ color: 0x111111 })
            );
            wickMesh.position.y = waxHeight + 0.075;
            candleGroup.add(wickMesh);

            // Flame mesh (teardrop)
            const flameGeo = new THREE.ConeGeometry(0.07, 0.24, 12);
            flameGeo.translate(0, 0.12, 0);
            const flameMat = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.95
            });
            const flameMesh = new THREE.Mesh(flameGeo, flameMat);
            flameMesh.position.y = waxHeight + 0.12;
            candleGroup.add(flameMesh);

            // Inner blue flame core
            const flameCoreGeo = new THREE.ConeGeometry(0.035, 0.12, 10);
            flameCoreGeo.translate(0, 0.06, 0);
            const flameCore = new THREE.Mesh(
                flameCoreGeo,
                new THREE.MeshBasicMaterial({ color: 0x66ccff })
            );
            flameCore.position.y = waxHeight + 0.12;
            candleGroup.add(flameCore);

            // Dynamic flickering Point Light
            const flameLight = new THREE.PointLight(0xff9900, 1.2, 5);
            flameLight.position.y = waxHeight + 0.25;
            candleGroup.add(flameLight);

            this.cakeGroup.add(candleGroup);

            this.candles.push({
                group: candleGroup,
                flame: flameMesh,
                core: flameCore,
                light: flameLight,
                baseY: flameMesh.position.y,
                seed: Math.random() * 10
            });
        }

        this.scene.add(this.cakeGroup);
    }

    createFrostingPearls(radius, y, count, material, parent) {
        const sphereGeo = new THREE.SphereGeometry(0.09, 12, 12);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const px = Math.cos(angle) * radius;
            const pz = Math.sin(angle) * radius;
            const pearl = new THREE.Mesh(sphereGeo, material);
            pearl.position.set(px, y, pz);
            pearl.castShadow = true;
            parent.add(pearl);
        }
    }

    createCakeNameBadge(radius, y) {
        // Create embossed plate facing +Z
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 190;
        const ctx = canvas.getContext('2d');

        // Luxurious dark gold plaque background
        const grad = ctx.createLinearGradient(0, 0, 512, 190);
        grad.addColorStop(0, '#1c1328');
        grad.addColorStop(0.5, '#3b2559');
        grad.addColorStop(1, '#1c1328');
        ctx.fillStyle = grad;
        ctx.roundRect ? ctx.roundRect(10, 10, 492, 170, 24) : ctx.rect(10, 10, 492, 170);
        ctx.fill();

        // Gold border
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();

        // Inner glowing border
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.strokeRect(20, 20, 472, 150);

        // Text
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 50px Outfit, Arial, sans-serif';
        ctx.fillText('⭐ ABUZAR ⭐', 256, 85);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Outfit, Arial, sans-serif';
        ctx.fillText('2 NOVEMBER 🎂', 256, 140);

        const badgeTex = new THREE.CanvasTexture(canvas);
        const badgeMat = new THREE.MeshStandardMaterial({
            map: badgeTex,
            roughness: 0.3,
            metalness: 0.6,
            transparent: true
        });

        const badgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.75), badgeMat);
        badgeMesh.position.set(0, y, radius);
        this.cakeGroup.add(badgeMesh);
    }

    buildKnife() {
        const knifeGroup = new THREE.Group();

        // Blade (Sleek stainless steel with beveled edge)
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(2.2, 0.1);
        bladeShape.lineTo(2.5, 0.4);
        bladeShape.lineTo(0, 0.45);
        bladeShape.closePath();

        const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.95,
            roughness: 0.1
        });
        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
        bladeMesh.castShadow = true;
        knifeGroup.add(bladeMesh);

        // Handle (Rosewood / Gold ring)
        const handleGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x4a1e09,
            metalness: 0.2,
            roughness: 0.5
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-0.6, 0.22, 0.02);
        handle.castShadow = true;
        knifeGroup.add(handle);

        // Bolster (Gold spacer)
        const bolsterGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.15, 16);
        const bolsterMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2
        });
        const bolster = new THREE.Mesh(bolsterGeo, bolsterMat);
        bolster.rotation.z = Math.PI / 2;
        bolster.position.set(0.02, 0.22, 0.02);
        knifeGroup.add(bolster);

        knifeGroup.position.set(0, 6.5, 1.8);
        knifeGroup.rotation.z = -Math.PI * 0.15;
        knifeGroup.rotation.x = Math.PI * 0.1;
        knifeGroup.visible = false; // Appears during cutting ceremony!

        this.knife = knifeGroup;
        this.scene.add(knifeGroup);
    }

    buildGiftBox() {
        this.giftGroup = new THREE.Group();
        this.giftGroup.position.set(3.8, 0.5, 2.0);

        const boxSize = 1.6;
        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x00b894, // Emerald Green
            metalness: 0.4,
            roughness: 0.3
        });
        const ribbonMat = new THREE.MeshStandardMaterial({
            color: 0xffd700, // Metallic Gold
            metalness: 0.85,
            roughness: 0.25
        });

        // Box Base
        const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        this.giftGroup.add(boxMesh);

        // Box Ribbon horizontal & vertical bands
        const band1 = new THREE.Mesh(new THREE.BoxGeometry(boxSize + 0.02, boxSize + 0.01, 0.25), ribbonMat);
        const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, boxSize + 0.01, boxSize + 0.02), ribbonMat);
        this.giftGroup.add(band1);
        this.giftGroup.add(band2);

        // Box Lid
        this.giftLid = new THREE.Group();
        this.giftLid.position.set(0, boxSize / 2, 0);

        const lidGeo = new THREE.BoxGeometry(boxSize + 0.1, 0.3, boxSize + 0.1);
        const lidMesh = new THREE.Mesh(lidGeo, boxMat);
        lidMesh.position.y = 0.15;
        lidMesh.castShadow = true;
        this.giftLid.add(lidMesh);

        const lidBand1 = new THREE.Mesh(new THREE.BoxGeometry(boxSize + 0.12, 0.32, 0.26), ribbonMat);
        lidBand1.position.y = 0.15;
        const lidBand2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, boxSize + 0.12), ribbonMat);
        lidBand2.position.y = 0.15;
        this.giftLid.add(lidBand1);
        this.giftLid.add(lidBand2);

        // Ribbon Bow on Top (Dual Torus loops)
        const bow1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 16, 32), ribbonMat);
        bow1.rotation.y = Math.PI / 4;
        bow1.rotation.x = Math.PI / 3;
        bow1.position.y = 0.45;
        this.giftLid.add(bow1);

        const bow2 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 16, 32), ribbonMat);
        bow2.rotation.y = -Math.PI / 4;
        bow2.rotation.x = Math.PI / 3;
        bow2.position.y = 0.45;
        this.giftLid.add(bow2);

        this.giftGroup.add(this.giftLid);

        // Floating label indicator above gift box
        const giftCanvas = document.createElement('canvas');
        giftCanvas.width = 256;
        giftCanvas.height = 100;
        const gCtx = giftCanvas.getContext('2d');
        gCtx.fillStyle = '#ffd700';
        gCtx.font = 'bold 36px Outfit, Arial, sans-serif';
        gCtx.textAlign = 'center';
        gCtx.fillText('🎁 TAP ME!', 128, 60);

        const giftLabelTex = new THREE.CanvasTexture(giftCanvas);
        const giftLabelMat = new THREE.SpriteMaterial({ map: giftLabelTex, transparent: true });
        const giftLabel = new THREE.Sprite(giftLabelMat);
        giftLabel.position.set(0, 1.8, 0);
        giftLabel.scale.set(1.6, 0.65, 1);
        this.giftGroup.add(giftLabel);
        this.giftLabelSprite = giftLabel;

        // Custom user data for raycasting
        this.giftGroup.userData = { type: 'gift', interactive: true };
        boxMesh.userData = { type: 'gift', interactive: true };
        lidMesh.userData = { type: 'gift', interactive: true };

        this.scene.add(this.giftGroup);
    }

    buildBalloons() {
        const balloonColors = [
            0xff007f, // Neon Hot Pink
            0x00d4ff, // Royal Cyan
            0xffaa00, // Metallic Gold
            0x9d00ff, // Electric Purple
            0x00ff88, // Emerald Neon
            0xff3366, // Rose Red
            0x3366ff  // Deep Azure
        ];

        const balloonCount = 14;
        const balloonGeo = this.createBalloonGeometry();

        for (let i = 0; i < balloonCount; i++) {
            const color = balloonColors[i % balloonColors.length];
            const balloonMat = new THREE.MeshPhysicalMaterial({
                color: color,
                roughness: 0.15,
                metalness: 0.4,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                transmission: 0.05,
                reflectivity: 0.9
            });

            const balloonMesh = new THREE.Mesh(balloonGeo, balloonMat);
            balloonMesh.castShadow = true;

            // Knot
            const knotGeo = new THREE.ConeGeometry(0.12, 0.18, 12);
            knotGeo.translate(0, -1.05, 0);
            const knotMesh = new THREE.Mesh(knotGeo, balloonMat);
            balloonMesh.add(knotMesh);

            // Wavy dangling string
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, -1.15, 0),
                new THREE.Vector3(0.1, -1.8, 0.05),
                new THREE.Vector3(-0.08, -2.6, -0.05),
                new THREE.Vector3(0.05, -3.4, 0.02)
            ]);
            const stringGeo = new THREE.TubeGeometry(curve, 20, 0.015, 6, false);
            const stringMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
            const stringMesh = new THREE.Mesh(stringGeo, stringMat);
            balloonMesh.add(stringMesh);

            // Arrange in a scenic ring around cake
            const angle = (i / balloonCount) * Math.PI * 2 + (Math.random() * 0.3);
            const distance = 4.8 + Math.random() * 3.5;
            const baseY = 3.5 + Math.random() * 5.0;

            const bx = Math.cos(angle) * distance;
            const bz = Math.sin(angle) * distance;

            balloonMesh.position.set(bx, baseY, bz);

            const scale = 0.9 + Math.random() * 0.35;
            balloonMesh.scale.set(scale, scale * 1.15, scale);

            // Metadata for floating physics & raycast
            balloonMesh.userData = {
                type: 'balloon',
                id: i,
                interactive: true,
                color: color,
                basePos: new THREE.Vector3(bx, baseY, bz),
                speedY: 0.8 + Math.random() * 0.7,
                swaySpeed: 0.5 + Math.random() * 0.6,
                phase: Math.random() * Math.PI * 2,
                ampY: 0.4 + Math.random() * 0.4,
                ampX: 0.25 + Math.random() * 0.25,
                popped: false
            };

            this.scene.add(balloonMesh);
            this.balloons.push(balloonMesh);
        }
    }

    createBalloonGeometry() {
        // Teardrop profile for realistic balloon
        const points = [];
        const segments = 24;
        for (let i = 0; i <= segments; i++) {
            const v = i / segments;
            const angle = v * Math.PI;
            // Elongate top, taper bottom
            const x = Math.sin(angle) * (0.8 + 0.35 * Math.cos(angle * 0.5));
            const y = -Math.cos(angle) * 1.1;
            points.push(new THREE.Vector2(Math.max(0.001, x), y));
        }
        return new THREE.LatheGeometry(points, 32);
    }

    // Raycast Interaction (Hover & Click)
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const interactables = [...this.balloons.filter(b => !b.userData.popped), this.giftGroup];
        const intersects = this.raycaster.intersectObjects(interactables, true);

        if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit.parent && !hit.userData.interactive && hit.parent !== this.scene) {
                hit = hit.parent;
            }

            if (hit.userData.interactive) {
                this.container.style.cursor = 'pointer';
                if (this.hoveredObject !== hit) {
                    this.hoveredObject = hit;
                }
                return;
            }
        }

        this.container.style.cursor = 'default';
        this.hoveredObject = null;
    }

    onClick(event) {
        if (!this.hoveredObject) return;

        if (this.hoveredObject.userData.type === 'balloon') {
            this.popBalloon(this.hoveredObject);
        } else if (this.hoveredObject.userData.type === 'gift') {
            this.openGiftBox();
        }
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const interactables = [...this.balloons.filter(b => !b.userData.popped), this.giftGroup];
            const intersects = this.raycaster.intersectObjects(interactables, true);

            if (intersects.length > 0) {
                let hit = intersects[0].object;
                while (hit.parent && !hit.userData.interactive && hit.parent !== this.scene) {
                    hit = hit.parent;
                }
                if (hit.userData.interactive) {
                    if (hit.userData.type === 'balloon') {
                        this.popBalloon(hit);
                    } else if (hit.userData.type === 'gift') {
                        this.openGiftBox();
                    }
                }
            }
        }
    }

    // Balloon Pop Mechanic
    popBalloon(balloonMesh) {
        if (balloonMesh.userData.popped) return;
        balloonMesh.userData.popped = true;
        balloonMesh.visible = false;
        this.balloonPopCount++;

        // Trigger Audio
        if (window.birthdayAudio) {
            window.birthdayAudio.playPop();
        }

        // Spawn 3D burst fragments
        this.createPopFragments(balloonMesh.position, balloonMesh.userData.color);

        // Update UI pop counter event
        window.dispatchEvent(new CustomEvent('balloonPopped', { detail: { count: this.balloonPopCount } }));

        // 2D confetti burst at screen coordinates
        if (window.confetti) {
            const screenPos = balloonMesh.position.clone().project(this.camera);
            const x = (screenPos.x * 0.5 + 0.5);
            const y = (-(screenPos.y * 0.5) + 0.5);
            window.confetti({
                particleCount: 25,
                spread: 60,
                origin: { x: Math.max(0.1, Math.min(0.9, x)), y: Math.max(0.1, Math.min(0.9, y)) },
                colors: ['#ff007f', '#00d4ff', '#ffd700', '#00ff88']
            });
        }

        // Respawn balloon after 5 seconds from bottom
        setTimeout(() => {
            balloonMesh.position.copy(balloonMesh.userData.basePos);
            balloonMesh.position.y = -2; // Start below pedestal
            balloonMesh.visible = true;
            balloonMesh.userData.popped = false;
        }, 5000);
    }

    createPopFragments(position, colorHex) {
        const count = 24;
        const fragGeo = new THREE.PlaneGeometry(0.12, 0.12);
        const fragMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(fragGeo, fragMat);
            mesh.position.copy(position);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 2.5 + Math.random() * 4.0;
            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.cos(phi) * speed + 1.5,
                Math.sin(phi) * Math.sin(theta) * speed
            );

            this.scene.add(mesh);
            this.popFragments.push({
                mesh: mesh,
                velocity: velocity,
                rotSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
                life: 1.0
            });
        }
    }

    // Candle Blowing Mechanic
    blowCandles() {
        if (!this.isCandlesLit) return;
        this.isCandlesLit = false;

        if (window.birthdayAudio) {
            window.birthdayAudio.playCandleBlow();
        }

        this.candles.forEach((c) => {
            c.flame.visible = false;
            c.core.visible = false;
            c.light.intensity = 0;

            // Spawn smoke particles
            this.createSmokeTrail(c.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)));
        });

        // Trigger confetti celebration!
        if (window.confetti) {
            window.confetti({
                particleCount: 120,
                spread: 100,
                origin: { y: 0.6 }
            });
        }

        window.dispatchEvent(new CustomEvent('candlesBlown'));
    }

    relightCandles() {
        this.isCandlesLit = true;
        this.candles.forEach((c) => {
            c.flame.visible = true;
            c.core.visible = true;
            c.light.intensity = 1.2;
        });
        window.dispatchEvent(new CustomEvent('candlesRelit'));
    }

    createSmokeTrail(position) {
        const count = 15;
        const geo = new THREE.SphereGeometry(0.04, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.x += (Math.random() - 0.5) * 0.1;
            mesh.position.z += (Math.random() - 0.5) * 0.1;

            this.scene.add(mesh);
            this.smokeParticles.push({
                mesh: mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.4,
                    0.8 + Math.random() * 0.8,
                    (Math.random() - 0.5) * 0.4
                ),
                life: 1.2 + Math.random() * 0.6,
                maxLife: 1.8
            });
        }
    }

    // Cake Cutting Animation
    cutCake(callback) {
        if (this.isCakeCut) return;
        this.isCakeCut = true;

        if (window.birthdayAudio) {
            window.birthdayAudio.playCakeSlice();
        }

        // Show Knife
        this.knife.visible = true;
        this.knife.position.set(1.0, 5.5, 0.8);
        this.knife.rotation.z = -Math.PI * 0.2;

        let startTime = performance.now();
        const duration = 1200; // ms

        const animateCut = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);

            // Knife slices downwards into the cake
            if (progress < 0.6) {
                const p = progress / 0.6;
                this.knife.position.y = 5.5 - p * 2.8;
                this.knife.rotation.z = -Math.PI * 0.2 + p * 0.3;
            } else {
                // Knife pulls back and slice shifts out
                const p = (progress - 0.6) / 0.4;
                this.knife.position.y = 2.7 + p * 1.5;
                this.knife.position.x = 1.0 + p * 1.2;
                this.knife.rotation.z = 0.1 - p * 0.4;

                // Move cake slice out
                if (this.cakeSlice) {
                    this.cakeSlice.position.x = p * 0.6;
                    this.cakeSlice.position.z = p * 0.6;
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animateCut);
            } else {
                this.knife.visible = false;
                // Launch massive celebration fireworks
                this.launchCelebrationFireworks();
                if (callback) callback();
                window.dispatchEvent(new CustomEvent('cakeCutComplete'));
            }
        };

        requestAnimationFrame(animateCut);
    }

    // Open Gift Box
    openGiftBox() {
        if (this.isGiftOpened) {
            // Already opened, just reopen modal
            window.dispatchEvent(new CustomEvent('openGiftModal'));
            return;
        }

        this.isGiftOpened = true;

        if (window.birthdayAudio) {
            window.birthdayAudio.playGiftOpen();
        }

        if (this.giftLabelSprite) {
            this.giftLabelSprite.visible = false;
        }

        // Animate Lid opening and flying up
        let startTime = performance.now();
        const duration = 900;
        const startLidY = this.giftLid.position.y;

        const animateLid = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const ease = 1 - Math.pow(1 - progress, 3);

            this.giftLid.position.y = startLidY + ease * 2.2;
            this.giftLid.rotation.z = ease * 0.7;
            this.giftLid.rotation.x = ease * 0.4;

            if (progress < 1) {
                requestAnimationFrame(animateLid);
            } else {
                // Add golden light pillar shooting from box
                const beamGeo = new THREE.CylinderGeometry(0.5, 0.2, 8, 16);
                beamGeo.translate(0, 4, 0);
                const beamMat = new THREE.MeshBasicMaterial({
                    color: 0xffd700,
                    transparent: true,
                    opacity: 0.45,
                    blending: THREE.AdditiveBlending
                });
                const beam = new THREE.Mesh(beamGeo, beamMat);
                this.giftGroup.add(beam);

                // Golden burst
                this.createPopFragments(this.giftGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffd700);

                window.dispatchEvent(new CustomEvent('openGiftModal'));
            }
        };

        requestAnimationFrame(animateLid);
    }

    // 3D Firework Rockets
    launchRocket(x, z, colorHex) {
        if (window.birthdayAudio) {
            window.birthdayAudio.playFireworkLaunch();
        }

        const rocketGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const rocketMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const rocket = new THREE.Mesh(rocketGeo, rocketMat);
        rocket.position.set(x, -0.5, z);
        this.scene.add(rocket);

        const targetY = 9 + Math.random() * 5;
        const duration = 650;
        const startTime = performance.now();

        const animateRocket = (now) => {
            const elapsed = now - startTime;
            const p = Math.min(1, elapsed / duration);

            rocket.position.y = -0.5 + p * (targetY + 0.5);

            if (p < 1) {
                requestAnimationFrame(animateRocket);
            } else {
                this.scene.remove(rocket);
                this.explodeFirework(rocket.position.x, rocket.position.y, rocket.position.z, colorHex);
            }
        };

        requestAnimationFrame(animateRocket);
    }

    explodeFirework(x, y, z, colorHex) {
        if (window.birthdayAudio) {
            window.birthdayAudio.playFireworkBurst();
        }

        const particleCount = 75;
        const geo = new THREE.SphereGeometry(0.06, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const speed = 2.0 + Math.random() * 4.5;

            const velocity = new THREE.Vector3(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
            );

            this.scene.add(mesh);
            this.fireworks.push({
                mesh: mesh,
                velocity: velocity,
                gravity: -3.5,
                life: 1.0,
                fadeRate: 0.8 + Math.random() * 0.4
            });
        }
    }

    launchCelebrationFireworks() {
        const colors = [0xff0055, 0x00ffcc, 0xffd700, 0x9d00ff, 0x00ff88, 0xff6600];
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const rx = (Math.random() - 0.5) * 14;
                const rz = (Math.random() - 0.5) * 12;
                const col = colors[Math.floor(Math.random() * colors.length)];
                this.launchRocket(rx, rz, col);
            }, i * 350);
        }
    }

    // Party Mode Toggle
    togglePartyMode() {
        this.isPartyMode = !this.isPartyMode;
        if (window.birthdayAudio) {
            window.birthdayAudio.setPartyMode(this.isPartyMode);
        }

        this.controls.autoRotateSpeed = this.isPartyMode ? 2.5 : 0.6;

        this.partySpotlights.forEach(spot => {
            spot.intensity = this.isPartyMode ? 3.5 : 0;
        });

        if (this.isPartyMode) {
            this.launchCelebrationFireworks();
        }

        return this.isPartyMode;
    }

    // Camera Views
    setCameraView(viewName) {
        let targetPos = new THREE.Vector3();
        let targetLook = new THREE.Vector3(0, 2.2, 0);

        if (viewName === 'cake') {
            targetPos.set(0, 5.2, 6.2);
            targetLook.set(0, 3.2, 0);
        } else if (viewName === 'gift') {
            targetPos.set(4.5, 3.2, 5.5);
            targetLook.set(3.8, 1.2, 2.0);
        } else if (viewName === 'balloons') {
            targetPos.set(0, 11, 14);
            targetLook.set(0, 5, 0);
        } else {
            // Overview default
            targetPos.set(0, 7.5, 17);
            targetLook.set(0, 2.2, 0);
        }

        // Smooth tween
        const startPos = this.camera.position.clone();
        const startLook = this.controls.target.clone();
        const startTime = performance.now();
        const dur = 1000;

        const animateCam = (now) => {
            const elapsed = now - startTime;
            const p = Math.min(1, elapsed / dur);
            const ease = 0.5 - Math.cos(p * Math.PI) / 2;

            this.camera.position.lerpVectors(startPos, targetPos, ease);
            this.controls.target.lerpVectors(startLook, targetLook, ease);

            if (p < 1) {
                requestAnimationFrame(animateCam);
            }
        };

        requestAnimationFrame(animateCam);
    }

    // Main Animation Loop
    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // 1. Update OrbitControls
        this.controls.update();

        // 2. Animate Candle Flames (Flicker + shape bob)
        if (this.isCandlesLit) {
            this.candles.forEach((c) => {
                const flicker = Math.sin(time * 18 + c.seed) * 0.12 + Math.cos(time * 26 + c.seed) * 0.08;
                c.flame.scale.set(1 + flicker * 0.5, 1 + flicker, 1 + flicker * 0.5);
                c.flame.position.y = c.baseY + flicker * 0.03;
                c.light.intensity = 1.2 + flicker * 0.4;
            });
        }

        // 3. Animate Balloons (Float sway)
        this.balloons.forEach((b) => {
            if (!b.userData.popped) {
                const u = b.userData;
                // Bobbing up and down
                b.position.y = u.basePos.y + Math.sin(time * u.speedY + u.phase) * u.ampY;
                // Gentle tilt / wobble
                b.position.x = u.basePos.x + Math.sin(time * u.swaySpeed + u.phase) * u.ampX;
                b.position.z = u.basePos.z + Math.cos(time * u.swaySpeed * 0.8 + u.phase) * u.ampX;
                b.rotation.z = Math.sin(time * u.swaySpeed + u.phase) * 0.08;
                b.rotation.x = Math.cos(time * u.swaySpeed + u.phase) * 0.06;
            }
        });

        // 4. Party Mode Lights Orbit
        if (this.isPartyMode) {
            this.partySpotlights.forEach((spot, i) => {
                const speed = 1.8;
                const angle = time * speed + (i / 4) * Math.PI * 2;
                spot.position.x = Math.cos(angle) * 8.5;
                spot.position.z = Math.sin(angle) * 8.5;
                spot.position.y = 8 + Math.sin(time * 3 + i) * 2;
            });

            // Random party fireworks every ~2.5s
            if (Math.random() < 0.02) {
                const rx = (Math.random() - 0.5) * 12;
                const rz = (Math.random() - 0.5) * 12;
                const colors = [0xff0055, 0x00ffcc, 0xffd700, 0x9d00ff];
                this.launchRocket(rx, rz, colors[Math.floor(Math.random() * colors.length)]);
            }
        }

        // 5. Starfield gentle drift
        if (this.starField) {
            this.starField.rotation.y = time * 0.02;
        }

        // 6. Update Pop Fragments
        for (let i = this.popFragments.length - 1; i >= 0; i--) {
            const frag = this.popFragments[i];
            frag.mesh.position.addScaledVector(frag.velocity, delta);
            frag.velocity.y -= 9.8 * delta; // Gravity
            frag.mesh.rotation.x += frag.rotSpeed.x * delta;
            frag.mesh.rotation.y += frag.rotSpeed.y * delta;
            frag.life -= delta * 1.5;

            if (frag.life <= 0) {
                this.scene.remove(frag.mesh);
                this.popFragments.splice(i, 1);
            }
        }

        // 7. Update Smoke Particles
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const smoke = this.smokeParticles[i];
            smoke.mesh.position.addScaledVector(smoke.velocity, delta);
            smoke.life -= delta;
            const p = smoke.life / smoke.maxLife;
            smoke.mesh.scale.setScalar(1 + (1 - p) * 2.5);
            smoke.mesh.material.opacity = p * 0.5;

            if (smoke.life <= 0) {
                this.scene.remove(smoke.mesh);
                this.smokeParticles.splice(i, 1);
            }
        }

        // 8. Update 3D Fireworks Particles
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];
            fw.mesh.position.addScaledVector(fw.velocity, delta);
            fw.velocity.y += fw.gravity * delta;
            fw.velocity.multiplyScalar(0.98); // Air drag
            fw.life -= delta * fw.fadeRate;
            fw.mesh.material.opacity = Math.max(0, fw.life);

            if (fw.life <= 0) {
                this.scene.remove(fw.mesh);
                this.fireworks.splice(i, 1);
            }
        }

        // 9. Gift Label bobbing
        if (this.giftLabelSprite && this.giftLabelSprite.visible) {
            this.giftLabelSprite.position.y = 1.8 + Math.sin(time * 3) * 0.12;
        }

        // 10. Render
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Global reference
window.BirthdayScene = BirthdayScene;

