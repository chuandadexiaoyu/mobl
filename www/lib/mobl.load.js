var mobl = window.mobl || {};
mobl.screenStack = [];
mobl.rootScope = new mobl.LinkedMap();

function updateScrollers () {
    var scrollwrappers = $("#scrollwrapper:visible");
    if (scrollwrappers.length > 0) {
        var height = window.innerHeight;
        height -= $("#header:visible").height();
        height -= $("#footer:visible").height();
        height -= $("#tabbar:visible").height();
        scrollwrappers.height(height);
    }
    var scrollers = $("#scrollwrapper div#content:visible");
    for ( var i = 0; i < scrollers.length; i++) {
        scrollers.eq(i).data("scroller").refresh();
    }
}

mobl.delayedUpdateScrollers = function() {
    console.log("Updating scrollers");
    setTimeout(updateScrollers, 200);
}

mobl.provides = function (moduleName) {
    var parts = moduleName.split('.');
    var current = window;
    for ( var i = 0; i < parts.length; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current.isLoaded = true;
}

$(window).resize(updateScrollers);

$(function() {
    // Set flushing at interval
    setInterval(function() { persistence.flush(); }, 2500);
});

mobl.loadedFiles = {};

mobl.load = function(url) {
    if(url in mobl.loadedFiles) {
        return;
    }
    if(url.substring(url.length-3) === '.js') {
        $("head").append("<script type=\"text/javascript\" src=\"" + url + "\">");
    } else if(url.substring(url.length-4) === '.css') {
        $("head").append("<link rel=\"stylesheet\" type=\"text/css\" href=\"" + url + "\">");
    } else {
        console.log("Unkown type to load: " + url);
    }
    mobl.loadedFiles[url] = true;
};

mobl.call = function (screenName, args, callback) {
    var screenFrame = {
        "name": screenName,
        "args": args,
        "callback": callback,
        "div": screenName.replace('.', '__')
    };
    mobl.screenStack.push(screenFrame);
    var callbackFn = function () {
        // when callback function is called (i.e. return)
        mobl.screenStack.pop();
        if (mobl.screenStack.length > 0) {
            var previousScreen = mobl.screenStack[mobl.screenStack.length - 1];
            $("body > #" + screenFrame.div).hide('slide', {
                direction: "right"
            }, 150, function () {
                var n = $("body > #" + screenFrame.div);
                n.remove();
                n.disableExtraEvents();
            });
            $("body > #" + previousScreen.div).show('slide', {
                direction: "left"
            }, 150);
        }
        if (callback) {
            callback.apply(null, arguments);
        }
    };
    var parts = screenName.split('.');
    var current = window;
    for(var i = 0; i < parts.length; i++) {
        current = current[parts[i]];
    }
    var screenTemplate = current;
    screenTemplate.apply(null, args.concat( [ function (node) {
        node.attr('id', screenFrame.div);
        node.attr('style', "position: absolute; left: 0; top: 0; width: "+ window.innerWidth + "px;");
        var body = $("body");
        
        if (mobl.screenStack.length > 1) {
            var previousScreen = mobl.screenStack[mobl.screenStack.length - 2];
            $("body > #" + previousScreen.div).hide('slide', {
                direction: "left"
            }, 150);
            node.hide().prependTo(body).show('slide', {
                direction: "right"
            }, 150);
        } else {
            node.prependTo(body);
        }

        $(function () {
            var scrollers = $("div#" + screenFrame.div + " div#scrollwrapper div#content"), i = 0;
            if (scrollers.length > 0) {
                for (i = 0; i < scrollers.length; i++) {
                    scrollers.eq(i).data("scroller", new iScroll(scrollers.get(i), 'y'));
                }
                updateScrollers();
            }
        });
    }, callbackFn ]));
}