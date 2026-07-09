export const $pgState = Symbol('pgState');

export type WithState<P> = {
  [$pgState]?: P;
};

export function setPgState<T extends WithState<P>, P>(
  entity: T,
  state: P | undefined,
): T {
  entity[$pgState] = state;
  return entity;
}

export function isPersist<P>(entity: WithState<P>): boolean {
  return !!entity[$pgState];
}

export function getPgState<P>(entity: WithState<P>): P | undefined {
  return entity[$pgState];
}
