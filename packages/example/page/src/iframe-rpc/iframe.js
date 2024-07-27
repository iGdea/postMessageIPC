import { appendMessage } from '../lib/appendMessage';
import { newIframeIPC } from '../lib/newIframeIPC';

console.log('window.IframeIPC', window.IframeIPC);
console.log('window.IframeIPCs', window.IframeIPCs);

export const iframeIpc = newIframeIPC('IframeIPC_iframe', window.IframeIPC, appendMessage);
export const iframeIpcs = newIframeIPC('IframeIPCs_iframe', window.IframeIPCs, appendMessage);
