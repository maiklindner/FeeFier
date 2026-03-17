let currentMessages = {};

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
        document.getElementById('langSelect').value = data.language;
        localizeHtmlPage();
        if (callback) callback();
      })
      .catch(err => {
        console.error("Failed to load locales", err);
        if (callback) callback();
      });
  });
}

// DOM DOM elements
const feedsContainer = document.getElementById('feedsContainer');
const addFeedButton = document.getElementById('addFeedButton');

let toastTimeout;
let lastDeletedFeed = null;

// Localize page
function localizeHtmlPage() {
  document.getElementById('pageTitle').textContent = getMessage('optionsTitle');
  document.getElementById('optionsH1').textContent = getMessage('optionsTitle');
  document.getElementById('optionsDesc').textContent = getMessage('optionsDesc');
  document.getElementById('feedsHeading').textContent = getMessage('optionsFeedsHeading');
  document.getElementById('addFeedButton').textContent = '+ ' + getMessage('optionsAddFeed');

  document.getElementById('toastUndoBtn').textContent = getMessage('optionsUndo');
  
  document.querySelectorAll('.feed-row').forEach(row => {
    const labels = row.querySelectorAll('label');
    if (labels.length >= 3) {
      labels[0].textContent = getMessage('optionsFeedUrlLabel');
      labels[1].textContent = getMessage('optionsFeedNameLabel');
      labels[2].textContent = getMessage('optionsIntervalLabel');
    }
    const removeBtn = row.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.textContent = getMessage('optionsRemoveFeed');
    }
  });
}

// Drag and Drop Logic
feedsContainer.addEventListener('dragover', e => {
  e.preventDefault();
  const draggingElement = document.querySelector('.dragging');
  const afterElement = getDragAfterElement(feedsContainer, e.clientY);
  if (afterElement == null) {
    feedsContainer.appendChild(draggingElement);
  } else {
    feedsContainer.insertBefore(draggingElement, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.feed-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

let saveTimeout;

// Create feed row in DOM
function createFeedRow(feed = { id: '', name: '', url: '', interval: 15, enabled: true }, atTop = false, atIndex = -1) {
  const row = document.createElement('div');
  row.className = 'feed-row';
  row.dataset.id = feed.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
  row.draggable = true;

  row.addEventListener('dragstart', () => {
    row.classList.add('dragging');
  });

  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    triggerAutoSave();
  });

  const nameGroup = document.createElement('div');
  nameGroup.className = 'feed-input-group name-group';
  
  const nameLabel = document.createElement('label');
  nameLabel.textContent = getMessage('optionsFeedNameLabel');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = getMessage('optionsFeedNamePlaceholder');
  nameInput.value = feed.name || '';
  nameInput.className = 'feed-name';
  
  nameInput.addEventListener('input', triggerAutoSave);
  
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);

  const urlGroup = document.createElement('div');
  urlGroup.className = 'feed-input-group url-group';
  
  const urlLabel = document.createElement('label');
  urlLabel.textContent = getMessage('optionsFeedUrlLabel');
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.placeholder = 'https://domain.com/rss.xml';
  urlInput.value = feed.url;
  urlInput.className = 'feed-url';
  
  urlInput.addEventListener('input', triggerAutoSave);
  
  urlGroup.appendChild(urlLabel);
  urlGroup.appendChild(urlInput);

  const intervalGroup = document.createElement('div');
  intervalGroup.className = 'feed-input-group interval-group';

  const intervalLabel = document.createElement('label');
  intervalLabel.textContent = getMessage('optionsIntervalLabel');
  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.min = '1';
  intervalInput.value = feed.interval;
  intervalInput.className = 'feed-interval';

  intervalInput.addEventListener('input', triggerAutoSave);

  intervalGroup.appendChild(intervalLabel);
  intervalGroup.appendChild(intervalInput);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = getMessage('optionsRemoveFeed');
  removeBtn.onclick = () => {
    deleteFeed(row);
  };

  const toggleWrapper = document.createElement('div');
  toggleWrapper.style.height = '48px';
  toggleWrapper.style.display = 'flex';
  toggleWrapper.style.alignItems = 'center';
  toggleWrapper.style.marginRight = '1em';

  const toggleGroup = document.createElement('label');
  toggleGroup.className = 'switch';
  toggleGroup.style.margin = '0';
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.className = 'feed-enabled';
  toggleInput.checked = feed.enabled !== false; // Default to true
  toggleInput.addEventListener('change', triggerAutoSave);
  const toggleSlider = document.createElement('span');
  toggleSlider.className = 'slider';
  
  toggleGroup.appendChild(toggleInput);
  toggleGroup.appendChild(toggleSlider);
  toggleWrapper.appendChild(toggleGroup);

  const bottomRow = document.createElement('div');
  bottomRow.className = 'feed-row-bottom';

  bottomRow.appendChild(nameGroup);
  bottomRow.appendChild(intervalGroup);
  bottomRow.appendChild(toggleWrapper);
  bottomRow.appendChild(removeBtn);

  row.appendChild(urlGroup);
  row.appendChild(bottomRow);

  if (atTop) {
    feedsContainer.prepend(row);
    urlInput.focus();
  } else if (atIndex !== -1 && atIndex < feedsContainer.children.length) {
    feedsContainer.insertBefore(row, feedsContainer.children[atIndex]);
  } else {
    feedsContainer.appendChild(row);
  }
}

// Save options
function triggerAutoSave(silent = false) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveOptions(silent), 500); // 500ms debounce
}

