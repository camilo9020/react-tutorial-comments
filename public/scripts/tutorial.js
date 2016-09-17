
var Comment = React.createClass({
  rawMarkup: function() {
    var md = new Remarkable();
    var rawMarkup = md.render(this.props.children.toString());
    return { __html: rawMarkup };
  },

  render: function() {
    return (
      <div className="comment">
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

var CommentAuthorRow = React.createClass({
  render: function() {
    let comments = [];
    this.props.data.forEach( function(comment) {
      if (comment.author === this.props.author) {
        comments.push(
          <Comment author={comment.author} key={comment.id}>
            {comment.text}
          </Comment>
        );
      }
    }.bind(this));
    return (
     <div className="CommentAuthorRow">
      <h2>{this.props.author}</h2>
      {comments}
     </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    let groups = [];
    let GroupAuthor = [];
    this.props.data.forEach(function(comment) {
      if (GroupAuthor.indexOf(comment.author) === -1 ) {
        groups.push(<CommentAuthorRow author={comment.author} key={comment.author} data={this.props.data} />);
      }
      GroupAuthor.push(comment.author);
    }.bind(this));
    return (
      <div className="commentList">
        {groups}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  getInitialState: function() {
      return {author: '', text: ''};
    },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
     var author = this.state.author.trim();
     var text = this.state.text.trim();
     if (!text || !author) {
       return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
     return {data: []};
   },
   componentDidMount: function() {
     this.loadCommentsFromServer();
     setInterval(this.loadCommentsFromServer, this.props.pollInterval);
   },
  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={10000} />,
  document.getElementById('content')
);