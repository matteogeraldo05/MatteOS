import { QueryClient } from '@tanstack/react-query'

// Lazy ref so ToastHost can register the push function
let _toastPush: ((toast: { kind: 'success' | 'info' | 'danger'; title: string; description?: string }) => void) | null = null

export function registerToastPush(fn: typeof _toastPush) {
  _toastPush = fn
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        if (_toastPush) {
          _toastPush({
            kind: 'danger',
            title: 'Something went wrong',
            description: error instanceof Error ? error.message : String(error),
          })
        }
      },
    },
  },
})
