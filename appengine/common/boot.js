/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Load the correct language pack for the current application.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

// Redirect to new domain.
if (location.host == 'blockly-games.appspot.com') {
    location.replace('https://blockly.games' +
        location.pathname + location.search + location.hash);
}

(function() {
    // Application path.
    var appName = location.pathname.match(/\/([-\w]+)(\.html)?$/);
    appName = appName ? appName[1].replace('-', '/') : 'index';

    // Supported languages (consistent across all apps). //σβήσε όσες δεν θες μην τις κάνεις comment-out
    window['BlocklyGamesLanguages'] = [
        'el',
        'en'
    ];

    // Use a series of heuristics that determine the likely language of this user.
    // First choice: The URL specified language.
    var param = location.search.match(/[?&]lang=([^&]+)/);
    var lang = param ? param[1].replace(/\+/g, '%20') : null;
    if (window['BlocklyGamesLanguages'].indexOf(lang) != -1) {
        // Save this explicit choice as cookie.
        var exp = (new Date(Date.now() + 2 * 31536000000)).toUTCString();
        document.cookie = 'lang=' + escape(lang) + '; expires=' + exp + 'path=/';
    } else {
        // Second choice: Language cookie.
        var cookie = document.cookie.match(/(^|;)\s*lang=([\w\-]+)/);
        lang = cookie ? unescape(cookie[2]) : null;
        if (window['BlocklyGamesLanguages'].indexOf(lang) == -1) {
            // Third choice: The browser's language.
            lang = navigator.language;
            if (window['BlocklyGamesLanguages'].indexOf(lang) == -1) {
                // Fourth choice: ελληνικά.
                lang = 'el';
            }
        }
    }
    window['BlocklyGamesLang'] = lang;

    // Load the chosen language pack.
    var script = document.createElement('script');
    var debug = false;
    try {
        debug = !!sessionStorage.getItem('debug');
        if (debug) {
            console.info('Loading uncompressed JavaScript.');
        }
    } catch (e) {
        // Don't even think of throwing an error.
    }
    script.src = appName + '/generated/' + lang +
        (debug ? '/uncompressed.js' : '/compressed.js');
    script.type = 'text/javascript';
    document.head.appendChild(script);
})();