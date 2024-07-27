import type { IframeMessagePromise } from './IframeMessagePromise';

export type ServerAPIOptions = {
  server?: {
    frame?: Window,
    origin?: string,
  },
  client?: {
    origin?: string,
  },
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

    this.iframeMessage.serverAPIs[apikey] = (event, ...args: Args) => {
      const clientOrigin = this.optioins.client?.origin;
      if (clientOrigin) {
        if (!event.origin) throw Error('Check Host Fail: Miss origin');
        if (event.origin !== clientOrigin) {
          throw Error(`Check Host Fail, origin: ${event.origin}`);
        }
      }

      return handler(...args);
    };

    return (...args: Args) => this.iframeMessage.callApi<Args, Result>(
      this.optioins.server?.frame || parent,
      apikey,
      args,
      this.optioins.server?.origin || '*',
    );
  }
}
