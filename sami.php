<?php

use Sami\Sami;
use Sami\Parser\Filter\TrueFilter;
use Symfony\Component\Finder\Finder;

$iterator = Finder::create()
	->files()
	->name('*.php')
	->exclude('stubs')
	->in(__DIR__.'/app');

$sami = new Sami($iterator, array(
	'title' => 'BIIGLE DIAS Server Documentation',
	'build_dir' => __DIR__.'/public/doc/server/',
	'cache_dir' => __DIR__.'/tmp/sami/%version%',
));

// include private and protected properties
$sami['filter'] = function() {
    return new TrueFilter();
};

return $sami;
