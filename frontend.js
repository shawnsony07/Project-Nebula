let scene, camera, renderer, tooltip;
let raycaster, mouse;
let stars = [];

// Initialize Three.js scene, camera, renderer, and raycaster
const initThreeJS = () => {
    scene = new THREE.Scene();

    const container = document.getElementById('map-container');

    // Adjust the camera aspect ratio based on container dimensions
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.z = 200;  // Set camera further back to capture more stars

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("starMap"), antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 1); // Black background for space

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    tooltip = document.getElementById('tooltip');

    // Resize renderer and update camera aspect on window resize
    window.addEventListener('resize', onWindowResize);
};

// Handle window resizing and update camera/renderer
const onWindowResize = () => {
    const container = document.getElementById('map-container');

    // Update the camera aspect ratio and renderer size
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(container.clientWidth, container.clientHeight);
};

// Create a star and add it to the scene
const createStar = (x, y, z, label) => {
    const starSize = 0.5;  // Uniform size for all stars
    const geometry = new THREE.SphereGeometry(starSize, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(geometry, material);

    star.position.set(x, y, z);
    star.userData = { label };
    scene.add(star);
    stars.push(star);
};

// Convert RA/Dec to 3D Cartesian coordinates
const convertToCartesian = (ra, dec, magnitude) => {
    const raRad = THREE.MathUtils.degToRad(ra);
    const decRad = THREE.MathUtils.degToRad(dec);
    
    // Use magnitude to determine distance; closer stars are larger
    const distance = Math.pow(10, (magnitude - 5) / 5); // Convert magnitude to a distance scale

    const x = distance * Math.cos(decRad) * Math.cos(raRad);
    const y = distance * Math.cos(decRad) * Math.sin(raRad);
    const z = distance * Math.sin(decRad);

    return { x, y, z };
};

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    detectStarHover();
};

// Detect if a star is hovered over and show tooltip
const detectStarHover = () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stars);

    if (intersects.length > 0) {
        const star = intersects[0].object;
        tooltip.innerHTML = `Star: ${star.userData.label}`;
        tooltip.style.left = `${(mouse.x + 1) * window.innerWidth / 2}px`;
        tooltip.style.top = `${(-mouse.y + 1) * window.innerHeight / 2}px`;
        tooltip.classList.add('visible');
    } else {
        tooltip.classList.remove('visible');
    }
};

// Fetch star map data using Flask API
document.getElementById("fetchButton").addEventListener("click", async () => {
    const planetName = document.getElementById("planetInput").value.trim();
    if (!planetName) return alert("Please enter a planet name!");

    try {
        const starsData = await fetchStarData(planetName);

        if (!starsData || !starsData.stars) {
            throw new Error('No data returned from server');
        }

        // Clear existing stars
        stars.forEach(star => scene.remove(star));
        stars = [];

        // Create and display new stars using real coordinates
        starsData.stars.forEach(star => {
            const { x, y, z } = convertToCartesian(star.ra, star.dec, star.magnitude); // Use magnitude for distance
            createStar(x, y, z, `ID: ${star.source_id}, Mag: ${star.magnitude}`);
        });
    } catch (error) {
        console.error("Error fetching star data:", error);
        alert("Error fetching star data: " + error.message);
    }
});

// Update mouse coordinates on movement for hover detection
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Initialize Three.js and start animation loop
initThreeJS();
animate();

// Fetch star data function that communicates with Flask API
async function fetchStarData(planetName) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/fetch-stars/${planetName}`);

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();

        if (!data || !data.stars || data.stars.length === 0) {
            throw new Error('No stars found for the given planet.');
        }

        // Return the cleaned star data
        return {
            stars: data.stars.map(star => ({
                source_id: star.source_id || "Unknown",
                distance: star.distance || 100, // Default distance if not provided
                magnitude: star.magnitude || 100, // Use a default magnitude
                ra: star.ra,
                dec: star.dec
            }))
        };
    } catch (error) {
        console.error('Error fetching star data:', error);
        alert('Error fetching star data: ' + error.message);
        return null;
    }
}

// Handle sending and receiving messages for the chatbot
document.getElementById("sendMessage").addEventListener("click", async () => {
    const userMessage = document.getElementById("userMessage").value.trim();
    if (!userMessage) return alert("Please enter a message!");

    // Add user message to chat log
    addMessageToChatLog("You: " + userMessage);
    document.getElementById("userMessage").value = ""; // Clear input

    try {
        const response = await fetchChatGPTResponse(userMessage);
        addMessageToChatLog("Chatbot: " + response);
    } catch (error) {
        console.error("Error communicating with chatbot:", error);
        alert("Error communicating with chatbot: " + error.message);
    }
});

// Function to fetch response from ChatGPT API
async function fetchChatGPTResponse(userMessage) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        return data.reply || "Sorry, I couldn't understand that.";
    } catch (error) {
        console.error('Error fetching ChatGPT response:', error);
        throw new Error("Failed to fetch response from chatbot.");
    }
}

// Add message to chat log
const addMessageToChatLog = (message) => {
    const chatlog = document.getElementById("chatlog");
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    chatlog.appendChild(messageElement);
    chatlog.scrollTop = chatlog.scrollHeight; // Auto-scroll to the bottom
};
