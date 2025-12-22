'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { debounce } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export function SearchBar({ placeholder = 'Search projects...', className }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  // Use refs to avoid recreating debounced function
  const routerRef = useRef(router)
  const searchParamsRef = useRef(searchParams)

  useEffect(() => {
    routerRef.current = router
    searchParamsRef.current = searchParams
  }, [router, searchParams])

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        const params = new URLSearchParams(searchParamsRef.current.toString())
        if (value) {
          params.set('q', value)
        } else {
          params.delete('q')
        }
        params.delete('page') // Reset to first page on new search
        routerRef.current.push(`/search?${params.toString()}`)
      }, 300),
    []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex">
        <input
          type="search"
          name="q"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1"
          aria-label="Search"
        />
        <button type="submit" className="btn ml-1">
          Go
        </button>
      </div>
    </form>
  )
}
