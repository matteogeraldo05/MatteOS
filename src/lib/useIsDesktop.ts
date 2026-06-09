import { useMediaQuery } from './useMediaQuery'

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
