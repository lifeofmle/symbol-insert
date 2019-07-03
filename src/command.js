import BrowserWindow from 'sketch-module-web-view';
import { getWebview } from 'sketch-module-web-view/remote';
const MochaJSDelegate = require("mocha-js-delegate");
import UI from 'sketch/ui';
import Sketch from 'sketch/dom';
import Btoa from 'btoa';

const webviewIdentifier = 'symbol-insert.webview';

export default function () {
  const options = {
    identifier: webviewIdentifier,
    width: 375,
    height: 500,
    backgroundColor: '#ffffff',
    show: false
  }

  const browserWindow = new BrowserWindow(options)

  // only show the window when the page has loaded to avoid a white flash
  browserWindow.once('ready-to-show', () => {
    // var symbols = getSymbols();
    // webContents
    //   .executeJavaScript(`listSymbols(${symbols})`)
    //   .catch(console.error);

    browserWindow.show();
  })

  const webContents = browserWindow.webContents;

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


  /*
  This is so our script's JSContext sticks around,
  instead of being destroyed as soon as the current execution block is finished.
  */
  var fiber = require('sketch/async').createFiber();

  // Create a WebView
  var webView = WebView.new();

  var delegate = new MochaJSDelegate({
    // define a property
    counter: 1,

    // define an instance method
    "webView:didFinishLoadForFrame:": function(webView, webFrame) {
      // access counter
      const counter = this.counter;
      sketch.UI.message("Loaded! " + counter);

      fiber.cleanup();
    }
  });

  // Set WebView's frame load delegate
  webView.setFrameLoadDelegate(
    delegate.new({
      // set the property during the initialisation
      counter: 4
    })
  );
  webView.setMainFrameURL("http://google.com/");

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
        var symbol = symbolReference.import();
        const buffer = Sketch.export(symbol, {formats: 'png', output: false});
        var imageLayer = new Sketch.Image({image: buffer});
        var imageData = imageLayer.image;
        var imageAsString = Btoa(buffer);
        if (symbolItems.length <= 0){
          console.log(symbolReference.name, imageAsString);
        }
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
  // instance.parent = document.selectedPage;

  try {
    var nativeDocument = document.sketchObject;
    var insertAction = nativeDocument.actionsController().actionForID("MSInsertSymbolAction");
    var tempMenuItem = NSMenuItem.alloc().init();

    tempMenuItem.setRepresentedObject(instance.sketchObject);
    insertAction.doPerformAction(tempMenuItem);

    } catch(e) {
        log("Exception: " + e);
    }
}

// ✅ Get all symbols from Symbol and Shared Libraries
// ✅ Display name with slashes
// TODO Load the symbols when open
// TODO Display preview of symbol
// ✅ Filter for symbol
// ✅  Insert symbol when selected
// TODO Keyboard arrow on search
// TODO Style display symbols
// TODO Insert symbol by mouse
