function strWebsocket(_websocket_url, _websocket_name, _websocket_rx_buffer)
{
  this.ws_url = _websocket_url;
  this.ws_name = _websocket_name;
  this.ws_tx_buffer = [];
  this.ws_rx_buffer = _websocket_rx_buffer;

  this.ws_sock = null;
  this.ws_reconnect = null;
  this.ws_connected = false;

  this.connect = function()
  {
    if (typeof MozWebSocket != "undefined")
    {
      this.ws_sock = new MozWebSocket(this.ws_url, this.ws_name);
    }
    else
    {
      this.ws_sock = new WebSocket(this.ws_url, this.ws_name);
    }
    this.ws_sock.onopen = this.onopen.bind(this);
    this.ws_sock.onmessage = this.onmessage.bind(this);
    this.ws_sock.onclose = this.onclose.bind(this);
  }
  this.onopen = function()
  {
    window.clearInterval(this.ws_reconnect);
    this.ws_reconnect = null;
    this.ws_connected = true;

    if(this.ws_tx_buffer.length > 0)
    {
      this.sendMessage(this.ws_tx_buffer.shift());
    }
  }
  this.onmessage = function(msg)
  {
    this.ws_rx_buffer.push(msg.data);
  }
  this.onclose = function()
  {
    this.ws_connected = false;
    if(this.ws_sock != null)
    {
      this.ws_sock.close();
    }
    this.ws_sock = null;
    
    if(!this.ws_reconnect)
    {
      this.ws_reconnect = setInterval(function()
      {
        this.connect();
      }.bind(this),500);
    }
  }
  this.changeName = function(_newName)
  {
    this.ws_name = _newName;
    this.ws_sock = null;
    this.connect();
  }
  this.sendMessage = function(_message)
  {
    if(this.ws_connected)
    {
      this.ws_sock.send(_message);
    }
    else
    {
      this.ws_tx_buffer.push(_message);
    }
  }

  if("WebSocket" in window)
  { 
    this.connect();
  }
  else
  {
    alert("Websockets are not supported in your browser!");
  }
}
