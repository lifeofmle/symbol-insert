import BrowserWindow from 'sketch-module-web-view';
import { getWebview } from 'sketch-module-web-view/remote';
import UI from 'sketch/ui';
import Sketch from 'sketch/dom';

const webviewIdentifier = 'symbol-insert.webview';
var librarySymbols;

export default function () {
  const options = {
    identifier: webviewIdentifier,
    title: 'Symbol Insert',
    width: 640,
    height: 410,
    show: false,
    vibrancy: 'ultra-dark',
    webPreferences: {
      devTools: false
    }
  }

  const browserWindow = new BrowserWindow(options);
  const webContents = browserWindow.webContents;

  // only show the window when the page has loaded to avoid a white flash
  browserWindow.once('ready-to-show', () => {
    // var symbols = getSymbols();
    // webContents
    //   .executeJavaScript(`listSymbols(${symbols})`)
    //   .catch(console.error);
    librarySymbols = getSymbols();
    var symbols = JSON.stringify(librarySymbols);
    webContents
      .executeJavaScript(`displaySymbols(${symbols})`)
      .catch(console.error);

    browserWindow.show();
  });

  browserWindow.on('blur', () => {
    browserWindow.close();
  })

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
    closeWebView();
    insertSymbol(symbolId);
  });

  //https://medium.com/madeawkward/how-to-create-floating-sketch-plugins-part-i-6241b82170d0

  browserWindow.loadURL(require('../resources/webview.html'))
}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown() {
  closeWebView();
}

function closeWebView() {
  const existingWebview = getWebview(webviewIdentifier)
  if (existingWebview) {
    existingWebview.close()
  }
}

function getSymbols() {
  var symbolItems = [];

  var document = Sketch.getSelectedDocument();

  var symbols = document.getSymbols();
  symbols.forEach(symbolItem => {
    var library = symbolItem.getLibrary();
    // Handle local symbol definitions that are not from libraries
    if (!library) {
      symbolItems.push({
        id: symbolItem.id,
        name: symbolItem.name,
        reference: symbolItem
      });
    }
  })

  var libraries = Sketch.Library.getLibraries();
  libraries.forEach(library => {
    if (library.enabled) {
      var symbolReferences = library.getImportableSymbolReferencesForDocument(document);
      symbolReferences.forEach(symbolReference => {

        symbolItems.push({
          id: symbolReference.id,
          name: symbolReference.name,
          reference: symbolReference
        });
      });
    }
  });

  return symbolItems;
}

function insertSymbol(symbolId){
  var document = Sketch.getSelectedDocument();

  var symbolItem = librarySymbols.find(function(element) {
    return element.id === symbolId;
  })

  var reference = symbolItem.reference;

  var masterSymbol = symbolItem.reference;
  if (reference.type == 'ImportableObject') {
    masterSymbol = symbolItem.reference.import();
  }

  if (masterSymbol) {
    try {
      var nativeDocument = document.sketchObject;
      var symbolRef = MSSymbolMasterReference.referenceForShareableObject(masterSymbol.sketchObject);
      var insertAction = nativeDocument.actionsController().actionForID("MSInsertSymbolAction");
      var tempMenuItem = NSMenuItem.alloc().init();

      tempMenuItem.setRepresentedObject([symbolRef]);
      insertAction.doPerformAction(tempMenuItem);
    } catch(e) {
        console.log("Exception: " + e);
    }
  }
}

// ✅ Get all symbols from Symbol and Shared Libraries
// ✅ Display name with slashes
// ✅ Load the symbols when open
// ✅ Filter for symbol
// ✅ Insert symbol when selected
// ✅ Keyboard arrow on search
// ✅ Add to current artboard (if present)
// ✅ Style display symbols
// ✅ Keyboard shortcut
// ✅ Fix interactions with keyboard and screen
// ✅ Logo
// ✅ Readme.md update
// TODO Display preview of symbol
// ✅ Insert symbol by mouse
// ✅ Drag and drop


// var symbol = symbolReference.import();
// const buffer = Sketch.export(symbol, {formats: 'png', output: false});
// var imageLayer = new Sketch.Image({image: buffer});
// var imageData = imageLayer.image;
// var imageAsString = Btoa(buffer);
// if (symbolItems.length <= 0){
//   console.log(symbolReference.name, imageAsString);
// }
// ..set imageData as a base64 string
// imageData: imageAsString
