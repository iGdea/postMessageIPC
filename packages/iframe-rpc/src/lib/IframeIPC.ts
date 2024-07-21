import { IframeMessagePromise } from "./IframeMessagePromise";

export class IframeIPC {
  private iframeMessage: IframeMessagePromise

  constructor(
    namespace: string,
    private optioins: { serverFrame?: Window, host?: string } = {},
  ) {
    this.iframeMessage = new IframeMessagePromise(namespace);
  }

  /**
   * 注册 server 接口，并返回给client使用的函数
   *
   * * 在server中使用，完成处理函数的注册
   * * 在client中使用，完成调用函数的生成
   */
  public defServerAPI<Args extends any[], Result>(
    api: string,
    handler: (...args: Args) => Promise<Result>,
  ): (...args: Args) => Promise<Result> {
    if (this.iframeMessage.serverAPIs[api]) {
      throw new Error(`Duplicate Definition ServerAPI: ${api}`);
    }

    this.iframeMessage.serverAPIs[api] = handler;

    return (...args: Args) => this.iframeMessage.callApi<Args, Result>(this.optioins.serverFrame || parent, this.optioins.host || '*', api, args);
  }

  public initFrameServer(): void {
    return this.iframeMessage.initFrameServer();
  }
}
