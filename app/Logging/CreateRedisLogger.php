<?php

namespace Biigle\Logging;

use Monolog\Logger;
use Monolog\Handler\RedisHandler;
use Monolog\Formatter\JsonFormatter;
use Illuminate\Support\Facades\Redis;

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
