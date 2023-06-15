<?php

return [

    /*
    | Directory where temporary files should be stored.
    */
    'tmp_dir' => env('VIDEOS_TMP_DIR', sys_get_temp_dir()),

    /*
    | Path to the Python executable.
    */
    'python' => '/usr/bin/python3',

    /*
    | Path to the object tracking script.
    */
    'object_tracker_script' => __DIR__.'/../resources/scripts/ObjectTracker.py',

    /*
    | Distance in pixels between the annotation center positions or circle radii of two
    | consecutive keyframes determined by the object tracking method. If the annotations
    | differ by more than this distance, a new keyframe will be created.
    */
    'keyframe_distance' => 5,

    /*
    | Padding in pixels of a point when it is converted to an initial window for object
    | tracking. The window is twice the padding in width and height.
    */
    'tracking_point_padding' => 25,

    /*
    | Number of sample thumbnails to generate for a video.
    */
    'thumbnail_count' => 10,

    /*
    | Storage disk to store video thumbnails to.
    */
    'thumbnail_storage_disk' => env('VIDEOS_THUMBNAIL_STORAGE_DISK', 'video-thumbs'),

    /*
     | Specifies which queue should be used for which job.
     */
    'process_new_video_queue' => env('VIDEOS_PROCESS_NEW_VIDEO_QUEUE', 'default'),
    'track_object_queue' => env('VIDEOS_TRACK_OBJECT_QUEUE', 'high'),

    /*
     | Specifies the maximum number of running object tracking jobs per user. If the user
     | requests more jobs, the requests will be rejected.
     */
    'track_object_max_jobs_per_user' => env('VIDEOS_TRACK_OBJECT_MAX_JOBS_PER_USER', 10),

];
