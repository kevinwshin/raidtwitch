socket.on('changeChannel', function(name) {
    $('#stream').attr('src', 'http://www.twitch.tv/' + name + '/embed');
    $('#chat').attr('src', 'http://www.twitch.tv/' + name + '/chat?popout=');
});
