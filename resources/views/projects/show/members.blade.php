@extends('projects.show.base')

@push('scripts')
<script type="module">
    @can('update', $project)
        biigle.$declare('projects.canEdit', true);
        biigle.$declare('projects.invitations', {!! $invitations !!});
    @else
        biigle.$declare('projects.canEdit', false);
        biigle.$declare('projects.invitations', []);
    @endcan
    biigle.$declare('projects.roles', {!! $roles !!});
    biigle.$declare('projects.defaultRole', {!! Biigle\Role::guest() !!});
    biigle.$declare('projects.members', {{Js::from($members)}});
    biigle.$declare('projects.invitationUrl', '{!!route('project-invitation', '/')!!}');
    biigle.$declare('projects.invitationQrUrl', '{!! url('api/v1/project-invitations/{id}/qr') !!}');
</script>
@endpush

@section('project-content')
<div id="projects-show-members" class="project-members">
    <div class="row">
        <div class="col-xs-6">
            <member-list
                :members="members"
                :own-id="userId"
                :editable="canEdit"
                :roles="roles"
                v-on:remove="removeMember"
                v-on:update="updateMember"
                >
            </member-list>
        </div>
        <div class="col-xs-6">
            @can('update', $project)
                <p class="clearfix">
                    <span class="pull-right">
                        <loader :active="loading"></loader>
                        <button id="member-btn" class="btn btn-default" title="Add a new member to the project"><i class="fa fa-user-plus"></i> Add member</button>
                        <button id="invitation-btn" class="btn btn-default" title="Create a new project invitation"><i class="fa fa-envelope"></i> Create invitation</button>
                    </span>
                </p>
                <popover target="#member-btn" placement="left" v-model="memberPopoverOpen">
                    <template #popover>
                        <add-member-form
                            :members="members"
                            :roles="roles"
                            :default-role="defaultRole"
                            :disabled="loading"
                            v-on:attach="attachMember"
                            ></add-member-form>
                    </template>
                </popover>
                <popover target="#invitation-btn" placement="left" v-model="invitationPopoverOpen">
                    <template #popover>
                        <create-invitation-form
                            :project="project"
                            :roles="rolesWithoutAdmin"
                            :default-role="defaultRole"
                            v-on:created="handleCreatedInvitation"
                            ></create-invitation-form>
                    </template>
                </popover>

                <ul v-cloak class="list-group">
                    <invitation-list-item
                        v-for="invitation in sortedInvitations"
                        :key="invitation.id"
                        :invitation="invitation"
                        :roles="roles"
                        :base-url="invitationUrl"
                        v-on:delete="handleDeleteInvitation"
                        v-on:show="handleShowInvitation"
                        ></invitation-list-item>
                </ul>

                <modal
                    v-cloak
                    v-model="invitationModalOpen"
                    :footer="false"
                    title="Join the project by visiting this link"
                    >
                    <div v-if="shownInvitation" class="text-center">
                        <p class="lead">
                            <code v-text="shownInvitationLink"></code>
                        </p>
                        <img :src="shownInvitationQrLink">
                    </div>
                </modal>
            @else
                <span class="text-muted">Project admins can add and remove members.</span>
            @endcan
        </div>
    </div>
</div>
@endsection
