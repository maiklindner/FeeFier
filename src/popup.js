let currentMessages = {};
let currentUnreadItems = [];

function getMessage(key) {
  return currentMessages[key] ? currentMessages[key].message : key;
}

function initLocalization(callback) {
  chrome.storage.sync.get({ language: 'auto' }, (data) => {
    let lang = data.language;
    if (lang === 'auto') {
      lang = chrome.i18n.getUILanguage().replace('-', '_');
      const supported = ['en', 'de', 'es', 'fr', 'ja', 'pt_BR', 'zh_CN'];
      if (!supported.includes(lang)) {
        lang = lang.split('_')[0];
        if (!supported.includes(lang)) lang = 'en';
      }
    }
    
    fetch(`/_locales/${lang}/messages.json`)
      .then(res => res.ok ? res.json() : fetch(`/_locales/en/messages.json`).then(r => r.json()))
      .then(messages => {
        currentMessages = messages;
        localizeHtmlPage();
        if (callback) callback();
      })
      .catch(err => {
        console.error("Failed to load locales", err);
        if (callback) callback();
      });
  });
}

function localizeHtmlPage() {
  const titleEl = document.getElementById('popupH1');
  if (titleEl) titleEl.textContent = getMessage('extName');
  document.querySelectorAll('#newsTabBtn').forEach(el => el.textContent = getMessage('popupTabNews') || 'News');
  document.querySelectorAll('#discoveryTabBtn').forEach(el => el.textContent = getMessage('popupTabDiscovery') || 'Page Feeds');
  document.getElementById('emptyMsg').textContent = getMessage('popupEmpty');
  document.getElementById('discoveryEmptyMsg').textContent = getMessage('popupNoFeedsFound') || 'No feeds found on this page';
  
  document.getElementById('refreshBtn').title = getMessage('popupRefresh');
  document.getElementById('openAllBtn').title = getMessage('popupOpenAll');
  document.getElementById('markReadBtn').title = getMessage('popupMarkRead');
  document.getElementById('settingsBtn').title = getMessage('optionsTitle');
}

function renderList() {
  const emptyState = document.getElementById('emptyState');
  const listContainer = document.getElementById('listContainer');
  
  if (!currentUnreadItems || currentUnreadItems.length === 0) {
    emptyState.style.display = 'flex';
    listContainer.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  listContainer.style.display = 'block';
  listContainer.innerHTML = '';
  
  currentUnreadItems.forEach((item, index) => {
    let sourceText = item.feedName || 'Unknown source';
    try {
      if (!item.feedName && item.feedUrl) {
         sourceText = new URL(item.feedUrl).hostname;
      }
    } catch(e) {}

    const div = document.createElement('div');
    div.className = 'feed-item';
    
    const content = document.createElement('div');
    content.className = 'feed-item-content';
    content.addEventListener('click', (e) => handleItemClick(index, item.link, e));
    content.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        handleItemClick(index, item.link, e);
      }
    });
    
    const title = document.createElement('div');
    title.className = 'feed-item-title';
    title.textContent = item.title || 'No Title';
    
    const source = document.createElement('div');
    source.className = 'feed-item-domain';
    source.textContent = sourceText;
    
    content.appendChild(title);
    content.appendChild(source);
    
    const checkBtn = document.createElement('button');
    checkBtn.className = 'item-check-btn';
    checkBtn.title = 'Mark as read';
    checkBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleMarkItemAsRead(index);
    });
    
    div.appendChild(content);
    div.appendChild(checkBtn);
    listContainer.appendChild(div);
  });
}

function handleMarkItemAsRead(index) {
  currentUnreadItems.splice(index, 1);
  chrome.storage.local.set({ unreadItems: currentUnreadItems }, () => {
    renderList();
    // Update badge count
    chrome.runtime.sendMessage({ action: 'updateBadge' });
  });
}

function handleItemClick(index, url, event) {
  if (url) {
    chrome.storage.sync.get({ openInBackground: false }, (data) => {
      const isModifier = event && (event.button === 1 || event.ctrlKey || event.metaKey);
      const shouldOpenInBackground = data.openInBackground || isModifier;
      chrome.tabs.create({ url: url, active: !shouldOpenInBackground });
    });
  }
  
  currentUnreadItems.splice(index, 1);
  chrome.storage.local.set({ unreadItems: currentUnreadItems }, () => {
    renderList();
  });
}

