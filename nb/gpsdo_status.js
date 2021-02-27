"use strict";

var doc_gpsdo_pll_status;
var doc_gpsdo_gps_status;
var doc_gpsdo_gps_loss_count;
var gpsdo_status_date = 0;

//{"gps_locked":true,"pll_locked":true,"gps_loss_count":13}

function updateGPSDOstatus()
{
  $.ajax(
    {
      dataType: "json",
      url: "/gpsdo_status.json",
      cache: false,
      timeout: 3000
    }
  ).done(function(data, _s, xhr)
    {
      gpsdo_status_date = Date.parse(xhr.getResponseHeader("Last-Modified"));
      var gpsdo_status_age = (new Date()) - gpsdo_status_date;
      //console.log("GPSDO Status Age: "+(gpsdo_status_age / 1000.0)+"s");

      if(gpsdo_status_age > (10*1000))
      {
        doc_gpsdo_pll_status.text("---");
        doc_gpsdo_pll_status.removeClass("gpsdo-status-unlocked");
        doc_gpsdo_pll_status.removeClass("gpsdo-status-locked");
      }
      else if(data.pll_locked)
      {
        doc_gpsdo_pll_status.text("Locked");
        doc_gpsdo_pll_status.removeClass("gpsdo-status-unlocked");
        doc_gpsdo_pll_status.addClass("gpsdo-status-locked");
      }
      else
      {
        doc_gpsdo_pll_status.text("Unlocked");
        doc_gpsdo_pll_status.removeClass("gpsdo-status-locked");
        doc_gpsdo_pll_status.addClass("gpsdo-status-unlocked");
      }

      if(gpsdo_status_age > (10*1000))
      {
        doc_gpsdo_gps_status.text("---");
        doc_gpsdo_gps_status.removeClass("gpsdo-status-unlocked");
        doc_gpsdo_gps_status.removeClass("gpsdo-status-locked");
      }
      else if(data.gps_locked)
      {
        doc_gpsdo_gps_status.text("Locked");
        doc_gpsdo_gps_status.removeClass("gpsdo-status-unlocked");
        doc_gpsdo_gps_status.addClass("gpsdo-status-locked");
      }
      else
      {
        doc_gpsdo_gps_status.text("Unlocked");
        doc_gpsdo_gps_status.removeClass("gpsdo-status-locked");
        doc_gpsdo_gps_status.addClass("gpsdo-status-unlocked");
      }

      if(gpsdo_status_age > (10*1000))
      {
        doc_gpsdo_gps_loss_count.text("---");
      }
      else
      {
        doc_gpsdo_gps_loss_count.text(data.gps_loss_count);
      }
    }
  ).fail(function()
    {
      doc_gpsdo_pll_status.text("---");
      doc_gpsdo_pll_status.removeClass("gpsdo-status-unlocked");
      doc_gpsdo_pll_status.removeClass("gpsdo-status-locked");

      doc_gpsdo_gps_status.text("---");
      doc_gpsdo_gps_status.removeClass("gpsdo-status-unlocked");
      doc_gpsdo_gps_status.removeClass("gpsdo-status-locked");

      doc_gpsdo_gps_loss_count.text("---");
    }
  ).always(function()
    {
      setTimeout(updateGPSDOstatus, 1000);
    }
  );
}

$(function()
{
  doc_gpsdo_pll_status = $("#span-pll-locked");
  doc_gpsdo_gps_status = $("#span-gps-locked");
  doc_gpsdo_gps_loss_count = $("#span-gps-loss-count");

  setTimeout(updateGPSDOstatus, 1000);
});