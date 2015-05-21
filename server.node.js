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
var numConnected = 0;

//pulls maxPages of 100 streams each starting at the 5000th stream
//it then picks one at random, prints it to stdout, and sends it to all clients
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

                //execute on full completion of stream collection
                if(++numResponses === maxPages) {
                    currentChannel = streams[Math.floor(Math.random() * maxPages * 100)];
                    console.log(currentChannel + ' @ ' + (new Date().toString()));
                    io.emit('changeChannel', currentChannel);
                }
            });
        });
    }
};
//pick a channel now and start the timer for the next ones
changeChannel();
setInterval(changeChannel, channelDuration);

//tell new connectees what channel we're on
io.on('connection', function(socket) {
    socket.emit('changeChannel', currentChannel);
});

//express stuff that I don't truly understand
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: cacheTimeout }));
server.listen(80, '192.168.0.9', function() {
    console.log('server start');
});
