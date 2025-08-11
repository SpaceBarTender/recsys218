import axios from 'axios';

// Update this if your API is served from a different host/port.
export const BASE_URL = "/api" //"https://recsys218.usgovvirginia.cloudapp.usgovcloudapi.net/api";
/**
 * handleResponse
 * Logs the response status and parses the JSON payload if the response is OK,
 * otherwise throws an error with the server's error message (if available).
 */
async function handleResponse(response) {
  console.log(`[DEBUG] Received response with status: ${response.status}`);

  if (!response.ok) {
    // Attempt to parse the error details from JSON
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If no JSON in the response, fallback to a generic error
      throw new Error(`HTTP error: ${response.status}`);
    }
    console.error("[ERROR] Server responded with:", errorData);
    throw new Error(errorData.error || `HTTP error: ${response.status}`);
  }

  // If the response is okay, parse it as JSON
  return response.json();
}

/**
 * handleError
 * Logs the error in console and re-throws it for further handling upstream.
 */
function handleError(error) {
  console.error("[ERROR] Network or parsing error:", error);
  throw error;
}

/**
 * getAuthHeaders
 * Helper to append the session token to the request headers if provided.
 */
function getAuthHeaders(sessionToken) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (sessionToken) {
    headers["Authorization"] = sessionToken;
  }
  return headers;
}


/**
 * fetchOffices
 * GET /api/offices
 */
export async function fetchOffices() {
  console.log("[DEBUG] Fetching offices from /api/offices");
  return fetch(`${BASE_URL}/offices`)
    .then(handleResponse)
    .catch(handleError);
}


/**
 * fetchArticleTitles
 * GET /api/article_titles
 *
 * Retrieves a list of all distinct article titles from the urls_content table.
 *
 * @returns {Promise} - Axios promise resolving to the article titles data.
 */
export function fetchArticleTitles() {
  return axios.get('/api/article_titles');
}


/**
 * fetchUserNames
 * GET /api/user_names
 *
 * Retrieves a list of all distinct user names from the users table,
 * filtered by the current user's office using the session token.
 *
 * @returns {Promise} - Axios promise resolving to the user names data.
 */
export function fetchUserNames() {
  const sessionToken = localStorage.getItem("session_token") || "";
  return axios.get('/api/user_names', {
    headers: { Authorization: sessionToken }
  });
}


/**
 * signupUser
 * POST /signup
 *
 * @param {object} payload - { username, password, office_code }
 */
export async function signupUser(payload) {
  console.log("[DEBUG] Signing up user with payload:", payload);
  return fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}


/**
 * loginUser
 * POST /login
 *
 * @param {object} payload - { username, password }
 * @returns {object} - { message, session_token }
 */
export async function loginUser(payload) {
  console.log("[DEBUG] Logging in user with payload:", payload);
  return fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}

/**
 * logoutUser
 * POST /logout
 *
 * @param {string} sessionToken
 * @returns {object} - Response from the server
 */
export async function logoutUser(sessionToken) {
  console.log("[DEBUG] Logging out user");
  
  return fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken)
  })
    .then(handleResponse)
    .catch(handleError);
}


/**
 * fetchTopics
 * GET /topics
 */
export async function fetchTopics() {
  console.log("[DEBUG] Fetching topics from /topics");
  return fetch(`${BASE_URL}/topics`)
    .then(handleResponse)
    .catch(handleError);
}




/**
 * logImpressions
 * POST /log_impressions
 *
 * @param {string} sessionToken
 * @param {Array<string>} articleIds
 */
export async function logImpressions(sessionToken, articleIds) {
  console.log("[DEBUG] Logging impressions for articles:", articleIds);

  return fetch(`${BASE_URL}/log_impressions`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify({ article_ids: articleIds }),
  })
    .then(handleResponse)
    .catch(handleError);
}





/**
 * fetchArticles
 * GET /articles
 *
 * @param {object} query - { offset, limit, topics (array), date_min }
 *   e.g. { offset: 0, limit: 20, topics: ["Science", "Politics"], date_min: "2023-01-01" }
 */
