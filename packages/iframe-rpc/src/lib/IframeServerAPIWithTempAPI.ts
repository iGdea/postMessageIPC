import { uniqId } from './uniqId';
import type { IframeMessagePromise } from './IframeMessagePromise';

type TempAPIData = {
  event: MessageEvent,
  callTempApi: (funcid: string, ...args: any[]) => any,
};

type TempAPI<Args extends any[], Result> = (data: TempAPIData, ...args: Args) => Result;

type ExtData = {
  funcids: string[],
};

export class IframeServerAPIWithTempAPI {
  private tempAPIs: Map<TempAPI<any, any>, string>

  constructor(
    private iframeMessage: IframeMessagePromise,
    private optioins: { serverFrame?: Window, host?: string } = {},
  ) {
    this.tempAPIs = new Map();
  }

  public defServerAPIExt<Args extends any[], Result>(
    api: string,
    handler: (
      data: TempAPIData & { handlers: { [funcid: string]: Function }, extdata: ExtData },
      ...args: Args
    ) => Promise<Result> | Result,
  ): (extdata: ExtData, ...args: Args) => Promise<Result> {
    type ExtArgs = [{ extdata: ExtData, args: Args }];

    const apikey = `svr_api_ext/${api}`;

    if (this.iframeMessage.serverAPIs[apikey]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.iframeMessage.serverAPIs[apikey] = (event, { extdata, args }: ExtArgs[0]) => {
      const callTempApi = this.genCallTempApi(event.source);
      const handlers = extdata.funcids.reduce((map, funcid) => {
        map[funcid] = (...args: any[]) => callTempApi(funcid, args);
        return map;
      }, {} as { [funcid: string]: Function });

      return handler({ event, handlers, extdata, callTempApi }, ...args);
    };

    return (extdata: ExtData, ...args: Args) => this.iframeMessage.callApi<ExtArgs, Result>(
      this.optioins.serverFrame || parent,
      apikey,
      [{ extdata, args }],
      this.optioins.host || '*',
    );
  }

  public defTempAPI<Args extends any[], Result>(handler: TempAPI<Args, Result>): string {
    this.initFrameServer();

    const oldfuncid = this.tempAPIs.get(handler);
    if (oldfuncid) return oldfuncid;

    const funcid = uniqId();
    const apikey = `tempapi/${funcid}`;

    this.iframeMessage.serverAPIs[apikey] = (event, ...args: Args) => {
      const callTempApi = this.genCallTempApi(event.source);
      return handler({ event, callTempApi }, ...args);
    };

    this.tempAPIs.set(handler, funcid);

    return funcid;
  }

  public undefTempAPI(funcid: string): void {
    const apikey = `tempapi/${funcid}`;
    delete this.iframeMessage.serverAPIs[apikey];

    for (const [val, key] of this.tempAPIs) {
      if (key === funcid) this.tempAPIs.delete(val);
    }
  }

  public undefAllTempAPI(): void {
    Object.keys(this.iframeMessage.serverAPIs).forEach(key => {
      if (key.startsWith('tempapi/')) {
        delete this.iframeMessage.serverAPIs[key];
      }
    });

    this.tempAPIs.clear();
  }

  private initFrameServer(): void {
    return this.iframeMessage.initFrameServer();
  }

  /**
   * 通过 MessageEventSource 创建快速调用funcid的方法
   */
  private genCallTempApi(source: MessageEventSource | null) {
    return (funcid: string, ...args: any[]) => {
      if (!source) throw new Error(`miss event.source: ${funcid}`);
      return this.iframeMessage.callApi(source, `tempapi/${funcid}`, args);
    };
  }
}
