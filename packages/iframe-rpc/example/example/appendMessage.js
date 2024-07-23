const isTop = !top || top === window;

const messageDiv = document.getElementById('js_htmlMessage');
const messageDivAll = document.getElementById('js_htmlMessageAll');

function appendMessage(str) {
  const el = document.createElement('div');

  el.innerText = str;
  if (str.trim().startsWith('>>>')) {
    el.style.fontSize = '12px';
  }

  messageDiv.appendChild(el);

  if (isTop) {
    appendMessageAll(str);
  } else {
    top.appendMessageAll(str);
  }
}

function appendMessageAll(str) {
  if (isTop) {
    const el = document.createElement('div');

    el.innerText = str;
    if (str.trim().startsWith('>>>')) {
      el.style.fontSize = '12px';
    }

    messageDivAll.appendChild(el);
  }
}

window.appendMessageAll = appendMessageAll;

module.exports = {
  isTop,
  appendMessage,
};
