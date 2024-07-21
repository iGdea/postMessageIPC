import { getCallId } from './lib/getCallId';


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


export class IframeIPC {
  private callbackHandlers: { [callid: string]: Callback }
  private serverAPIs: { [handlerName: string]: (...args: any[]) => Promise<any> }

  constructor(
    private namespace: string,
    private optioins: { serverFrame?: Window, host?: string } = {},
  ) {
    this.callbackHandlers = {};
    this.serverAPIs = {};

    this.initClient();
  }

  public defServerAPI<Args extends any[], Result>(
    api: string,
    handler: (...args: Args) => Promise<Result>,
  ): (...args: Args) => Promise<Result> {
    this.serverAPIs[api] = handler;

    return (...args: Args) => this.callApi<Args, Result>(api, args);
  }

  public initFrameServer(): void {
    window.addEventListener('message', (event) => {
      const data = event.data?.[this.namespace] as CallMessage<any> | ReturnMessage<any, any>;

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

          handler(...data.data.args).then(
            data => returnMessage({ iserr: false, data }),
            error => returnMessage({ iserr: true, error }),
          );
        }
      }
    });
  }

  private callApi<Args extends any[], Result>(api: string, args?: Args): Promise<Result> {
    const callid = getCallId();

    (this.optioins?.serverFrame || parent)?.postMessage({
      [this.namespace]: <CallMessage<Args>>{
        data: {
          api,
          args,
        },
        type: MessageType.CALL,
        callid,
      },
    }, this.optioins?.host || '*');

    return new Promise((resolve, reject) => {
      this.callbackHandlers[callid] = {
        resolve,
        reject,
      };
    });
  }

  private initClient(): void {
    window.addEventListener('message', (event) => {
      const data = event.data?.[this.namespace] as CallMessage<any> | ReturnMessage<any, any>;

      if (isReturnMessage(data)) {
        const handler = this.callbackHandlers[data.callid];
        if (handler) {
          delete this.callbackHandlers[data.callid];

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

// const iframeIpc = new IframeIPC('namespace');
