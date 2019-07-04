import BrowserWindow from 'sketch-module-web-view';
import { getWebview } from 'sketch-module-web-view/remote';
import UI from 'sketch/ui';
import Sketch from 'sketch/dom';
// import Btoa from 'btoa';
// const MochaJSDelegate = require("mocha-js-delegate");

const webviewIdentifier = 'symbol-insert.webview';

export default function () {
  const options = {
    identifier: webviewIdentifier,
    width: 375,
    height: 500,
    backgroundColor: '#ffffff',
    show: false
  }

  const browserWindow = new BrowserWindow(options);
  const webContents = browserWindow.webContents;

  // only show the window when the page has loaded to avoid a white flash
  browserWindow.once('ready-to-show', () => {
    // var symbols = getSymbols();
    // webContents
    //   .executeJavaScript(`listSymbols(${symbols})`)
    //   .catch(console.error);
    var symbols = JSON.stringify(getSymbols());
    webContents
      .executeJavaScript(`displaySymbols(${symbols})`)
      .catch(console.error);

    browserWindow.show();
  });

  // print a message when the page loads
  // webContents.on('did-finish-load', () => {
  //   UI.message('UI loaded!')
  // })

  // add a handler for a call from web content's javascript
  webContents.on('nativeLog', s => {
    UI.message(s);
    webContents
      .executeJavaScript(`setRandomNumber(${Math.random()})`)
      .catch(console.error);
  });

  webContents.on('getSymbols', () => {
    var symbols = JSON.stringify(getSymbols());
    webContents
      .executeJavaScript(`displaySymbols(${symbols})`)
      .catch(console.error);
  });

  webContents.on('insertSymbol', (symbolId) => {
    insertSymbol(symbolId);
  });

  //https://medium.com/madeawkward/how-to-create-floating-sketch-plugins-part-i-6241b82170d0

  browserWindow.loadURL(require('../resources/webview.html'))
}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown() {
  const existingWebview = getWebview(webviewIdentifier)
  if (existingWebview) {
    existingWebview.close()
  }
}

function getSymbols() {
  var symbolItems = [];

  var document = Sketch.getSelectedDocument();
  var library = Sketch.Library.getLibraryForDocumentAtPath(document.path);

  var symbolReferences = library.getImportableSymbolReferencesForDocument(document);

  var libraries = Sketch.Library.getLibraries();
  libraries.forEach(library => {
    if (library.enabled) {
      var symbolReferences = library.getImportableSymbolReferencesForDocument(
        document
      );
      symbolReferences.forEach(symbolReference => {
        // var symbol = symbolReference.import();
        // const buffer = Sketch.export(symbol, {formats: 'png', output: false});
        // var imageLayer = new Sketch.Image({image: buffer});
        // var imageData = imageLayer.image;
        // var imageAsString = Btoa(buffer);
        // if (symbolItems.length <= 0){
        //   console.log(symbolReference.name, imageAsString);
        // }
        symbolItems.push({
          id: symbolReference.id,
          name: symbolReference.name,
          // imageData: imageAsString
        });
      });
    }
  });
  return symbolItems;
}

function insertSymbol(symbolId){
  var document = Sketch.getSelectedDocument();
  var masterSymbol = document.getSymbolMasterWithID(symbolId);
  var instance = masterSymbol.createNewInstance();

  // is there an active artboard?
  var selectedArtboard = null;
  var selectedLayers = document.selectedLayers;
  if (selectedLayers) {
    var layers = selectedLayers.layers;
    if (layers) {
      // get first layer that is an Artboard
      for (var i=0; i <= layers.length-1; i++){
        if (layers[i].type == 'Artboard'){
          selectedArtboard = layers[i];
          break;
        }
      }
    }
  }

  instance.parent = selectedArtboard ? selectedArtboard : document.selectedPage;

  // try {
  //   var nativeDocument = document.sketchObject;
  //   var insertAction = nativeDocument.actionsController().actionForID("MSInsertSymbolAction");
  //   var tempMenuItem = NSMenuItem.alloc().init();

  //   tempMenuItem.setRepresentedObject(instance.sketchObject);
  //   insertAction.doPerformAction(tempMenuItem);
  // } catch(e) {
  //     log("Exception: " + e);
  // }
}

// ✅ Get all symbols from Symbol and Shared Libraries
// ✅ Display name with slashes
// ✅ Load the symbols when open
// TODO Display preview of symbol
// ✅ Filter for symbol
// ✅ Insert symbol when selected
// ✅ Keyboard arrow on search
// ✅ Add to current artboard (if present)
// TODO Style display symbols
// ✅ Keyboard shortcut
// TODO Insert symbol by mouse
// TODO Drag and drop
// TODO Logo
// TODO Readme.md update
// TODO Simple webpage
