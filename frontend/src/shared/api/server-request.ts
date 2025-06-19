export async function serverRequest<TRequest = any, TResponse = any>(
  endpoint: string,
  request?: TRequest,
  method: 'GET' | 'POST' = 'POST'
): Promise<TResponse> {
  const backendEndpoint = process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT

  if (!backendEndpoint) {
    throw new Error('Backend API endpoint is not configured (NEXT_PUBLIC_BACKEND_API_ENDPOINT)')
  }

  const route = `${backendEndpoint}${endpoint}`

  try {
    new URL(route)
  } catch {
    throw new Error(`Invalid URL constructed: ${route}`)
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (method === 'POST' && request !== undefined) {
    fetchOptions.body = JSON.stringify(request)
  }

  const response = await fetch(route, fetchOptions)

  if (!response.ok) {
    const maybeErrorMessage = await response.text()
    throw new Error(
      `😵 HTTP error! ${Boolean(maybeErrorMessage) ? maybeErrorMessage : `Status: {response.status}`}`
    )
  }

  const data = await response.json()
  return data
}
