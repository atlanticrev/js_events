// Обработка события загрузки документа
const whenReady = (function() {

  // Event handlers queue
  let funcs = [];

  let ready = false;


  // Handler function
  function handler(e) {

    // Для отработки лишь одного события из Register handler
    if (ready) return;

    // For IE
    if (e.type==='readystatechange' && document.readyState !== 'complete')
      return;

    // Вызов функции по очереди при полной  загрузке документа
    for(let i = 0; i < funcs.length; i++)
      funcs[i].call(document);

    ready = true;
    funcs = null;

  }


  // Register handler
  if (document.addEventListener) {

    document.addEventListener('DOMContentLoaded', handler, false);
    document.addEventListener('readystatechange', handler, false);
    window.addEventListener('load', handler, false);

  }

  // For IE
  else if (document.attachEvent) {

    document.attachEvent('onreadystatechange', handler);
    window.attachEvent('onload', handler);

  }


  // Return function
  return function whenReady(f) {

    if (ready) f.call(document);
    else funcs.push(f);

  }

}());

// Возвращает текущие позиции полос прокрутки
function getScrollOffsets(w) {

  w = w || window;

  if (w.pageXOffset !== null) {

    return {
      x: w.pageXOffset,
      y: w.pageYOffset
    };

  }

  // For IE
  const d = w.document;

  if (document.compatMode === 'CSS1Compat') {

    return {
      x: d.documentElement.scrollLeft,
      y: d.documentElement.scrollTop
    };

  }

  // Для браузеров в режиме совместимости
  return {
    x: d.body.scrollLeft,
    y: d.body.scrollTop,
  };

}

// D&D абсолютно-позиционируемых элементов документа
function drag(elementToDrag, e) {

  let scroll = getScrollOffsets();

  // Координаты указателя в системе координат документа
  let startX = e.clientX + scroll.x;
  let startY = e.clientY + scroll.y;

  // Первоначальные координаты перемещаемого элемента
  // Отступы относительно родительского элемента
  let origX = elementToDrag.offsetLeft;
  let origY = elementToDrag.offsetTop;

  // Расстояние между точкой нажатия мыши и верхним левым углов элемента
  let deltaX = startX - origX;
  let deltaY = startY - origY;

  if (document.addEventListener) {

    document.addEventListener('mousemove', moveHandler, true);
    document.addEventListener('mouseup', upHandler, true);

  // Для старых IE
  } else if (document.attachEvent) {

    elementToDrag.setCapture();
    elementToDrag.attachEvent('mousemove', moveHandler);
    elementToDrag.attachEvent('mouseup', upHandler);
    elementToDrag.attachEvent('onlosecapture', upHandler);

  }

  // Отменяем работу механизма распространения события
  if (e.stopPropagation) {

    e.stopPropagation();

  } else {

    e.cancelBubble = true;

  }

  // Отменяем действия по умолчанию
  if (e.preventDefault) {

    e.preventDefault();

  } else {

    e.returnValue = false;

  }

  function moveHandler(e) {

    // For IE
    if (!e)
      e = window.event;

    let scroll = getScrollOffsets();

    // Переместить элемент, с учетом смещения.
    // Как будто тянем элемент за верхний левый угол
    elementToDrag.style.left = `${e.clientX + scroll.x - deltaX}px`;
    elementToDrag.style.top = `${e.clientY + scroll.y - deltaY}px`;

    if (e.stopPropagation) {

      e.stopPropagation();

    } else {

      e.cancelBubble = true;

    }

  }

  function upHandler(e) {

    // For IE
    if (!e)
      e = window.event;

    if (document.removeEventListener) {

      document.removeEventListener('mouseup', upHandler, true);
      document.removeEventListener('mousemove', moveHandler, true);

    // For IE
    } else if (document.detachEvent) {

      elementToDrag.detachEvent('onlosecapture', upHandler);
      elementToDrag.detachEvent('onmouseup', upHandler);
      elementToDrag.detachEvent('onmousemove', moveHandler);
      elementToDrag.releaseCapture();

    }

    if (e.stopPropagation) {

      e.stopPropagation();

    } else {

      e.cancelBubble = true;

    }

  }

}