function renderDiscoverySection() {
  const discoveryItems = document.getElementById('discoveryItems');
  const discoveryEmptyState = document.getElementById('discoveryEmptyState');
  const discoveryList = document.getElementById('discoveryList');
  
  chrome.runtime.sendMessage({ action: 'getDiscoveredFeeds' }, (response) => {
    const feeds = response?.feeds || [];
    if (feeds.length === 0) {
      discoveryList.style.display = 'none';
      discoveryEmptyState.style.display = 'flex';
      return;
    }
    
    discoveryList.style.display = 'block';
    discoveryEmptyState.style.display = 'none';
    discoveryItems.innerHTML = '';
    
    chrome.storage.sync.get({ feeds: [] }, (data) => {
      const subscribedFeeds = data.feeds;
      const normalizeUrl = (u) => u.replace(/\/$/, '').toLowerCase().trim();
      
      feeds.forEach(feed => {
        const normalizedDiscovered = normalizeUrl(feed.url);
        const existingFeed = subscribedFeeds.find(f => normalizeUrl(f.url) === normalizedDiscovered);
        
        const item = document.createElement('div');
        item.className = 'discovery-item';
        
        const main = document.createElement('div');
        main.className = 'discovery-main';
        
        const info = document.createElement('div');
        info.className = 'discovery-info';
        
        const title = document.createElement('span');
        title.className = 'discovery-title';
        title.textContent = (existingFeed && existingFeed.name) ? existingFeed.name : feed.title;
        
        const url = document.createElement('span');
        url.className = 'discovery-url';
        url.textContent = feed.url;
        
        info.appendChild(title);
        info.appendChild(url);
        main.appendChild(info);
        
        const actions = document.createElement('div');
        actions.className = 'discovery-actions';
        
        if (existingFeed) {
          const intervalWrapper = document.createElement('div');
          intervalWrapper.className = 'interval-input-wrapper';
          
          const input = document.createElement('input');
          input.type = 'number';
          input.className = 'interval-input';
          input.value = existingFeed.interval || 30;
          input.min = 1;
          input.addEventListener('change', () => handleIntervalChange(existingFeed.id, input.value));
          
          const unit = document.createElement('span');
          unit.className = 'interval-unit';
          unit.textContent = 'min';
          
          intervalWrapper.appendChild(input);
          intervalWrapper.appendChild(unit);
          actions.appendChild(intervalWrapper);
          
          const unsubBtn = document.createElement('button');
          unsubBtn.className = 'discovery-btn unsubscribe';
          unsubBtn.title = getMessage('optionsRemoveFeed') || 'Unsubscribe';
          unsubBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
          unsubBtn.addEventListener('click', () => handleUnsubscribe(existingFeed.id));
          actions.appendChild(unsubBtn);
        } else {
          const subBtn = document.createElement('button');
          subBtn.className = 'discovery-btn subscribe';
          subBtn.title = getMessage('optionsAddFeed') || 'Subscribe';
          subBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
          subBtn.addEventListener('click', () => handleSubscribe(feed));
          actions.appendChild(subBtn);
        }
        
        main.appendChild(actions);
        item.appendChild(main);
        discoveryItems.appendChild(item);
      });
    });
  });
}

function handleSubscribe(feed) {
  chrome.storage.sync.get({ feeds: [] }, (data) => {
    const feeds = data.feeds;
    const normalizeUrl = (u) => u.replace(/\/$/, '').toLowerCase().trim();
    const normalizedTarget = normalizeUrl(feed.url);
    
    if (!feeds.some(f => normalizeUrl(f.url) === normalizedTarget)) {
      feeds.push({
        id: Date.now().toString(),
        name: feed.title,
        url: feed.url,
        interval: 30,
        enabled: true
      });
      chrome.storage.sync.set({ feeds: feeds }, () => {
        renderDiscoverySection();
      });
    }
  });
}

function handleUnsubscribe(feedId) {
  chrome.storage.sync.get({ feeds: [] }, (data) => {
    const feeds = data.feeds.filter(f => f.id !== feedId);
    chrome.storage.sync.set({ feeds: feeds }, () => {
      renderDiscoverySection();
    });
  });
}

function handleIntervalChange(feedId, newValue) {
  const interval = parseInt(newValue);
  if (isNaN(interval) || interval < 1) return;
  
  chrome.storage.sync.get({ feeds: [] }, (data) => {
    const feeds = data.feeds.map(f => {
      if (f.id === feedId) {
        return { ...f, interval: interval };
      }
      return f;
    });
    chrome.storage.sync.set({ feeds: feeds });
  });
}

function switchTab(tabName) {
  const newsTabBtn = document.getElementById('newsTabBtn');
  const discoveryTabBtn = document.getElementById('discoveryTabBtn');
  const newsView = document.getElementById('newsView');
  const discoveryView = document.getElementById('discoveryView');
  const navSlider = document.getElementById('navSlider');
  
  if (tabName === 'news') {
    newsTabBtn.classList.add('active');
    discoveryTabBtn.classList.remove('active');
    newsView.classList.add('active');
    discoveryView.classList.remove('active');
    navSlider.style.transform = 'translateX(0)';
  } else {
    newsTabBtn.classList.remove('active');
    discoveryTabBtn.classList.add('active');
    newsView.classList.remove('active');
    discoveryView.classList.add('active');
    navSlider.style.transform = 'translateX(100%)';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLocalization(() => {
    chrome.storage.local.get({ unreadItems: [] }, (data) => {
      currentUnreadItems = data.unreadItems;
      renderList();
      renderDiscoverySection();
    });
  });

  document.getElementById('newsTabBtn').addEventListener('click', () => switchTab('news'));
  document.getElementById('discoveryTabBtn').addEventListener('click', () => switchTab('discovery'));
  
  document.getElementById('openAllBtn').addEventListener('click', () => {
    if (!currentUnreadItems || currentUnreadItems.length === 0) return;
    currentUnreadItems.forEach(item => {
      if (item.link) chrome.tabs.create({ url: item.link, active: false });
    });
    currentUnreadItems = [];
    chrome.storage.local.set({ unreadItems: [] }, () => { renderList(); });
  });

  document.getElementById('refreshBtn').addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    const svg = btn.querySelector('svg');
    svg.style.animation = 'spin 1s linear infinite';
    btn.disabled = true;

    chrome.runtime.sendMessage({ action: 'forceCheckFeeds' }, () => {
      setTimeout(() => {
        chrome.storage.local.get({ unreadItems: [] }, (data) => {
          currentUnreadItems = data.unreadItems;
          renderList();
          svg.style.animation = '';
          btn.disabled = false;
        });
      }, 1500); 
    });
  });
  
  document.getElementById('markReadBtn').addEventListener('click', () => {
    currentUnreadItems = [];
    chrome.storage.local.set({ unreadItems: [] }, () => { renderList(); });
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
