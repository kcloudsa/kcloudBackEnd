#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('🚀 Starting K.Cloud Auth Server...\n');
// Import and start the server
const app_1 = __importDefault(require("./src/app"));
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoints available at:`);
    console.log(`   • GET  /auth/providers - List available auth providers`);
    console.log(`   • GET  /auth/session  - Get current session`);
    console.log(`   • POST /auth/signin   - Sign in with credentials`);
    console.log(`   • POST /auth/signout  - Sign out`);
    console.log(`\n📋 Available auth providers: credentials`);
    if (process.env.AUTH_GOOGLE_ID) {
        console.log(`   • Google OAuth enabled ✅`);
    }
    else {
        console.log(`   • Google OAuth disabled (missing AUTH_GOOGLE_ID)`);
    }
    if (process.env.EMAIL_SERVER_HOST) {
        console.log(`   • Email Magic Links enabled ✅`);
    }
    else {
        console.log(`   • Email Magic Links disabled (missing EMAIL_SERVER_HOST)`);
    }
    console.log('\n🔧 Add missing environment variables to enable more providers');
});