// Обработка события колесика мыши
function enclose(content, frameWidth, frameHeight, contentX, contentY) {

  // Начальные настройки размеров фрейма-контейнера и контента
  frameWidth = Math.max(frameWidth, 50);
  frameHeight = Math.max(frameHeight, 50);
  contentX = Math.min(contentX, 0) || 0;
  contentY = Math.min(contentY, 0) || 0;

  // Создание фрейма-контейнера
  const frame = document.createElement('div');
  frame.className = 'enclosure';

  frame.style.width = frameWidth + 'px';
  frame.style.height = frameHeight + 'px';
  frame.style.overflow = 'hidden';
  frame.style.boxSizing = 'border-box';

  content.parentNode.insertBefore(frame, content);
  frame.appendChild(content);

  // Стили контента
  content.style.position = 'relative';
  content.style.left = contentX + 'px';
  content.style.top = contentY + 'px';

  let isMacWebkit = (navigator.userAgent.indexOf("Macintosh") !== -1 &&
    navigator.userAgent.indexOf("WebKit") !== -1);

  let isFirefox = (navigator.userAgent.indexOf("Gecko") !== -1);

  // Регистрация обработчика
  frame.onwheel = wheelHandler;
  frame.onmousewheel = wheelHandler;

  if (isFirefox)
    frame.addEventListener("DOMMouseScroll", wheelHandler, false);

  function wheelHandler(e) {

    console.log(e.deltaY);

    let deltaX = e.deltaX || e.wheelDeltaX / 4 || 0;

    let deltaY = e.deltaY || e.wheelDeltaY / 4 || (e.wheelDeltaY === undefined && e.wheelDelta / 4) || e.detail * -10 || 0;

    // Корректировка для мышей Apple
    if (isMacWebkit) {
      deltaX /= 30;
      deltaY /= 30;
    }

    if (isFirefox && e.type !== "DOMMouseScroll")
      frame.removeEventListener("DOMMouseScroll", wheelHandler, false);

    let contentBox = content.getBoundingClientRect();
    let contentWidth = contentBox.right - contentBox.left;
    let contentHeight = contentBox.bottom - contentBox.top;

    if (e.altKey) {

      if (deltaX) {

        frameWidth -= deltaX;
        frameWidth = Math.min(frameWidth, contentWidth);
        frameWidth = Math.max(frameWidth, 50);
        frame.style.width = frameWidth + "px";

      }

      if (deltaY) {

        frameHeight -= deltaY;
        frameHeight = Math.min(frameHeight, contentHeight);
        frameHeight = Math.max(frameHeight - deltaY, 50);
        frame.style.height = frameHeight + "px";

      }

    } else {

      if (deltaX) {

        let minOffset = Math.min(frameWidth - contentWidth, 0);
        contentX = Math.max(contentX + deltaX, minOffset);
        contentX = Math.min(contentX, 0);

      }

      if (deltaY) {

        let minOffset = Math.min(frameHeight - contentHeight, 0);
        contentY = Math.max(contentY + deltaY, minOffset);
        contentY = Math.min(contentY, 0);
        content.style.top = contentY + "px";

      }

    }

    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
  }

}

// Тестирование
// const dragElement = document.querySelector('img');
//
// dragElement.addEventListener('mousedown', drag.bind(null, dragElement));

// whenReady(function() {
//   enclose(document.getElementById('content'), 600, 200);
// });

// D&D text data (time)
// whenReady(function() {
//
//   const clock = document.getElementById('clock');
//   const icon = new Image();
//   icon.src = 'http://icons.iconarchive.com/icons/iynque/ios7-style/64/Clock-icon.png';
//
//   function displayTime() {
//
//     let now = new Date();
//     let hours = now.getHours();
//     let minutes = now.getMinutes();
//     let seconds = now.getSeconds();
//
//     if (minutes < 10)
//       minutes = '0' + minutes;
//
//     if (seconds < 10)
//       seconds = '0' + seconds;
//
//     clock.innerHTML = hours + ':' + minutes + ':' + seconds;
//     setTimeout(displayTime, 1000);
//
//   }
//
//   displayTime();
//
//   clock.draggable = true;
//
//   clock.ondragstart = (e) => {
//
//     const dt = e.dataTransfer;
//
//     dt.setData('Text', Date() + '\n');
//
//     if (dt.setDragImage)
//       dt.setDragImage(icon, 0, 0);
//
//   };
//
// });

