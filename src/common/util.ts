export class UidList {
  private list: {
    uid: string;
    timestamp: number;
  }[];
  private timeout: number;
  private selfUid: string;
  constructor(selfUid, timeout = 800) {
    this.list = [];
    this.timeout = timeout;
    this.selfUid = selfUid;
  }
  update(uid: string) {
    if (uid === this.selfUid) {
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
    return [this.selfUid, ...this.list.map((one) => one.uid)];
  }
  get leftPeer(): string {
    if (this.list.length < 2) return this.selfUid;
    const uids = this.uids;
    uids.sort();
    const index = uids.findIndex((one) => one === this.selfUid);
    if (index === 0) {
      return uids[uids.length - 1];
    }
    return uids[index - 1];
  }
}

export function setImmediatelyInterval(callback: () => void, interval: number) {
  callback();
  return setInterval(callback, interval);
}
