import { uniqId } from './uniqId';
import type { IframeMessagePromise } from './IframeMessagePromise';

type TempAPIData = {
  event: MessageEvent,
  callTempApi: (funcid: string, ...args: any[]) => any,
};

type TempAPI<Args extends any[], Result> = (data: TempAPIData, ...args: Args) => Result;

export class IframeServerAPIWithTempAPI {

  constructor(
    private iframeMessage: IframeMessagePromise,
    private optioins: { serverFrame?: Window, host?: string } = {},
  ) {}

  public defServerAPIWithTempAPI<Args extends any[], Result>(
    api: string,
    handler: (
      data: TempAPIData & { handlers: { [funcid: string]: Function } },
      ...args: Args
    ) => Promise<Result> | Result,
  ): (funcids: string[], ...args: Args) => Promise<Result> {
    const apikey = `svr_api_temp/${api}`;

    if (this.iframeMessage.serverAPIs[apikey]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.iframeMessage.serverAPIs[apikey] = (event, { funcids, args }: { funcids: string[], args: Args }) => {
      const callTempApi = this.genCallTempApi(event.source);
      const handlers = funcids.reduce((map, funcid) => {
        map[funcid] = (...args: any[]) => callTempApi(funcid, args);
        return map;
      }, {} as { [funcid: string]: Function });

      return handler({ event, handlers, callTempApi }, ...args);
    };

    return (funcids: string[], ...args: Args) => this.iframeMessage.callApi<[{ funcids: string[], args: Args }], Result>(
      this.optioins.serverFrame || parent,
      apikey,
      [{ funcids, args }],
      this.optioins.host || '*',
    );
  }

  public genTempAPI<Args extends any[], Result>(handler: TempAPI<Args, Result>): string {
    this.initFrameServer();

    const funcid = uniqId();
    const apikey = `tempapi/${funcid}`;

    this.iframeMessage.serverAPIs[apikey] = (event, ...args: Args) => {
      const callTempApi = this.genCallTempApi(event.source);
      return handler({ event, callTempApi }, ...args);
    };

    return funcid;
  }

  public removeTempAPI(funcid: string): void {
    const apikey = `tempapi/${funcid}`;
    delete this.iframeMessage.serverAPIs[apikey];
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