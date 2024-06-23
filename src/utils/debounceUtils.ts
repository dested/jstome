export class DebounceUtils {
  static goodDebounceTimer = 16;
  private static debounceCallbacks: {
    [key: string]: {callback: () => void; signal?: AbortController; timeout: any};
  } = {};
  static debounce(key: string, ms: number, callback: () => void, immediate = false): any {
    if (DebounceUtils.debounceCallbacks[key]) {
      if (DebounceUtils.debounceCallbacks[key].signal) {
        DebounceUtils.debounceCallbacks[key].signal!.abort();
      }
      // console.log(key + ' debounce stopped');
      clearTimeout(DebounceUtils.debounceCallbacks[key].timeout);
    }

    // console.log(key + ' debounce started ' + ms);

    DebounceUtils.debounceCallbacks[key] = {
      callback,
      timeout: setTimeout(
        () => {
          // console.log(key + ' debounce called ' + ms);
          try {
            callback();
          } catch (ex) {
            console.error(ex);
          }
          delete DebounceUtils.debounceCallbacks[key];
        },
        immediate ? 0 : ms,
      ),
    };
  }
  static clearDebounce(key: string) {
    if (DebounceUtils.debounceCallbacks[key]) {
      // console.log(key + ' debounce stopped');
      clearTimeout(DebounceUtils.debounceCallbacks[key].timeout);
      delete DebounceUtils.debounceCallbacks[key];
    }
  }
  static hasDebounce(key: string): boolean {
    return !!DebounceUtils.debounceCallbacks[key];
  }

  private static reboundCallbacks: {[key: string]: {timeout: any; callback: () => void}} = {};
  static cancelRebound(key: string): any {
    delete DebounceUtils.reboundCallbacks[key];
  }
  static rebound(
    key: string,
    ms: number,
    callback: () => void,
    immediate: boolean = false,
    dontReset = false,
  ): any {
    if (immediate) {
      try {
        callback();
      } catch (ex) {
        console.error(ex);
      }
      return;
    }

    if (DebounceUtils.reboundCallbacks[key]) {
      if (!dontReset) {
        DebounceUtils.reboundCallbacks[key].callback = callback;
      }
      return;
    }

    DebounceUtils.reboundCallbacks[key] = {
      callback: callback,
      timeout: setTimeout(() => {
        if (DebounceUtils.reboundCallbacks[key]) {
          try {
            DebounceUtils.reboundCallbacks[key].callback();
          } catch (ex) {
            console.error(ex);
          }
          delete DebounceUtils.reboundCallbacks[key];
        }
      }, ms),
    };
  }

  static retryUntil(ms: number, test: () => boolean, callback: () => void, maxTries = 10): any {
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (tries > maxTries) {
        clearInterval(interval);
        return;
      }
      if (!test()) return;

      callback();
      clearInterval(interval);
    }, ms);
  }

  private static ignoreIfReCalledCallbacks: {[key: string]: {timeout: any}} = {};
  static ignoreIfReCalled(key: string, ms: number, callback: () => void) {
    if (DebounceUtils.ignoreIfReCalledCallbacks[key]) {
      return;
    }
    callback();
    DebounceUtils.ignoreIfReCalledCallbacks[key] = {
      timeout: setTimeout(() => {
        delete DebounceUtils.ignoreIfReCalledCallbacks[key];
      }, ms),
    };
  }

  static getAbortSignal(key: string) {
    const controller = new AbortController();
    this.debounceCallbacks[key].signal = controller;
    return controller.signal;
  }

  static forceRebound(key: string) {
    if (DebounceUtils.reboundCallbacks[key]) {
      clearTimeout(DebounceUtils.reboundCallbacks[key].timeout);
      DebounceUtils.reboundCallbacks[key].callback();
      delete DebounceUtils.reboundCallbacks[key];
    }
  }
}
