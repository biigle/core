<?php

require __DIR__.'/vendor/autoload.php';

use Sami\Sami;
use Symfony\Component\Finder\Finder;

$iterator = Finder::create()
	->files()
	->name('*.php')
	->exclude('stubs')
	->in(__DIR__.'/app');

return new Sami($iterator, array(
	'title' => 'DIAS DOC',
	'build_dir' => __DIR__.'/doc/build/%version%',
	'cache_dir' => __DIR__.'/doc/cache/%version%',
));