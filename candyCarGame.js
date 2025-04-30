import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let highScore = localStorage.getItem('candyCarHighScore') || 0;
let playerCart;
let gameActive = true;

const loader = new GLTFLoader();
loader.load(
    'candycar.glb',
    function (gltf) {
        playerCart = gltf.scene;
        playerCart.scale.set(0.7, 0.7, 0.7);
        playerCart.position.y = 0.5;
        playerCart.rotation.y = Math.PI;
        
        scene.add(playerCart);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened loading the model', error);
    }
);

const scene = new THREE.Scene();
const fogColor = new THREE.Color('#ffd6e6'); 
scene.fog = new THREE.Fog(fogColor, 20, 100);
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    'candysky.jpg',
    function(texture) {
        scene.background = texture;
    },
    undefined,
    function(error) {
        console.error('Error loading background image', error);
        scene.background = new THREE.Color('#ffebf3');
    }
);
const roadTexture = textureLoader.load(
  'swirls-marble-ripples-agate-liquid-marble-texture-with-pink-colors-abstract-painting-ba.jpg',
  function(texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 20);
  },
  undefined,
  function(error) {
      console.error('Error loading road texture', error);
  }
);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xfff5e6, 3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

const roadMaterial = new THREE.MeshStandardMaterial({ 
  map: roadTexture,
  roughness: 0.8,
  metalness: 0.2
});
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 100), 
  roadMaterial
);
road.rotation.x = -Math.PI / 2;
road.position.z = -40;
scene.add(road);

const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x99ff99,
  roughness: 0.8,
  metalness: 0.1
});

const leftGrass = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 100),
  grassMaterial
);
leftGrass.rotation.x = -Math.PI / 2;
leftGrass.position.set(-15, 0, -40);
scene.add(leftGrass);

const rightGrass = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 100),
  grassMaterial
);
rightGrass.rotation.x = -Math.PI / 2;
rightGrass.position.set(15, 0, -40);
scene.add(rightGrass);

// lolli trees along the road
function createLollipopTree(x, z) {
  const tree = new THREE.Group();
  
  const colors = [0xff3366, 0xff9ed8, 0xffcc00, 0x66ffcc, 0x99ff66];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x33cc33,
    shininess: 30
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.15;
  
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
    new THREE.MeshPhongMaterial({ 
      color: 0xfafafa,
      shininess: 100,
      specular: 0xeeeeee
    })
  );
  stick.position.y = 1;
  
  // pop
  const lollipopGeometry = new THREE.SphereGeometry(0.8, 64, 64);
  const lollipopMaterial = new THREE.MeshPhongMaterial({ 
    color: randomColor,
    shininess: 1200,
    specular: 0xffccff,
    emissive: 0xff99cc,
    emissiveIntensity: 0.1
  });
  
  const lollipop = new THREE.Mesh(lollipopGeometry, lollipopMaterial);
  lollipop.position.y = 2.2;
  
  tree.add(base);
  tree.add(stick);
  tree.add(lollipop);
  //tree.add(spiral);
  tree.position.set(x, 0, z);
  tree.rotation.y = Math.random() * Math.PI * 2;
  
  return tree;
}

scene.children.forEach(child => {
  if (child.userData && child.userData.isTree) {
    scene.remove(child);
  }
});

for (let z = -90; z < 10; z += 5) {
  const leftTree = createLollipopTree(-6, z);
  leftTree.userData.isTree = true;
  scene.add(leftTree);
  
  const rightTree = createLollipopTree(6, z);
  rightTree.userData.isTree = true;
  scene.add(rightTree);

}

const obstacles = [];
const candyMaterials = [
  new THREE.MeshPhongMaterial({ color: 0xff6b6b, shininess: 100 }), // Red
  new THREE.MeshPhongMaterial({ color: 0x5cf2c0, shininess: 100 }), // Green
  new THREE.MeshPhongMaterial({ color: 0xf79831, shininess: 100 }), // Yellow
  new THREE.MeshPhongMaterial({ color: 0xa2d6f9, shininess: 100 }), // Blue
];

function createCandyObstacle() {
  const candyType = Math.floor(Math.random() * 3);
  let candy;
  
  switch(candyType) {
    case 0:
      candy = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 32, 32),
        candyMaterials[Math.floor(Math.random() * candyMaterials.length)]
      );
      break;
    case 1:
      candy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32),
        candyMaterials[Math.floor(Math.random() * candyMaterials.length)]
      );
      candy.rotation.x = Math.PI / 2;
      break;
    case 2:
      candy = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.3),
        candyMaterials[Math.floor(Math.random() * candyMaterials.length)]
      );
      break;
  }
  
  candy.position.set((Math.random() - 0.5) * 8, 0.5, -50);
  scene.add(candy);
  obstacles.push(candy);
}

