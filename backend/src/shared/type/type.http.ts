export type FieldsErrorKey = 'exists';

export type IPagination = {
  page: number;
  nextPage: number;
  previousPage: number;
  perPage: number;
  totalItems: number;
  currentPageItems: number;
  totalPages: number;
};

export type ICursor = {
  page: number;
  nextCursor: string;
};

export type IStandardResponse<
  D extends Record<string, any> = object | object[],
> = {
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
