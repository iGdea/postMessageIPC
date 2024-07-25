import { IframeIPC } from 'iframe-ipc';
import { IframeIPCs } from 'iframe-ipcs';
import { appendMessage } from '../lib/appendMessage';
import { newIframeIPC } from '../lib/newIframeIPC';

export const iframeIpc = newIframeIPC('IframeIPC_iframe', IframeIPC, appendMessage);
export const iframeIpcs = newIframeIPC('IframeIPCs_iframe', IframeIPCs, appendMessage);
