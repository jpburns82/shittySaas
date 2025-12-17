'use client'

import { useState, useCallback } from 'react'
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

  const handleSearch = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      params.delete('page') // Reset to first page on new search
      router.push(`/search?${params.toString()}`)
    }, 300),
    [searchParams, router]
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
