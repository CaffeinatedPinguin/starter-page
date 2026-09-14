# syntax=docker/dockerfile:1.7

# Multi-stage Dockerfile for starter-page (web deployment).
# Build context MUST be the starter-page directory.
#
# Default (self-contained) build — compiles the frontend inside the image:
#   docker build -t starter-page .
#
# Reuse the single shared frontend build (CI/release): put the prebuilt dist/
# in the context and select the prebuilt target so Vite is NOT run again:
#   docker build -t starter-page --target runtime-prebuild .
#
# Run:
#   docker run --rm -p 8080:8080 starter-page

ARG NODE_VERSION=26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019

# Frontend build from source (default path only).
FROM node:${NODE_VERSION} AS build
# Node >=26 ships without corepack; install it explicitly.
# The exact pnpm version comes from packageManager in package.json.
RUN npm i -g corepack && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json vite.config.ts vitest.config.ts index.html options.html ./
COPY public ./public
COPY src ./src

RUN corepack pnpm build

# The prebuilt frontend supplied in the build context (produced once by the
# shared Vite build). Used by the runtime-prebuild target below.
FROM scratch AS prebuilt
COPY dist /dist

# Runtime on the official nginx alpine image, serving a prebuilt dist/ from the
# context — no second Vite build.
FROM nginx:alpine AS runtime-prebuild
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*
COPY --chmod=644 nginx.conf /etc/nginx/conf.d/healthz.conf
COPY --from=prebuilt --chown=101:101 /dist /usr/share/nginx/html
COPY --chmod=644 config.json /usr/share/nginx/html/config.json
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

# Default runtime: official nginx alpine serving the frontend compiled by the
# `build` stage above.
FROM nginx:alpine AS runtime
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*
COPY --chmod=644 nginx.conf /etc/nginx/conf.d/healthz.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

# Application data is a RUNTIME asset, deliberately NOT part of the frontend
# build: it is copied from the build context (not from dist/) and operators
# can replace or shadow-mount it without rebuilding the image.
COPY --chmod=644 config.json /usr/share/nginx/html/config.json

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
