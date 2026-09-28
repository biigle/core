<?php

use Biigle\MediaType;
use PHPUnit\Framework\Attributes\DataProvider;

class MediaTypeTest extends TestCase
{
    #[DataProvider('valueOrLabelProvider')]
    public function testTryFromValueOrLabel(mixed $key, ?MediaType $expected): void
    {
        $this->assertSame($expected, MediaType::tryFromValueOrLabel($key));
    }

    public static function valueOrLabelProvider(): array
    {
        return [
            'image int' => [1, MediaType::IMAGE],
            'video int' => [2, MediaType::VIDEO],
            'image string int' => ['1', MediaType::IMAGE],
            'video string int' => ['2', MediaType::VIDEO],
            'image label lower' => ['image', MediaType::IMAGE],
            'video label lower' => ['video', MediaType::VIDEO],
            'image label upper' => ['IMAGE', MediaType::IMAGE],
            'video label mixed' => ['ViDeO', MediaType::VIDEO],
            'invalid string' => ['whatever', null],
            'invalid int' => [999, null],
            'null' => [null, null],
            'wrong type (array)' => [[], null],
        ];
    }
}
