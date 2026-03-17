import * as THREE from 'three';

// === ЭКРАН 1: ЗАСТАВКА ===
const introScreen = document.getElementById('intro-screen');
const loveScreen = document.getElementById('love-screen');
const overlay = document.querySelector('.overlay');
const canvas = document.getElementById('canvas');

// Сцена
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.002);

// Камера
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

// Рендерер
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Частицы
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 15000;

const positions = new Float32Array(particlesCount * 3);
const colors = new Float32Array(particlesCount * 3);
const sizes = new Float32Array(particlesCount);
const speeds = new Float32Array(particlesCount);

const colorPalette = [
    new THREE.Color('#ff6b9d'),
    new THREE.Color('#00ffff'),
    new THREE.Color('#ff0066'),
    new THREE.Color('#6600ff'),
    new THREE.Color('#d4a574')
];

for (let i = 0; i < particlesCount * 3; i += 3) {
    const i3 = i / 3;
    
    positions[i] = (Math.random() - 0.5) * 200;
    positions[i + 1] = (Math.random() - 0.5) * 200;
    positions[i + 2] = (Math.random() - 0.5) * 200;
    
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
    
    sizes[i3] = Math.random() * 2;
    speeds[i3] = Math.random() * 0.5 + 0.1;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

// Шейдерный материал для частиц
const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        uniform vec2 mouse;
        
        void main() {
            vColor = color;
            
            vec3 pos = position;
            float dist = distance(pos.xy, mouse * 50.0);
            float influence = max(0.0, 1.0 - dist / 30.0);
            
            pos.x += sin(time * 2.0 + pos.y * 0.1) * influence * 5.0;
            pos.y += cos(time * 1.5 + pos.x * 0.1) * influence * 5.0;
            pos.z += sin(time * 1.0 + pos.z * 0.05) * influence * 10.0;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        
        void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha *= alpha;
            
            gl_FragColor = vec4(vColor, alpha);
        }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0, 0) }
    }
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Геометрия туннеля
const tunnelGeometry = new THREE.TorusKnotGeometry(30, 8, 200, 32, 2, 3);
const tunnelMaterial = new THREE.MeshBasicMaterial({
    color: 0x111111,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
scene.add(tunnel);

// Вторая система частиц (кольца)
const ringsGeometry = new THREE.BufferGeometry();
const ringsCount = 500;
const ringPositions = new Float32Array(ringsCount * 3);
const ringSizes = new Float32Array(ringsCount);
const ringSpeeds = new Float32Array(ringsCount);

for (let i = 0; i < ringsCount * 3; i += 3) {
    const i3 = i / 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 60;
    
    ringPositions[i] = Math.cos(angle) * radius;
    ringPositions[i + 1] = (Math.random() - 0.5) * 100;
    ringPositions[i + 2] = Math.sin(angle) * radius;
    
    ringSizes[i3] = Math.random() * 3 + 1;
    ringSpeeds[i3] = Math.random() * 0.02 + 0.01;
}

ringsGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
ringsGeometry.setAttribute('size', new THREE.BufferAttribute(ringSizes, 1));

const ringsMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        
        void main() {
            vec3 pos = position;
            float angle = time * 0.2 + pos.z * 0.01;
            
            float x = pos.x * cos(angle) - pos.y * sin(angle);
            float y = pos.x * sin(angle) + pos.y * cos(angle);
            
            pos.x = x;
            pos.y = y;
            
            vColor = vec3(
                0.5 + 0.5 * sin(time + pos.z * 0.05),
                0.5 + 0.5 * cos(time * 0.8 + pos.x * 0.05),
                0.5 + 0.5 * sin(time * 1.2 + pos.y * 0.05)
            );
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        
        void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            float ring = smoothstep(0.4, 0.5, dist) * (1.0 - smoothstep(0.3, 0.4, dist));
            
            if (dist > 0.5) discard;
            
            float alpha = ring * 0.8;
            gl_FragColor = vec4(vColor, alpha);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
        time: { value: 0 }
    }
});

