import asyncio
import os
import json
from dotenv import load_dotenv
from fastmcp import Client
from fastmcp.client.transports import SSETransport
from openai import OpenAI

load_dotenv()  # Load environment variables from .env

async def main():
    # 1) Configure the SSE Transport to point at your running MCP server:
    #    By default FastMCP(server).run(transport="sse") will expose an /sse endpoint.
    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8000")
    transport = SSETransport(url=f"{mcp_url}/sse")

    # 2) Create your Client
    client = Client(transport)

    # 3) Configure your OpenAI / Groq client
    openai_client = OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )

    async with client:
        # List available tools from the MCP server
        tools = await client.list_tools()
        print("Available tools:", tools)

        # Define the user query
        user_query = "What are the product and sum of 5 and 7? answer product first then sum"

        # Prepare the messages for the LLM
        messages = [{"role": "user", "content": user_query}]

        # Convert MCP tools to OpenAI tools format
        openai_tools = []
        for tool in tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema
                }
            })
        
        # Call the Groq API via OpenAI client
        response = openai_client.chat.completions.create(
            model="llama3-70b-8192",  # Groq's LLaMA 3 model
            messages=messages,
            tools=openai_tools,
            tool_choice="auto"
        )

        # Process the response and handle tool calls
        assistant_message = response.choices[0].message
        
        # Print text response
        if assistant_message.content:
            print("LLM:", assistant_message.content)
        
        # Handle any tool calls
        if hasattr(assistant_message, 'tool_calls') and assistant_message.tool_calls:
            for tool_call in assistant_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                
                # Execute the tool call via the MCP client
                result = await client.call_tool(tool_name, tool_args)
                print(f"Tool '{tool_name}' result:", result[0].text)

if __name__ == "__main__":
    asyncio.run(main())
