import { isTop, appendMessage } from './lib/appendMessage';
import * as iframeObj from './iframe-rpc/iframe';

self.addEventListener('message', (event) => {
  appendMessage(` >>> onmessage, istop: ${isTop}, msg: ${JSON.stringify(event.data)}`);
});


if (isTop) {
  iframeObj.iframeIpc.iframeIpc.initFrameServer();
  iframeObj.iframeIpcs.iframeIpc.initFrameServer();
} else {
  self.runSimple = iframeObj.iframeIpc.runSimple;
  self.runWithCallback = iframeObj.iframeIpc.runWithCallback;
  self.runSimpleAES = iframeObj.iframeIpcs.runSimple;
  self.runWithCallbackAES = iframeObj.iframeIpcs.runWithCallback;
}
