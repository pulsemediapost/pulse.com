// ===== STATE =====
let videos = [];
let followedChannels = new Set();
let likedVideos = new Set();
let watchLaterVideos = new Set();
let historyVideos = [];
let playlists = [];
let comments = {};
let activeCategory = 'All';
let currentPlayingVideo = null;
let isPlaying = false;
let playInterval = null;
let playTime = 0;
let notifCount = 2;

// ===== CHANNELS =====
const channels = [
  { name: 'Alex Rivera', handle: '@alexrivera', avatarClass: 'avatar-gradient-1', initial: 'A' },
  { name: 'Sarah Chen', handle: '@sarahchen', avatarClass: 'avatar-gradient-2', initial: 'S' },
  { name: 'Marcus Dev', handle: '@marcusdev', avatarClass: 'avatar-gradient-3', initial: 'M' },
  { name: 'Luna Park', handle: '@lunapark', avatarClass: 'avatar-gradient-4', initial: 'L' },
  { name: 'Tech Daily', handle: '@techdaily', avatarClass: 'avatar-gradient-5', initial: 'T' },
  { name: 'Emma Wilson', handle: '@emmaw', avatarClass: 'avatar-gradient-6', initial: 'E' },
];

const categories = ['All', 'Learning', 'Music', 'Gaming', 'Sports', 'Trending'];
const thumbGradients = ['thumb-1', 'thumb-2', 'thumb-3', 'thumb-4', 'thumb-5', 'thumb-6', 'thumb-7', 'thumb-8', 'thumb-9', 'thumb-10', 'thumb-11', 'thumb-12'];

// ===== DOM REFS =====
const $ = (id) => document.getElementById(id);
const videoGrid = $('videoGrid');
const shortsGrid = $('shortsGrid');
const followingGrid = $('followingGrid');
const trendingGrid = $('trendingGrid');
const musicGrid = $('musicGrid');
const gamingGrid = $('gamingGrid');
const sportsGrid = $('sportsGrid');
const learningGrid = $('learningGrid');
const historyGrid = $('historyGrid');
const watchLaterGrid = $('watchLaterGrid');
const likedGrid = $('likedGrid');
const playlistsGrid = $('playlistsGrid');
const categoryBar = $('categoryBar');
const videoModal = $('videoModal');
const postModal = $('postModal');
const videoInfo = $('videoInfo');
const videoPlaceholder = $('videoPlaceholder');
const playPlaceholderBtn = $('playPlaceholderBtn');
const videoControls = $('videoControls');
const progressBar = $('progressBar');
const progressFill = $('progressFill');
const playPauseBtn = $('playPauseBtn');
const volumeBtn = $('volumeBtn');
const fullscreenBtn = $('fullscreenBtn');
const timeDisplay = $('timeDisplay');
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const menuToggle = $('menuToggle');
const sidebar = $('sidebar');
const sidebarRight = $('sidebarRight');
const sidebarFollowingList = $('sidebarFollowingList');
const suggestedList = $('suggestedList');
const trendingChannelsList = $('trendingChannelsList');
const toastContainer = $('toastContainer');
const notifBadge = $('notifBadge');
const postVideoBtn = $('postVideoBtn');
const closePostModal = $('closePostModal');
const submitVideoBtn = $('submitVideoBtn');
const cancelPostBtn = $('cancelPostBtn');
const closeVideoModal = $('closeVideoModal');
const videoTitleInput = $('videoTitle');
const videoDescInput = $('videoDesc');
const videoCategoryInput = $('videoCategory');
const videoDurationInput = $('videoDuration');
const clearHistoryBtn = $('clearHistoryBtn');
const logoHome = $('logoHome');
const notifBtn = $('notifBtn');
const micBtn = $('micBtn');
const createPlaylistBtn = $('createPlaylistBtn');
const playlistModal = $('playlistModal');
const playlistNameInput = $('playlistName');
const closePlaylistModal = $('closePlaylistModal');
const cancelPlaylistBtn = $('cancelPlaylistBtn');
const submitPlaylistBtn = $('submitPlaylistBtn');
const headerAvatar = $('headerAvatar');
const app = $('app');

