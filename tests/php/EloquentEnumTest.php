<?php

use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EloquentEnumTest extends TestCase
{
    public function testFindOrFail(): void
    {
        $this->assertSame(TestEnum::ONE, TestEnum::findOrFail(1));
        $this->assertSame(TestEnum::TWO, TestEnum::findOrFail('2'));
    }

    public function testFindOrFailInvalid(): void
    {
        $this->expectException(HttpException::class);
        TestEnum::findOrFail(999);
    }

    public function testPluckById(): void
    {
        $this->assertInstanceOf(Collection::class, TestEnum::pluckById());
        $this->assertSame([
            1 => 'one',
            2 => 'two',
        ], TestEnum::pluckById()->toArray());
    }

    public function testPluckByIdExcept(): void
    {
        $this->assertSame([
            2 => 'two',
        ], TestEnum::pluckById(except: TestEnum::ONE)->toArray());
    }
}