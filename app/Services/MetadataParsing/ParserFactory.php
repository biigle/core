<?php

namespace Biigle\Services\MetadataParsing;

use SplFileInfo;

class ParserFactory
{
    public static array $parsers = [
        'image' => [
            ImageCsvParser::class,
        ],
        'video' => [
            VideoCsvParser::class,
        ],
    ];

    public static function getParserForFile(SplFileInfo $file, string $type): ?MetadataParser
    {
        $parsers = self::$parsers[$type] ?? [];
        foreach ($parsers as $parserClass) {
            $parser = new $parserClass($file);
            if ($parser->recognizesFile()) {
                return $parser;
            }
        }

        return null;
    }
}
