import { Emit } from 'emit-ts';

import { uniqId } from './uniqId';
import {
  MessageType,
  isCallMessage,
  isReturnMessage,
  decodeMessage,
  encodeMessage,

  type CallMessage,
  type ReturnData,
  type ReturnMessage,
  type TransformHandler,
} from './Message';

type Callback = {
  resolve: (data: any) => void,
  reject: (data: any) => void,
};

export type MessagePromiseOptions = {
  onlytransform?: boolean,
  transform?: TransformHandler<any, any>,
};


/**
 * postMessage 的 promise 消息通道
 */
export class IframeMessagePromise {
  public serverAPIs: { [handlerName: string]: (event: MessageEvent, ...args: any[]) => any }

  private promiseCallbackHandlers: { [callid: string]: Callback }
  private namespace: string
  private destroyEmit: Emit<void>
  private hasInitedClient: undefined | ((event: MessageEvent) => any)
  private hasInitedFrameServer: undefined | ((event: MessageEvent) => any)

  constructor(
    namespace: string,
    private options: MessagePromiseOptions = {},
  ) {
    this.namespace = `$iframe_ipc/v1/${namespace}`;
    this.promiseCallbackHandlers = {};
    this.serverAPIs = {};

    this.destroyEmit = new Emit();
  }

  /**
   * 绑定外层frame的message事件
   */
  public initFrameServer(): void {
    if (this.hasInitedFrameServer) return;

    const func = async (event: MessageEvent) => {
      const data = event.data?.[this.namespace] as CallMessage<any>;

      if (isCallMessage(data)) {
        const { callid, api } = data;
        const message: any[] = await decodeMessage(data, this.options.transform, this.options.onlytransform);
        const handler = this.serverAPIs[api];

        if (handler) {
          const returnMessage = async <Data, Error>(message: ReturnData<Data, Error>, canTransfrom = true): Promise<void> => {
            if (!event.source) {
              console.error('miss event.source');
              return;
            }

            const originData = <ReturnMessage<Data, Error>>{
              message,
              type: MessageType.RETURN,
              callid,
            };

            event.source.postMessage({
              [this.namespace]: canTransfrom && this.options.transform
                ? await encodeMessage(originData, this.options.transform)
                : originData,
            }, event.origin as any);
          }

          try {
            const result = await handler(event, ...message);
            await returnMessage({ iserr: false, data: result });
          } catch (error) {
            try {
              await returnMessage({ iserr: true, error });
            } catch (error) {
              await returnMessage({ iserr: true, error }, false);
            }
          }
        }
      }
    };

    window.addEventListener('message', func, false);
    this.hasInitedFrameServer = func;
  }

  /**
   * 通过postMessage调用外层frame中的方法
   */
  public async callApi<Args extends any[], Result>(frame: MessageEventSource, api: string, args: Args): Promise<Result>
  public async callApi<Args extends any[], Result>(frame: Window, api: string, args: Args, host: string): Promise<Result>
  public async callApi<Args extends any[], Result>(frame: MessageEventSource | Window, api: string, args: Args, host?: string): Promise<Result> {
    this.initClient();

    const callid = uniqId();
    const originData: CallMessage<Args> = {
      encode: false,
      message: args,
      api,
      type: MessageType.CALL,
      callid,
    };

    const postData = {
      [this.namespace]: this.options.transform
        ? await encodeMessage(originData, this.options.transform)
        : originData,
    };

    if (typeof host === 'string') {
      (frame as Window).postMessage(postData, host);
    } else {
      frame.postMessage(postData);
    }

    return new Promise((resolve, reject) => {
      this.promiseCallbackHandlers[callid] = {
        resolve,
        reject,
      };
    });
  }

  /**
   * 绑定内层frame的message事件
   */
  private initClient(): void {
    if (this.hasInitedClient) return;

    const func = async(event: MessageEvent) => {
      const data = event.data?.[this.namespace] as ReturnMessage<any, any>;

      if (isReturnMessage(data)) {
        const { callid } = data;
        const message = await decodeMessage(data, this.options.transform, this.options.onlytransform);
        const handler = this.promiseCallbackHandlers[callid];
        if (handler) {
          delete this.promiseCallbackHandlers[callid];

          if (message.iserr) {
            handler.reject(message.error);
          } else {
            handler.resolve(message.data);
          }
        }
      }
    };

    window.addEventListener('message', func, false);
    this.hasInitedClient = func;
  }

  destroy() {
    if (this.hasInitedClient) {
      const func = this.hasInitedClient;
      window.removeEventListener('message', func, false);
      this.hasInitedClient = undefined;
    }

    if (this.hasInitedFrameServer) {
      const func = this.hasInitedFrameServer;
      window.removeEventListener('message', func, false);
      this.hasInitedFrameServer = undefined;
    }

    this.promiseCallbackHandlers = {};
    this.serverAPIs = {};

    this.destroyEmit.emit();
  }

  ondestroy(handler: () => void) {
    this.destroyEmit.on(handler);
  }
}
