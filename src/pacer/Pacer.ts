import { Request } from "./Request";

interface Resolve<T> {
  (value: T): void;
}

interface Reject {
  (reason?: any): void;
}

interface RequestQueueElement<T> {
  request: Request<T>;
  requestResolve: Resolve<T>;
  requestReject: Reject;
}

export class Pacer<T> {
  static MIN_WAIT_TIME = 0;
  private ratePerSecond: number;
  private q: Array<RequestQueueElement<T>>;
  private requestsInExecution: number;

  private exectutorId: any;

  constructor(ratePerSecond: number) {
    this.ratePerSecond = ratePerSecond;
    this.q = [];
    this.exectutorId = null;
    this.requestsInExecution = 0;
  }

  pace(request: Request<T>): Promise<T> {
    let requestResolve: Resolve<T>, requestReject: Reject;
    let result = new Promise<T>((resolve, reject) => {
      requestResolve = resolve;
      requestReject = reject;
    });

    let requestWithExecutionTracker: Request<T> = () => {
      this.requestsInExecution++;
      return request();
    };
    this.q.push({
      request: requestWithExecutionTracker,
      requestResolve,
      requestReject,
    });
    this.scheduleRequests();
    return result;
  }

  private scheduleRequests() {
    if (this.exectutorId == null) {
      // MIN_WAIT_TIME = 0 means immediate or MIN_WAIT_TIME = 50 after 50 millis seconds
      this.exectutorId = setTimeout(() => this.executeAndScheduleNext(), Pacer.MIN_WAIT_TIME);
    }
  }

  private executeAndScheduleNext() {
    this.executeRequests();

    // clear schedule
    clearTimeout(this.exectutorId);
    this.exectutorId = null;

    // next schedule
    if (this.q.length > 0) {
      this.exectutorId = setTimeout(() => this.executeAndScheduleNext(), 1000);
    }
  }

  private executeRequests() {
    let els = this.q.splice(0, Math.min(this.ratePerSecond - this.requestsInExecution, this.q.length));
    for (let el of els) {
      el.request()
        .then(el.requestResolve)
        .catch(el.requestReject)
        .finally(() => this.requestsInExecution--);
    }
  }
}
