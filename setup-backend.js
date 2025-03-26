/**
 * Backend Setup Script
 * 
 * Run this script with Node.js to set up the backend dependencies and environment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up AI EduCraft Portal backend...');

// Create .env file if it doesn't exist
if (!fs.existsSync('.env')) {
  console.log('Creating .env file from .env.example...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('.env file created successfully.');
  } else {
    console.log('Warning: .env.example file not found. Please create a .env file manually.');
  }
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  console.log('Creating uploads directory...');
  fs.mkdirSync('uploads');
  console.log('Uploads directory created successfully.');
}

// Install backend dependencies
try {
  console.log('Installing backend dependencies...');
  execSync('cd api && npm install', { stdio: 'inherit' });
  console.log('Backend dependencies installed successfully.');
} catch (error) {
  console.error('Error installing backend dependencies:', error.message);
  process.exit(1);
}

console.log('\nBackend setup completed!');
console.log('\nNext steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Start the backend server: cd api && npm run dev');
console.log('3. Start the frontend: npm run dev'); 