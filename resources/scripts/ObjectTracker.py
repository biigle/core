import cv2
import numpy as np
import sys
import json

class ObjectTracker(object):
    def __init__(self, params):
        self.video = cv2.VideoCapture(params['video_path'])
        self.fps = self.video.get(cv2.CAP_PROP_FPS)
        self.width = self.video.get(cv2.CAP_PROP_FRAME_WIDTH)
        self.height = self.video.get(cv2.CAP_PROP_FRAME_HEIGHT)
        self.debug = False

        start_frame = round(params['start_time'] * self.fps)
        self.video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        self.tracker = cv2.TrackerCSRT_create()
        success, frame = self.video.read()
        if not success:
            raise IOError('The video file could not be read: {}'.format(params['video_path']))
        track_window = tuple(map(int, params['start_window']))
        self.tracker.init(frame, track_window)

    def center_out_of_frame(self, center):
        return center[0] <= 1 or center[1] <= 1 or center[0] >= self.width - 1 or center[1] >= self.height - 1

    def __iter__(self):
        return self

    def __del__(self):
        if self.video:
            self.video.release()

        if self.debug:
            cv2.destroyAllWindows()

    def _next(self):
        success, frame = self.video.read()
        if not success:
            raise StopIteration

        (success, box) = self.tracker.update(frame)

        center = (box[0] + box[2] * 0.5, box[1] + box[3] * 0.5)
        radius = max(box[2], box[3]) * 0.5

        if not success:
            raise StopIteration

        if self.center_out_of_frame(center):
            raise StopIteration

        current_frame = self.video.get(cv2.CAP_PROP_POS_FRAMES)
        current_time = current_frame / self.fps

        if self.debug:
            x, y, w, h = list(map(int, box))
            cv2.rectangle(frame, (x, y), (x + w, y + h), 255, 2)
            show_frame = cv2.resize(frame, (1024, 768))
            cv2.imshow("frame", show_frame)
            cv2.waitKey(1)

        return (current_time, center[0], center[1], radius)

    def __next__(self):
        return self._next()

    def next(self):
        return self._next()

with open(sys.argv[1]) as f:
    params = json.load(f)

current_keyframe = ()
last_keyframe = ()
keyframe_distance = params['keyframe_distance']
keyframes = []

def keyframes_differ(a, b):
    return np.sqrt(np.square(a[1] - b[1]) + np.square(a[2] - b[2])) > keyframe_distance or abs(a[3] - b[3]) > keyframe_distance

for keyframe in ObjectTracker(params):
    current_keyframe = keyframe
    if not last_keyframe or keyframes_differ(last_keyframe, keyframe):
        last_keyframe = keyframe
        keyframes.append(keyframe)

# Add the last keyframe even if it did not have the right keyframe distance.
if keyframes and keyframes[-1][0] != current_keyframe[0]:
    keyframes.append(current_keyframe)

with open(sys.argv[2], 'w') as f:
    json.dump(keyframes, f)