// whenReady(function () {
//
//   const lists = document.querySelectorAll('ul');
//
//   lists.forEach((list) => {
//
//     if (list.classList.contains('dnd'))
//       dnd(list);
//
//   });
//
//   function dnd(list) {
//
//     let entered = 0;
//
//     list.ondragenter = (e) => {
//
//       const from = e.relatedTarget;
//       entered++;
//
//       if (from && !isChild(from, list) || entered === 1) {
//
//         const dt = e.dataTransfer;
//         const types = e.types;
//
//         if (!types ||
//           (types.contains && types.contains('text/plain')) ||
//           (types.indexOf && types.indexOf('text/plain') !== -1)) {
//
//           list.classList.add('droppable');
//           return false;
//
//         }
//
//         return;
//
//       }
//
//       return false;
//
//     };
//
//     list.ondragover = () => {
//
//       return false;
//
//     };
//
//     list.ondragleave = (e) => {
//
//       const to = e.relatedTarget;
//       entered--;
//
//       if ((to && !isChild(to, list)) || entered <= 0) {
//
//         list.classList.remove('droppable');
//         entered = 0;
//
//       }
//
//       return false;
//
//     };
//
//     list.ondrop = (e) => {
//
//       const dt = e.dataTransfer;
//       let text = dt.getData('Text');
//
//       if (text) {
//
//         const item = document.createElement('li');
//         item.draggable = true;
//         item.appendChild(document.createTextNode(text));
//         list.appendChild(item);
//
//         list.classList.remove('droppable');
//         entered = 0;
//
//         return false;
//
//       }
//
//     };
//
//     let items = list.querySelectorAll('li');
//     items.forEach((item) => {
//
//       item.draggable = true;
//
//     });
//
//     list.ondragstart = (e) => {
//
//       const target = e.target;
//
//       if (target.tagName !== 'LI')
//         return false;
//
//       const dt = e.dataTransfer;
//
//       dt.setData('Text', target.innerText || target.textContent);
//
//       dt.effectAllowed = 'copyMove';
//
//     };
//
//     list.ondragend = (e) => {
//
//       const target = e.target;
//
//       if (e.dataTransfer.dropEffect === 'move')
//         target.parentNode.removeChild(target);
//
//     };
//
//     function isChild(a, b) {
//
//       for(; a; a = a.parentNode) {
//
//         return a === b;
//
//       }
//
//     }
//
//   }
//
// });

// Characters filter
whenReady(function() {

  const inputs = document.querySelectorAll('input');

  inputs.forEach((input) => {

    if (input.type !== 'text' || !input.getAttribute('data-allowed-chars'))
      return;

    input.addEventListener('keypress', filter, false);
    input.addEventListener('textInput', filter, false);
    input.addEventListener('textinput', filter, false);

    function filter(e) {

      const target = e.target;
      let text = '';
      let messageElement = null;

      if (e.type === 'textinput' || e.type === 'textInput') {

        text = e.data;

      } else {

        let code = e.charCode || e.keyCode;

        if (code < 32 || e.charCode === 0 || e.ctrlKey || e.altKey)
          return;

        text = String.fromCharCode(code);

      }

      let allowed = target.getAttribute('data-allowed-chars');
      let messageid = target.getAttribute('data-messageid');

      if (messageid)
        messageElement = document.getElementById(messageid);

      for (let i = 0; i < text.length; i++) {

        let c = text.charAt(i);

        if (allowed.indexOf(c) === -1) {

          if (messageElement)
            messageElement.style.visibility = 'visible';

          if (e.preventDefault)
            e.preventDefault();

          if (e.returnValue)
            e.returnValue = false;

          return false;

        }

      }

      if (messageElement)
        messageElement.style.visibility = 'hidden';

    }

  });

});

function forceToUpperCase(element) {

  if (typeof element === "string")
    element = document.getElementById(element);

  element.oninput = upcase;
  element.onpropertychange = upcaseOnPropertyChange;

  function upcase() {

    this.value = this.value.toUpperCase();

  }

  function upcaseOnPropertyChange(e) {

    if (e.propertyName === "value") {

      this.onpropertychange = null;

      this.value = this.value.toUpperCase();

      this.onpropertychange = upcaseOnPropertyChange;
    }

  }

}

// Keymap
function Keymap(bindings) {

  this.map = {};

  if (bindings)
    for (let name in bindings)
      this.bind(name, bindings[name])

}

