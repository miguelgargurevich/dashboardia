// Helper function to create authenticated headers for API requests
export function createAuthHeaders(request: Request): HeadersInit {
  const authToken = request.headers.get('Authorization');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': authToken || '',
  };
}

// Helper function to validate if request has authorization
export function hasValidAuth(request: Request): boolean {
  const authToken = request.headers.get('Authorization');
  return !!authToken && authToken.startsWith('Bearer ');
}

// Helper function to handle unauthorized requests
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized - Token requerido' }), 
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
