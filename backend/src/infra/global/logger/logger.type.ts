export type TraceLog = {
  traceId: string;
  requestTime: string;
  message: string;
  data?: any;
};

export type ErrorLog = {
  message: string;
  stack: string;
};
