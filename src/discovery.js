(function() {
  const feeds = [];
  
  // 1. Scan for <link> tags in the head
  const links = document.querySelectorAll('link[rel="alternate"]');
  links.forEach(link => {
    const type = link.getAttribute('type') || '';
    if (type.includes('rss') || type.includes('atom') || type.includes('xml')) {
      const url = link.href;
      if (url && !feeds.some(f => f.url === url)) {
        feeds.push({
          title: link.getAttribute('title') || document.title || 'Feed',
          url: url
        });
      }
    }
  });

  // 2. Check if the current document is itself a feed
  // Checking the root element name (MV3 content scripts can access the DOM)
  const rootName = document.documentElement.nodeName.toLowerCase();
  if (rootName === 'rss' || rootName === 'feed' || rootName === 'rdf:rdf' || rootName === 'channel') {
    const url = window.location.href;
    if (!feeds.some(f => f.url === url)) {
        feeds.push({
          title: document.title || 'Current Page Feed',
          url: url
        });
    }
  }

  // 3. Send results to background
  if (feeds.length > 0) {
    chrome.runtime.sendMessage({ 
      action: 'feedsDiscovered', 
      feeds: feeds 
    });
  }
})();
