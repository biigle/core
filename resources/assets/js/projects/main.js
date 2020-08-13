import Dashboard from './dashboard';
import LabelTreesContainer from './labelTreesContainer';
import LabelTreesCount from './labelTreesCount';
import LabelTreesPanel from './labelTreesPanel';
import MembersPanel from './membersPanel';
import Title from './title';
import VolumesContainer from './volumesContainer';
import VolumesCount from './volumesCount';
import VolumesPanel from './volumesPanel';

biigle.$mount('project-label-trees-count', LabelTreesCount);
biigle.$mount('project-volumes-count', VolumesCount);
biigle.$mount('projects-dashboard-main', Dashboard);
biigle.$mount('projects-label-trees', LabelTreesPanel);
biigle.$mount('projects-members', MembersPanel);
biigle.$mount('projects-show-label-trees', LabelTreesContainer);
biigle.$mount('projects-show-volume-list', VolumesPanel);
biigle.$mount('projects-show-volumes', VolumesContainer);
biigle.$mount('projects-title', Title);
