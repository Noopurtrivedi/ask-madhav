/**
 * Vertex AI transport for Gemini generateContent.
 *
 * Unlike the public Gemini API (an API key in the `?key=` query param), Vertex
 * authenticates with a Google Cloud service account: we mint a short-lived
 * OAuth2 Bearer token and send it in the Authorization header — no long-lived
 * key ever travels in a URL. This is what spends your Vertex AI credits.
 *
 * Env (all required to enable Vertex; absent → this transport is inert and the
 * caller falls back to the Gemini API key, then to the template engine):
 *   GOOGLE_VERTEX_PROJECT      — GCP project id
 *   GOOGLE_VERTEX_LOCATION     — region, e.g. "us-central1" (or "global")
 *   GOOGLE_VERTEX_CREDENTIALS  — the service-account JSON key, as a single
 *                                stringified blob (paste the whole file)
 */
import { GoogleAuth } from 'google-auth-library'

export function isVertexConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_VERTEX_PROJECT &&
      process.env.GOOGLE_VERTEX_LOCATION &&
      process.env.GOOGLE_VERTEX_CREDENTIALS,
  )
}

// Reuse one GoogleAuth instance across warm invocations so tokens are cached
// and auto-refreshed instead of re-minted on every request.
let auth: GoogleAuth | null = null
function getAuth(): GoogleAuth {
  if (!auth) {
    const credentials = JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS as string)
    auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
  }
  return auth
}

function endpoint(model: string): string {
  const project = process.env.GOOGLE_VERTEX_PROJECT
  const location = process.env.GOOGLE_VERTEX_LOCATION as string
  // The "global" endpoint has no region prefix on the host.
  const host =
    location === 'global'
      ? 'aiplatform.googleapis.com'
      : `${location}-aiplatform.googleapis.com`
  return (
    `https://${host}/v1/projects/${project}/locations/${location}` +
    `/publishers/google/models/${model}:generateContent`
  )
}

/**
 * Calls Vertex generateContent with the same request body shape the Gemini API
 * accepts (contents / systemInstruction / generationConfig / safetySettings).
 * Returns the parsed response JSON, or null on any failure/timeout so the
 * caller can fall back — Vertex problems must never hard-fail the pipeline.
 */
export async function vertexGenerateContent(
  model: string,
  body: unknown,
  timeoutMs = 20000,
): Promise<unknown | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const token = await getAuth().getAccessToken()
    if (!token) {
      console.error('Vertex: failed to obtain access token')
      return null
    }
    const res = await fetch(endpoint(model), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    })
    clearTimeout(timeout)
    if (!res.ok) {
      console.error('Vertex error', res.status, await res.text().catch(() => ''))
      return null
    }
    return await res.json()
  } catch (err) {
    clearTimeout(timeout)
    console.error('Vertex request failed', err)
    return null
  }
}
