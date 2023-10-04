<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreAnnouncement;
use Biigle\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Creates a new announcement.
     *
     * @api {post} announcements Create a new announcement
     * @apiGroup Announcements
     * @apiName StoreAnnouncements
     * @apiPermission admin
     *
     * @apiParam (Required parameters) {String} title Title of the announcement
     * @apiParam (Required parameters) {String} body The body text of the announcement. May be formatted with HTML.
     *
     * @apiParam (Optional parameters) {Number} show_until Date and time until the announcement should be shown. Only one announcement can be shown at a time. If not specified, the announcement will be shown indefinitely.
     *
     * @param StoreAnnouncement $request
     * @return Announcement
     */
    public function store(StoreAnnouncement $request)
    {
        $announcement = Announcement::create($request->validated());

        if ($this->isAutomatedRequest()) {
            return $announcement;
        }

        return $this->fuzzyRedirect('admin-announcements')
            ->with('message', 'Announcement created.')
            ->with('messageType', 'success');
    }

    /**
     * Delete an announcement.
     *
     * @api {delete} announcements/:id Delete an announcement
     * @apiGroup Announcements
     * @apiName DestroyAnnouncements
     * @apiPermission admin
     *
     * @apiParam {Number} id The announcement ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $this->authorize('destroy', $announcement);
        $announcement->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('message', 'Announcement deleted.')
                ->with('messageType', 'success');
        }
    }
}
