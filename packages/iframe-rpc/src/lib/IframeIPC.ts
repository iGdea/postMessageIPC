import { IframeMessagePromise } from './IframeMessagePromise';
import { IframeServerAPI } from './IframeServerAPI';
import { IframeServerAPIWithTempAPI } from './IframeServerAPIWithTempAPI';

export class IframeIPC {
  iframeMessage: IframeMessagePromise
  iframeServerAPI: IframeServerAPI
  iframeServerAPITemp: IframeServerAPIWithTempAPI

  constructor(
    namespace: string,
    optioins: { serverFrame?: Window, host?: string } = {},
  ) {
    this.iframeMessage = new IframeMessagePromise(namespace);

    this.iframeServerAPI = new IframeServerAPI(this.iframeMessage, optioins);
    this.iframeServerAPITemp = new IframeServerAPIWithTempAPI(this.iframeMessage, optioins);
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


  public defServerAPIExt<Args extends any[], Result>(
    ...args: Parameters<typeof this.iframeServerAPITemp.defServerAPIExt<Args, Result>>
  ) {
    return this.iframeServerAPITemp.defServerAPIExt(...args);
  }


  public genTempAPI(...args: Parameters<typeof this.iframeServerAPITemp.genTempAPI>) {
    return this.iframeServerAPITemp.genTempAPI(...args);
  }

  public removeTempAPI(...args: Parameters<typeof this.iframeServerAPITemp.removeTempAPI>): void {
    return this.iframeServerAPITemp.removeTempAPI(...args);
  }
}
