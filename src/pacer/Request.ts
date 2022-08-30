export interface Request<T> {
  (): Promise<T>;
}
