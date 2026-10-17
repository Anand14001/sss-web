import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  categories as defaultCategories,
  categoryBySlug as defaultCategoryBySlug,
  categoryById as defaultCategoryById,
  formatFee
} from '../data/event'
import { api } from '../utils/api'

/**
 * Calculates human-readable fee range from a category list.
 * e.g., "₹99 – ₹299" or "₹150" if all are identical.
 */
export function computeFeeRange(cats = defaultCategories) {
  if (!cats || cats.length === 0) return '₹250'
  const fees = cats.map((c) => Number(c.fee) || 0)
  const min = Math.min(...fees)
  const max = Math.max(...fees)
  if (min === max) {
    return formatFee(min)
  }
  return `${formatFee(min)} – ${formatFee(max)}`
}

const CategoriesContext = createContext({
  categories: defaultCategories,
  categoryBySlug: defaultCategoryBySlug,
  categoryById: defaultCategoryById,
  feeRange: computeFeeRange(defaultCategories),
  formatFee,
  isLoading: false,
  error: null,
  refetch: async () => {}
})

/**
 * CategoriesProvider
 *
 * Provides real-time category metadata and pricing sourced authoritatively
 * from the PostgreSQL database via /api/v1/event. Initializes with static
 * defaults to eliminate layout shift, then seamlessly revalidates.
 */
export function CategoriesProvider({ children }) {
  const [categoriesList, setCategoriesList] = useState(defaultCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const mergeCategories = useCallback((serverCategories) => {
    if (!Array.isArray(serverCategories) || serverCategories.length === 0) return

    setCategoriesList((prev) => {
      const merged = prev.map((baseCat) => {
        const remote = serverCategories.find((sc) => sc.slug === baseCat.slug)
        if (!remote) return baseCat

        const fee =
          typeof remote.fee === 'number'
            ? remote.fee
            : Math.floor((remote.feePaise || 0) / 100)

        // Mutate in-memory static category object so any direct imports stay in sync
        baseCat.fee = fee
        baseCat.feePaise = remote.feePaise ?? fee * 100
        if (remote.currency) baseCat.currency = remote.currency

        return {
          ...baseCat,
          fee,
          feePaise: remote.feePaise ?? fee * 100,
          currency: remote.currency || baseCat.currency || 'INR'
        }
      })
      return merged
    })
  }, [])

  const refetch = useCallback(async () => {
    try {
      const res = await api.getEventConfig()
      if (res?.success && Array.isArray(res.categories)) {
        mergeCategories(res.categories)
        setError(null)
      }
    } catch (err) {
      console.warn('[CATEGORIES] Failed to fetch live pricing from API, using baseline:', err.message)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [mergeCategories])

  // Initial load on mount
  useEffect(() => {
    refetch()
  }, [refetch])

  // Automatic background revalidation when user re-focuses tab/window
  useEffect(() => {
    const handleFocus = () => {
      refetch()
    }
    window.addEventListener('focus', handleFocus)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    })
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetch])

  // Computed mappings
  const bySlug = useMemo(() => {
    return Object.fromEntries(categoriesList.map((c) => [c.slug, c]))
  }, [categoriesList])

  const byId = useMemo(() => {
    return Object.fromEntries(categoriesList.map((c) => [c.id, c]))
  }, [categoriesList])

  const feeRange = useMemo(() => {
    return computeFeeRange(categoriesList)
  }, [categoriesList])

  const value = useMemo(
    () => ({
      categories: categoriesList,
      categoryBySlug: bySlug,
      categoryById: byId,
      feeRange,
      formatFee,
      isLoading,
      error,
      refetch
    }),
    [categoriesList, bySlug, byId, feeRange, isLoading, error, refetch]
  )

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  )
}

/**
 * Hook to access contest categories, pricing, and fee formatting.
 */
export function useCategories() {
  return useContext(CategoriesContext)
}

/**
 * Hook to access a specific contest category by slug.
 */
export function useCategory(slug) {
  const { categoryBySlug } = useCategories()
  return slug ? categoryBySlug[slug] || null : null
}
