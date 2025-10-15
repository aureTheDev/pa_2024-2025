FROM python:latest

WORKDIR /app

COPY ./app/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./app/ .

RUN mkdir "uploads"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
