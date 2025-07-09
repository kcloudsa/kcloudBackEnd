import request from 'supertest';
import app from '../src/app';

describe('Auth Endpoints', () => {
  test('GET /auth/providers should return available providers', async () => {
    const response = await request(app)
      .get('/auth/providers')
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Only credentials provider should be available without Google/Email env vars
    expect(response.body).toHaveProperty('credentials');
    expect(response.body.credentials).toHaveProperty('id', 'credentials');
  });

  test('POST /auth/callback/credentials should handle login attempt', async () => {
    const response = await request(app)
      .post('/auth/callback/credentials')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    // Should not error out (proper handling of invalid credentials)
    expect(response.status).not.toBe(500);
  });

  test('GET /auth/session should return session status', async () => {
    const response = await request(app)
      .get('/auth/session');
    
    // Should return valid response structure
    expect(response.status).not.toBe(500);
  });
});