Keymap.prototype.bind = function(key, func) {

  this.map[Keymap.normalize(key)] = func;

};

Keymap.prototype.bind = function(key, func) {

  delete this.map[Keymap.normalize(key)];

};

Keymap.prototype.install = function(element) {

  const keymap = this;

  function handler(e) {

    return keymap.dispatch(e, element);

  }

  if (element.addEventListener)
    element.addEventListener("keydown", handler, false);

  else if (element.attachEvent)
    element.attachEvent("onkeydown", handler);

};

Keymap.prototype.dispatch = function(e, element) {

  let modifiers = '';
  let keyname = null;

  if (e.altKey) modifiers += "alt_";
  if (e.ctrlKey) modifiers += "ctrl_";
  if (e.metaKey) modifiers += "meta_";
  if (e.shiftKey) modifiers += "shift_";

  if (e.key)
    keyname = e.key;

  else if(e.keyIdentifier && e.keyIdentifier.substring(0,2) !== "U+")
    keyname = e.keyIdentifier;

  else
    keyname = Keymap.keyCodeToKeyName[e.keyCode];

  if (!keyname)
    return;

  let keyid = modifiers + keyname.toLowerCase();

  let handler = this.map[keyid];

  if (handler) {

    let retval = handler.call(element, e, keyid);

    if (retval === false) {

      if (e.stopPropagation)
        e.stopPropagation();

      else
        e.cancelBubble = true;

      if (e.preventDefault)
        e.preventDefault();

      else
        e.returnValue = false;

    }

    return retval;
  }

};

Keymap.normalize = function(keyid) {

  keyid = keyid.toLowerCase();

  let words = keyid.split(/\s+|[\-+_]/);

  var keyname = words.pop();

  keyname = Keymap.aliases[keyname] || keyname;

  words.sort();

  words.push(keyname);

  return words.join("_");

};

Keymap.aliases = {

  "escape":"esc",
  "delete":"del",
  "return":"enter",
  "ctrl":"control",
  "space":"spacebar",
  "ins":"insert"

};

Keymap.keyCodeToKeyName = {

  // Клавиши со словами или стрелками на них
  8:"Backspace", 9:"Tab", 13:"Enter", 16:"Shift", 17:"Control", 18:"Alt",
  19:"Pause", 20:"CapsLock", 27:"Esc", 32:"Spacebar", 33:"PageUp",
  34:"PageDown", 35:"End", 36:"Home", 37:"Left", 38:"Up", 39:"Right",
  40:"Down", 45:"Insert", 46:"Del",
  // Цифровые клавиши на основной клавиатуре (не на дополнительной)
  48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",
  // Буквенные клавиши. Обратите внимание, что здесь не различаются
  // символы верхнего и нижнего регистров
  65:"A", 66:"B", 67:"C", 68:"D", 69:"E", 70:"F", 71:"G", 72:"H", 73:"I",
  74:"J", 75:"K", 76:"L", 77:"M", 78:"N", 79:"O", 80:"P", 81:"Q", 82:"R",
  83:"S", 84:"T", 85:"U", 86:"V", 87:"W", 88:"X", 89:"Y", 90:"Z",
  // Цифровые клавиши на дополнительной клавиатуре и клавиши со знаками препинания.
  // (Не поддерживаются в Opera.)
  96:"0",97:"1",98:"2",99:"3",100:"4",101:"5",102:"6",103:"7",104:"8",
  105:"9",106:"Multiply", 107:"Add", 109:"Subtract", 110:"Decimal",
  111:"Divide",
  // Функциональные клавиши
  112:"F1", 113:"F2", 114:"F3", 115:"F4", 116:"F5", 117:"F6",
  118:"F7", 119:"F8", 120:"F9", 121:"F10", 122:"F11", 123:"F12",
  124:"F13", 125:"F14", 126:"F15", 127:"F16", 128:"F17", 129:"F18",
  130:"F19", 131:"F20", 132:"F21", 133:"F22", 134:"F23", 135:"F24",
  // Клавиши со знаками препинания, для ввода которых не требуется
  // удерживать нажатой клавишу Shift.
  // Дефис не может использоваться переносимым способом: FF возвращает
  // тот же код, что и для клавиши Subtract
  59:";", 61:"=", 186:";", 187:"=",     // Firefox и Opera возвращают 59,61
  188:",", 190:".", 191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"'"

};