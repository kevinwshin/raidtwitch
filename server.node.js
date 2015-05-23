var express = require('express');
var app = express();
var compression = require('compression');
var https = require('https');
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cacheTimeout = 24 * 60 * 60 * 1000; //ms
var channelDuration = 4 * 60; //sec
var maxPages = 10;

var currentChannel;
var elapsedTime = 0;
var numConnected = 0;
var upVotes = 0;
var downVotes = 0;

//pulls maxPages of 100 streams each starting at the 5000th stream
//it then picks one at random, prints it to stdout, and sends it to all clients
var changeChannel = function() {
    var numResponses = 0;
    var streams = [];
    for(var page = 0; page < maxPages; ++page) {
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
//pick a channel now
changeChannel();

//make and start the timekeeper for the channel changer
var keepTime = function() {
    //go around the divide by zero
    var currentTotalTime = numConnected === 0 ? channelDuration : channelDuration * 3 /
            (3 - (upVotes * 2 + downVotes * 3) * (upVotes - downVotes) / numConnected / numConnected);
    var remainingTime = currentTotalTime - elapsedTime++;

    if(remainingTime <= 0) {
        changeChannel();
        elapsedTime = 0;
        remainingTime = channelDuration;
    }

    io.emit('time', Math.floor(remainingTime));
};
setInterval(keepTime, 1000);

//tell new connectees what channel we're on
//also tally them
io.on('connection', function(socket) {
    ++numConnected;
    socket.emit('changeChannel', currentChannel);

    //keep track of voting
    var vote = 0;
    var unvote = function() {
        if(vote === 1) {
            --upVotes;
        } else if(vote === -1) {
            --downVotes;
        }
        vote = 0;
    };
    socket.on('unvote', unvote);
    socket.on('upVote', function() {
        unvote();
        vote = 1;
        ++upVotes;
    });
    socket.on('downVote', function() {
        unvote();
        vote = -1;
        ++downVotes;
    });
    socket.on('disconnect', function() {
        unvote();
        --numConnected;
    });
});

//express stuff that I don't truly understand
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: cacheTimeout }));
server.listen(80, function() {
    console.log('server start');
});