const rings = new THREE.Points(ringsGeometry, ringsMaterial);
scene.add(rings);

// Свет
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff6b9d, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Мышь
const mouse = new THREE.Vector2(0, 0);
const targetMouse = new THREE.Vector2(0, 0);

document.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Ресайз
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Анимация
let time = 0;
let animationId;

function animate() {
    animationId = requestAnimationFrame(animate);
    
    time += 0.01;
    
    // Плавное движение мыши
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;
    
    // Обновление униформ
    particlesMaterial.uniforms.time.value = time;
    particlesMaterial.uniforms.mouse.value = mouse;
    ringsMaterial.uniforms.time.value = time;
    
    // Вращение туннеля
    tunnel.rotation.x = time * 0.1;
    tunnel.rotation.y = time * 0.15;
    tunnel.rotation.z = time * 0.05;
    
    // Движение камеры от мыши
    camera.position.x += (mouse.x * 20 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 20 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    
    // Пульсация частиц
    const positions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 2] += Math.sin(time * speeds[i] + i) * 0.1;
    }
    particlesGeometry.attributes.position.needsUpdate = true;
    
    // Цветовые сдвиги
    pointLight.position.x = Math.sin(time) * 30;
    pointLight.position.y = Math.cos(time * 0.7) * 30;
    pointLight.position.z = Math.sin(time * 0.5) * 30;
    
    renderer.render(scene, camera);
}

animate();

// === ПЕРЕХОД МЕЖДУ ЭКРАНАМИ ===
let hasClicked = false;

overlay.addEventListener('click', () => {
    if (hasClicked) return;
    hasClicked = true;
    
    // Взрыв частиц
    const positions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < particlesCount * 3; i += 3) {
        positions[i] += (Math.random() - 0.5) * 50;
        positions[i + 1] += (Math.random() - 0.5) * 50;
        positions[i + 2] += (Math.random() - 0.5) * 50;
    }
    particlesGeometry.attributes.position.needsUpdate = true;
    
    // Создаём белую вспышку
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay active';
    document.body.appendChild(transitionOverlay);
    
    // Останавливаем анимацию заставки
    cancelAnimationFrame(animationId);
    
    // Переход
    setTimeout(() => {
        introScreen.classList.remove('active');
        loveScreen.classList.add('active');
        
        // Разблокируем скролл
        document.body.style.overflow = 'auto';
        
        // Запускаем все анимации
        setTimeout(() => {
            initParallax();
            createFloatingParticles();
            animateTimeline();
            animateReasons();
        }, 500);
        
        // Убираем вспышку
        setTimeout(() => {
            transitionOverlay.classList.remove('active');
            setTimeout(() => transitionOverlay.remove(), 800);
        }, 800);
    }, 800);
});

// === ТАЙМЛАЙН АНИМАЦИЯ ===
function animateTimeline() {
    const timelineSection = document.querySelector('.timeline-section');
    
    // Показываем секцию
    setTimeout(() => {
        timelineSection.classList.add('visible');
    }, 300);
    
    // Анимация каждого элемента
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const items = Array.from(entry.target.querySelectorAll('.timeline-item'));
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, index * 200);
                });
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-50px'
    });
    
    observer.observe(timelineSection);
}

// === АНИМАЦИЯ ПРИЧИН (FLIP-КАРТОЧКИ) ===
function animateReasons() {
    const reasonsSection = document.querySelector('.reasons-section');
    const flipCards = document.querySelectorAll('.flip-card');
    
    setTimeout(() => {
        reasonsSection.classList.add('visible');
    }, 600);
    
    // Анимация появления
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.flip-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 50);
                });
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    observer.observe(reasonsSection);
    
    // Клик для переворота
    flipCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });
}