setInterval(createCandyObstacle, 1000);

// Input
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let speed = 0.2;
let score = 0;

const coins = [];
let coinCount = 0;
let totalPoints = 0;
const sparkles = [];

const coinCounterElement = document.createElement('div');
coinCounterElement.style.position = 'absolute';
coinCounterElement.style.top = '20px';
coinCounterElement.style.left = '50%';
coinCounterElement.style.transform = 'translateX(-50%)';
coinCounterElement.style.color = '#ffcc00';
coinCounterElement.style.fontFamily = '"Comic Sans MS", cursive, sans-serif';
coinCounterElement.style.fontSize = '32px';
coinCounterElement.style.fontWeight = 'bold';
coinCounterElement.style.textShadow = '2px 2px 4px rgba(255, 255, 255, 0.3)';
coinCounterElement.innerHTML = `<span style="margin-right: 10px;">🪙</span>${coinCount}`;
document.body.appendChild(coinCounterElement);

const highScoreElement = document.createElement('div');
highScoreElement.style.position = 'absolute';
highScoreElement.style.top = '20px';
highScoreElement.style.right = '20px';
highScoreElement.style.color = '#870e50';
highScoreElement.style.fontFamily = '"Comic Sans MS", cursive, sans-serif';
highScoreElement.style.fontSize = '24px';
highScoreElement.style.fontWeight = 'bold';
highScoreElement.style.textShadow = '2px 2px 4px rgba(255, 255, 255, 0.3)';
highScoreElement.innerHTML = `🏆 High Score: ${highScore}`;
document.body.appendChild(highScoreElement);

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
  else if (type === 'fail') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(
          65, audioContext.currentTime + 0.5 // C2
      );
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
          0.01, audioContext.currentTime + 0.5
      );
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
  }
}

function createCoinSparkle(coin) {
  const sparkleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const sparkleMaterial = new THREE.MeshBasicMaterial({
    color: Math.random() > 0.5 ? 0xffffff : 0xffff00,
    transparent: true,
    opacity: 1
  });
  
  const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 0.5;
  
  sparkle.position.x = coin.position.x + Math.cos(angle) * radius;
  sparkle.position.y = coin.position.y + (Math.random() - 0.5) * 0.2; 
  sparkle.position.z = coin.position.z + Math.sin(angle) * radius;
  
  scene.add(sparkle);
  sparkles.push({
    mesh: sparkle,
    life: 1.0,
    speed: 0.05 + Math.random() * 0.1
  });
}

function createCoin() {
  const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
  const coinMaterial = new THREE.MeshPhongMaterial({
    color: 0xffd700,
    shininess: 200,
    specular: 0xffffcc,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3,
    reflectivity: 1.0
  });

  const coin = new THREE.Mesh(coinGeometry, coinMaterial);

  const starGeometry = new THREE.CircleGeometry(0.3, 5);
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
  
  const lanePosition = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
  coin.position.set(lanePosition * 2, 0.8, -50);
  coin.rotation.x = Math.PI / 2;
  scene.add(coin);
  coin.userData.isCoin = true;
  coin.userData.lastSparkleTime = 0;
  coins.push(coin);
  
  const coinLight = new THREE.PointLight(0xffdd66, 0.5, 3);
  coinLight.position.copy(coin.position);
  scene.add(coinLight);
  
  coin.userData.light = coinLight;
}

setInterval(createCoin, 1500);

