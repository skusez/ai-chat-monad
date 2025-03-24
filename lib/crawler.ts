import FirecrawlApp from '@mendable/firecrawl-js';

if (!process.env.FIRECRAWL_API_URL) {
  throw new Error('FIRECRAWL_API_URL is not set');
}

declare global {
  // Declare a global variable to hold our singleton instance.
  // Using 'var' allows us to attach it to the global scope.
  // eslint-disable-next-line no-var
  var _firecrawl: FirecrawlApp | undefined;
}

// Use the global object to either retrieve an existing instance or create one if it doesn't exist.
export const crawler =
  global._firecrawl ??
  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  (global._firecrawl = new FirecrawlApp({
    apiUrl: process.env.FIRECRAWL_API_URL,
  }));
