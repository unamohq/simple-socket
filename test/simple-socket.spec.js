/*global jasmine, describe, it, beforeEach, afterEach */
var proxyquire = require('proxyquireify')(require);

var WebSocketMock = require('websocket-mock').Client;
var webSocketServer = require('websocket-mock').server;

var SimpleSocket = proxyquire('../', {
    './lib/web-socket': WebSocketMock
});

describe('SimpleSocket class test', function() {

    it('Should be a "class"', function () {
        expect(typeof SimpleSocket).toBe('function');
    });

});

describe('SimpleSocket instance test', function () {
    var simpleSocket;

    // connect before each test
    beforeEach(function () {
        simpleSocket = new SimpleSocket();
    });

    // clear after each test (it's not connected)
    afterEach(function () {
        simpleSocket = null;
    });

    
    it('Should be an instance and have a lot of public methods', function () {
        expect(simpleSocket instanceof SimpleSocket).toBeTruthy();
        expect(typeof simpleSocket).toBe('object');
        
        expect(typeof simpleSocket.connect).toBe('function');
        expect(typeof simpleSocket.disconnect).toBe('function');
        expect(typeof simpleSocket.isConnected).toBe('function');
        expect(typeof simpleSocket.send).toBe('function');
        expect(typeof simpleSocket.receive).toBe('function');
        expect(typeof simpleSocket.on).toBe('function');
    });

});


describe('SimpleSocket connecting', function () {
    var simpleSocket;
    var connectHandler;

    // connect before each test
    beforeEach(function (done) {
        connectHandler = jasmine.createSpy('connectHandler');

        simpleSocket = new SimpleSocket({
            url: 'wss://example.com/ws',
            autoConnect: true
        });

        simpleSocket.on('connect', connectHandler.and.callFake(done));
    });

    // disconnect after each test
    afterEach(function (done) {
        simpleSocket.disconnect();

        simpleSocket.on('disconnect', done);

        simpleSocket = null;
    });

    it('Should have WebSocket instance', function() {
         // see, that instance is created with autoConnect option enabled for tests
         // engine should be created during connection

        expect(simpleSocket.engine).toBeDefined();
        expect(simpleSocket.engine instanceof WebSocketMock).toBeTruthy();
    });

    it('Should emit `connect` event on connect', function() {
        expect(connectHandler.calls.any()).toBeTruthy();
    });

    it('Should emit exactly one `connect` event on connect', function() {
        expect(connectHandler.calls.count()).toEqual(1);
    });

});


describe('SimpleSocket disconnecting', function () {
    var simpleSocket;
    var disconnectHandler;

    // connect before each test
    beforeEach(function (done) {
        disconnectHandler = jasmine.createSpy('disconnectHandler');

        simpleSocket = new SimpleSocket({
            url: 'wss://example.com/ws',
            autoReconnect: false,
            autoConnect: true
        });

        simpleSocket.on('disconnect', disconnectHandler);
        simpleSocket.on('connect', done);
    });

    // disconnect after each test
    afterEach(function () {
        simpleSocket = null;
        disconnectHandler = null;
    });

    it('Should allow to disconnect', function(done) {
        expect(function() {
            simpleSocket.disconnect();
        }).not.toThrow();

        setTimeout(done, 51);
    });

    it('Should emit `disconnect` event on disconnect', function(done) {
        simpleSocket.disconnect();

        setTimeout(function() {
            expect(disconnectHandler.calls.any()).toBeTruthy();

            done();
        }, 51);
    });

    it('Should emit exactly one `disconnect` event on disconnect', function(done) {
        simpleSocket.disconnect();

        setTimeout(function() {
            expect(disconnectHandler.calls.count()).toEqual(1);

            done();
        }, 51);
    });

});


describe('SimpleSocket reconnecting', function () {
    var simpleSocket;
    var reconnectHandler;

    // connect before each test
    beforeEach(function (done) {
        reconnectHandler = jasmine.createSpy('reconnectHandler');

        simpleSocket = new SimpleSocket({
            url: 'wss://example.com/ws',
            autoConnect: true,
            autoReconnect: true
        });

        simpleSocket.on('reconnect', reconnectHandler);

        simpleSocket.on('connect', done);
    });


    // disconnect after a while
    beforeEach(function (done) {
        setTimeout(function() {
            // WebSocket's close event is emitted after close
            simpleSocket.engine.addEventListener('close', function closeHandler() {
                simpleSocket.engine.removeEventListener('close', closeHandler);

                done();
            });

            webSocketServer.disconnect(simpleSocket.engine, 51);
        }, Math.floor(Math.random() * 50));
    });

    // disconnect after each test
    afterEach(function () {
        simpleSocket = null;
        reconnectHandler = null;
    });

    it('Should reconnect after disconnection when want to send', function (done) {
         simpleSocket.send({
            type: 'dupa',
            data: {
                'key1': 1,
                'key2': '2'
            }
        });

        reconnectHandler.and.callFake(function() {
            expect(reconnectHandler.calls.any()).toBeTruthy();

            // wait for sending message after reconnection before you disconnect socket
            setTimeout(function() {
                // disconnect here manually, not in afterEach section, because some test cases don't do reconnect
                simpleSocket.disconnect();

                simpleSocket.on('disconnect', done);
            }, 51);
        });
    });

    it('Should not try to reconnect automatically after disconnection', function () {
        expect(reconnectHandler.calls.any()).toBeFalsy();
    });

});


