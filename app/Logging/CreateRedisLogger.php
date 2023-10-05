<?php

namespace Biigle\Logging;

use Illuminate\Log\ParsesLogConfiguration;
use Illuminate\Support\Facades\Redis;
use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\RedisHandler;
use Monolog\Logger;

class CreateRedisLogger
{
    use ParsesLogConfiguration;

    /**
     * Create a custom Monolog instance.
     *
     * @param  array  $config
     * @return \Monolog\Logger
     */
    public function __invoke(array $config)
    {
        $connection = $config['connection'] ?? null;
        $capSize = $config['capSize'] ?? 1000;
        $level = $this->level($config);

        $client = Redis::connection($connection)->client();
        $handler = new RedisHandler($client, 'log', $level, true, $capSize);
        $formatter = tap(new JsonFormatter, function ($formatter) {
            $formatter->includeStacktraces();
        });
        $handler->setFormatter($formatter);

        return new Logger($this->parseChannel($config), [$handler]);
    }

    /**
     * Get fallback log channel name.
     *
     * @return string
     */
    protected function getFallbackChannelName()
    {
        return config('app.env');
    }
}
