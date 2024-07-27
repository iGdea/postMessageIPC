iframe-ipc
==========

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![NPM License][license-image]][npm-url]

跨iframe通讯，对齐promise调用体验


## Install
```
npm install iframe-ipc --save
```

## Usage

### 支持promise编程

```typescript
import { IframeIPC } from 'iframe-ipc';
const iframeIpc = new IframeIPC('namespace');

const serverApi = iframeIpc.defServerAPI('api123', async (args: number): Promise<string> => {
  return '' + args;
});

// top 外层 ifreame
iframeIpc.initFrameServer();

// client 内层 iframe
serverApi(1234).then((result) => console.log(result));
```

### 支持传递回调函数

```typescript
import { IframeIPC } from 'iframe-ipc';
const iframeIpc = new IframeIPC('namespace');

const funcid = iframeIpc.defTempAPI((info, arg1) => {
  // info 中有onmessage的event对象
});
const serverApi2 = iframeIpc.defServerAPIExt('serverApi2', async function({ handlers }, arg11) {
  // hanlders 中有使用funcid解析后额函数
  const ret = await handlers[arg11.click_funcid](arg22);
  // ...
});
serverApi2({ funcids: [funcid] }, arg11);
```


## Example

[click](https://igdea.github.io/postMessageIPC/example/)


[npm-image]: https://img.shields.io/npm/v/iframe-ipc.svg
[downloads-image]: https://img.shields.io/npm/dm/iframe-ipc.svg
[npm-url]: https://www.npmjs.org/package/iframe-ipc
[license-image]: https://img.shields.io/npm/l/iframe-ipc.svg
