export async function serverRequest<TRequest = any, TResponse = any>(
  endpoint: string,
  request: TRequest
): Promise<TResponse> {
  const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}${endpoint}`

  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`😵 HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()
  return data
}
