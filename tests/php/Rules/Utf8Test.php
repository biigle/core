<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\Utf8;
use TestCase;

class Utf8Test extends TestCase
{
    private function passes($value): bool
    {
        return (new Utf8)->passes('attr', $value);
    }

    public function testValid()
    {
        $this->assertTrue($this->passes(''));
        $this->assertTrue($this->passes('jack'));
        $this->assertTrue($this->passes('Jürgen Ørsted 日本 😀'));
    }

    public function testInvalidByteSequence()
    {
        // Overlong encoding.
        $this->assertFalse($this->passes("jack\xc0\xa7"));
        // Lone continuation byte.
        $this->assertFalse($this->passes("jack\x80"));
        // Truncated multibyte sequence.
        $this->assertFalse($this->passes("jack\xe2\x82"));
        // UTF-16 surrogate.
        $this->assertFalse($this->passes("jack\xed\xa0\x80"));
    }

    public function testNulByte()
    {
        $this->assertFalse($this->passes("\0"));
        $this->assertFalse($this->passes("ja\0ck"));
    }

    public function testNoString()
    {
        // The type is checked by the separate 'string' rule of the form requests, so
        // this rule accepts anything that is no string.
        $this->assertTrue($this->passes(null));
        $this->assertTrue($this->passes(123));
        $this->assertTrue($this->passes(["jack\xc0\xa7"]));
    }
}
