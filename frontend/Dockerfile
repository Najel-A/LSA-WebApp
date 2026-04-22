FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build-time env for Vite. Use same-origin API by default in containers.
ARG VITE_API_BASE_URL=
ARG VITE_NEXUSTRACE_ANALYZE_URL=
ARG VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_NEXUSTRACE_ANALYZE_URL=$VITE_NEXUSTRACE_ANALYZE_URL
ENV VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS=$VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

