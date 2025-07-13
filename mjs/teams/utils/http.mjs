export async function request(options) {
  const { method, url, headers, body } = options;
  
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body && method !== 'GET' && method !== 'DELETE') {
    requestOptions.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (response.status === 204) {
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = data;
      error.headers = Object.fromEntries(response.headers.entries());
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    const networkError = new Error(`Network error: ${error.message}`);
    networkError.original = error;
    throw networkError;
  }
}

export function parseLink(linkHeader) {
  if (!linkHeader) return {};
  
  const links = {};
  const parts = linkHeader.split(',');
  
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      links[match[2]] = match[1];
    }
  }
  
  return links;
}

export function extractPagination(headers) {
  const linkHeader = headers.link || headers.Link;
  const links = parseLink(linkHeader);
  
  return {
    next: links.next || null,
    prev: links.prev || null,
    first: links.first || null,
    last: links.last || null
  };
}

export function handleRateLimit(headers) {
  const limit = headers['x-ratelimit-limit'];
  const remaining = headers['x-ratelimit-remaining'];
  const reset = headers['x-ratelimit-reset'];
  
  if (remaining === '0') {
    const resetDate = new Date(reset * 1000);
    throw new Error(`Rate limit exceeded. Resets at ${resetDate.toISOString()}`);
  }
  
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: new Date(reset * 1000)
  };
}