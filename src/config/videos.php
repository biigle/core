<?php

return [

    /*
    | Directory where temporary files should be stored.
    */
    'tmp_dir' => env('VIDEOS_TMP_DIR', sys_get_temp_dir()),

    /*
    | Path to the Python executable.
    */
    'python' => '/usr/bin/python',

    /*
    | Path to the object tracking script.
    */
    'object_tracker_script' => __DIR__.'/../resources/scripts/ObjectTracker.py',

    /*
    | Distance in seconds between two keyframes determined by the object tracking method.
    */
    'keyframe_distance' => 1.0,

];
