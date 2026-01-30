#!/bin/bash

# Test script for the search API
# This script tests the search endpoint with various queries

API_URL="http://localhost:3000/api/search"

echo "🧪 Testing KYNDO Search API"
echo "=============================="
echo ""

# Check if server is running
echo "1️⃣ Checking if backend is running..."
if ! curl -s -f "${API_URL%/search}/health" > /dev/null 2>&1; then
    echo "❌ Backend is not running at http://localhost:3000"
    echo "   Please start the backend with: cd backend && npm run dev"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Test 1: Search by title (Guacamaya)
echo "2️⃣ Test: Search by title 'Guacamaya'..."
response=$(curl -s "${API_URL}?q=Guacamaya")
count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ "$count" -gt 0 ]; then
    echo "✅ Found $count result(s)"
else
    echo "❌ No results found"
fi
echo ""

# Test 2: Search by partial match (bird)
echo "3️⃣ Test: Search by partial match 'bird'..."
response=$(curl -s "${API_URL}?q=bird")
count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ "$count" -gt 0 ]; then
    echo "✅ Found $count result(s)"
else
    echo "⚠️  No results found (descriptions may not contain 'bird')"
fi
echo ""

# Test 3: Search with special characters
echo "4️⃣ Test: Search with special characters 'Cóndor'..."
response=$(curl -s "${API_URL}?q=C%C3%B3ndor")
count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ "$count" -gt 0 ]; then
    echo "✅ Found $count result(s)"
else
    echo "❌ No results found"
fi
echo ""

# Test 4: Empty search
echo "5️⃣ Test: Empty search query..."
response=$(curl -s "${API_URL}?q=")
if echo "$response" | grep -q "error"; then
    echo "✅ Error returned as expected for empty query"
else
    echo "⚠️  No error returned for empty query"
fi
echo ""

# Test 5: Non-existent search
echo "6️⃣ Test: Search for non-existent card 'xyz123'..."
response=$(curl -s "${API_URL}?q=xyz123")
count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ "$count" -eq 0 ]; then
    echo "✅ No results found (as expected)"
else
    echo "⚠️  Found results for non-existent query"
fi
echo ""

# Test 6: Limit parameter
echo "7️⃣ Test: Search with limit parameter..."
response=$(curl -s "${API_URL}?q=a&limit=2")
count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ Returned $count result(s) with limit=2"
echo ""

echo "=============================="
echo "✨ All tests completed!"
echo ""
echo "Full search test example:"
echo "curl '${API_URL}?q=Guacamaya&limit=10'"
