module.exports = (function() {

    var extend = require('extend');


    function _invoke(fn, context, arg) {
        try {
            fn.call(context, arg);
        } catch(err) {
            setTimeout(function() {
                throw err;
            }, 0);
        }
    }


    function EventTarget() {
        this._listeners = {
            'true': { },
            'false': { }
        };
    }

    extend(EventTarget.prototype, {
        addEventListener: function(type, listener, useCapture) {
            useCapture = (useCapture || false);

            if(!this._listeners[useCapture][type]) {
                this._listeners[useCapture][type] = [ ];
            }

            this._listeners[useCapture][type].push(listener);
        },
        removeEventListener: function(type, listener, useCapture) {
            useCapture = (useCapture || false);

            if(this._listeners[useCapture][type]) {
                this._listeners[useCapture][type].splice(this._listeners[useCapture][type].indexOf(listener), 1);
            }
        },
        dispatchEvent: function(event, useCapture) {
            useCapture = (useCapture || false);

            event.target = this;

            if(this._listeners[useCapture][event.type]) {
                // iterate over copy of array (prevent calling listeners added in listeners etc.)
                this._listeners[useCapture][event.type].slice().forEach(function(listener) {
                    _invoke(listener, event.target, event);
                });
            }
        }
    });


    return EventTarget;

})();