export async function fetchArticles(query = {}) {
  console.log("[DEBUG] Fetching articles with query:", query);

  const params = new URLSearchParams();

  if (query.offset) params.append("offset", query.offset);
  if (query.limit) params.append("limit", query.limit);
  if (query.date_min) params.append("date_min", query.date_min);

  // topics are added as multiple query params ?topics=Science&topics=Politics
  if (Array.isArray(query.topics)) {
    query.topics.forEach(topic => params.append("topics", topic));
  }

  const url = `${BASE_URL}/articles?${params.toString()}`;
  console.log("[DEBUG] GET /articles built URL:", url);

  return fetch(url)
    .then(handleResponse)
    .catch(handleError);
}



/**
 * fetchRecommendations
 * POST /recommendations
 *
 * @param {string} sessionToken
 * @param {object} payload - { topics, date_min, offset, limit }
 */
export async function fetchRecommendations(sessionToken, payload = {}) {
  console.log("[DEBUG] Fetching recommendations with payload:", payload);

  return fetch(`${BASE_URL}/recommendations`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}

// Added new function for server-side article filtering
export async function fetchFilteredArticles(sessionToken, payload = {}) {
  console.log("[DEBUG] Fetching filtered articles with payload:", payload);

  return fetch(`${BASE_URL}/articles/filter`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}

/**
 * fetchPulls
 * GET /pulls
 *
 * @param {string} sessionToken
 */
export async function fetchPulls(sessionToken) {
  console.log("[DEBUG] Fetching pulls for the current user from /pulls");

  return fetch(`${BASE_URL}/pulls`, {
    method: "GET",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}



/**
 * fetchUserArticleStats
 * GET /user_article_stats
 *
 * @param {string} sessionToken
 */
export async function fetchUserArticleStats(sessionToken) {
  console.log("[DEBUG] Fetching user article stats from /user_article_stats");

  return fetch(`${BASE_URL}/user_article_stats`, {
    method: "GET",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}



/**
 * logInteraction
 * POST /interactions
 *
 * @param {string} sessionToken
 * @param {object} payload - { interaction_type, url_id }
 *   interaction_type can be: 'click', 'add', or 'bookmark'
 */
export async function logInteraction(sessionToken, payload) {
  console.log("[DEBUG] Logging interaction:", payload);

  return fetch(`${BASE_URL}/interactions`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}




/**
 * fetchArticlesCount
 * GET /articles/count
 */
export async function fetchArticlesCount() {
  console.log("[DEBUG] Fetching total article count from /articles/count");
  
  return fetch(`${BASE_URL}/articles/count`)
    .then(handleResponse)
    .catch(handleError);
}




/**
 * fetchPublicationDates
 * GET /articles/dates
 */
export async function fetchPublicationDates() {
  console.log("[DEBUG] Fetching publication dates from /articles/dates");

  return fetch(`${BASE_URL}/articles/dates`)
    .then(handleResponse)
    .catch(handleError);
}




/**
 * fetchAddedPages
 * GET /added_pages
 *
 * @param {string} sessionToken
 */
export async function fetchAddedPages(sessionToken) {
  console.log("[DEBUG] Fetching added pages from /added_pages");

  return fetch(`${BASE_URL}/added_pages`, {
    method: "GET",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}


/**
 * fetchAddedPagesDetails
 * GET /api/added_pages/details
 *
 * Retrieves a list of added pages details (title, publication date, author, and URL)
 * by joining the added_pages and urls_content tables.
 *
 * @returns {Promise<Object>} - A promise that resolves to the JSON data.
 */
export async function fetchAddedPagesDetails() {
  try {
    const response = await fetch('/api/added_pages/details', {
      headers: {
        'Authorization': localStorage.getItem('session_token') || '',
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch added pages details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching added pages details:', error);
    throw error;
  }
}


/**
 * updateTemplate
 * PUT /api/templates/:id
 *
 * Updates an existing template.
 *
 * @param {number} templateId - The ID of the template to update.
 * @param {string} name - The updated name of the template.
 * @param {string} description - The updated description of the template.
 * @param {object} content - The updated JSON structure of the template.
 * @returns {Promise} - Axios promise resolving to the updated template data.
 */
export function updateTemplate(templateId, name, description, content) {
  return axios.put(
    `/api/templates/${templateId}`,
    { name, description, content },
    { headers: { Authorization: localStorage.getItem('session_token') || '' } }
  );
}

/**
 * archiveTemplate
 * PATCH /api/templates/:id/archive
 *
 * Archives or unarchives a template.
 *
 * @param {number} templateId - The ID of the template to archive/unarchive.
 * @param {boolean} archive - True to archive, false to unarchive.
 * @returns {Promise} - Axios promise resolving to the updated template status.
 */
export function archiveTemplate(templateId, archive = true) {
  return axios.patch(
    `/api/templates/${templateId}/archive`,
    { is_archived: archive },
    { headers: { Authorization: localStorage.getItem('session_token') || '' } }
  ).catch(error => {
    console.error('Archive template error:', error.response?.data || error.message);
    throw error;
  });
}

/**
 * fetchTemplates
 * GET /api/templates
 *
 * Retrieves a list of templates based on archive status.
 *
 * @param {object} options - Query options
 * @param {boolean} options.archived - If true, fetch archived templates; if false, fetch active templates
 * @param {number} options.limit - Number of templates to return
 * @param {number} options.offset - Number of templates to skip
 * @returns {Promise} - Axios promise resolving to the templates data.
 */
export async function fetchTemplates({ archived = false, limit = 10, offset = 0 } = {}) {
  try {
    const response = await axios.get('/api/templates', {
      params: { archived, limit, offset },
      headers: { Authorization: localStorage.getItem('session_token') || '' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * deleteTemplate
 * DELETE /api/templates/:id
 *
 * Permanently deletes a template. This should be used with caution,
 * prefer archiveTemplate for most cases to maintain traceability.
 *
 * @param {number} templateId - The ID of the template to delete.
 * @returns {Promise} - Axios promise resolving to the deletion confirmation.
 */
export function deleteTemplate(templateId) {
  return axios.delete(
    `/api/templates/${templateId}`,
    { headers: { Authorization: localStorage.getItem('session_token') || '' } }
  );
}

/**
 * fetchTemplateHistory
 * GET /api/templates/:id/history
 *
 * Retrieves the change history for a specific template.
 *
 * @param {number} templateId - The ID of the template.
 * @returns {Promise} - Axios promise resolving to the template's history data.
 */
export async function fetchTemplateHistory(templateId) {
  try {
    const response = await axios.get(`/api/templates/${templateId}/history`, {
      headers: { Authorization: localStorage.getItem('session_token') || '' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching template history:', error);
    throw error;
  }
}


/**
 * saveTemplate
 * POST /api/templates
 *
 * Saves a new template.
 *
 * @param {string} name - The name of the template.
 * @param {object} content - The complete JSON structure of the template.
 * @returns {Promise} - Axios promise resolving to the saved template data.
 */
export function saveTemplate(templateData) {
  return axios.post(
    '/api/templates',
    templateData,
    { headers: { Authorization: localStorage.getItem('session_token') || '' } }
  );
}

/**
 * fetchTemplateSummaries
 * GET /api/templates/summary
 *
 * Retrieves a list of template summaries for the logged-in user.
 *
 * @returns {Promise} Axios promise resolving to an array of template summaries.
 */
export async function fetchTemplateSummaries() {
  try {
    const response = await axios.get('/api/templates/summary', {
      headers: { Authorization: localStorage.getItem('session_token') || '' }
    });
    return response.data.templates;
  } catch (error) {
    console.error('Error fetching template summaries:', error);
    throw error;
  }
}

/**
 * fetchTemplateById
 * GET /api/templates/<template_id>
 *
 * Retrieves the complete template data for the given template ID.
 *
 * @param {number} templateId - The ID of the template to retrieve.
 * @returns {Promise} Axios promise resolving to the complete template data.
 */
export async function fetchTemplateById(templateId) {
  try {
    const response = await axios.get(`/api/templates/${templateId}`, {
      headers: { Authorization: localStorage.getItem('session_token') || '' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}


/**
 * fetchBookmarks
 * GET /bookmarks
 *
 * @param {string} sessionToken
 */
export async function fetchBookmarks(sessionToken) {
  console.log("[DEBUG] Fetching bookmarks from /bookmarks");

  return fetch(`${BASE_URL}/bookmarks`, {
    method: "GET",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}


/**
 * addBookmark
 * POST /api/add_bookmark
 *
 * @param {string} sessionToken
 * @param {object} payload - { url_id }
 */
export async function addBookmark(sessionToken, payload) {
  console.log("[DEBUG] Adding bookmark:", payload);
  return fetch(`${BASE_URL}/add_bookmark`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}

/**
 * removeBookmark
 * DELETE /api/bookmarks/<url_id>
 *
 * @param {string} sessionToken
 * @param {number} url_id
 */
export async function removeBookmark(sessionToken, url_id) {
  console.log("[DEBUG] Removing bookmark for url_id:", url_id);
  return fetch(`${BASE_URL}/bookmarks/${url_id}`, {
    method: "DELETE",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}


/**
 * fetchBookmarkCandidates
 * GET /api/bookmarks_candidates
 *
 * @param {string} sessionToken
 */
export async function fetchBookmarkCandidates(sessionToken) {
  console.log("[DEBUG] Fetching bookmark candidates");
  return fetch(`${BASE_URL}/bookmarks_candidates`, {
    method: "GET",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}

/**
 * confirmBookmarkCandidate
 * POST /api/confirm_bookmark_candidate
 *
 * @param {string} sessionToken
 * @param {object} payload - { original_url_id, candidate_url_id }
 */
export async function confirmBookmarkCandidate(sessionToken, payload) {
  console.log("[DEBUG] Confirming bookmark candidate:", payload);
  return fetch(`${BASE_URL}/confirm_bookmark_candidate`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}





/**
 * removeAddedPage
 * DELETE /api/added_pages/<url_id>
 *
 * @param {string} sessionToken
 * @param {number} url_id
 */
export async function removeAddedPage(sessionToken, url_id) {
  console.log("[DEBUG] Removing added page:", url_id);
  return fetch(`${BASE_URL}/added_pages/${url_id}`, {
    method: "DELETE",
    headers: getAuthHeaders(sessionToken),
  })
    .then(handleResponse)
    .catch(handleError);
}


/**
 * addPage
 * POST /api/add_page
 *
 * @param {string} sessionToken
 * @param {object} payload - { url_id }
 */
export async function addPage(sessionToken, payload) {
  console.log("[DEBUG] Adding page:", payload);
  return fetch(`${BASE_URL}/add_page`, {
    method: "POST",
    headers: getAuthHeaders(sessionToken),
    body: JSON.stringify(payload),
  })
    .then(handleResponse)
    .catch(handleError);
}



/**
 * fetchOfficeUsers
 * GET /api/office_users
 *
 * Retrieves a list of all users in the current logged-in user's office.
 *
 * @param {string} sessionToken - The current session token.
 * @returns {Promise} - Axios promise resolving to the office users data.
 */
export function fetchOfficeUsers(sessionToken) {
  return axios.get('/api/office_users', {
    headers: { Authorization: sessionToken }
  });
}

/**
 * fetchOfficeUserInteractions
 * GET /api/office_user_interactions
 *
 * Retrieves a list of user interactions for all users in the current logged-in user's office.
 * Each record includes username, title from urls_content, defensenews_url from defensenews_urls,
 * interaction_type, and interaction_time.
 *
 * @param {string} sessionToken - The current session token.
 * @returns {Promise} - Axios promise resolving to the office user interactions data.
 */
export function fetchOfficeUserInteractions(sessionToken) {
  return axios.get('/api/office_user_interactions', {
    headers: { Authorization: sessionToken }
  });
}
