//import { update } from "three/examples/jsm/libs/tween.module.js";

const GRAVITY = 0.007 ;
const JUMP_FORCE = 0.2;
const SPEED = 0.1;
const OBSTACLE_SPEED = 0.12;
const COIN_SPEED = 0.12;
const GROUND_HEIGHT = -1.2   ;
const PLAYER_SIZE = 0.5;
const OBSTACLE_SPAWN_RATE = 2000;
const COIN_SPAWN_RATE = 1500;

let scene, camera, renderer, player;
let playerVelocity = 0;
let isJumping = false;
let coins = 0;
let highScore = localStorage.getItem('highScore') || 0;
let obstacles = [];
let coinObjects = [];
let isGameOver = false;
let isGameActive = false;
let lastObstacleTime = 0;
let lastCoinTime = 0;
let clock;
let totalPoints = parseInt(localStorage.getItem('jumpTotalPoints')) || 0;

//GAME SOUNDS
function playSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    if (type === 'collect') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime); // G5
        oscillator.frequency.exponentialRampToValueAtTime(
            1568, audioContext.currentTime + 0.1 // G6
        );
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, audioContext.currentTime + 0.2
        );
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } 
    else if (type === 'whistle') {
        const whistle1 = audioContext.createOscillator();
        const whistle2 = audioContext.createOscillator();
        const whistle3 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        whistle1.type = 'sine';
        whistle2.type = 'triangle';
        whistle3.type = 'square';
        whistle1.frequency.setValueAtTime(600, audioContext.currentTime);
        whistle1.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.3);
        
        // airy
        whistle2.frequency.setValueAtTime(605, audioContext.currentTime);
        whistle2.frequency.exponentialRampToValueAtTime(905, audioContext.currentTime + 0.3);
        
        // Breath noise
        const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 0.2 - 0.1;
        }
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        whistle1.connect(gain);
        //whistle2.connect(gain);
        noise.connect(gain);
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        //whistle1.start();
        //whistle2.start();
        noise.start();
        //whistle1.stop(audioContext.currentTime + 0.8);
        //whistle2.stop(audioContext.currentTime + 0.8);
        noise.stop(audioContext.currentTime + 0.8);
    }
}

function init() {
    document.getElementById('game-start').style.display = 'block';
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('lobby-btn-gameover').addEventListener('click', goToLobby);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    scene = new THREE.Scene();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        '/5481320_2839194.jpg ',
        function(texture) {
            scene.background = texture;
        },
        undefined,
        function(error) {
            console.error('Error loading background image', error);
            scene.background = new THREE.Color('#ffebf3');
        }
    );
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 5);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // lights
    const ambientLight = new THREE.AmbientLight(0xffffff , 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xd67b2b  , 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
   
    createGround();
    createPlayer();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    clock = new THREE.Clock();
    updateScoreDisplay();
    animate();
}

function startGame() {
    document.getElementById('game-start').style.display = 'none';
    isGameActive = true;
    gameStarted = true;
    clock.start();
}

function goToLobby() {
    window.location.href = '/';
}

function createGround() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        '23641781_abscolorful_vector_fluid_design_background.jpg',
        function(texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(100, 1);
            const groundGeometry = new THREE.BoxGeometry(100, 0.5, 3);
            const groundMaterial = new THREE.MeshLambertMaterial({ 
                map: texture,
                side: THREE.DoubleSide
            });
            
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.position.y = GROUND_HEIGHT - 0.5;
            scene.add(ground);
        },
        undefined,
        function(error) {
            console.error('Error loading ground texture', error);
            const groundGeometry = new THREE.BoxGeometry(100, 0.5, 3);
            const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xf0bf84 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.position.y = GROUND_HEIGHT - 0.25;
            scene.add(ground);
        }
    );
}

