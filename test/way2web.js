(function(Way2web) {
    'use strict';

    /**
     * Call function if the dom is ready.
     */
    Way2web.onDomReady = function() {
        Way2web.Table.init();
    };
})(window.Way2web = window.Way2web || {});

$(document).ready(window.Way2web.onDomReady);
