# iframe-ipc

## 2.4.0

### Minor Changes

- 892cc03: defServerAPIExt 支持 callback 模式,自动注册和取消注册 funcid
- 0402f78: 在 server 接收到消息后,对 host 来源进行校验(如果有配置 host 的话)

## 2.3.0

### Minor Changes

- 增加 `onlytransform` 选项

## 2.2.0

### Minor Changes

- 调整 Mesage 的结构，将 api 移动到外层

## 2.1.1

### Patch Changes

- 增加加密传输方案 IframeIPCs

## 2.1.0

### Minor Changes

- 支持 transform 回调函数,用于转换传递的参数

## 2.0.1

### Patch Changes

- 6f856a7: 调整临时 API 跨 frame 消息格式，对齐 handler 调用参数
