const GITHUB = { user: "SIYAMBOSS", repo: "my-photo" };
let userEmail = sessionStorage.getItem('vault_user') || "";
let currentTab = 'photo';
let selectedFiles = [];

// পেজ লোড হলে চেক করবে লগইন আছে কি না
window.onload = () => {
    if(userEmail) {
        showVault();
    }
};

function login() {
    const email = document.getElementById('email-field').value.trim();
    if(email) {
        userEmail = email;
        sessionStorage.setItem('vault_user', userEmail);
        showVault();
    }
}

function logout() {
    sessionStorage.removeItem('vault_user');
    location.reload();
}

function showVault() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('vault-ui').classList.remove('hidden');
    document.getElementById('user-display-top').innerText = `ACCESSING AS: ${userEmail}`;
    loadVault();
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    loadVault();
}

async function loadVault() {
    const grid = document.getElementById('gallery');
    const carousel = document.getElementById('carousel-3d');
    const path = `vault/${userEmail}/photos`;

    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/${path}`);
        if(!res.ok) throw new Error();
        const files = (await res.json()).reverse();
        
        grid.innerHTML = ''; carousel.innerHTML = '';
        let count = 0;

        files.forEach(file => {
            const isVid = file.name.endsWith('.mp4');
            if(count < 6 && !isVid) {
                carousel.innerHTML += `<img src="${file.download_url}" style="--i:${count+1}" class="carousel-item">`;
                count++;
            }

            if((currentTab === 'photo' && !isVid) || (currentTab === 'video' && isVid)) {
                const card = document.createElement('div');
                card.className = 'media-card bg-[#111] rounded-2xl overflow-hidden border border-white/5 relative group';
                card.onclick = () => openViewer(file.download_url, isVid, file.path, file.sha);
                card.innerHTML = isVid ? `<video src="${file.download_url}" class="w-full aspect-square object-cover opacity-60"></video><i class="fa-solid fa-play absolute inset-0 flex items-center justify-center text-white/50"></i>` 
                                       : `<img src="${file.download_url}" class="w-full aspect-square object-cover">`;
                grid.appendChild(card);
            }
        });
    } catch (e) { grid.innerHTML = `<p class="col-span-full text-center text-white/10 mt-20 italic">No files found.</p>`; }
}

function openViewer(url, isVid, path, sha) {
    const viewer = document.getElementById('viewer');
    const content = document.getElementById('viewer-content');
    viewer.classList.remove('hidden');
    content.innerHTML = isVid ? `<video src="${url}" controls autoplay class="max-h-[75vh] w-auto rounded-2xl"></video>` 
                               : `<img src="${url}" class="max-h-[75vh] w-auto rounded-2xl shadow-2xl">`;
    
    document.getElementById('viewer-save').onclick = () => {
        const a = document.createElement('a'); a.href = url; a.download = 'SIYAM_VAULT'; a.click();
    };
    document.getElementById('viewer-del').onclick = () => {
        const t = prompt("Enter Token to Delete:");
        if(t) deleteFile(path, sha, t);
    };
}

function showTokenPopup() {
    selectedFiles = document.getElementById('file-input').files;
    if(selectedFiles.length > 0) {
        document.getElementById('token-popup').classList.remove('hidden');
        document.getElementById('token-input-area').classList.remove('hidden');
        document.getElementById('upload-progress').classList.add('hidden');
    }
}

async function uploadFiles() {
    const ghToken = document.getElementById('upload-token').value.trim();
    if(!ghToken) return alert("Token Required!");

    document.getElementById('token-input-area').classList.add('hidden');
    document.getElementById('upload-progress').classList.remove('hidden');
    
    let uploadedCount = 0;
    const total = selectedFiles.length;

    for(let file of selectedFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            const name = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            
            const res = await fetch(`https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/vault/${userEmail}/photos/${name}`, {
                method: "PUT",
                headers: { "Authorization": `token ${ghToken}` },
                body: JSON.stringify({ message: "web-upload", content: base64 })
            });

            uploadedCount++;
            let percent = Math.round((uploadedCount / total) * 100);
            document.getElementById('progress-bar').style.width = percent + "%";
            document.getElementById('progress-text').innerText = percent + "% Completed";

            if(uploadedCount === total) {
                setTimeout(() => {
                    alert("🚀 SUCCESS! All files added to your vault.");
                    closePopup();
                    loadVault();
                }, 500);
            }
        };
    }
}

async function deleteFile(p, s, t) {
    const res = await fetch(`https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/${p}`, {
        method: "DELETE",
        headers: { "Authorization": `token ${t}` },
        body: JSON.stringify({ message: "delete", sha: s })
    });
    if(res.ok) { closeViewer(); loadVault(); } else { alert("Delete failed! Invalid Token."); }
}

function closeViewer() { document.getElementById('viewer').classList.add('hidden'); }
function closePopup() { document.getElementById('token-popup').classList.add('hidden'); }
