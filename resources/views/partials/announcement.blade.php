<span v-cloak id="announcement" class="announcement">
    <popover announcement-id="{{$announcement->id}}" v-on:show="handleShow" v-on:hide="handleHide" placement="bottom">
        <button class="btn btn-warning btn-sm" title="Show announcement">
            <i class="fa fa-bullhorn"></i>
            <span v-if="expand" class="announcement-text">
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
