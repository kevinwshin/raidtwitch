const IFrame = function(props) {
    return (
        <iframe frameborder="0" src={props.streamSource}></iframe>
    );
}

class Infobar extends React.Component {
    const onClick = function(vote) {
        if(this.checked)

    render() {
        return (
            <div id="info">
                <a id="name" href="http://www.zombo.com/">
                    {props.userName}
                </a>
                <div style="padding-left:0.5em; padding-right:0.5em">playing</div>
                <div id="game">{props.gameName}</div>
                <div class="button">
                    <input type="checkbox" id="downVote" onClick={() => this.onClick(-1)}></input>
                    <label for="downVote">-</label>
                </div>
                <div id="time">{props.time}</div>
                <div class="button">
                    <input type="checkbox" id="upVote" onClick={() => this.onClick(1)}></input>
                    <label for="upVote">+</label>
                </div>
            </div>
        );
    }
}
