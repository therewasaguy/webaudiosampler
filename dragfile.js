// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

var ctx; //p5 context

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files; // FileList object.

  // files is a FileList of File objects. List poperties
  var file = files[0];

  if (file.type == 'audio/mp3' || file.type == 'audio/mpeg') {
    fileType = 'mp3';
  }
  else if (file.type == 'audio/wav') {
    fileType = 'wav';
  }
  else if (file.type == 'audio/x-m4a' || file.type == 'audio/aac') {
    fileType = 'm4a';
  }
  else fileType = file.type;

  console.log(file);

  // which p5 context will do the loading?
  ctx = this.pCtx;

  loadBlob(file);
}


function loadBlob(blob){
  var reader = new FileReader();
  reader.addEventListener('load', function(e) {
    console.log(e);
    loadArrayBuffer(e.target.result);
  });
  reader.addEventListener('error', function() {
    console.log('error reading blob');
  });
  reader.readAsArrayBuffer(blob);
}

// not used yet, from wavesurfer
function loadArrayBuffer(arraybuffer) {
  decodeArrayBuffer(arraybuffer, function(data) {
    loadDecodedBuffer(data)
    }, function () {
      console.log('error decoding audiobuffer');
    });
  }

function decodeArrayBuffer(arrayBuffer, callback, error){
  var ac = getAudioContext();
  ac.decodeAudioData(arrayBuffer, function (data) {
    ctx.setBuffer(data);
  });
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// setup drag 'n drop listener
var dropZone = document.getElementsByClassName('drop_zone');
console.log(dropZone);

for (var i = 0; i < dropZone.length; i++){
  dropZone[i].addEventListener('dragover', handleDragOver, false);
  dropZone[i].addEventListener('drop', handleFileSelect, false);
}

// setSample = function(ctx, file){
//   console.log(ctx);
//   ctx.setSample(file);
// }