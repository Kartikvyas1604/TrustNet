/**
 * TrustNet Backend API - Main Entry Point
 * 
 * This is a clean entry point that delegates to the server module.
 * All application logic, routing, and initialization is in separate modules.
 */

import { startServer } from './server';

// Start the server
startServer();
