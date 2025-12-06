import json
import httpx
from app.core.config import settings
from loguru import logger

async def generate_response(prompt: str, system_prompt: str = None) -> dict:
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    data = {
        "model": settings.LLM_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    if system_prompt:
        data["system"] = system_prompt
        
    try:
        async with httpx.AsyncClient() as client:
            logger.debug(f"Sending request to Ollama: {data}")
            response = await client.post(url, json=data, timeout=60.0)
            response.raise_for_status()
            result = response.json()
            logger.debug(f"Ollama response: {result}")
            try:
                # Llama 3.2 might return valid JSON inside a string or just JSON
                # The 'response' field in Ollama output is the text content
                content = result["response"]
                # Attempt to find JSON if wrapped in markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                # Regex fallback to find the first JSON object {}
                import re
                json_match = re.search(r"\{.*\}", content, re.DOTALL)
                if json_match:
                     content = json_match.group(0)

                return json.loads(content)
            except (json.JSONDecodeError, Exception) as e:
                logger.error(f"Failed to parse JSON from LLM response: {result['response']} | Error: {e}")
                # Fallback structure
                return {
                    "category": "chat",
                    "reply": result["response"],
                    "summary": "Generated response (Parsing Failed)"
                }
    except Exception as e:
        logger.error(f"Error calling Ollama: {e}")
        raise e
