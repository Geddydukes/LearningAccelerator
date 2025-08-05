import { useState, useCallback } from 'react';
import { useErrorHandler } from '../components/ui/ErrorBoundary';
import toast from 'react-hot-toast';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export const useAsyncOperation = <T = any>(
  options: UseAsyncOperationOptions = {}
) => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const { handleError } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      
      setState({
        data: result,
        loading: false,
        error: null
      });

      if (options.showToast && options.successMessage) {
        toast.success(options.successMessage);
      }

      options.onSuccess?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });

      handleError(error as Error);

      if (options.showToast && options.errorMessage) {
        toast.error(options.errorMessage);
      } else if (options.showToast) {
        toast.error(errorMessage);
      }

      options.onError?.(error as Error);
      return null;
    }
  }, [options, handleError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

// Specialized hook for agent operations
export const useAgentOperation = (agentName: string) => {
  return useAsyncOperation({
    showToast: true,
    successMessage: `${agentName} completed successfully!`,
    errorMessage: `${agentName} failed to complete`
  });
};

// Hook for database operations
export const useDatabaseOperation = () => {
  return useAsyncOperation({
    showToast: true,
    errorMessage: 'Database operation failed'
  });
};