// API Configuration
const API_CONFIG = {
  baseURL: 'http://10.0.2.2:8080/vtigercrm/api',
  endpoints: {
    login: '/auth/login.php',
  },
};

// API Response Types
const ResponseStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Authenticate user and get session name
 * @param {string} username - User's username
 * @param {string} accessKey - User's access key
 * @returns {Promise<{status: string, data?: Object, error?: string}>}
 */
export const login = async (username, accessKey) => {
  try {
    if (!username || !accessKey) {
      throw new Error('Username and access key are required');
    }

    console.log('Attempting login with:', { username });
    
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        accessKey: accessKey,
      }),
    });

    console.log('Server response status:', response.status);
    console.log('Full request URL:', `${API_CONFIG.baseURL}${API_CONFIG.endpoints.login}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);

      return {
        status: ResponseStatus.ERROR,
        error: errorText || 'No response from server',
        httpStatus: response.status,
      };
    }

    let data;
    try {
      data = await response.json();
      console.log('Server response data:', data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        status: ResponseStatus.ERROR,
        error: 'Invalid JSON response from server',
      };
    }

    if (!data) {
      return {
        status: ResponseStatus.ERROR,
        error: 'Invalid response from server',
      };
    }

    if (data['Auth User'] && data['Auth User'].sessionName) {
      return {
        status: ResponseStatus.SUCCESS,
        data: data,
      };
    } else {
      return {
        status: ResponseStatus.ERROR,
        error: data.error || 'Invalid credentials',
      };
    }
  } catch (error) {
    console.error('Login error:', error);

    return {
      status: ResponseStatus.ERROR,
      error: error.message || 'An error occurred during login',
    };
  }
};

// Simple function to check if login was successful
export const isSuccessResponse = (response) => {
  // If response exists and status is success, return true
  // Otherwise return false
  if (response && response.status === ResponseStatus.SUCCESS) {
    return true;
  }
  return false;
};

// Group our auth-related functions together
const AuthApi = {
  login: login,
  isSuccessResponse: isSuccessResponse
};

// Export the auth functions
export default AuthApi;