describe('SimpleSocket sending', function () {
    var simpleSocket;
    var message1 = {
        type: 'message',
        data: 1
    };
    var message2 = {
        type: 'message',
        data: 'second'
    };

    // connect before each test
    beforeEach(function (done) {
        simpleSocket = new SimpleSocket({
            url: 'wss://example.com/ws',
            autoConnect: true
        });

        simpleSocket.on('connect', done);
    });

    // disconnect after each test
    afterEach(function (done) {
        simpleSocket.disconnect();

        simpleSocket.on('disconnect', done);

        simpleSocket = null;
    });


    it('Should allow to send a message', function (done) {
        simpleSocket.send(message1);

        // wait for receiving message
        setTimeout(function() {
            var messages = webSocketServer.getMessages(simpleSocket.engine);

            expect(messages.length).toBe(1);
            expect(JSON.parse(messages[0])).toEqual(message1);

            done();
        }, 51);
    });

    it('Should allow to send multiple messages', function (done) {
        simpleSocket.send(message1);
        simpleSocket.send(message2);

        // wait for receiving message
        setTimeout(function() {
            var messages = webSocketServer.getMessages(simpleSocket.engine);

            expect(messages.length).toBe(2);

            done();
        }, 51);
    });

    it('Should allow to send multiple messages in order', function (done) {
        simpleSocket.send(message1);
        simpleSocket.send(message2);

        // wait for receiving message
        setTimeout(function() {
            var messages = webSocketServer.getMessages(simpleSocket.engine);

            expect(messages.length).toBe(2);
            expect(JSON.parse(messages[0])).toEqual(message1);
            expect(JSON.parse(messages[1])).toEqual(message2);

            done();
        }, 51);
    });

    it('Should allow to send message in reconnect handler before queued messages', function (done) {
        simpleSocket.engine.addEventListener('close', function closeHandler() {
            simpleSocket.engine.removeEventListener('close', closeHandler);

            simpleSocket.send(message1);

            simpleSocket.on('reconnect', function() {
                simpleSocket.send(message2);

                // wait for receiving message
                setTimeout(function() {
                    var messages = webSocketServer.getMessages(simpleSocket.engine);

                    expect(JSON.parse(messages[0])).toEqual(message2);
                    expect(JSON.parse(messages[1])).toEqual(message1);

                    done();
                }, 51);
            });
        });

        webSocketServer.disconnect(simpleSocket.engine, 51);
    });

});


describe('SimpleSocket error handling', function () {
    var simpleSocket;
    var errorHandler;

    // connect before each test
    beforeEach(function (done) {
        errorHandler = jasmine.createSpy('errorHandler');

        simpleSocket = new SimpleSocket({
            url: 'wss://example.com/ws',
            autoConnect: true
        });

        simpleSocket.on('error', errorHandler);
        simpleSocket.on('connect', done);
    });

    // disconnect after each test
    // disconnect after each test
    afterEach(function (done) {
        simpleSocket.disconnect();

        simpleSocket.on('disconnect', done);

        simpleSocket = null;
    });


    it('Should not allow to send a message when socket it disconnected', function () {
        simpleSocket.disconnect();

        simpleSocket.send({
            type: 'message',
            data: 1
        });

        expect(errorHandler.calls.any()).toBeTruthy();
    });

    it('Should not allow to send a message when socket never been connected', function () {
        // note, that in this particular test different SimpleSocket instance is used
        // this test requires no connection ever, so autoConnect option have to be disabled

        var socket = new SimpleSocket({
            url: 'wss://example.com/ws',
            autoConnect: false,
            autoReconnect: false
        });

        var socketErrorHandler = jasmine.createSpy('socketErrorHandler');
        socket.on('error', function() {
            socketErrorHandler();
        });

        socket.send({
            type: 'message',
            data: 1
        });

        expect(socketErrorHandler.calls.any()).toBeTruthy();
    });

    it('Should not allow to send an object that can not be convert to JSON', function () {
        simpleSocket.send(document.body);
       
        expect(errorHandler.calls.any()).toBeTruthy(); 
    });

    it('Should not allow to receive a message that is not parsable JSON', function (done) {
        var messageHandler = jasmine.createSpy('messageHandler');

        simpleSocket.on('message', messageHandler);

        webSocketServer.send(simpleSocket.engine, '{!@#$%^&*()_+}');

        // wait for possible receiving
        setTimeout(function() {
            expect(messageHandler.calls.any()).toBeFalsy();
            expect(errorHandler.calls.any()).toBeTruthy();

            done();
        }, 51);
    });
    
});