<script lang="ts" setup>
import type { NavItem } from "@/data/navItems";

interface Props {
  navItems: NavItem[];
  currentPath: string;
}

const props = defineProps<Props>();

function isActive(path: string): boolean {
  return props.currentPath === path;
}
</script>

<template>
  <div>
    <nav class="navbar quartal-topnavi-override">
      <div class="container-fluid">
        <div class="d-none d-lg-flex ms-3" style="font-size: 1.3rem">
          <img
            src="https://cdn.quartal.com/img/logo/quartal-logo-q.png"
            style="height: 32px"
            alt="Logo"
            class="me-3"
          />
          <span class="text-quartal">Quartal <strong>Code</strong></span>
        </div>
        <a class="navbar-brand" href="#"></a>
      </div>
    </nav>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary px-2">
      <div class="container-fluid">
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li v-for="item in navItems" :key="item.path" class="nav-item">
              <a
                :href="item.path"
                class="nav-link"
                :class="{ active: isActive(item.path) }"
                :aria-current="isActive(item.path) ? 'page' : undefined"
              >
                {{ item.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </div>
</template>
