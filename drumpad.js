var mode = 'play';
var settings = false;
var modeButton, setButton;
var modeButtonLabel = 'Switch to record mode'; 
var colorPalette;
var mic;
var recorder;
var fft;
var pad1, pad2, pad3, pad4;
var dragging = false; // global dragging var
var wasDragging = false;

var root = 'audio/drums/'; // change the root directory to pick different default samples

var drumpad = function( sketch ) {
  var sample;
  var cnv;
  var bgColor = [ random(0,255), random(0,255), random(0,255) ];
  var recording = false;
  var recTime = 0;
  var amp = new Amplitude();

  // settings for this pad
  var rateSlider = createSlider(0,100,29);
  var volSlider = createSlider(0,100,50);
  var revButton = createButton('Reverse');
  var loopButton = createButton('Loop');
  var rateLabel = createP();
  var volLabel = createP();

  // to determine loop points in mouseDragged()
  sketch.dragging = false;
  sketch.startMarker;
  sketch.stopMarker;

  // playback settings for the sound file
  var sStart;
  var sEnd;
  var sRate = 1;
  var sVol = 1;


  sketch.setup = function() {
    cnv = sketch.createCanvas(400, 400);
    cnv.mousePressed(sketch.pressed);
    revButton.mousePressed(sketch.revBuffer);
    loopButton.mousePressed(sketch.toggleLoop);
    sketch.background(sketch.random(0,255));

    sketch.startMarker = 0;
    sketch.stopMarker = sketch.width; // canvas width;
  };

  sketch.draw = function() {
    if (mode === 'play'){

      // reset the mic amplitude's volMax
      mic.amplitude.volMax = .1;

      sketch.hideSettings();
      sketch.drawBackground();
    } else if (mode === 'rec') {
      if (recording) {

        // if waiting for attack...
        if (recording === 'preAttack') {
          sketch.background(255,0,0,200);
          sketch.noStroke();
          sketch.textSize(48);
          sketch.textAlign(CENTER);
          sketch.text('Make Some Noiz!', sketch.width/2, sketch.height/2);
          if (mic.getLevel() > .5) {
            recorder.record();
            recording = true;
          }
        }

        //
        else if (recording === true ) {
          // draw waveform if recording
          var waveform = fft.waveform();
          sketch.strokeWeight(5);
          sketch.stroke(255);
          sketch.beginShape();
          sketch.background(255,0,0,200);
          for (var i = 0; i< waveform.length; i++){
            var x = map(i, 0, waveform.length, 0, sketch.width);
            var y = map(waveform[i], 0, 255, sketch.height, 0);
            sketch.vertex(x,y);
          }
          sketch.endShape();

          // if volume is below a certain threshold, we are done recording
          if (mic.getLevel() < .0125) {
            recording = false;
            recorder.stop();
            recorder.getBuffer(sketch.decodeBuffer);
            // back to play mode!
            toggleMode();
          }
        } else {
        sketch.background(bgColor);
        }
      }
    } else if (mode === 'settings') {
      sketch.showSettings();
      sRate = map( rateSlider.value() , 0, 100, .1831, 3);
      sample.rate( sRate );
      volLabel.html('volume: ' + volSlider.value() + '%');
      rateLabel.html('rate: ' + sRate.toFixed(2));
      // get volume from slider
      sVol = volSlider.value()/100;
      sample.setVolume(sVol);
      sketch.drawBackground();
    }
    if (mode !== 'rec') {
      sketch.drawBuffer();
      sketch.drawPlayhead();
    }
  };

  sketch.drawPlayhead = function() {
    if (sample && sample.isLoaded()) {
      // draw playhead
      sketch.stroke(0);
      var playPercentage = map( sample.currentTime(), 0, sample.duration(), 0, sketch.width);
      sketch.line(playPercentage, 0, playPercentage,sketch.height);

      // draw start and stop markers
      sketch.stroke(255,255,0);
      // var startLine = map( startMarker, 0, sketch.width, 0, sample.duration());
      // var stopLine = map( stopMarker, 0, sketch.width, 0, sample.duration());
      sketch.line(sketch.startMarker, 0, sketch.startMarker,sketch.height);
      sketch.line(sketch.stopMarker, 0, sketch.stopMarker,sketch.height);
      sketch.fill(0,255,0,20);
      if (sketch.startMarker <= sketch.stopMarker) {
        sketch.rect(sketch.startMarker, 0, abs(sketch.startMarker - sketch.stopMarker), sketch.height);
      } else {
        sketch.rect(sketch.stopMarker, 0, abs(sketch.startMarker - sketch.stopMarker), sketch.height);
      }
    }
  };

  sketch.mouseDragged = function(){
    if (dragging === false && sketch.dragging === false && sketch.mouseY >=0 && sketch.mouseY <= sketch.height && sketch.mouseX >=0 && sketch.mouseX <= sketch.width){
      sketch.tempMarker1 = sketch.mouseX;
      sketch.dragging = true;
      dragging = true; // global
      wasDragging = true;
    }
    if (sketch.dragging === true){
      sketch.stopMarker = sketch.tempMarker1;
      sketch.startMarker = sketch.mouseX;
    }
  };

  sketch.mouseReleased = function(){
    if (sketch.dragging === true) {
      sketch.tempMarker2 = sketch.mouseX;
      sketch.dragging = false;
      if (sketch.tempMarker2 < sketch.tempMarker1) {
        var temp = sketch.tempMarker2;
        sketch.tempMarker2 = sketch.tempMarker1;
        sketch.tempMarker1 = temp;
        if (sketch.tempMarker1 < 0) {
          sketch.tempMarker1 = 0;
        }
        if (sketch.tempMarker2 > sketch.width) {
          sketch.tempMarker2 = sketch.width;
        }
      }
      sketch.startMarker = sketch.tempMarker1;
      sketch.stopMarker = sketch.tempMarker2;
      sStart = map(sketch.startMarker, 0, sketch.width, 0, sample.duration());
      sEnd = map(sketch.stopMarker, 0, sketch.width, 0, sample.duration());
      console.log(sEnd + ', ' + sample.duration());
        if (sStart < 0) {
          sStart = 0;
        }
        if (sEnd > sample.duration()) {
          sEnd = sample.durtion();
        }
      console.log(sStart + ', ' + sEnd);
      sample.jump(sStart, sEnd);
    }
    dragging = false;
  };

  sketch.drawBackground = function() {
      var alpha = floor(map(amp.getLevel(), 0, .2, 20, 255));
      alpha = constrain(alpha, 0,255);
      sketch.background(bgColor[0], bgColor[1], bgColor[2], alpha);
      var alpha = floor(map(amp.getLevel(), 0, .2, 20, 50));
      alpha = constrain(alpha, 0,10);
      sketch.background(0,0,0, alpha);
  };

  sketch.pressed = function() {
    if (mode === 'play' || mode === 'settings') {
      if (wasDragging === true){
        wasDragging = false;
        console.log('was dragging no more')
      } else {
        sample.play(sRate, sVol, sStart, sEnd);
      }
    } else if (mode === 'rec') {
      if (recording === false) {
        sample.stopAll();
        sketch.background(255,0,0,200);
        if (mic.getLevel() > .01) {
          // record on attack
          recording = 'preAttack';
        }
      } else {
        recording = false;
        recorder.stop();
        recorder.getBuffer(sketch.decodeBuffer);
        // back to play mode!
        toggleMode();
      }
    }
  };

  sketch.setSample = function(s) {
    sample = sketch.loadSound(s);
    sample.volume = .5;
    sample.playMode('restart');
    amp.setInput(sample.output);
    amp.toggleNormalize();
  };


  sketch.setBuffer = function(buf){
    sample.buffer = buf;
    sStart = 0;
    sEnd = buf.duration;
    recorder.clear();
  };

  // reset the buffer for this sketch's sample using data from the recorder
  sketch.decodeBuffer = function(buf) {
    // create an AudioBuffer of the appropriate size and # of channels,
    // and copy the data from one Float32 buffer to another
    var audioContext = sketch.getAudioContext();
    var newBuffer = audioContext.createBuffer(2, buf[0].length, audioContext.sampleRate);
    for (var channelNum = 0; channelNum < newBuffer.numberOfChannels; channelNum++){
      var channel = newBuffer.getChannelData(channelNum);
      channel.set(buf[channelNum]);
    }
    sketch.setBuffer(newBuffer);
  };

  sketch.revBuffer = function() {
    sample.reverseBuffer();
  };

  sketch.toggleLoop = function() {
    if (sample.isLooping()){
      sample.setLoop(false);
      loopButton.html('Loop');
    }
    else {
      sample.setLoop(true);
      loopButton.html('No Loop');
    }
  };

  sketch.drawBuffer = function() {
    if (sample && sample.isLoaded()){
      var waveform = sample.getPeaks(1600);
      // sketch.fill();
      sketch.stroke(255);
      sketch.strokeWeight(1);
      sketch.beginShape();
      for (var i = 0; i< waveform.length; i++){
        sketch.vertex(map(i, 0, waveform.length, 0, sketch.width), map(waveform[i], -1, 1, sketch.height, 0));
      }
      sketch.endShape();
    }
  };

  // position this pad's GUI based on sketch position
  sketch.settingsPosition = function(w, h){
    sketch.stroke(255);
    rateLabel = createP('rate: ');
    rateLabel.position(w-350, h-90);
    rateSlider.position(w-350, h-50);
    volSlider.position(w-200, h-50);
    volLabel = createP('volume: ');
    volLabel.position(w-200, h-90);

    revButton.position(w-350, h-100)
    loopButton.position(w-200, h-100);
    cnv.position(w-400,h-400);
  };

  sketch.showSettings = function() {
    rateSlider.show();
    volSlider.show();
    revButton.show();
    loopButton.show();
    rateLabel.show();
    volLabel.show();
  };

  sketch.hideSettings = function() {
    rateSlider.hide();
    volSlider.hide();
    revButton.hide();
    loopButton.hide();
    rateLabel.hide();
    volLabel.hide();
  };

}; // end drumpad


