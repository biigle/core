<?php

namespace Biigle\Tests;

use Biigle\Announcement;
use Illuminate\Database\QueryException;
use ModelTestCase;

class AnnouncementTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Announcement::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->body);
        $this->assertNotNull($this->model->title);
        $this->assertNull($this->model->show_until);
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

    public function testScopeActive()
    {
        $this->model->show_until = '2022-10-20 16:17:00';
        $this->model->save();
        $this->assertSame(0, Announcement::active()->count());

        $this->model->show_until = now()->addDay();
        $this->model->save();
        $this->assertSame(1, Announcement::active()->count());

        $this->model->show_until = null;
        $this->model->save();
        $this->assertSame(1, Announcement::active()->count());
    }

    public function testGetActive()
    {
        $this->model->show_until = now()->addDay();
        $this->model->save();

        $this->assertSame($this->model->id, Announcement::getActive()->id);

        $this->model->delete();
        $this->assertNull(Announcement::getActive());
    }
}
