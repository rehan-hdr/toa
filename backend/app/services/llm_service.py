"""
LLM service using Ollama (tinyllama)
"""
import ollama
import json
import re
from typing import Dict, Tuple
from app.prompts import SYSTEM_PROMPT, build_prompt


class LLMService:
    """Service for interacting with local LLM via Ollama"""
    
    def __init__(self, model: str = "tinyllama"):
        self.model = model
        print(f"🤖 LLM Service initialized with model: {model}")
    
    def query(
        self,
        user_message: str,
        context: list[str] = None
    ) -> Tuple[Dict, str]:
        """
        Query the LLM and parse response
        
        Returns:
            Tuple of (parsed_json, assistant_reply)
        """
        # Build the full prompt
        full_prompt = build_prompt(user_message, context)
        
        # Combine system prompt and user prompt
        complete_prompt = f"{SYSTEM_PROMPT}\n\n{full_prompt}"
        
        try:
            # Query Ollama
            response = ollama.generate(
                model=self.model,
                prompt=complete_prompt,
                options={
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            )
            
            output = response['response']
            
            # Parse the output
            parsed_json, assistant_reply = self._parse_output(output)
            
            return parsed_json, assistant_reply
            
        except Exception as e:
            print(f"❌ LLM Error: {e}")
            # Return fallback response
            return self._fallback_response(user_message), "I've noted that down."
    
    def _parse_output(self, output: str) -> Tuple[Dict, str]:
        """
        Parse LLM output into JSON and reply text
        Expected format:
        <JSON>
        <blank line>
        <assistant short reply>
        """
        try:
            # Try to find JSON block
            json_match = re.search(r'\{[\s\S]*\}', output)
            
            if json_match:
                json_str = json_match.group(0)
                parsed_json = json.loads(json_str)
                
                # Extract reply text (everything after the JSON)
                reply_start = json_match.end()
                reply = output[reply_start:].strip()
                
                # If no reply found, use a default
                if not reply:
                    reply = "Got it!"
                
                return parsed_json, reply
            else:
                # No JSON found, return fallback
                raise ValueError("No JSON found in output")
                
        except Exception as e:
            print(f"⚠️  Parse error: {e}")
            print(f"Output was: {output[:200]}...")
            # Return fallback
            return self._fallback_response(""), output[:200] if len(output) > 0 else "Noted."
    
    def _fallback_response(self, user_message: str) -> Dict:
        """Generate a fallback response when LLM fails"""
        # Simple keyword-based categorization
        lower_msg = user_message.lower()
        
        category = "note"
        if any(word in lower_msg for word in ["need to", "have to", "must", "should", "todo"]):
            category = "task"
        elif any(word in lower_msg for word in ["feel", "felt", "today was", "i'm"]):
            category = "journal"
        elif any(word in lower_msg for word in ["idea:", "what if", "maybe we could"]):
            category = "idea"
        elif "?" in user_message:
            category = "question"
        
        return {
            "category": category,
            "summary": user_message[:100] + ("..." if len(user_message) > 100 else ""),
            "task": None,
            "mood": None
        }


# Singleton instance
_llm_service = None


def get_llm_service() -> LLMService:
    """Get or create LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
