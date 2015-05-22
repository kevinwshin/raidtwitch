var socket = io();

socket.on('changeChannel', function(name) {
    socket.emit('unvote');
    $('#stream').attr('src', 'http://www.twitch.tv/' + name + '/embed');
    $('#chat').attr('src', 'http://www.twitch.tv/' + name + '/chat?popout=');
});

socket.on('time', function(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    var timeString = minutes + (seconds < 10 ? ':0' : ':') + seconds;
    $('#clock').text(timeString);
});