function saveOptions(silent = false) {
  const rows = document.querySelectorAll('.feed-row');
  const feeds = [];
  let valid = true;

  rows.forEach(row => {
    const name = row.querySelector('.feed-name').value.trim();
    const url = row.querySelector('.feed-url').value.trim();
    const intervalElement = row.querySelector('.feed-interval').value;
    const interval = intervalElement ? parseInt(intervalElement, 10) : 0;
    const enabled = row.querySelector('.feed-enabled').checked;
    const id = row.dataset.id;

    if (url && interval >= 1) {
      feeds.push({ id, name, url, interval, enabled });
    } else if (url || intervalElement) {
      // Partially filled row is treated as invalid
      valid = false;
    }
  });

  if (valid) {
    chrome.storage.sync.set({ feeds: feeds }, () => {
      if (!silent) {
        showToast(getMessage('statusSaved'));
      }
    });
  } else {
    showToast(getMessage('statusError'));
  }
}

// Show a unified toast notification
function showToast(message, duration = 5000, undoAction = null) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastUndoBtn = document.getElementById('toastUndoBtn');

  // Clear previous timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastMessage.textContent = message;

  if (undoAction) {
    toastUndoBtn.classList.remove('hidden');
    toastUndoBtn.onclick = () => {
      undoAction();
      hideToast();
    };
  } else {
    toastUndoBtn.classList.add('hidden');
  }

  toast.classList.remove('hidden');

  toastTimeout = setTimeout(hideToast, duration);
}

function hideToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('hidden');
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
}

// Delete a feed with Undo
function deleteFeed(row) {
  const id = row.dataset.id;
  const index = [...feedsContainer.children].indexOf(row);

  // Save for undo
  lastDeletedFeed = {
    data: {
      id: id,
      name: row.querySelector('.feed-name').value,
      url: row.querySelector('.feed-url').value,
      interval: row.querySelector('.feed-interval').value,
      enabled: row.querySelector('.feed-enabled').checked
    },
    index: index
  };

  // Remove immediately from UI
  row.remove();
  triggerAutoSave(true); // Silent save

  // Show toast with undo
  showToast(getMessage('optionsFeedDeleted'), 5000, undoDelete);
}

// Undo the deletion
function undoDelete() {
  if (!lastDeletedFeed) return;

  // Restore feed
  createFeedRow(lastDeletedFeed.data, false, lastDeletedFeed.index);
  lastDeletedFeed = null;

  triggerAutoSave(true); // Silent save
}

// Restore options
function restoreOptions() {
  chrome.storage.sync.get(['feeds'], (items) => {
    // Default empty row
    const feeds = items.feeds || [{ id: Date.now().toString(), url: '', interval: 15, enabled: true }];

    // Fallback for empty list
    if (feeds.length === 0) {
      feeds.push({ id: Date.now().toString(), url: '', interval: 15, enabled: true });
    }

    feedsContainer.innerHTML = '';
    feeds.forEach(feed => createFeedRow(feed));
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initLocalization(() => {
    restoreOptions();
  });

  document.getElementById('langSelect').addEventListener('change', (e) => {
    chrome.storage.sync.set({ language: e.target.value }, () => {
      initLocalization();
    });
  });
});

addFeedButton.addEventListener('click', () => createFeedRow(undefined, true));