function createPlayer() {
    player = new THREE.Group();
    const stickColors = [0xfcca72, 0xA67B5B, 0x986A44, 0xc49c56];
    for (let i = 0; i < 35  ; i++) {
        const stickLength = PLAYER_SIZE * 2;
        const stickWidth = PLAYER_SIZE * 0.1;
        const stickGeometry = new THREE.CylinderGeometry(
            stickWidth, 
            stickWidth, 
            stickLength, 
            5, 1
        );
        
        const colorIndex = Math.floor(Math.random() * stickColors.length);
        const stickMaterial = new THREE.MeshToonMaterial({ 
            color: stickColors[colorIndex],
            flatShading: true
        });
        const stick = new THREE.Mesh(stickGeometry, stickMaterial);
        const angle1 = (i / 12) * Math.PI * 2;
        const angle2 = (i / 12) * Math.PI * 2 + Math.PI/2;
        
        stick.rotation.set(
            angle1,
            angle2,
            Math.random() * Math.PI
        );
        
        player.add(stick);
    }

    player.position.y = GROUND_HEIGHT + PLAYER_SIZE / 2 + 2;
    player.userData = {
        rollSpeed: 0.5,
        currentRoll: 0
    };
    scene.add(player);
}

function updatePlayer(deltaTime) {
    if (!isGameActive || player.userData.isCrashed) {
        return;
    }
    const movementFactor = OBSTACLE_SPEED;
    const rollAmount = player.userData.rollSpeed * movementFactor * deltaTime * 60;
    player.userData.currentRoll -= rollAmount;
    player.rotation.z = player.userData.currentRoll;
    player.rotation.x = Math.sin(player.userData.currentRoll * 0.7) * 0.3;
}


function createObstacle() {
    const size = 0.5 + Math.random() * 0.3;
    let obstacleGeometry;
    let obstacleMaterial;
    const obstacleType = Math.floor(Math.random() * 3);
    
    if (obstacleType === 0) {
        // Rock
        obstacleGeometry = new THREE.DodecahedronGeometry(size / 2);
        obstacleMaterial = new THREE.MeshToonMaterial({ color: 0x808080 });
    } else if (obstacleType === 1) {
        // Cactus
        const cactusGroup = new THREE.Group();
        // trunk
        const trunkHeight = size * 1.5;
        const trunkGeometry = new THREE.CylinderGeometry(size/4, size/3, trunkHeight, 6);
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4b6e13,
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = GROUND_HEIGHT + trunkHeight/2;
        cactusGroup.add(trunk);
        
        // arms/branches
        const armCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < armCount; i++) {
            // curved arm using a custom curve
            createSimpleCurvedArm(
                cactusGroup,
                trunkMaterial,
                GROUND_HEIGHT + (0.4 + i * 0.3) * trunkHeight,
                Math.random() > 0.5 ? 1 : -1,
                size
            );
        }
        
        cactusGroup.position.x = 15;
        obstacles.push({ mesh: cactusGroup, size: size/2 });
        scene.add(cactusGroup);
        return;
    } else {
        obstacleGeometry = new THREE.CylinderGeometry(size / 3, size / 3, size * 1.5, 8);
        obstacleMaterial = new THREE.MeshToonMaterial({ color: 0x3b1a07 });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.rotation.z = Math.PI / 2;
        obstacle.position.y = GROUND_HEIGHT + size / 3;
        obstacle.position.x = 15;
        obstacles.push({ mesh: obstacle, size: size / 3 });
        scene.add(obstacle);
        return;
    }
    
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.y = GROUND_HEIGHT + size / 2;
    obstacle.position.x = 15;
    obstacles.push({ mesh: obstacle, size: size / 2 });
    scene.add(obstacle);

    function createSimpleCurvedArm(parent, material, startHeight, direction, size) {
        // curved path for the arm
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0), // Start at origin
            new THREE.Vector3(direction * size * 0.3, size * 0.2, 0), // first control point
            new THREE.Vector3(direction * size * 0.6, size * 0.5, 0), // second control point
            new THREE.Vector3(direction * size * 0.6, size * 1.0, 0)  // end point
        );
        
        const tubeRadius = size * 0.15;
        const tubularSegments = 6;
        const radiusSegments = 5;
        
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            tubularSegments,
            tubeRadius,
            radiusSegments,
            false
        );
        const arm = new THREE.Mesh(tubeGeometry, material);
        arm.position.y = startHeight;
        parent.add(arm);
    }
}

