const fetch = require('node-fetch');
const FormData = require('form-data');
const mongoose = require('mongoose');

async function test() {
  const res = await fetch('http://localhost:5000/api/employees');
  // Need to authenticate or just bypass auth for local test? 
  // Let's just create a small Express server to see what multer gives for PUT requests.
}
test();
