// ==UserScript==
// @id rynco.iitc-alt-style
// @name Alternative Portal Style
// @category Misc
// @version 0.0.3
// @namespace https://github.com/lynzrand/iitc-alternative-style
// @updateURL https://github.com/lynzrand/iitc-alternative-style/raw/master/plugin.user.js
// @description 
// @include https://intel.ingress.com/intel*
// @match https://intel.ingress.com/intel*
// @grant none
// ==/UserScript==

// Wrapper function that will be stringified and injected
// into the document. Because of this, normal closure rules
// do not apply here.
function wrapper(plugin_info) {
  // Make sure that window.plugin exists. IITC defines it as a no-op function,
  // and other plugins assume the same.
  if (typeof window.plugin !== 'function') window.plugin = function () { };


  // Datetime-derived version of the plugin
  plugin_info.dateTimeVersion = '20221115000000';

  // ID/name of the plugin
  plugin_info.pluginId = 'iitc-alt-style';

  // The entry point for this plugin.
  function setup() {
    // patch window.COLORS to use our own colors
    window.COLORS = ['#B2AEB7', '#726DD9', '#55D152', '#F24A5F'] // neutral, res, enl, mac

    window.portalMarkerScale = function () {
      var zoom = map.getZoom();
      if (L.Browser.mobile)
        // since we make portals way smaller, we actually need a larger scale
        return zoom >= 14 ? 1.5 : zoom >= 11 ? 0.9 : zoom >= 8 ? 0.8 : 0.7;
      else
        return zoom >= 14 ? 1 : zoom >= 11 ? 0.8 : zoom >= 8 ? 0.65 : 0.5;
    }

    // So yes, we are monkey-patching a stock function.
    window.getMarkerStyleOptions = function (details) {
      var scale = window.portalMarkerScale();

      //   portal level      0  1  2  3  4  5  6  7  8
      var LEVEL_TO_WEIGHT = [5, 6, 7, 8, 9, 10, 11, 13, 15];
      var LEVEL_TO_RADIUS = [3, 3, 3, 3, 4, 4, 5, 6, 7];



      var level = Math.floor(details.level || 0);

      var lvlWeight = LEVEL_TO_WEIGHT[level] * scale;
      var lvlRadius = LEVEL_TO_RADIUS[level] * scale;


      var dashArray = null;
      // no outline for placeholder portals
      if (details.team != TEAM_NONE && level == 0) {
        lvlWeight = 0;
      }

      var options = {
        radius: lvlRadius,
        stroke: true,
        color: COLORS[details.team],
        weight: lvlWeight,
        opacity: 0.4,
        fill: true,
        fillColor: COLORS[details.team],
        fillOpacity: 1,
        dashArray: dashArray
      };

      return options;
    }
  }

  // Add an info property for IITC's plugin system
  setup.info = plugin_info;

  // Make sure window.bootPlugins exists and is an array
  if (!window.bootPlugins) window.bootPlugins = [];
  // Add our startup hook
  window.bootPlugins.push(setup);
  // If IITC has already booted, immediately run the 'setup' function
  if (window.iitcLoaded && typeof setup === 'function') setup();
}

// Create a script element to hold our content script
var script = document.createElement('script');
var info = {};

// GM_info is defined by the assorted monkey-themed browser extensions
// and holds information parsed from the script header.
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
  info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description
  };
}

// Create a text node and our IIFE inside of it
var textContent = document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ')');
// Add some content to the script element
script.appendChild(textContent);
// Finally, inject it... wherever.
(document.body || document.head || document.documentElement).appendChild(script);
