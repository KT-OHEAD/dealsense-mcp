#!/bin/bash

echo "=== DealSense MCP 테스트 시나리오 ==="
echo ""

# MCP 프로토콜은 JSON-RPC를 사용하므로, 간단한 테스트를 위해
# 도구 목록을 먼저 확인합니다

echo "1. 도구 목록 조회"
echo "----------------"

curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }' | jq '.' 2>/dev/null || echo "jq가 설치되지 않았습니다. JSON이 출력됩니다."

echo ""
echo ""
echo "2. 핫딜 top 10 조회 (24시간)"
echo "----------------------------"

curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "deals.hot10",
      "arguments": {
        "window": "24h",
        "sort": "popularity"
      }
    }
  }' | jq '.result.content[0].text | fromjson' 2>/dev/null | head -30

echo ""
echo ""
echo "=== 테스트 완료 ==="
echo ""
echo "💡 MCP Inspector를 사용하려면:"
echo "   npm install -g @modelcontextprotocol/inspector"
echo "   mcp-inspector http://localhost:3000/mcp"
