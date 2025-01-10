<script>
import EntityChooser from './components/entityChooser.vue';
import LabelTreesApi from '@/core/api/labelTree.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import UsersApi from '@/core/api/users.js';
import VolumesApi from '@/core/api/volumes.js';
import {handleErrorResponse} from '@/core/messages/store.vue';
import {Tabs} from 'uiv';
import {Tab} from 'uiv';

/**
 * View model for the export container
 */
let fetchEntitiesApi = {
    volumes: VolumesApi,
    labelTrees: LabelTreesApi,
    users: UsersApi,
};

export default {
    mixins: [LoaderMixin],
    components: {
        tabs: Tabs,
        tab: Tab,
        entityChooser: EntityChooser,
    },
    data() {
        return {
            exportApiUrl: null,
            allowedExports: [],
            entities: {
                volumes: [],
                labelTrees: [],
                users: [],
            },
            chosenEntities: {
                volumes: [],
                labelTrees: [],
                users: [],
            },
            currentTab: 0,
            volumeIconMap: {},
        };
    },
    computed: {
        indexMap() {
            // Do it like this because the ordering in allowedExports may be
            // arbitrary but the ordering in indexMap must match the tabs in the
            // view.
            return ['volumes', 'labelTrees', 'users']
                .filter((item) => this.allowedExports.indexOf(item) !== -1);
        },
        volumes() {
            return this.entities.volumes.map((volume) => {
                volume.description = volume.projects
                    .map((project) => project.name)
                    .join(', ');

                volume.icon = this.volumeIconMap[volume.media_type_id];

                return volume;
            });
        },
        labelTrees() {
            return this.entities.labelTrees.map(function (tree) {
                if (tree.version) {
                    tree.name = tree.name + ' @ ' + tree.version.name;
                }

                return tree;
            });
        },
        users() {
            return this.entities.users.map(function (user) {
                user.name = user.firstname + ' ' + user.lastname;
                if (user.email) {
                    user.description = user.email;
                }

                return user;
            });
        },
        hasNoChosenVolumes() {
            return this.chosenEntities.volumes.length === 0;
        },
        hasNoChosenLabelTrees() {
            return this.chosenEntities.labelTrees.length === 0;
        },
        hasNoChosenUsers() {
            return this.chosenEntities.users.length === 0;
        },
        volumeRequestUrl() {
            return this.exportApiUrl + '/volumes' + this.getQueryString('volumes');
        },
        labelTreeRequestUrl() {
            return this.exportApiUrl + '/label-trees' + this.getQueryString('labelTrees');
        },
        userRequestUrl() {
            return this.exportApiUrl + '/users' + this.getQueryString('users');
        },
    },
    methods: {
        handleSwitchedTab(index) {
            this.currentTab = index;
        },
        fetchEntities(name) {
            if (this.entities[name].length === 0) {
                this.startLoading();
                fetchEntitiesApi[name].get()
                    .then((response) => this.entities[name] = response.data, handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        handleChosenVolumes(volumes) {
            this.chosenEntities.volumes = volumes;
        },
        handleChosenLabelTrees(labelTrees) {
            this.chosenEntities.labelTrees = labelTrees;
        },
        handleChosenUsers(users) {
            this.chosenEntities.users = users;
        },
        getQueryString(name) {
            let entities = this.entities[name];
            let chosenEntities = this.chosenEntities[name];

            if ((entities.length / 2) > chosenEntities.length) {
                return '?only=' + (chosenEntities.map((e) => e.id).join(',') || -1);
            } else if (entities.length > chosenEntities.length) {
                return '?except=' + entities
                    .filter((e) => chosenEntities.indexOf(e) === -1)
                    .map((e) => e.id)
                    .join(',');
            }

            return '';
        }
    },
    watch: {
        currentTab(index) {
            this.fetchEntities(this.indexMap[index]);
        },
    },
    created() {
        this.exportApiUrl = biigle.$require('sync.exportApiUrl');
        this.allowedExports = biigle.$require('sync.allowedExports');
        let mediaTypes = biigle.$require('sync.mediaTypes');
        this.volumeIconMap[mediaTypes.image] = 'image';
        this.volumeIconMap[mediaTypes.video] = 'film';

        this.fetchEntities(this.indexMap[0]);
    },
};
</script>
