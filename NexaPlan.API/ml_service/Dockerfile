# Use the official Python slim image specified by runtime.txt
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the ML service application files (including PKL model files)
COPY . .

# Expose port (FastAPI default is 8000)
EXPOSE 8000

# Support dynamic port assignment for cloud platforms like Render, default to 8000
ENV PORT=8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
