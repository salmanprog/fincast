export default abstract class BaseResource<TRecord extends object> {
  abstract toArray(record: TRecord): Promise<Record<string, unknown>>;

  async collection(records: TRecord[]): Promise<Record<string, unknown>[]> {
    if (!Array.isArray(records)) return [];
    const results = await Promise.all(records.map((r) => this.toArray(r)));
    return results;
  }
}
