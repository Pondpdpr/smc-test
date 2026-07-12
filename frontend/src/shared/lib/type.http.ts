// Kept name-for-name (including the "IStandardErrorResonse" typo) as a
// direct cross-reference against the backend DTOs, not a reinterpretation.
export type IStandardResponse<D extends Record<string, any> = object | object[]> = {
  success: boolean;
  key: string;
  data: D;
};

export type IStandardResponseWithMeta<
  D extends Record<string, any> = object | object[],
  M extends Record<string, any> = object,
> = IStandardResponse<D> & {
  meta: M;
};

export type IStandardErrorResonse = {
  success: boolean;
  key: string;
  error?: {
    fields: Record<string, any>;
    context: Record<string, any>;
    details: any;
  };
};

export type IResponse<T> = {
  attributes: T;
};

export type IResponseRelations<T, R> = {
  attributes: T;
  relations: R;
};
