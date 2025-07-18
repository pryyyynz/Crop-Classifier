import os
import logging
from typing import Dict, Optional
from groq import Groq
import json

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        """Initialize LLM service with Groq API"""
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.model = "llama-3.3-70b-versatile"

        if not os.getenv("GROQ_API_KEY"):
            logger.warning(
                "GROQ_API_KEY not found in environment variables. LLM features will be disabled.")
            self.client = None

    async def generate_disease_advice(
        self,
        crop_type: str,
        predicted_disease: str,
        confidence: float,
        is_healthy: bool,
        base_description: str,
        user_question: Optional[str] = None,
        user_notes: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate comprehensive disease advice using Groq LLM

        Args:
            crop_type: Type of crop (cashew, cassava, maize, tomato)
            predicted_disease: Predicted disease name
            confidence: Confidence score (0-100)
            is_healthy: Whether plant is healthy
            base_description: Basic disease description from classification service
            user_question: Optional question from user
            user_notes: Optional notes about the plant/image

        Returns:
            Dictionary containing structured advice
        """

        if not self.client:
            return self._fallback_response(predicted_disease, base_description)

        try:
            prompt = self._build_prompt(
                crop_type, predicted_disease, confidence, is_healthy,
                base_description, user_question, user_notes
            )

            response = await self._call_groq_api(prompt)
            parsed_response = self._parse_response(response)

            return parsed_response

        except Exception as e:
            logger.error(f"Error generating LLM advice: {str(e)}")
            return self._fallback_response(predicted_disease, base_description)

    def _build_prompt(
        self,
        crop_type: str,
        predicted_disease: str,
        confidence: float,
        is_healthy: bool,
        base_description: str,
        user_question: Optional[str],
        user_notes: Optional[str]
    ) -> str:
        """Build comprehensive prompt for the LLM"""

        health_context = "healthy" if is_healthy else "diseased"

        # Build the base prompt
        prompt_parts = [
            "You are an expert agricultural advisor specializing in crop diseases in Ghana and West Africa. A farmer has submitted an image for disease analysis.",
            "",
            "ANALYSIS RESULTS:",
            f"- Crop Type: {crop_type.title()}",
            f"- Detected Disease/Condition: {predicted_disease.replace('_', ' ').title()}",
            f"- Confidence Level: {confidence:.1f}%",
            f"- Plant Status: {health_context.title()}",
            f"- Basic Analysis: {base_description}",
            ""
        ]

        # Add optional farmer context
        if user_notes:
            prompt_parts.extend([
                f"FARMER'S NOTES ABOUT THE PLANT: {user_notes}",
                ""
            ])

        if user_question:
            prompt_parts.extend([
                f"FARMER'S SPECIFIC QUESTION: {user_question}",
                ""
            ])

        # Add the instruction section
        prompt_parts.extend([
            "Please provide comprehensive advice in the following structured format. Be practical, actionable, and considerate of small-scale farming conditions in Ghana:",
            "",
            "**CAUSES:**",
            "[Explain what typically causes this condition/disease, including environmental factors, pests, fungi, bacteria, or cultural practices]",
            "",
            "**IMMEDIATE_ACTIONS:**",
            "[List 3-5 immediate steps the farmer should take within the next few days]",
            "",
            "**PREVENTION:**",
            "[Describe preventive measures for future growing seasons]",
            "",
            "**TREATMENT:**",
            "[Recommend specific treatments, including organic and chemical options with local availability in mind]",
            "",
            "**MONITORING:**",
            "[Explain what signs to watch for and how often to check the plants]",
            ""
        ])

        # Add question answer section if there's a user question
        if user_question:
            prompt_parts.extend([
                "**QUESTION_ANSWER:**",
                "[Directly address the farmer's specific question]",
                ""
            ])

        # Add final instruction
        prompt_parts.append("Keep advice practical for small-scale farmers with limited resources. Mention both organic and conventional treatment options. Use simple, clear language.")

        return "\n".join(prompt_parts)

    async def _call_groq_api(self, prompt: str) -> str:
        """Call Groq API with the constructed prompt"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model,
                temperature=0.7,
                max_tokens=1000,
                top_p=1,
                stop=None,
                stream=False,
            )

            return chat_completion.choices[0].message.content

        except Exception as e:
            logger.error(f"Groq API call failed: {str(e)}")
            raise

    def _parse_response(self, response: str) -> Dict[str, str]:
        """Parse the LLM response into structured sections"""
        sections = {
            "causes": "",
            "immediate_actions": "",
            "prevention": "",
            "treatment": "",
            "monitoring": "",
            "question_answer": ""
        }

        # Split response by sections
        lines = response.split('\n')
        current_section = None

        for line in lines:
            line = line.strip()

            # Check for section headers
            if "**CAUSES:**" in line:
                current_section = "causes"
                continue
            elif "**IMMEDIATE_ACTIONS:**" in line:
                current_section = "immediate_actions"
                continue
            elif "**PREVENTION:**" in line:
                current_section = "prevention"
                continue
            elif "**TREATMENT:**" in line:
                current_section = "treatment"
                continue
            elif "**MONITORING:**" in line:
                current_section = "monitoring"
                continue
            elif "**QUESTION_ANSWER:**" in line:
                current_section = "question_answer"
                continue

            # Add content to current section
            if current_section and line and not line.startswith("**"):
                sections[current_section] += line + " "

        # Clean up sections
        return {k: v.strip() for k, v in sections.items() if v.strip()}

    def _fallback_response(self, disease_name: str, base_description: str) -> Dict[str, str]:
        """Provide fallback response when LLM is unavailable"""
        return {
            "causes": f"Multiple factors can contribute to {disease_name.replace('_', ' ')}. Common causes include environmental stress, improper care, or pathogen infection.",
            "immediate_actions": base_description,
            "prevention": "Practice good crop hygiene, ensure proper spacing, and monitor plants regularly.",
            "treatment": "Consult with local agricultural extension officers for specific treatment recommendations.",
            "monitoring": "Check plants weekly for any changes in symptoms or new affected areas."
        }

    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return self.client is not None
