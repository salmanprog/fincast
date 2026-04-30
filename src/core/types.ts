export interface QueryHook<TQuery = Record<string, unknown>, TRequest = Record<string, unknown>> {
  indexQueryHook?(query: TQuery, request?: TRequest): Promise<TQuery>;
  showQueryHook?(query: TQuery, request?: TRequest): Promise<TQuery>;
  // add more hooks if needed
}