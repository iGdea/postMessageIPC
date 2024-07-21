import { uniqId } from './uniqId';
import type { IframeMessagePromise } from './IframeMessagePromise';

type TempHanlderData = {
  event: MessageEvent,
  callTempApi: (funcid: string, ...args: any[]) => any,
};

type TempHandler<Args extends any[], Result> = (data: TempHanlderData, ...args: Args) => Result;

export class IframeServerAPIWithTempHandler {

  constructor(
    private iframeMessage: IframeMessagePromise,
    private optioins: { serverFrame?: Window, host?: string } = {},
  ) {}

  public defServerAPIWithTempHandler<Args extends any[], Result>(
    api: string,
    handler: (
      data: TempHanlderData & { handlers: { [funcid: string]: Function } },
      ...args: Args
    ) => Promise<Result> | Result,
  ): (...args: Args) => Promise<Result> {
    const apikey = `serverAPI_Temp/${api}`;

    if (this.iframeMessage.serverAPIs[apikey]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.iframeMessage.serverAPIs[apikey] = (event, funcids: string[], ...args: Args) => {
      const callTempApi = (funcid: string, ...args: any[]) => {
        if (!event.source) throw new Error(`miss event.source: ${funcid}`);
        return this.iframeMessage.callApi(event.source, `temphandler/${funcid}`, args);
      };
      const handlers = funcids.reduce((map, funcid) => {
        map[funcid] = (...args: any[]) => callTempApi(funcid, args);
        return map;
      }, {} as { [funcid: string]: Function });

      return handler({ event, handlers, callTempApi }, ...args);
    };

    return (...args: Args) => this.iframeMessage.callApi<Args, Result>(
      this.optioins.serverFrame || parent,
      apikey,
      args,
      this.optioins.host || '*',
    );
  }

  public genTempHandler<Args extends any[], Result>(handler: TempHandler<Args, Result>): string {
    this.initFrameServer();

    const funcid = uniqId();
    const apikey = `temphandler/${funcid}`;

    this.iframeMessage.serverAPIs[apikey] = (event, ...args: Args) => {
      const callTempApi = (funcid: string, ...args: any[]) => {
        if (!event.source) throw new Error(`miss event.source: ${funcid}`);
        return this.iframeMessage.callApi(event.source, `temphandler/${funcid}`, args);
      };

      return handler({ event, callTempApi }, ...args);
    };

    return funcid;
  }

  public removeTempHandler(funcid: string): void {
    const apikey = `temphandler/${funcid}`;
    delete this.iframeMessage.serverAPIs[apikey];
  }

  private initFrameServer(): void {
    return this.iframeMessage.initFrameServer();
  }
}