function showCrashPopup() {
  gameActive = false;
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.width = '100%';
  popup.style.height = '100%';
  popup.style.backgroundColor = 'rgba(0,0,0,0.7)';
  popup.style.display = 'flex';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';
  popup.style.zIndex = '1000';
  popup.style.fontFamily = '"Comic Sans MS", cursive, sans-serif';

  const popupContent = document.createElement('div');
  popupContent.style.backgroundColor = '#ffebf3';
  popupContent.style.padding = '30px';
  popupContent.style.borderRadius = '20px';
  popupContent.style.boxShadow = '0 0 20px #ff6b6b';
  popupContent.style.textAlign = 'center';
  popupContent.style.maxWidth = '400px';
  popupContent.style.border = '4px solid #ff6b6b';

  const title = document.createElement('h2');
  title.textContent = 'Game Over!';
  title.style.color = '#ff6b6b';
  title.style.marginTop = '0';
  title.style.fontSize = '32px';
  popupContent.appendChild(title);

  const message = document.createElement('p');
  message.textContent = 'Your kart crashed into candy!';
  message.style.color = '#8b4513';
  message.style.fontSize = '20px';
  popupContent.appendChild(message);

  const coinsDisplay = document.createElement('div');
  coinsDisplay.innerHTML = `<p style="color: #ffcc00; font-weight: bold; font-size: 24px;">
    Coins collected: ${coinCount}</p>
    <p style="color: #ff9ed8; font-weight: bold; font-size: 20px;">
    Total coins: ${totalPoints}</p>`;
  coinsDisplay.style.margin = '15px 0';
  popupContent.appendChild(coinsDisplay);

  const emoji = document.createElement('div');
  emoji.textContent = '🍭 🪙 💥';
  emoji.style.fontSize = '40px';
  emoji.style.margin = '20px 0';
  popupContent.appendChild(emoji);
  
  const restartButton = document.createElement('button');
  restartButton.textContent = 'Try Again!';
  restartButton.style.backgroundColor = '#ff6b6b';
  restartButton.style.color = 'white';
  restartButton.style.border = 'none';
  restartButton.style.padding = '12px 24px';
  restartButton.style.borderRadius = '50px';
  restartButton.style.fontSize = '18px';
  restartButton.style.cursor = 'pointer';
  restartButton.style.marginTop = '10px';
  restartButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  restartButton.style.transition = 'all 0.3s';

  const exitButton = document.createElement('button');
  exitButton.textContent = 'Back to lobby';
  exitButton.style.backgroundColor = '#ff6b6b';
  exitButton.style.color = 'white';
  exitButton.style.border = 'none';
  exitButton.style.padding = '12px 24px';
  exitButton.style.borderRadius = '50px';
  exitButton.style.fontSize = '18px';
  exitButton.style.cursor = 'pointer';
  exitButton.style.marginTop = '10px';
  exitButton.style.marginLeft = '10px';
  exitButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  exitButton.style.transition = 'all 0.3s';
  
  // button hover
  restartButton.onmouseover = () => {
    restartButton.style.transform = 'scale(1.05)';
    restartButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
  };
  restartButton.onmouseout = () => {
    restartButton.style.transform = 'scale(1)';
    restartButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };

  exitButton.onmouseover = () => {
    exitButton.style.transform = 'scale(1.05)';
    exitButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
  };
  exitButton.onmouseout = () => {
    exitButton.style.transform = 'scale(1)';
    exitButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };
  
  restartButton.onclick = () => {
    document.body.removeChild(popup);
    gameActive = true;
    location.reload();
  };
  exitButton.onclick = () => {
    document.body.removeChild(popup);
    gameActive = false;
    window.location.href = '/';
  };
  
  popupContent.appendChild(restartButton);
  popupContent.appendChild(exitButton);
  popup.appendChild(popupContent);
  document.body.appendChild(popup);

  if (coinCount > highScore) {
    highScore = coinCount;
    localStorage.setItem('candyCarHighScore', highScore);
    highScoreElement.innerHTML = `🏆 High Score: ${highScore}`;
  }
}

