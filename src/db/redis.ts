import * as redis from 'redis';
import config from '../config';

export default typeof process.env.REDIS_URL === "string"
? redis.createClient(process.env.REDIS_URL)
: redis.createClient(
	config.redis.port,
	config.redis.host,
	{
		password: config.redis.pass,
		prefix: config.redis.prefix,
		db: config.redis.db || 0
	}
);
