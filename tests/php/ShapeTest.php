<?php

namespace Biigle\Tests;

use Biigle\Shape;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ValueError;

class ShapeTest extends TestCase
{
    #[DataProvider('shapeProvider')]
    public function testFromLabel(Shape $shape): void
    {
        $this->assertSame($shape, Shape::fromLabel($shape->label()));
    }

    public static function shapeProvider(): array
    {
        return array_map(
            fn (Shape $shape) => [$shape],
            Shape::cases()
        );
    }

    public function testFromLabelInvalid(): void
    {
        $this->expectException(ValueError::class);
        Shape::fromLabel('whatever');
    }
}
