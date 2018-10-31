<?php

return [

    /*
    | Accept and process jobs sent to this application instance.
    */

    'listen' => true,

    /*
    | Use this queue connection to process received jobs.
    | If `null`, the default connection is used.
    */

    'connection' => env('REMOTE_QUEUE_CONNECTION', null),

];
