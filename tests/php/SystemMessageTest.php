<?php

namespace Biigle\Tests;

use Mockery;
use Biigle\User;
use Notification;
use ModelTestCase;
use Biigle\SystemMessage;
use Illuminate\Database\QueryException;
use Biigle\Notifications\NewSystemMessageNotification;

class SystemMessageTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = SystemMessage::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->body);
        $this->assertNotNull($this->model->title);
        $this->assertNotNull($this->model->type);
    }

    public function testTitleRequired()
    {
        $this->model->title = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testBodyRequired()
    {
        $this->model->body = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testPublish()
    {
        UserTest::create();
        UserTest::create();

        $this->assertNull($this->model->published_at);
        Notification::shouldReceive('send')
            ->once()
            ->with(Mockery::on(function ($users) {
                // should be all users
                return User::all()->diff($users)->count() === 0;
            }), Mockery::type(NewSystemMessageNotification::class));
        $this->model->publish();
        // Already published messages aren't published again.
        $this->model->publish();
    }

    public function testIsPublished()
    {
        $this->assertFalse($this->model->isPublished());
        $this->model->publish();
        $this->asserttrue($this->model->isPublished());
    }

    public function testPublishedScope()
    {
        $unpublished = static::create();
        $this->model->publish();

        $messages = SystemMessage::published()->pluck('id');
        $this->assertEquals([$this->model->id], $messages->toArray());
    }
}
