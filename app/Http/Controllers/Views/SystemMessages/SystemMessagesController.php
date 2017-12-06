<?php

namespace Biigle\Http\Controllers\Views\SystemMessages;

use Biigle\SystemMessage;
use Illuminate\Http\Request;
use Biigle\SystemMessageType;
use Biigle\Http\Controllers\Controller;

class SystemMessagesController extends Controller
{
    /**
     * Shows the system message list.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $this->validate($request, [
            'type' => 'exists:system_message_types,id',
        ]);

        $type = $request->input('type');

        $messages = SystemMessage::published()
            ->select('id', 'title', 'type_id', 'published_at')
            ->with('type')
            ->when($type, function ($query) use ($type) {
                return $query->where('type_id', $type);
            })
            ->orderBy('published_at', 'desc')
            ->paginate(10);

        $messages->appends('type', $type);

        $typeClasses = [
            SystemMessageType::$important->id => 'warning',
            SystemMessageType::$update->id => 'success',
            SystemMessageType::$info->id => 'info',
        ];

        $types = [
            SystemMessageType::$important,
            SystemMessageType::$update,
            SystemMessageType::$info,
        ];

        return view('system-messages.index', [
            'messages' => $messages,
            'typeClasses' => $typeClasses,
            'type' => $type,
            'types' => $types,
        ]);
    }

    /**
     * Show a system message.
     * @param  int $id System message ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $message = SystemMessage::published()
            ->with('type')
            ->findOrFail($id);

        $typeClasses = [
            SystemMessageType::$important->id => 'warning',
            SystemMessageType::$update->id => 'success',
            SystemMessageType::$info->id => 'info',
        ];

        return view('system-messages.show', [
            'message' => $message,
            'typeClasses' => $typeClasses,
        ]);
    }
}