function createCoin() {
    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
      const coinMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 200,
        specular: 0xffffcc,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
        reflectivity: 1.0
      });
      
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      const starGeometry = new THREE.CircleGeometry(0.2, 5);
      const starMaterial = new THREE.MeshPhongMaterial({
        color: 0xffee66,
        shininess: 150,
        specular: 0xffffcc
      });
      const starFront = new THREE.Mesh(starGeometry, starMaterial);
      starFront.position.y = 0.03;
      starFront.rotation.x = -Math.PI / 2;
      const starBack = starFront.clone();
      starBack.position.y = -0.03;
      starBack.rotation.x = Math.PI / 2;
      
      coin.add(starFront);
      coin.add(starBack);
    const coinHeight = GROUND_HEIGHT + 0.5 + Math.random() * 1.5;
    coin.position.set(15, coinHeight, 0);
    coin.rotation.x = Math.PI / 2;
    
    coinObjects.push(coin);
    scene.add(coin);
}

function onKeyDown(event) {
    if (event.code === 'Space' && !isJumping && isGameActive) {
        playerVelocity = JUMP_FORCE;
        isJumping = true;
    }

}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function updateScoreDisplay() {
    document.getElementById('current-score').textContent = `🪙 ${coins}`;
    document.getElementById('high-score').textContent = `High Score: ${highScore}`;
}
function showGameOver() {
    isGameOver = true;
    isGameActive = false;
    totalPoints += coins;
    localStorage.setItem('jumpTotalPoints', totalPoints.toString());

    document.getElementById('final-score').textContent = `You collected ${coins} coin(s)!`;
    document.getElementById('total-points').textContent = `Total coins collected: ${totalPoints}`;
    document.getElementById('game-over').style.display = 'block';
    if (coins > highScore) {
        highScore = coins;
        localStorage.setItem('highScore', highScore.toString());
        updateScoreDisplay();
    }
}

function restartGame() {
    player.userData.isCrashed = false;
    isGameOver = false;
    isGameActive = true;
    coins = 0;
    playerVelocity = 0;
    isJumping = false;
    player.position.y = GROUND_HEIGHT + PLAYER_SIZE / 2;
    obstacles.forEach(obstacle => scene.remove(obstacle.mesh));
    obstacles = [];
    coinObjects.forEach(coin => scene.remove(coin));
    coinObjects = [];

    document.getElementById('game-over').style.display = 'none';
    const totalPointsElement = document.getElementById('total-points');
    if (totalPointsElement) {
        totalPointsElement.textContent = '';
    }
    updateScoreDisplay();
    lastObstacleTime = 0;
    lastCoinTime = 0;
    clock.start();
}

function checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(player);
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacles[i].mesh);
        
        if (playerBox.intersectsBox(obstacleBox)) {
            playSound('whistle');
            player.userData.isCrashed = true;
            showGameOver();
            return;
        }
    }
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        const coinBox = new THREE.Box3().setFromObject(coinObjects[i]);
        
        if (playerBox.intersectsBox(coinBox)) {
            playSound('collect');
            scene.remove(coinObjects[i]);
            coinObjects.splice(i, 1);
            coins++;
            updateScoreDisplay();
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    updatePlayer(deltaTime);
    if (!isGameActive) {
        renderer.render(scene, camera);
        return;
    }
    
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime() * 1000;
    playerVelocity -= GRAVITY;
    player.position.y += playerVelocity;
    
    if (player.position.y <= GROUND_HEIGHT + PLAYER_SIZE / 2) {
        player.position.y = GROUND_HEIGHT + PLAYER_SIZE / 2;
        playerVelocity = 0;
        isJumping = false;
    }
    
    coinObjects.forEach(coin => {
        coin.rotation.y += 0.1;
    });
    
    if (elapsedTime - lastObstacleTime > OBSTACLE_SPAWN_RATE) {
        createObstacle();
        lastObstacleTime = elapsedTime;
    }
    if (elapsedTime - lastCoinTime > COIN_SPAWN_RATE) {
        createCoin();
        lastCoinTime = elapsedTime;
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].mesh.position.x -= OBSTACLE_SPEED;
        if (obstacles[i].mesh.position.x < -15) {
            scene.remove(obstacles[i].mesh);
            obstacles.splice(i, 1);
        }
    }
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        coinObjects[i].position.x -= COIN_SPEED;
        if (coinObjects[i].position.x < -15) {
            scene.remove(coinObjects[i]);
            coinObjects.splice(i, 1);
        }
    }
    checkCollisions();
    renderer.render(scene, camera);
}
window.onload = init;