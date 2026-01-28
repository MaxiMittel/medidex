from __future__ import annotations

import base64
import io
from typing import Optional

from openai import OpenAI


def encode_pdf_to_base64(pdf_bytes: bytes) -> str:
    """
    Encode PDF bytes to base64 string for native LLM upload.
    
    This allows sending the PDF directly to vision-capable models
    like Claude that can "read" PDFs natively, preserving tables
    and figures.
    
    Args:
        pdf_bytes: Raw PDF file bytes
        
    Returns:
        Base64 encoded string
    """
    return base64.b64encode(pdf_bytes).decode('utf-8')


def upload_pdf_to_openai(pdf_base64: str, filename: str = "report.pdf") -> Optional[str]:
    """
    Upload a PDF to OpenAI Files API and return the file ID.
    
    This allows referencing the file in multiple requests without
    re-uploading, significantly reducing bandwidth and cost.
    
    Args:
        pdf_base64: Base64-encoded PDF string
        filename: Name for the uploaded file
        
    Returns:
        File ID string if successful, None if upload fails
    """
    try:
        client = OpenAI()
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_file.name = filename
        
        response = client.files.create(
            file=pdf_file,
            purpose="assistants"
        )
        return response.id
    except Exception as e:
        from config import logger
        logger.error(f"Failed to upload PDF to OpenAI: {e}")
        return None
