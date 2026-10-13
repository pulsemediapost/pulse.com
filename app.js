// ===== STATE =====
let videos = [], followedChannels = new Set(), likedVideos = new Set(), watchLaterVideos = new Set();
let historyVideos = [], playlists = [], comments = {}, activeCategory = 'All';
let currentPlayingVideo = null, isPlaying = false, playInterval = null, playTime = 0;

const channels = [
  { name: 'Alex Rivera', handle: '@alexrivera', avatarClass: 'avatar-gradient-1', initial: 'A' },
  { name: 'Sarah Chen', handle: '@sarahchen', avatarClass: 'avatar-gradient-2', initial: 'S' },
  { name: 'Marcus Dev', handle: '@marcusdev', avatarClass: 'avatar-gradient-3', initial: 'M' },
  { name: 'Luna Park', handle: '@lunapark', avatarClass: 'avatar-gradient-4', initial: 'L' },
  { name: 'Tech Daily', handle: '@techdaily', avatarClass: 'avatar-gradient-5', initial: 'T' },
  { name: 'Emma Wilson', handle: '@emmaw', avatarClass: 'avatar-gradient-6', initial: 'E' },
];
const categories = ['All', 'Learning', 'Music', 'Gaming', 'Sports', 'Trending'];
const thumbGradients = ['thumb-1','thumb-2','thumb-3','thumb-4','thumb-5','thumb-6','thumb-7','thumb-8','thumb-9','thumb-10','thumb-11','thumb-12'];

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const videoGrid=$('videoGrid'), shortsGrid=$('shortsGrid'), followingGrid=$('followingGrid');
const trendingGrid=$('trendingGrid'), musicGrid=$('musicGrid'), gamingGrid=$('gamingGrid');
const sportsGrid=$('sportsGrid'), learningGrid=$('learningGrid'), historyGrid=$('historyGrid');
const watchLaterGrid=$('watchLaterGrid'), likedGrid=$('likedGrid'), playlistsGrid=$('playlistsGrid');
const categoryBar=$('categoryBar'), videoModal=$('videoModal'), postModal=$('postModal');
const videoInfo=$('videoInfo'), videoPlaceholder=$('videoPlaceholder'), playPlaceholderBtn=$('playPlaceholderBtn');
const videoControls=$('videoControls'), progressBar=$('progressBar'), progressFill=$('progressFill');
const playPauseBtn=$('playPauseBtn'), volumeBtn=$('volumeBtn'), fullscreenBtn=$('fullscreenBtn'), timeDisplay=$('timeDisplay');
const searchInput=$('searchInput'), searchBtn=$('searchBtn'), menuToggle=$('menuToggle'), sidebar=$('sidebar');
const sidebarRight=$('sidebarRight'), sidebarFollowingList=$('sidebarFollowingList');
const suggestedList=$('suggestedList'), trendingChannelsList=$('trendingChannelsList');
const toastContainer=$('toastContainer'), notifBadge=$('notifBadge'), postVideoBtn=$('postVideoBtn');
const closePostModal=$('closePostModal'), submitVideoBtn=$('submitVideoBtn'), cancelPostBtn=$('cancelPostBtn');
const closeVideoModal=$('closeVideoModal'), videoTitleInput=$('videoTitle'), videoDescInput=$('videoDesc');
const videoCategoryInput=$('videoCategory'), videoDurationInput=$('videoDuration');
const clearHistoryBtn=$('clearHistoryBtn'), logoHome=$('logoHome'), notifBtn=$('notifBtn'), micBtn=$('micBtn');
const createPlaylistBtn=$('createPlaylistBtn'), playlistModal=$('playlistModal'), playlistNameInput=$('playlistName');
const closePlaylistModal=$('closePlaylistModal'), cancelPlaylistBtn=$('cancelPlaylistBtn'), submitPlaylistBtn=$('submitPlaylistBtn');
const headerAvatar=$('headerAvatar'), app=$('app');

// ===== ICONS =====
const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
const pauseIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

