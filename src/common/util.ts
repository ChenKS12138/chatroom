import * as events from "events";

export class UidList {
  private list: {
    uid: string;
    timestamp: number;
  }[];
  private timeout: number;
  private selfUid: string;
  emitter: events.EventEmitter;
  static EVENT_UID_OUTDATE = "uidOutdate";
  static EVENT_UID_NEW = "uidNew";
  constructor(selfUid, timeout = 800) {
    this.list = [];
    this.timeout = timeout;
    this.selfUid = selfUid;
    this.emitter = new events.EventEmitter();
  }
  update(uid: string) {
    if (uid === this.selfUid) {
      return;
    }
    const target = this.list.find((one) => one.uid === uid);
    if (!target) {
      this.emitter.emit(UidList.EVENT_UID_NEW, uid);
      this.list.push({
        uid,
        timestamp: Date.now(),
      });
    } else {
      target.timestamp = Date.now();
    }
  }
  get uids(): string[] {
    this.list.forEach((one, index) => {
      const valid = Date.now() - one.timestamp < this.timeout;
      if (!valid) {
        this.emitter.emit(UidList.EVENT_UID_OUTDATE, one.uid);
        this.list.splice(index, 1);
      }
    });
    return [this.selfUid, ...this.list.map((one) => one.uid)];
  }
  get leftPeer(): string {
    const uids = this.uids;
    if (uids.length < 2) return this.selfUid;
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
