simple-socket
=============

Simple WebSocket client wrapper supporting reconnection on demand. Requires Browserify.


### Example of use ###

```
  var socket = new SimpleSocket({
    url: 'wss://example.com/ws',
    autoConnect: true,
    autoReconnect: true
  });
  
  // you can send data without waiting for connection, the library will queue it
  // data is stringified to JSON before send
  socket.send({
    type: 'event',
    data: {
      event: 'someEvent',
      target: 'someTargetId'
    }
  });
  
  // received data is parsed from JSON
  // type field is used to recognize message type
  socket.receive('event', function(data) {
    expect(data).toEqual({
      event: 'someEvent',
      target: 'someTargetId'
    });
  });
  
  // but you can also listen on 'raw' message
  socket.on('message', function(message) {
    expect(data).toEqual({
      type: 'event',
      data: {
        event: 'someEvent',
        target: 'someTargetId'
      }
    });
  });
  
  socket.on('connect', function() {
    // socket is connected now
    // you can send some init message here, it will be pushed to server before all queued messages
  });
  
  socket.on('diconnect', function() {
    // socket is disconnected now
    // if autoReconnect option is on, all messages will be buffered in RAM until connection is estabilished
  });
  
  socket.on('reconnect', function() {
    // socket is connected after disconnection (caused by server timeout or something)
    // you can send some init message here, it will be pushed to server before all queued messages
  });
  
  socket.on('error', function() {
    // errors could occur...
  });
  
  // close connection and prevent auto reconnections even if autoReconnect option is enabled
  // when you try to send message after manual disconnection, error event is emitted but message is
  // queued, so you can connect socket manually by `connect` method
  // and after that message will be sent to server
  socket.disconnect();
```
