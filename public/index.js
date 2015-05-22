var socket = io();
var vote = 0;

$(document).ready(function() {
    $('#downVote').click(function() {
        if(vote === 0 || vote === 1) {
            vote = -1;
            socket.emit('downVote');
        } else {
            vote = 0;
            socket.emit('unvote');
        }
    });
    $('#upVote').click(function() {
        if(vote === 0 || vote === -1) {
            vote = 1;
            socket.emit('upVote');
        } else {
            vote = 0;
            socket.emit('unvote');
        }
    });
});

socket.on('changeChannel', function(name) {
    vote = 0;
    socket.emit('unvote');
    $('#stream').attr('src', 'http://www.twitch.tv/' + name + '/embed');
    $('#chat').attr('src', 'http://www.twitch.tv/' + name + '/chat?popout=');
    $('#name').text(name);
});

socket.on('time', function(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    var timeString = minutes + (seconds < 10 ? ':0' : ':') + seconds;
    $('#time').text(timeString);
});
