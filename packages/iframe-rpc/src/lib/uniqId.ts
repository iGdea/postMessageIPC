let uniqIndex = 0;

export function uniqId() {
  uniqIndex += 1;
  return `${Date.now()}${Math.random() *  10000 | 0}${uniqIndex}`;
}