var createGUI = function() {
  modeButton = createButton(modeButtonLabel);
  modeButton.position(800,20);
  modeButton.mousePressed(toggleMode);

  setButton = createButton('Settings');
  setButton.position(800,40);
  setButton.mousePressed(toggleSettings);

};

function setup(){
  mic = new AudioIn();
  createGUI();
  mic.on();
  mic.amplitude.toggleNormalize();
  fft = new FFT(.1, 128);
  fft.setInput(mic);
  recorder = new Recorder(mic);
}

function draw(){
  modeButton.html(modeButtonLabel);
}

function keyPressed(e){
  // if (e.keyCode == '37') {
  //   pad2.pressed();
  // };
  // if (e.keyCode == '39') {
  //   pad4.pressed();
  // };
  // if (e.keyCode == '65') {
  //   pad1.pressed();
  // };
  // if (e.keyCode == '68') {
  //   pad3.pressed();
  // };
  if (e.keyCode == '9') { // TAB: ToggleSettings
    toggleSettings();
  }
};


var toggleMode = function(){
  if (mode !== 'rec') {
    mode = 'rec';
    modeButtonLabel = 'Click a pad to record!'
  }
  else {
    mode = 'play';
    modeButtonLabel = 'Switch to record mode';
  }
};

var toggleSettings = function(){
  if (mode !== 'settings') {
    mode = 'settings';
    setButton.html('Back to Play Mode');
  }
  else {
    mode = 'play';
    setButton.html('Settings');
  }
};



