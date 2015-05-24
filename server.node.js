var dnscache = require('dnscache')({
    'enable': true,
    'ttl': 6 * 60 * 60,
    'cachesize': 10
});
var express = require('express');
var app = express();
var compression = require('compression');
var https = require('https');
var server = require('http').Server(app);
var io = require('socket.io')(server);

//logging utility
var log = function(event) {
    console.log(event + ' @ ' + (new Date().toString()));
};

var cacheTimeout = 24 * 60 * 60 * 1000; //ms
var channelDuration = 4 * 60; //sec
var maxPages = 7;

var channelOffset;
var currentChannel;
var channelList;
var elapsedTime = 0;
var numConnected = 0;
var upVotes = 0;
var downVotes = 0;

//utility to get the finished data from https.get
var httpsGet = function(url, callback) {
    https.get(url, function(res) {
        var responseData = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            responseData += chunk;
        });
        res.on('end', callback(responseData));
    });
};

//pulls maxPages of 100 streams each starting at the channelOffset'th stream
//sets the next channel to one of them at random
var getChannelList = function(callback) {
    var numResponses = 0;
    var channels = [];
    for(var page = 0; page < maxPages; ++page) {
        var offset = channelOffset + page * 100;
        httpsGet('https://api.twitch.tv/kraken/streams?limit=100&offset=' + offset, function(data) {
            data = JSON.parse(data);
            data.streams.forEach(function(stream) {
                channels.push(stream.channel.name);
            });

            //when all calls return
            if(++numResponses === maxPages) {
                channelList = channels;

                //set the next channel offset
                channelOffset = Math.floor(data._total * 0.8);
                //pick a channel if initializing
                if(callback) {
                    callback();
                }
            }
        });
    }
};

//picks a channel out of the channelList and tells clients to change
var changeChannel = function() {
    var index = Math.floor(Math.random() * maxPages * 100);
    var candidate = channelList[index];

    //make sure this channel is still online
    httpsGet('https://api.twitch.tv/kraken/streams/' + candidate, function(data) {
        data = JSON.parse(data);
        if(data.stream !== null) {
            //send it to the clients
            currentChannel = candidate;
            io.emit('changeChannel', currentChannel);
            log('change ' + currentChannel);
        } else {
            changeChannel();
        }
    });
};

//pick a channelOffset and channel now
httpsGet('https://api.twitch.tv/kraken/streams?limit=1', function(data) {
    data = JSON.parse(data);
    channelOffset = Math.floor(data._total * 0.8);
    getChannelList(function() {
        changeChannel();
        getChannelList()
    });
});

//make and start the timekeeper for the channel changer
var keepTime = function() {
    //go around the divide by zero
    var currentTotalTime = numConnected === 0 ? channelDuration : channelDuration * 3 /
            (3 - (upVotes * 2 + downVotes * 3) * (upVotes - downVotes) / numConnected / numConnected);
    var remainingTime = currentTotalTime - elapsedTime++;

    if(remainingTime <= 0) {
        changeChannel();
        getChannelList();
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
    log('connect ' + socket.conn.remoteAddress);

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
        log('disconnect ' + socket.conn.remoteAddress);
    });
});

//express stuff that I don't truly understand
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: cacheTimeout }));
server.listen(80, function() {
    log('start server');
});
