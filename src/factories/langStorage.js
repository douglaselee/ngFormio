module.exports = function() {
  return {
    put: function(name, value) {
      var str = localStorage.getItem('viewerSettings');
      var stored = JSON.parse(str) || {LANGUAGE: {}};
      stored.LANGUAGE[name] = value;
      localStorage.setItem('viewerSettings', JSON.stringify(stored));
    },
    get: function(name) {
      var str = localStorage.getItem('viewerSettings');
      var stored = JSON.parse(str) || {LANGUAGE: {}};
      return stored.LANGUAGE[name];
    }
  };
};
