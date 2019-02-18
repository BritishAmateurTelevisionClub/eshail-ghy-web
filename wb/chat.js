/*

requires socket.io & jquery

// eg.
var chat = new BATC_Chat({
    element: $("#thisid"),
    room: "example",
    nick: "joe",
    viewers_cb: viewers_cb_function,
    guests_allowed: false
});
*/

var BATC_Chat = (function() {
    var css = ''
    + '    #batchat-wrapper {'
    + '  height: 100%;'
    + '  margin: 0px;'
    + '  padding: 0px;'
    + '  background: #3F464C;'
    + '  color: #ccc;'
    + '  font-family: "Lucida Sans Unicode", "Lucida Grande", sans-serif;'
    + '  font-size: 90%;'
    + '  position: relative;'
    + '}'
    + '#batchat-main-panel {'
    + '  height: 100%;'
    + '  padding-bottom: 30px;'
    + '  bottom: 30px;'
    + '}'
    + '#batchat-messages-panel {'
    + '  list-style: none;'
    + '  padding: 7px;'
    + '  margin-right: 105px !important;'
    + '  overflow: scroll;'
    + '  overflow-x: hidden;'
    + '  margin: 0;'
    + '}'
    + '.batchat-messages-panel-object {'
    + '  padding-bottom: 1px;'
    + '}'
    + '.batchat-message-datestamp {'
    + '  text-decoration: underline;'
    + '}'
    + '.batchat-message-datestamp, .batchat-message-timestamp {'
    + '  color: #b0b0b0;'
    + '  padding-right: 0.75em;'
    + '}'
    + '.batchat-message-nick {'
    + '  font-weight: bold;'
    + '  color: #FBDE2D;'
    + '  padding-right: 0.75em;'
    + '}'
    + '.batchat-message-text {'
    + '    margin-left: 0em; /*3.5em;*/'
    + '}'
    + '.batchat-message-announcement {'
    + '  font-weight: bold;'
    + '}'
    + '#batchat-users-panel {'
    + '  z-index: 100;'
    + '  background: #3F464C;'
    + '  position: absolute;'
    + '  top: 0;'
    + '  right: 0;'
    + '  margin: 0;'
    + '  padding: 8px;'
    + '  padding-bottom: 20px;'
    + '  width: 120px;'
    + '  overflow: auto;'
    + '  border-left: 1px solid #ccc;'
    + '}'
    + '.batchat-users-panel-object {'
    + '  line-height: 1rem;'
    + '  padding-bottom: 5px;'
    + '}'
    + '#batchat-bottom-bar {'
    + '  z-index: 150;'
    + '  position: absolute;'
    + '  left: 0;'
    + '  right: 0;'
    + '  bottom: 0;'
    + '  margin: 0;'
    + '  width: 100%;'
    + '  padding: 0 5px;'
    + '  height: 30px;'
    + '  display: block;'
    + '  background: #FFFFFF;'
    + '  color: #111;'
    + '}';

    var socket;
    var element;
    var room;
    var nick;
    var viewers_cb;
    var guests_allowed;
    var last_timestamp;

    /* Private Methods */

    var setCookie = function(name, value, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = name + "=" + value + "; " + expires;
    }

    var getCookie = function(name) {
        name = name + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length,c.length);
            }
        }
        return "";
    }

    var appendMsg = function(msg, autoscroll) {
        var ts = new Date(msg.time);
        if(ts > last_timestamp)
        {
            last_timestamp = ts;
            if(ts.toLocaleDateString()!=last_timestamp.toLocaleDateString())
            {
                $("#batchat-messages-panel").append($("<div></div>").addClass("batchat-messages-panel-object").append($("<span></span>").addClass("batchat-message-datestamp").text(ts.toLocaleDateString())));
            }
            var nuMessageObj = $("<div></div>").addClass("batchat-messages-panel-object");
            nuMessageObj.append($("<span></span>").addClass("batchat-message-timestamp").text(timeString(ts)));
            nuMessageObj.append($("<span></span>").addClass("batchat-message-nick").text(msg.name));
            nuMessageObj.append($("<span></span>").addClass("batchat-message-text").text(msg.message));
            var atBottom = autoscroll && ($("#batchat-messages-panel").scrollTop() >= ($("#batchat-messages-panel")[0].scrollHeight - 450));
            $("#batchat-messages-panel").append(nuMessageObj);
            if(atBottom)
            {
                $("#batchat-messages-panel").scrollTop($("#batchat-messages-panel")[0].scrollHeight);
            }
        }
    }

    var initHistory = function(history) {
        if(history.length>0)
        {
            var dataLength = history.length;
            for (var i=0; i<dataLength; i++) {
                appendMsg(history[i], false);
            }
            $("#batchat-messages-panel").scrollTop($("#batchat-messages-panel")[0].scrollHeight);
        }
    }

    var initUsers = function(users) {
        $("#batchat-users-panel").html("");
        if(users.length>0)
        {
            var dataLength = users.length;
            for (var i=0; i<dataLength; i++) {
                $("#batchat-users-panel").append($("<div></div>").addClass("batchat-users-panel-object").text(users[i]));
            }
        }
    }
    var timeString = function(t) {
        var s = t.toLocaleTimeString().split(/[:]/);
        return s[0]+":"+s[1];
    }
    var shuffle_panels = function() {
        var p_height = $("#batchat-main-panel").height() - (15+13);
        $("#batchat-messages-panel").height(p_height);
        $("#batchat-users-panel").height(p_height);
    }
    window.onresize = shuffle_panels;

    /* Constructor */
    var _c = function(vars) {
       element = vars.element;
       room = vars.room;
       nick = vars.nick;
       viewers_cb = vars.viewers_cb;
       guests_allowed = vars.guests_allowed;
       last_timestamp = new Date(1970);

       var style = document.createElement('style');
       style.type = 'text/css';
       if (style.styleSheet){
           style.styleSheet.cssText = css;
       } else {
           style.appendChild(document.createTextNode(css));
       }
       document.head.appendChild(style);

       var batchat_wrapper_obj = $("<div></div>").attr('id','batchat-wrapper');
       var batchat_main_obj = $("<div></div>").attr('id','batchat-main-panel');
       batchat_main_obj.append($("<div></div>").attr('id','batchat-messages-panel'));
       batchat_main_obj.append($("<div></div>").attr('id','batchat-users-panel'));
       batchat_wrapper_obj.append(batchat_main_obj);
       batchat_wrapper_obj.append($("<input></input>").attr('type','text').attr('id','batchat-bottom-bar'));
       element.append(batchat_wrapper_obj);

       if(nick=='' && getCookie("batc-live-chat-username")!="")
       {
           nick = getCookie("batc-live-chat-username");
       }

       nick = nick.substring(0,20);

       if(nick=='') {
           if(guests_allowed)
           {
               $("#batchat-bottom-bar").attr("placeholder","Type '/nick your_name' and press enter to register.");
           }
           else
           {
               $("#batchat-bottom-bar").attr("placeholder","Guest chat is disabled.");
               $("#batchat-bottom-bar").prop('disabled', true);
           }
       }
       else
       {
           $("#batchat-bottom-bar").attr("placeholder","Type a message here and press enter.");
       }
    
        $('#batchat-bottom-bar').on('keypress', function(e) {
            if (e.which == 13) {
                e.preventDefault();
                var messageText = $('#batchat-bottom-bar').val();
                $('#batchat-bottom-bar').val("");
                if(messageText.toLowerCase().startsWith("/nick ")) {
                    nick = messageText.substr(6).trim();
                    setCookie("batc-live-chat-username", nick, 28);
                    socket.emit('setnick',{nick: nick});
                    var nickMsg = {
                        'time': (new Date()).toISOString(),
                        'name':"[Chat Help]",
                        'message':"You are now known as '"+nick+"'"
                    };
                    appendMsg(nickMsg, true);
                    $("#batchat-bottom-bar").attr("placeholder","Type a message here and then press enter.");
                } else if(messageText.toLowerCase().startsWith("/help")) {
                    var helpMsg = {
                        'time': (new Date()).toISOString(),
                        'name':"[Chat Help]",
                        'message':"To change nick: '/nick your name'"
                    };
                    appendMsg(helpMsg, true);
                } else {
                   if(nick!='' && messageText!='') {
                     socket.emit('message', {message: messageText});
                   }
                }
            }
        });
        socket = io('/', {path: "/wb/chat/socket.io", query: 'room='+room});
        socket.on('history', function (data) {
            //console.log(data);
            initUsers(data.nicks);
            initHistory(data.history);
        });
        socket.on('viewers', function (data) {
            viewers_cb(data.num);
            //console.log(data);
        });
        socket.on('message', function (data) {
            //console.log(data);
            appendMsg(data, true);
        });
        socket.on('nicks', function (data) {
            //console.log(data);
            initUsers(data.nicks);
        });

        socket.on('reconnect', function (attemptNumber) {
            //console.log(attemptNumber);
            if(nick!='')
            {
                socket.emit('setnick',{nick: nick});
            }
        });

        if(nick!='')
        {
            socket.emit('setnick',{nick: nick});
        }

        shuffle_panels();
    };

    return _c;
})();
