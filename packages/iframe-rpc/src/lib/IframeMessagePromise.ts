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

type NormalMessage<T> = {
  encode: false,
  message: T,
  type: MessageType,
  callid: string,
};

type EncodeMessage = {
  encode: true,
  buffer: any,
  type: MessageType,
  callid: string,
};

type Message<T> = NormalMessage<T> | EncodeMessage;

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

function isEncodeMessage(data: any): data is EncodeMessage {
  return data
    && data.callid
    && data.encode;
}

async function decodeMessage<T>(data: Message<T>, transform?: TransformHandler<any, T>): Promise<T> {
  if (isEncodeMessage(data)) {
    if (!transform) throw new Error('Miss transform For EncodeMessage');
    return transform('decode', data.buffer);
  }

  return data.message;
}

async function encodeMessage<T>(data: Message<T>, transform: TransformHandler<T, any>): Promise<EncodeMessage> {
  if (isEncodeMessage(data)) return data;

  return {
    encode: true,
    buffer: await transform('encode', data.message),
    type: data.type,
    callid: data.callid,
  };
}

export type TransformHandler<Args, Result> = {
  (type: 'encode', args: Args): Result | Promise<Result>
  (type: 'decode', args: Result): Args | Promise<Args>
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
    private options: { transform?: TransformHandler<any, any> } = {},
  ) {
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
        const { callid } = data;
        const message = await decodeMessage(data, this.options.transform);
        const handler = this.serverAPIs[message.api];

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
            const result = await handler(event, ...message.args);
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
      message: {
        api,
        args,
      },
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
        const message = await decodeMessage(data, this.options.transform);
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