// ===== PERSISTENCE =====
function saveState() {
  try {
    const state = {
      videos: videos,
      followedChannels: [...followedChannels],
      likedVideos: [...likedVideos],
      watchLaterVideos: [...watchLaterVideos],
      historyVideos: historyVideos.map(v => v.id),
      playlists: playlists,
      comments: comments,
    };
    localStorage.setItem('pulse_state', JSON.stringify(state));
  } catch (e) { /* storage full or unavailable */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem('pulse_state');
    if (!raw) return;
    const state = JSON.parse(raw);
    videos = state.videos || [];
    followedChannels = new Set(state.followedChannels || []);
    likedVideos = new Set(state.likedVideos || []);
    watchLaterVideos = new Set(state.watchLaterVideos || []);
    historyVideos = (state.historyVideos || []).map(id => videos.find(v => v.id === id)).filter(Boolean);
    playlists = state.playlists || [];
    comments = state.comments || {};
  } catch (e) { /* corrupted data, start fresh */ }
}

// ===== HELPERS =====
function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getVerifiedIcon() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;color:var(--text-secondary)"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function parseDuration(dur) {
  const parts = dur.split(':');
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return parseInt(parts[0]) || 600;
}

function timeAgo(dateStr) {
  if (dateStr === 'Just now') return 'Just now';
  return dateStr;
}

