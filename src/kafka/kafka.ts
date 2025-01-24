import {Kafka} from 'kafkajs'
import env from '../env'

const kafka = new Kafka({
  brokers: [env.KAFKA_BROKER],
  clientId: 'user-service',
})

export default kafka