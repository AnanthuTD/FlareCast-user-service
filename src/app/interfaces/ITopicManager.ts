export interface ITopicManager {
  createTopics(topics: string[]): Promise<void>;
}