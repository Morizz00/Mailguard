import { useMutation, useQuery } from '@tanstack/react-query'
import { bulkCheck, checkDomain, getHistory } from '../api/client'

export function useSingleCheck() {
  return useMutation({
    mutationFn: checkDomain,
  })
}

export function useBulkCheck() {
  return useMutation({
    mutationFn: (domains: string[]) => bulkCheck(domains),
  })
}

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
  })
}
