let callidIndex = 0;

export function getCallId() {
  callidIndex += 1;
  return `${Date.now()}${Math.random() *  10000 | 0}${callidIndex}`;
}
