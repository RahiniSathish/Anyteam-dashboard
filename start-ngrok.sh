#!/bin/bash

# Start ngrok and display the public URL
# Usage: ./start-ngrok.sh

echo "🚀 Starting ngrok tunnel to localhost:3000..."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Warning: Server doesn't seem to be running on port 3000"
    echo "   Please start the server first with: npm start"
    echo ""
fi

# Start ngrok in background
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null)

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Failed to get ngrok URL. Make sure ngrok is installed."
    echo "   Install with: brew install ngrok/ngrok/ngrok"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok is running!"
echo ""
echo "📊 Your dashboard is live at:"
echo "   $PUBLIC_URL"
echo ""
echo "🔗 Share this URL with your team!"
echo ""
echo "📝 ngrok web interface: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop ngrok"
echo ""

# Keep script running
wait $NGROK_PID

