/*
Amithi Pathak 
Intro CG Final Project
5/5/2025
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

//fixing esc then start too early bug
let pointerLockCooldown = false;
let lastUnlockTime = 0;
const COOLDOWN_DURATION = 300; // 3 seconds

const triggerZones = [
    {
      position: new THREE.Vector3(-.10, -.11, -6.24), 
      dimensions: new THREE.Vector3(4, 6, 0.2),
      rotation: new THREE.Euler(0, Math.PI, 0),
      destination: '/space-shooter-game.html'
    },
    {
        position: new THREE.Vector3(-.10, -.11, 6.24), 
        dimensions: new THREE.Vector3(4, 6, 0.2),
        rotation: new THREE.Euler(0, 0, 0),
        destination: '/candy-car-game.html'
    },
    {
        position: new THREE.Vector3(7.0, -.11, 0.02), 
        dimensions: new THREE.Vector3(4, 6, 0.2),
        rotation: new THREE.Euler(0, Math.PI/2, 0),
        destination: '/jump-game.html'
    },
    
];

document.addEventListener('pointerlockerror', () => {
    console.warn('Pointer lock request was denied.');
});

const style = document.createElement('style');
style.textContent = `
    #cooldownMessage {
        animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === document.body;
    console.log('Pointer lock state changed. Locked:', locked);
    
    if (!locked) {
        lastUnlockTime = Date.now();
        pointerLockCooldown = true;

        startButton.disabled = false;
        startButton.innerText = "START";
        
        // cooldown message if instruction popup is visible
        if (instructionPopup.style.display === 'flex') {
            const cooldownMessage = document.createElement('div');
            cooldownMessage.id = 'cooldownMessage';
            cooldownMessage.style.color = '#ff9e7d';
            cooldownMessage.style.marginTop = '15px';
            cooldownMessage.style.fontSize = '14px';
            document.getElementById('startButton').insertAdjacentElement('afterend', cooldownMessage);
            
            // epdate cooldown message every second
            const updateCooldown = () => {
                const remaining = Math.ceil((COOLDOWN_DURATION - (Date.now() - lastUnlockTime)) / 1000);
                if (remaining > 0) {
                    cooldownMessage.textContent = `Please wait ${remaining} seconds before starting`;
                    setTimeout(updateCooldown, 1000);
                } else {
                    cooldownMessage.remove();
                    pointerLockCooldown = false;
                }
            };
            updateCooldown();
        }
    }
});



let scorePopupTrigger = {
    position: new THREE.Vector3(0, 0, 0),
    radius: 1,
    triggered: false
};

// scene, camera, renderer
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
    //sky background
    textureLoader.load(
        '1666.jpg',
        function(texture) {
            scene.background = texture;
        },
        undefined,
        function(error) {
            console.error('Error loading background image', error);
            scene.background = new THREE.Color('#ffebf3'); //fallback
        }
    );
    

// first person pov
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-12.2, -0.29, 0.02); // start position= 1.7 = avg eye level

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);

// forbidden area behind starting position
const forbiddenBoundary = {
    position: new THREE.Vector3(-12.90, -0.16, -0.50),
    dimensions: new THREE.Vector3(10, 10, 10)
};

function checkForbiddenBoundary(nextPosition) {
    return (
      nextPosition.x <= forbiddenBoundary.position.x &&
      nextPosition.y <= forbiddenBoundary.position.y + forbiddenBoundary.dimensions.y &&
      nextPosition.z <= forbiddenBoundary.position.z + forbiddenBoundary.dimensions.z / 2 &&
      nextPosition.z >= forbiddenBoundary.position.z - forbiddenBoundary.dimensions.z / 2
    );
}

//instructions accessible when pressing esc and at beginning
const instructionPopup = document.createElement('div');
instructionPopup.style.position = 'fixed';
instructionPopup.style.top = '0';
instructionPopup.style.left = '0';
instructionPopup.style.width = '100%';
instructionPopup.style.height = '100%';
instructionPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
instructionPopup.style.display = 'flex';
instructionPopup.style.flexDirection = 'column';
instructionPopup.style.justifyContent = 'center';
instructionPopup.style.alignItems = 'center';
instructionPopup.style.zIndex = '1000';
instructionPopup.style.fontFamily = '"Roboto Mono", monospace';
instructionPopup.style.color = '#ffffff';

instructionPopup.innerHTML = `
    <div style="background-color: rgba(95, 1, 1, 0.9); padding: 30px; border-radius: 10px; width: 520px; max-width: 95%; text-align: center; border: 2px solid #db876b;">
        <h1 style="font-size: 28px; margin-bottom: 20px; color: #ffffff;">GAME CONTROL STATION</h1>
        <div style="font-size: 18px; margin-bottom: 20px; line-height: 1.6;">
            <p>Tunnels lead to games:</p>
            <ul style="text-align: left; margin: 10px 0 10px 30px; padding-left: 0;">
                <li>SPACE SHOOTER (Left)</li>
                <li>CANDY CHASE (Right)</li>
                <li>TUMBLE JUMP (Front)</li>
            </ul>
        </div>
        <div style="font-size: 16px; margin-bottom: 25px; background-color: rgba(219, 135, 107, 0.3); padding: 15px; border-radius: 5px;">
            <p><strong>Controls:</strong></p>
            <p>WASD: Move | SPACE: Jump</p>
            <p>Mouse: Look | ESC: Exit</p>
        </div>
        <button id="startButton" style="background-color: #db876b; color: white; border: none; padding: 12px 32px; font-size: 18px; border-radius: 6px; cursor: pointer; transition: all 0.3s;">START</button>
    </div>
`;

document.body.appendChild(instructionPopup);
window.addEventListener('resize', () => {});

// button hovers
const startButton = document.getElementById('startButton');
startButton.addEventListener('mouseenter', () => {
    startButton.style.backgroundColor = '#ff9e7d';
    startButton.style.transform = 'scale(1.05)';
});
startButton.addEventListener('mouseleave', () => {
    startButton.style.backgroundColor = '#db876b';
    startButton.style.transform = 'scale(1)';
});


startButton.addEventListener('click', () => {
    // checking if cooldown is still active by comparing current time with last unlock time
    const currentTime = Date.now();
    const timeSinceUnlock = currentTime - lastUnlockTime;
    
    if (pointerLockCooldown && timeSinceUnlock < COOLDOWN_DURATION) {
        console.log(`Start button is on cooldown, please wait ${Math.ceil((COOLDOWN_DURATION - timeSinceUnlock)/1000)} seconds`);
        
        // countdown feedback
        startButton.style.backgroundColor = '#ff6b4d';
        startButton.innerText = `Wait ${Math.ceil((COOLDOWN_DURATION - timeSinceUnlock)/1000)}s`;
        setTimeout(() => {
            startButton.style.backgroundColor = '#db876b';
            startButton.innerText = "START";
        }, 500);
        
        return;
    }

    pointerLockCooldown = false;
    startButton.disabled = true;
    startButton.innerText = "Starting...";
    instructionPopup.style.display = 'none';

    try {
        controls.lock();
    } catch (e) {
        console.warn("Pointer lock error:", e);
        instructionPopup.style.display = 'flex';
        startButton.disabled = false;
        startButton.innerText = "START";
    }
});


// pointer lock events updated for popup
controls.addEventListener('lock', function() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
});

controls.addEventListener('unlock', function () {
    lastUnlockTime = Date.now();
    pointerLockCooldown = true;

    const scorePopup = document.getElementById('scorePopup');

    startButton.disabled = false;
    startButton.innerText = "START";

    if ((!scorePopup || scorePopup.style.display === 'none') && 
        !scorePopupTrigger.triggered) {
        
        instructionPopup.style.display = 'flex';

        moveForward = false;
        moveBackward = false;
        moveLeft = false;
        moveRight = false;

        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);

        // COOLDOWN MESSAGE
        let cooldownMessage = document.getElementById('cooldownMessage');
        if (!cooldownMessage) {
            cooldownMessage = document.createElement('div');
            cooldownMessage.id = 'cooldownMessage';
            cooldownMessage.style.color = '#ff9e7d';
            cooldownMessage.style.marginTop = '15px';
            cooldownMessage.style.fontSize = '14px';
            startButton.insertAdjacentElement('afterend', cooldownMessage);
        }

        const updateCooldown = () => {
            const remaining = Math.ceil((COOLDOWN_DURATION - (Date.now() - lastUnlockTime)) / 1000);
            if (remaining > 0) {
                cooldownMessage.textContent = `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before starting`;
                setTimeout(updateCooldown, 500);
            } else {
                cooldownMessage.remove();
                pointerLockCooldown = false;
            }
        };
        updateCooldown();
    }
});


// mvement vars
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

// player physics properties
const playerHeight = 0.2;
const playerRadius = 0.1;
const playerSpeed = 3.0;
const jumpHeight = 5.0; 
const gravity = 15.0;

// ground check variables
let groundLevel = 0;
let onGround = false;
let lastGroundY = 0;
const groundCheckOffset = 0.05; // ground detection tolerance

// raycaster for collisions
const raycaster = new THREE.Raycaster();
let collidableMeshes = [];

const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y = jumpHeight;
                canJump = false;

                const distance = camera.position.distanceTo(scorePopupTrigger.position);
                if (distance < scorePopupTrigger.radius && !scorePopupTrigger.triggered) {
                    const scorePopup = document.getElementById('scorePopup');
                    if (scorePopup) {
                        scorePopupTrigger.triggered = true;
                        scorePopup.style.display = 'block';
                        controls.unlock(); // to interact with popup
                    }
                }
            }
            break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

//LOADING SCENE
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

const loader = new GLTFLoader();
loader.load(
    '/trainStation.glb',
    (gltf) => {
        const model = gltf.scene;
        
        // fix material sides and add collision detection
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                // fix missing faces by disabling face culling
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        node.material.forEach(material => {
                            material.side = THREE.DoubleSide;
                            material.needsUpdate = true;
                        });
                    } else {
                        node.material.side = THREE.DoubleSide;
                        node.material.needsUpdate = true;
                    }
                }
                collidableMeshes.push(node);
            }
        });
        
        scene.add(model);
        console.log("Model loaded successfully");
        
        // center model at origin for better navigation start
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        // starting position
        camera.position.set(
            -12.2, 
            0.2,
            0.02
        );
        camera.lookAt(center.x, camera.position.y, center.z);
        controls.update();
        
        // actual ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 150);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00,
            transparent: false,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = box.min.y - 0.01; // slightly below the model to aoid z-fighting
        ground.receiveShadow = true;
        scene.add(ground);
        collidableMeshes.push(ground);
        
        // initial ground level based on model
        groundLevel = box.min.y;
        lastGroundY = groundLevel;
    
        createTriggerZoneVisuals();

        const savedPosition = localStorage.getItem('playerPosition');
        if (savedPosition) {
            const positionData = JSON.parse(savedPosition);
            //const lookDirection = controls.getDirection(new THREE.Vector3()).normalize();
            const returnPosition = getReturnPosition(positionData.portalIndex);
            //const offsetDistance = 1.0;
            
            camera.position.copy(returnPosition);
            camera.lookAt(0, camera.position.y, 0);
            
            // update camera controls with new position
            controls.update();
            
            setTimeout(() => {
                localStorage.removeItem('playerPosition');
            }, 1000);
        }


    },
    (xhr) => {
        console.log(`Loading: ${(xhr.loaded / xhr.total) * 100}% completed`);
    },
    (error) => {
        console.error('An error happened:', error);
    }
);

window.addEventListener('keypress', (e) => {
    if (e.key === 'p') {
      console.log(`Current position: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}`);
    }
});



// lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 15, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
fillLight.position.set(-8, 12, -8);
scene.add(fillLight);

const interiorLight = new THREE.PointLight(0xffeedd, 1.5, 15, 2);
interiorLight.position.set(0, 2, 0); // Adjust position to center of your station
interiorLight.castShadow = true;
scene.add(interiorLight);

const interiorLight2 = new THREE.PointLight(0xffeedd, 1, 10, 2);
interiorLight2.position.set(0, 2, 5); // Slightly offset
scene.add(interiorLight2);

// handling window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ground check function
function checkGround() {
    raycaster.ray.origin.copy(camera.position);
    // check slightly above feet
    raycaster.ray.origin.y -= playerHeight * 0.5;
    raycaster.ray.direction.set(0, -1, 0);
    
    const intersections = raycaster.intersectObjects(collidableMeshes, true);
    
    // sort intersections by distance to get closest ground
    if (intersections.length > 0) { // found ground below player
        const distance = intersections[0].distance;
        const groundY = camera.position.y - distance;
        
        if (distance < playerHeight + groundCheckOffset) { // within detection range of ground
            onGround = true;
            // applying gravity
            if (velocity.y < 0) {
                velocity.y = Math.max(-1, velocity.y * 0.8); // slow the fall approaching ground
            }
            // lerp for smoother ground transitions
            lastGroundY = THREE.MathUtils.lerp(lastGroundY, groundY, 0.2);
            return lastGroundY;
        }
    }
    
    onGround = false;
    // apply gravity
    velocity.y -= gravity * 0.01;
    return null;
}

function getReturnPosition(portalIndex) {
    const portal = triggerZones[portalIndex];
    const offsetDistance = 2.0;
    
    const returnPosition = new THREE.Vector3();
    returnPosition.copy(portal.position);
 
    if (portalIndex === 0) { // space shooter -Z
        returnPosition.z += offsetDistance;
    } else if (portalIndex === 1) { // candy chase +Z
        returnPosition.z -= offsetDistance;
    } else if (portalIndex === 2) { // tumble jump +X
        returnPosition.x -= offsetDistance;
    }
    
    return returnPosition;
}

function checkTriggerZones() {
    const playerPosition = camera.position.clone();
    let i = 0;
    
    for (const zone of triggerZones) {
        const halfWidth = zone.dimensions.x / 2;
        const halfHeight = zone.dimensions.y / 2;
        const halfDepth = zone.dimensions.z / 2;
        
        const planeMatrix = new THREE.Matrix4();
        planeMatrix.makeRotationFromEuler(zone.rotation);
        planeMatrix.setPosition(zone.position);
        
        // player position --> plane local space
        const inverseMatrix = new THREE.Matrix4().copy(planeMatrix).invert();
        const localPosition = playerPosition.clone().applyMatrix4(inverseMatrix);
        
        
        if (
            Math.abs(localPosition.x) <= halfWidth &&
            Math.abs(localPosition.y) <= halfHeight &&
            Math.abs(localPosition.z) <= halfDepth
        ) {
            console.log("Player entered trigger plane");
            storePlayerPosition(i);
            setTimeout(() => {
                window.location.href = zone.destination;
            }, 500);
            return true;
        }
        i++;
    }
    return false;
}

//collision detection true if collides
function checkWallCollision(nextPosition) {
    const directions = [
        new THREE.Vector3(1, 0, 0),   // right
        new THREE.Vector3(-1, 0, 0),  // left
        new THREE.Vector3(0, 0, 1),   // forward
        new THREE.Vector3(0, 0, -1),  // backward
        new THREE.Vector3(0.7, 0, 0.7),  // diagonal forward-right
        new THREE.Vector3(-0.7, 0, 0.7), // diagonal forward-left
        new THREE.Vector3(0.7, 0, -0.7), // diagonal backward-right
        new THREE.Vector3(-0.7, 0, -0.7) // diagonal backward-left
    ];
    
    for (let i = 0; i < directions.length; i++) {
        raycaster.ray.origin.copy(nextPosition);
        raycaster.ray.origin.y += playerHeight * 0.5; // waistish height
        raycaster.ray.direction.copy(directions[i]);
        
        const wallIntersections = raycaster.intersectObjects(collidableMeshes, true);
        if (wallIntersections.length > 0 && wallIntersections[0].distance <= playerRadius + 0.1) {
            return true;
        }
    }
    
    return false;
}

// visuals for the trigger zone
function createTriggerZoneVisuals() {
    triggerZones.forEach((zone, index) => {
        const planeGeometry = new THREE.BoxGeometry(
            zone.dimensions.x, 
            zone.dimensions.y, 
            zone.dimensions.z
        );
        
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xdb876b,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.position.copy(zone.position);
        planeMesh.rotation.copy(zone.rotation);
        
        //scene.add(planeMesh);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 256;
        context.fillStyle = 'rgba(219, 135, 107, 00)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '600 75px "Roboto Mono", monospace';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.shadowColor = 'rgba(255, 255, 255, 0.7)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        let portalText;
        if (index === 0) {
            portalText = "SPACE SHOOTER";
        } else if (index === 1) {
            portalText = "CANDY CHASE";
        } else if (index === 2) {
            portalText = "TUMBLE JUMP";
        }
        
        context.fillText(portalText, canvas.width / 2, canvas.height / 2);
        
        //glow effect
        context.shadowBlur = 15;
        context.shadowColor = '#ffffff';
        context.fillText(portalText, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: true,
            depthWrite: false
        });
        const textGeometry = new THREE.PlaneGeometry(3, 1.5);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        //text orientation
        const textGroup = new THREE.Group();
        textGroup.position.copy(zone.position);
        textGroup.position.y += 2;
        
        if (index === 0) {
            textMesh.position.set(0, 0, 0.2);
        } else if (index === 1) {
            textMesh.position.set(0, 0, -0.2);
            textMesh.rotation.y = Math.PI;
        } else if (index === 2) {
            textMesh.rotation.y = -Math.PI/2;
            textMesh.position.set(-0.2, 0, 0);
        }
        
        textMesh.position.z = 0.2;
        textGroup.add(textMesh);
        scene.add(textGroup);
 
        zone.mesh = planeMesh;
        zone.textMesh = textGroup;
    });
}

function storePlayerPosition(portalIndex) {
    const position = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        portalIndex: portalIndex
    };
    localStorage.setItem('playerPosition', JSON.stringify(position));
}

//for consistent movement speed
const clock = new THREE.Clock();

//position logging
let lastLogTime = 0;
const logInterval = 1000; // log position every 1000ms or 1s

// score popup that appears in the center of the scene
function createScorePopup() {
    const totalSpaceScore = parseInt(localStorage.getItem('totalSpaceScore') || '0', 10);
    const candyCarTotalPoints = parseInt(localStorage.getItem('candyCarTotalPoints') || '0', 10);
    const jumpTotalPoints = parseInt(localStorage.getItem('jumpTotalPoints') || '0', 10);

    const scorePopup = document.createElement('div');
    scorePopup.id = 'scorePopup';
    scorePopup.style.position = 'absolute';
    scorePopup.style.top = '50%';
    scorePopup.style.left = '50%';
    scorePopup.style.transform = 'translate(-50%, -50%)';
    scorePopup.style.backgroundColor = 'rgba(239, 226, 198, 0.9)';
    scorePopup.style.color = '#ffffff';
    scorePopup.style.padding = '25px 35px';
    scorePopup.style.borderRadius = '5px';
    scorePopup.style.fontFamily = "'Roboto Mono', monospace";
    scorePopup.style.fontSize = '20px';
    scorePopup.style.textAlign = 'center';
    scorePopup.style.zIndex = '200';
    scorePopup.style.border = '1px solid #aaa';
    scorePopup.style.boxShadow = '0 5px 15px rgba(255, 130, 116, 0.5)';
    scorePopup.style.minWidth = '350px';
    scorePopup.style.display = 'none';
    scorePopup.style.backdropFilter = 'blur(5px)';
    let totalScore = totalSpaceScore+candyCarTotalPoints+jumpTotalPoints;

    scorePopup.innerHTML = `
        <div style="background-color:rgb(75, 53, 4); margin: -25px -35px 20px; padding: 15px 0; border-radius: 5px 5px 0 0;">
            <h2 style="color: white; margin: 0 20px; letter-spacing: 5px; font-weight: 400;">SCOREBOARD</h2>
        </div>
        <div style="padding: 0 30px;">
            <div style="display: flex; align-items: center; justify-content: center; margin: 15px 0; padding: 0 20px;">
                <div style="font-size: 24px; font-weight: 500; color:rgb(255, 255, 255); background-color: rgb(8, 14, 71); padding: 10px 25px; border-radius: 5px; width: 100%; text-align: center;">SPACE SHOOTER POINTS: ${(totalSpaceScore)}</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; margin: 15px 0; padding: 0 20px;">
                <div style="font-size: 24px; font-weight: 500; color:rgb(255, 255, 255); background-color: rgb(83, 17, 37); padding: 10px 25px; border-radius: 5px; width: 100%; text-align: center;">CANDY CHASE POINTS: ${(candyCarTotalPoints)}</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; margin: 15px 0; padding: 0 20px;">
                <div style="font-size: 24px; font-weight: 500; color:rgb(255, 255, 255); background-color: rgb(85, 34, 10); padding: 10px 25px; border-radius: 5px; width: 100%; text-align: center;">TUMBLE JUMP POINTS: ${(jumpTotalPoints)}</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; margin: 30px 0; padding: 0 20px;">
                <div style="font-size: 24px; font-weight: 500; color: #332805; margin-right: 15px;">TOTAL POINTS:</div>
                <div style="font-size: 36px; color: #fff; font-family: 'LED Digital', 'Roboto Mono', monospace; background-color: #332805; padding: 10px 20px; border-radius: 3px; letter-spacing: 3px;">${(totalScore)}</div>
            </div>
        </div>
        <div style="display: flex; justify-content: center; margin: 30px 30px 0; padding-top: 20px; border-top: 1px solid #444;">
            <button id="closePopupBtn" style="background-color:rgb(205, 97, 70); color: white; border: none; padding: 10px 30px; cursor: pointer; border-radius: 3px; font-family: inherit; font-size: 25px; transition: all 0.2s ease;">CLOSE</button>
        </div>
    `;
    
    document.body.appendChild(scorePopup);
    
    const closeBtn = document.getElementById('closePopupBtn');
    closeBtn.addEventListener('click', () => {
        scorePopup.style.display = 'none';
        scorePopupTrigger.triggered = false;
        //camera.position.set(0, 5, 0);
        controls.lock();
    });
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#db7c67';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = '#8a311d';
    });
    
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    return scorePopup;
}


document.addEventListener('DOMContentLoaded', () => {
    const scorePopup = createScorePopup();

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    
});

// notification zone for press space message
const scoreNotification = document.createElement('div');
scoreNotification.style.position = 'absolute';
scoreNotification.style.bottom = '20px';
scoreNotification.style.width = '100%';
scoreNotification.style.textAlign = 'center';
scoreNotification.style.color = '#ffffff';
scoreNotification.style.backgroundColor = 'rgba(222, 89, 65, 0.7)';
scoreNotification.style.padding = '10px';
scoreNotification.style.fontSize = '24px';
scoreNotification.style.zIndex = '99';
scoreNotification.style.display = 'none';
scoreNotification.innerHTML = 'Press SPACE to view scoreboard';
document.body.appendChild(scoreNotification);

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();

    triggerZones.forEach(zone => {
        if (zone.mesh && zone.mesh.userData.update) {
            zone.mesh.userData.update(time);
        }
    });
    
    const currentTime = Date.now();
    if (currentTime - lastLogTime > logInterval) {
        console.log(`Current position: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}`);
        lastLogTime = currentTime;
    }
    
    if (controls.isLocked) {
        const delta = Math.min(clock.getDelta(), 0.1);
        const groundY = checkGround();

        if (!onGround) {
            velocity.y -= gravity * delta;
        } else {
            if (!canJump) {
                canJump = true;
            } 
            const targetY = lastGroundY + playerHeight;
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.2);
            if (velocity.y < 0) {
                velocity.y = 0;
            }
        }
        
        // movement direction
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        // movement velocity
        let moving = false;
        if (moveForward || moveBackward) {
            velocity.z = -direction.z * playerSpeed;
            moving = true;
        } else {
            velocity.z = 0;
        }
        
        if (moveLeft || moveRight) {
            velocity.x = -direction.x * playerSpeed;
            moving = true;
        } else {
            velocity.x = 0;
        }
        
        //rotation from controls to movement direction
        if (moving) {
            const moveX = velocity.x;
            const moveZ = velocity.z;
            
            //forward vector from camera direction
            const cameraDirection = controls.getDirection(new THREE.Vector3());
            const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
            const right = new THREE.Vector3(forward.z, 0, -forward.x);
            
            // movement based on camera direction
            velocity.x = forward.x * -moveZ + right.x * moveX;
            velocity.z = forward.z * -moveZ + right.z * moveX;
        }
        
        // next position for collision check
        const nextPosition = camera.position.clone();
        nextPosition.x += velocity.x * delta;
        nextPosition.z += velocity.z * delta;
        const hasCollision = checkWallCollision(nextPosition) || checkForbiddenBoundary(nextPosition);
        if (!hasCollision) {
            camera.position.x += velocity.x * delta;
            camera.position.z += velocity.z * delta;
        }
        
        // gravity/jumping
        camera.position.y += velocity.y * delta;
        
        // prevent falling through the floor (failsafe)
        if (camera.position.y < groundLevel + playerHeight) {
            camera.position.y = groundLevel + playerHeight;
            velocity.y = 0;
            canJump = true;
        }

        if (checkTriggerZones()) {
            instructions.style.display = 'block';
            instructions.innerHTML = 'Loading game...';
            controls.unlock();
        }

    }

    const distanceToScoreTrigger = camera.position.distanceTo(scorePopupTrigger.position);
    if (distanceToScoreTrigger < scorePopupTrigger.radius && !scorePopupTrigger.triggered && controls.isLocked) {
        scoreNotification.style.display = 'block';
    } else {
        scoreNotification.style.display = 'none';
    }
    
    renderer.render(scene, camera);
}

animate();