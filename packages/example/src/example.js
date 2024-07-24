import { IframeIPC } from 'iframe-ipc';
import { IframeIPCs } from 'iframe-ipcs';
import { isTop } from './appendMessage';
import { newIframeIPC } from './newIframeIPC';
import { appendMessage } from './appendMessage';


const iframeIpc = newIframeIPC('IframeIPC', IframeIPC);
const iframeIpcs = newIframeIPC('IframeIPCs', IframeIPCs);


window.addEventListener('message', (event) => {
  appendMessage(` >>> onmessage, istop: ${isTop}, msg: ${JSON.stringify(event.data)}`);
});


if (isTop) {
  iframeIpc.iframeIpc.initFrameServer();
  iframeIpcs.iframeIpc.initFrameServer();
} else {
  window.clickButton1 = iframeIpc.clickButton1;
  window.clickButton2 = iframeIpc.clickButton2;
  window.clickButton3 = iframeIpcs.clickButton1;
  window.clickButton4 = iframeIpcs.clickButton2;
}
