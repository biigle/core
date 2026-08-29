<?php

namespace Biigle\Tests\Policies;

use Biigle\Policies\LabelTreePolicy;
use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Cache;
use Mockery;
use TestCase;

class CachedPolicyTest extends TestCase
{
    public function testCache()
    {
        $policy = new LabelTreePolicy;
        $user = UserTest::create();
        $tree = LabelTreeTest::create();

        $this->assertFalse($policy->createLabel($user, $tree));
        $tree->addMember($user, Role::editor());
        // STILL false because cache is used
        $this->assertFalse($policy->createLabel($user, $tree));
        Cache::store('array')->flush();
        $this->assertTrue($policy->createLabel($user, $tree));
    }

    public function testRemember()
    {
        $callback = fn () => 'abc';
        $store = Mockery::mock(\Illuminate\Cache\ArrayStore::class);
        $store->shouldReceive('remember')
            ->once()
            ->with('my key', LabelTreePolicy::TIME, $callback)
            ->andReturn(true);

        Cache::shouldReceive('store')->andReturn($store);

        $policy = new LabelTreePolicy;
        $policy->remember('my key', $callback);
    }
}
