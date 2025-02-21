<span id="announcement" class="announcement">
    <popover announcement-id="{{$announcement->id}}" v-on:hide="handleHide" placement="bottom">
        <button class="btn btn-warning btn-sm">
            <i class="fa fa-bullhorn"></i>
            <span v-cloak v-if="expand" class="announcement-text">
                {{$announcement->title}}
            </span>
        </button>
        <template #popover>
            <div class="text-warning">
                {!! $announcement->body !!}
            </div>
        </template>
    </popover>
</span>
