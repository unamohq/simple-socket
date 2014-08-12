module.exports = (function () {

    var util = require('util');
    var extend = require('extend');
    var EventTarget = require('./event-target');
    var webSocketServer = require('./web-socket-server');


    function randomAsync (fn, context) {
        window.setTimeout(function() {
            fn.call(context);
        }, Math.floor(Math.random() * 50));
    }


    var WebSocket = function(url) {
        EventTarget.call(this);

        this.URL = this.url = url;
        this.protocol = '';
        this.readyState = this.CLOSED;

        this._connection = null;

        this._queue = [ ];

        randomAsync(function () {
            this.readyState = this.OPEN;

            this._connection = webSocketServer.connect(this);

            this.dispatchEvent(new CustomEvent('open'));
        }, this);
    };

    util.inherits(WebSocket, EventTarget);

    extend(WebSocket.prototype, {
        CLOSED: 3,
        CLOSING: 2,
        CONNECTING: 0,
        OPEN: 1,
        send: function(message) {
            if(this.readyState !== this.OPEN) {
                throw new Error('INVALID_STATE_ERR');
            } else {
                this._queue.push(message);

                randomAsync(function() {
                    this._connection.send(this._queue.shift());
                }, this);
            }
        },
        close: function() {
            if(this.readyState === this.OPEN) {
                this.readyState = this.CLOSING;

                while(this._queue.length) {
                    this._queue.shift();
                }

                randomAsync(function () {
                    this._connection.disconnect();
                    this._connection = null;

                    this.readyState = this.CLOSED;

                    this.dispatchEvent(new CustomEvent('close'));
                }, this);
            }
        }
    });


    return WebSocket;

})();