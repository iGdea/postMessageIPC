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


export class IframeServerIPC {
  private promiseCallbackHandlers: { [callid: string]: Callback }
  private serverAPIs: { [handlerName: string]: Function }

  private namespace: string
  private hasInitedClient: boolean;
  protected namespacePre = '$iframe_ipc_svr'

  constructor(
    namespace: string,
    private optioins: { serverFrame?: Window, host?: string } = {},
  ) {
    this.namespace = `${this.namespacePre}/${namespace}`;
    this.promiseCallbackHandlers = {};
    this.serverAPIs = {};

    this.hasInitedClient = false;
  }

  public defServerAPI<Args extends any[], Result>(
    api: string,
    handler: (...args: Args) => Promise<Result>,
  ): (...args: Args) => Promise<Result> {
    if (this.serverAPIs[api]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.serverAPIs[api] = handler;

    return (...args: Args) => this.callApi<Args, Result>(api, args);
  }


  public initFrameServer(): void {
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
            const result = await handler(...data.data.args);
            returnMessage({ iserr: false, data: result })
          } catch (error) {
            returnMessage({ iserr: true, error })
          }
        }
      }
    });
  }

    this.initClient();

    const callid = uniqId();

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
      this.promiseCallbackHandlers[callid] = {
        resolve,
        reject,
      };
    });
  }

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

// const iframeIpc = new IframeIPC('namespace');
