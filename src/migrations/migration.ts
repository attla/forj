export abstract class Migration {
  static async run(): Promise<void> {
    throw new Error('Method run() must be implemented in migration class')
  }
}
