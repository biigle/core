<?php

namespace Biigle;

use Biigle\Traits\EnumSerialization;
use Illuminate\Support\Collection;
use ValueError;

enum Shape: int implements \JsonSerializable
{
    use EnumSerialization;

    case POINT = 1;
    case LINE = 2;
    case POLYGON = 3;
    case CIRCLE = 4;
    case RECTANGLE = 5;
    case ELLIPSE = 6;
    case WHOLE_FRAME = 7;

    public static function point(): self
    {
        return self::POINT;
    }

    public static function line(): self
    {
        return self::LINE;
    }

    public static function polygon(): self
    {
        return self::POLYGON;
    }

    public static function circle(): self
    {
        return self::CIRCLE;
    }

    public static function rectangle(): self
    {
        return self::RECTANGLE;
    }

    public static function ellipse(): self
    {
        return self::ELLIPSE;
    }

    public static function wholeFrame(): self
    {
        return self::WHOLE_FRAME;
    }

    public function label(): string
    {
        return match ($this) {
            self::POINT => 'Point',
            self::LINE => 'LineString',
            self::POLYGON => 'Polygon',
            self::CIRCLE => 'Circle',
            self::RECTANGLE => 'Rectangle',
            self::ELLIPSE => 'Ellipse',
            self::WHOLE_FRAME => 'WholeFrame',
        };
    }

    public static function fromLabel(string $label)
    {
        return match (strtoupper($label)) {
            self::POINT->name => self::POINT,
            self::LINE->name => self::LINE,
            self::POLYGON->name => self::POLYGON,
            self::CIRCLE->name => self::CIRCLE,
            self::RECTANGLE->name => self::RECTANGLE,
            self::ELLIPSE->name => self::ELLIPSE,
            "WHOLEFRAME" => self::WHOLE_FRAME,
            default => throw new ValueError("Invalid shape label $label")
        };
    }

    /**
     * Helper to imitate the original ->pluck('name', 'id') behaviour
     */
    public static function pluckById(?self $except = null): Collection
    {
        $collection = collect(self::cases())
            ->mapWithKeys(fn (self $shape) => [$shape->value => $shape->label()]);
        if ($except !== null) {
            $collection->forget($except->value);
        }
        return $collection;
    }
}