function createCoinCollectionEffect(position) {
  for (let i = 0; i < 15; i++) {
    const sparkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ 
        color: i % 2 === 0 ? 0xffff00 : 0xffffff,
        transparent: true,
        opacity: 1
      })
    );
    
    sparkle.position.copy(position);
    sparkle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.5,
      (Math.random() - 0.5) * 0.3
    );
    
    scene.add(sparkle);
    setTimeout(() => {
      scene.remove(sparkle);
    }, 800);
    sparkle.userData.isSparkle = true;
  }
  
  const plusOneDiv = document.createElement('div');
  plusOneDiv.innerHTML = '+1 <span style="color: white; text-shadow: 0 0 5px #ffff00, 0 0 10px #ffff00;">✨</span>';
  plusOneDiv.style.position = 'absolute';
  plusOneDiv.style.color = '#ffcc00';
  plusOneDiv.style.fontFamily = '"Comic Sans MS", cursive, sans-serif';
  plusOneDiv.style.fontSize = '28px';
  plusOneDiv.style.fontWeight = 'bold';
  plusOneDiv.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.5)';
  plusOneDiv.style.zIndex = '1000';
  plusOneDiv.style.pointerEvents = 'none';
  
  plusOneDiv.style.top = '50%';
  plusOneDiv.style.left = '50%';
  plusOneDiv.style.transform = 'translate(-50%, -50%)';
  
  document.body.appendChild(plusOneDiv);

  let opacity = 1;
  let posY = 50;
  
  const animatePlusOne = () => {
    opacity -= 0.02;
    posY -= 0.5;
    
    plusOneDiv.style.opacity = opacity;
    plusOneDiv.style.top = `${posY}%`;
    
    if (opacity > 0) {
      requestAnimationFrame(animatePlusOne);
    } else {
      document.body.removeChild(plusOneDiv);
    }
  };
  
  animatePlusOne();
  
  coinCounterElement.style.transform = 'translateX(-50%) scale(1.2)';
  coinCounterElement.style.textShadow = '0 0 15px #ffff00, 0 0 25px #ffff00';
  
  setTimeout(() => {
    coinCounterElement.style.transform = 'translateX(-50%) scale(1)';
    coinCounterElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
  }, 300);
}

let lastTime = 0;

function showInstructionPopup() {
  gameActive = false;
  const savedTotal = localStorage.getItem('candyCarTotalPoints');
  if (savedTotal) {
    totalPoints = parseInt(savedTotal, 0);
  }
  
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.width = '100%';
  popup.style.height = '100%';
  popup.style.backgroundColor = 'rgba(0,0,0,0.7)';
  popup.style.display = 'flex';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';
  popup.style.zIndex = '1000';
  popup.style.fontFamily = '"Comic Sans MS", cursive, sans-serif';

  const popupContent = document.createElement('div');
  popupContent.style.backgroundColor = '#ffebf3';
  popupContent.style.padding = '30px';
  popupContent.style.borderRadius = '20px';
  popupContent.style.boxShadow = '0 0 20px #ff6b6b';
  popupContent.style.textAlign = 'center';
  popupContent.style.maxWidth = '500px';
  popupContent.style.border = '4px solid #ff6b6b';

  const title = document.createElement('h1');
  title.textContent = 'Welcome to Candy Chase!';
  title.style.color = '#ff6b6b';
  title.style.marginTop = '0';
  title.style.fontSize = '36px';
  popupContent.appendChild(title);

  const candyDecor = document.createElement('div');
  candyDecor.textContent = '🍭 🍬 🍫 🍪';
  candyDecor.style.fontSize = '28px';
  candyDecor.style.margin = '10px 0 20px';
  popupContent.appendChild(candyDecor);

  const instructions = document.createElement('div');
  instructions.style.marginBottom = '20px';
  instructions.style.color = '#8b4513';
  instructions.style.fontSize = '18px';
  instructions.style.lineHeight = '1.5';
  instructions.style.textAlign = 'left';
  
  instructions.innerHTML = `
    <p><strong>How to Play:</strong></p>
    <ul style="margin-left: 20px; margin-bottom: 15px;">
      <li>Use <strong>A</strong> and <strong>D</strong> or <strong>←</strong> and <strong>→</strong> arrow keys to move your candy car</li>
      <li>Collect as many gold coins as possible</li>
      <li>Avoid hitting candy on the road</li>
    </ul>
    <p style="text-align: center; font-weight: bold;">Drive safe!</p>
  `;
  
  popupContent.appendChild(instructions);

  const startButton = document.createElement('button');
  startButton.textContent = 'Start Game';
  startButton.style.backgroundColor = '#ff6b6b';
  startButton.style.color = 'white';
  startButton.style.border = 'none';
  startButton.style.padding = '15px 40px';
  startButton.style.borderRadius = '50px';
  startButton.style.fontSize = '22px';
  startButton.style.cursor = 'pointer';
  startButton.style.marginTop = '10px';
  startButton.style.fontWeight = 'bold';
  startButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  startButton.style.transition = 'all 0.3s';

  startButton.onmouseover = () => {
    startButton.style.transform = 'scale(1.05)';
    startButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
    startButton.style.backgroundColor = '#ff8c8c';
  };
  startButton.onmouseout = () => {
    startButton.style.transform = 'scale(1)';
    startButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    startButton.style.backgroundColor = '#ff6b6b';
  };

  startButton.onclick = () => {
    document.body.removeChild(popup);
    gameActive = true;
    animate(0);
  };
  
  popupContent.appendChild(startButton);
  popup.appendChild(popupContent);
  document.body.appendChild(popup);
}

