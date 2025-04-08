import { useQuery } from '@tanstack/react-query';
import { fetchCanvasById, CanvasData } from '../lib/api';
import { queryKeys, STALE_TIME_CANVAS_DATA } from '../lib/constants';

/**
 * Custom hook to fetch canvas data using React Query.
 * Handles loading and error states.
 *
 * @param canvasId The ID of the canvas to fetch.
 * @returns An object containing the canvas data, loading state, and error state.
 */
export function useCanvasData(canvasId: string | undefined) {
    const {
        data: canvasData,
        isLoading: isCanvasLoading,
        error: canvasError,
    } = useQuery<CanvasData | null>({
        // Ensure queryKey changes when canvasId changes
        queryKey: queryKeys.canvas(canvasId!),
        // Only run the query if canvasId is defined
        queryFn: () => canvasId ? fetchCanvasById(canvasId) : Promise.resolve(null),
        staleTime: STALE_TIME_CANVAS_DATA,
        // Disable the query if canvasId is not available
        enabled: !!canvasId,
    });

    return { canvasData, isCanvasLoading, canvasError };
}
