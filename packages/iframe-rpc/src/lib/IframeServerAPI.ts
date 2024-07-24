import type { IframeMessagePromise } from './IframeMessagePromise';

export type ServerAPIOptions = {
  serverFrame?: Window,
  host?: string,
};

export class IframeServerAPI {
  constructor(
    private iframeMessage: IframeMessagePromise,
    private optioins: ServerAPIOptions = {},
  ) {}

  public defServerAPI<Args extends any[], Result>(
    api: string,
    handler: (...args: Args) => Promise<Result> | Result,
  ): (...args: Args) => Promise<Result> {
    const apikey = `svr_api/${api}`;

    if (this.iframeMessage.serverAPIs[apikey]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.iframeMessage.serverAPIs[apikey] = (event, ...args: Args) => handler(...args);

    return (...args: Args) => this.iframeMessage.callApi<Args, Result>(
      this.optioins.serverFrame || parent,
      apikey,
      args,
      this.optioins.host || '*',
    );
  }
}
