<?php

use Sami\Sami;
use Sami\Parser\Filter\TrueFilter;
use Symfony\Component\Finder\Finder;

// Fix for PHP 7.4 compatibility.
// See: https://github.com/dompdf/dompdf/issues/2003#issuecomment-561264764
error_reporting(E_ALL ^ E_DEPRECATED);

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
