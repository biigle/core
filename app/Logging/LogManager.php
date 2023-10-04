<?php

namespace Biigle\Logging;

use Carbon\Carbon;
use File;
use Illuminate\Log\ParsesLogConfiguration;
use Illuminate\Support\Facades\Redis;
use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\RedisHandler;
use Monolog\Logger;

class LogManager
{
    use ParsesLogConfiguration;

    /**
     * Available log levels.
     *
     * @var array
     */
    const LEVELS = [
        'debug',
        'info',
        'notice',
        'warning',
        'error',
        'critical',
        'emergency',
    ];

    /**
     * The default logging channel.
     *
     * @var array
     */
    protected $channel;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $defaultChannel = config('logging.default');
        $this->channel = config("logging.channels.{$defaultChannel}");
    }

    /**
     * Determine whether logs are written to files.
     *
     * @return boolean
     */
    public function isFile()
    {
        return in_array($this->channel['driver'], ['single', 'daily']);
    }

    /**
     * Get the filenames of the logfiles.
     *
     * @return array
     */
    public function getLogFilenames()
    {
        $path = File::dirname($this->channel['path']);

        $logs = File::glob("{$path}/*.log");

        return array_map(function ($path) {
            return File::name($path);
        }, $logs);
    }

    /**
     * Get the content of a logfile.
     *
     * @param string $filename
     *
     * @return string
     */
    public function getLogFileContent($filename)
    {
        $path = File::dirname($this->channel['path']);

        return File::get("{$path}/{$filename}.log");
    }

    /**
     * Determine whether logs are written to files.
     *
     * @return boolean
     */
    public function isRedis()
    {
        return $this->channel['driver'] === 'custom' &&
            $this->channel['via'] === CreateRedisLogger::class;
    }

    /**
     * Get the log messages.
     *
     * @param string $level Minimum log level.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getRedisLogMessages($level = 'debug')
    {
        $level = $this->level(compact('level'));
        $connection = $this->channel['connection'] ?? null;
        $client = Redis::connection($connection)->client();

        return collect($client->lrange('log', 0, -1))
            ->map(function ($message) {
                return json_decode($message, true);
            })
            ->filter(function ($message) use ($level) {
                return $message['level'] >= $level;
            });
    }

    /**
     * Get the number of log messages of the last day(s).
     *
     * @param string $level Minimum log level.
     * @param integer $subDays Number of days to go back.
     *
     * @return int
     */
    public function getRecentCount($level = 'debug', $subDays = 1)
    {
        $days = [];
        for ($i = 0; $i <= $subDays; $i++) {
            $days[] = Carbon::now()->subDays($i)->toDateString();
        }

        if ($this->isFile()) {
            $filenames = $this->getLogFilenames();

            return array_reduce($filenames, function ($carry, $filename) use ($days) {
                $content = $this->getLogFileContent($filename);

                return array_reduce($days, function ($carry, $day) use ($content) {
                    return $carry + substr_count($content, "[{$day}");
                }, $carry);
            }, 0);
        } elseif ($this->isRedis()) {
            return $this->getRedisLogMessages($level)
                ->reduce(function ($carry, $message) use ($days) {
                    return array_reduce($days, function ($carry, $day) use ($message) {
                        // There are two possible formats in which the time can be
                        // stored.
                        if (is_array($message['datetime'])) {
                            return $carry + substr_count($message['datetime']['date'], $day);
                        }

                        return $carry + substr_count($message['datetime'], "{$day}T");
                    }, $carry);
                }, 0);
        }

        return 0;
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
