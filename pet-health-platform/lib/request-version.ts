export function createRequestVersion() {
  let version = 0;

  return {
    next() {
      version += 1;
      return version;
    },
    isCurrent(requestVersion: number) {
      return requestVersion === version;
    },
    invalidate() {
      version += 1;
    },
  };
}
