/*

Source: http://www.geosats.com/magdecli.html - April 2019
 - Updated for 2020-2025 WMM - Phil Crump - January 2020
 - Updated for 2025-2030 WMM - Phil Crump - January 2025

Update info: "WMM Coefficient file (WMM.COF)" from https://www.ncei.noaa.gov/products/world-magnetic-model

DOD World Magnetic Model 2020-2025 
See bottom of file for info from original Fortran source code 
Reminder - this is just a model! See the USGS and BGS sites for predicted accuracy.

Usage is var wmm = new WorldMagneticModel();
then var dec = wmm.declination(0.0, 59.0, -2.0, 2015.5); 

parameters are:
altitude in kilometres
decimal degree latitude, -ve for south
decimal degree longitude, -ve for west
date as year + fraction of year

return is declination angle in decimal degrees, 
+ve for Magnetic North East of True North
(-999 for < 2015.0 and >= 2020.0)

The method knownAnswerTest yields a maximum declination error of 0.12% on the USGS test data set. 
This is assumed to be down to the use of double rather than single precision floating point arithmetic. 
The maximum error is at 0 latitude, 120W longitude. The value produced by this code at this point is 9.191 degrees.
This is the same answer as produced by the BGS calculator at http://www.geomag.bgs.ac.uk/gifs/wmm_calc.html
*/

