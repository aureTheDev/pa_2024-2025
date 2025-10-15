FROM node:18-alpine

ARG NEXT_PUBLIC_API_URL_ARG
ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY_ARG

ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=${NEXT_PUBLIC_STRIPE_PUBLIC_KEY_ARG}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL_ARG}



WORKDIR /app


COPY ./frontend/package.json ./frontend/package-lock.json* ./


RUN npm ci

COPY ./frontend .

RUN npm run build

CMD ["npm", "run", "start"]
