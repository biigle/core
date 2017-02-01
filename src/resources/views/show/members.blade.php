@can('update', $project)
    <members-panel id="projects-members" :members="members" :roles="roles" :default-role="defaultRole" :own-id="userId" :loading="loading" v-on:attach="attachMember" v-on:update="updateMember" v-on:remove="removeMember"></members-panel>
@else
    <div class="panel panel-default">
        <div class="panel-heading">
            Members
        </div>
        <ul class="list-group list-group-restricted">
            <?php $r = $roles->keyBy('id'); ?>
            @foreach($members as $member)
                <li class="list-group-item clearfix">
                    <span class="text-muted pull-right">{{ $r[$member->project_role_id]->name }}</span>
                    {{$member->firstname}} {{$member->lastname}} @if($member->id === $user->id) <span class="text-muted">(you)</span> @endif
                </li>
            @endforeach
        </ul>
    </div>
@endcan
