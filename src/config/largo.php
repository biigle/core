<?php

return [

    /*
    | Storage disk where the annotation patch images will be stored
    */
    'patch_storage_disk' => env('LARGO_PATCH_STORAGE_DISK'),

    /*
    | Image file format for the annotation patch images.
    | Must be supported by Python matplotlib.image.imsave.
    */
    'patch_format' => 'jpg',

    /*
    | Annotation shape file format
    */
    'annotation_format' => 'svg',

    /*
    | Padding to add to each patch in x and y direction (in px).
    */
    'patch_padding' => 10,

    /*
    | Padding to add around a point annotation (in addition to the patch padding) in px.
    */
    'point_padding' => 64,

    /*
    | Time in Seconds to delay generating a new annotation patch.
    | This saves resources for annotations that are quickly removed again.
    */
    'patch_generation_delay' => 10,

    /*
     | Specifies which queue should be used for which job.
     */
    'generate_annotation_patch_queue' => env('LARGO_GENERATE_ANNOTATION_PATCH_QUEUE', 'default'),
    'remove_annotation_patches_queue' => env('LARGO_REMOVE_ANNOTATION_PATCHES_QUEUE', 'default'),

    /*
     | Specifies which queue should be used for the job to save a Largo session.
     */
    'apply_session_queue' => env('LARGO_APPLY_SESSION_QUEUE', 'default'),
];
