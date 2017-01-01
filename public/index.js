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

    socket.on('changeChannel', function(channelInfo) {
        userName = channelInfo.name;
        gameName = channelInfo.game;
        stream = channelInfo;

        socket.emit('unvote');
        $('#stream').prop('src', 'http://player.twitch.tv/?channel=' + userName);
        $('#chat').prop('src', 'http://www.twitch.tv/' + userName + '/chat');
        $('#name').prop('href', 'http://www.twitch.tv/' + userName);
        $('#name').text(userName);
        $('#game').text(gameName);
        downButton[0].checked = false;
        upButton[0].checked = false;
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
