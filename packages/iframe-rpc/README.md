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

```typescript
import { IframeIPC } from 'iframe-ipc';

const iframeIpc = new IframeIPC('namespace', {
  dosomething(args) {
    return result;
  }
});

// top 外层 ifreame
iframeIpc.initFrameServer();

// client 内层 iframe
iframeIpc.callApi('dosomething', args).then((result) => console.log(result));
```


[npm-image]: https://img.shields.io/npm/v/iframe-ipc.svg
[downloads-image]: https://img.shields.io/npm/dm/iframe-ipc.svg
[npm-url]: https://www.npmjs.org/package/iframe-ipc
[license-image]: https://img.shields.io/npm/l/iframe-ipc.svg
