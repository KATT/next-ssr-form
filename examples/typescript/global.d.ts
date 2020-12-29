export type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export type FunctionThenArg<T> = ThenArg<ReturnType<T>>;
