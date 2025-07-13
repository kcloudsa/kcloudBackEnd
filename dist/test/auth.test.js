"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Auth Endpoints', () => {
    test('GET /auth/providers should return available providers', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/auth/providers')
            .expect('Content-Type', /json/)
            .expect(200);
        // Only credentials provider should be available without Google/Email env vars
        expect(response.body).toHaveProperty('credentials');
        expect(response.body.credentials).toHaveProperty('id', 'credentials');
    });
    test('POST /auth/callback/credentials should handle login attempt', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/auth/callback/credentials')
            .send({
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        // Should not error out (proper handling of invalid credentials)
        expect(response.status).not.toBe(500);
    });
    test('GET /auth/session should return session status', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/auth/session');
        // Should return valid response structure
        expect(response.status).not.toBe(500);
    });
});