// Set up drum pads and position them on the page
window.onload = function() {
  assignPads();
};

function assignPads() {
  var keyRows = document.getElementsByClassName("keyRow");
  var samplePointer = 0;
  for (var i = 0; i < keyRows.length; i++){
    var y = 200 * i; // x position
    for (var j = 0; j<keyRows[i].children.length; j++){
      var x = 200 * j;
      newPad(keyRows[i].children[j], x, y, samplePointer);
      samplePointer ++;
    }
  }
}

function newPad(aDiv, x, y, samplePointer){
  var pad = new p5(drumpad, aDiv);
  var sample = root + samplePointer + '.mp3';
  if (urlExists(sample)){
    pad.setSample(sample);
    console.log(aDiv.id + ' = ' + sample);
    var padOn = true;
  }
  pad.settingsPosition(x, y);
  aDiv.pCtx = pad4;
  aDiv.addEventListener('dragover', handleDragOver, false);
  aDiv.addEventListener('drop', handleFileSelect, false);

  // if it is a special key
  if (aDiv.getAttribute('keycode') !== null) {
    console.log("keyCode: " + aDiv.getAttribute('keycode'));

    var thisEvent = function(e) {
      // console.log();
      if (e.keyCode == aDiv.getAttribute('keycode') ){
        console.log(e.keyCode + ' = '+ aDiv.getAttribute('keycode'));
        if (padOn === true){
          pad.pressed();
        }
      }
    }
    window.addEventListener("keydown", thisEvent, false);
  }


  // if it isnt a special key
  pad.keyTyped = function(e){
    if (key == aDiv.id){
      console.log(e);
      if (padOn === true){
        pad.pressed();
      }
    }
  }
}

function urlExists(path){
  var http = new XMLHttpRequest();
  http.open('HEAD', path, false);
  http.send();
  return http.status!=404;
}