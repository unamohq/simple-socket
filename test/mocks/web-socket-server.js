module.exports = (function() {

    var each = require('foreach');
    var extend = require('extend');


    function WebSocketServer() {
        this._clients = { };
    }


    extend(WebSocketServer.prototype, {
        _randomAsync: function(client, fn) {
            var self = this;

            window.setTimeout(function() {
                var clientInstance = self._getClientEntry(client);

                if(clientInstance) {
                    fn.call(self, clientInstance);
                } else {
                    throw 'client not connected to the server';
                }
            }, Math.floor(Math.random() * 50));
        },
        // search for the client entry for passed WebSocket mock instance
        _getClientEntry: function(client) {
            var res; 

            each(this._clients, function(c) {
                if(c.mock === client) {
                    res = c;
                }
            }, this);

            return res;
        },
        // sends message to the client
        send: function(client, data) {
            this._randomAsync(client, function (clientInstance) {
                clientInstance.mock.dispatchEvent(new CustomEvent('message', { 'data': data }));
            });
        },
        // sends error to the client
        error: function(client) {
            this._randomAsync(client, function (clientInstance) {
                clientInstance.mock._connection = null;

                clientInstance.mock.readyState = clientInstance.mock.CLOSED;

                clientInstance.mock.dispatchEvent(new CustomEvent('error'));

                delete this._clients[clientInstance.id];
            });
        },
        // sends disconnect signal to the client
        disconnect: function(client, reason) {
            this._randomAsync(client, function (clientInstance) {
                clientInstance.mock._connection = null;

                clientInstance.mock.readyState = clientInstance.mock.CLOSED;

                clientInstance.mock.dispatchEvent(new CustomEvent('close', { reason: reason }));

                delete this._clients[clientInstance.id];
            });
        },
        getMessages: function(client) {
            var clientInstance = this._getClientEntry(client);

            if(clientInstance) {
                return clientInstance.messages;
            } else {
                throw 'client not connected to the server';
            }
        },
        // register the new client and returns deregistration and send functions
        connect: function(webSocketMock) {
            var clientId = Math.floor(Math.random() * 10e8).toString(36) + Date.now().toString(36) + Math.floor(Math.random() * 10e8).toString(36);

            this._clients[clientId] = {
                id: clientId,
                mock: webSocketMock,
                messages: [ ]
            };

            var server = this;
            return {
                disconnect: function() {
                    if(server._clients[clientId]) {
                        delete server._clients[clientId];
                    } else {
                        throw 'client not connected to the server';
                    }
                },
                send: function(message) {
                    if(server._clients[clientId]) {
                        server._clients[clientId].messages.push(message);
                    } else {
                        throw 'client not connected to the server';
                    }
                }
            };
        }
    });


    return new WebSocketServer();

})();