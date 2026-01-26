<script setup lang="ts">

import type { FileNode, Project, Session } from "@opencode-ai/sdk/client";
import { createOpencodeClient } from "@opencode-ai/sdk/client";
import { onMounted, ref } from "vue";

const projects = ref<Project[]>([]);
const sessions = ref<Session[]>([]);
const files = ref<FileNode[]>([]);

const client = createOpencodeClient({
  baseUrl: "https://test-opencode.salaxy.com",
  fetch: fetchWithBasicAuth,
});

function fetchWithBasicAuth(input: RequestInfo | URL, init?: RequestInit) {
  // TODO: Change password to be fetched from parent window.
  const username = "tilijukka";
  const password = "pantteri";
  return globalThis.fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
    credentials: "include",
  });
}

async function connectToOpenCode() {
  const response = await client.project.list();
  projects.value = response.data ?? [];
  const sessionResponse = await client.session.list();
  sessions.value = sessionResponse.data ?? [];
  const fileResponse = await client.file.list({
    query: {
      path: "/",
    },
  });
  files.value = fileResponse.data ?? [];
}

onMounted(() => {
  void connectToOpenCode();
});

</script>

<template>
  <div>
    <h1>Open Code Status</h1>
    <h1>Projects</h1>
      <ul>
        <li v-for="project in projects" :key="project.id">{{ project.worktree }}</li>
      </ul>
      <h1>Sessions</h1>
      <ul>  
        <li v-for="session in sessions" :key="session.id">{{ session.title }} ({{ session.directory }}) <small>{{ session.id }}, parent: {{ session.parentID ?? "-" }}</small></li>
      </ul>
      <h1>Files</h1>
      <ul>
        <li v-for="file in files" :key="file.path">{{ file.path }} <small>{{ file.type }}</small> <pre>{{ JSON.stringify(file, null, 2) }}</pre></li>
      </ul>
  </div>
</template>