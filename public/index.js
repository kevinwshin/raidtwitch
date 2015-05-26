var socket;
var downButton;
var upButton;

$(function() {
    socket = io();
    downButton = $('#downVote');
    upButton = $('#upVote');

    downButton.click(function() {
        if(this.checked) {
            socket.emit('downVote');
            upButton[0].checked = false;
        } else {
            socket.emit('unvote');
        }
    });

    upButton.click(function() {
        if(this.checked) {
            socket.emit('upVote');
            downButton[0].checked = false;
        } else {
            socket.emit('unvote');
        }
    });

    socket.on('changeChannel', function(name) {
        socket.emit('unvote');
        $('#stream').prop('src', 'http://www.twitch.tv/' + name + '/embed');
        $('#chat').prop('src', 'http://www.twitch.tv/' + name + '/chat?popout=');
        $('#name').prop('href', 'http://www.twitch.tv/' + name);
        $('#name > h1').text(name);
        downButton[0].checked = false;
        upButton[0].checked = false;
    });

    socket.on('changeGame', function(game) {
        $('#game').text(game);
    });

    socket.on('time', function(time) {
        var minutes = Math.floor(time / 60);
        var seconds = time - minutes * 60;
        var timeString = minutes + (seconds < 10 ? ':0' : ':') + seconds;
        $('#time').text(timeString);
    });

    //connect for real
    socket.emit('ready');
});
