<?php

namespace Biigle;

use Override;

enum Shape: int implements \JsonSerializable
{
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

    public static function pointId(): int
    {
        return self::POINT->value;
    }

    public static function lineId(): int
    {
        return self::LINE->value;
    }

    public static function polygonId(): int
    {
        return self::POLYGON->value;
    }

    public static function circleId(): int
    {
        return self::CIRCLE->value;
    }

    public static function rectangleId(): int
    {
        return self::RECTANGLE->value;
    }

    public static function ellipseId(): int
    {
        return self::ELLIPSE->value;
    }

    public static function wholeFrameId(): int
    {
        return self::WHOLE_FRAME->value;
    }

    public function label(): string
    {
        return match($this) {
            self::POINT => 'Point',
            self::LINE => 'LineString',
            self::POLYGON => 'Polygon',
            self::CIRCLE => 'Circle',
            self::RECTANGLE => 'Rectangle',
            self::ELLIPSE => 'Ellipse',
            self::WHOLE_FRAME => 'WholeFrame',
        };
    }

    public function toArray(): array
    {
        return [
            'id' => $this->value,
            'name' => $this->label(),
        ];
    }

    #[Override]
    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }
}