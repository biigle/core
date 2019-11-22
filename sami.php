<?php

use Sami\Sami;
use Sami\Parser\Filter\TrueFilter;
use Symfony\Component\Finder\Finder;

$iterator = Finder::create()
    ->files()
    ->name('*.php')
    ->exclude([
        'stubs',
        'database',
        'public',
        'config',
        'resources',
    ])
    ->in([
        __DIR__.'/app',
        __DIR__.'/vendor/biigle/*/src',
    ]);

$sami = new Sami($iterator, array(
    'title' => 'BIIGLE Server Documentation',
    'build_dir' => __DIR__.'/public/doc/server/',
    'cache_dir' => sys_get_temp_dir().'/biigle_sami_%version%',
));

// include private and protected properties
$sami['filter'] = function() {
    return new TrueFilter();
};

return $sami;
