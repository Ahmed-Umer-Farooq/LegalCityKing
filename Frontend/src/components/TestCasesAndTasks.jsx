import React, { useState, useEffect } from 'react';

const TestCasesAndTasks = () => {
  const [authStatus, setAuthStatus] = useState('checking');
  const [apiResults, setApiResults] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    testAuthentication();
  }, []);

  const testAuthentication = async () => {
    try {
      // Check localStorage
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('Token exists:', !!token);
      console.log('User exists:', !!user);

      if (!token) {
        setAuthStatus('no-token');
        return;
      }

      // Test API endpoints
      const results = {};
      
      // Test cases endpoint
      try {
        const casesResponse = await fetch('http://localhost:5001/api/user/cases', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        results.cases = {
          status: casesResponse.status,
          ok: casesResponse.ok
        };
        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          results.cases.data = casesData;
        }
      } catch (err) {
        results.cases = { error: err.message };
      }

      // Test tasks endpoint
      try {
        const tasksResponse = await fetch('http://localhost:5001/api/user/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        results.tasks = {
          status: tasksResponse.status,
          ok: tasksResponse.ok
        };
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          results.tasks.data = tasksData;
        }
      } catch (err) {
        results.tasks = { error: err.message };
      }

      setApiResults(results);
      setAuthStatus('tested');

    } catch (error) {
      setError(error.message);
      setAuthStatus('error');
    }
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cases & Tasks Debug Tool</h1>
      
      <div className="space-y-4">
        {/* Auth Status */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Authentication Status</h2>
          {authStatus === 'checking' && <p>Checking authentication...</p>}
          {authStatus === 'no-token' && (
            <div>
              <p className="text-red-600">❌ No authentication token found</p>
              <button 
                onClick={handleLogin}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          )}
          {authStatus === 'error' && <p className="text-red-600">❌ Error: {error}</p>}
          {authStatus === 'tested' && <p className="text-green-600">✅ Authentication test completed</p>}
        </div>

        {/* API Results */}
        {authStatus === 'tested' && (
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-2">API Test Results</h2>
            
            {/* Cases */}
            <div className="mb-4">
              <h3 className="font-medium">Cases Endpoint:</h3>
              {apiResults.cases?.error ? (
                <p className="text-red-600">❌ Error: {apiResults.cases.error}</p>
              ) : (
                <div>
                  <p>Status: {apiResults.cases?.status}</p>
                  <p>Success: {apiResults.cases?.ok ? '✅' : '❌'}</p>
                  {apiResults.cases?.data && (
                    <p>Cases found: {apiResults.cases.data.data?.length || 0}</p>
                  )}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="mb-4">
              <h3 className="font-medium">Tasks Endpoint:</h3>
              {apiResults.tasks?.error ? (
                <p className="text-red-600">❌ Error: {apiResults.tasks.error}</p>
              ) : (
                <div>
                  <p>Status: {apiResults.tasks?.status}</p>
                  <p>Success: {apiResults.tasks?.ok ? '✅' : '❌'}</p>
                  {apiResults.tasks?.data && (
                    <p>Tasks found: {apiResults.tasks.data.data?.length || 0}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Solutions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Common Solutions</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>If no token: Log in again at /login</li>
            <li>If 401 error: Token expired, log in again</li>
            <li>If 403 error: User lacks permissions, check RBAC setup</li>
            <li>If 500 error: Backend issue, check server logs</li>
            <li>If network error: Check if backend is running on port 5001</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Quick Actions</h2>
          <div className="space-x-2">
            <button 
              onClick={testAuthentication}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retest
            </button>
            <button 
              onClick={() => window.location.href = '/user/legal-cases'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Cases
            </button>
            <button 
              onClick={() => window.location.href = '/user/legal-tasks'}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Go to Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCasesAndTasks;