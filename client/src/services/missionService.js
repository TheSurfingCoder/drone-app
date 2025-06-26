const API_URL = import.meta.env.VITE_API_URL || '/api' // Use relative URL instead of absolute

// Helper function to get auth headers
const getAuthHeaders = async (supabase) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('No active session')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

// Create a new mission
export const createMission = async (missionData, supabase) => {
  const headers = await getAuthHeaders(supabase)

  const response = await fetch(`${API_URL}/missions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(missionData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create mission: ${error}`)
  }

  return response.json()
}

// Get all missions for the current user
export const getMissions = async (supabase) => {
  const headers = await getAuthHeaders(supabase)

  const response = await fetch(`${API_URL}/missions`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch missions: ${error}`)
  }

  return response.json()
}

// Get a specific mission by ID
export const getMission = async (missionId, supabase) => {
  const headers = await getAuthHeaders(supabase)

  const response = await fetch(`${API_URL}/missions/${missionId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch mission: ${error}`)
  }

  return response.json()
}

// Update a mission
export const updateMission = async (missionId, missionData, supabase) => {
  const headers = await getAuthHeaders(supabase)

  const response = await fetch(`${API_URL}/missions/${missionId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(missionData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update mission: ${error}`)
  }

  return response.json()
}

// Delete a mission
export const deleteMission = async (missionId, supabase) => {
  const headers = await getAuthHeaders(supabase)

  const response = await fetch(`${API_URL}/missions/${missionId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete mission: ${error}`)
  }

  // Don't try to parse JSON for 204 No Content responses
  if (response.status === 204) {
    return null // or return { success: true }
  }

  // Only try to parse JSON for other successful responses
  return response.json()
}