window.addEventListener('load', showInstructionPopup);

function animate(time) {
  if(gameActive){
    requestAnimationFrame(animate);
  }
  
  const delta = time - lastTime;
  lastTime = time;

  if (playerCart && gameActive) {
    if (keys['a'] || keys['arrowleft']) playerCart.position.x -= 0.2;
    if (keys['d'] || keys['arrowright']) playerCart.position.x += 0.2;
    
    playerCart.rotation.z = (keys['a'] || keys['arrowleft']) ? 0.1 : (keys['d'] || keys['arrowright']) ? -0.1 : 0;

    playerCart.position.x = Math.max(-4, Math.min(4, playerCart.position.x));
  }

  {for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].position.z += speed;
    obstacles[i].rotation.x += 0.02;
    obstacles[i].rotation.y += 0.03;

    if (obstacles[i].position.z > 10) {
      scene.remove(obstacles[i]);
      obstacles.splice(i, 1);
    }

    if (playerCart && Math.abs(playerCart.position.z - obstacles[i].position.z) < 1.5 &&
        Math.abs(playerCart.position.x - obstacles[i].position.x) < 1) {
      // explosion effect
      playSound('fail')
      for (let j = 0; j < 10; j++) {
        const piece = new THREE.Mesh(
          new THREE.SphereGeometry(0.1),
          new THREE.MeshPhongMaterial({ 
            color: Math.random() * 0xffffff,
            shininess: 100
          })
        );
        piece.position.copy(obstacles[i].position);
        piece.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.5,
          (Math.random() - 0.5) * 0.5
        );
        scene.add(piece);
        setTimeout(() => scene.remove(piece), 1000);
      }

      
      showCrashPopup();
      return;
    }
  }

  if(gameActive){
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.position.z += speed;
      coin.rotation.y += 0.05;
      
      // coin bob
      coin.position.y = 0.8 + Math.sin(time * 0.003) * 0.1;
      
      // coin light position
      if (coin.userData.light) {
        coin.userData.light.position.copy(coin.position);
        // light intensity pulse
        coin.userData.light.intensity = 0.5 + Math.sin(time * 0.005) * 0.3;
      }
      
      // sparkle periodically
      if (time - coin.userData.lastSparkleTime > 200) {
        if (Math.random() < 0.3) {
          createCoinSparkle(coin);
        }
        coin.userData.lastSparkleTime = time;
      }

      if (coin.position.z > 10) {
        if (coin.userData.light) {
          scene.remove(coin.userData.light);
        }
        scene.remove(coin);
        coins.splice(i, 1);
        continue;
      }
      
      if (playerCart && Math.abs(playerCart.position.z - coin.position.z) < 1.5 &&
          Math.abs(playerCart.position.x - coin.position.x) < 1.5) {
  
        playSound('collect')
        coinCount++;
        totalPoints++;
        localStorage.setItem('candyCarTotalPoints', totalPoints.toString());
        coinCounterElement.innerHTML = `<span style="margin-right: 10px;">🪙</span>${coinCount}`;
        
        createCoinCollectionEffect(coin.position);
        
        if (coin.userData.light) {
          scene.remove(coin.userData.light);
        }
        scene.remove(coin);
        coins.splice(i, 1);
      }
    }
  }

  for (let i = sparkles.length - 1; i >= 0; i--) {
    const sparkle = sparkles[i];
    sparkle.life -= sparkle.speed;
    
    if (sparkle.life <= 0) {
      scene.remove(sparkle.mesh);
      sparkles.splice(i, 1);
    } else {
      sparkle.mesh.material.opacity = sparkle.life;
      sparkle.mesh.scale.set(
        1 + (1 - sparkle.life) * 2,
        1 + (1 - sparkle.life) * 2,
        1 + (1 - sparkle.life) * 2
      );
    }
  }

  scene.children.forEach(object => {
    if (object.userData.isSparkle) {
      object.position.add(object.userData.velocity);
      object.userData.velocity.y -= 0.01;
      object.scale.multiplyScalar(0.97); // shrink over time
      
      if (object.material && object.material.opacity) {
        object.material.opacity = 0.5 + Math.sin(time * 0.02) * 0.5;
      }
    }
  });
  renderer.render(scene, camera);
}}

animate(0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});