function WorldMagneticModel (){

/* 2025 - 2030 coefficients from WMM-2025 11/13/2024 */

this.coff = [
"  1  0  -29351.8       0.0       12.0        0.0",
"  1  1   -1410.8    4545.4        9.7      -21.5",
"  2  0   -2556.6       0.0      -11.6        0.0",
"  2  1    2951.1   -3133.6       -5.2      -27.7",
"  2  2    1649.3    -815.1       -8.0      -12.1",
"  3  0    1361.0       0.0       -1.3        0.0",
"  3  1   -2404.1     -56.6       -4.2        4.0",
"  3  2    1243.8     237.5        0.4       -0.3",
"  3  3     453.6    -549.5      -15.6       -4.1",
"  4  0     895.0       0.0       -1.6        0.0",
"  4  1     799.5     278.6       -2.4       -1.1",
"  4  2      55.7    -133.9       -6.0        4.1",
"  4  3    -281.1     212.0        5.6        1.6",
"  4  4      12.1    -375.6       -7.0       -4.4",
"  5  0    -233.2       0.0        0.6        0.0",
"  5  1     368.9      45.4        1.4       -0.5",
"  5  2     187.2     220.2        0.0        2.2",
"  5  3    -138.7    -122.9        0.6        0.4",
"  5  4    -142.0      43.0        2.2        1.7",
"  5  5      20.9     106.1        0.9        1.9",
"  6  0      64.4       0.0       -0.2        0.0",
"  6  1      63.8     -18.4       -0.4        0.3",
"  6  2      76.9      16.8        0.9       -1.6",
"  6  3    -115.7      48.8        1.2       -0.4",
"  6  4     -40.9     -59.8       -0.9        0.9",
"  6  5      14.9      10.9        0.3        0.7",
"  6  6     -60.7      72.7        0.9        0.9",
"  7  0      79.5       0.0       -0.0        0.0",
"  7  1     -77.0     -48.9       -0.1        0.6",
"  7  2      -8.8     -14.4       -0.1        0.5",
"  7  3      59.3      -1.0        0.5       -0.8",
"  7  4      15.8      23.4       -0.1        0.0",
"  7  5       2.5      -7.4       -0.8       -1.0",
"  7  6     -11.1     -25.1       -0.8        0.6",
"  7  7      14.2      -2.3        0.8       -0.2",
"  8  0      23.2       0.0       -0.1        0.0",
"  8  1      10.8       7.1        0.2       -0.2",
"  8  2     -17.5     -12.6        0.0        0.5",
"  8  3       2.0      11.4        0.5       -0.4",
"  8  4     -21.7      -9.7       -0.1        0.4",
"  8  5      16.9      12.7        0.3       -0.5",
"  8  6      15.0       0.7        0.2       -0.6",
"  8  7     -16.8      -5.2       -0.0        0.3",
"  8  8       0.9       3.9        0.2        0.2",
"  9  0       4.6       0.0       -0.0        0.0",
"  9  1       7.8     -24.8       -0.1       -0.3",
"  9  2       3.0      12.2        0.1        0.3",
"  9  3      -0.2       8.3        0.3       -0.3",
"  9  4      -2.5      -3.3       -0.3        0.3",
"  9  5     -13.1      -5.2        0.0        0.2",
"  9  6       2.4       7.2        0.3       -0.1",
"  9  7       8.6      -0.6       -0.1       -0.2",
"  9  8      -8.7       0.8        0.1        0.4",
"  9  9     -12.9      10.0       -0.1        0.1",
" 10  0      -1.3       0.0        0.1        0.0",
" 10  1      -6.4       3.3        0.0        0.0",
" 10  2       0.2       0.0        0.1       -0.0",
" 10  3       2.0       2.4        0.1       -0.2",
" 10  4      -1.0       5.3       -0.0        0.1",
" 10  5      -0.6      -9.1       -0.3       -0.1",
" 10  6      -0.9       0.4        0.0        0.1",
" 10  7       1.5      -4.2       -0.1        0.0",
" 10  8       0.9      -3.8       -0.1       -0.1",
" 10  9      -2.7       0.9       -0.0        0.2",
" 10 10      -3.9      -9.1       -0.0       -0.0",
" 11  0       2.9       0.0        0.0        0.0",
" 11  1      -1.5       0.0       -0.0       -0.0",
" 11  2      -2.5       2.9        0.0        0.1",
" 11  3       2.4      -0.6        0.0       -0.0",
" 11  4      -0.6       0.2        0.0        0.1",
" 11  5      -0.1       0.5       -0.1       -0.0",
" 11  6      -0.6      -0.3        0.0       -0.0",
" 11  7      -0.1      -1.2       -0.0        0.1",
" 11  8       1.1      -1.7       -0.1       -0.0",
" 11  9      -1.0      -2.9       -0.1        0.0",
" 11 10      -0.2      -1.8       -0.1        0.0",
" 11 11       2.6      -2.3       -0.1        0.0",
" 12  0      -2.0       0.0        0.0        0.0",
" 12  1      -0.2      -1.3        0.0       -0.0",
" 12  2       0.3       0.7       -0.0        0.0",
" 12  3       1.2       1.0       -0.0       -0.1",
" 12  4      -1.3      -1.4       -0.0        0.1",
" 12  5       0.6      -0.0       -0.0       -0.0",
" 12  6       0.6       0.6        0.1       -0.0",
" 12  7       0.5      -0.1       -0.0       -0.0",
" 12  8      -0.1       0.8        0.0        0.0",
" 12  9      -0.4       0.1        0.0       -0.0",
" 12 10      -0.2      -1.0       -0.1       -0.0",
" 12 11      -1.3       0.1       -0.0        0.0",
" 12 12      -0.7       0.2       -0.1       -0.1"
];

/* static variables */

/* some 13x13 2D arrays */
this.c = new Array(13); 
this.cd = new Array(13); 
this.tc = new Array(13); 
this.dp = new Array(13); 
this.k = new Array(13); 

for(var i=0; i< 13; i++)
{
    this.c[i] = new Array(13); 
    this.cd[i] = new Array(13); 
    this.tc[i] = new Array(13); 
    this.dp[i] = new Array(13); 
    this.k[i] = new Array(13); 
}

/* some 1D arrays */
this.snorm = new Array(169); 
this.sp = new Array(13); 
this.cp = new Array(13); 
this.fn = new Array(13); 
this.fm = new Array(13); 
this.pp = new Array(13); 

/* locals */

var maxdeg = 12;
var maxord;
var i,j,D1,D2,n,m;
var a,b,a2,b2,c2,a4,b4,c4,re;
var gnm,hnm,dgnm,dhnm,flnmj;
var c_str;
var c_flds;

/* INITIALIZE CONSTANTS */

maxord = maxdeg;
this.sp[0] = 0.0;
this.cp[0] = this.snorm[0] = this.pp[0] = 1.0;
this.dp[0][0] = 0.0;
a = 6378.137;
b = 6356.7523142;
re = 6371.2;
a2 = a*a;
b2 = b*b;
c2 = a2-b2;
a4 = a2*a2;
b4 = b2*b2;
c4 = a4 - b4;

/* READ WORLD MAGNETIC MODEL SPHERICAL HARMONIC COEFFICIENTS */
this.c[0][0] = 0.0;
this.cd[0][0] = 0.0;

for(i=0; i<this.coff.length; i++)
{
  c_str = this.coff[i];
  c_flds = c_str.split(/[ ,]+/);

  n = parseInt(c_flds[1]);   
  m = parseInt(c_flds[2]);   
  gnm = parseFloat(c_flds[3]);
  hnm = parseFloat(c_flds[4]);
  dgnm = parseFloat(c_flds[5]);
  dhnm = parseFloat(c_flds[6]);

  if (m <= n)
  {
	this.c[m][n] = gnm;
	this.cd[m][n] = dgnm;
	if (m != 0) 
	{
	  this.c[n][m-1] = hnm;
	  this.cd[n][m-1] = dhnm;
	}
  }
}

/* CONVERT SCHMIDT NORMALIZED GAUSS COEFFICIENTS TO UNNORMALIZED */

this.snorm[0] = 1.0;
for (n=1; n<=maxord; n++) 
{
    this.snorm[n] = this.snorm[n-1]*(2*n-1)/n;
    j = 2;
    for (m=0,D1=1,D2=(n-m+D1)/D1; D2>0; D2--,m+=D1) 
    {
        this.k[m][n] = (((n-1)*(n-1))-(m*m))/((2*n-1)*(2*n-3));
        if (m > 0) 
        {
        flnmj = ((n-m+1)*j)/(n+m);
        this.snorm[n+m*13] = this.snorm[n+(m-1)*13]*Math.sqrt(flnmj);
        j = 1;
        this.c[n][m-1] = this.snorm[n+m*13]*this.c[n][m-1];
        this.cd[n][m-1] = this.snorm[n+m*13]*this.cd[n][m-1];
        }
        this.c[m][n] = this.snorm[n+m*13]*this.c[m][n];
        this.cd[m][n] = this.snorm[n+m*13]*this.cd[m][n];
    }
    this.fn[n] = (n+1);
    this.fm[n] = n;
}
this.k[1][1] = 0.0;
this.fm[0] = 0.0; // !!! WMM C and Fortran both have a bug in that fm[0] is not initialised 

}

