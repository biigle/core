<?php

namespace Biigle\Services\MetadataParsing;

use Symfony\Component\HttpFoundation\File\File;

class ParserFactory
{
    public static array $parsers = [
        ImageCsvParser::class,
    ];

    public static function getParserForFile(File $file): ?MetadataParser
    {
        foreach (self::$parsers as $parserClass) {
            $parser = new $parserClass($file);
            if ($parser->recognizesFile()) {
                return $parser;
            }
        }

        return null;
    }
}
