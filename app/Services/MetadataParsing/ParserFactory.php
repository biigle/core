<?php

namespace Biigle\Services\MetadataParsing;

use SplFileInfo;
use Exception;

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

    /**
     * Get the first parser that recognizes the file.
     */
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

    /**
     * Add a new metadata parser to the list of known parsers.
     */
    public static function extend(string $parserClass, string $type): void
    {
        if (!in_array(MetadataParser::class, class_parents($parserClass))) {
            throw new Exception("A metadata parser must extend ".MetadataParser::class);
        }

        self::$parsers[$type][] = $parserClass;
    }
}
