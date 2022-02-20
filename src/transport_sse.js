export function SseTransportSupported() {
  return typeof EventSource !== 'undefined';
}

export class SseTransport {
  constructor(endpoint, options) {
    this.endpoint = endpoint;
    this.options = options;
    this._open = false;
    this._protocol = 'json';
    this._transport = null;
    this._onClose = null;
  }

  name() {
    return 'sse';
  }

  subName() {
    return 'sse';
  }

  isOpen() {
    return this._open;
  }

  emulation() {
    return true;
  }

  initialize(_protocol, callbacks, encodedConnectCommand) {
    let url = new URL(this.endpoint);
    url.searchParams.append('cf_connect', encodedConnectCommand);

    const eventSource = new EventSource(url);
    this._transport = eventSource;

    const self = this;

    eventSource.onopen = function (e) {
      self._open = true;
      callbacks.onOpen();
    };

    eventSource.onerror = function (e) {
      self._open = false;
      eventSource.close();
      callbacks.onError(e);
      callbacks.onClose({
        code: 4,
        reason: 'connection closed'
      });
    };

    eventSource.onmessage = function (e) {
      callbacks.onMessage(e.data);
    };

    self._onClose = function () {
      callbacks.onClose({
        code: 4,
        reason: 'connection closed'
      });
    };
  }

  close() {
    this._open = false;
    this._transport.close();
    if (this._onClose !== null) {
      this._onClose();
    }
  }

  send(data, session, node) {
    const req = {
      session: session,
      node: node,
      data: data
    };
    const headers = new Headers({
      'content-type': 'application/json'
    });
    const body = JSON.stringify(req);

    fetch(this.options.emulationEndpoint, {
      method: 'POST',
      headers: headers,
      mode: this.options.emulationRequestMode,
      body: body
    });
  }
}