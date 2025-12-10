const { createUserCase } = require('./controllers/userCaseController');

// Mock request and response
const mockReq = {
  user: { id: 1 },
  body: {
    title: 'Test Case',
    description: 'Test description',
    lawyer_name: 'Test Lawyer',
    priority: 'medium'
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('Status:', code);
      console.log('Response:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  }),
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
};

console.log('Testing controller directly...');
createUserCase(mockReq, mockRes);