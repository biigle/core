<?php

namespace Biigle\Support;

use Illuminate\Queue\Worker;

class PatchedQueueWorker extends Worker
{
    /**
     * Determine if the memory limit has been exceeded.
     *
     * This is a patched version of the original method that determines the used memory
     * more accurately.
     *
     * See: https://github.com/laravel/framework/pull/56019
     *
     * @param  int  $memoryLimit
     * @return bool
     */
    public function memoryExceeded($memoryLimit)
    {
        if ($memoryLimit > 0) {
            $usage = (getrusage()['ru_maxrss'] ?? (memory_get_usage(true) / 1024)) / 1024;

            return $usage >= $memoryLimit;
        }

        return false;
    }
}
