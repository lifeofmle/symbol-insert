var base = document.body;
var selector = '.symbol-link';

base.addEventListener('click', function(event) {
  var target = event.target.closest(selector);
  if (target && base.contains(target)) {
    window.postMessage('insertSymbol', target.id);
  }
});

document.getElementById('symbolButton').addEventListener('click', () => {
  window.postMessage('getSymbols');
});

window.displaySymbols = (symbolItems) => {
  var symbolList = document.getElementById('symbols');
  var items = symbolItems;

  // loop through and display items
  for (var i=0; i<items.length; i++) {
    var symbolName=document.createElement('span');
    symbolName.innerHTML= items[i].name;

    // var symbolImage=document.createElement('img');
    // symbolImage.src=`data:image/png;base64, ${items[i].imageData}`;

    var symbolContainer=document.createElement('div');
    symbolContainer.classList.add('symbol-container');
    symbolContainer.appendChild(symbolName);
    // symbolContainer.appendChild(symbolImage);

    var symbolLink=document.createElement('a');
    symbolLink.href = "#";
    symbolLink.id = items[i].id;
    symbolLink.classList.add("symbol-link");
    symbolLink.appendChild(symbolContainer);

    var li=document.createElement('li');
    li.appendChild(symbolLink);
    symbolList.appendChild(li);
  }
}
