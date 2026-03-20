export class ConnectorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorConfigError";
  }
}

export class ConnectorAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorAuthError";
  }
}
