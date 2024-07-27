import { uniqId } from './uniqId';
import type { IframeMessagePromise } from './IframeMessagePromise';
import type { ServerAPIOptions } from './IframeServerAPI';

type TempAPIData = {
  event: MessageEvent,
  callTempApi: (funcid: string, ...args: any[]) => any,
};

type TempAPI<Args extends any[], Result> = (data: TempAPIData, ...args: Args) => Result;

type ExtData = {
  funcids: string[],
};


type ServerAPIExt<Args extends any[], Result> = {
  (extdata: ExtData, ...args: Args): Promise<Result>
  /**
   * callback模式，自动生成funcid，调用后自动注销
   */
  (callback: TempAPI<any[], any>, ...args: Args): Promise<Result>
}


/**
 * 创建和管理临时API，用于事件触发等函数定义
 *
 * 注意：使用完后，利用 undefTempAPI 回收内存
 */
export class IframeServerAPIWithTempAPI {
  private tempAPIs: Map<
    TempAPI<any, any>,
    { funcid: string, origins: string[] }
  >

  constructor(
    private iframeMessage: IframeMessagePromise,
    private optioins: ServerAPIOptions = {},
  ) {
    this.tempAPIs = new Map();

    // iframeMessage 清理时，需要清理掉 tempAPIs 缓存数据
    this.iframeMessage.ondestroy(() => this.tempAPIs.clear());
  }

  public defServerAPIExt<Args extends any[], Result>(
    api: string,
    handler: (
      data: TempAPIData & { handlers: { [funcid: string]: Function } },
      ...args: Args
    ) => Promise<Result> | Result,
  ): ServerAPIExt<Args, Result> {
    const apikey = `svr_api_ext/${api}`;

    if (this.iframeMessage.serverAPIs[apikey]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.iframeMessage.serverAPIs[apikey] = (event, extdata: ExtData, ...args: Args) => {
      const clientOrigin = this.optioins.client?.origin;
      if (clientOrigin) {
        if (!event.origin) throw Error('Check Host Fail: Miss origin');
        if (event.origin !== clientOrigin) {
          throw Error(`Check Host Fail, origin: ${event.origin}`);
        }
      }

      const callTempApi = this.genCallTempApi(event.source);
      const handlers = extdata.funcids.reduce((map, funcid) => {
        map[funcid] = (...args: any[]) => callTempApi(funcid, ...args);
        return map;
      }, {} as { [funcid: string]: Function });

      return handler({ event, handlers, callTempApi }, ...args);
    };

    const runHandler: ServerAPIExt<Args, Result> = (extdata, ...args: Args) => {
      let realExtdata: ExtData;
      if (typeof extdata === 'function') {
        const func: TempAPI<any[], any> = async (data: TempAPIData, ...args: any[]) => {
          try {
            const result = await extdata(data, ...args);
            return result;
          } finally {
            this.undefTempAPI(func);
          }
        }

        const funcid = this.defTempAPI(func, location.origin);
        realExtdata = { funcids: [funcid] };
      } else {
        realExtdata = extdata;
      }

      return this.iframeMessage.callApi<[ExtData, ...Args], Result>(
        this.optioins.server?.frame || parent,
        apikey,
        [realExtdata, ...args],
        this.optioins.server?.origin || '*',
      );
    }

    return runHandler;
  }

  public defTempAPI<Args extends any[], Result>(handler: TempAPI<Args, Result>, origin?: string): string {
    this.initFrameServer();

    const oldfuncInfo = this.tempAPIs.get(handler);
    if (oldfuncInfo) {
      if (!origin || origin === '*') {
        oldfuncInfo.origins = ['*'];
      } else if (oldfuncInfo.origins[0] !== '*') {
        oldfuncInfo.origins.push(origin);
      }

      return oldfuncInfo.funcid;
    }

    const funcid = uniqId();
    const apikey = `tempapi/${funcid}`;
    const funcInfo = {
      funcid,
      origins: [origin || '*'],
    };

    this.iframeMessage.serverAPIs[apikey] = (event, ...args: Args) => {
      if (funcInfo.origins[0] !== '*') {
        if (!event.origin) throw Error('Check Host Fail: Miss origin');
        if (!funcInfo.origins.some(v => v === event.origin)) {
          throw Error(`Check Host Fail, origin: ${event.origin}`);
        }
      }

      const callTempApi = this.genCallTempApi(event.source);
      return handler({ event, callTempApi }, ...args);
    };

    this.tempAPIs.set(handler, funcInfo);

    return funcid;
  }

  public undefTempAPI(funcid: string | TempAPI<any, any>): void {
    if (typeof funcid === 'string') {
      const apikey = `tempapi/${funcid}`;
      delete this.iframeMessage.serverAPIs[apikey];

      for (const [handler, { funcid: key }] of this.tempAPIs) {
        if (key === funcid) this.tempAPIs.delete(handler);
      }
    } else {
      const handler = funcid;
      const funcid2 = this.tempAPIs.get(handler);
      if (funcid2) {
        const apikey = `tempapi/${funcid2}`;
        delete this.iframeMessage.serverAPIs[apikey];
        this.tempAPIs.delete(handler);
      }
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
