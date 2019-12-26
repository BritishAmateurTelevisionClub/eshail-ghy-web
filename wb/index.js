const ws_url = "wss://"+window.location.hostname+"/wb/fft";
var ws_name = 'fft';
var ws_sock = null;
var ws_reconnect = null;

var render_timer;
const render_interval_map = {
  'fft': 250, // ms
  'fft_fast': 100 // ms
};
var render_interval = render_interval_map[ws_name];
var render_busy = false;
var render_buffer = [];

var el;
var ctx;
var canvasWidth;
var canvasHeight;

var fft_colour = 'green';

/* Load vars from local storage */
if(typeof(Storage) !== "undefined")
{
  storageSupport = true;

  if(localStorage.wb_fft_colour)
  {
    fft_colour = localStorage.wb_fft_colour;
  }

  if(localStorage.wb_fft_speed)
  {
    ws_name = localStorage.wb_fft_speed;
    render_interval = render_interval_map[ws_name];
  }
}

/* On load */
$(function() {
  canvasHeight = 542;
  canvasWidth = $("#fft-col").width();
  
  el = document.getElementById('c');

  initCanvas();

  updateFFT(null);

  /* Connect to websocket feed */
  ws_connect();
 
  var chat = new BATC_Chat({
    element: $("#chat"),
    room: 'eshail-wb',
    nick: '',
    viewers_cb: update_stats,
    guests_allowed: true
  });

  /* Hide fullscreen link for iOS */
  var n=navigator.userAgent.toLowerCase();
  if((n.indexOf('iphone')!=-1) || (n.indexOf('ipad')!=-1) || (n.indexOf('ipod')!=-1) || (n.indexOf('ios')!=-1))
  {
    $("#fullscreen-link").hide();
  }

  /* Change colour handler */
  $("#fft-colour-select").change(function()
  {
     fft_colour = $(this).children("option:selected").val();
     if(storageSupport)
     {
      localStorage.wb_fft_colour = fft_colour;
     }
  });

  /* Change colour handler */
  $("#fft-speed-select").change(function()
  {
     ws_name = $(this).children("option:selected").val();
     render_interval = render_interval_map[ws_name];
     clearInterval(render_timer);
     render_timer = setInterval(render_fft, render_interval);
     ws_sock.close();
     if(storageSupport)
     {
      localStorage.wb_fft_speed = ws_name;
     }
  });

  /* If we loaded value from localStorage then we probably need to set the colour */
  if(storageSupport && localStorage.wb_fft_colour)
  {
      $("#fft-colour-select").val(fft_colour);
  }

  /* If we loaded value from localStorage then we probably need to set the fft speed */
  if(storageSupport && localStorage.wb_fft_speed)
  {
      $("#fft-speed-select").val(ws_name);
  }
});

function initCanvas()
{
  $("#c").attr( "width", canvasWidth );
  $("#c").attr( "height", canvasHeight );

  ctx = el.getContext('2d');

  devicePixelRatio = window.devicePixelRatio || 1,
  backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                      ctx.mozBackingStorePixelRatio ||
                      ctx.msBackingStorePixelRatio ||
                      ctx.oBackingStorePixelRatio ||
                      ctx.backingStorePixelRatio || 1,
  ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio)
  {
    var oldWidth = el.width;
    var oldHeight = el.height;

    el.width = oldWidth * ratio;
    el.height = oldHeight * ratio;

    el.style.width = oldWidth + 'px';
    el.style.height = oldHeight + 'px';

    ctx.scale(ratio, ratio);
  }
}

