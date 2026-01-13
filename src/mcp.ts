import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { interestsUpsertTool, interestsListTool, interestsDeleteTool } from './tools/interests.js';
import { dealsHot10Tool, dealsByInterestsTool, dealsGetTool } from './tools/deals.js';
import { dealsVerifyTool } from './tools/verify.js';

export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'dealsense-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools
  const tools = [
    interestsUpsertTool,
    interestsListTool,
    interestsDeleteTool,
    dealsHot10Tool,
    dealsByInterestsTool,
    dealsGetTool,
    dealsVerifyTool,
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const tool = tools.find((t) => t.name === request.params.name);

    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    try {
      const result = await tool.handler(request.params.arguments as any || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export function createTransport(): StreamableHTTPServerTransport {
  return new StreamableHTTPServerTransport();
}
