export const isTop = !top || top === window;

const messageDiv = document.getElementById('js_htmlMessage');
const messageDivAll = document.getElementById('js_htmlMessageAll');

function genTextElement(str) {
  const el = document.createElement('div');

  el.innerText = str;
  el.style.wordBreak = 'break-all';

  if (str.trim().startsWith('>>>')) {
    el.style.fontSize = '12px';
  }

  return el;
}

export function appendMessage(str) {
  messageDiv.appendChild(genTextElement(str));

  if (isTop) {
    appendMessageAll(str);
  } else {
    top.appendMessageAll(str);
  }
}

function appendMessageAll(str) {
  if (isTop) {
    messageDivAll.appendChild(genTextElement(str));
  }
}

self.appendMessageAll = appendMessageAll;