function updateFFT(data)
{
  var i;

  const _start_freq = 490.75;

  /* Clear Screen */
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  /* Draw Dashed Vertical Lines and headers */
  ctx.save();
  ctx.setLineDash([5, 20]);
  for(i=0;i<18;i+=2)
  {
    /* Draw vertical line */
    ctx.beginPath();
    ctx.moveTo((canvasWidth/36)+i*(canvasWidth/18),25);
    ctx.lineTo((canvasWidth/36)+i*(canvasWidth/18),canvasHeight*(7/8));
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'grey';
    ctx.stroke();
    /* Draw Vertical Text */
    ctx.font = "15px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("10.4"+(91+(i*0.5)),(canvasWidth/36)+i*(canvasWidth/18),17);
  }
  ctx.restore();

  /* Draw Horizontal Lines */
  ctx.save();
  ctx.setLineDash([5, 10]);
  for(i=1;i<=4;i++)
  {
    linePos = (i*(canvasHeight/4))-(canvasHeight/6);
    ctx.beginPath();
    ctx.moveTo(0+35, linePos);
    ctx.lineTo(canvasWidth-35, linePos);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'grey';
    ctx.stroke();
    /* Annotate lines above 0dB */
    if(i!=4)
    {
      ctx.font = "12px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText((5*(4-i))+"dB",17,linePos+4);
      ctx.fillText((5*(4-i))+"dB",canvasWidth-17,linePos+4);
    }
  }
  ctx.restore();

  /* Draw Minor Horizontal Lines */
  ctx.save();
  ctx.setLineDash([1, 10]);
  for(i=1;i<20;i++)
  {
    if(i % 5 != 0)
    {
      linePos = (i*(canvasHeight/20))-(canvasHeight/6);
      ctx.beginPath();
      ctx.moveTo(0+10, linePos);
      ctx.lineTo(canvasWidth-10, linePos);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'grey';
      ctx.stroke();
    }
  }
  ctx.restore();


  /* Draw Band Splits */
  ctx.save();

  /* Band Start */
  ctx.beginPath();
  ctx.moveTo(((491)-_start_freq)*(canvasWidth/9),canvasHeight*(7.1/8));
  ctx.lineTo(((491)-_start_freq)*(canvasWidth/9),canvasHeight*(7.9/8));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'grey';
  ctx.stroke();

  /* Beacon & Simplex / Simplex */
  ctx.beginPath();
  ctx.moveTo(((494)-_start_freq)*(canvasWidth/9),canvasHeight*(7.1/8));
  ctx.lineTo(((494)-_start_freq)*(canvasWidth/9),canvasHeight*(7.9/8));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'grey';
  ctx.stroke();

  /* Simplex / RB-TV */
  ctx.beginPath();
  ctx.moveTo(((497)-_start_freq)*(canvasWidth/9),canvasHeight*(7.1/8));
  ctx.lineTo(((497)-_start_freq)*(canvasWidth/9),canvasHeight*(7.9/8));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'grey';
  ctx.stroke();

  /* Band End */
  ctx.beginPath();
  ctx.moveTo(((499.5)-_start_freq)*(canvasWidth/9),canvasHeight*(7.1/8));
  ctx.lineTo(((499.5)-_start_freq)*(canvasWidth/9),canvasHeight*(7.9/8));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'grey';
  ctx.stroke();

  ctx.restore();

  /* Draw channel allocations */
  ctx.save();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'blue';

  /* Beacon & Simplex 1Ms */
  rolloff = 0.2*1.0;
  ctx.beginPath();
  ctx.moveTo(((491.0+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((492.5-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((492.5+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((494.0-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  /* Beacon & Simplex 2Ms */
  rolloff = 0.2*2.0;
  ctx.beginPath();
  ctx.moveTo(((491+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((494-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  /* Simplex 1Ms */
  rolloff = 0.2*1.0;
  ctx.beginPath();
  ctx.moveTo(((494.0+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((495.5-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((495.5+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((497.0-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  /* Simplex 2Ms */
  rolloff = 0.2*2.0;
  ctx.beginPath();
  ctx.moveTo(((494+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((497-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  /* RB-TV 125Ks */
  rolloff = 0.2*0.125;
  ctx.beginPath();
  ctx.moveTo(((497.00+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((497.25-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((497.25+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((497.50-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((497.50+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((497.75-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((497.75+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((498.00-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((498.00+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((498.25-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((498.25+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((498.50-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((498.50+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((498.75-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((498.75+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((499.00-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((499.00+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((499.25-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((499.25+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.lineTo(((499.50-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.15/8));
  ctx.stroke();

  /* RB-TV 333Ks */
  rolloff = 0.2*0.333;
  ctx.beginPath();
  ctx.moveTo(((497.0+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((497.5-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((497.5+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((498.0-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((498.0+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((498.5-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((498.5+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((499.0-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(((499.0+(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.lineTo(((499.5-(rolloff/2))-_start_freq)*(canvasWidth/9),canvasHeight*(7.3/8));
  ctx.stroke();

  ctx.restore();

  /* Annotate Bands */
  ctx.save();
  ctx.font = "15px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("DATV Beacon",((492.5)-_start_freq)*(canvasWidth/9),canvasHeight-15);
  ctx.fillText("Wide & Narrow DATV",((495.5)-_start_freq)*(canvasWidth/9),canvasHeight-15);
  ctx.fillText("Narrow DATV",((498.25)-_start_freq)*(canvasWidth/9),canvasHeight-15);
  ctx.restore();

  /* Draw FFT */
  if(data != null)
  {
    var start_height = canvasHeight*(7/8);
    var data_length = data.length;
    ctx.lineWidth=1;
    ctx.strokeStyle = fft_colour;

    var sample;
    var sample_index;
    var sample_index_f;
    ctx.save();
    for(i=0; i<(canvasWidth-12); i++)
    {
      sample_index = (i*data_length)/ canvasWidth;
      sample_index_f = sample_index | 0;
      sample = data[sample_index_f]
         + (sample_index - sample_index_f) * (data[sample_index_f+1] - data[sample_index_f]);
      sample = (sample/65536.0);

      if(sample > (1/8))
      {
        ctx.beginPath();
        ctx.moveTo(i, start_height);
        ctx.lineTo(i, canvasHeight-(Math.min(sample, 1.0) * canvasHeight));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /*  Beacon Description */
  ctx.font = "15px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Beacon (DVB-S2, 2MS/s QPSK, 2/3)",((492.55)-491)*(canvasWidth/8),canvasHeight*(3.0/8));
}

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

function render_fft()
{
  if(!render_busy)
  {
    render_busy = true;
    if(render_buffer.length > 0)
    {
      /* Pull oldest frame off the buffer and render it */
      var data_frame = render_buffer.shift();
      updateFFT(data_frame);
      detect_signals(data_frame);

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
}
render_timer = setInterval(render_fft, render_interval);

function update_stats(num) {
  $("#stats").text("Wideband viewers: "+num);
}

function align_symbolrate(width)
{
  //console.log(width);
  if(width < 0.022)
  {
    return 0;
  }
  else if(width < 0.060)
  {
    return 0.035;
  }
  else if(width < 0.086)
  {
    return 0.066;
  }
  else if(width < 0.185)
  {
    return 0.125;
  }
  else if(width < 0.277)
  {
    return 0.250;
  }
  else if(width < 0.388)
  {
    return 0.333;
  }
  else if(width < 0.700)
  {
    return 0.500;
  }
  else if(width < 1.2)
  {
    return 1.000;
  }
  else if(width < 1.6)
  {
    return 1.500;
  }
  else if(width < 2.2)
  {
    return 2.000;
  }
  else
  {
    return Math.round(width*5)/5.0;
  }
}

function print_symbolrate(symrate)
{
  if(symrate < 0.7)
  {
    return Math.round(symrate*1000)+"KS";
  }
  else
  {
    return (Math.round(symrate*10)/10)+"MS";
  }
}

function print_frequency(freq,symrate)
{
  if(symrate < 0.7)
  {
    return "'"+(Math.round(freq*80)/80.0).toFixed(3);
  }
  else
  {
    return "'"+(Math.round(freq*40)/40.0).toFixed(3);
  }
}


function is_overpower(beacon_strength, signal_strength, signal_bw)
{
  const scale_db = 3276.8;

  if(beacon_strength != 0)
  {
    //if(signal_bw < 0.06) // < 66KS
    //{
    //  return false;
    //}

    if(signal_bw < 0.7) // < 1MS
    {
      return false;
    }
    
    if(signal_strength > beacon_strength) // >= 1MS
    {
      return true;
    }
  }
  return false;
}

function detect_signals(fft_data)
{
  var i;
  var j;

  const noise_level = 11000;
  const signal_threshold = 16000;

  var in_signal = false;
  var start_signal;
  var end_signal;
  var mid_signal;
  var strength_signal;
  var signal_bw;
  var signal_freq;
  var acc;
  var acc_i;

  var beacon_strength = 0;

  var text_x_position;

  for(i=2;i<fft_data.length;i++)
  {
    if(!in_signal)
    {
      if((fft_data[i] + fft_data[i-1] + fft_data[i-2])/3.0 > signal_threshold)
      {
        in_signal = true;
        start_signal = i;
      }
    }
    else /* in_signal == true */
    {
      if((fft_data[i] + fft_data[i-1] + fft_data[i-2])/3.0 < signal_threshold)
      {
        in_signal = false;

        end_signal = i;
        acc = 0;
        acc_i = 0;
        for(j=(start_signal + (0.3*(end_signal - start_signal))) | 0; j<start_signal+(0.7*(end_signal - start_signal)); j++)
        {
          acc = acc + fft_data[j];
          acc_i = acc_i + 1;
        }
        /*
        ctx.save();
          ctx.lineWidth=1;
          ctx.strokeStyle = 'white';
          ctx.beginPath();
          ctx.moveTo((start_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (signal_threshold/65536)));
          ctx.lineTo((end_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (signal_threshold/65536)));
          ctx.stroke();
        ctx.restore();
        */

        strength_signal = acc / acc_i;
        /*
        ctx.save();
          ctx.lineWidth=1;
          ctx.strokeStyle = 'white';
          ctx.beginPath();
          ctx.moveTo((start_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (strength_signal/65536)));
          ctx.lineTo((end_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (strength_signal/65536)));
          ctx.stroke();
        ctx.restore();
        */

        /* Find real start of top of signal */
        for(j = start_signal; (fft_data[j] - noise_level) < 0.75*(strength_signal - noise_level); j++)
        {
          start_signal = j;
        }
        /*
        ctx.save();
          ctx.lineWidth=1;
          ctx.strokeStyle = 'white';
          ctx.beginPath();
          ctx.moveTo((start_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (strength_signal/65536)));
          ctx.lineTo((start_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (strength_signal/65536)) + 20);
          ctx.stroke();
        ctx.restore();
        */

        /* Find real end of the top of signal */
        for(j = end_signal; (fft_data[j] - noise_level) < 0.75*(strength_signal - noise_level); j--)
        {
          end_signal = j;
        }
        /*
        ctx.save();
          ctx.lineWidth=1;
          ctx.strokeStyle = 'white';
          ctx.beginPath();
          ctx.moveTo((end_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (strength_signal/65536)));
          ctx.lineTo((end_signal/fft_data.length)*canvasWidth, canvasHeight * (1 - (strength_signal/65536)) + 20);
          ctx.stroke();
        ctx.restore();
        */

        mid_signal = start_signal + ((end_signal - start_signal)/2.0);

        signal_bw = align_symbolrate((end_signal - start_signal) * (9.0 / fft_data.length));
        signal_freq = 490.75 + (((mid_signal+1) / fft_data.length) * 9.0);

        // Exclude signals in beacon band
        if(signal_freq < 492.6)
        {
          if(signal_bw > 1.2)
          {
            // Probably the Beacon!
            beacon_strength = strength_signal;
          }
          continue;
        }

  /*
        console.log("####");
    for(j = start_signal; j < end_signal; j++)
    {
  console.log(fft_data[j]);
    }
    */

        /* Sanity check bandwidth, and exclude beacon */
        if(signal_bw != 0)
        {
          text_x_position = (mid_signal/fft_data.length)*canvasWidth;

          /* Adjust for right-side overlap */
          if(text_x_position > (0.95 * canvasWidth))
          {
            text_x_position = canvasWidth - 55;
          }

          ctx.save();

          ctx.font = "14px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          if(!is_overpower(beacon_strength, strength_signal, signal_bw))
  {
            ctx.fillText(
              print_symbolrate(signal_bw)+", "+print_frequency(signal_freq,signal_bw),
              text_x_position,
              canvasHeight-((strength_signal/65536) * canvasHeight) - 16
            );
  }
  else
          {
            ctx.fillText(
              "[over-power]",
              text_x_position,
              canvasHeight-((strength_signal/65536) * canvasHeight) - 16
            );
          }

          ctx.restore();
        }
      }
    }
  }
if(in_signal)
{
end_signal = fft_data.length;
acc = 0;
    acc_i = 0;
    for(j=(start_signal + (0.3*(end_signal - start_signal))) | 0; j<start_signal+(0.7*(end_signal - start_signal)); j++)
    {
      acc = acc + fft_data[j];
      acc_i = acc_i + 1;
    }

    strength_signal = acc / acc_i;

    ctx.save();
ctx.fillText(
      "[out-of-band]",
      (canvasWidth - 55),
      canvasHeight-((strength_signal/65536) * canvasHeight) - 16
    );
    ctx.restore();
}
}

function fft_fullscreen()
{
  if(el.requestFullscreen)
  {
    el.requestFullscreen();
  }
  else if(el.webkitRequestFullScreen)
  {
    el.webkitRequestFullScreen();
  }
  else if(el.mozRequestFullScreen)
  {
    el.mozRequestFullScreen();
  }  
}

var checkFullScreen = function()
{
  if(typeof document.fullScreen != "undefined")
  {
    return document.fullScreen;
  }
  else if(typeof document.webkitIsFullScreen != "undefined")
  {
    return document.webkitIsFullScreen;
  }
  else if(typeof document.mozFullScreen != "undefined")
  {
    return document.mozFullScreen;
  }
  else
  {
    return false;
  }
}

var previousOrientation = window.orientation;
var checkOrientation = function()
{
  if(checkFullScreen())
  {
    if(window.orientation !== previousOrientation)
    {
      if (0 != (previousOrientation + window.orientation) % 180)
      {
        canvasWidth = window.innerHeight;
        canvasHeight = window.innerWidth;
        initCanvas();
      }

      previousOrientation = window.orientation;

      previousHeight = window.innerHeight;
      previousWidth = window.innerWidth;
    }
  }
};

var previousHeight = window.innerHeight;
var previousWidth = window.innerWidth;
var checkResize = function()
{
  if(!checkFullScreen()
    && (previousHeight != window.innerHeight || previousWidth != window.innerWidth))
  {
    canvasHeight = 550;
    canvasWidth = $("#fft-col").width();
    initCanvas();

    previousHeight = window.innerHeight;
    previousWidth = window.innerWidth;
  }
}

window.addEventListener("fullscreenchange", function()
{
  if(checkFullScreen())
  {
    setTimeout(function() {
      /* Set canvas to full document size */
      canvasHeight = $("#c").height();
      canvasWidth = $("#c").width();
      initCanvas();
    },10);
  }
  else
  {
    /* Reset canvas size */
    canvasHeight = 550;
    canvasWidth = $("#fft-col").width();
    initCanvas();
  }
});

window.addEventListener("resize", checkResize, false);
window.addEventListener("orientationchange", checkOrientation, false);

// Android doesn't always fire orientationChange on 180 degree turns
setInterval(checkOrientation, 2000);

const ping_interval = 10*1000;
function ping() {
  var request = new XMLHttpRequest();
  request.open('GET', 'https://eshail.batc.org.uk/a.gif', true);
  request.send();
  request = null;
  setTimeout(ping, ping_interval);
}
setTimeout(ping, ping_interval);
