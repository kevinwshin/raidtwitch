var express = require('express');
var app = express();
var compression = require('compression');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var cacheTimeout = 24 * 60 * 60 * 1000;
var currentChannel = 'scarra';

io.on('connection', function(socket) {
    socket.emit('changeChannel', currentChannel);
});

app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: cacheTimeout }));
http.listen(80, function() {
    console.log('server start');
});
