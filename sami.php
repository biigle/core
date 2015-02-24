<?php

require __DIR__.'/vendor/autoload.php';

use Sami\Sami;
use Symfony\Component\Finder\Finder;
use Sami\Parser\Filter\TrueFilter;

$iterator = Finder::create()
	->files()
	->name('*.php')
	->exclude('stubs')
	->in(__DIR__.'/app');

$sami = new Sami($iterator, array(
	'title' => 'DIAS DOC',
	'build_dir' => __DIR__.'/doc/server/build/%version%',
	'cache_dir' => __DIR__.'/doc/server/cache/%version%',
));

// include private and protected properties
$sami['filter'] = function() {
    return new TrueFilter();
};

return $sami;