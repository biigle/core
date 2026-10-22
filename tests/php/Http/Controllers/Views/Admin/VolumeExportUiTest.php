<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use ApiTestCase;

class VolumeExportUiTest extends ApiTestCase
{
    public function testVolumeExportForm()
    {
        $this->beGlobalAdmin();

        $this->get('admin/export')
            ->assertStatus(200)
            ->assertSee('v-model="volumeExportDescription"', false)
            ->assertSee('maxlength="255"', false)
            ->assertSee('v-on:click.prevent="requestVolumeExport"', false)
            ->assertSee('v-bind:disabled="(loading || hasNoChosenVolumes) || null"', false)
            ->assertSee('v-on:click.prevent="requestLabelTreeExport"', false)
            ->assertSee('v-on:click.prevent="requestUserExport"', false)
            ->assertDontSee('An export file contains user password hashes');
    }
}
