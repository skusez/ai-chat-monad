/**
 * Crawler class for interacting with Crawl4AI API
 * @class Crawl4AI
 */

interface ExtractionConfigSchema {
  name: string;
  baseSelector: string;
  fields: Array<{ name: string; selector: string; text: string }>;
}

interface CrawlRequest {
  // Start of Selection
  urls: string;
  priority: number;
  crawler_params: {
    // Browser Configuration
    headless: boolean; // Run in headless mode
    browser_type: "chromium" | "firefox" | "webkit"; // Browser type
    user_agent: string; // Custom user agent
    proxy: string; // Proxy configuration

    // Performance & Behavior
    page_timeout: number; // Page load timeout (ms)
    verbose: boolean; // Enable detailed logging
    semaphore_count: number; // Concurrent request limit

    // Anti-Detection Features
    simulate_user: boolean; // Simulate human behavior
    magic: boolean; // Advanced anti-detection
    override_navigator: boolean; // Override navigator properties

    // Session Management
    user_data_dir: string; // Browser profile location
    use_managed_browser: boolean; // Use persistent browser
  };
  extraction_config: {
    type: "json_css";
    params: {
      schema: ExtractionConfigSchema;
      semantic_filter: string;
      word_count_threshold: string;
      max_dist: 0.2;
      top_k: 3;
    };
  };
}

const apiKey = process.env.CRAWL4AI_API_TOKEN;
const baseUrlFromEnv = process.env.CRAWL4AI_URL!;
if (!baseUrlFromEnv) {
  throw new Error("Crawler base URL is not set");
}
export class Crawl4AI {
  private baseUrl: string;
  private headers: HeadersInit | undefined;
  /**
   * Creates an instance of Crawl4AI crawler
   * @param {string} baseUrl - The base URL for the Crawl4AI API
   */
  constructor(_baseUrl: string = baseUrlFromEnv) {
    this.baseUrl = _baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    };
  }

  /**
   * Performs a basic crawl of the specified URL
   * @param {string} url - The URL to crawl
   * @param {number} priority - Priority of the crawl task (optional)
   * @returns {Promise<any>} - The crawl result
   */
  async crawl({ urls, priority = 10 }: Partial<CrawlRequest>): Promise<any> {
    try {
      const request = {
        urls,
        priority,
      };

      // Submit the crawl task
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: "POST",
        headers: {
          ...this.headers,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      const taskId = data.task_id;

      // Get the results
      const result = await this.getTaskResult(taskId);
      return result;
    } catch (error) {
      console.error("Crawl failed:", error);
      throw error;
    }
  }

  /**
   * Performs a crawl with structured data extraction using CSS selectors
   * @param {string} url - The URL to crawl
   * @param {any} schema - The extraction schema with CSS selectors
   * @returns {Promise<any>} - The extracted structured data
   */
  async extractStructuredData({
    url,
    schema,
  }: {
    url: string;
    schema: ExtractionConfigSchema;
  }): Promise<any> {
    try {
      const request = {
        urls: url,
        extraction_config: {
          type: "json_css",
          params: { schema },
        },
      };

      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: "POST",
        headers: {
          ...this.headers,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      const taskId = data.task_id;

      return await this.getTaskResult(taskId);
    } catch (error) {
      console.error("Structured data extraction failed:", error);
      throw error;
    }
  }

  /**
   * Performs a crawl with dynamic content handling
   * @param {string} url - The URL to crawl
   * @param {string[]} jsCode - JavaScript code to execute on the page
   * @param {string} waitFor - CSS selector to wait for before considering the page loaded
   * @returns {Promise<any>} - The crawl result
   */
  async crawlDynamicContent({
    url,
    jsCode,
    waitFor,
  }: {
    url: string;
    jsCode: string[];
    waitFor: string;
  }): Promise<any> {
    try {
      const request = {
        urls: url,
        js_code: jsCode,
        wait_for: waitFor,
      };

      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: "POST",
        headers: {
          ...this.headers,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      const taskId = data.task_id;

      return await this.getTaskResult(taskId);
    } catch (error) {
      console.error("Dynamic content crawl failed:", error);
      throw error;
    }
  }

  /**
   * Performs AI-powered extraction using semantic filtering
   * @param {string} url - The URL to crawl
   * @param {string} semanticFilter - Keywords for semantic filtering
   * @param {number} wordCountThreshold - Minimum word count threshold
   * @param {number} maxDist - Maximum cosine distance
   * @param {number} topK - Number of top results to return
   * @returns {Promise<any>} - The extraction result
   */
  async aiExtract({
    url,
    semanticFilter,
    wordCountThreshold = 10,
    maxDist = 0.2,
    topK = 3,
  }: {
    url: string;
    semanticFilter: string;
    wordCountThreshold?: number;
    maxDist?: number;
    topK?: number;
  }): Promise<any> {
    try {
      const request = {
        urls: url,
        extraction_config: {
          type: "cosine",
          params: {
            semantic_filter: semanticFilter,
            word_count_threshold: wordCountThreshold,
            max_dist: maxDist,
            top_k: topK,
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: "POST",
        headers: {
          ...this.headers,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      const taskId = data.task_id;

      return await this.getTaskResult(taskId);
    } catch (error) {
      console.error("AI extraction failed:", error);
      throw error;
    }
  }

  /**
   * Gets the result of a task by its ID
   * @param {string} taskId - The ID of the task
   * @returns {Promise<any>} - The task result
   */
  private async getTaskResult({ taskId }: { taskId: string }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to get task result:", error);
      throw error;
    }
  }
}