// ===== RENDER FUNCTIONS =====
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.dataset.videoId = video.id;
  card.innerHTML = `
    <div class="video-thumbnail">
      <div class="thumbnail-placeholder ${video.thumbnail}">${video.channelInitial}</div>
      <span class="video-duration">${video.duration}</span>
    </div>
    <div class="video-card-body">
      <div class="video-card-avatar ${video.channelAvatar}">${video.channelInitial}</div>
      <div class="video-card-info">
        <div class="video-card-title">${video.title}</div>
        <div class="video-card-channel">${video.channel} ${video.verified ? getVerifiedIcon() : ''}</div>
        <div class="video-card-meta">
          <span>${formatCount(video.views)} views</span>
          <span>${timeAgo(video.uploaded)}</span>
        </div>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openVideoModal(video));
  return card;
}

function renderGrid(gridEl, videoList) {
  if (!gridEl) return;
  gridEl.innerHTML = '';
  if (videoList.length === 0) {
    gridEl.innerHTML = '<div class="empty-state"><p>No videos yet</p></div>';
    return;
  }
  videoList.forEach((video) => {
    gridEl.appendChild(createVideoCard(video));
  });
}

function renderShorts() {
  if (!shortsGrid) return;
  shortsGrid.innerHTML = '';
  const shortsList = videos.slice(0, 6);
  if (shortsList.length === 0) {
    shortsGrid.innerHTML = '<div class="empty-state"><p>No shorts yet</p></div>';
    return;
  }
  shortsList.forEach((video) => {
    const card = document.createElement('div');
    card.className = 'shorts-card';
    card.innerHTML = `
      <div class="shorts-thumbnail">
        <div class="thumbnail-placeholder ${video.thumbnail}">${video.channelInitial}</div>
      </div>
      <div class="shorts-card-title">${video.title}</div>
      <div class="shorts-card-views">${formatCount(video.views)} views</div>
    `;
    card.addEventListener('click', () => openVideoModal(video));
    shortsGrid.appendChild(card);
  });
}

function renderCategories() {
  if (!categoryBar) return;
  categoryBar.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'category-chip' + (cat === activeCategory ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      activeCategory = cat;
      document.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filterVideos();
    });
    categoryBar.appendChild(chip);
  });
}

function filterVideos() {
  let filtered = [...videos];
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter((v) => v.title.toLowerCase().includes(query) || v.channel.toLowerCase().includes(query));
  }
  if (activeCategory !== 'All') {
    const catMap = { 'Learning': 'learning', 'Music': 'music', 'Gaming': 'gaming', 'Sports': 'sports', 'Trending': 'trending' };
    const cat = catMap[activeCategory];
    if (cat) filtered = filtered.filter((v) => v.category === cat);
  }
  renderGrid(videoGrid, filtered);
}

function renderSidebarFollowing() {
  if (!sidebarFollowingList) return;
  sidebarFollowingList.innerHTML = '';
  const followed = channels.filter((c) => followedChannels.has(c.name));
  if (followed.length === 0) {
    sidebarFollowingList.innerHTML = '<div style="padding:8px 14px;font-size:0.82rem;color:var(--text-secondary)">Follow channels to see them here</div>';
    return;
  }
  followed.forEach((c) => {
    const el = document.createElement('a');
    el.href = '#';
    el.className = 'sidebar-item';
    el.style.padding = '8px 14px';
    el.style.fontSize = '0.85rem';
    el.innerHTML = `<div class="avatar ${c.avatarClass} sidebar-sub-avatar">${c.initial}</div><span>${c.name}</span>`;
    el.addEventListener('click', (e) => { e.preventDefault(); navigateTo('following'); });
    sidebarFollowingList.appendChild(el);
  });
}

function renderSuggested() {
  if (!suggestedList) return;
  suggestedList.innerHTML = '';
  const notFollowed = channels.filter((c) => c.name !== 'Alex Rivera' && !followedChannels.has(c.name));
  const suggested = notFollowed.slice(0, 3);
  if (suggested.length === 0) {
    suggestedList.innerHTML = '<div style="font-size:0.82rem;color:var(--text-secondary)">You\'re following everyone!</div>';
    return;
  }
  suggested.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'suggested-user';
    el.innerHTML = `
      <div class="avatar ${c.avatarClass}">${c.initial}</div>
      <div class="suggested-info">
        <span class="suggested-name">${c.name}</span>
        <span class="suggested-handle">${c.handle}</span>
      </div>
      <button class="btn-follow">Follow</button>
    `;
    const btn = el.querySelector('.btn-follow');
    btn.addEventListener('click', () => {
      followedChannels.add(c.name);
      showToast('Following ' + c.name);
      renderSuggested();
      renderSidebarFollowing();
      saveState();
    });
    suggestedList.appendChild(el);
  });
}

function renderTrendingChannels() {
  if (!trendingChannelsList) return;
  trendingChannelsList.innerHTML = '';
  channels.slice(0, 4).forEach((c) => {
    const el = document.createElement('div');
    el.className = 'trending-channel-item';
    el.innerHTML = `
      <div class="avatar ${c.avatarClass}">${c.initial}</div>
      <div class="trending-channel-info">
        <div class="trending-channel-name">${c.name}</div>
        <div class="trending-channel-views">${Math.floor(Math.random() * 900 + 100)}K followers</div>
      </div>
    `;
    trendingChannelsList.appendChild(el);
  });
}

function renderPlaylists() {
  if (!playlistsGrid) return;
  playlistsGrid.innerHTML = '';
  if (playlists.length === 0) {
    playlistsGrid.innerHTML = '<div class="empty-state"><p>No playlists yet. Click "New playlist" to create one!</p></div>';
    return;
  }
  playlists.forEach((pl) => {
    const el = document.createElement('div');
    el.className = 'playlist-card';
    el.innerHTML = `
      <div class="playlist-thumbnail ${pl.gradient}">${pl.name.charAt(0)}</div>
      <div class="playlist-info">
        <div class="playlist-name">${pl.name}</div>
        <div class="playlist-count">${pl.videoCount} video${pl.videoCount !== 1 ? 's' : ''}</div>
      </div>
    `;
    el.addEventListener('click', () => showToast('Playing playlist: ' + pl.name));
    playlistsGrid.appendChild(el);
  });
}

function renderAll() {
  renderGrid(videoGrid, videos);
  renderShorts();
  renderGrid(followingGrid, videos.filter((v) => followedChannels.has(v.channel)));
  renderGrid(trendingGrid, videos.filter((v) => v.category === 'trending'));
  renderGrid(musicGrid, videos.filter((v) => v.category === 'music'));
  renderGrid(gamingGrid, videos.filter((v) => v.category === 'gaming'));
  renderGrid(sportsGrid, videos.filter((v) => v.category === 'sports'));
  renderGrid(learningGrid, videos.filter((v) => v.category === 'learning'));
  renderGrid(historyGrid, historyVideos);
  renderGrid(watchLaterGrid, videos.filter((v) => watchLaterVideos.has(v.id)));
  renderGrid(likedGrid, videos.filter((v) => likedVideos.has(v.id)));
  renderPlaylists();
}

// ===== NAVIGATION =====
function navigateTo(page) {
  document.querySelectorAll('.sidebar-item').forEach((i) => i.classList.remove('active'));
  const navItem = document.querySelector('.sidebar-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const viewEl = $('view-' + page);
  if (viewEl) viewEl.classList.add('active');
  if (page === 'home') {
    sidebarRight.style.display = '';
    app.classList.remove('no-rightbar');
  } else {
    sidebarRight.style.display = 'none';
    app.classList.add('no-rightbar');
  }
}

// ===== VIDEO MODAL =====
function openVideoModal(video) {
  historyVideos = historyVideos.filter((v) => v.id !== video.id);
  historyVideos.unshift(video);
  if (historyVideos.length > 50) historyVideos.pop();
  video.views = (video.views || 0) + 1;
  currentPlayingVideo = video;
  playTime = 0;
  isPlaying = false;

  const isFollowed = followedChannels.has(video.channel);
  const isLiked = likedVideos.has(video.id);
  const isWatchLater = watchLaterVideos.has(video.id);

  videoInfo.innerHTML = `
    <div class="video-info-title">${video.title}</div>
    <div class="video-info-channel">
      <div class="avatar ${video.channelAvatar}">${video.channelInitial}</div>
      <div>
        <div class="video-info-channel-name">${video.channel}</div>
        <div class="video-info-channel-subs">${Math.floor(Math.random() * 900 + 100)}K followers</div>
      </div>
      <button class="btn-follow ${isFollowed ? 'following' : ''}" style="margin-left:16px;">${isFollowed ? 'Following' : 'Follow'}</button>
    </div>
    <div class="video-info-actions">
      <button class="video-action-btn like-btn ${isLiked ? 'liked' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        <span>${formatCount(video.likes || 0)}</span>
      </button>
      <button class="video-action-btn watch-later-btn ${isWatchLater ? 'active-action' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${isWatchLater ? 'Saved' : 'Watch Later'}</span>
      </button>
      <button class="video-action-btn share-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        <span>Share</span>
      </button>
      <button class="video-action-btn download-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        <span>Download</span>
      </button>
    </div>
    <div class="video-info-desc">
      <strong>${formatCount(video.views)} views</strong> &middot; ${timeAgo(video.uploaded)}<br><br>
      ${video.description || 'No description.'}
    </div>
  `;

  // Comments
  const videoComments = comments[video.id] || [];
  const commentsHtml = videoComments.length > 0
    ? videoComments.map(c => `
        <div class="comment-item">
          <div class="avatar ${c.avatarClass}" style="width:32px;height:32px;font-size:0.7rem;">${c.initial}</div>
          <div class="comment-body">
            <div class="comment-author">${c.author} <span style="font-weight:400;font-size:0.75rem;color:var(--text-secondary);margin-left:6px;">${c.time}</span></div>
            <div class="comment-text">${c.text}</div>
          </div>
        </div>
      `).join('')
    : '<div class="no-comments">No comments yet. Be the first to share your thoughts!</div>';

  const commentsSection = document.createElement('div');
  commentsSection.className = 'comments-section';
  commentsSection.innerHTML = `
    <h3 class="comments-title">Comments (${videoComments.length})</h3>
    <div class="comments-list">${commentsHtml}</div>
    <div class="comment-input-wrap">
      <input type="text" class="comment-input" id="commentInput" placeholder="Add a comment..." />
      <button class="btn-post-small" id="submitCommentBtn" style="padding:8px 18px;font-size:0.8rem;">Post</button>
    </div>
  `;
  videoInfo.appendChild(commentsSection);

  // Wire up buttons
  const followBtn = videoInfo.querySelector('.btn-follow');
  followBtn.addEventListener('click', () => {
    if (followedChannels.has(video.channel)) {
      followedChannels.delete(video.channel);
      followBtn.textContent = 'Follow';
      followBtn.classList.remove('following');
      showToast('Unfollowed ' + video.channel);
    } else {
      followedChannels.add(video.channel);
      followBtn.textContent = 'Following';
      followBtn.classList.add('following');
      showToast('Following ' + video.channel);
    }
    renderSidebarFollowing();
    renderSuggested();
    saveState();
  });

  const likeBtn = videoInfo.querySelector('.like-btn');
  likeBtn.addEventListener('click', () => {
    if (likedVideos.has(video.id)) {
      likedVideos.delete(video.id);
      video.likes = Math.max(0, (video.likes || 0) - 1);
      likeBtn.classList.remove('liked');
      likeBtn.querySelector('svg').setAttribute('fill', 'none');
      showToast('Removed from liked videos');
    } else {
      likedVideos.add(video.id);
      video.likes = (video.likes || 0) + 1;
      likeBtn.classList.add('liked');
      likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
      showToast('Added to liked videos');
    }
    renderAll();
    saveState();
  });

  const watchLaterBtn = videoInfo.querySelector('.watch-later-btn');
  watchLaterBtn.addEventListener('click', () => {
    if (watchLaterVideos.has(video.id)) {
      watchLaterVideos.delete(video.id);
      watchLaterBtn.classList.remove('active-action');
      watchLaterBtn.querySelector('span').textContent = 'Watch Later';
      showToast('Removed from Watch Later');
    } else {
      watchLaterVideos.add(video.id);
      watchLaterBtn.classList.add('active-action');
      watchLaterBtn.querySelector('span').textContent = 'Saved';
      showToast('Added to Watch Later');
    }
    renderAll();
    saveState();
  });

  const shareBtn = videoInfo.querySelector('.share-btn');
  shareBtn.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href + '#video-' + video.id);
      showToast('Link copied to clipboard');
    } else {
      showToast('Share link: ' + window.location.href + '#video-' + video.id);
    }
  });

  const downloadBtn = videoInfo.querySelector('.download-btn');
  downloadBtn.addEventListener('click', () => showToast('Download started'));

  // Comment submit
  const commentInput = commentsSection.querySelector('#commentInput');
  const submitCommentBtn = commentsSection.querySelector('#submitCommentBtn');
  const postComment = () => {
    const text = commentInput.value.trim();
    if (!text) return;
    if (!comments[video.id]) comments[video.id] = [];
    comments[video.id].push({
      author: 'Alex Rivera',
      avatarClass: 'avatar-gradient-1',
      initial: 'A',
      text: text,
      time: 'Just now',
    });
    commentInput.value = '';
    showToast('Comment posted!');
    saveState();
    openVideoModal(video);
  };
  submitCommentBtn.addEventListener('click', postComment);
  commentInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') postComment(); });

  // Video player controls
  playPlaceholderBtn.classList.remove('playing');
  videoPlaceholder.style.display = 'flex';
  videoControls.style.display = 'none';
  progressFill.style.width = '0%';
  timeDisplay.textContent = '0:00 / ' + video.duration;

  videoModal.classList.add('open');
  renderAll();
  saveState();
}

// ===== VIDEO PLAYER =====
function togglePlay() {
  if (!currentPlayingVideo) return;
  isPlaying = !isPlaying;
  if (isPlaying) {
    videoPlaceholder.style.display = 'none';
    videoControls.style.display = 'block';
    playPauseBtn.querySelector('i').setAttribute('data-lucide', 'pause');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    playInterval = setInterval(() => {
      playTime++;
      const total = parseDuration(currentPlayingVideo.duration);
      const pct = Math.min((playTime / total) * 100, 100);
      progressFill.style.width = pct + '%';
      timeDisplay.textContent = formatTime(playTime) + ' / ' + currentPlayingVideo.duration;
      if (pct >= 100) {
        clearInterval(playInterval);
        isPlaying = false;
        playPauseBtn.querySelector('i').setAttribute('data-lucide', 'play');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }, 1000);
  } else {
    clearInterval(playInterval);
    playPauseBtn.querySelector('i').setAttribute('data-lucide', 'play');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// ===== POST VIDEO =====
function openPostModal() {
  postModal.classList.add('open');
  videoTitleInput.focus();
}
function closePostModal() {
  postModal.classList.remove('open');
  videoTitleInput.value = '';
  videoDescInput.value = '';
  videoDurationInput.value = '10:00';
  videoCategoryInput.value = 'learning';
}
function submitVideo() {
  const title = videoTitleInput.value.trim();
  const desc = videoDescInput.value.trim();
  const category = videoCategoryInput.value;
  const duration = videoDurationInput.value.trim() || '10:00';
  if (!title) { showToast('Please enter a title'); return; }
  const channel = channels[0];
  const newVideo = {
    id: Date.now(),
    title: title,
    channel: channel.name,
    channelAvatar: channel.avatarClass,
    channelInitial: channel.initial,
    views: 0,
    uploaded: 'Just now',
    duration: duration,
    thumbnail: thumbGradients[Math.floor(Math.random() * thumbGradients.length)],
    category: category,
    verified: true,
    description: desc,
    likes: 0,
  };
  videos.unshift(newVideo);
  closePostModal();
  renderAll();
  renderCategories();
  showToast('Video posted!');
  navigateTo('home');
  saveState();
}

// ===== EVENT LISTENERS =====
document.querySelectorAll('.sidebar-item[data-page]').forEach((item) => {
  item.addEventListener('click', (e) => { e.preventDefault(); navigateTo(item.dataset.page); });
});
logoHome.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
menuToggle.addEventListener('click', () => { sidebar.classList.toggle('collapsed'); });
searchBtn.addEventListener('click', () => { navigateTo('home'); filterVideos(); });
searchInput.addEventListener('input', () => {
  const activeView = document.querySelector('.view.active');
  if (activeView && activeView.id !== 'view-home') navigateTo('home');
  filterVideos();
});
postVideoBtn.addEventListener('click', openPostModal);
closePostModal.addEventListener('click', closePostModal);
cancelPostBtn.addEventListener('click', closePostModal);
submitVideoBtn.addEventListener('click', submitVideo);
postModal.addEventListener('click', (e) => { if (e.target === postModal) closePostModal(); });
closeVideoModal.addEventListener('click', () => {
  videoModal.classList.remove('open');
  clearInterval(playInterval);
  isPlaying = false;
});
videoModal.addEventListener('click', (e) => { if (e.target === videoModal) { videoModal.classList.remove('open'); clearInterval(playInterval); isPlaying = false; } });
playPlaceholderBtn.addEventListener('click', () => {
  if (!currentPlayingVideo) return;
  videoPlaceholder.style.display = 'none';
  videoControls.style.display = 'block';
  togglePlay();
  showToast('Playing: ' + currentPlayingVideo.title);
});
playPauseBtn.addEventListener('click', togglePlay);
volumeBtn.addEventListener('click', () => showToast('Volume control (demo)'));
fullscreenBtn.addEventListener('click', () => {
  const player = $('videoPlayer');
  if (player && player.requestFullscreen) player.requestFullscreen();
  else showToast('Fullscreen not supported');
});
progressBar.addEventListener('click', (e) => {
  if (!currentPlayingVideo) return;
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  playTime = Math.floor(pct * parseDuration(currentPlayingVideo.duration));
  progressFill.style.width = (pct * 100) + '%';
  timeDisplay.textContent = formatTime(playTime) + ' / ' + currentPlayingVideo.duration;
});
clearHistoryBtn.addEventListener('click', () => { historyVideos = []; renderAll(); showToast('Watch history cleared'); saveState(); });
notifBtn.addEventListener('click', () => { notifBadge.textContent = '0'; notifBadge.style.display = 'none'; showToast('No new notifications'); });
micBtn.addEventListener('click', () => showToast('Voice search not available in demo'));
headerAvatar.addEventListener('click', () => showToast('Profile page coming soon'));

// Create playlist
createPlaylistBtn.addEventListener('click', () => { playlistModal.classList.add('open'); playlistNameInput.focus(); });
closePlaylistModal.addEventListener('click', () => { playlistModal.classList.remove('open'); playlistNameInput.value = ''; });
cancelPlaylistBtn.addEventListener('click', () => { playlistModal.classList.remove('open'); playlistNameInput.value = ''; });
submitPlaylistBtn.addEventListener('click', () => {
  const name = playlistNameInput.value.trim();
  if (!name) { showToast('Please enter a playlist name'); return; }
  playlists.push({ name: name, videoCount: 0, gradient: thumbGradients[Math.floor(Math.random() * thumbGradients.length)] });
  playlistModal.classList.remove('open');
  playlistNameInput.value = '';
  renderPlaylists();
  showToast('Playlist created!');
  saveState();
});
playlistModal.addEventListener('click', (e) => { if (e.target === playlistModal) { playlistModal.classList.remove('open'); playlistNameInput.value = ''; } });

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    videoModal.classList.remove('open');
    postModal.classList.remove('open');
    playlistModal.classList.remove('open');
    clearInterval(playInterval);
    isPlaying = false;
  }
  if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== videoTitleInput && document.activeElement !== videoDescInput && document.activeElement !== playlistNameInput && document.activeElement !== commentInput) {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === ' ' && currentPlayingVideo && videoModal.classList.contains('open')) {
    e.preventDefault();
    togglePlay();
  }
  if (e.key === 'n' && document.activeElement !== searchInput && document.activeElement !== videoTitleInput && document.activeElement !== videoDescInput && document.activeElement !== playlistNameInput) {
    openPostModal();
  }
});

// ===== INITIALIZE =====
function init() {
  loadState();
  renderCategories();
  renderAll();
  renderSidebarFollowing();
  renderSuggested();
  renderTrendingChannels();
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try { lucide.createIcons(); } catch (e) { console.warn('Icons:', e); }
  }
}
init();
