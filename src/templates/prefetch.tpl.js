(function() {
  var prefetchConfig;
  function getResType(extension) {
    if (prefetchConfig && prefetchConfig.resourceTypes) {
      for (var key in prefetchConfig.resourceTypes) {
        if (prefetchConfig.resourceTypes[key].indexOf(extension) !== -1) {
          return key;
        }
      }
    }
    return null;
  }

  function appendLink(href, as) {
    var res = document.createElement('link');
    res.rel = 'prefetch';
    if (as) { res.as = as; }
    if (prefetchConfig && prefetchConfig.crossorigin) {
      res.setAttribute('crossorigin', '');
    }
    res.href = href;
    document.head.appendChild(res);
  }

  var resList = [null];
  var fullPath = '{STATICS_FULL_PATH}';
  // for testing
  if (fullPath === '{' + 'STATICS_FULL_PATH' + '}') { fullPath = '.'; }
  resList.forEach(function(resource) {
    if (typeof resource === 'string') {
      var splitRes = resource.split('.');
      var extension = splitRes[splitRes.length - 1];
      appendLink(fullPath + resource, getResType(extension));
    }
  });
})();