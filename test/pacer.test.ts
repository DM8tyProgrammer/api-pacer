import { Pacer } from "../src/pacer/Pacer";

describe("pacer-test", () => {
  test("execution-test", async () => {
    let pacer = new Pacer<number>(50);

    let ps: Array<Promise<number>> = [];
    for (let i = 0; i < 100; i++) {
      let ref = pacer.pace(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(i);
            }, Math.random() * 300 + 10);
          })
      );
      ps.push(ref);
    }

    let response = await Promise.all(ps);

    expect(response).toHaveLength(100);
  });
});
