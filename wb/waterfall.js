const ws_url = "wss://eshail.batc.org.uk/wb/fft";
const ws_name = "fft_fast";
var ws_sock = null;
var ws_reconnect = null;

var render_timer;
const render_interval = 100; // ms
var render_busy = false;
var render_buffer = [];

var wf;
var sp;

$(document).ready(function()
{
  ws_connect();

  colourMap = new ColourMap();

  wf = new Waterfall("waterfall", colourMap);

  sp = new Spectrum("spectrum", colourMap);
});

function ws_connect()
{
  if("WebSocket" in window)
  {
    if(ws_sock != null)
    {
      return;
    }
  
    if (typeof MozWebSocket != "undefined")
    {
      ws_sock = new MozWebSocket(ws_url, ws_name);
    }
    else
    {
      ws_sock = new WebSocket(ws_url, ws_name);
    }

    ws_sock.binaryType = 'arraybuffer';

    ws_sock.onopen = function()
    {
      window.clearInterval(ws_reconnect);
      ws_reconnect = null;
      //console.log("Websocket Connection Opened");
    } 

    ws_sock.onmessage = function got_packet(msg)
    {
      try
      {
        parsed_fft = new Uint16Array(msg.data);
        if(parsed_fft != null)
        {
          render_buffer.push(parsed_fft);
        }
      }
      catch(e)
      {
        console.log("Error parsing binary!",e);
      }
    } 

    ws_sock.onclose = function()
    {
      ws_sock.close();
      ws_sock = null;
      
      if(!ws_reconnect)
      {
        ws_reconnect = setInterval(function()
        {
          ws_connect();
        },500);
      }
    }
  }
  else
  {
    alert("Websockets not supported in your browser!");
  }
}

render_timer = setInterval(function()
{
  if(!render_busy)
  {
    render_busy = true;
    if(render_buffer.length > 0)
    {
      /* Pull oldest frame off the buffer and render it */
      var data_frame = render_buffer.shift();

      wf.addLine(data_frame);
      sp.updateData(data_frame);

      /* If we're buffering up, remove old queued frames (unsure about this) */
      if(render_buffer.length > 2)
      {
        render_buffer.splice(0, render_buffer.length - 2);
      }
    }
    render_busy = false;
  }
  else
  {
    console.log("Slow render blocking next frame, configured interval is ", render_interval);
  }
}, render_interval);


function Spectrum(spectrumCanvasId, colourMap)
{
    this.width = $("#" + spectrumCanvasId).width();
    this.height = $("#" + spectrumCanvasId).height();

    this.ctx = document.getElementById(spectrumCanvasId).getContext("2d");

    this.map = colourMap;

    this.updateData = function(data)
    {
      var dataLength = data.length;
      var i;
      var sample_index;
      var sample_index_f;
      var sample;
      var sample_fraction;

      this.ctx.clearRect(0, 0, this.width, this.height);

      for(i=0; i<this.width; i++)
        {
          sample_index = (i*dataLength)/ this.width;
          sample_index_f = sample_index | 0;
          sample = data[sample_index_f]
             + (sample_index - sample_index_f) * (data[sample_index_f+1] - data[sample_index_f]);
          sample_fraction = sample / 65535;
          sample = (sample * (256.0 / 65536)) | 0;
          this.ctx.fillStyle = "rgba("+this.map[sample][0]+","+this.map[sample][1]+","+this.map[sample][2]+",255)";
          this.ctx.fillRect(i, this.height-(sample_fraction * this.height), 2, 2);
        }
    };
}

function Waterfall(canvasFrontId, colourMap)
{
    this.width = $("#" + canvasFrontId).width();
    this.height = $("#" + canvasFrontId).height();

    this.map = colourMap;

    this.imgFront = document.getElementById(canvasFrontId);
    this.ctxFront = this.imgFront.getContext("2d");

    this.lineImage = this.ctxFront.createImageData(this.width, 1);

    this.addLine = function(data)
    {
      var dataLength = data.length;
      var imgdata = this.lineImage.data;
      var lookup = 0;
      var i = 0;

      for (lookup = 0; lookup < this.width; lookup++)
      {
        sample_index = (lookup*dataLength)/this.width;
        sample_index_f = sample_index | 0;
        sample = data[sample_index_f]
           + (sample_index - sample_index_f) * (data[sample_index_f+1] - data[sample_index_f]);
        sample_fraction = sample * (256 / 65536);
        var rgb = this.map[sample_fraction | 0];
        imgdata[i++] = rgb[0];
        imgdata[i++] = rgb[1];
        imgdata[i++] = rgb[2];
        imgdata[i++] = 255;
      }
      this.ctxFront.drawImage(this.imgFront, 
                    0, 0, this.width, this.height - 1, 
                    0, 1, this.width, this.height - 1);
      this.ctxFront.putImageData(this.lineImage, 0, 0);

      if (this.existingHeight < (this.height-1))
      {
        this.existingHeight++;
      }
    };
}

function ColourMap()
{
  var map = new Array(256);

  var e;
  for (e = 0; 64 > e; e++)
  {
    map[e] = new Uint8Array(3);
    map[e][0] = 0;
    map[e][1] = 0;
    map[e][2] = 2 * e;
  }
  for (; 128 > e; e++)
  {
    map[e] = new Uint8Array(3);
    map[e][0] = 3 * e - 192;
    map[e][1] = 0;
    map[e][2] = 2 * e;
  }
  for (; 192 > e; e++)
  {
    map[e] = new Uint8Array(3);
    map[e][0] = e + 64;
    map[e][1] = 256 * Math.sqrt((e - 128) / 64);
    map[e][2] = 511 - 2 * e;
  }
  for (; 256 > e; e++)
  {
    map[e] = new Uint8Array(3);
    map[e][0] = 255;
    map[e][1] = 255;
    map[e][2] = 512 + 2 * e;
  }

  return map;
}
