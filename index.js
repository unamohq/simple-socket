module.exports = (function () {

    var util = require('util');
    var EventEmitter = require('events').EventEmitter;
    var queue = require('queue');
    var extend = require('extend');
    
    var SocketImplementation = require('./lib/web-socket');


    var SimpleSocket = function(options) {
        EventEmitter.prototype.constructor.call(this);

        this._queue = queue({
            timeout: 100,
            concurrency: 1
        });

        this.engine = null;
        this._disconnected = true;
        this._options = extend({
            autoConnect: false, // connect automatically when instance is created
            autoReconnect: true // reconnect when try to send if socket is disconnected
        }, options);

        this.url = this._options.url;

        if(this._options.autoConnect) {
            this.connect(this.url);
        }
    };

    SimpleSocket.supported = !!SocketImplementation;

    util.inherits(SimpleSocket, EventEmitter);

    extend(SimpleSocket.prototype, {
        connect: function(url) {
            if(this._disconnected) {
                if(this.engine) {
                    this._queue.end();

                    this.engine.close();

                    this.engine = null;
                }

                this._disconnected = false; // true if engine is in CLOSED state
                this._disconnecting = false; // true if disconnect engine is in CLOSING state
                this._closedManually = false; // true if disconnect method was called
                this._connected = true; // true if connect method was called

                this.url = (this.url || url);

                this._createSocket();
            } else {
                this.emit('error', 'socket connection is already estabilished');
            }

            return this;
        },
        disconnect: function () {
            if(!this._disconnected && !this._disconnecting) {
                this._disconnecting = true;

                this._closedManually = true;

                this.engine.close();
            } else {
                this.emit('error', 'socket connection is already closed or closing');
            }

            return this;
        },
        isConnected: function() {
            return (this.engine && (this.engine.readyState === this.engine.OPEN));
        },
        send: function (message) {
            var messageString;

            try {
                messageString = JSON.stringify(message);
            } catch(err) {
                this.emit('error', 'cannot parse message to JSON');

                return false;
            }

            if (this.isConnected()) {
                this.engine.send(messageString);
            } else {
                this._queue.push(this.send.bind(this, message));

                if(this._connected) {
                    if(this._options.autoReconnect && !this._closedManually) {
                        this._reconnect();   
                    } else {
                        this.emit('error', 'try to send a message but socket was closed manually or is disconnected and autoReconnect option is not enabled');

                        return false;
                    }
                } else {
                    this.emit('error', 'try to send a message but socket has never been connected');    
                }
            }

            return this;
        },
        receive: function(messageTypes, handler) {
            var messageTypesLC = messageTypes.split(' ').map(function(messageType) {
                return messageType.toLowerCase();
            });

            messageTypesLC.forEach(function() {
                this.addListener('message_' + messageTypesLC, handler);
            }, this);

            return function() {
                messageTypesLC.forEach(function() {
                    this.removeListener('message_' + messageTypesLC, handler);
                }, this);
            };
        },
        _reconnect: function() {
            this._reconnecting = true;

            this._createSocket();
        },
        _createSocket: function() {
            try {
                this.engine = new SocketImplementation(this.url);
            } catch (err) {
                return this.emit('error', err);
            }

            this.engine.addEventListener('open', this._engineHandlers.open.bind(this));
            this.engine.addEventListener('message', this._engineHandlers.message.bind(this));
            this.engine.addEventListener('error', this._engineHandlers.error.bind(this));
            this.engine.addEventListener('close', this._engineHandlers.close.bind(this));
        },
        _engineHandlers: {
            open: function () {
                // sometimes, IE 11 fires this callback when connection is not really open
                // and then once again when everything is ok
                // so, make sure that `opened` flag is set when socket is ready to send message
                if(this.engine.readyState === this.engine.OPEN) {
                    if(!this._reconnecting) {
                        this.emit('connect');
                    } else {
                        this.emit('reconnect');

                        this._reconnecting = false;
                    }

                    // flush queue in next tick to allow sending some initial message on connect / reconnect
                    process.nextTick(function() {
                        this._queue.start();
                    }.bind(this));
                }
            },
            message: function (messageString) {
                var message;

                try {
                    message = JSON.parse(messageString);
                } catch(err) {
                    this.emit('error', 'cannot parse message to JSON', message);

                    return false;
                }

                if(('undefined' !== typeof message.type) && (message.type !== null)) {
                    this.emit('message', message);
                    this.emit('message_' + message.type.toLowerCase(), message.data);

                    return true;
                } else {
                    this.emit('error', 'message has not a valid type', message);

                    return false;
                }
            },
            close: function(e) {
                if(this._disconnecting || !this._options.autoReconnect) {
                    this._disconnecting = false;
                    this._disconnected = true;

                    this.engine = null;

                    this.emit('disconnect', e);
                }
            },
            error: function (err) {
                this.emit('error', err);
            }
        }
    });

    return SimpleSocket;

})();