WorldMagneticModel.prototype.declination = function(altitudeKm, latitudeDegrees, longitudeDegrees, yearFloat){

/* locals */

var a = 6378.137;
var b = 6356.7523142;
var re = 6371.2;
var a2 = a*a;
var b2 = b*b;
var c2 = a2-b2;
var a4 = a2*a2;
var b4 = b2*b2;
var c4 = a4 - b4;
var D3, D4;
var dip, ti, gv, dec;
var n,m;

var pi, dt, rlon, rlat, srlon, srlat, crlon, crlat,srlat2,
crlat2, q, q1, q2, ct, d,aor,ar, br, r2, bpp, par,
temp1,parp,temp2,bx,by,bz,bh,dtr,bp,bt, st,ca,sa;

var maxord = 12;
var alt = altitudeKm;
var glon = longitudeDegrees;
var glat = latitudeDegrees;

/*************************************************************************/

dt = yearFloat - 2025.0;
// if more then 5 years has passed since last epoch update then return invalid
if ((dt < 0.0) || (dt > 5.0)) 
   return -999;

pi = 3.14159265359;
dtr = pi/180.0;
rlon = glon*dtr;
rlat = glat*dtr;
srlon = Math.sin(rlon);
srlat = Math.sin(rlat);
crlon = Math.cos(rlon);
crlat = Math.cos(rlat);
srlat2 = srlat*srlat;
crlat2 = crlat*crlat;
this.sp[1] = srlon;
this.cp[1] = crlon;

/* CONVERT FROM GEODETIC COORDS. TO SPHERICAL COORDS. */

q = Math.sqrt(a2-c2*srlat2);
q1 = alt*q;
q2 = ((q1+a2)/(q1+b2))*((q1+a2)/(q1+b2));
ct = srlat/Math.sqrt(q2*crlat2+srlat2);
st = Math.sqrt(1.0-(ct*ct));
r2 = (alt*alt)+2.0*q1+(a4-c4*srlat2)/(q*q);
r = Math.sqrt(r2);
d = Math.sqrt(a2*crlat2+b2*srlat2);
ca = (alt+d)/r;
sa = c2*crlat*srlat/(r*d);

for (m=2; m<=maxord; m++)
{
    this.sp[m] = this.sp[1]*this.cp[m-1]+this.cp[1]*this.sp[m-1];
    this.cp[m] = this.cp[1]*this.cp[m-1]-this.sp[1]*this.sp[m-1];
}

aor = re/r;
ar = aor*aor;
br = bt = bp = bpp = 0.0;

for (n=1; n<=maxord; n++) 
{
    ar = ar*aor;
    for (m=0,D3=1,D4=(n+m+D3)/D3; D4>0; D4--,m+=D3) 
    {
        /*
           COMPUTE UNNORMALIZED ASSOCIATED LEGENDRE POLYNOMIALS
           AND DERIVATIVES VIA RECURSION RELATIONS
        */

        if (n == m) 
        {
          this.snorm[n+m*13] = st*this.snorm[n-1+(m-1)*13];
          this.dp[m][n] = st*this.dp[m-1][n-1]+ct*this.snorm[n-1+(m-1)*13];
        }
        else if (n == 1 && m == 0) 
        {
          this.snorm[n+m*13] = ct*this.snorm[n-1+m*13];
          this.dp[m][n] = ct*this.dp[m][n-1]-st*this.snorm[n-1+m*13];
        }
        else if (n > 1 && n != m) 
        {
          if (m > n-2) this.snorm[n-2+m*13] = 0.0;
          if (m > n-2) this.dp[m][n-2] = 0.0;
          this.snorm[n+m*13] = ct*this.snorm[n-1+m*13]-this.k[m][n]*this.snorm[n-2+m*13];
          this.dp[m][n] = ct*this.dp[m][n-1] - st*this.snorm[n-1+m*13]-this.k[m][n]*this.dp[m][n-2];
         }

        /*
        TIME ADJUST THE GAUSS COEFFICIENTS
        */
        this.tc[m][n] = this.c[m][n]+dt*this.cd[m][n];
        if (m != 0) this.tc[n][m-1] = this.c[n][m-1]+dt*this.cd[n][m-1];

        /*
        ACCUMULATE TERMS OF THE SPHERICAL HARMONIC EXPANSIONS
        */
        par = ar*this.snorm[n+m*13];
        if (m == 0) 
        {
            temp1 = this.tc[m][n]*this.cp[m];
            temp2 = this.tc[m][n]*this.sp[m];
        }
        else 
        {
            temp1 = this.tc[m][n]*this.cp[m]+this.tc[n][m-1]*this.sp[m];
            temp2 = this.tc[m][n]*this.sp[m]-this.tc[n][m-1]*this.cp[m];
        }
        bt = bt-ar*temp1*this.dp[m][n];
        bp += (this.fm[m]*temp2*par);
        br += (this.fn[n]*temp1*par);
        /*
        SPECIAL CASE:  NORTH/SOUTH GEOGRAPHIC POLES
        */
        if (st == 0.0 && m == 1) 
        {
            if (n == 1) this.pp[n] = this.pp[n-1];
            else this.pp[n] = this.ct*this.pp[n-1]-this.k[m][n]*this.pp[n-2];
            parp = ar*this.pp[n];
            bpp += (this.fm[m]*temp2*parp);
        }
    }
}

if (st == 0.0) 
    bp = bpp;
else 
    bp /= st;

/*
    ROTATE MAGNETIC VECTOR COMPONENTS FROM SPHERICAL TO
    GEODETIC COORDINATES
*/
bx = -bt*ca-br*sa;
by = bp;
bz = bt*sa-br*ca;
/*
    COMPUTE DECLINATION (DEC), INCLINATION (DIP) AND
    TOTAL INTENSITY (TI)
*/
bh = Math.sqrt((bx*bx)+(by*by));
ti = Math.sqrt((bh*bh)+(bz*bz));
dec = Math.atan2(by,bx)/dtr;
dip = Math.atan2(bz,bh)/dtr;
/*
    COMPUTE MAGNETIC GRID VARIATION IF THE CURRENT
    GEODETIC POSITION IS IN THE ARCTIC OR ANTARCTIC
    (I.E. GLAT > +55 DEGREES OR GLAT < -55 DEGREES)

    OTHERWISE, SET MAGNETIC GRID VARIATION TO -999.0
*/
gv = -999.0;
if (Math.abs(glat) >= 55.0) 
{
    if (glat > 0.0 && glon >= 0.0) gv = dec-glon;
    if (glat > 0.0 && glon < 0.0) gv = dec+Math.abs(glon);
    if (glat < 0.0 && glon >= 0.0) gv = dec+glon;
    if (glat < 0.0 && glon < 0.0) gv = dec-Math.abs(glon);
    if (gv > +180.0) gv -= 360.0;
    if (gv < -180.0) gv += 360.0;
}

return dec;
}

