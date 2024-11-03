# Dockerfile for db service
FROM postgres:13
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*
