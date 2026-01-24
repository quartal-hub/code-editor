import { JSX, useEffect, useState } from "react";

import type { FileNode, Project, Session } from "@opencode-ai/sdk/client";
import { createOpencodeClient } from "@opencode-ai/sdk/client";


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

function SkinEditor(): JSX.Element {

  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions] = useState<Session[]>([]);
  const [files] = useState<FileNode[]>([]);

  const client = createOpencodeClient({
    baseUrl: "https://test-opencode.salaxy.com",
    fetch: fetchWithBasicAuth,
  })

  useEffect(() => {
    client.project.list().then((response) => {
      setProjects(response.data ?? []);
    });
    /*
    client.session.list().then((response) => {
      setSessions(response.data ?? []);
    });
    client.file.list({
      query: {
        path: "/",
      },
    }).then((response) => {
      setFiles(response.data ?? []);
    });
    */
  }, [client]);

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.worktree}</li>
        ))}
      </ul>
      <h1>Sessions</h1>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>{session.title} ({session.directory})
          <div><small>{session.id}, parent: {session.parentID ?? "-"}</small></div>
          </li>
        ))}
      </ul>
      <h1>Files</h1>
      <ul>
        {files.map((file) => (
          <li key={file.path}>{file.path} <small>{file.type}</small> <pre>{JSON.stringify(file, null, 2)}</pre></li>
        ))}
      </ul>
    </div>
  );
}

export default SkinEditor;
