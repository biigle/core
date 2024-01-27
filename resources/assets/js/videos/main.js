import './filters/videoTime';
import Navbar from './navbar';
import SearchResults from './searchResults';
import VideoContainer from './videoContainer';
import ThumbnailPreview from './components/thumbnailPreview';
biigle.$mount('search-results', SearchResults);
biigle.$mount('video-annotations-navbar', Navbar);
biigle.$mount('video-container', VideoContainer);
biigle.$mount('thumbnail-preview', ThumbnailPreview);