// === ПАРАЛЛАКС ЭФФЕКТ ДЛЯ ФОТО ===
function initParallax() {
    const floatingPhotos = document.querySelectorAll('.floating-photo');
    
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        
        floatingPhotos.forEach(photo => {
            const speed = parseFloat(photo.dataset.speed) || 0.02;
            const x = mouseX * speed * 100;
            const y = mouseY * speed * 100;
            photo.style.transform = `translate(${x}px, ${y}px) rotate(${photo.style.getPropertyValue('--rotation') || '15deg'})`;
        });
    });
}

// === ПЛАВАЮЩИЕ ЧАСТИЦЫ ===
function createFloatingParticles() {
    const container = document.getElementById('love-particles');
    const particleCount = 25;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        
        const size = Math.random() * 6 + 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        container.appendChild(particle);
    }
}

// === ФЕЙЕРВЕРК ИЗ СЕРДЕЧЕК ===
function createHeartFirework(x, y) {
    const hearts = ['💕', '💗', '💖', '💘', '💝', '❤️', '🤍', '💓'];
    
    for (let i = 0; i < 24; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart-firework';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        
        const angle = (Math.PI * 2 * i) / 24;
        const velocity = Math.random() * 150 + 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const rot = (Math.random() - 0.5) * 720;
        
        heart.style.setProperty('--tx', `${tx}px`);
        heart.style.setProperty('--ty', `${ty}px`);
        heart.style.setProperty('--rot', `${rot}deg`);
        heart.style.fontSize = (Math.random() * 16 + 16) + 'px';
        
        document.body.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1500);
    }
}

document.addEventListener('click', (e) => {
    if (loveScreen.classList.contains('active')) {
        createHeartFirework(e.clientX, e.clientY);
    }
});

// === КАСТОМНЫЙ КУРСОР ===
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

if (cursorDot && cursorOutline) {
    let cursorX = 0, cursorY = 0;
    let outlineX = 0, outlineY = 0;
    
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        
        cursorDot.style.left = cursorX + 'px';
        cursorDot.style.top = cursorY + 'px';
    });
    
    function animateCursor() {
        outlineX += (cursorX - outlineX) * 0.15;
        outlineY += (cursorY - outlineY) * 0.15;
        
        cursorOutline.style.left = outlineX + 'px';
        cursorOutline.style.top = outlineY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Эффект при наведении на интерактивные элементы
    const interactiveElements = document.querySelectorAll('a, button, .flip-card, .timeline-card, .overlay');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });
}

// === КНОПКА НАВЕРХ ===
const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
    loveScreen.addEventListener('scroll', () => {
        if (loveScreen.scrollTop > 500) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    scrollToTopBtn.addEventListener('click', () => {
        loveScreen.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// === УПРАВЛЕНИЕ МУЗЫКОЙ ===
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bg-music');

if (musicToggle && bgMusic) {
    let isPlaying = false;
    
    // Пытаемся запустить музыку при первом клике на сайте
    document.addEventListener('click', () => {
        if (!isPlaying && !bgMusic.paused) return;
        
        bgMusic.volume = 0.5;
        bgMusic.play()
            .then(() => {
                isPlaying = true;
                musicToggle.classList.add('playing');
            })
            .catch(err => {
                console.log('Автовоспроизведение заблокировано:', err);
            });
    }, { once: true });
    
    // Клик по кнопке музыки
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Вибрация на Android
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        
        if (isPlaying) {
            bgMusic.pause();
            musicToggle.classList.remove('playing');
        } else {
            bgMusic.volume = 0.5;
            bgMusic.play()
                .then(() => {
                    musicToggle.classList.add('playing');
                })
                .catch(err => {
                    console.log('Ошибка воспроизведения:', err);
                });
        }
        isPlaying = !isPlaying;
    });
}

console.log('%c MADE WITH LOVE ', 'background: linear-gradient(135deg, #d4a574, #c4956a); color: #fff; font-size: 16px; padding: 10px 20px; letter-spacing: 2px;');
