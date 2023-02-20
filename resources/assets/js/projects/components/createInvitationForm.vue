<template>
    <form @submit.prevent="submit">
        <div class="form-group clearfix">
            <a class="pull-right" href="/manual/tutorials/projects/about#members" title="Learn more about project invitations" target="_blank"><i class="fa fa-question-circle"></i></a>
            <label>Expiration date</label>
            <datepicker-dropdown
                v-model="expiresAt"
                :limit-from="tomorrowDate"
                required
                ></datepicker-dropdown>
        </div>
        <div class="form-group">
            <label>New member role</label>
            <select
                class="form-control"
                title="Role of the new member"
                v-model="roleId"
                required
                >
                <option
                    v-for="role in roles"
                    :value="role.id"
                    v-text="role.name"
                    ></option>
            </select>
        </div>
        <div class="form-group">
            <label>Maximum uses <span class="text-muted">(optional)</span></label>
            <input
                class="form-control"
                type="number"
                min="1"
                step="1"
                placeholder="unlimited"
                v-model="maxUses"
                >
        </div>
        <button
            class="btn btn-success btn-block"
            type="submit"
            title="Create a new project invitation"
            :disabled="loading"
            >
            <loader :active="loading"></loader> Create
        </button>
    </form>
</template>

<script>
import DatepickerDropdown from '../../uiv/datepickerDropdown';
import InvitationApi from '../api/projectInvitations.js';
import LoaderMixin from '../../core/mixins/loader';
import {handleErrorResponse} from '../../core/messages/store';

export default {
    mixins: [LoaderMixin],
    props: {
        project: {
            type: Object,
            required: true,
        },
        roles: {
            type: Array,
            required: true,
        },
        defaultRole: {
            type: Object,
        },
    },
    components: {
        datepickerDropdown: DatepickerDropdown,
    },
    data() {
        return {
            expiresAt: null,
            roleId: null,
            maxUses: null,
        };
    },
    computed: {
        tomorrowDate() {
            let date = new Date();
            date.setDate(date.getDate() + 1);

            return date;
        },
        initialExpiresAt() {
            let year = this.tomorrowDate.getFullYear();
            let month = this.tomorrowDate.getMonth() + 1;
            let day = this.tomorrowDate.getDate();

            return `${year}-${month}-${day}`;
        },
    },
    methods: {
        submit() {
            this.startLoading();
            // Parse the date again to ensure that the date the user sees
            // (e.g. "2022-11-11") is passed on with the correct time and timezone
            // as ISO string. Otherwise the date that the user sees would be interpreted
            // as UTC. See: https://stackoverflow.com/a/42626876/1796523
            let date = this.expiresAt.split('-').map(s => parseInt(s))
            date[1] = date[1] - 1; // adjust month
            let isoExpiresAt = (new Date(...date)).toISOString();

            let payload = {
                expires_at: isoExpiresAt,
                role_id: this.roleId,
            };

            if (this.maxUses > 0) {
                payload.max_uses = this.maxUses;
            }

            InvitationApi.save({id: this.project.id}, payload)
                .then(this.handleCreated, handleErrorResponse)
                .finally(this.finishLoading);
        },
        handleCreated(response) {
            this.$emit('created', response.body)
        },
    },
    created() {
        if (this.defaultRole) {
            this.roleId = this.defaultRole.id;
        } else {
            this.roleId = this.roles[0].id;
        }

        this.expiresAt = this.initialExpiresAt;
    },
};
</script>
