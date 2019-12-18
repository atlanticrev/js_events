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
    if (e.type==="readystatechange" && document.readyState !== "complete")
      return;

    // Вызов функции по очереди при полной  загрузке документа
    for(let i = 0; i < funcs.length; i++)
      funcs[i].call(document);

    ready = true;
    funcs = null;

  }


  // Register handler
  if (document.addEventListener) {

    document.addEventListener("DOMContentLoaded", handler, false);
    document.addEventListener("readystatechange", handler, false);
    window.addEventListener("load", handler, false);

  }

  // For IE
  else if (document.attachEvent) {

    document.attachEvent("onreadystatechange", handler);
    window.attachEvent("onload", handler);

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

  if (document.compatMode === "CSS1Compat") {

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

      elementToDrag.detachEvent("onlosecapture", upHandler);
      elementToDrag.detachEvent("onmouseup", upHandler);
      elementToDrag.detachEvent("onmousemove", moveHandler);
      elementToDrag.releaseCapture();

    }

    if (e.stopPropagation) {

      e.stopPropagation();

    } else {

      e.cancelBubble = true;

    }

  }

}

// Тестирование
const dragElement = document.querySelector('img');

dragElement.addEventListener('mousedown', drag.bind(null, dragElement));