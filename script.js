
const GITHUB_CONFIG = {
    user: "SIYAMBOSS",
    repo: "siyam-vault",
    path: "vault/sadaf245sz@gmail.com/photos"
};

async function initGallery() {
    const carousel = document.getElementById('carousel-3d');
    const grid = document.getElementById('gallery');
    
    try {
        // Fetching Images from GitHub
        const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.user}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`);
        const data = await res.json();
        const items = data.reverse();

        // Load 3D Carousel
        items.slice(0, 6).forEach((file, i) => {
            const img = document.createElement('img');
            img.src = file.download_url;
            img.className = 'carousel-item';
            img.style.setProperty('--i', i + 1);
            carousel.appendChild(img);
        });

        // Load Grid Gallery
        items.forEach(file => {
            const div = document.createElement('div');
            div.className = 'media-item';
            div.innerHTML = `
                <div class="protection-layer"></div>
                <img src="${file.download_url}" loading="lazy">
                <a href="${file.download_url}" download class="dl-btn">
                    <i class="fa-solid fa-arrow-down-long"></i>
                </a>
            `;
            grid.appendChild(div);
        });

        // Start checking for remote control
        checkRemoteStatus();
        setInterval(checkRemoteStatus, 8000); // ৮ সেকেন্ড পরপর চেক করবে

    } catch (err) { console.error("Archive sync failed."); }
}

async function checkRemoteStatus() {
    try {
        // status.json ফাইল থেকে পারমিশন চেক
        const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_CONFIG.user}/${GITHUB_CONFIG.repo}/main/status.json?t=${Date.now()}`);
        const status = await res.json();
        
        const gridItems = document.querySelectorAll('.media-item');
        const indicator = document.getElementById('status-indicator');

        if (status.allowDownload) {
            gridItems.forEach(item => {
                item.classList.add('allow');
                item.querySelector('.protection-layer').style.display = 'none';
            });
            indicator.innerHTML = '<span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Downloads Enabled';
            indicator.className = "mt-2 text-[7px] text-green-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2";
        } else {
            gridItems.forEach(item => {
                item.classList.remove('allow');
                item.querySelector('.protection-layer').style.display = 'block';
            });
            indicator.innerHTML = '<span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> Protected Mode';
            indicator.className = "mt-2 text-[7px] text-white/20 uppercase tracking-widest flex items-center justify-center gap-2";
        }
    } catch (e) { console.log("Remote signal lost."); }
}

// Anti-Keyboard Logic
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && (e.shiftKey && e.keyCode == 73)) || (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};

window.onload = initGallery;
