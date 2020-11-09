<?php

namespace Biigle\Logging;

use Illuminate\Support\Facades\Redis;
use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\RedisHandler;
use Monolog\Logger;

class CreateRedisLogger
{
    /**
     * Create a custom Monolog instance.
     *
     * @param  array  $config
     * @return \Monolog\Logger
     */
    public function __invoke(array $config)
    {
        $handler = new RedisHandler(Redis::connection()->client(), 'log', Logger::DEBUG, true, 1000);
        $formatter = tap(new JsonFormatter, function ($formatter) {
            $formatter->includeStacktraces();
        });
        $handler->setFormatter($formatter);

        return new Logger(config('app.env'), [$handler]);
    }
}
