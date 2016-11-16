<?php

return [

    /*
    | Directory where the annotation patch images will be stored
    */
    'patch_storage' => storage_path('ate_patches'),

    /*
    | Image file format for the annotation patch images.
    | Must be supported by Python matplotlib.image.imsave.
    */
    'patch_format' => 'jpg',

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
    | PHP memory limit to use during processing of the images. After processing, the
    | default memory limit will be used.
    */
    'memory_limit' => '512M',

    /*
    | When ATE patches are generated, the source image is cached. This saves the encoding
    | process when the next patch of the same image is be generated and most importantly | it saves costly HTTP requests if the image comes from a remote source.
    |
    | This is the time in minutes that an image should be cached. Default is 1 hour.
    */
    'imagecache_lifetime' => 60,
];
