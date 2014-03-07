// Check for `AudioContext` -- otherwise, check for the prefixed webkit
// version
var audioEl = document.getElementById("audio-element");
var canvas = document.getElementById("canvas");
var canvasCtx = canvas.getContext("2d");

/**
 * Create our AudioContext and the nodes we'll need
 */
var ctx = new (window.AudioContext || window.webkitAudioContext)();
var elSource = ctx.createMediaElementSource(audioEl);
var filter = ctx.createBiquadFilter();
var analyser = ctx.createAnalyser();
var data = new Uint8Array(analyser.frequencyBinCount);
// Check to see if `createScriptProcessor` method is available, use it; otherwise,
// use the deprecated `createJavaScriptNode` method.
var proc = ctx[ctx.createScriptProcessor ?
  'createScriptProcessor' :
  'createJavaScriptNode'](1024, 1, 1);
filter.type = "lowpass";
filter.frequency.value = 100;

/**
 * Set up audio routing and connect nodes together
 *
 *                     -> analyser -> processor
 *                    /                         \
 * elSource -> filter - - - - - - - - - - - - - -> destination
 */
elSource.connect(filter);
filter.connect(analyser);
analyser.connect(proc);
filter.connect(ctx.destination);

/*
 * Connect the processor back to the destination,
 * as there is a bug in webkit/blink implementations
 * that requires a connected output channel to call
 * the `onaudioprocess` event.
 */
proc.connect(ctx.destination);
proc.onaudioprocess = onProcess;

/**
 * Bind `onProcess` to the processor's `onaudioprocess` property
 * to call this everytime the processor has a full buffer of samples
 */
function onProcess (e) {
  var hue;
  analyser.getByteFrequencyData(data);
  canvasCtx.fillStyle = "#333";
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0, l = data.length; i < l; i++) {
    var hue = (-i/data.length * 200) + 200;
    var height = canvas.height * data[i] / 255;
    if (i===10)
      console.log(height, canvas.height-height);
    canvasCtx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    canvasCtx.fillRect(i, canvas.height - height, 1, height);
  }
}

/**
 * Slider events to update filter on slider change
 */
var slider = document.getElementById("slider");
var freqDisplay = document.getElementById("freq-display");
if (slider.addEventListener) {
  slider.addEventListener("change", onChange);
} else {
  slider.attachEvent("onchange", onChange);
}

function onChange () {
  filter.frequency.value = slider.value;
  freqDisplay.innerHTML = slider.value;
}
