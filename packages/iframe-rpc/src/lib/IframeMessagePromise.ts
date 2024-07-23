import { Emit } from 'emit-ts';
import { uniqId } from './uniqId';


type Callback = {
  resolve: (data: any) => void,
  reject: (data: any) => void,
};

enum MessageType {
  CALL = 'call',
  RETURN = 'return',
}

type Message<T> = {
  message: T,
  type: MessageType,
  callid: string,
};

type CallData<Args extends any[]> = {
  api: string,
  args: Args,
};

type CallMessage<Args extends any[]> = Message<CallData<Args>>;

type ReturnData<Data, Error> = {
  iserr: boolean,
  data?: Data
  error?: Error,
};

type ReturnMessage<Data, Error> = Message<ReturnData<Data, Error>>;


function isCallMessage(data: any): data is CallMessage<any> {
  return data
    && data.callid
    && data.type === MessageType.CALL;
}

function isReturnMessage(data: any): data is ReturnMessage<any, any> {
  return data
    && data.callid
    && data.type === MessageType.RETURN;
}


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

  constructor(namespace: string) {
    this.namespace = `$iframe_ipc_msg/${namespace}`;
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
        const { message, callid } = data;
        const handler = this.serverAPIs[message.api];
        if (handler) {
          const returnMessage = <Data, Error>(message: ReturnData<Data, Error>): void => {
            if (!event.source) {
              console.error('miss event.source');
              return;
            }

            event.source.postMessage({
              [this.namespace]: <ReturnMessage<Data, Error>>{
                message,
                type: MessageType.RETURN,
                callid,
              },
            }, event.origin as any);
          }

          try {
            const result = await handler(event, ...message.args);
            returnMessage({ iserr: false, data: result })
          } catch (error) {
            returnMessage({ iserr: true, error })
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
  public callApi<Args extends any[], Result>(frame: MessageEventSource, api: string, args: Args): Promise<Result>
  public callApi<Args extends any[], Result>(frame: Window, api: string, args: Args, host: string): Promise<Result>
  public callApi<Args extends any[], Result>(frame: MessageEventSource | Window, api: string, args: Args, host?: string): Promise<Result> {
    this.initClient();

    const callid = uniqId();
    const postData = {
      [this.namespace]: <CallMessage<Args>>{
        message: {
          api,
          args,
        },
        type: MessageType.CALL,
        callid,
      },
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

    const func = (event: MessageEvent) => {
      const data = event.data?.[this.namespace] as ReturnMessage<any, any>;

      if (isReturnMessage(data)) {
        const { callid, message } = data;
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
