<?php

namespace Biigle\Modules\Export\Support;

/**
 * Tiny wrapper class for the exec function
 */
class Exec
{
    /**
     * Array of output lines of the exec call.
     *
     * @var array
     */
    public $lines;

    /**
     * Exit code of the exec call.
     *
     * @var int
     */
    public $code;

    /**
     * Create and execute the exec command.
     *
     * @param string $command Command to execute.
     */
    public function __construct($command)
    {
        $this->lines = [];
        $this->code = 0;
        exec($command, $this->lines, $this->code);
    }
}
