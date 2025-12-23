/**
 * GitHub Verification Utilities
 *
 * Functions to verify repository ownership for sellers
 */

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    id: number
  }
  html_url: string
  private: boolean
}

/**
 * Check if a GitHub username matches the owner in a repo URL
 * Simple URL-based check (doesn't require API call)
 */
export function verifyRepoOwnership(
  githubUsername: string,
  repoUrl: string
): boolean {
  // Parse repo URL: https://github.com/owner/repo
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) return false

  const [, owner] = match
  return owner.toLowerCase() === githubUsername.toLowerCase()
}

/**
 * Extract owner and repo name from a GitHub URL
 */
export function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/)
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  }
}

/**
 * Check if a URL is a valid GitHub repository URL
 */
export function isGitHubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/]+/.test(url)
}

/**
 * Fetch user's repositories from GitHub API
 * Requires access token with 'repo' scope
 */
export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Check if user owns a specific repository
 * Uses GitHub API to verify actual ownership
 */
export async function isRepoOwner(
  accessToken: string,
  repoUrl: string
): Promise<boolean> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return false

  try {
    const repos = await getUserRepos(accessToken)
    return repos.some(
      (r) =>
        r.owner.login.toLowerCase() === parsed.owner.toLowerCase() &&
        r.name.toLowerCase() === parsed.repo.toLowerCase()
    )
  } catch (error) {
    console.error('[GitHub] Failed to verify repo ownership:', error)
    return false
  }
}

/**
 * Get a specific repository's details
 */
export async function getRepo(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRepo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('[GitHub] Failed to fetch repo:', error)
    return null
  }
}
