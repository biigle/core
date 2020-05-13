<?php

namespace Biigle\Logging;

use File;
use Carbon\Carbon;
use Monolog\Logger;
use Monolog\Handler\RedisHandler;
use Monolog\Formatter\JsonFormatter;
use Illuminate\Support\Facades\Redis;

class LogManager
{
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
     * @return array
     */
    public function getRedisLogMessages()
    {
        return Redis::lrange('log', 0, -1);
    }

    /**
     * Get the number of log messages of the last day(s).
     *
     * @param integer $subDays Number of days to go back.
     *
     * @return int
     */
    public function getRecentCount($subDays = 1)
    {
        $days = [];
        for ($i = 0; $i <= $subDays; $i++) {
            $days[] = Carbon::now()->subDays($i)->toDateString();
        }

        if ($this->isFile()) {
            $filenames = $this->getLogFilenames();

            return array_reduce($filenames, function ($carry, $filename) use ($days) {
                $content = $this->getLogFileContent($filename);

                return array_reduce($days, function ($carry, $day) use  ($content) {
                    return $carry + substr_count($content, "[{$day}");
                }, $carry);
            }, 0);
        } elseif ($this->isRedis()) {
            $messages = $this->getRedisLogMessages();

            return array_reduce($messages, function ($carry, $message) use ($days) {
                return array_reduce($days, function ($carry, $day) use  ($message) {
                    // There are two possible formates in which the time can be stored.
                    return $carry + substr_count($message, "\"datetime\":\"{$day}T") + substr_count($message, "\"datetime\":{\"date\":\"{$day}");
                }, $carry);
            }, 0);
        }

        return 0;
    }
}
