export class UidList {
  private list: {
    uid: string;
    timestamp: number;
  }[];
  private timeout: number;
  private serverUid: string;
  constructor(serverUid, timeout = 3000) {
    this.list = [];
    this.timeout = timeout;
    this.serverUid = serverUid;
  }
  update(uid: string) {
    if (uid === this.serverUid) {
      return;
    }
    const target = this.list.find((one) => one.uid === uid);
    if (!target) {
      this.list.push({
        uid,
        timestamp: Date.now(),
      });
    } else {
      target.timestamp = Date.now();
    }
  }
  get uids(): string[] {
    this.list = this.list.filter(
      (one) => Date.now() - one.timestamp < this.timeout
    );
    return [this.serverUid, ...this.list.map((one) => one.uid)];
  }
}

export function setImmediatelyInterval(callback: () => void, interval: number) {
  callback();
  return setInterval(callback, interval);
}
