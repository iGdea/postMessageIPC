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
  data: T,
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


export class IframeMessagePromise {
  public serverAPIs: { [handlerName: string]: (event: MessageEvent, ...args: any[]) => any }

  private promiseCallbackHandlers: { [callid: string]: Callback }
  private namespace: string
  private hasInitedClient: boolean;
  private hasInitedFrameServer: boolean;

  constructor(namespace: string) {
    this.namespace = `$iframe_ipc_msg/${namespace}`;
    this.promiseCallbackHandlers = {};
    this.serverAPIs = {};

    this.hasInitedClient = false;
    this.hasInitedFrameServer = false;
  }

  /**
   * 绑定外层frame的message事件
   */
  public initFrameServer(): void {
    if (this.hasInitedFrameServer) return;
    this.hasInitedFrameServer = true;

    window.addEventListener('message', async (event) => {
      const data = event.data?.[this.namespace] as CallMessage<any>;

      if (isCallMessage(data)) {
        const handler = this.serverAPIs[data.data.api];
        if (handler) {
          const { callid } = data;
          const returnMessage = <Data, Error>(data: ReturnData<Data, Error>): void => {
            if (!event.source) {
              console.error('miss event.source');
              return;
            }

            event.source.postMessage({
              [this.namespace]: <ReturnMessage<Data, Error>>{
                data,
                type: MessageType.RETURN,
                callid,
              },
            }, event.origin as any);
          }

          try {
            const result = await handler(event, ...data.data.args);
            returnMessage({ iserr: false, data: result })
          } catch (error) {
            returnMessage({ iserr: true, error })
          }
        }
      }
    });
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
        data: {
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
    this.hasInitedClient = true;

    window.addEventListener('message', (event) => {
      const data = event.data?.[this.namespace] as ReturnMessage<any, any>;

      if (isReturnMessage(data)) {
        const handler = this.promiseCallbackHandlers[data.callid];
        if (handler) {
          delete this.promiseCallbackHandlers[data.callid];

          if (data.data.iserr) {
            handler.reject(data.data.error);
          } else {
            handler.resolve(data.data.data);
          }
        }
      }
    });
  }
}
