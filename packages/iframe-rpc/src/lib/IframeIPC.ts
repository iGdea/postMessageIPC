import { IframeMessagePromise } from './IframeMessagePromise';
import { IframeServerAPI } from './IframeServerAPI';
import { IframeServerAPIWithTempHandler } from './IframeServerAPIWithTempHandler';

export class IframeIPC {
  iframeMessage: IframeMessagePromise
  iframeServerAPI: IframeServerAPI
  iframeServerAPITemp: IframeServerAPIWithTempHandler

  constructor(
    namespace: string,
    optioins: { serverFrame?: Window, host?: string } = {},
  ) {
    this.iframeMessage = new IframeMessagePromise(namespace);

    this.iframeServerAPI = new IframeServerAPI(this.iframeMessage, optioins);
    this.iframeServerAPITemp = new IframeServerAPIWithTempHandler(this.iframeMessage, optioins);
  }

  /**
   * 【cgi模式】注册外层Frame接口（SDK形式的固定函数），并返回给内层Frame使用的函数
   *
   * * 在外层Frame中调用，完成处理函数的注册
   * * 在内层Frame中调用，完成调用函数的生成
   */
  public defServerAPI<Args extends any[], Result>(
    ...args: Parameters<typeof this.iframeServerAPI.defServerAPI<Args, Result>>
  ) {
    return this.iframeServerAPI.defServerAPI(...args);
  }

  public initFrameServer(): void {
    return this.iframeMessage.initFrameServer();
  }


  public defServerAPIWithTempHandler<Args extends any[], Result>(
    ...args: Parameters<typeof this.iframeServerAPITemp.defServerAPIWithTempHandler<Args, Result>>
  ) {
    return this.iframeServerAPITemp.defServerAPIWithTempHandler(...args);
  }


  public genTempHandler(...args: Parameters<typeof this.iframeServerAPITemp.genTempHandler>) {
    return this.iframeServerAPITemp.genTempHandler(...args);
  }

  public removeTempHandler(...args: Parameters<typeof this.iframeServerAPITemp.removeTempHandler>): void {
    return this.iframeServerAPITemp.removeTempHandler(...args);
  }
}
