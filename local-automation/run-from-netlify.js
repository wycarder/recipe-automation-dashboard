#!/usr/bin/env node

/**
 * Simple script to run automation with websites selected from Netlify frontend
 * 
 * Usage:
 * 1. Go to https://boisterous-toffee-d95f57.netlify.app
 * 2. Select the websites you want to process
 * 3. Copy the website data (JSON format)
 * 4. Run: node run-from-netlify.js "PASTE_JSON_HERE"
 */

const LocalAutomationService = require('./local-automation');
require('dotenv').config();

async function runFromNetlify() {
  // Get websites from command line argument
  const websitesJson = process.argv[2];
  
  if (!websitesJson) {
    console.log('❌ Please provide website data from your Netlify frontend');
    console.log('');
    console.log('📋 How to use:');
    console.log('1. Go to https://boisterous-toffee-d95f57.netlify.app');
    console.log('2. Select the websites you want to process');
    console.log('3. Copy the website data (it will be in JSON format)');
    console.log('4. Run: node run-from-netlify.js "PASTE_JSON_HERE"');
    console.log('');
    console.log('💡 Example:');
    console.log('node run-from-netlify.js \'[{"domain":"airfryerauthority.com","name":"Air Fryer Authority","keyword":"air fryer recipes","quota":30,"active":true}]\'');
    process.exit(1);
  }

  let websites;
  try {
    websites = JSON.parse(websitesJson);
  } catch (error) {
    console.log('❌ Invalid JSON format. Please copy the exact website data from your Netlify frontend.');
    console.log('Error:', error.message);
    process.exit(1);
  }

  if (!Array.isArray(websites) || websites.length === 0) {
    console.log('❌ Please provide an array of websites to process.');
    process.exit(1);
  }

  console.log(`🚀 Starting automation for ${websites.length} websites selected from Netlify frontend...`);
  console.log('');
  
  // Show which websites will be processed
  websites.forEach((site, index) => {
    console.log(`   ${index + 1}. ${site.name} (${site.domain}) - "${site.keyword}"`);
  });
  console.log('');

  try {
    const automationService = new LocalAutomationService();
    await automationService.runAutomation(websites);
    console.log('');
    console.log('🎉 All done! Check your Notion database for the new recipes.');
  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    process.exit(1);
  }
}

runFromNetlify();
