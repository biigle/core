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

        start_frame = round(params['start_time'] * self.fps)
        self.video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        self.tracker = cv2.TrackerCSRT_create()
        _, frame = self.video.read()
        track_window = tuple(map(int, params['start_window']))
        self.tracker.init(frame, track_window)

        self.debug = False

    def box_out_of_frame(self, box):
        return box[0] < 0 or box[1] < 0 or (box[0] + box[2]) > self.width or (box[1] + box[3]) > self.height

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

        if not success:
            raise StopIteration

        # if self.box_out_of_frame(box):
        #     raise StopIteration

        current_frame = self.video.get(cv2.CAP_PROP_POS_FRAMES)
        current_time = current_frame / self.fps

        if self.debug:
            x, y, w, h = map(int, box)
            cv2.rectangle(frame, (x, y), (x + w, y + h), 255, 2)
            cv2.imshow("frame", frame)
            cv2.waitKey(1)

        return (current_time, box[0] + (box[2] / 2), box[1] + (box[3] / 2))

    def __next__(self):
        return self._next()

    def next(self):
        return self._next()


with open(sys.argv[1]) as f:
    params = json.load(f)

last_time = 0
current_time = 0
keyframe_distance = params['keyframe_distance']
keyframes = []

for keyframe in ObjectTracker(params):
    if keyframe[0] - last_time >= keyframe_distance:
        last_time = keyframe[0]
        keyframes.append(keyframe)

with open(sys.argv[2], 'w') as f:
    json.dump(keyframes, f)
