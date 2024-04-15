<?php

namespace Biigle\Services\MetadataParsing;

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
     * Check if the metadata parser exists for the given type.
     */
    public static function has(string $type, string $class): bool
    {
        return in_array($class, static::$parsers[$type] ?? []);
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
