const GITHUB = { user: "SIYAMBOSS", repo: "my-photo" };
let userEmail = sessionStorage.getItem('vault_user') || "";
let currentTab = 'photo';
let selectedFiles = [];

// পেজ লোড হলে অটো লগইন চেক
window.onload = () => { if(userEmail) showVault(); };

// লগইন লজিক
function login() {
    const email = document.getElementById('email-field').value.trim();
    if(email) {
        userEmail = email;
        sessionStorage.setItem('vault_user', userEmail);
        showVault();
    }
}

// লগআউট লজিক
function logout() { sessionStorage.removeItem('vault_user'); location.reload(); }

// ইন্টারফেস শো করা
function showVault() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('vault-ui').classList.remove('hidden');
    document.getElementById('user-display-top').innerText = `ACCESSING AS: ${userEmail}`;
    loadVault();
}

// ট্যাব সুইচ (Photo/Video)
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    loadVault();
}

// গ্যালারি এবং ৩ডি কারোসেল লোড করা
async function loadVault() {
    const grid = document.getElementById('gallery');
    const carousel = document.getElementById('carousel-3d');
    const path = `vault/${userEmail}/photos`;

    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/${path}`);
        if(!res.ok) throw new Error();
        const files = (await res.json()).reverse(); // নতুন ফাইল আগে আসবে
        
        grid.innerHTML = ''; carousel.innerHTML = '';
        let photoCount = 0;

        files.forEach(file => {
            const isVid = file.name.endsWith('.mp4');

            // ৩ডি কারোসেল: এখানে টপ ৮টি ফটো থাকবে
            if(!isVid && photoCount < 8) {
                const img = document.createElement('img');
                img.src = file.download_url;
                img.className = 'carousel-item';
                img.style.setProperty('--i', photoCount + 1);
                carousel.appendChild(img);
                photoCount++;
            }

            // মেইন গ্যালারি: এখানে আনলিমিটেড শো করবে
            if((currentTab === 'photo' && !isVid) || (currentTab === 'video' && isVid)) {
                const card = document.createElement('div');
                card.className = 'media-card bg-[#111] rounded-2xl overflow-hidden border border-white/5 relative group';
                card.onclick = () => openViewer(file.download_url, isVid, file.path, file.sha);
                card.innerHTML = isVid ? `<video src="${file.download_url}" class="w-full aspect-square object-cover opacity-60"></video><i class="fa-solid fa-play absolute inset-0 flex items-center justify-center text-white/40"></i>` 
                                       : `<img src="${file.download_url}" class="w-full aspect-square object-cover">`;
                grid.appendChild(card);
            }
        });
    } catch (e) { grid.innerHTML = `<p class="col-span-full text-center text-white/5 mt-20 italic">No files found.</p>`; }
}

// ফুলস্ক্রিন ভিউয়ার
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

// আপলোড পপআপ শো
function showTokenPopup() {
    selectedFiles = document.getElementById('file-input').files;
    if(selectedFiles.length > 0) {
        document.getElementById('token-popup').classList.remove('hidden');
        document.getElementById('token-input-area').classList.remove('hidden');
        document.getElementById('upload-progress').classList.add('hidden');
    }
}

// রকেট স্পিড প্যারালাল আপলোড
async function uploadFiles() {
    const ghToken = document.getElementById('upload-token').value.trim();
    if(!ghToken) return alert("Please enter GitHub Token!");

    document.getElementById('token-input-area').classList.add('hidden');
    document.getElementById('upload-progress').classList.remove('hidden');
    
    const total = selectedFiles.length;
    let uploadedCount = 0;

    // Parallel Uploading Logic (সব ছবি একসাথে আপলোড হবে)
    const promises = Array.from(selectedFiles).map(async (file) => {
        try {
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
            });

            const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${file.name.replace(/\s/g, '_')}`;
            
            const res = await fetch(`https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/vault/${userEmail}/photos/${uniqueName}`, {
                method: "PUT",
                headers: { "Authorization": `token ${ghToken}` },
                body: JSON.stringify({ message: "rocket-upload", content: base64 })
            });

            if(res.ok) {
                uploadedCount++;
                updateProgress(uploadedCount, total);
            }
        } catch (error) { console.error("Upload error:", error); }
    });

    await Promise.all(promises);

    setTimeout(() => {
        document.getElementById('token-popup').classList.add('hidden');
        document.getElementById('success-modal').classList.remove('hidden');
        loadVault();
    }, 800);
}

// প্রগ্রেস বার আপডেট
function updateProgress(c, t) {
    let p = Math.round((c / t) * 100);
    document.getElementById('progress-bar').style.width = p + "%";
    document.getElementById('progress-text').innerText = `${p}% Completed (${c}/${t})`;
}

// ডিলিট লজিক
async function deleteFile(p, s, t) {
    const res = await fetch(`https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/${p}`, {
        method: "DELETE",
        headers: { "Authorization": `token ${t}` },
        body: JSON.stringify({ message: "delete", sha: s })
    });
    if(res.ok) { closeViewer(); loadVault(); } else { alert("Delete failed! Check token."); }
}

// ক্লোজ ফাংশনসমূহ
function closeViewer() { document.getElementById('viewer').classList.add('hidden'); }
function closePopup() { document.getElementById('token-popup').classList.add('hidden'); }
function closeSuccessModal() { document.getElementById('success-modal').classList.add('hidden'); }
