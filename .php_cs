<?php

$finder = PhpCsFixer\Finder::create()
    ->files()
    ->in([__DIR__.'/app', __DIR__.'/tests', __DIR__.'/config', __DIR__.'/database', __DIR__.'/vendor/biigle'])
    ->name('*.php')
    ->ignoreDotFiles(true)
    ->ignoreVCS(true);

return PhpCsFixer\Config::create()
    ->setFinder($finder)
    ->setUsingCache(true);
