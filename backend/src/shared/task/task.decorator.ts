import 'reflect-metadata';

const TASK_METADATA = Symbol('TASK_METADATA');

type Validator = (obj: any) => void;
export type TaskMetadata = {
  methodName: string;
  validator?: Validator;
};

export function QueueTask(
  taskName: string,
  validator?: Validator,
): MethodDecorator {
  return (target, propertyKey) => {
    const handlers =
      Reflect.getMetadata(TASK_METADATA, target.constructor) || {};
    handlers[taskName] = {
      methodName: propertyKey as string,
      validator: validator,
    } satisfies TaskMetadata;

    Reflect.defineMetadata(TASK_METADATA, handlers, target.constructor);
  };
}

export function getTaskHandlers(target: any) {
  return Reflect.getMetadata(TASK_METADATA, target.constructor) || {};
}
