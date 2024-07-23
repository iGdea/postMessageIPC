import { IframeMessagePromise } from './IframeMessagePromise';
import { IframeServerAPI } from './IframeServerAPI';
import { IframeServerAPIWithTempAPI } from './IframeServerAPIWithTempAPI';

import type { TransformHandler } from './Message';

export class IframeIPC {
  iframeMessage: IframeMessagePromise
  iframeServerAPI: IframeServerAPI
  iframeServerAPITemp: IframeServerAPIWithTempAPI

  constructor(
    namespace: string,
    optioins: { serverFrame?: Window, host?: string, transform?: TransformHandler<any, any> } = {},
  ) {
    this.iframeMessage = new IframeMessagePromise(namespace, optioins);

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

  /**
   * 初始化外层Frame的事件监听
   */
  public initFrameServer(): void {
    return this.iframeMessage.initFrameServer();
  }


  /**
   * 【cgi模式】注册外层Frame接口（SDK形式的固定函数），并返回给内层Frame使用的函数
   *
   * 不同于 `defServerAPI`，内层Frame调用时可以传入funcids（可通过defTempAPI接口生成），实现回调函数的注册
   */
  public defServerAPIExt<Args extends any[], Result>(
    ...args: Parameters<typeof this.iframeServerAPITemp.defServerAPIExt<Args, Result>>
  ) {
    return this.iframeServerAPITemp.defServerAPIExt(...args);
  }

  /**
   * 生成 funcid，实现临时函数的注册（一般用于各种回调）
   *
   * 注意：使用完成后，需要通过 undefTempAPI，销毁临时函数。否则容易造成内存泄露
   */
  public defTempAPI(...args: Parameters<typeof this.iframeServerAPITemp.defTempAPI>) {
    return this.iframeServerAPITemp.defTempAPI(...args);
  }

  /**
   * 删除临时函数
   */
  public undefTempAPI(...args: Parameters<typeof this.iframeServerAPITemp.undefTempAPI>): void {
    return this.iframeServerAPITemp.undefTempAPI(...args);
  }

  /**
   * 删除所有的临时函数
   */
  public undefAllTempAPI(): void {
    return this.iframeServerAPITemp.undefAllTempAPI();
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    return this.iframeMessage.destroy();
  }
}