// ===== HELPERS =====
function formatCount(n) { if(n>=1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'')+'M'; if(n>=1000) return (n/1000).toFixed(1).replace(/\.0$/,'')+'K'; return n.toString(); }
function showToast(msg) { const t=document.createElement('div'); t.className='toast'; t.textContent=msg; toastContainer.appendChild(t); setTimeout(()=>t.remove(),3000); }
function getVerifiedIcon() { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;color:var(--text-secondary)"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'; }
function formatTime(s) { const m=Math.floor(s/60), sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; }
function parseDuration(d) { const p=d.split(':'); if(p.length===2) return parseInt(p[0])*60+parseInt(p[1]); return parseInt(p[0])||600; }

// ===== PERSISTENCE =====
function saveState() { try { localStorage.setItem('pulse_state', JSON.stringify({ videos, followedChannels:[...followedChannels], likedVideos:[...likedVideos], watchLaterVideos:[...watchLaterVideos], historyVideos:historyVideos.map(v=>v.id), playlists, comments })); } catch(e){} }
function loadState() { try { const r=localStorage.getItem('pulse_state'); if(!r) return; const s=JSON.parse(r); videos=s.videos||[]; followedChannels=new Set(s.followedChannels||[]); likedVideos=new Set(s.likedVideos||[]); watchLaterVideos=new Set(s.watchLaterVideos||[]); historyVideos=(s.historyVideos||[]).map(id=>videos.find(v=>v.id===id)).filter(Boolean); playlists=s.playlists||[]; comments=s.comments||{}; } catch(e){} }

// ===== RENDER =====
function createVideoCard(video) {
  const c = document.createElement('div'); c.className='video-card'; c.dataset.videoId=video.id;
  c.innerHTML = '<div class="video-thumbnail"><div class="thumbnail-placeholder '+video.thumbnail+'">'+video.channelInitial+'</div><span class="video-duration">'+video.duration+'</span></div><div class="video-card-body"><div class="video-card-avatar '+video.channelAvatar+'">'+video.channelInitial+'</div><div class="video-card-info"><div class="video-card-title">'+video.title+'</div><div class="video-card-channel">'+video.channel+' '+(video.verified?getVerifiedIcon():'')+'</div><div class="video-card-meta"><span>'+formatCount(video.views)+' views</span><span>'+video.uploaded+'</span></div></div></div>';
  c.addEventListener('click', ()=>openVideoModal(video)); return c;
}
function renderGrid(g,l) { if(!g) return; g.innerHTML=''; if(!l.length) { g.innerHTML='<div class="empty-state"><p>No videos yet</p></div>'; return; } l.forEach(v=>g.appendChild(createVideoCard(v))); }
function renderShorts() { if(!shortsGrid) return; shortsGrid.innerHTML=''; const sl=videos.slice(0,6); if(!sl.length) { shortsGrid.innerHTML='<div class="empty-state"><p>No shorts yet</p></div>'; return; } sl.forEach(v => { const c=document.createElement('div'); c.className='shorts-card'; c.innerHTML='<div class="shorts-thumbnail"><div class="thumbnail-placeholder '+v.thumbnail+'">'+v.channelInitial+'</div></div><div class="shorts-card-title">'+v.title+'</div><div class="shorts-card-views">'+formatCount(v.views)+' views</div>'; c.addEventListener('click',()=>openVideoModal(v)); shortsGrid.appendChild(c); }); }
function renderCategories() { if(!categoryBar) return; categoryBar.innerHTML=''; categories.forEach(cat => { const c=document.createElement('button'); c.className='category-chip'+(cat===activeCategory?' active':''); c.textContent=cat; c.addEventListener('click',()=>{activeCategory=cat;document.querySelectorAll('.category-chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');filterVideos();}); categoryBar.appendChild(c); }); }
function filterVideos() { let f=[...videos]; const q=searchInput.value.toLowerCase().trim(); if(q) f=f.filter(v=>v.title.toLowerCase().includes(q)||v.channel.toLowerCase().includes(q)); if(activeCategory!=='All') { const cm={Learning:'learning',Music:'music',Gaming:'gaming',Sports:'sports',Trending:'trending'}; const c=cm[activeCategory]; if(c) f=f.filter(v=>v.category===c); } renderGrid(videoGrid,f); }
function renderSidebarFollowing() { if(!sidebarFollowingList) return; sidebarFollowingList.innerHTML=''; const f=channels.filter(c=>followedChannels.has(c.name)); if(!f.length) { sidebarFollowingList.innerHTML='<div style="padding:8px 14px;font-size:0.82rem;color:var(--text-secondary)">Follow channels to see them here</div>'; return; } f.forEach(c => { const e=document.createElement('a'); e.href='#'; e.className='sidebar-item'; e.style.padding='8px 14px'; e.style.fontSize='0.85rem'; e.innerHTML='<div class="avatar '+c.avatarClass+' sidebar-sub-avatar">'+c.initial+'</div><span>'+c.name+'</span>'; e.addEventListener('click',(ev)=>{ev.preventDefault();navigateTo('following');}); sidebarFollowingList.appendChild(e); }); }
function renderSuggested() { if(!suggestedList) return; suggestedList.innerHTML=''; const nf=channels.filter(c=>c.name!=='Alex Rivera'&&!followedChannels.has(c.name)); const s=nf.slice(0,3); if(!s.length) { suggestedList.innerHTML='<div style="font-size:0.82rem;color:var(--text-secondary)">You\'re following everyone!</div>'; return; } s.forEach(c => { const e=document.createElement('div'); e.className='suggested-user'; e.innerHTML='<div class="avatar '+c.avatarClass+'">'+c.initial+'</div><div class="suggested-info"><span class="suggested-name">'+c.name+'</span><span class="suggested-handle">'+c.handle+'</span></div><button class="btn-follow">Follow</button>'; const b=e.querySelector('.btn-follow'); b.addEventListener('click',()=>{followedChannels.add(c.name);showToast('Following '+c.name);renderSuggested();renderSidebarFollowing();saveState();}); suggestedList.appendChild(e); }); }
function renderTrendingChannels() { if(!trendingChannelsList) return; trendingChannelsList.innerHTML=''; channels.slice(0,4).forEach(c => { const e=document.createElement('div'); e.className='trending-channel-item'; e.innerHTML='<div class="avatar '+c.avatarClass+'">'+c.initial+'</div><div class="trending-channel-info"><div class="trending-channel-name">'+c.name+'</div><div class="trending-channel-views">'+Math.floor(Math.random()*900+100)+'K followers</div></div>'; trendingChannelsList.appendChild(e); }); }
function renderPlaylists() { if(!playlistsGrid) return; playlistsGrid.innerHTML=''; if(!playlists.length) { playlistsGrid.innerHTML='<div class="empty-state"><p>No playlists yet. Click "New playlist" to create one!</p></div>'; return; } playlists.forEach(pl => { const e=document.createElement('div'); e.className='playlist-card'; e.innerHTML='<div class="playlist-thumbnail '+pl.gradient+'">'+pl.name.charAt(0)+'</div><div class="playlist-info"><div class="playlist-name">'+pl.name+'</div><div class="playlist-count">'+pl.videoCount+' video'+(pl.videoCount!==1?'s':'')+'</div></div>'; e.addEventListener('click',()=>showToast('Playing playlist: '+pl.name)); playlistsGrid.appendChild(e); }); }
function renderAll() { renderGrid(videoGrid,videos); renderShorts(); renderGrid(followingGrid,videos.filter(v=>followedChannels.has(v.channel))); renderGrid(trendingGrid,videos.filter(v=>v.category==='trending')); renderGrid(musicGrid,videos.filter(v=>v.category==='music')); renderGrid(gamingGrid,videos.filter(v=>v.category==='gaming')); renderGrid(sportsGrid,videos.filter(v=>v.category==='sports')); renderGrid(learningGrid,videos.filter(v=>v.category==='learning')); renderGrid(historyGrid,historyVideos); renderGrid(watchLaterGrid,videos.filter(v=>watchLaterVideos.has(v.id))); renderGrid(likedGrid,videos.filter(v=>likedVideos.has(v.id))); renderPlaylists(); }

// ===== NAVIGATION =====
function navigateTo(page) { document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active')); const ni=document.querySelector('.sidebar-item[data-page="'+page+'"]'); if(ni) ni.classList.add('active'); document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); const ve=$('view-'+page); if(ve) ve.classList.add('active'); if(page==='home'){sidebarRight.style.display='';app.classList.remove('no-rightbar');}else{sidebarRight.style.display='none';app.classList.add('no-rightbar');} }

// ===== VIDEO MODAL =====
function openVideoModal(video) {
  historyVideos=historyVideos.filter(v=>v.id!==video.id); historyVideos.unshift(video); if(historyVideos.length>50)historyVideos.pop();
  video.views=(video.views||0)+1; currentPlayingVideo=video; playTime=0; isPlaying=false;
  const isF=followedChannels.has(video.channel), isL=likedVideos.has(video.id), isW=watchLaterVideos.has(video.id);
  videoInfo.innerHTML='<div class="video-info-title">'+video.title+'</div><div class="video-info-channel"><div class="avatar '+video.channelAvatar+'">'+video.channelInitial+'</div><div><div class="video-info-channel-name">'+video.channel+'</div><div class="video-info-channel-subs">'+Math.floor(Math.random()*900+100)+'K followers</div></div><button class="btn-follow'+(isF?' following':'')+'" style="margin-left:16px;">'+(isF?'Following':'Follow')+'</button></div><div class="video-info-actions"><button class="video-action-btn like-btn'+(isL?' liked':'')+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="'+(isL?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg><span>'+formatCount(video.likes||0)+'</span></button><button class="video-action-btn watch-later-btn'+(isW?' active-action':'')+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>'+(isW?'Saved':'Watch Later')+'</span></button><button class="video-action-btn share-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg><span>Share</span></button><button class="video-action-btn download-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>Download</span></button></div><div class="video-info-desc"><strong>'+formatCount(video.views)+' views</strong> &middot; '+video.uploaded+'<br><br>'+(video.description||'No description.')+'</div>';
  const vc=comments[video.id]||[];
  const ch=vc.length?vc.map(c=>'<div class="comment-item"><div class="avatar '+c.avatarClass+'" style="width:32px;height:32px;font-size:0.7rem;">'+c.initial+'</div><div class="comment-body"><div class="comment-author">'+c.author+' <span style="font-weight:400;font-size:0.75rem;color:var(--text-secondary);margin-left:6px;">'+c.time+'</span></div><div class="comment-text">'+c.text+'</div></div></div>').join(''):'<div class="no-comments">No comments yet. Be the first to share your thoughts!</div>';
  const cs=document.createElement('div'); cs.className='comments-section'; cs.innerHTML='<h3 class="comments-title">Comments ('+vc.length+')</h3><div class="comments-list">'+ch+'</div><div class="comment-input-wrap"><input type="text" class="comment-input" id="commentInput" placeholder="Add a comment..." /><button class="btn-post-small" id="submitCommentBtn" style="padding:8px 18px;font-size:0.8rem;">Post</button></div>';
  videoInfo.appendChild(cs);
  const fb=videoInfo.querySelector('.btn-follow'); fb.addEventListener('click',()=>{if(followedChannels.has(video.channel)){followedChannels.delete(video.channel);fb.textContent='Follow';fb.classList.remove('following');showToast('Unfollowed '+video.channel);}else{followedChannels.add(video.channel);fb.textContent='Following';fb.classList.add('following');showToast('Following '+video.channel);}renderSidebarFollowing();renderSuggested();saveState();});
  const lb=videoInfo.querySelector('.like-btn'); lb.addEventListener('click',()=>{if(likedVideos.has(video.id)){likedVideos.delete(video.id);video.likes=Math.max(0,(video.likes||0)-1);lb.classList.remove('liked');lb.querySelector('svg').setAttribute('fill','none');showToast('Removed from liked videos');}else{likedVideos.add(video.id);video.likes=(video.likes||0)+1;lb.classList.add('liked');lb.querySelector('svg').setAttribute('fill','currentColor');showToast('Added to liked videos');}renderAll();saveState();});
  const wb=videoInfo.querySelector('.watch-later-btn'); wb.addEventListener('click',()=>{if(watchLaterVideos.has(video.id)){watchLaterVideos.delete(video.id);wb.classList.remove('active-action');wb.querySelector('span').textContent='Watch Later';showToast('Removed from Watch Later');}else{watchLaterVideos.add(video.id);wb.classList.add('active-action');wb.querySelector('span').textContent='Saved';showToast('Added to Watch Later');}renderAll();saveState();});
  const sb=videoInfo.querySelector('.share-btn'); sb.addEventListener('click',()=>{if(navigator.clipboard){navigator.clipboard.writeText(window.location.href+'#video-'+video.id);showToast('Link copied to clipboard');}else{showToast('Share link: '+window.location.href+'#video-'+video.id);}});
  const db=videoInfo.querySelector('.download-btn'); db.addEventListener('click',()=>showToast('Download started'));
  const ci=cs.querySelector('#commentInput'), scb=cs.querySelector('#submitCommentBtn'); const pc=()=>{const t=ci.value.trim();if(!t)return;if(!comments[video.id])comments[video.id]=[];comments[video.id].push({author:'Alex Rivera',avatarClass:'avatar-gradient-1',initial:'A',text:t,time:'Just now'});ci.value='';showToast('Comment posted!');saveState();openVideoModal(video);}; scb.addEventListener('click',pc); ci.addEventListener('keydown',(e)=>{if(e.key==='Enter')pc();});
  if(playPlaceholderBtn)playPlaceholderBtn.classList.remove('playing'); if(videoPlaceholder)videoPlaceholder.style.display='flex'; if(videoControls)videoControls.style.display='none'; if(progressFill)progressFill.style.width='0%'; if(timeDisplay)timeDisplay.textContent='0:00 / '+video.duration;
  videoModal.classList.add('open'); renderAll(); saveState();
}

// ===== PLAYER =====
function togglePlay() { if(!currentPlayingVideo)return; isPlaying=!isPlaying; if(isPlaying){videoPlaceholder.style.display='none';videoControls.style.display='block';playPauseBtn.innerHTML=pauseIcon;playInterval=setInterval(()=>{playTime++;const total=parseDuration(currentPlayingVideo.duration);const pct=Math.min((playTime/total)*100,100);progressFill.style.width=pct+'%';timeDisplay.textContent=formatTime(playTime)+' / '+currentPlayingVideo.duration;if(pct>=100){clearInterval(playInterval);isPlaying=false;playPauseBtn.innerHTML=playIcon;}},1000);}else{clearInterval(playInterval);playPauseBtn.innerHTML=playIcon;} }
function openPostModal(){postModal.classList.add('open');videoTitleInput.focus();}
function closePostModal(){postModal.classList.remove('open');videoTitleInput.value='';videoDescInput.value='';videoDurationInput.value='10:00';videoCategoryInput.value='learning';}
function submitVideo(){const title=videoTitleInput.value.trim(),desc=videoDescInput.value.trim(),category=videoCategoryInput.value,duration=videoDurationInput.value.trim()||'10:00';if(!title){showToast('Please enter a title');return;}const channel=channels[0];const newVideo={id:Date.now(),title:title,channel:channel.name,channelAvatar:channel.avatarClass,channelInitial:channel.initial,views:0,uploaded:'Just now',duration:duration,thumbnail:thumbGradients[Math.floor(Math.random()*thumbGradients.length)],category:category,verified:true,description:desc,likes:0};videos.unshift(newVideo);closePostModal();renderAll();renderCategories();showToast('Video posted!');navigateTo('home');saveState();}

// ===== EVENTS =====
document.querySelectorAll('.sidebar-item[data-page]').forEach(item=>{item.addEventListener('click',(e)=>{e.preventDefault();navigateTo(item.dataset.page);});});
logoHome.addEventListener('click',(e)=>{e.preventDefault();navigateTo('home');});
menuToggle.addEventListener('click',()=>{sidebar.classList.toggle('collapsed');});
searchBtn.addEventListener('click',()=>{navigateTo('home');filterVideos();});
searchInput.addEventListener('input',()=>{const av=document.querySelector('.view.active');if(av&&av.id!=='view-home')navigateTo('home');filterVideos();});
postVideoBtn.addEventListener('click',openPostModal);closePostModal.addEventListener('click',closePostModal);cancelPostBtn.addEventListener('click',closePostModal);submitVideoBtn.addEventListener('click',submitVideo);
postModal.addEventListener('click',(e)=>{if(e.target===postModal)closePostModal();});
closeVideoModal.addEventListener('click',()=>{videoModal.classList.remove('open');clearInterval(playInterval);isPlaying=false;});
videoModal.addEventListener('click',(e)=>{if(e.target===videoModal){videoModal.classList.remove('open');clearInterval(playInterval);isPlaying=false;}});
playPlaceholderBtn.addEventListener('click',()=>{if(!currentPlayingVideo)return;videoPlaceholder.style.display='none';videoControls.style.display='block';togglePlay();showToast('Playing: '+currentPlayingVideo.title);});
playPauseBtn.addEventListener('click',togglePlay);
volumeBtn.addEventListener('click',()=>showToast('Volume control (demo)'));
fullscreenBtn.addEventListener('click',()=>{const p=$('videoPlayer');if(p&&p.requestFullscreen)p.requestFullscreen();else showToast('Fullscreen not supported');});
progressBar.addEventListener('click',(e)=>{if(!currentPlayingVideo)return;const r=progressBar.getBoundingClientRect();const pct=(e.clientX-r.left)/r.width;playTime=Math.floor(pct*parseDuration(currentPlayingVideo.duration));progressFill.style.width=(pct*100)+'%';timeDisplay.textContent=formatTime(playTime)+' / '+currentPlayingVideo.duration;});
clearHistoryBtn.addEventListener('click',()=>{historyVideos=[];renderAll();showToast('Watch history cleared');saveState();});
notifBtn.addEventListener('click',()=>{notifBadge.textContent='0';notifBadge.style.display='none';showToast('No new notifications');});
micBtn.addEventListener('click',()=>showToast('Voice search not available in demo'));
headerAvatar.addEventListener('click',()=>showToast('Profile page coming soon'));
createPlaylistBtn.addEventListener('click',()=>{playlistModal.classList.add('open');playlistNameInput.focus();});
closePlaylistModal.addEventListener('click',()=>{playlistModal.classList.remove('open');playlistNameInput.value='';});
cancelPlaylistBtn.addEventListener('click',()=>{playlistModal.classList.remove('open');playlistNameInput.value='';});
submitPlaylistBtn.addEventListener('click',()=>{const name=playlistNameInput.value.trim();if(!name){showToast('Please enter a playlist name');return;}playlists.push({name:name,videoCount:0,gradient:thumbGradients[Math.floor(Math.random()*thumbGradients.length)]});playlistModal.classList.remove('open');playlistNameInput.value='';renderPlaylists();showToast('Playlist created!');saveState();});
playlistModal.addEventListener('click',(e)=>{if(e.target===playlistModal){playlistModal.classList.remove('open');playlistNameInput.value='';}});
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){videoModal.classList.remove('open');postModal.classList.remove('open');playlistModal.classList.remove('open');clearInterval(playInterval);isPlaying=false;}
  if(e.key==='/'&&document.activeElement!==searchInput&&document.activeElement!==videoTitleInput&&document.activeElement!==videoDescInput&&document.activeElement!==playlistNameInput&&document.activeElement!==commentInput){e.preventDefault();searchInput.focus();}
  if(e.key===' '&&currentPlayingVideo&&videoModal.classList.contains('open')){e.preventDefault();togglePlay();}
  if(e.key==='n'&&document.activeElement!==searchInput&&document.activeElement!==videoTitleInput&&document.activeElement!==videoDescInput&&document.activeElement!==playlistNameInput){openPostModal();}
});

// ===== INIT =====
function init(){loadState();renderCategories();renderAll();renderSidebarFollowing();renderSuggested();renderTrendingChannels();}
init();