WorldMagneticModel.prototype.knownAnswerTest = function(){

/* http://www.ngdc.noaa.gov/geomag/WMM/data/2006TestValues_WMM2005.pdf */
/* Lat	Lon Dec	    */
/* Lon 240 = 120W, Lon 300 = 60W */

/* WARNING: Test Data out of date */

var kat = [
"80.00	,0.00	 ,-7.55	    ",	   
"80.00	,60.00	 ,35.53	    ",	   
"80.00	,120.00	 ,0.85	    ",	   
"80.00	,180.00	 ,9.32	    ",	   
"80.00	,240.00	 ,36.35	    ",	   
"80.00	,300.00	 ,-55.92	",	   
"40.00	,0.00	 ,-1.13	    ",	   
"40.00	,60.00	 ,4.98	    ",	   
"40.00	,120.00	 ,-7.27	    ",	   
"40.00	,180.00	 ,5.85	    ",	   
"40.00	,240.00	 ,14.93	    ",	   
"40.00	,300.00	 ,-17.98	",	   
"0.00	,0.00	 ,-6.60	    ",	   
"0.00	,60.00	 ,-4.20	    ",	   
"0.00	,120.00	 ,1.12	    ",	   
"0.00	,180.00	 ,9.63	    ",	   
"0.00	,240.00	 ,9.18	    ",	   
"0.00	,300.00	 ,-14.48	",	   
"-40.00	,0.00	 ,-23.47	",	   
"-40.00	,60.00	 ,-45.20	",	   
"-40.00	,120.00	 ,-3.42	    ",	   
"-40.00	,180.00	 ,21.73	    ",	   
"-40.00	,240.00	 ,22.43	    ",	   
"-40.00	,300.00	 ,-2.45	    ",	   
"-80.00	,0.00	 ,-21.65	",	   
"-80.00	,60.00	 ,-74.13	",	   
"-80.00	,120.00	 ,-140.50	",	   
"-80.00	,180.00	 ,131.73	",	   
"-80.00	,240.00	 ,70.50	    ",	   
"-80.00	,300.00	 ,23.95	    "
];

var maxErr = 0.0;

for(var i=0; i<kat.length; i++){

  var c_str = kat[i];
  var c_flds = c_str.split(",");

  var lat = parseFloat(c_flds[0]);
  var lon = parseFloat(c_flds[1]);
  var exp = parseFloat(c_flds[2]);
  var maxExp;

  var dec = this.declination(0,lat,lon,2006.0); 
  if(Math.abs(dec-exp) > maxErr){
      maxErr = Math.abs(dec-exp);
      maxExp = exp;
  } 

}

return maxErr * 100 / maxExp;//max % error

}
