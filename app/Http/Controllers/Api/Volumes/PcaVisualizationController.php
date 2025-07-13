<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Volume;
use Biigle\VideoAnnotationLabelFeatureVector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PcaVisualizationController extends Controller
{
    /**
     * Get annotation feature vectors for dimensionality reduction visualization for a volume.
     *
     * @param Request $request
     * @param int $id Volume ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        // Validate method parameter
        $method = $request->get('method', 'pca');
        if (!in_array($method, ['pca', 'umap', 'tsne'])) {
            $method = 'pca';
        }
        
        // Debug: log the method parameter
        Log::info('Volume PCA Visualization method parameter: ' . $method);

        // Get image annotation feature vectors for this volume
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
            ->where('images.volume_id', $volume->id)
            ->limit(1000) // Limit for performance
            ->get();

        // Get video annotation feature vectors for this volume
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
            ->where('videos.volume_id', $volume->id)
            ->limit(1000) // Limit for performance
            ->get();

        // Combine both types of features
        $allFeatures = $imageFeatures->merge($videoFeatures);

        if ($allFeatures->isEmpty()) {
            return response()->json([
                'data' => [],
                'message' => 'No feature vectors found for this volume.'
            ]);
        }

        // Convert vectors to arrays
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

        $count = $vectors->count();

        // Return raw data for all methods - dimensionality reduction is handled in frontend
        return response()->json([
            'data' => $vectors->toArray(),
            'count' => $count,
            'method' => $method
        ]);
    }

    /**
     * Compute PCA for the feature vectors.
     * 
     * @param \Illuminate\Support\Collection $vectors
     * @return array
     */
    private function computePCA($vectors)
    {
        if ($vectors->isEmpty()) {
            return [];
        }

        // Extract raw vectors and prepare for PCA
        $rawVectors = $this->prepareRawVectors($vectors);
        
        if (empty($rawVectors)) {
            return [];
        }

        $numSamples = count($rawVectors);
        $dimensions = count($rawVectors[0]);

        // Take every 8th dimension to reduce computational complexity (similar to project implementation)
        $step = max(1, intval($dimensions / 48)); // Aim for ~48 dimensions
        $selectedDimensions = [];
        for ($i = 0; $i < $dimensions; $i += $step) {
            $selectedDimensions[] = $i;
        }

        // Extract selected dimensions
        $selectedVectors = [];
        foreach ($rawVectors as $vector) {
            $selectedVector = [];
            foreach ($selectedDimensions as $dim) {
                $selectedVector[] = $vector[$dim];
            }
            $selectedVectors[] = $selectedVector;
        }

        $reducedDimensions = count($selectedDimensions);

        // Calculate means for centering
        $means = array_fill(0, $reducedDimensions, 0);
        foreach ($selectedVectors as $vector) {
            for ($i = 0; $i < $reducedDimensions; $i++) {
                $means[$i] += $vector[$i];
            }
        }
        for ($i = 0; $i < $reducedDimensions; $i++) {
            $means[$i] /= $numSamples;
        }

        // Center the data
        $centeredVectors = [];
        foreach ($selectedVectors as $vector) {
            $centeredVector = [];
            for ($i = 0; $i < $reducedDimensions; $i++) {
                $centeredVector[] = $vector[$i] - $means[$i];
            }
            $centeredVectors[] = $centeredVector;
        }

        // Calculate variances for each dimension
        $variances = array_fill(0, $reducedDimensions, 0);
        foreach ($centeredVectors as $vector) {
            for ($i = 0; $i < $reducedDimensions; $i++) {
                $variances[$i] += $vector[$i] * $vector[$i];
            }
        }
        for ($i = 0; $i < $reducedDimensions; $i++) {
            $variances[$i] /= $numSamples;
        }

        // Find the 3 dimensions with highest variance (simplified PCA)
        $varianceIndexPairs = [];
        for ($i = 0; $i < $reducedDimensions; $i++) {
            $varianceIndexPairs[] = ['variance' => $variances[$i], 'index' => $i];
        }

        // Sort by variance (descending)
        usort($varianceIndexPairs, function ($a, $b) {
            return $b['variance'] <=> $a['variance'];
        });

        // Take top 3 components
        $pc1Index = $varianceIndexPairs[0]['index'];
        $pc2Index = $varianceIndexPairs[1]['index'] ?? $pc1Index;
        $pc3Index = $varianceIndexPairs[2]['index'] ?? $pc2Index;

        // Extract the principal components and normalize
        $pc1Values = [];
        $pc2Values = [];
        $pc3Values = [];

        foreach ($centeredVectors as $vector) {
            $pc1Values[] = $vector[$pc1Index];
            $pc2Values[] = $vector[$pc2Index];
            $pc3Values[] = $vector[$pc3Index];
        }

        // Calculate ranges for normalization
        $pc1Range = [min($pc1Values), max($pc1Values)];
        $pc2Range = [min($pc2Values), max($pc2Values)];
        $pc3Range = [min($pc3Values), max($pc3Values)];

        $pc1Diff = $pc1Range[1] - $pc1Range[0] ?: 1;
        $pc2Diff = $pc2Range[1] - $pc2Range[0] ?: 1;
        $pc3Diff = $pc3Range[1] - $pc3Range[0] ?: 1;

        // Create result with normalized coordinates
        $result = [];
        foreach ($vectors as $index => $originalVector) {
            if ($index < count($pc1Values)) {
                $result[] = [
                    'id' => $originalVector['id'],
                    'annotation_id' => $originalVector['annotation_id'],
                    'label_id' => $originalVector['label_id'],
                    'label_name' => $originalVector['label_name'],
                    'label_color' => $originalVector['label_color'],
                    'volume_id' => $originalVector['volume_id'],
                    'x' => ($pc1Values[$index] - $pc1Range[0]) / $pc1Diff * 2 - 1, // Normalize to [-1, 1]
                    'y' => ($pc2Values[$index] - $pc2Range[0]) / $pc2Diff * 2 - 1,
                    'z' => ($pc3Values[$index] - $pc3Range[0]) / $pc3Diff * 2 - 1,
                ];
            }
        }

        return $result;
    }

    /**
     * Prepare raw vectors from the database results.
     * 
     * @param \Illuminate\Support\Collection $vectors
     * @return array
     */
    private function prepareRawVectors($vectors)
    {
        $rawVectors = [];
        
        foreach ($vectors as $vector) {
            if (isset($vector['vector']) && is_array($vector['vector']) && count($vector['vector']) > 0) {
                $rawVectors[] = $vector['vector'];
            }
        }
        
        return $rawVectors;
    }
}
