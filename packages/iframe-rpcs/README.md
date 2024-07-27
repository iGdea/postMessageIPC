iframe-ipcs
===========

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![NPM License][license-image]][npm-url]

跨iframe通讯，对齐promise调用体验。加密传递数据


## Install
```
npm install iframe-ipcs --save
```

## Usage

### 支持promise编程

```typescript
import { IframeIPCs } from 'iframe-ipcs';
const iframeIpc = new IframeIPCs('namespace', { aes: 'abcdefg' });

const serverApi = iframeIpc.defServerAPI('api123', async (args: number): Promise<string> => {
  return '' + args;
});

// top 外层 ifreame
iframeIpc.initFrameServer();

// client 内层 iframe
serverApi(1234).then((result) => console.log(result));
```


## Example

[click](https://igdea.github.io/postMessageIPC/example/)


[npm-image]: https://img.shields.io/npm/v/iframe-ipcs.svg
[downloads-image]: https://img.shields.io/npm/dm/iframe-ipcs.svg
[npm-url]: https://www.npmjs.org/package/iframe-ipcs
[license-image]: https://img.shields.io/npm/l/iframe-ipcs.svg
