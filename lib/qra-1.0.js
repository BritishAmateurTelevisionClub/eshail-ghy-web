// Source: http://dauda.at/locator/locator.js
// Credit: (c) 2009 Mike, OE3MDC

function getDeg(arg, base, offset, cmp)
// convert letters into angles by subtracting the base char code from the input char code
{
  return(base + offset * (arg.toUpperCase().charCodeAt(0) - cmp.charCodeAt(0)));
}

function LoctoLatLon(maidenhead)
{
  var x = 0;
  var sw_lon;
  var ne_lon;
  var ce_lon;
  var sw_lat;
  var ne_lat;
  var ce_lat;
  while (x < maidenhead.length)
  {
    switch(x)
    {
      case 0:
        sw_lon = getDeg(maidenhead.charAt(x), -180, 20, "A");
        ne_lon = sw_lon + 20;
        ce_lon = sw_lon + 10;
        break;
      case 1:
        sw_lat = getDeg(maidenhead.charAt(x), -90, 10, "A");
        ne_lat = sw_lat + 10;
        ce_lat = sw_lat + 5;
        break;
      case 2:
        sw_lon += getDeg(maidenhead.charAt(x), 0, 2, "0");
        ne_lon = sw_lon + 2;
        ce_lon = sw_lon + 1;
        break;
      case 3:
        sw_lat += getDeg(maidenhead.charAt(x), 0, 1, "0");
        ne_lat = sw_lat + 1;
        ce_lat = sw_lat + 0.5;
        break;
      case 4:
        sw_lon += getDeg(maidenhead.charAt(x), 0, 2/24, "A");
        ne_lon = sw_lon + 2/24;
        ce_lon = sw_lon + 1/24;
        break;
      case 5:
        sw_lat += getDeg(maidenhead.charAt(x), 0, 1/24, "A");
        ne_lat = sw_lat + 1/24;
        ce_lat = sw_lat + 0.5/24;
        break;
      default:
        break;
    }
    x++;
  }
  return [ce_lat, ce_lon];
}

function CoordToLoc(Lat, Lon)
{
  var Locator = "";

  Lon = Lon + 180; // we want positive values starting from 0
  Lat = Lat + 90;
  Lon = Lon / 20 + 0.0000001; // help for rounding
  Lat = Lat / 10 + 0.0000001;
  Locator = Locator + String.fromCharCode(65 + Lon) + String.fromCharCode(65 + Lat);
  Lon = Lon - Math.floor(Lon);
  Lat = Lat - Math.floor(Lat);
  Lon = Lon * 10;
  Lat = Lat * 10;
  Locator = Locator + String.fromCharCode(48 + Lon) + String.fromCharCode(48 + Lat);
  Lon = Lon - Math.floor(Lon);
  Lat = Lat - Math.floor(Lat);
  Lon = Lon * 24;
  Lat = Lat * 24;
  Locator = Locator + String.fromCharCode(65 + Lon) + String.fromCharCode(65 + Lat);

  return(Locator);
}
