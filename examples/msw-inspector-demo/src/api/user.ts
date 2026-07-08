export async function loadUser() {
  const response = await fetch('/api/user')
  return response.json()
}
