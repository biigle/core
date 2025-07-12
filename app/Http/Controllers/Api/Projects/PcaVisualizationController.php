<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Project;
use Biigle\VideoAnnotationLabelFeatureVector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PcaVisualizationController extends Controller
{
    /**
     * Get annotation feature vectors for PCA visualization.
     *
     * @param Request $request
     * @param int $id Project ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        // Get image annotation feature vectors
        $imageFeatures = ImageAnnotationLabelFeatureVector::select([
                'image_annotation_label_feature_vectors.id',
                'image_annotation_label_feature_vectors.annotation_id',
                'image_annotation_label_feature_vectors.label_id',
                'image_annotation_label_feature_vectors.volume_id',
                'image_annotation_label_feature_vectors.vector',
                'labels.name as label_name',
                'labels.color as label_color'
            ])
            ->join('image_annotations', 'image_annotation_label_feature_vectors.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->join('labels', 'image_annotation_label_feature_vectors.label_id', '=', 'labels.id')
            ->whereIn('images.volume_id', function ($query) use ($project) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $project->id);
            })
            ->limit(1000) // Limit for performance
            ->get();

        // Get video annotation feature vectors
        $videoFeatures = VideoAnnotationLabelFeatureVector::select([
                'video_annotation_label_feature_vectors.id',
                'video_annotation_label_feature_vectors.annotation_id', 
                'video_annotation_label_feature_vectors.label_id',
                'video_annotation_label_feature_vectors.volume_id',
                'video_annotation_label_feature_vectors.vector',
                'labels.name as label_name',
                'labels.color as label_color'
            ])
            ->join('video_annotations', 'video_annotation_label_feature_vectors.annotation_id', '=', 'video_annotations.id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->join('labels', 'video_annotation_label_feature_vectors.label_id', '=', 'labels.id')
            ->whereIn('videos.volume_id', function ($query) use ($project) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $project->id);
            })
            ->limit(1000) // Limit for performance
            ->get();

        // Combine both types of features
        $allFeatures = $imageFeatures->merge($videoFeatures);

        if ($allFeatures->isEmpty()) {
            return response()->json([
                'data' => [],
                'message' => 'No feature vectors found for this project.'
            ]);
        }

        // Convert vectors to arrays and compute PCA
        $vectors = $allFeatures->map(function ($feature) {
            return [
                'id' => $feature->id,
                'annotation_id' => $feature->annotation_id,
                'label_id' => $feature->label_id,
                'label_name' => $feature->label_name ?? 'Unknown',
                'label_color' => $feature->label_color ?? '888888',
                'volume_id' => $feature->volume_id,
                'vector' => $feature->vector->toArray(),
            ];
        });

        $pcaData = $this->computePCA($vectors->toArray());

        return response()->json([
            'data' => $pcaData,
            'count' => $allFeatures->count(),
        ]);
    }

    /**
     * Compute PCA on the feature vectors using simple PHP implementation.
     *
     * @param array $data
     * @return array
     */
    private function computePCA(array $data)
    {
        if (empty($data)) {
            return [];
        }

        // Extract vectors
        $vectors = array_map(function ($item) {
            return $item['vector'];
        }, $data);

        $numSamples = count($vectors);
        $numFeatures = count($vectors[0]);

        // For performance, reduce dimensionality first by taking every 8th dimension
        // This gives us 48 dimensions from the original 384 DINO features
        $stride = 8;
        $reducedDims = intval($numFeatures / $stride);
        
        $reducedVectors = [];
        for ($i = 0; $i < $numSamples; $i++) {
            $reducedVectors[$i] = [];
            for ($j = 0; $j < $reducedDims; $j++) {
                $reducedVectors[$i][] = $vectors[$i][$j * $stride];
            }
        }

        // Compute mean for each dimension
        $means = array_fill(0, $reducedDims, 0);
        for ($i = 0; $i < $numSamples; $i++) {
            for ($j = 0; $j < $reducedDims; $j++) {
                $means[$j] += $reducedVectors[$i][$j];
            }
        }
        for ($j = 0; $j < $reducedDims; $j++) {
            $means[$j] /= $numSamples;
        }

        // Center the data
        $centeredVectors = [];
        for ($i = 0; $i < $numSamples; $i++) {
            $centeredVectors[$i] = [];
            for ($j = 0; $j < $reducedDims; $j++) {
                $centeredVectors[$i][$j] = $reducedVectors[$i][$j] - $means[$j];
            }
        }

        // Compute variance for each dimension and select top 3
        $variances = [];
        for ($i = 0; $i < $reducedDims; $i++) {
            $variance = 0;
            for ($j = 0; $j < $numSamples; $j++) {
                $variance += pow($centeredVectors[$j][$i], 2);
            }
            $variances[] = ['index' => $i, 'variance' => $variance / ($numSamples - 1)];
        }

        // Sort by variance and take top 3
        usort($variances, function($a, $b) {
            return $b['variance'] <=> $a['variance'];
        });

        $pc1_idx = $variances[0]['index'];
        $pc2_idx = $variances[1]['index'];
        $pc3_idx = $variances[2]['index'];

        // Project data onto these three dimensions and normalize
        $pc1_values = array_column($centeredVectors, $pc1_idx);
        $pc2_values = array_column($centeredVectors, $pc2_idx);
        $pc3_values = array_column($centeredVectors, $pc3_idx);
        
        // Calculate range for normalization
        $pc1_min = min($pc1_values);
        $pc1_max = max($pc1_values);
        $pc2_min = min($pc2_values);
        $pc2_max = max($pc2_values);
        $pc3_min = min($pc3_values);
        $pc3_max = max($pc3_values);
        
        $pc1_range = $pc1_max - $pc1_min ?: 1;
        $pc2_range = $pc2_max - $pc2_min ?: 1;
        $pc3_range = $pc3_max - $pc3_min ?: 1;

        $result = [];
        for ($i = 0; $i < $numSamples; $i++) {
            // Normalize to [-1, 1] range
            $x = (($pc1_values[$i] - $pc1_min) / $pc1_range) * 2 - 1;
            $y = (($pc2_values[$i] - $pc2_min) / $pc2_range) * 2 - 1;
            $z = (($pc3_values[$i] - $pc3_min) / $pc3_range) * 2 - 1;
            
            $result[] = [
                'id' => $data[$i]['id'],
                'annotation_id' => $data[$i]['annotation_id'],
                'label_id' => $data[$i]['label_id'],
                'label_name' => $data[$i]['label_name'],
                'label_color' => $data[$i]['label_color'],
                'volume_id' => $data[$i]['volume_id'],
                'x' => $x,
                'y' => $y,
                'z' => $z,
            ];
        }

        return $result;
    }
}
