var express = require('express');
var app = express();
var compression = require('compression');
var https = require('https');
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cacheTimeout = 24 * 60 * 60 * 1000;
var channelDuration = 5 * 60 * 1000;
var maxPages = 10;

var currentChannel;

var changeChannel = function() {
    var numResponses = 0;
    var streams = [];
    for(var page = 0; page < maxPages; page++) {
        var offset = 5000 + page * 100;
        https.get('https://api.twitch.tv/kraken/streams?limit=100&offset=' + offset, function(res) {
            var JSONResponse = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                JSONResponse += chunk;
            });
            res.on('end', function() {
                var data = JSON.parse(JSONResponse);
                data.streams.forEach(function(stream, index) {
                    streams.push(stream.channel.name);
                });

                if(++numResponses === maxPages) {
                    currentChannel = streams[Math.floor(Math.random() * maxPages * 100)];
                    console.log(currentChannel + ' @ ' + (new Date().toString()));
                    io.emit('changeChannel', currentChannel);
                }
            });
        });
    }
};
changeChannel();

io.on('connection', function(socket) {
    socket.emit('changeChannel', currentChannel);
});
setInterval(changeChannel, channelDuration);

app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: cacheTimeout }));
server.listen(80, function() {
    console.log('server start');
});
