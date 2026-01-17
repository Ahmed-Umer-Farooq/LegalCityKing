# API Key Security Guide

## Current Issue
The Gemini API key was compromised and reported as leaked to Google, causing the chatbot to fail.

## Immediate Fix Required
1. Get a new Gemini API key from: https://makersuite.google.com/app/apikey
2. Replace GEMINI_API_KEY in backend/.env file
3. Restart the backend server

## Security Best Practices

### 1. Environment File Security
- Never commit .env files to version control
- Add .env to .gitignore (already done)
- Use different keys for development/production

### 2. API Key Rotation
- Rotate API keys regularly (monthly recommended)
- Monitor API usage for unusual activity
- Set up usage quotas and alerts

### 3. Access Control
- Restrict API key permissions to minimum required
- Use IP restrictions if possible
- Monitor API key usage logs

### 4. Code Security
- Never hardcode API keys in source code
- Use environment variables only
- Validate API responses for security

### 5. Monitoring
- Set up alerts for API failures
- Monitor for unusual usage patterns
- Regular security audits

## Testing After Fix
Run: `node test-ai-direct.js` to verify the new key works.

## Emergency Contacts
If chatbot fails again, check:
1. API key validity
2. Google AI Studio console for alerts
3. Network connectivity
4. Rate limiting issues