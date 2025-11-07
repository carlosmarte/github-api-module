export function buildQueryString(params = {}) {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  
  return filteredParams.length > 0 ? `?${filteredParams.join('&')}` : '';
}

export function parseQueryString(queryString) {
  if (!queryString) return {};
  
  const params = {};
  const searchParams = new URLSearchParams(queryString);
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

export function mergeParams(defaults, overrides) {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([_, v]) => v !== undefined)
    )
  };
}