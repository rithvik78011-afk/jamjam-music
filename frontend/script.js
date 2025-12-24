const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('searchResultsList');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn'); 
const playIcon = playBtn.querySelector('i');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const playlistContainer = document.getElementById('playlistContainer');
const playlistPlayBtn = document.getElementById('playlistPlayBtn');

// NEW BUTTONS
const loopBtn = document.getElementById('loopBtn');
const speedBtn = document.getElementById('speedBtn');
const downloadBtn = document.getElementById('downloadBtn');

const BACKEND_URL = 'http://127.0.0.1:5000';

let allSongs = [];
let currentIndex = 0;
let isPlaying = false;
let isLooping = false;
const playbackSpeeds = [1.0, 1.5, 2.0, 0.5];
let speedIndex = 0;

// Fake Data for Columns
function getRandomDuration() {
    const min = 2 + Math.floor(Math.random() * 3); 
    const sec = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}
function getDateAdded() { return "Dec 23, 2025"; }

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/songs`);
        if (!res.ok) throw new Error("Server Error");
        allSongs = await res.json();
        renderPlaylist();
    } catch (err) {
        console.error("Error loading songs:", err);
        playlistContainer.innerHTML = `<div style="padding:20px; color:#ff9999; text-align:center;"><strong>Connection Failed</strong><br>Check Python Server</div>`;
    }
});

function renderPlaylist() {
    playlistContainer.innerHTML = '';
    allSongs.forEach((song, index) => {
        const div = document.createElement('div');
        div.className = `playlist-item ${index === currentIndex ? 'active' : ''}`;
        div.setAttribute('id', `song-row-${index}`);
        
        div.innerHTML = `
            <div class="col-index">${index + 1}</div>
            <div class="col-title">
                <img src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?q=80&w=1740&auto=format&fit=crop" alt="art">
                <div>
                    <span class="song-name">${song.title}</span>
                    <span class="sub-artist">${song.artist}</span>
                </div>
            </div>
            <div class="col-album">JamJam Hits</div>
            <div class="col-date">${getDateAdded()}</div>
            <div class="col-time">${getRandomDuration()}</div>
        `;
        
        div.addEventListener('click', () => {
            currentIndex = index;
            loadAndPlaySong(allSongs[currentIndex]);
        });
        playlistContainer.appendChild(div);
    });
}

// Search
searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length === 0) { resultsList.innerHTML = ''; return; }
    try {
        const res = await fetch(`${BACKEND_URL}/search?q=${query}`);
        const results = await res.json();
        resultsList.innerHTML = '';
        results.forEach(song => {
            const div = document.createElement('div');
            div.style.padding = '10px'; div.style.cursor = 'pointer';
            div.style.borderBottom = '1px solid #333';
            div.innerHTML = `<strong style="color:white">${song.title}</strong> <span style="color:#aaa"> - ${song.artist}</span>`;
            div.addEventListener('click', () => {
                const foundIndex = allSongs.findIndex(s => s.id === song.id);
                if(foundIndex !== -1) currentIndex = foundIndex;
                loadAndPlaySong(song);
                resultsList.innerHTML = '';
                searchInput.value = '';
            });
            resultsList.appendChild(div);
        });
    } catch(err) { console.error(err); }
});

// === PLAYER LOGIC ===
function loadAndPlaySong(song) {
    currentTitle.innerText = song.title;
    currentArtist.innerText = song.artist;
    audioPlayer.src = `${BACKEND_URL}/stream/${song.filename}`;
    
    // Maintain speed setting between songs
    audioPlayer.playbackRate = playbackSpeeds[speedIndex];

    // Highlight Active Row & Scroll
    document.querySelectorAll('.playlist-item').forEach((row, idx) => {
        if(idx === currentIndex) {
            row.classList.add('active');
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            row.classList.remove('active');
        }
    });

    playSong();
}

function playSong() {
    isPlaying = true;
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    audioPlayer.play();
}

function pauseSong() {
    isPlaying = false;
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    audioPlayer.pause();
}

// === BUTTON EVENTS ===

// 1. Loop Button
loopBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    audioPlayer.loop = isLooping;
    loopBtn.classList.toggle('active', isLooping);
});

// 2. Speed Button
speedBtn.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % playbackSpeeds.length;
    const newSpeed = playbackSpeeds[speedIndex];
    audioPlayer.playbackRate = newSpeed;
    speedBtn.innerText = newSpeed + 'x';
});

// 3. Download Button
downloadBtn.addEventListener('click', () => {
    if(allSongs.length > 0) {
        const song = allSongs[currentIndex];
        const link = document.createElement('a');
        link.href = `${BACKEND_URL}/stream/${song.filename}`;
        link.download = song.filename; // Suggests filename to browser
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

// 4. Standard Controls
playBtn.addEventListener('click', togglePlay);
playlistPlayBtn.addEventListener('click', togglePlay);

function togglePlay() {
    if (!audioPlayer.src && allSongs.length > 0) loadAndPlaySong(allSongs[0]);
    else isPlaying ? pauseSong() : playSong();
}

document.getElementById('nextBtn').addEventListener('click', () => {
    if (allSongs.length === 0) return;
    currentIndex = (currentIndex + 1) % allSongs.length;
    loadAndPlaySong(allSongs[currentIndex]);
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (allSongs.length === 0) return;
    currentIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
    loadAndPlaySong(allSongs[currentIndex]);
});

// Progress Bar
audioPlayer.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if(duration) progressBar.style.width = `${(currentTime / duration) * 100}%`;
});

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
});

audioPlayer.addEventListener('ended', () => {
    if(!isLooping) document.getElementById('nextBtn').click();
});